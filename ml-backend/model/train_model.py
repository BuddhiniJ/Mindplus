import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
import joblib
import os

def generate_synthetic_data(n=200):
    np.random.seed(42)

    # Four natural user types
    stress_dom = np.random.normal([30, 15, 12], [4, 3, 3], (50, 3))
    anxiety_dom = np.random.normal([12, 30, 10], [3, 4, 3], (50, 3))
    depression_dom = np.random.normal([10, 12, 30], [3, 3, 4], (50, 3))
    balanced = np.random.normal([15, 15, 15], [3, 3, 3], (50, 3))

    data = np.vstack([stress_dom, anxiety_dom, depression_dom, balanced])
    return pd.DataFrame(data, columns=["stress", "anxiety", "depression"])

def train_and_save_model():
    data = generate_synthetic_data()

    kmeans = KMeans(n_clusters=4, random_state=42)
    kmeans.fit(data)

    os.makedirs("models", exist_ok=True)
    joblib.dump(kmeans, "models/model.pkl")

    print("Model trained + saved to models/model.pkl")

if __name__ == "__main__":
    train_and_save_model()
