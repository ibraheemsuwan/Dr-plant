# Dr. Plant — Backend setup

Secrets are **not** stored in the repo. Each developer sets them locally with .NET User Secrets
(stored under `%APPDATA%\Microsoft\UserSecrets\`, outside the project folder).

## Local development

```bash
cd Backend/DoctorPlantTest.API

# JWT signing key (any random string, at least 32 bytes)
dotnet user-secrets set "Jwt:Key" "$(openssl rand -base64 48)"

# Cloudinary (ask the team lead for the values)
dotnet user-secrets set "Cloudinary:CloudName" "<cloud-name>"
dotnet user-secrets set "Cloudinary:ApiKey"    "<api-key>"
dotnet user-secrets set "Cloudinary:ApiSecret" "<api-secret>"

dotnet user-secrets list   # verify
dotnet run
```

The local MySQL connection string and Flask URL are in `appsettings.Development.json`.
If any required secret is missing, the app stops at startup and names the missing key.

## Production

Set the same keys as environment variables (`:` becomes `__`):

| Environment variable                   | Example                                        |
|----------------------------------------|------------------------------------------------|
| `Jwt__Key`                             | long random string                             |
| `ConnectionStrings__DefaultConnection` | `Server=...;Database=doctorplant;User=...;Password=...;` |
| `Cloudinary__CloudName`                |                                                |
| `Cloudinary__ApiKey`                   |                                                |
| `Cloudinary__ApiSecret`                |                                                |
| `FlaskApi__BaseUrl`                    | `http://ai-model:5000`                         |

## AI model

Model weights (`*.keras`) and the dataset are not in git. Get `best_model.keras` from the team
and place it in `AI-model/` next to `API.py`.
