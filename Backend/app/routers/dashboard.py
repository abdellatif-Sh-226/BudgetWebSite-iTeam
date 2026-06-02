from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.Models.user import User
from app.Models.transaction import Transaction
from app.Models.budget import Budget
from app.Models.shared_budget import SharedBudget
from app.Models.category import Category
from app.schemas.dashboard import DashboardResponse
from app.Services.vote_service import VoteService

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resp = DashboardResponse()

    txs_query = db.query(Transaction)
    if current_user.role != "admin":
        txs_query = txs_query.filter(Transaction.user_id == current_user.id)
    txs = txs_query.all()

    income = sum(t.amount for t in txs if t.type == "income")
    expense = sum(t.amount for t in txs if t.type == "expense" and t.status == "approved")
    resp.total_income = round(income, 2)
    resp.total_expense = round(expense, 2)
    resp.balance = round(income - expense, 2)
    resp.saving_rate = round(((income - expense) / income * 100) if income > 0 else 0, 1)
    resp.transaction_count = len(txs)

    budgets_query = db.query(Budget)
    if current_user.role != "admin":
        budgets_query = budgets_query.filter(Budget.user_id == current_user.id)
    budgets = budgets_query.all()
    resp.budget_count = len(budgets)

    for b in budgets:
        budget_spent = sum(
            t.amount for t in txs
            if t.type == "expense"
            and t.destination_type == "budget"
            and t.destination_id == b.id
            and (not b.category_id or t.category_id == b.category_id)
        )
        if b.limit_amount > 0:
            pct = (budget_spent / b.limit_amount) * 100
            if pct >= 100:
                resp.budget_alerts.append({
                    "budget_id": b.id,
                    "budget_name": b.name,
                    "type": "danger",
                    "message": f"Budget '{b.name}' exceeded! ({budget_spent:.2f} / {b.limit_amount:.2f})",
                    "spent": round(budget_spent, 2),
                    "limit": b.limit_amount,
                    "percentage": 100,
                })
            elif pct >= 80:
                resp.budget_alerts.append({
                    "budget_id": b.id,
                    "budget_name": b.name,
                    "type": "warning",
                    "message": f"Budget '{b.name}' at {pct:.0f}% — near limit",
                    "spent": round(budget_spent, 2),
                    "limit": b.limit_amount,
                    "percentage": round(pct, 1),
                })

    shared_query = db.query(SharedBudget)
    if current_user.role != "admin":
        from app.Models.shared_budget import shared_budget_members
        shared_query = shared_query.join(shared_budget_members).filter(shared_budget_members.c.user_id == current_user.id)
    resp.shared_budget_count = shared_query.count()

    vote_service = VoteService(db)
    resp.pending_votes = vote_service.get_pending_count(current_user)

    categories = db.query(Category).filter(
        Category.owner_id.is_(None),
        Category.shared_budget_id.is_(None),
    ).all()
    expense_by_cat = {}
    for c in categories:
        total = sum(
            t.amount for t in txs
            if t.type == "expense" and t.category_id == c.id
        )
        if total > 0:
            expense_by_cat[c.name] = {"total": round(total, 2), "color": c.color}
    resp.expense_by_category = [
        {"name": name, "total": data["total"], "color": data["color"]}
        for name, data in expense_by_cat.items()
    ]

    months = []
    for i in range(5, -1, -1):
        d = datetime.now() - timedelta(days=30 * i)
        months.append({"label": d.strftime("%b"), "year": d.year, "month": d.month})

    monthly_income = []
    monthly_expense = []
    for m in months:
        inc = sum(
            t.amount for t in txs
            if t.type == "income"
            and t.date.month == m["month"]
            and t.date.year == m["year"]
        )
        exp = sum(
            t.amount for t in txs
            if t.type == "expense"
            and t.date.month == m["month"]
            and t.date.year == m["year"]
        )
        monthly_income.append(round(inc, 2))
        monthly_expense.append(round(exp, 2))

    resp.monthly_trend = [
        {"label": months[i]["label"], "income": monthly_income[i], "expense": monthly_expense[i]}
        for i in range(len(months))
    ]

    recent = sorted(txs, key=lambda t: t.date, reverse=True)[:6]
    resp.recent_transactions = [
        {
            "id": t.id,
            "description": t.description,
            "amount": t.amount,
            "type": t.type,
            "date": str(t.date),
            "category_id": t.category_id,
            "user_id": t.user_id,
        }
        for t in recent
    ]

    if current_user.role == "admin":
        from app.Models.user import User as UserModel
        resp.member_count = db.query(UserModel).count()
    else:
        resp.member_count = 1

    return resp
