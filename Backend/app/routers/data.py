from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.Models.user import User
from app.Models.category import Category
from app.Models.transaction import Transaction
from app.Models.budget import Budget
from app.Models.shared_budget import SharedBudget, shared_budget_members
from app.Models.pending_transaction import PendingTransaction
from app.Models.pending_approval import PendingApproval
from app.Models.notification import Notification
from app.schemas.data import DataResponse
from app.Services.notification_service import NotificationService

router = APIRouter(tags=["Data"])


@router.get("/api/data", response_model=DataResponse)
def get_all_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    categories = db.query(Category).order_by(Category.name).all()
    transactions = db.query(Transaction).order_by(Transaction.date.desc()).all()
    budgets = db.query(Budget).order_by(Budget.created_at.desc()).all()

    shared_raw = db.query(SharedBudget).order_by(SharedBudget.created_at.desc()).all()

    pending_rows = (
        db.query(PendingTransaction)
        .join(
            shared_budget_members,
            shared_budget_members.c.shared_budget_id == PendingTransaction.group_id,
        )
        .filter(shared_budget_members.c.user_id == current_user.id)
        .order_by(PendingTransaction.created_at.desc())
        .all()
    )

    notif_service = NotificationService(db)
    notif_data = notif_service.get_for_user(current_user.id, include_read=True)

    return DataResponse(
        currentUser=_user_to_frontend(current_user),
        users=[_user_to_frontend(u) for u in users],
        categories=[_cat_to_frontend(c) for c in categories],
        transactions=[_tx_to_frontend(t) for t in transactions],
        budgets=[_budget_to_frontend(b) for b in budgets],
        sharedBudgets=[_shared_to_frontend(s, db) for s in shared_raw],
        pendingTransactions=[_pending_to_frontend(pt, db) for pt in pending_rows],
        notifications=notif_data["notifications"],
        unreadCount=notif_data["unreadCount"],
    )


def _user_to_frontend(u: User) -> dict:
    return {
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "pwd": "",
        "role": u.role,
        "active": u.active if u.active is not None else True,
        "deleteRequest": u.delete_request if u.delete_request is not None else False,
        "createdAt": u.created_at.isoformat() if u.created_at else None,
        "updatedAt": u.updated_at.isoformat() if u.updated_at else None,
    }


def _cat_to_frontend(c: Category) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "color": c.color,
        "ownerId": c.owner_id,
        "groupId": c.shared_budget_id,
        "createdAt": c.created_at.isoformat() if c.created_at else None,
        "updatedAt": c.updated_at.isoformat() if c.updated_at else None,
    }


def _tx_to_frontend(t: Transaction) -> dict:
    dest = "wallet"
    if t.destination_type and t.destination_type != "wallet":
        dest = f"{t.destination_type}-{t.destination_id}" if t.destination_id else t.destination_type
    return {
        "id": t.id,
        "userId": t.user_id,
        "type": t.type,
        "desc": t.description,
        "amount": t.amount,
        "date": str(t.date) if t.date else None,
        "catId": t.category_id,
        "notes": t.notes or "",
        "dest": dest,
        "createdAt": t.created_at.isoformat() if t.created_at else None,
        "updatedAt": t.updated_at.isoformat() if t.updated_at else None,
    }


def _budget_to_frontend(b: Budget) -> dict:
    return {
        "id": b.id,
        "userId": b.user_id,
        "name": b.name,
        "period": b.period,
        "limit": b.limit_amount,
        "catId": b.category_id or "",
        "start": str(b.start_date) if b.start_date else None,
        "end": str(b.end_date) if b.end_date else None,
        "createdAt": b.created_at.isoformat() if b.created_at else None,
        "updatedAt": b.updated_at.isoformat() if b.updated_at else None,
    }


def _shared_to_frontend(s: SharedBudget, db: Session) -> dict:
    member_ids = [m.id for m in s.members]
    return {
        "id": s.id,
        "ownerId": s.owner_id,
        "name": s.name,
        "desc": s.description or "",
        "limit": s.limit_amount,
        "locked": s.locked if s.locked is not None else True,
        "members": member_ids,
        "createdAt": s.created_at.isoformat() if s.created_at else None,
        "updatedAt": s.updated_at.isoformat() if s.updated_at else None,
    }


def _pending_to_frontend(pt: PendingTransaction, db: Session) -> dict:
    approvals = (
        db.query(PendingApproval)
        .filter(PendingApproval.pending_transaction_id == pt.id)
        .all()
    )
    return {
        "id": pt.id,
        "groupId": pt.group_id,
        "userId": pt.user_id,
        "type": pt.type,
        "desc": pt.description,
        "amount": pt.amount,
        "date": str(pt.date) if pt.date else None,
        "catId": pt.category_id,
        "notes": pt.notes or "",
        "status": pt.status,
        "approvals": [
            {
                "id": a.id,
                "pending_transaction_id": a.pending_transaction_id,
                "user_id": a.user_id,
                "status": a.status,
                "responded_at": a.responded_at.isoformat() if a.responded_at else None,
            }
            for a in approvals
        ],
        "createdAt": pt.created_at.isoformat() if pt.created_at else None,
        "updatedAt": pt.updated_at.isoformat() if pt.updated_at else None,
    }
