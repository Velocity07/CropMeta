import os
import joblib
import pandas as pd
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

# Import our custom modules from Phase 2
from backend.database import get_db, PredictionLog
from backend.schemas import CropFeatures, PredictionResponse

app = FastAPI(title="AI Smart Agriculture API")

# Allow the Next.js frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Load the ML Model ---
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / 'model' / 'crop_model.pkl'

try:
    print(f"Loading ML model from {MODEL_PATH}...")
    model_artifacts = joblib.load(MODEL_PATH)
    pipeline = model_artifacts['pipeline']
    label_encoder = model_artifacts['label_encoder']
    print("✅ Model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    pipeline = None

# --- API Endpoints ---

@app.get("/")
def health_check():
    return {"status": "API is running. ML Pipeline Active."}

@app.post("/predict", response_model=PredictionResponse)
def predict_crop(features: CropFeatures, db: Session = Depends(get_db)):
    if pipeline is None:
        raise HTTPException(status_code=500, detail="ML Model not loaded.")

    try:
        # 1. Format incoming JSON data into a Pandas DataFrame for the pipeline
        input_data = pd.DataFrame([{
            'N': features.N,
            'P': features.P,
            'K': features.K,
            'temperature': features.temperature,
            'humidity': features.humidity,
            'ph': features.ph,
            'rainfall': features.rainfall
        }])

        # 2. Make the prediction
        prediction_encoded = pipeline.predict(input_data)
        predicted_crop = label_encoder.inverse_transform(prediction_encoded)[0]
        
        # 3. Calculate true probability
        probabilities = pipeline.predict_proba(input_data)[0]
        confidence_score = round(max(probabilities) * 100, 1)
        
        # 4. Log the transaction to SQLite
        log_entry = PredictionLog(
            nitrogen=features.N, phosphorus=features.P, potassium=features.K,
            temperature=features.temperature, humidity=features.humidity,
            ph=features.ph, rainfall=features.rainfall,
            predicted_crop=predicted_crop
        )
        db.add(log_entry)
        db.commit()

        return {"crop": predicted_crop.capitalize(), "confidence": f"Estimated {confidence_score}% Accuracy"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history")
def get_prediction_history(db: Session = Depends(get_db)):
    # Retrieve the last 10 predictions for our UI dashboard
    logs = db.query(PredictionLog).order_by(PredictionLog.timestamp.desc()).limit(10).all()
    return logs