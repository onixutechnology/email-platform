from pydantic import BaseModel, EmailStr, ConfigDict
from typing import List, Optional
from datetime import datetime


class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    full_name: Optional[str] = None
    password: str


class UserOut(UserBase):
    id: int
    full_name: Optional[str] = None  # Opcional, no todos los usuarios tienen nombre completo
    is_active: bool
    created_at: datetime
    roles: List[str] = []  # Lista vacía por defecto para evitar errores de lazy loading
    
    # Pydantic V2 - Reemplaza orm_mode = True
    model_config = ConfigDict(from_attributes=True)


class UserInDB(UserBase):
    id: int
    full_name: Optional[str] = None
    hashed_password: str
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    
    model_config = ConfigDict(from_attributes=True)
