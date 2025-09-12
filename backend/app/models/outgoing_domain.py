from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class OutgoingDomain(Base):
    __tablename__ = "outgoing_domains"
    
    id = Column(Integer, primary_key=True)
    domain = Column(String(255), unique=True, nullable=False)
    smtp_host = Column(String(255))
    smtp_port = Column(Integer, default=587)
    smtp_user = Column(String(255))
    smtp_password = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    creator = relationship("User", back_populates="created_domains")
