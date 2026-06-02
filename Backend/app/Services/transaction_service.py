from fastapi import BackgroundTasks, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.Models.transaction import Transaction
from app.Models.user import User
from app.Models.vote import Vote
from app.schemas.transaction import TransactionCreate, TransactionUpdate
from app.Services.activity_service import ActivityService
from app.Services.email_service import email_service


class TransactionService:
    def __init__(self, db: Session):
        self.db = db

    def get_visible(self, user: User) -> list[Transaction]:
        if user.role == "admin":
            return self.db.query(Transaction).order_by(Transaction.date.desc()).all()
        return self.db.query(Transaction).filter(Transaction.user_id == user.id).order_by(Transaction.date.desc()).all()

    def get_by_id(self, transaction_id: str) -> Transaction:
        tx = self.db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return tx

    def create(self, data: TransactionCreate, user: User, background_tasks: BackgroundTasks) -> Transaction:
        status = "approved"
        if data.type == "expense" and data.amount > settings.VOTE_THRESHOLD:
            status = "pending"

        tx = Transaction(
            user_id=user.id,
            type=data.type,
            description=data.description,
            amount=data.amount,
            date=data.date,
            category_id=data.category_id,
            notes=data.notes,
            destination_type=data.destination_type,
            destination_id=data.destination_id,
            status=status,
        )
        self.db.add(tx)
        self.db.commit()
        self.db.refresh(tx)

        ActivityService.log(
            self.db, user.id, "transaction.created", "Transaction", tx.id,
            f"Transaction '{tx.description}' ({tx.amount}) created with status {status}",
        )

        if status == "pending":
            email_service.send_transaction_pending(user.email, user.name, tx.description, tx.amount, background_tasks)

        return tx

    def update(self, transaction_id: str, data: TransactionUpdate, user: User) -> Transaction:
        tx = self.get_by_id(transaction_id)
        if tx.user_id != user.id and user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to update this transaction")
        if tx.status != "pending" and user.role != "admin":
            raise HTTPException(status_code=400, detail="Can only edit pending transactions")

        if data.type is not None:
            tx.type = data.type
        if data.description is not None:
            tx.description = data.description
        if data.amount is not None:
            tx.amount = data.amount
        if data.date is not None:
            tx.date = data.date
        if data.category_id is not None:
            tx.category_id = data.category_id
        if data.notes is not None:
            tx.notes = data.notes
        if data.destination_type is not None:
            tx.destination_type = data.destination_type
        if data.destination_id is not None:
            tx.destination_id = data.destination_id

        self.db.commit()
        self.db.refresh(tx)
        ActivityService.log(self.db, user.id, "transaction.updated", "Transaction", tx.id, f"Transaction '{tx.description}' updated")
        return tx

    def delete(self, transaction_id: str, user: User) -> None:
        tx = self.get_by_id(transaction_id)
        if tx.user_id != user.id and user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to delete this transaction")
        self.db.delete(tx)
        self.db.commit()
        ActivityService.log(self.db, user.id, "transaction.deleted", "Transaction", transaction_id, f"Transaction deleted")

    def approve(self, transaction_id: str, user: User, background_tasks: BackgroundTasks) -> Transaction:
        tx = self.get_by_id(transaction_id)
        if tx.status != "pending":
            raise HTTPException(status_code=400, detail="Transaction is not pending")
        tx.status = "approved"
        self.db.commit()
        self.db.refresh(tx)
        ActivityService.log(self.db, user.id, "transaction.approved", "Transaction", tx.id, f"Transaction '{tx.description}' approved")
        email_service.send_transaction_approved(user.email, user.name, tx.description, tx.amount, background_tasks)
        return tx

    def reject(self, transaction_id: str, user: User, background_tasks: BackgroundTasks) -> Transaction:
        tx = self.get_by_id(transaction_id)
        if tx.status != "pending":
            raise HTTPException(status_code=400, detail="Transaction is not pending")
        tx.status = "rejected"
        self.db.commit()
        self.db.refresh(tx)
        ActivityService.log(self.db, user.id, "transaction.rejected", "Transaction", tx.id, f"Transaction '{tx.description}' rejected")
        email_service.send_transaction_rejected(user.email, user.name, tx.description, tx.amount, background_tasks)
        return tx

    def get_summary(self, user: User) -> dict:
        txs = self.get_visible(user)
        income = sum(t.amount for t in txs if t.type == "income")
        expense = sum(t.amount for t in txs if t.type == "expense" and t.status == "approved")
        return {
            "total_income": income,
            "total_expense": expense,
            "balance": income - expense,
            "transaction_count": len(txs),
        }
