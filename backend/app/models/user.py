from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from app.models.user_roles import user_roles

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_domains = relationship("OutgoingDomain", back_populates="creator")  # ← CORREGIDO
    
    roles = relationship(
        "Role",
        secondary="user_roles",
        back_populates="users",
        lazy="selectin"
    )
    mailboxes = relationship(
        "Mailbox",
        back_populates="owner"
    )
