from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.user_roles import user_roles

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String)

    users = relationship(
        "User",
        secondary="user_roles",
        back_populates="roles",
        lazy="selectin"  # <------- Añade esto también
    )
