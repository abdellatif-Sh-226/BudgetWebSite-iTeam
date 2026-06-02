from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class TransactionCreate(BaseModel):
    type: str = "expense"
    description: str
    amount: float
    date: date
    category_id: Optional[str] = None
    notes: Optional[str] = None
    destination_type: str = "wallet"
    destination_id: Optional[str] = None


class TransactionUpdate(BaseModel):
    type: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[date] = None
    category_id: Optional[str] = None
    notes: Optional[str] = None
    destination_type: Optional[str] = None
    destination_id: Optional[str] = None


class TransactionResponse(BaseModel):
    id: str
    user_id: str
    user_name: str = ""
    type: str
    description: str
    amount: float
    date: date
    category_id: Optional[str] = None
    category_name: str = ""
    category_color: str = ""
    notes: Optional[str] = None
    destination_type: str
    destination_id: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TransactionSummary(BaseModel):
    total_income: float = 0.0
    total_expense: float = 0.0
    balance: float = 0.0
    transaction_count: int = 0
