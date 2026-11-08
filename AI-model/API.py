import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import io
import json
import numpy as np
from flask import Flask, request, jsonify
from PIL import Image

import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
from tensorflow.keras.applications.efficientnet import preprocess_input


app = Flask(__name__)

# تحميل المودل
MODEL_PATH = r"best_model.keras"
model = load_model(MODEL_PATH)

# تحميل أسماء الكلاسات من ملف
with open("class_names.json", "r") as f:
    class_names = json.load(f)

# تجهيز الصورة
def preprocess_image(pil_img, target_size=(300, 300)):
    if pil_img.mode != "RGB":
        pil_img = pil_img.convert("RGB")
    pil_img = pil_img.resize(target_size)
    arr = img_to_array(pil_img)
    arr = np.expand_dims(arr, axis=0)
    arr = preprocess_input(arr)
    return arr

# صفحة رئيسية
@app.get("/")
def home():
    return jsonify({
        "status": "ok",
        "message": "POST /predict with form-data key='file' (image)"
    }), 200

# التنبؤ
@app.route("/predict", methods=["POST"])
def predict():
    print("Content-Type:", request.content_type)
    print("Files keys:", list(request.files.keys()))
    print("Form keys:", list(request.form.keys()))

    if "file" not in request.files:
        return jsonify({
            "error": "No file uploaded. Send as multipart/form-data with key='file'.",
            "content_type": request.content_type,
            "files_keys": list(request.files.keys())
        }), 400

    f = request.files["file"]

    if f.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    try:
        img_bytes = f.read()
        pil_img = Image.open(io.BytesIO(img_bytes))

        x = preprocess_image(pil_img)

        preds = model.predict(x, verbose=0)[0]
        class_idx = int(np.argmax(preds))
        confidence = float(np.max(preds)) * 100

        # اسم نظيف للعرض
        clean_name = class_names[class_idx].replace("__", " - ").replace("_", " ")

        return jsonify({
            "class": clean_name,
            "raw_class": class_names[class_idx],
            "confidence": confidence,
            "filename": f.filename
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True, use_reloader=False)