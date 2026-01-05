from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
from utils.cluster_labels import LABELS
from routes.voice_routes import router as voice_routes

app = FastAPI(title="MindPlus Backend API", version="1.0")

# Load model at startup
model = joblib.load("models/model.pkl")

class UserScores(BaseModel):
    stress: float
    anxiety: float
    depression: float

@app.get("/")
def root():
    return {
        "message": "MindPlus Backend API",
        "status": "running",
        "version": "1.0",
        "endpoints": {
            "health": "/voice/health",
            "analyze": "/voice/analyze-stress",
            "history": "/voice/stress-history/{user_id}",
            "predict": "/predict"
        }
    }
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


app.include_router(voice_routes)

# Startup event
@app.on_event("startup")
async def startup_event():
    print("=" * 50)
    print("🚀 MindPlus Backend Started")
    print("=" * 50)
    print("📍 Voice Analysis: /voice/analyze-stress")
    print("📊 Health Check: /voice/health")
    print("📜 History: /voice/stress-history/{user_id}")
    print("=" * 50)