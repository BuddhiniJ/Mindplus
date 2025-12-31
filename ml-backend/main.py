from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
from utils.cluster_labels import LABELS
from routes.voice_routes import router as voice_routes
from services.emotion_service import (
    PredictRequest, PredictResponse, CopingStrategyRequest, CopingStrategyResponse,
    predict, coping_strategy, health, MODEL_NAME
)

app = FastAPI()

# Load model at startup
model = joblib.load("models/model.pkl")

class UserScores(BaseModel):
    stress: float
    anxiety: float
    depression: float

@app.get("/")
def root():
    return {"message": "Stress ML Backend running"}

@app.get("/health")
async def health_check():
    return await health()

@app.post("/emotion/predict", response_model=PredictResponse)
async def emotion_predict(payload: PredictRequest):
    return await predict(payload)

@app.post("/emotion/coping-strategy", response_model=CopingStrategyResponse)
async def emotion_coping_strategy(payload: CopingStrategyRequest):
    return await coping_strategy(payload)

@app.post("/predict")
def predict_cluster(scores: UserScores):

    # Convert input to numpy array
    x = np.array([[scores.stress, scores.anxiety, scores.depression]])

    # Get cluster index
    cluster_id = model.predict(x)[0]

    # Return cluster label from dictionary
    label = LABELS.get(cluster_id, "unknown")

    # Confidence: inverse distance to centroid (simple metric)
    distances = model.transform(x)[0]
    confidence = float(1 / (1 + distances[cluster_id]))

    return {
        "clusterId": int(cluster_id),
        "label": label,
        "confidence": confidence
    }

# Include voice routes
app.include_router(voice_routes)
