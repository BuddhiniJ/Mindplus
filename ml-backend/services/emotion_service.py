from pydantic import BaseModel
from typing import Optional, List, Dict
from transformers import pipeline
import os
import re
import json
from pathlib import Path


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

COPING_STRATEGY_PATH = Path(__file__).parent.parent / "CopingStrategy.json"


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


async def health():
    return {"status": "ok", "service": "emotion", "model": MODEL_NAME}


def extract_keywords(text: str, max_keywords: int = 5) -> List[str]:

    tokens = re.findall(r"[A-Za-z']+", text.lower())
    filtered = [t for t in tokens if t not in STOPWORDS and len(t) > 2]
   
    seen = set()
    ordered_unique = []
    for t in filtered:
        if t not in seen:
            seen.add(t)
            ordered_unique.append(t)
        if len(ordered_unique) >= max_keywords:
            break
    return ordered_unique


def pick_severity(confidence: float) -> str:
    if confidence >= 0.75:
        return "high"
    if confidence >= 0.4:
        return "medium"
    return "low"


def get_coping_strategy(emotion: str, confidence: float) -> Optional[str]:
    severity = pick_severity(confidence)
    strategies = COPING_STRATEGIES.get(emotion.lower()) or COPING_STRATEGIES.get("neutral")
    if not strategies:
        return None
    return strategies.get(severity)


async def predict(payload: PredictRequest) -> PredictResponse:
    text = payload.text.strip()
    if not text:
        return PredictResponse(emotion="neutral", confidence=0.0, model=MODEL_NAME, keywords=[])
    raw = classifier(text)   
    first = raw[0]
    if isinstance(first, list): 
        best = max(first, key=lambda x: x.get("score", 0.0))
    else:
        best = first
    emotion = best["label"].lower()
    confidence = float(best["score"])
    keywords = extract_keywords(text)
    return PredictResponse(emotion=emotion, confidence=confidence, model=MODEL_NAME, keywords=keywords)


async def coping_strategy(payload: CopingStrategyRequest):
    emotion = payload.emotion.strip().lower() or "neutral"
    confidence = max(0.0, min(1.0, payload.confidence))
    severity = pick_severity(confidence)
    strategy = get_coping_strategy(emotion, confidence)
    return CopingStrategyResponse(
        emotion=emotion,
        confidence=confidence,
        severity=severity,
        strategy=strategy,
    )
