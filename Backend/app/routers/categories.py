from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.Models.user import User
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.Services.category_service import CategoryService

router = APIRouter(prefix="/api/categories", tags=["Categories"])


@router.get("", response_model=list[CategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = CategoryService(db)
    cats = service.get_visible(current_user)
    result = []
    for c in cats:
        resp = CategoryResponse.model_validate(c)
        resp.transaction_count = service.get_transaction_count(c.id)
        result.append(resp)
    return result


@router.post("", response_model=CategoryResponse, status_code=201)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = CategoryService(db)
    cat = service.create(data, current_user)
    return CategoryResponse.model_validate(cat)


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: str,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = CategoryService(db)
    cat = service.update(category_id, data, current_user)
    return CategoryResponse.model_validate(cat)


@router.delete("/{category_id}")
def delete_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = CategoryService(db)
    service.delete(category_id, current_user)
    return {"detail": "Category deleted"}
