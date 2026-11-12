"""Dr. Plant local disease model service.

POST /predict  (multipart/form-data, key "file")  -> top-3 predictions
GET  /health                                      -> liveness + model info

Environment variables:
  MODEL_PATH       path to the .keras model (default: best_model.keras next to this file)
  CLASS_NAMES_PATH path to class_names.json (default: next to this file)
  MODEL_API_KEY    if set, requests must send header "X-Api-Key: <value>"
  HOST / PORT      bind address (default 127.0.0.1:5000)
"""
import os

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

import hmac
import io
import json
import logging

import numpy as np
from flask import Flask, jsonify, request
from PIL import Image, UnidentifiedImageError
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.environ.get("MODEL_PATH", os.path.join(BASE_DIR, "best_model.keras"))
CLASS_NAMES_PATH = os.environ.get("CLASS_NAMES_PATH", os.path.join(BASE_DIR, "class_names.json"))
API_KEY = os.environ.get("MODEL_API_KEY", "")
IMAGE_SIZE = (300, 300)
TOP_K = 3

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("drplant-model")

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 12 * 1024 * 1024  # 10 MB image + multipart overhead

model = load_model(MODEL_PATH)
with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as f:
    class_names = json.load(f)

output_size = int(model.output_shape[-1])
if output_size != len(class_names):
    raise RuntimeError(f"Model outputs {output_size} classes but class_names.json has {len(class_names)}")
log.info("Loaded %s with %d classes", os.path.basename(MODEL_PATH), len(class_names))


@app.before_request
def check_api_key():
    if request.path == "/health" or not API_KEY:
        return None
    sent = request.headers.get("X-Api-Key", "")
    if not hmac.compare_digest(sent, API_KEY):
        return jsonify({"error": "Unauthorized"}), 401
    return None


def preprocess_image(pil_img):
    if pil_img.mode != "RGB":
        pil_img = pil_img.convert("RGB")
    pil_img = pil_img.resize(IMAGE_SIZE)
    arr = img_to_array(pil_img)
    arr = np.expand_dims(arr, axis=0)
    return preprocess_input(arr)


@app.get("/health")
def health():
    return jsonify({"status": "ok", "classes": len(class_names)}), 200


@app.post("/predict")
def predict():
    f = request.files.get("file")
    if f is None or f.filename == "":
        return jsonify({"error": "No file uploaded. Send multipart/form-data with key 'file'."}), 400

    try:
        pil_img = Image.open(io.BytesIO(f.read()))
        pil_img.load()
    except (UnidentifiedImageError, OSError):
        return jsonify({"error": "The uploaded file is not a valid image."}), 400

    try:
        preds = model.predict(preprocess_image(pil_img), verbose=0)[0]
    except Exception:
        log.exception("Prediction failed")
        return jsonify({"error": "Prediction failed."}), 500

    top_idx = np.argsort(preds)[::-1][:TOP_K]
    top = [
        {"raw_class": class_names[i], "confidence": round(float(preds[i]) * 100, 2)}
        for i in top_idx
    ]

    best = top[0]
    return jsonify({
        # backward-compatible fields
        "class": best["raw_class"],
        "raw_class": best["raw_class"],
        "confidence": best["confidence"],
        # new
        "top": top,
    }), 200


@app.errorhandler(413)
def too_large(_):
    return jsonify({"error": "Image is too large (max 10 MB)."}), 413


if __name__ == "__main__":
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "5000"))
    try:
        from waitress import serve  # production WSGI server
        log.info("Serving with waitress on %s:%d", host, port)
        serve(app, host=host, port=port, threads=4)
    except ImportError:
        log.warning("waitress not installed; using Flask dev server (pip install waitress)")
        app.run(host=host, port=port, debug=False, use_reloader=False)
