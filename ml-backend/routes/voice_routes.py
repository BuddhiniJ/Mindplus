from fastapi import APIRouter
from pydantic import BaseModel
import joblib
import re

router = APIRouter(prefix="/predict-stress")

# Load YOUR model
model = joblib.load("models/stress_model.pkl")
vectorizer = joblib.load("models/stress_vectorizer.pkl")

class StressText(BaseModel):
    nickname: str
    text: str

def clean_text(text: str):
    text = text.lower()
    text = re.sub(r"[^a-z\s]", "", text)
    return text

@router.post("/")
def predict_stress(data: StressText):
    cleaned = clean_text(data.text)
    vec = vectorizer.transform([cleaned])
    prediction = int(model.predict(vec)[0])

    return {
        "model": "stress_model",
        "nickname": data.nickname,
        "stress_level": prediction
    }
