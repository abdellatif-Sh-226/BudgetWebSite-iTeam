from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.Models.category import Category
from app.Models.user import User
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.Services.activity_service import ActivityService


class CategoryService:
    def __init__(self, db: Session):
        self.db = db

    def get_visible(self, user: User) -> list[Category]:
        base = self.db.query(Category).filter(Category.owner_id.is_(None), Category.shared_budget_id.is_(None))
        personal = self.db.query(Category).filter(Category.owner_id == user.id)
        return base.union(personal).order_by(Category.name).all()

    def get_by_id(self, category_id: str) -> Category:
        cat = self.db.query(Category).filter(Category.id == category_id).first()
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")
        return cat

    def create(self, data: CategoryCreate, user: User) -> Category:
        cat = Category(
            name=data.name,
            color=data.color,
            owner_id=None if user.role == "admin" else user.id,
            shared_budget_id=data.shared_budget_id,
        )
        self.db.add(cat)
        self.db.commit()
        self.db.refresh(cat)
        ActivityService.log(self.db, user.id, "category.created", "Category", cat.id, f"Category '{cat.name}' created")
        return cat

    def update(self, category_id: str, data: CategoryUpdate, user: User) -> Category:
        cat = self.get_by_id(category_id)
        if cat.owner_id and cat.owner_id != user.id and user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to update this category")
        if data.name is not None:
            cat.name = data.name
        if data.color is not None:
            cat.color = data.color
        self.db.commit()
        self.db.refresh(cat)
        ActivityService.log(self.db, user.id, "category.updated", "Category", cat.id, f"Category '{cat.name}' updated")
        return cat

    def delete(self, category_id: str, user: User) -> None:
        cat = self.get_by_id(category_id)
        if cat.owner_id and cat.owner_id != user.id and user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to delete this category")
        self.db.delete(cat)
        self.db.commit()
        ActivityService.log(self.db, user.id, "category.deleted", "Category", category_id, f"Category '{cat.name}' deleted")

    def get_transaction_count(self, category_id: str) -> int:
        from app.Models.transaction import Transaction
        return self.db.query(Transaction).filter(Transaction.category_id == category_id).count()
