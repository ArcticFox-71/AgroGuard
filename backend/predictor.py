# ==============================================
# AgroGuard — Predictor
# Loads model and runs disease prediction
# ==============================================

import os
import numpy as np
from PIL import Image
import io

os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import tensorflow as tf
from knowledge_base import get_disease_info

# -----------------------------------------------
# Model configuration
# -----------------------------------------------

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "agroguard_final.keras"
)

IMAGE_SIZE = (224, 224)

CLASS_NAMES = [
    "bacterial_leaf_blight",
    "brown_spot",
    "healthy",
    "leaf_blast"
]

CLASS_DISPLAY = [
    "Bacterial Leaf Blight",
    "Brown Spot",
    "Healthy",
    "Leaf Blast"
]

# -----------------------------------------------
# Load model once when server starts
# -----------------------------------------------

print("Loading AgroGuard model...")
model = tf.keras.models.load_model(MODEL_PATH)
print("✅ Model loaded successfully")

# -----------------------------------------------
# Prediction function
# -----------------------------------------------

def predict_disease(image_bytes: bytes) -> dict:
    """
    Takes image as bytes (from uploaded file).
    Returns complete prediction with disease info.
    """

    # Open image from bytes
    img = Image.open(io.BytesIO(image_bytes))

    # Convert to RGB
    img = img.convert("RGB")

    # Resize to model input size
    img = img.resize(IMAGE_SIZE, Image.LANCZOS)

    # Convert to numpy array and normalise
    img_array = np.array(img).astype(
        np.float32
    ) / 255.0

    # Add batch dimension
    img_batch = np.expand_dims(img_array, axis=0)

    # Run prediction
    predictions = model.predict(img_batch, verbose=0)

    # Get predictions
    raw_preds  = predictions[0]
    pred_idx   = int(np.argmax(raw_preds))
    confidence = float(raw_preds[pred_idx]) * 100

    # Get all probabilities
    all_probs = {
        CLASS_DISPLAY[i]: round(
            float(raw_preds[i]) * 100, 2
        )
        for i in range(len(CLASS_NAMES))
    }

    # Get disease info from knowledge base
    disease_info = get_disease_info(
        CLASS_NAMES[pred_idx]
    )

    # Low confidence warning
    warning = None
    if confidence < 70:
        warning = (
            "Low confidence prediction. "
            "Please take a clearer photo of "
            "the affected leaf for better results."
        )

    return {
        "predicted_class"        : CLASS_NAMES[pred_idx],
        "display_name"           : CLASS_DISPLAY[pred_idx],
        "confidence"             : round(confidence, 2),
        "all_probabilities"      : all_probs,
        "disease_name_en"        : disease_info["display_name_en"],
        "disease_name_kn"        : disease_info["display_name_kn"],
        "symptoms_en"            : disease_info["symptoms_en"],
        "symptoms_kn"            : disease_info["symptoms_kn"],
        "treatment_en"           : disease_info["treatment_en"],
        "treatment_kn"           : disease_info["treatment_kn"],
        "prevention_en"          : disease_info["prevention_en"],
        "prevention_kn"          : disease_info["prevention_kn"],
        "severity"               : disease_info["severity"],
        "low_confidence_warning" : warning
    }