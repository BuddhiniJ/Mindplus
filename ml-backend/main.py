import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
from utils.cluster_labels import LABELS
from routes.voice_routes import router as voice_routes
from services.emotion_service import (
    PredictRequest, PredictResponse, CopingStrategyRequest, CopingStrategyResponse,
    predict, coping_strategy, health, MODEL_NAME
)
from routes.fingerprint_routes import router as fingerprint_router
from services.advanced_stress_model import predict_future_stress


# =====  Chatbot Imports =====
from services.chatbot_service import (
    TextInput,
    AnalysisResult,
    ChatStartResponse,
    ChatMessageInput,
    ChatMessageResponse,
    health_service as chatbot_health_service,
    analyze_text_service,
    chat_start_service,
    chat_message_service,

)

app = FastAPI(title="MindPlus Backend API", version="1.0")

# Enable CORS for development (frontend runs on Metro at localhost:8081)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this to ["http://localhost:8081"] if you prefer
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model at startup
model = joblib.load("models/model.pkl")

class UserScores(BaseModel):
    stress: float
    anxiety: float
    depression: float

@app.get("/")
def root():
    return {"message": "Stress ML Backend running"}

@app.get("/emotionhealth")
async def health_check():
    return await health()

@app.get("/chatbot/health")
def chatbot_health_check():
    return chatbot_health_service()

@app.post("/emotion/predict", response_model=PredictResponse)
async def emotion_predict(payload: PredictRequest):
    return await predict(payload)

@app.post("/emotion/coping-strategy", response_model=CopingStrategyResponse)
async def emotion_coping_strategy(payload: CopingStrategyRequest):
    return await coping_strategy(payload)

# ================= CHATBOT ROUTES ====================

@app.post("/chatbot/analyze", response_model=AnalysisResult)
def analyze_text(input: TextInput):
    return analyze_text_service(input)


@app.post("/chatbot/chat/start", response_model=ChatStartResponse)
def chat_start():
    return chat_start_service()


@app.post("/chatbot/chat/message", response_model=ChatMessageResponse)
def chat_message(input: ChatMessageInput):
    return chat_message_service(input)

# ================= CHATBOT ROUTES ====================
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



# Include voice routes
app.include_router(voice_routes)

### Stress prediction
@app.post("/api/fingerprint/evolve")
def evolve_fingerprint(payload: dict):

    try:

        predictions = predict_future_stress(payload)

        return {
            "status": "success",
            "data": {
                "future_5_days": predictions
            }
        }

    except Exception as e:

        return {
            "status": "error",
            "message": str(e)
        }

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
