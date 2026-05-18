# ==============================================
# AgroGuard — FastAPI Backend Server
# Phase 22: Complete API with history logging
# ==============================================

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import json
from datetime import datetime
from typing import List

from download_model import download_model
download_model()

from predictor import predict_disease
from schemas import PredictionResponse, HealthResponse

# -----------------------------------------------
# Paths
# -----------------------------------------------

BASE_DIR    = os.path.dirname(
    os.path.abspath(__file__)
)
LOGS_DIR    = os.path.join(
    BASE_DIR, "..", "logs"
)
HISTORY_FILE = os.path.join(
    LOGS_DIR, "predictions.json"
)

# Create logs directory if not exists
os.makedirs(LOGS_DIR, exist_ok=True)

# -----------------------------------------------
# Create FastAPI app
# -----------------------------------------------

app = FastAPI(
    title       = "AgroGuard API",
    description = (
        "Rice leaf disease detection API "
        "for farmers in Mandya, Karnataka.\n\n"
        "## Endpoints\n"
        "- **POST /predict** — Upload leaf image, "
        "get disease prediction\n"
        "- **GET /history** — View past predictions\n"
        "- **DELETE /history** — Clear history\n"
        "- **GET /health** — Server health check"
    ),
    version     = "1.0.0"
)

# -----------------------------------------------
# CORS Middleware
# -----------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# -----------------------------------------------
# Helper — History functions
# -----------------------------------------------

def load_history() -> list:
    """Load prediction history from JSON file."""
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, 'r',
                  encoding='utf-8') as f:
            return json.load(f)
    except:
        return []


def save_to_history(prediction: dict,
                    filename: str):
    """Save one prediction to history file."""
    history = load_history()

    # Create history entry
    entry = {
        "id"            : len(history) + 1,
        "timestamp"     : datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        ),
        "filename"      : filename,
        "predicted_class": prediction[
            "predicted_class"
        ],
        "display_name"  : prediction["display_name"],
        "confidence"    : prediction["confidence"],
        "severity"      : prediction["severity"]
    }

    history.append(entry)

    # Keep only last 50 predictions
    if len(history) > 50:
        history = history[-50:]

    with open(HISTORY_FILE, 'w',
              encoding='utf-8') as f:
        json.dump(history, f,
                  indent=2, ensure_ascii=False)

    return entry

# -----------------------------------------------
# Routes
# -----------------------------------------------

@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint — confirms server is running."""
    return {
        "status"  : "running",
        "message" : "AgroGuard API is running!",
        "model"   : "MobileNetV2",
        "version" : "1.0.0"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check for deployment monitoring."""
    return {
        "status"  : "healthy",
        "message" : "All systems operational",
        "model"   : "MobileNetV2 93.62% accuracy",
        "version" : "1.0.0"
    }


@app.post("/predict",
          response_model=PredictionResponse)
async def predict(
    file: UploadFile = File(...)
):
    """
    ## Predict Rice Leaf Disease

    Upload a rice leaf image and receive:
    - Disease prediction with confidence %
    - Symptoms in English and Kannada
    - Treatment recommendations
    - Prevention tips
    - Severity level

    **Accepted formats:** JPG, PNG
    **Max file size:** 10MB
    """

    # Validate file type
    allowed_types = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code = 400,
            detail      = (
                "Invalid file type. "
                "Please upload JPG or PNG image."
            )
        )

    # Read file
    contents = await file.read()

    # Validate file size (max 10MB)
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code = 400,
            detail      = (
                "File too large. "
                "Maximum size is 10MB."
            )
        )

    # Validate not empty
    if len(contents) == 0:
        raise HTTPException(
            status_code = 400,
            detail      = "Empty file uploaded."
        )

    try:
        # Run prediction
        result = predict_disease(contents)

        # Save to history
        save_to_history(result, file.filename or "unknown.jpg")

        return result

    except Exception as e:
        raise HTTPException(
            status_code = 500,
            detail      = f"Prediction failed: {str(e)}"
        )


@app.get("/history")
async def get_history():
    """
    ## Get Prediction History

    Returns the last 50 predictions made.
    Each entry includes timestamp, filename,
    predicted disease and confidence.
    """
    history = load_history()

    return {
        "total"      : len(history),
        "predictions": list(reversed(history))
    }


@app.delete("/history")
async def clear_history():
    """
    ## Clear Prediction History

    Deletes all saved predictions.
    """
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, 'w') as f:
            json.dump([], f)

    return {
        "status" : "success",
        "message": "History cleared successfully"
    }


# -----------------------------------------------
# Run server
# -----------------------------------------------

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host   = "0.0.0.0",
        port   = 8000,
        reload = False
    )