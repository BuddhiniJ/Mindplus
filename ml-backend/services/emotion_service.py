from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, List, Dict
from transformers import pipeline
import os
import re
import json
from pathlib import Path

app = FastAPI(title="Emotion Service", version="0.2.0", description="Emotion detection using a pretrained transformer model.")


class PredictRequest(BaseModel):
    text: str


class PredictResponse(BaseModel):
    emotion: str
    confidence: float
    model: Optional[str] = None
    keywords: List[str]


class CopingStrategyRequest(BaseModel):
    emotion: str
    confidence: float


class CopingStrategyResponse(BaseModel):
    emotion: str
    confidence: float
    severity: str
    strategy: Optional[str]


STOPWORDS = {
    "the","a","an","and","or","but","if","then","so","to","for","of","on","in","at","is","am","are","was","were","be","been","being","i","you","he","she","it","they","them","we","me","my","your","our","with","this","that","those","these","about","just","very","really","feel","feeling"
}

MODEL_NAME = os.getenv("EMOTION_MODEL_NAME", "j-hartmann/emotion-english-distilroberta-base")

classifier = pipeline("text-classification", model=MODEL_NAME)

COPING_STRATEGY_PATH = Path(__file__).with_name("CopingStrategy.json")


def load_coping_strategies(path: Path) -> Dict[str, Dict[str, str]]:
    try:
        with path.open("r", encoding="utf-8") as fh:
            payload = json.load(fh)
            return {emotion.lower(): {k.lower(): v for k, v in strategies.items()} for emotion, strategies in payload.items()}
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Invalid coping strategy JSON: {exc}")


COPING_STRATEGIES = load_coping_strategies(COPING_STRATEGY_PATH)