from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.Models.user import User
from app.Models.category import Category
from app.Models.transaction import Transaction
from app.Models.budget import Budget
from app.Models.shared_budget import SharedBudget, shared_budget_members
from app.Services.activity_service import ActivityService


def _parse_date(val):
    if val is None:
        return None
    if isinstance(val, date):
        return val
    return datetime.fromisoformat(val).date()


router = APIRouter(tags=["Save"])


@router.post("/api/save/{entity}")
def save_entity(
    entity: str,
    body: list[dict],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        if entity == "users":
            _save_users(db, body, current_user)
        elif entity == "categories":
            _save_categories(db, body, current_user)
        elif entity == "transactions":
            _save_transactions(db, body, current_user)
        elif entity == "budgets":
            _save_budgets(db, body, current_user)
        elif entity == "sharedBudgets":
            _save_shared_budgets(db, body, current_user)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown entity: {entity}")

        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Unable to save data: {str(e)}")


def _save_users(db: Session, items: list[dict], current_user: User):
    from app.Services.auth_service import AuthService as AuthSvc
    from app.schemas.user import UserCreate as UserCreateSchema
    import uuid

    for item in items:
        existing = db.query(User).filter(User.id == item["id"]).first()
        if existing:
            existing.name = item.get("name", existing.name)
            existing.email = item.get("email", existing.email)
            if item.get("pwd"):
                existing.password = AuthSvc.hash_password(item["pwd"])
            existing.role = item.get("role", existing.role)
            existing.active = item.get("active", existing.active)
            existing.delete_request = item.get("deleteRequest", existing.delete_request)
        else:
            user = User(
                id=item.get("id", str(uuid.uuid4())),
                name=item.get("name", ""),
                email=item.get("email", ""),
                password=AuthSvc.hash_password(item.get("pwd", "changeme123")),
                role=item.get("role", "user"),
                active=item.get("active", True),
                delete_request=item.get("deleteRequest", False),
            )
            db.add(user)
    db.commit()


def _save_categories(db: Session, items: list[dict], current_user: User):
    for item in items:
        existing = db.query(Category).filter(Category.id == item["id"]).first()
        if existing:
            existing.name = item.get("name", existing.name)
            existing.color = item.get("color", existing.color)
            existing.owner_id = item.get("ownerId", existing.owner_id)
            existing.shared_budget_id = item.get("groupId", existing.shared_budget_id)
        else:
            cat = Category(
                id=item["id"],
                name=item.get("name", ""),
                color=item.get("color", "#e94560"),
                owner_id=item.get("ownerId"),
                shared_budget_id=item.get("groupId"),
            )
            db.add(cat)
    db.commit()


def _save_transactions(db: Session, items: list[dict], current_user: User):
    for item in items:
        existing = db.query(Transaction).filter(Transaction.id == item["id"]).first()

        dest_type = "wallet"
        dest_id = None
        raw_dest = item.get("dest", "wallet")
        if raw_dest and raw_dest != "wallet":
            parts = raw_dest.split("-", 1)
            if len(parts) == 2:
                dest_type = parts[0]
                dest_id = parts[1]

        tx_date = _parse_date(item.get("date"))

        if existing:
            existing.type = item.get("type", existing.type)
            existing.description = item.get("desc", existing.description)
            existing.amount = item.get("amount", existing.amount)
            existing.date = tx_date or existing.date
            existing.category_id = item.get("catId", existing.category_id)
            existing.notes = item.get("notes", existing.notes)
            existing.destination_type = dest_type
            existing.destination_id = dest_id
        else:
            tx = Transaction(
                id=item["id"],
                user_id=item.get("userId", current_user.id),
                type=item.get("type", "expense"),
                description=item.get("desc", ""),
                amount=item.get("amount", 0),
                date=tx_date,
                category_id=item.get("catId"),
                notes=item.get("notes", ""),
                destination_type=dest_type,
                destination_id=dest_id,
                status="approved",
            )
            db.add(tx)
    db.commit()


def _save_budgets(db: Session, items: list[dict], current_user: User):
    for item in items:
        start = _parse_date(item.get("start"))
        end = _parse_date(item.get("end"))
        existing = db.query(Budget).filter(Budget.id == item["id"]).first()
        if existing:
            existing.name = item.get("name", existing.name)
            existing.period = item.get("period", existing.period)
            existing.limit_amount = item.get("limit", existing.limit_amount)
            existing.category_id = item.get("catId", existing.category_id)
            existing.start_date = start or existing.start_date
            existing.end_date = end or existing.end_date
        else:
            budget = Budget(
                id=item["id"],
                user_id=item.get("userId", current_user.id),
                name=item.get("name", ""),
                period=item.get("period", "monthly"),
                limit_amount=item.get("limit", 0),
                category_id=item.get("catId"),
                start_date=start,
                end_date=end,
            )
            db.add(budget)
    db.commit()


def _save_shared_budgets(db: Session, items: list[dict], current_user: User):
    for item in items:
        existing = db.query(SharedBudget).filter(SharedBudget.id == item["id"]).first()
        if existing:
            existing.name = item.get("name", existing.name)
            existing.description = item.get("desc", existing.description)
            existing.limit_amount = item.get("limit", existing.limit_amount)
            existing.owner_id = item.get("ownerId", existing.owner_id)
            existing.locked = item.get("locked", existing.locked)
        else:
            sb = SharedBudget(
                id=item["id"],
                owner_id=item.get("ownerId", current_user.id),
                name=item.get("name", ""),
                description=item.get("desc", ""),
                limit_amount=item.get("limit", 0),
                locked=item.get("locked", True),
            )
            db.add(sb)

        member_ids = item.get("members", [])
        if not existing:
            db.flush()
        if member_ids:
            target = existing or sb
            db.query(shared_budget_members).filter(
                shared_budget_members.c.shared_budget_id == target.id
            ).delete()
            users = db.query(User).filter(User.id.in_(member_ids)).all()
            for u in users:
                target.members.append(u)

    db.commit()
