from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.Models.budget import Budget
from app.Models.transaction import Transaction
from app.Models.user import User
from app.schemas.budget import BudgetCreate, BudgetUpdate
from app.Services.activity_service import ActivityService


class BudgetService:
    def __init__(self, db: Session):
        self.db = db

    def get_visible(self, user: User) -> list[Budget]:
        if user.role == "admin":
            return self.db.query(Budget).order_by(Budget.created_at.desc()).all()
        return self.db.query(Budget).filter(Budget.user_id == user.id).order_by(Budget.created_at.desc()).all()

    def get_by_id(self, budget_id: str) -> Budget:
        budget = self.db.query(Budget).filter(Budget.id == budget_id).first()
        if not budget:
            raise HTTPException(status_code=404, detail="Budget not found")
        return budget

    def get_spent(self, budget: Budget) -> float:
        total = (
            self.db.query(Transaction)
            .filter(
                Transaction.type == "expense",
                Transaction.destination_type == "budget",
                Transaction.destination_id == budget.id,
            )
        )
        if budget.category_id:
            total = total.filter(Transaction.category_id == budget.category_id)
        return sum(t.amount for t in total.all())

    def create(self, data: BudgetCreate, user: User) -> Budget:
        budget = Budget(
            user_id=user.id,
            name=data.name,
            period=data.period,
            limit_amount=data.limit_amount,
            category_id=data.category_id,
            start_date=data.start_date,
            end_date=data.end_date,
        )
        self.db.add(budget)
        self.db.commit()
        self.db.refresh(budget)
        ActivityService.log(self.db, user.id, "budget.created", "Budget", budget.id, f"Budget '{budget.name}' created")
        return budget

    def update(self, budget_id: str, data: BudgetUpdate, user: User) -> Budget:
        budget = self.get_by_id(budget_id)
        if budget.user_id != user.id and user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to update this budget")
        if data.name is not None:
            budget.name = data.name
        if data.period is not None:
            budget.period = data.period
        if data.limit_amount is not None:
            budget.limit_amount = data.limit_amount
        if data.category_id is not None:
            budget.category_id = data.category_id
        if data.start_date is not None:
            budget.start_date = data.start_date
        if data.end_date is not None:
            budget.end_date = data.end_date
        self.db.commit()
        self.db.refresh(budget)
        ActivityService.log(self.db, user.id, "budget.updated", "Budget", budget.id, f"Budget '{budget.name}' updated")
        return budget

    def delete(self, budget_id: str, user: User) -> None:
        budget = self.get_by_id(budget_id)
        if budget.user_id != user.id and user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to delete this budget")
        self.db.delete(budget)
        self.db.commit()
        ActivityService.log(self.db, user.id, "budget.deleted", "Budget", budget_id, f"Budget '{budget.name}' deleted")
