from pydantic import BaseModel, Field

# This model ensures the frontend sends the exact right data types and ranges
class CropFeatures(BaseModel):
    N: float = Field(..., description="Nitrogen content in soil")
    P: float = Field(..., description="Phosphorus content in soil")
    K: float = Field(..., description="Potassium content in soil")
    temperature: float = Field(..., description="Temperature in Celsius")
    humidity: float = Field(..., description="Relative humidity in %")
    ph: float = Field(..., ge=0, le=14, description="ph value of the soil")
    rainfall: float = Field(..., description="Rainfall in mm")

class PredictionResponse(BaseModel):
    crop: str
    confidence: str