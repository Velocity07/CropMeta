import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report
import joblib

# --- Configuration Paths (Optimized with pathlib) ---
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR.parent / 'data' / 'crop_recommendation.csv'
MODEL_PATH = BASE_DIR / 'crop_model.pkl'

def main():
    print("🚀 Initiating Phase 1: Optimized ML Model Training\n")
    
    # 1. Load & Verify the Dataset
    if not DATA_PATH.exists():
        print(f"❌ Error: Dataset not found at {DATA_PATH}")
        return
        
    print(f"📥 Loading dataset from {DATA_PATH}...")
    # Memory Optimization: Load numeric columns as lighter 32-bit floats
    df = pd.read_csv(DATA_PATH, dtype={
        'N': 'float32', 'P': 'float32', 'K': 'float32', 
        'temperature': 'float32', 'humidity': 'float32', 
        'ph': 'float32', 'rainfall': 'float32'
    })
    
    # Sanity Check: Drop any rows with missing data to prevent training crashes
    if df.isnull().sum().sum() > 0:
        print("⚠️ Warning: Missing values detected. Dropping null rows...")
        df = df.dropna()
    
    # 2. Extract Features (X) and Target (y)
    X = df[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']]
    y = df['label']
    
    # 3. Encode Target Labels
    print("🔄 Encoding target labels...")
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    # 4. Train-Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    
    # 5. Build the Scikit-Learn Pipeline (The Major Optimization)
    print(" 🏗️ Building unified ML Pipeline...")
    # A Pipeline chains the scaling and the training into a single object.
    # This prevents Data Leaks and makes the Phase 2 backend much cleaner.
    pipeline = Pipeline(steps=[
        ('scaler', StandardScaler()),
        ('classifier', RandomForestClassifier(n_estimators=100, max_depth=10, min_samples_split=5, min_samples_leaf=3, random_state=42))
    ])
    
    # 6. Train the Pipeline
    print("🧠 Training Pipeline on CPU...")
    pipeline.fit(X_train, y_train)
    
    # 7. Evaluate Performance
    print("\n📈 Evaluating model performance...")
    y_pred = pipeline.predict(X_test)
    print("\n--- Classification Report ---")
    print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))
    
    # 8. Compress and Save Artifacts
    print(f"\n💾 Saving compressed artifacts to {MODEL_PATH}...")
    model_artifacts = {
        'pipeline': pipeline,
        'label_encoder': label_encoder
    }
    
    # Optimization: compress=3 reduces the file size by up to 70%.
    # This saves RAM when FastAPI loads the model into memory.
    joblib.dump(model_artifacts, MODEL_PATH, compress=3)
    print("\n✅ Phase 1 Complete! The highly optimized crop_model.pkl file is ready.")

if __name__ == "__main__":
    main()