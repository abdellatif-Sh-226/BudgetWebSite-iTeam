from typing import Optional
from pydantic import BaseModel


class CreatePendingRequest(BaseModel):
    id: str
    groupId: str
    desc: str = ""
    amount: float = 0
    date: str = ""
    catId: Optional[str] = None
    notes: str = ""


class PendingResponse(BaseModel):
    success: bool = True
    pendingId: Optional[str] = None


class ApproveRequest(BaseModel):
    id: str
    action: str


class ApproveResponse(BaseModel):
    success: bool = True
    status: Optional[str] = None
