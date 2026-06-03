from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_admin
from app.Models.user import User
from app.Models.transaction import Transaction
from app.Models.budget import Budget
from app.Models.shared_budget import SharedBudget
from app.Models.category import Category
from app.Models.vote import Vote

router = APIRouter(prefix="/api/stats", tags=["Statistics"])


@router.get("")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.active == True).count()
    total_categories = db.query(Category).count()
    total_transactions = db.query(Transaction).count()
    pending_transactions = db.query(Transaction).filter(Transaction.status == "pending").count()
    total_budgets = db.query(Budget).count()
    total_shared = db.query(SharedBudget).count()
    open_votes = db.query(Vote).filter(Vote.status == "open").count()

    total_income = sum(t.amount for t in db.query(Transaction).filter(Transaction.type == "income").all())
    total_expense = sum(t.amount for t in db.query(Transaction).filter(Transaction.type == "expense", Transaction.status == "approved").all())

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_categories": total_categories,
        "total_transactions": total_transactions,
        "pending_transactions": pending_transactions,
        "total_budgets": total_budgets,
        "total_shared_budgets": total_shared,
        "open_votes": open_votes,
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "balance": round(total_income - total_expense, 2),
    }
