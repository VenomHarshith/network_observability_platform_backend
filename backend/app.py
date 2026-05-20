from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware


from database import SessionLocal, engine
import models
from ml_pipeline import run_pipeline

# Create DB tables
models.Base.metadata.create_all(bind=engine)

# THIS VARIABLE NAME IS CRITICAL
app = FastAPI(title="Network Observability Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/run")
def run(db: Session = Depends(get_db)):
    run_pipeline(db)
    return {"status": "pipeline executed"}

@app.get("/metrics")
def metrics(db: Session = Depends(get_db)):
    return db.query(models.FlowWindow).all()

@app.get("/alerts")
def alerts(db: Session = Depends(get_db)):
    return db.query(models.Alert).all()
