from fastapi import APIRouter
from pydantic import BaseModel
# from typing import List
from services.fingerprint_service import evolve_fingerprint
from services.stress_model import train_personalized_model, predict_stress, compute_event_weights
from typing import Dict, Any, List, Optional
from statistics import mean

router = APIRouter()
ALPHA = 0.2

class DailyLog(BaseModel):
    stress_today: float
    energy_level: float
    sleep_hours: float
    workload_intensity: float

class Baseline(BaseModel):
    stress: float
    anxiety: float
    depression: float
    timestamp: str

class Event(BaseModel):
    days_ahead: int
    importance: float

class FingerprintRequest(BaseModel):
    baseline: Dict[str, Any]
    recent_logs: List[Dict[str, Any]]
    previous_fingerprint: Optional[Dict[str, Any]] = None
    upcoming_events: List[Event] = []

@router.post("/fingerprint/evolve")
def evolve(data: FingerprintRequest):

    logs = data.recent_logs

    print("===== INCOMING REQUEST =====")
    print(data.dict())
    print("============================")

    # ---- Fingerprint Evolution (Your Current Logic) ----
    # avg_stress = mean([log["stress_today"] for log in logs])
    # avg_energy = mean([log["energy_level"] for log in logs])
    # avg_sleep = mean([log["sleep_hours"] for log in logs])
    stress_vals = [log["stress_today"] for log in logs if log["stress_today"] is not None]
    energy_vals = [log["energy_level"] for log in logs if log["energy_level"] is not None]
    sleep_vals = [log["sleep_hours"] for log in logs if log["sleep_hours"] is not None]

    avg_stress = mean(stress_vals) if stress_vals else 5
    avg_energy = mean(energy_vals) if energy_vals else 5
    avg_sleep = mean(sleep_vals) if sleep_vals else 6

    if data.previous_fingerprint:
        old_stress = data.previous_fingerprint.get("stress_index", avg_stress)
        old_energy = data.previous_fingerprint.get("energy_index", avg_energy)
        old_sleep = data.previous_fingerprint.get("sleep_index", avg_sleep)
    else:
        old_stress = avg_stress
        old_energy = avg_energy
        old_sleep = avg_sleep

    new_stress = (1 - ALPHA) * old_stress + ALPHA * avg_stress
    new_energy = (1 - ALPHA) * old_energy + ALPHA * avg_energy
    new_sleep = (1 - ALPHA) * old_sleep + ALPHA * avg_sleep

    risk_score = (new_stress * 0.5) - (new_energy * 0.3) - (new_sleep * 0.2)

    fingerprint_result = {
        "stress_index": round(new_stress, 2),
        "energy_index": round(new_energy, 2),
        "sleep_index": round(new_sleep, 2),
        "risk_score": round(risk_score, 2)
    }

    # ---- ML Prediction Section ----
    model = train_personalized_model(logs)

    if model:
        # latest = logs[-1]
        latest = logs[-1] if logs else {
            "stress_today": avg_stress,
            "sleep_hours": avg_sleep,
            "energy_level": avg_energy,
            "workload_intensity": 5
        }

        current_features = [
            latest["stress_today"],
            latest["sleep_hours"],
            latest["energy_level"],
            latest["workload_intensity"],
            0  # placeholder for event_weight
        ]

        # Compute event schedule
        event_schedule = compute_event_weights(data.upcoming_events, forecast_days=5)

        future_predictions = []

        for i in range(5):
            current_features[4] = event_schedule[i]

            # next_stress = predict_stress(model, current_features)

            ml_prediction = predict_stress(model, current_features)

            # Blend with evolved stress index
            BLEND_FACTOR = 0.4  # trust ML only 40%
            next_stress = (BLEND_FACTOR * ml_prediction) + \
                        ((1 - BLEND_FACTOR) * new_stress)

            # Add anticipatory event boost
            EVENT_IMPACT_FACTOR = 0.15
            next_stress += event_schedule[i] * EVENT_IMPACT_FACTOR

            next_stress = max(0.5, min(9.5, next_stress))

            future_predictions.append(round(next_stress, 2))

            # keep original real stress instead of recursive prediction
            current_features[0] = latest["stress_today"]

            # Optional workload decay
            current_features[3] = max(0, current_features[3] - 0.3)

            print("Raw model prediction:", next_stress)


        fingerprint_result["future_5_days"] = future_predictions
        fingerprint_result["event_schedule"] = event_schedule

    return {
        "status": "success",
        "data": fingerprint_result
    }
