# ==============================================
# AgroGuard — Model Download Script
# Downloads model from Google Drive on startup
# ==============================================

import os
import gdown

MODEL_PATH = "agroguard_final.keras"
FILE_ID    = "133Kwe7HkrQU3khnCRHhS5OIrnt4jzdYd"

def download_model():
    if not os.path.exists(MODEL_PATH):
        print("Downloading model from Google Drive...")
        url = f"https://drive.google.com/uc?id={FILE_ID}"
        gdown.download(url, MODEL_PATH, quiet=False)
        print("✅ Model downloaded successfully")
    else:
        print("✅ Model already exists, skipping download")

if __name__ == "__main__":
    download_model()