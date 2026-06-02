from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    color: str = "#e94560"
    shared_budget_id: Optional[str] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class CategoryResponse(BaseModel):
    id: str
    name: str
    color: str
    owner_id: Optional[str] = None
    shared_budget_id: Optional[str] = None
    transaction_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
