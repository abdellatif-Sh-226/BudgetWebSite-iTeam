from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class BudgetCreate(BaseModel):
    name: str
    period: str = "monthly"
    limit_amount: float = 0.0
    category_id: Optional[str] = None
    start_date: date
    end_date: date


class BudgetUpdate(BaseModel):
    name: Optional[str] = None
    period: Optional[str] = None
    limit_amount: Optional[float] = None
    category_id: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class BudgetResponse(BaseModel):
    id: str
    user_id: str
    name: str
    period: str
    limit_amount: float
    category_id: Optional[str] = None
    start_date: date
    end_date: date
    spent: float = 0.0
    percentage: float = 0.0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BudgetSummary(BaseModel):
    total_budgets: int
    total_limit: float
    total_spent: float
    average_percentage: float
