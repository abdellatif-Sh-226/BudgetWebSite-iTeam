from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.Models.user import User
from app.schemas.shared_budget import SharedBudgetCreate, SharedBudgetUpdate, SharedBudgetResponse, AddMemberRequest
from app.Services.shared_budget_service import SharedBudgetService

router = APIRouter(prefix="/api/shared-budgets", tags=["Shared Budgets"])


@router.get("", response_model=list[SharedBudgetResponse])
def list_shared_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = SharedBudgetService(db)
    shared_list = service.get_visible(current_user)
    result = []
    for s in shared_list:
        spent = service.get_spent(s)
        pct = (spent / s.limit_amount * 100) if s.limit_amount > 0 else 0
        resp = SharedBudgetResponse.model_validate(s)
        resp.owner_name = s.owner.name if s.owner else ""
        resp.members = [{"id": m.id, "name": m.name, "email": m.email} for m in s.members]
        resp.spent = spent
        resp.percentage = round(min(pct, 100), 1)
        result.append(resp)
    return result


@router.post("", response_model=SharedBudgetResponse, status_code=201)
def create_shared_budget(
    data: SharedBudgetCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = SharedBudgetService(db)
    sb = service.create(data, current_user, background_tasks)
    resp = SharedBudgetResponse.model_validate(sb)
    resp.owner_name = sb.owner.name if sb.owner else ""
    resp.members = [{"id": m.id, "name": m.name, "email": m.email} for m in sb.members]
    return resp


@router.get("/{shared_id}", response_model=SharedBudgetResponse)
def get_shared_budget(
    shared_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = SharedBudgetService(db)
    s = service.get_by_id(shared_id)
    spent = service.get_spent(s)
    pct = (spent / s.limit_amount * 100) if s.limit_amount > 0 else 0
    resp = SharedBudgetResponse.model_validate(s)
    resp.owner_name = s.owner.name if s.owner else ""
    resp.members = [{"id": m.id, "name": m.name, "email": m.email} for m in s.members]
    resp.spent = spent
    resp.percentage = round(min(pct, 100), 1)
    return resp


@router.put("/{shared_id}", response_model=SharedBudgetResponse)
def update_shared_budget(
    shared_id: str,
    data: SharedBudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = SharedBudgetService(db)
    s = service.update(shared_id, data, current_user)
    resp = SharedBudgetResponse.model_validate(s)
    resp.owner_name = s.owner.name if s.owner else ""
    resp.members = [{"id": m.id, "name": m.name, "email": m.email} for m in s.members]
    return resp


@router.delete("/{shared_id}")
def delete_shared_budget(
    shared_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = SharedBudgetService(db)
    service.delete(shared_id, current_user)
    return {"detail": "Shared budget deleted"}


@router.post("/{shared_id}/members", response_model=SharedBudgetResponse)
def add_member(
    shared_id: str,
    data: AddMemberRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = SharedBudgetService(db)
    s = service.add_member(shared_id, data.email, current_user, background_tasks)
    resp = SharedBudgetResponse.model_validate(s)
    resp.owner_name = s.owner.name if s.owner else ""
    resp.members = [{"id": m.id, "name": m.name, "email": m.email} for m in s.members]
    return resp


@router.delete("/{shared_id}/members/{user_id}", response_model=SharedBudgetResponse)
def remove_member(
    shared_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = SharedBudgetService(db)
    s = service.remove_member(shared_id, user_id, current_user)
    resp = SharedBudgetResponse.model_validate(s)
    resp.owner_name = s.owner.name if s.owner else ""
    resp.members = [{"id": m.id, "name": m.name, "email": m.email} for m in s.members]
    return resp
