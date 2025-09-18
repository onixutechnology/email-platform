from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class EmailLog(Base):
    __tablename__ = "email_logs"
    
    id = Column(Integer, primary_key=True)
    to_email = Column(String(255), nullable=False)
    from_email = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    body = Column(Text)
    status = Column(String(50), default="pending")
    error_message = Column(Text)
    sent_by = Column(Integer, ForeignKey("users.id"))
    mailbox_id = Column(Integer, ForeignKey("mailboxes.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # ✅ NUEVOS CAMPOS PARA TRACKING AVANZADO
    opened_at = Column(DateTime, nullable=True)
    open_count = Column(Integer, default=0)
    last_opened_at = Column(DateTime, nullable=True)
    tracking_data = Column(JSON, nullable=True)  # Datos del navegador, IP, etc.
    
    sender = relationship("User")
    mailbox = relationship("Mailbox")
