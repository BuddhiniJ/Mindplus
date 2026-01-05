from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import joblib
import re
from datetime import datetime
import uuid
import numpy as np

router = APIRouter(prefix="/voice", tags=["Voice Stress"])

# --------------------------------------------------
# Load ML assets
# --------------------------------------------------
try:
    model = joblib.load("models/stress_type_model.pkl")
    label_encoder = joblib.load("models/stress_label_encoder.pkl")
    print("✅ Multi-stress model loaded successfully")
    print(f"📋 Model type: {type(model)}")
    print(f"📋 Classes: {label_encoder.classes_}")
except Exception as e:
    print(f"❌ Error loading models: {e}")
    model = None
    label_encoder = None

# --------------------------------------------------
# Schemas
# --------------------------------------------------
class StressRequest(BaseModel):
    user_id: str
    text: str
    audio_url: str | None = None

# --------------------------------------------------
# Helpers
# --------------------------------------------------
def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z\s]", "", text)
    return text

def calculate_stress_level(score: float) -> str:
    """Convert score to level: Low, Moderate, High"""
    if score < 0.33:
        return "Low"
    elif score < 0.66:
        return "Moderate"
    else:
        return "High"

def get_multi_stress_scores(text: str):
    """
    Simulate multi-stress detection by analyzing keywords
    This is a fallback for models without predict_proba
    """
    text_lower = text.lower()
    
    print(f"🔍 Analyzing text: '{text_lower}'")
    
    # Keyword-based scoring (0-1 scale)
    scores = {
        "Academic": 0.0,
        "Financial": 0.0,
        "Social": 0.0,
        "Emotional": 0.0
    }
    
    # Academic keywords
    academic_keywords = ['exam', 'test', 'study', 'studies', 'homework', 'grade', 'school', 'college', 'university', 'assignment', 'deadline', 'project', 'academic', 'class', 'course', 'learning']
    academic_count = sum(1 for word in academic_keywords if word in text_lower)
    scores["Academic"] = min(1.0, academic_count * 0.20)
    print(f"📚 Academic keywords found: {academic_count}, score: {scores['Academic']}")
    
    # Financial keywords
    financial_keywords = ['money', 'debt', 'bill', 'pay', 'payment', 'payments', 'cost', 'expensive', 'afford', 'budget', 'financial', 'financially', 'income', 'rent', 'loan', 'credit', 'broke', 'poor']
    financial_count = sum(1 for word in financial_keywords if word in text_lower)
    scores["Financial"] = min(1.0, financial_count * 0.20)
    print(f"💰 Financial keywords found: {financial_count}, score: {scores['Financial']}")
    
    # Social keywords
    social_keywords = ['lonely', 'alone', 'friend', 'friends', 'relationship', 'relationships', 'social', 'isolated', 'isolation', 'people', 'family', 'talk', 'connect', 'rejected']
    social_count = sum(1 for word in social_keywords if word in text_lower)
    scores["Social"] = min(1.0, social_count * 0.20)
    print(f"👥 Social keywords found: {social_count}, score: {scores['Social']}")
    
    # Emotional keywords
    emotional_keywords = ['sad', 'anxious', 'anxiety', 'worried', 'worry', 'depressed', 'depression', 'overwhelm', 'overwhelmed', 'cry', 'crying', 'feel', 'feeling', 'emotion', 'emotional', 'upset', 'hurt', 'pain', 'stress', 'stressed']
    emotional_count = sum(1 for word in emotional_keywords if word in text_lower)
    scores["Emotional"] = min(1.0, emotional_count * 0.20)
    print(f"💭 Emotional keywords found: {emotional_count}, score: {scores['Emotional']}")
    
    # If no keywords found at all, set moderate stress across board
    total_score = sum(scores.values())
    if total_score == 0:
        print("⚠️ No keywords found, setting default moderate scores")
        scores = {
            "Academic": 0.4,
            "Financial": 0.3,
            "Social": 0.3,
            "Emotional": 0.5
        }
    else:
        # Boost the highest scoring category
        max_key = max(scores, key=scores.get)
        if scores[max_key] > 0:
            scores[max_key] = min(1.0, scores[max_key] + 0.15)
            print(f"✨ Boosted {max_key} to {scores[max_key]}")
    
    # Ensure minimum variance (if all are same, add some variation)
    unique_values = len(set(scores.values()))
    if unique_values == 1 and scores["Academic"] > 0:
        scores["Emotional"] = min(1.0, scores["Emotional"] + 0.1)
        scores["Social"] = max(0.0, scores["Social"] - 0.1)
    
    print(f"📊 Final scores: {scores}")
    return scores

# --------------------------------------------------
# Routes
# --------------------------------------------------
@router.post("/analyze-stress")
def analyze_stress(data: StressRequest):
    """
    Analyze ALL stress types simultaneously with individual scores
    """
    
    if not model or not label_encoder:
        raise HTTPException(status_code=500, detail="ML model not loaded")

    if not data.text or len(data.text.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Text too short for stress analysis"
        )

    try:
        cleaned = clean_text(data.text)
        
        print(f"=" * 60)
        print(f"🎤 ANALYZING TEXT")
        print(f"=" * 60)
        print(f"Original: {data.text}")
        print(f"Cleaned: {cleaned}")
        print(f"-" * 60)

        # Try to get probabilities from model
        if hasattr(model, "predict_proba"):
            try:
                proba = model.predict_proba([cleaned])[0]
                
                # Map probabilities to stress types
                stress_scores = {}
                for idx, label in enumerate(label_encoder.classes_):
                    stress_scores[label] = round(float(proba[idx]), 3)
                
                print(f"✅ Using model probabilities")
                print(f"Probabilities: {stress_scores}")
                
            except Exception as e:
                print(f"⚠️ predict_proba failed: {e}")
                # Fallback to keyword-based
                stress_scores = get_multi_stress_scores(data.text)
        else:
            print(f"⚠️ Model doesn't have predict_proba, using hybrid approach")
            
            # Model doesn't have predict_proba
            # Get single prediction and boost it, but also check keywords
            try:
                pred = model.predict([cleaned])[0]
                predicted_type = label_encoder.inverse_transform([pred])[0]
                print(f"🎯 Model predicted: {predicted_type}")
                
                # Start with keyword-based scores
                stress_scores = get_multi_stress_scores(data.text)
                
                # Boost the model's prediction
                stress_scores[predicted_type] = max(stress_scores[predicted_type], 0.70)
                print(f"📊 Boosted {predicted_type} to {stress_scores[predicted_type]}")
                
            except Exception as e:
                print(f"❌ Model prediction failed: {e}")
                # Pure keyword-based
                stress_scores = get_multi_stress_scores(data.text)

        # Ensure all 4 types exist
        for stress_type in ["Academic", "Financial", "Social", "Emotional"]:
            if stress_type not in stress_scores:
                stress_scores[stress_type] = 0.0

        print(f"-" * 60)
        print(f"📊 FINAL STRESS SCORES:")
        for stype, score in stress_scores.items():
            print(f"  {stype}: {score:.3f} ({score*100:.1f}%)")
        print(f"-" * 60)

        # Find dominant stress type
        dominant_type = max(stress_scores, key=stress_scores.get)
        dominant_score = stress_scores[dominant_type]
        
        # Calculate total stress score
        total_stress = sum(stress_scores.values())
        
        # Calculate levels for each type
        stress_levels = {}
        for stress_type, score in stress_scores.items():
            stress_levels[stress_type] = calculate_stress_level(score)

        result = {
            "success": True,
            "analysis_id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": data.user_id,
            "text": data.text,
            "audio_url": data.audio_url,
            
            # Multi-stress analysis
            "stress_scores": stress_scores,
            "stress_levels": stress_levels,
            "dominant_type": dominant_type,
            "dominant_score": dominant_score,
            "total_stress_score": round(total_stress, 3),
            
            # Overall assessment
            "overall_level": calculate_stress_level(total_stress / 4),
            "confidence": round(dominant_score, 3)
        }
        
        print(f"✅ Analysis complete!")
        print(f"Dominant: {dominant_type} ({dominant_score:.3f})")
        print(f"Total: {total_stress:.3f}")
        print(f"Overall: {result['overall_level']}")
        print(f"=" * 60)
        
        return result

    except Exception as e:
        print(f"=" * 60)
        print(f"❌ ANALYSIS ERROR: {e}")
        print(f"=" * 60)
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Stress analysis failed: {str(e)}")


@router.get("/stress-history/{user_id}")
def stress_history(user_id: str):
    return {
        "success": True,
        "user_id": user_id,
        "analyses": [],
        "message": "History feature (local storage)"
    }


@router.get("/health")
def voice_health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "label_encoder_loaded": label_encoder is not None,
        "has_predict_proba": hasattr(model, "predict_proba") if model else False
    }


@router.post("/test-model")
def test_model(data: StressRequest):
    """Test endpoint to debug model behavior"""
    
    if not model or not label_encoder:
        return {"error": "Models not loaded"}
    
    try:
        cleaned = clean_text(data.text)
        
        result = {
            "original_text": data.text,
            "cleaned_text": cleaned,
            "model_type": str(type(model)),
            "has_predict_proba": hasattr(model, "predict_proba"),
            "classes": list(label_encoder.classes_)
        }
        
        # Try prediction
        try:
            pred = model.predict([cleaned])[0]
            predicted_type = label_encoder.inverse_transform([pred])[0]
            result["prediction"] = predicted_type
        except Exception as e:
            result["prediction_error"] = str(e)
        
        # Try probabilities
        if hasattr(model, "predict_proba"):
            try:
                proba = model.predict_proba([cleaned])[0]
                result["probabilities"] = {
                    label: float(prob) 
                    for label, prob in zip(label_encoder.classes_, proba)
                }
            except Exception as e:
                result["proba_error"] = str(e)
        
        # Keyword-based scores
        result["keyword_scores"] = get_multi_stress_scores(data.text)
        
        return result
        
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }