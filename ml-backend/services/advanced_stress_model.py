import random
import numpy as np

# Advanced ML model integration
try:
    from sklearn.ensemble import RandomForestRegressor
    import joblib
except ImportError:
    RandomForestRegressor = None
    joblib = None

MODEL_PATH = "model/stress_rf_model.pkl"

def extract_features(log, event_load=0):
    return [
        log.get("stress_today", 5) or 5,
        log.get("energy_level", 5) or 5,
        log.get("sleep_hours", 6) or 6,
        log.get("workload_intensity", 5) or 5,
        event_load
    ]

def train_stress_model(logs, events):
    if RandomForestRegressor is None:
        return None
    X = []
    y = []
    for i in range(1, len(logs)):
        prev = logs[i-1]
        curr = logs[i]
        event_load = event_pressure(events, sensitivity=1.0)
        X.append(extract_features(prev, event_load))
        y.append(curr.get("stress_today", 5) or 5)
    if len(X) < 10:
        return None  # Not enough data
    model = RandomForestRegressor(n_estimators=50, random_state=42)
    model.fit(X, y)
    if joblib:
        joblib.dump(model, MODEL_PATH)
    return model

def predict_stress_ml(model, log, event_load=0):
    X = [extract_features(log, event_load)]
    pred = model.predict(X)[0]
    return max(0, min(10, round(pred, 2)))


def safe_avg(values):
    clean = [v for v in values if v is not None]
    return np.mean(clean) if clean else 0


def calculate_stress_momentum(logs):

    if len(logs) < 2:
        return 0

    diffs = []

    for i in range(1, len(logs)):
        prev = logs[i - 1]["stress_today"]
        curr = logs[i]["stress_today"]

        if prev is not None and curr is not None:
            diffs.append(curr - prev)

    return np.mean(diffs) if diffs else 0


def emotional_variability(logs):

    values = [l["stress_today"] for l in logs if l["stress_today"] is not None]

    if len(values) < 2:
        return 0

    return np.std(values)


def sleep_recovery(logs):

    sleep_values = [l["sleep_hours"] for l in logs if l["sleep_hours"]]

    if not sleep_values:
        return 0

    avg_sleep = np.mean(sleep_values)

    # ideal sleep = 7.5 hours
    recovery = (avg_sleep - 6) * 0.5

    return max(-1, min(2, recovery))


def energy_buffer(logs):

    energy = [l["energy_level"] for l in logs if l["energy_level"]]

    if not energy:
        return 0

    avg_energy = np.mean(energy)

    # higher energy protects against stress
    return (avg_energy - 5) * -0.2


def event_pressure(events, sensitivity=1.0):

    total = 0

    for e in events:
        importance = e.get("importance", 1)
        days = e.get("days_ahead", 1)

        pressure = importance * np.exp(-days/3)

        total += pressure

    return total * 0.4 * sensitivity


def baseline_stress(baseline):

    if not baseline:
        return 4.5

    return baseline.get("stress_score", 4.5)


def predict_future_stress(payload):
    logs = payload["recent_logs"]
    events = payload["upcoming_events"]
    baseline = payload.get("baseline")

    base = baseline_stress(baseline)
    momentum = calculate_stress_momentum(logs)
    variability = emotional_variability(logs)
    recovery = sleep_recovery(logs)
    energy = energy_buffer(logs)
    event_load = event_pressure(events)

    # Try ML model if enough logs
    model = None
    if RandomForestRegressor is not None and len(logs) > 10:
        model = train_stress_model(logs, events)
    predictions = []
    current = base
    for day in range(1, 6):
        if model:
            # Use ML model for prediction
            log_idx = min(day, len(logs)-1)
            log = logs[log_idx]
            pred = predict_stress_ml(model, log, event_load * (1 / day))
            predictions.append(pred)
        else:
            # Fallback to rule-based
            drift = (
                momentum * 0.6
                + variability * 0.2
                + event_load * (1 / day)
                - recovery
                + energy
            )
            drift = max(-2, min(2, drift))
            noise = 0.1 * np.sin(day)
            current = current * 0.92 + drift + noise
            current = max(0, min(10, current))
            predictions.append(round(current, 2))
    confidence = max(0.5, 1 - variability/10)
    print("Momentum:", momentum)
    print("Variability:", variability)
    print("Sleep recovery:", recovery)
    print("Energy buffer:", energy)
    print("Event load:", event_load)
    if model:
        print("ML model used for prediction.")
    else:
        print("Rule-based prediction used.")
    return {
        "future_5_days": predictions,
        "confidence": round(confidence, 2)
    }