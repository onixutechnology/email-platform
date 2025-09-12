from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    subject = Column(String)
    body = Column(Text)
    sender = Column(String)
    recipient = Column(String)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    mailbox_id = Column(Integer, ForeignKey("mailboxes.id"))

    mailbox = relationship("Mailbox")
