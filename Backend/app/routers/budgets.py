from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.Models.user import User
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse
from app.Services.budget_service import BudgetService

router = APIRouter(prefix="/api/budgets", tags=["Budgets"])


@router.get("", response_model=list[BudgetResponse])
def list_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = BudgetService(db)
    budgets = service.get_visible(current_user)
    result = []
    for b in budgets:
        spent = service.get_spent(b)
        pct = (spent / b.limit_amount * 100) if b.limit_amount > 0 else 0
        resp = BudgetResponse.model_validate(b)
        resp.spent = spent
        resp.percentage = round(min(pct, 100), 1)
        result.append(resp)
    return result


@router.get("/{budget_id}", response_model=BudgetResponse)
def get_budget(
    budget_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = BudgetService(db)
    b = service.get_by_id(budget_id)
    spent = service.get_spent(b)
    pct = (spent / b.limit_amount * 100) if b.limit_amount > 0 else 0
    resp = BudgetResponse.model_validate(b)
    resp.spent = spent
    resp.percentage = round(min(pct, 100), 1)
    return resp


@router.post("", response_model=BudgetResponse, status_code=201)
def create_budget(
    data: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = BudgetService(db)
    b = service.create(data, current_user)
    return BudgetResponse.model_validate(b)


@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: str,
    data: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = BudgetService(db)
    b = service.update(budget_id, data, current_user)
    return BudgetResponse.model_validate(b)


@router.delete("/{budget_id}")
def delete_budget(
    budget_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = BudgetService(db)
    service.delete(budget_id, current_user)
    return {"detail": "Budget deleted"}
