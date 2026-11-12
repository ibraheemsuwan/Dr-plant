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

## Plant diagnosis (hybrid)

`POST /api/Diagnoses/predict` works in this order:

1. **Local model** (Flask, `AI-model/API.py`). If it is ≥ `Diagnosis:HighConfidence` (85%) sure → answer.
2. **Claude vision** (if a key is set) looks at the photo, with the crops/diseases catalogue from the DB.
   It returns a disease id from our DB when it matches, or its own description for crops we don't cover.
3. Claude unavailable → local answer if ≥ `Diagnosis:MinConfidence` (60%).
4. Otherwise → `status: "Uncertain"` with a message asking for a clearer photo. No guess is shown.

Model classes map to DB rows explicitly in `DoctorPlantTest.API/Diagnosis/model_class_map.json`
(130 classes). Regenerate it if the model or the `diseases` table changes.

### Run the local model

Model weights (`*.keras`) and the dataset are not in git. Get `best_model.keras` from the team
and place it in `AI-model/` next to `API.py`.

```bash
cd AI-model
pip install -r requirements.txt
python API.py            # serves on 127.0.0.1:5000 (waitress)
```

Optional: set `MODEL_API_KEY` on the Flask side and the same value in `FlaskApi:ApiKey` so only the
backend can call the model.

### Enable Claude (optional, recommended)

```bash
cd Backend/DoctorPlantTest.API
dotnet user-secrets set "Claude:ApiKey" "<key from console.anthropic.com>"
```

Production: environment variable `Claude__ApiKey` (or `ANTHROPIC_API_KEY`). Without a key the app
runs on the local model only. Model and effort are in `appsettings.json` → `Claude`
(default `claude-opus-5-5`, effort `medium`). Each diagnosis is logged with its source and token usage,
and stored in `imagediagnoses.Status` as `<status>/<source>` (e.g. `Completed/ai`) to track API usage.
