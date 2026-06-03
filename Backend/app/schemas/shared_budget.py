from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SharedBudgetCreate(BaseModel):
    name: str
    description: Optional[str] = None
    limit_amount: float = 0.0
    member_emails: list[str] = []


class SharedBudgetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    limit_amount: Optional[float] = None


class MemberInfo(BaseModel):
    id: str
    name: str
    email: str

    class Config:
        from_attributes = True


class SharedBudgetResponse(BaseModel):
    id: str
    owner_id: str
    owner_name: str = ""
    name: str
    description: Optional[str] = None
    limit_amount: float
    locked: bool
    members: list[MemberInfo] = []
    spent: float = 0.0
    percentage: float = 0.0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AddMemberRequest(BaseModel):
    email: str
