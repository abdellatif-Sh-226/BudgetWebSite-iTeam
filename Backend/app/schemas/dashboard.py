from pydantic import BaseModel


class DashboardResponse(BaseModel):
    total_income: float = 0.0
    total_expense: float = 0.0
    balance: float = 0.0
    saving_rate: float = 0.0
    budget_count: int = 0
    budget_alerts: list[dict] = []
    transaction_count: int = 0
    shared_budget_count: int = 0
    pending_votes: int = 0
    expense_by_category: list[dict] = []
    monthly_trend: list[dict] = []
    recent_transactions: list[dict] = []
    member_count: int = 0
