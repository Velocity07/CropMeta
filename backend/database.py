from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

# Creates a local SQLite file named "agriculture.db" in the backend folder
SQLALCHEMY_DATABASE_URL = "sqlite:///./backend/agriculture.db"

# connect_args={"check_same_thread": False} is required for SQLite with FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Define the SQL table schema for logging predictions
class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id = Column(Integer, primary_key=True, index=True)
    nitrogen = Column(Float)
    phosphorus = Column(Float)
    potassium = Column(Float)
    temperature = Column(Float)
    humidity = Column(Float)
    ph = Column(Float)
    rainfall = Column(Float)
    predicted_crop = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

# Generate the table in the database
Base.metadata.create_all(bind=engine)

# Dependency to get the DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()