from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Mailbox(Base):
    __tablename__ = "mailboxes"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String, nullable=False)
    provider = Column(String, nullable=False)  # 'gmail', 'ses', 'mailgun'
    auth_type = Column(String, nullable=False) # 'oauth2', 'smtp'
    settings = Column(String)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="mailboxes")
