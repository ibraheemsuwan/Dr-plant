# Dr. Plant

Photograph a plant leaf, get a diagnosis and treatment advice. Also: community blog, weather, seasonal crop guides.
Arabic and English.

```
React (Vite)  ──>  .NET 8 API  ──>  MySQL
 Netlify             │
                     ├──>  Python model service (EfficientNetB3, 130 classes)
                     ├──>  Claude vision (optional second opinion)
                     └──>  Cloudinary or local disk (images)
```

| Folder | What |
|---|---|
| `Frontend/DrPlant` | React 19 + Vite + Tailwind site |
| `Backend` | ASP.NET Core API (`API` / `BLL` / `DAL`) and its tests |
| `AI-model` | Flask service around the Keras model, and the evaluation tool |
| `docs` | model improvement plan, image credits |
| `DEPLOYMENT.md` | hosting, environment variables, backups, launch checklist |

## Run it locally

Needs: .NET 8 SDK, Node 22, Python 3.11 with `pip install -r AI-model/requirements.txt`, MySQL (XAMPP is fine).
The model weights (`AI-model/best_model.keras`) are not in git: get them from the team.

```bash
# 1. database: create an empty "doctorplant" MySQL database, then let the API build it
cd Backend/DoctorPlantTest.API
dotnet user-secrets set "Jwt:Key" "$(openssl rand -base64 48)"
dotnet user-secrets set "Cloudinary:CloudName" "<name>"      # or use local storage, see DEPLOYMENT.md
dotnet user-secrets set "Cloudinary:ApiKey" "<key>"
dotnet user-secrets set "Cloudinary:ApiSecret" "<secret>"
dotnet user-secrets set "Admin:Email" "you@example.com"      # first admin, created on first start
dotnet user-secrets set "Admin:Password" "a-long-password"
Database__AutoMigrate=true dotnet run --no-launch-profile     # http://localhost:5274 (loads crops and diseases too)

# 2. the model service (new terminal)
cd AI-model && python API.py                                   # http://127.0.0.1:5000

# 3. the website (new terminal)
cd Frontend/DrPlant && npm ci && npm run dev                   # http://localhost:5173
```

The site talks to `http://localhost:5274/api` by default in development; set `VITE_API_URL` otherwise.
Without a Claude key the diagnosis runs on the local model only. Everything else works.

## Tests

```bash
cd Backend && dotnet test DoctorPlantTest.Tests     # API, permissions, diagnosis logic, paging, uploads (no secrets needed)
cd Frontend/DrPlant && npm test                     # language, 404/error pages, blog feed mapping
```

GitHub Actions runs both on every push, plus typecheck, lint and a production build.

## Things to know

- **Diagnoses are guidance.** The local model is a closed set of 130 classes and can be confidently wrong on plants or
  diseases it never saw. Mitigations: the user can pick the plant (restricts the model), an optional Claude second opinion on
  every photo, an "uncertain" answer instead of a guess. See `docs/MODEL_IMPROVEMENT_PLAN.md` for the measured accuracy and the plan.
- **Secrets never go in git.** Local: `dotnet user-secrets`. Production: environment variables (see `DEPLOYMENT.md`).
- **Images**: Cloudinary by default, or the server's disk (`Storage__Provider=Local`). `Backend/tools/cloudinary_images.py`
  backs up and moves images; run its `backup` command regularly together with a database dump.
- Admin lists (users, contact messages, all diagnoses) are not paged yet; fine for hundreds of rows, page them before thousands.
