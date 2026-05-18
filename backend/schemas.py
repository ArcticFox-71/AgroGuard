# ==============================================
# AgroGuard — Data Schemas
# Defines input/output structure for the API
# ==============================================

from pydantic import BaseModel
from typing import Dict, Optional

class PredictionResponse(BaseModel):
    """
    This is what the API sends back
    after predicting a disease.
    The frontend receives this JSON.
    """

    # Predicted class name
    predicted_class   : str

    # Display name (formatted)
    display_name      : str

    # Confidence percentage 0-100
    confidence        : float

    # All 4 class probabilities
    all_probabilities : Dict[str, float]

    # Disease information
    disease_name_en   : str
    disease_name_kn   : str
    symptoms_en       : str
    symptoms_kn       : str
    treatment_en      : str
    treatment_kn      : str
    prevention_en     : str
    prevention_kn     : str
    severity          : str

    # Warning if confidence is low
    low_confidence_warning : Optional[str] = None


class HealthResponse(BaseModel):
    """
    Simple health check response.
    Used to verify server is running.
    """
    status  : str
    message : str
    model   : str
    version : str