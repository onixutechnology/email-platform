from pydantic import BaseModel, EmailStr
from typing import Optional

class MailboxOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    provider: str
    auth_type: str
    settings: Optional[str]
    is_verified: bool

    class Config:
        orm_mode = True

class MailboxCreate(BaseModel):
    name: str
    email: EmailStr
    provider: str
    auth_type: str
    settings: Optional[str] = None
    owner_id: Optional[int] = None