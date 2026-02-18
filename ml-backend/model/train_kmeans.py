import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import joblib
import os

BASE_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_DIR, "dass21_dataset.csv")

# 1. Load dataset
df = pd.read_csv(DATA_PATH)

# ✅ DROP ROWS WITH MISSING ANSWERS
df = df.dropna()

# 2. DASS-21 question groups
DEPRESSION_QS = [3,5,10,13,16,17,21]
ANXIETY_QS    = [2,4,7,9,15,19,20]
STRESS_QS     = [1,6,8,11,12,14,18]

def compute_score(row, questions):
    return sum(row[f"q{q}"] for q in questions) * 2

# 3. Compute subscales
df["depression"] = df.apply(lambda r: compute_score(r, DEPRESSION_QS), axis=1)
df["anxiety"]    = df.apply(lambda r: compute_score(r, ANXIETY_QS), axis=1)
df["stress"]     = df.apply(lambda r: compute_score(r, STRESS_QS), axis=1)

# 4. Select features
X = df[["stress", "anxiety", "depression"]]

# 5. Normalize
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 6. Train KMeans
kmeans = KMeans(n_clusters=3, random_state=42)
kmeans.fit(X_scaled)

# 7. Save model
joblib.dump(kmeans, os.path.join(BASE_DIR, "kmeans.pkl"))
joblib.dump(scaler, os.path.join(BASE_DIR, "scaler.pkl"))

print("✅ K-Means model trained successfully")
print(f"Samples used: {len(df)}")
