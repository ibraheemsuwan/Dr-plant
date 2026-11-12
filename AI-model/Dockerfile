# Build context: the AI-model/ folder.   docker build -t drplant-model AI-model
#
# The model weights are not in git. Provide them in ONE of two ways:
#   a) build arg:  --build-arg MODEL_URL=https://.../best_model.keras   (baked into the image)
#   b) volume:     -v /path/best_model.keras:/app/best_model.keras:ro    (at run time)
FROM python:3.11-slim

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY API.py class_names.json ./

ARG MODEL_URL=""
RUN if [ -n "$MODEL_URL" ]; then curl -fsSL -o /app/best_model.keras "$MODEL_URL"; fi

RUN useradd --create-home appuser && chown -R appuser /app
USER appuser

ENV HOST=0.0.0.0 \
    PORT=5000 \
    TF_CPP_MIN_LOG_LEVEL=3
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD curl -fsS http://127.0.0.1:5000/health || exit 1

CMD ["python", "API.py"]
