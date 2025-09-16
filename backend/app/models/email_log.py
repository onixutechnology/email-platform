from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from sqlalchemy import Column, DateTime

class EmailLog(Base):
    __tablename__ = "email_logs"
    
    id = Column(Integer, primary_key=True)
    to_email = Column(String(255), nullable=False)
    from_email = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    body = Column(Text)
    status = Column(String(50), default="pending")  # pending, sent, failed
    error_message = Column(Text)
    sent_by = Column(Integer, ForeignKey("users.id"))
    mailbox_id = Column(Integer, ForeignKey("mailboxes.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    opened_at = Column(DateTime, nullable=True)
    sender = relationship("User")
    mailbox = relationship("Mailbox")
