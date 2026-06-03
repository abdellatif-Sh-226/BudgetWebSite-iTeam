import uuid
from datetime import datetime, date
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.Models.pending_transaction import PendingTransaction
from app.Models.pending_approval import PendingApproval
from app.Models.notification import Notification
from app.Models.user import User
from app.Models.shared_budget import shared_budget_members
from app.Services.activity_service import ActivityService


class PendingService:
    def __init__(self, db: Session):
        self.db = db

    def get_visible(self, user_id: str) -> list[dict]:
        rows = (
            self.db.query(PendingTransaction)
            .join(
                shared_budget_members,
                shared_budget_members.c.shared_budget_id == PendingTransaction.group_id,
            )
            .filter(shared_budget_members.c.user_id == user_id)
            .order_by(PendingTransaction.created_at.desc())
            .all()
        )
        result = []
        for pt in rows:
            item = self._to_frontend(pt)
            approvals = (
                self.db.query(PendingApproval)
                .filter(PendingApproval.pending_transaction_id == pt.id)
                .all()
            )
            item["approvals"] = [
                {
                    "id": a.id,
                    "pending_transaction_id": a.pending_transaction_id,
                    "user_id": a.user_id,
                    "status": a.status,
                    "responded_at": a.responded_at.isoformat() if a.responded_at else None,
                }
                for a in approvals
            ]
            result.append(item)
        return result

    def create_pending(self, data: dict, current_user: User) -> dict:
        group_id = data["groupId"]
        desc = data.get("desc", "")
        amount = data.get("amount", 0)
        raw_date = data.get("date", datetime.now().strftime("%Y-%m-%d"))
        date_val = datetime.fromisoformat(raw_date).date() if isinstance(raw_date, str) else raw_date
        cat_id = data.get("catId")
        notes = data.get("notes", "")

        from app.Models.shared_budget import SharedBudget
        shared = self.db.query(SharedBudget).filter(SharedBudget.id == group_id).first()
        if not shared or current_user not in shared.members:
            raise HTTPException(status_code=403, detail="You are not a member of this group")

        pending_id = data.get("id", str(uuid.uuid4()))

        pt = PendingTransaction(
            id=pending_id,
            group_id=group_id,
            user_id=current_user.id,
            type="expense",
            description=desc,
            amount=amount,
            date=date_val,
            category_id=cat_id,
            notes=notes,
            status="pending",
        )
        self.db.add(pt)

        other_members = [m for m in shared.members if m.id != current_user.id]
        for m in other_members:
            approval = PendingApproval(
                id=str(uuid.uuid4()),
                pending_transaction_id=pending_id,
                user_id=m.id,
                status="pending",
            )
            self.db.add(approval)

            creator = self.db.query(User).filter(User.id == current_user.id).first()
            notif = Notification(
                id=str(uuid.uuid4()),
                user_id=m.id,
                type="pending_approval",
                title="Approbation requise",
                message=(
                    f"{creator.name} a ajouté une dépense de {amount:.2f} TND"
                    f" (« {desc} ») dans le budget partagé."
                ),
                related_id=pending_id,
            )
            self.db.add(notif)

        creator_notif = Notification(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            type="info",
            title="Demande envoyée",
            message=(
                f"Votre dépense « {desc} » de {amount:.2f} TND"
                f" est en attente d'approbation par les membres du groupe."
            ),
            related_id=pending_id,
        )
        self.db.add(creator_notif)

        self.db.commit()
        ActivityService.log(self.db, current_user.id, "pending.created", "PendingTransaction", pending_id, f"Pending transaction '{desc}' created")
        return {"success": True, "pendingId": pending_id}

    def approve(self, pending_id: str, action: str, current_user: User) -> dict:
        from app.Models.shared_budget import SharedBudget

        pt = self.db.query(PendingTransaction).filter(PendingTransaction.id == pending_id).first()
        if not pt:
            raise HTTPException(status_code=404, detail="Pending transaction not found")

        approval = (
            self.db.query(PendingApproval)
            .filter(
                PendingApproval.pending_transaction_id == pending_id,
                PendingApproval.user_id == current_user.id,
            )
            .first()
        )
        if not approval:
            raise HTTPException(status_code=403, detail="No pending approval found for this user")
        if approval.status != "pending":
            raise HTTPException(status_code=400, detail="You have already responded to this request")

        approval.status = action
        approval.responded_at = datetime.utcnow()
        self.db.flush()

        shared = self.db.query(SharedBudget).filter(SharedBudget.id == pt.group_id).first()
        all_members = shared.members if shared else []

        if action == "reject":
            pt.status = "rejected"
            rejector = self.db.query(User).filter(User.id == current_user.id).first()
            rejector_name = rejector.name if rejector else "Unknown"

            for m in all_members:
                if m.id == pt.user_id:
                    msg = f"{rejector_name} a refusé votre dépense « {pt.description} » de {pt.amount:.2f} TND."
                else:
                    msg = f"{rejector_name} a refusé la dépense « {pt.description} » de {pt.amount:.2f} TND."
                notif = Notification(
                    id=str(uuid.uuid4()),
                    user_id=m.id,
                    type="rejected",
                    title="Dépense refusée",
                    message=msg,
                    related_id=pending_id,
                )
                self.db.add(notif)

        else:
            remaining = (
                self.db.query(PendingApproval)
                .filter(
                    PendingApproval.pending_transaction_id == pending_id,
                    PendingApproval.status == "pending",
                )
                .count()
            )
            if remaining == 0:
                pt.status = "approved"
                from app.Models.transaction import Transaction
                tx = Transaction(
                    id="tx" + str(uuid.uuid4()).replace("-", ""),
                    user_id=pt.user_id,
                    type=pt.type,
                    description=pt.description,
                    amount=pt.amount,
                    date=pt.date,
                    category_id=pt.category_id,
                    notes=pt.notes,
                    destination_type="group",
                    destination_id=pt.group_id,
                    status="approved",
                )
                self.db.add(tx)

                for m in all_members:
                    notif = Notification(
                        id=str(uuid.uuid4()),
                        user_id=m.id,
                        type="approved",
                        title="Dépense approuvée",
                        message=f"La dépense « {pt.description} » de {pt.amount:.2f} TND a été approuvée par tous les membres.",
                        related_id=tx.id,
                    )
                    self.db.add(notif)

        self.db.commit()
        status = pt.status
        return {"success": True, "status": status}

    def _to_frontend(self, pt: PendingTransaction) -> dict:
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
            "createdAt": pt.created_at.isoformat() if pt.created_at else None,
            "updatedAt": pt.updated_at.isoformat() if pt.updated_at else None,
        }
