# Deploying Dr. Plant

```
Browser ──> Netlify (React)  ──HTTPS──>  API (.NET, Docker)  ──>  MySQL
                                              │
                                              ├──>  Model service (Python/TensorFlow, Docker)
                                              ├──>  Cloudinary (images)
                                              └──>  Claude API (optional fallback)
```

Three things to host: the **frontend** (already on Netlify), the **API + MySQL**, and the **model service**.
The model service needs roughly 1.5–2 GB of RAM (TensorFlow), so pick a plan that fits; the API itself is small.
Any host that runs Docker works (Railway, Render, Fly.io, a VPS, Azure Container Apps...).

## 0. Before the first deploy

- [ ] Decide where images live (section 3b). If you stay on Cloudinary, rotate its secret (the old one was in git history).
- [ ] Generate secrets: `openssl rand -base64 48` (JWT) and `openssl rand -hex 32` (model key).
- [ ] Put `best_model.keras` somewhere the model image can get it (see "Model weights").

## 1. Run everything locally with Docker

```bash
cp .env.example .env        # fill it in
# put best_model.keras in AI-model/
docker compose up -d --build
curl http://localhost:8080/health        # {"status":"ok"}
```

On the first start the API applies the database migrations, creates the admin account from
`ADMIN_EMAIL` / `ADMIN_PASSWORD`, and loads the 83 diseases and 24 crops. All three steps are
skipped when already done, so restarts are safe.

## 2. Production settings (environment variables)

Set these on the API service (the `:` in a setting name becomes `__`):

| Variable | Value |
|---|---|
| `ConnectionStrings__DefaultConnection` | `Server=HOST;Port=3306;Database=doctorplant;User=...;Password=...;SslMode=Required;` |
| `Jwt__Key` | 64+ random characters |
| `Storage__Provider` | `Cloudinary` (default) or `Local` (images on the server disk, see 3b) |
| `Storage__LocalPath`, `Storage__PublicBaseUrl` | only for `Local`: folder on a persistent volume, and the public address of the API |
| `Cloudinary__CloudName`, `__ApiKey`, `__ApiSecret` | only for `Cloudinary`: from the Cloudinary console |
| `FlaskApi__BaseUrl` | internal URL of the model service, e.g. `http://model:5000` |
| `FlaskApi__ApiKey` | same value as `MODEL_API_KEY` on the model service |
| `AllowedOrigins__0` | `https://dr-plant.netlify.app` (add `AllowedOrigins__1` for a custom domain) |
| `Database__AutoMigrate` | `true` |
| `Admin__Email`, `Admin__Password` | first admin account (10+ chars); can be removed after first start |
| `Email__SmtpHost`, `__SmtpPort`, `__SmtpUsername`, `__SmtpPassword`, `__FromAddress` | SMTP service used to send password-reset links. **Required for "Forgot password" to work in production** |
| `Frontend__BaseUrl` | public URL of the site, used in the emailed reset link (defaults to the first `AllowedOrigins` entry) |
| `Claude__ApiKey` | optional, enables the AI fallback |

Model service: `MODEL_API_KEY`, and the weights (below). Keep it on a private network, not on the internet.
The API is the only thing that should be public. It listens on port **8080** and serves `/health`.
TLS is expected to be terminated by the platform. The Docker image sets `ForwardedHeaders__TrustAll=true` so the API reads the
real client IP from `X-Forwarded-For` (needed for the per-IP rate limits); only expose the container through the platform's proxy.

### Model weights

Weights are not in git. Either:
- build with a download URL (for example a GitHub Release asset):
  `docker build --build-arg MODEL_URL=https://.../best_model.keras -t drplant-model AI-model`, or
- mount the file as a volume at `/app/best_model.keras` (what `docker-compose.yml` does).

## 3. Frontend (Netlify)

`Frontend/DrPlant/netlify.toml` already has the build command, SPA redirect and security headers.
**Set `VITE_API_URL` in Netlify → Site settings → Environment variables** (e.g. `https://api.yourdomain.com/api`)
**before deploying this version.** The code no longer falls back to the old ngrok tunnel, and a build without the
variable fails at runtime with a clear message.

## 3b. Where images are stored

Photos (diagnoses, posts, crops) go through one storage layer with two providers:

| | Cloudinary (default) | Local disk (`Storage__Provider=Local`) |
|---|---|---|
| Third-party account / keys | needed | none |
| Cost | free tier, then paid by usage | the server's disk |
| Survives redeploys | yes | **only on a persistent volume** (`Storage__LocalPath`) |
| Backups | handled by the service | **you** back up the folder together with the database |
| Speed for visitors far from the server | CDN | served by your API |
| Works on hosts with ephemeral disk (many PaaS free plans) | yes | no, unless a volume is attached |

Local storage re-encodes every upload as a JPEG (strips GPS/EXIF, refuses files that are not images) and names files randomly.
It suits a single VPS or the `docker-compose.yml` setup, which already mounts a volume. Other S3-compatible storage
(Cloudflare R2, Backblaze B2) would need one more provider class behind the same interface.

Existing images keep their stored URLs: switching the provider does not move old photos.

`Backend/tools/cloudinary_images.py` backs up and moves images (run from the repository root; reads the Cloudinary
credentials from the API's user-secrets):

- `backup`: downloads every image referenced by the database into `backups/images/` (git-ignored), verifies each one and
  writes a checksum manifest. Read-only. Run it regularly, together with a database dump.
- `migrate`: copies images that live on a different Cloudinary account into the project's own, checks every copy byte for
  byte, and only then updates the database row. Nothing is deleted. (It was used once to move the 24 crop pictures that
  originally lived on someone else's account.)
- `seed`: rewrites the crop picture URLs in `Seed/reference_data.sql` after a migration.

## 4. Database

- Use a managed MySQL with automatic daily backups (and test a restore once).
- Schema changes are EF Core migrations (`Backend/DoctorPlantTest.DAL/Migrations`). Create one with
  `dotnet ef migrations add Name --project DoctorPlantTest.DAL --startup-project DoctorPlantTest.API`;
  it is applied on the next start when `Database__AutoMigrate=true`.
- **Existing database** (built from the old SQL dump, tables already there): keep `Database__AutoMigrate=false`,
  or mark the baseline as applied once so EF doesn't try to recreate the tables:
  ```sql
  DELETE FROM __EFMigrationsHistory;
  INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20261112211838_InitialCreate', '8.0.2');
  ```
  Old and new schemas differ only in nullability of a few text columns; the code works with both.
- On Linux hosts MySQL table names are case-sensitive. The migration creates `Users`, `Crops`, `Diseases`, ...
  (and `cropdetails`) and the code uses the same names.

## 5. Monitoring

- Uptime: point UptimeRobot (or similar) at `https://api.yourdomain.com/health`, alert by email.
- Logs: every diagnosis logs user id, source (`local`/`ai`), confidence and outcome. Errors include full detail in the
  server log only (clients get a generic message).
- Cost control for the AI fallback: `imagediagnoses.Status` is stored as `<status>/<source>`, so
  `SELECT COUNT(*) ... WHERE Status LIKE '%/ai'` shows how many diagnoses used the paid API.

## 6. Checklist

- [ ] `https://api.yourdomain.com/health` returns ok
- [ ] Netlify has `VITE_API_URL`; the site loads data and login works from the real domain (CORS)
- [ ] Admin login works and `/admin` opens; a normal user gets 403 on admin actions
- [ ] A test diagnosis returns a result and the image appears in Cloudinary
- [ ] Backups enabled on the database
- [ ] Nothing secret in git: `git grep -i "secret\|password"` shows only placeholders
