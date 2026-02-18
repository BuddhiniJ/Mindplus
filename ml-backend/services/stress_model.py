import numpy as np
from sklearn.linear_model import Ridge

def train_personalized_model(logs):
    """
    logs = list of dicts with:
    stress_today, sleep_hours, energy_level,
    workload_intensity, event_weight
    """

    if len(logs) < 5:
        return None  # not enough data

    X = []
    y = []

    for i in range(len(logs) - 1):
        today = logs[i]
        tomorrow = logs[i + 1]

        X.append([
            today["stress_today"],
            today["sleep_hours"],
            today["energy_level"],
            today["workload_intensity"],
            today.get("event_weight", 0)
        ])

        y.append(tomorrow["stress_today"])

    X = np.array(X)
    y = np.array(y)

    model = Ridge(alpha=1.0)
    model.fit(X, y)

    return model

def predict_stress(model, input_features):
    """
    input_features = [
        stress_today,
        sleep_hours,
        energy_level,
        workload_intensity,
        event_weight
    ]
    """

    prediction = model.predict([input_features])[0]
    return max(0, min(10, float(prediction)))  # clamp 0–10

def compute_event_weights(events, forecast_days=5):
    """
    Returns list of event weights for next N days
    """

    weights = [0.0] * forecast_days

    for event in events:
        if 1 <= event.days_ahead <= forecast_days:
            day_index = event.days_ahead - 1

            # Closer events have stronger impact
            proximity_factor = 1 / event.days_ahead

            weights[day_index] += event.importance * proximity_factor

    return weights
