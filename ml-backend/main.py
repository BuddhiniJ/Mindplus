from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
from utils.cluster_labels import LABELS

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
