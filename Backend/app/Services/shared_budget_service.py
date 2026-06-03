from fastapi import BackgroundTasks, HTTPException
from sqlalchemy.orm import Session

from app.Models.shared_budget import SharedBudget, shared_budget_members
from app.Models.transaction import Transaction
from app.Models.user import User
from app.schemas.shared_budget import SharedBudgetCreate, SharedBudgetUpdate
from app.Services.activity_service import ActivityService
from app.Services.email_service import email_service


class SharedBudgetService:
    def __init__(self, db: Session):
        self.db = db

    def get_visible(self, user: User) -> list[SharedBudget]:
        if user.role == "admin":
            return self.db.query(SharedBudget).order_by(SharedBudget.created_at.desc()).all()
        return (
            self.db.query(SharedBudget)
            .join(shared_budget_members)
            .filter(shared_budget_members.c.user_id == user.id)
            .order_by(SharedBudget.created_at.desc())
            .all()
        )

    def get_by_id(self, shared_id: str) -> SharedBudget:
        sb = self.db.query(SharedBudget).filter(SharedBudget.id == shared_id).first()
        if not sb:
            raise HTTPException(status_code=404, detail="Shared budget not found")
        return sb

    def get_spent(self, shared: SharedBudget) -> float:
        member_ids = [m.id for m in shared.members]
        total = (
            self.db.query(Transaction)
            .filter(
                Transaction.type == "expense",
                Transaction.destination_type == "shared",
                Transaction.destination_id == shared.id,
                Transaction.user_id.in_(member_ids),
                Transaction.status == "approved",
            )
            .all()
        )
        return sum(t.amount for t in total)

    def create(self, data: SharedBudgetCreate, user: User, background_tasks: BackgroundTasks) -> SharedBudget:
        sb = SharedBudget(
            owner_id=user.id,
            name=data.name,
            description=data.description,
            limit_amount=data.limit_amount,
        )
        sb.members.append(user)

        if data.member_emails:
            members = (
                self.db.query(User)
                .filter(User.email.in_(data.member_emails))
                .all()
            )
            found_emails = {m.email for m in members}
            for email in data.member_emails:
                if email not in found_emails:
                    raise HTTPException(status_code=400, detail=f"User with email '{email}' not found")
            for member in members:
                if member.id != user.id:
                    sb.members.append(member)
                    email_service.send_member_added(member.email, sb.name, user.name, background_tasks)

        self.db.add(sb)
        self.db.commit()
        self.db.refresh(sb)

        ActivityService.log(
            self.db, user.id, "shared_budget.created", "SharedBudget", sb.id,
            f"Shared budget '{sb.name}' created with {len(sb.members)} members",
        )
        return sb

    def update(self, shared_id: str, data: SharedBudgetUpdate, user: User) -> SharedBudget:
        sb = self.get_by_id(shared_id)
        if sb.owner_id != user.id and user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to update this shared budget")
        if data.name is not None:
            sb.name = data.name
        if data.description is not None:
            sb.description = data.description
        if data.limit_amount is not None:
            sb.limit_amount = data.limit_amount
        self.db.commit()
        self.db.refresh(sb)
        ActivityService.log(self.db, user.id, "shared_budget.updated", "SharedBudget", sb.id, f"Shared budget '{sb.name}' updated")
        return sb

    def delete(self, shared_id: str, user: User) -> None:
        sb = self.get_by_id(shared_id)
        if sb.owner_id != user.id and user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to delete this shared budget")
        self.db.delete(sb)
        self.db.commit()
        ActivityService.log(self.db, user.id, "shared_budget.deleted", "SharedBudget", shared_id, f"Shared budget '{sb.name}' deleted")

    def add_member(self, shared_id: str, email: str, user: User, background_tasks: BackgroundTasks) -> SharedBudget:
        sb = self.get_by_id(shared_id)
        if sb.owner_id != user.id and user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to add members")

        member = self.db.query(User).filter(User.email == email).first()
        if not member:
            raise HTTPException(status_code=404, detail="User not found with this email")

        if member in sb.members:
            raise HTTPException(status_code=400, detail="User is already a member")

        sb.members.append(member)
        self.db.commit()
        self.db.refresh(sb)

        email_service.send_member_added(member.email, sb.name, user.name, background_tasks)
        ActivityService.log(
            self.db, user.id, "shared_budget.member_added", "SharedBudget", shared_id,
            f"Member '{member.name}' added to '{sb.name}'",
        )
        return sb

    def remove_member(self, shared_id: str, user_id: str, user: User) -> SharedBudget:
        sb = self.get_by_id(shared_id)
        if sb.owner_id != user.id and user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to remove members")

        member = self.db.query(User).filter(User.id == user_id).first()
        if not member or member not in sb.members:
            raise HTTPException(status_code=404, detail="Member not found in this shared budget")

        if member.id == sb.owner_id:
            raise HTTPException(status_code=400, detail="Cannot remove the owner")

        sb.members.remove(member)
        self.db.commit()
        self.db.refresh(sb)
        ActivityService.log(
            self.db, user.id, "shared_budget.member_removed", "SharedBudget", shared_id,
            f"Member '{member.name}' removed from '{sb.name}'",
        )
        return sb
