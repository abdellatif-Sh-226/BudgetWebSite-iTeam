from typing import Optional
from pydantic import BaseModel


class DataResponse(BaseModel):
    currentUser: Optional[dict] = None
    users: list[dict] = []
    categories: list[dict] = []
    transactions: list[dict] = []
    budgets: list[dict] = []
    sharedBudgets: list[dict] = []
    pendingTransactions: list[dict] = []
    notifications: list[dict] = []
    unreadCount: int = 0


class SaveRequest(BaseModel):
    data: list[dict]


class SaveResponse(BaseModel):
    success: bool = True
