from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base

class FlowWindow(Base):
    __tablename__ = "flow_windows"

    timestamp = Column(DateTime, primary_key=True)
    total_bytes = Column(Float)
    conn_count = Column(Integer)
    avg_fan_out = Column(Float)
    dst_ip_entropy = Column(Float)
    anomaly_score = Column(Float)
    severity = Column(String)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime)
    severity = Column(String)
    reason = Column(String)
    status = Column(String, default="open")
