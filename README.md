# Mindplus
Academic Stress Monitoring Mobile Application

for backend
```
cd ml-backend
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn scikit-learn numpy pandas pydantic joblib transformers torch
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
