from fastapi import BackgroundTasks, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.Models.transaction import Transaction
from app.Models.user import User
from app.Models.vote import Vote, VoteCast
from app.Services.activity_service import ActivityService
from app.Services.email_service import email_service


class VoteService:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, vote_id: str) -> Vote:
        vote = self.db.query(Vote).filter(Vote.id == vote_id).first()
        if not vote:
            raise HTTPException(status_code=404, detail="Vote not found")
        return vote

    def get_pending_by_transaction(self, transaction_id: str) -> Vote | None:
        return (
            self.db.query(Vote)
            .filter(
                Vote.transaction_id == transaction_id,
                Vote.status == "open",
            )
            .first()
        )

    def get_visible(self, user: User) -> list[Vote]:
        tx_ids = [t.id for t in self.db.query(Transaction).filter(Transaction.user_id == user.id).all()]
        if user.role == "admin":
            return self.db.query(Vote).order_by(Vote.created_at.desc()).all()
        return self.db.query(Vote).filter(Vote.transaction_id.in_(tx_ids)).order_by(Vote.created_at.desc()).all()

    def create_vote(self, transaction: Transaction, user: User) -> Vote:
        existing = self.get_pending_by_transaction(transaction.id)
        if existing:
            return existing

        vote = Vote(
            transaction_id=transaction.id,
            created_by=user.id,
            threshold_amount=settings.VOTE_THRESHOLD,
            status="open",
        )
        self.db.add(vote)
        self.db.commit()
        self.db.refresh(vote)

        ActivityService.log(
            self.db, user.id, "vote.created", "Vote", vote.id,
            f"Vote created for transaction '{transaction.description}' ({transaction.amount})",
        )
        return vote

    def cast_vote(self, vote_id: str, user: User, approve: bool, background_tasks: BackgroundTasks) -> Vote:
        vote = self.get_by_id(vote_id)

        if vote.status != "open":
            raise HTTPException(status_code=400, detail="Vote is closed")

        existing_cast = (
            self.db.query(VoteCast)
            .filter(VoteCast.vote_id == vote_id, VoteCast.user_id == user.id)
            .first()
        )
        if existing_cast:
            raise HTTPException(status_code=400, detail="You have already voted")

        cast = VoteCast(
            vote_id=vote_id,
            user_id=user.id,
            approved=approve,
        )
        self.db.add(cast)
        self.db.commit()

        self._check_vote_result(vote, background_tasks)

        self.db.refresh(vote)
        ActivityService.log(
            self.db, user.id, "vote.cast", "Vote", vote_id,
            f"Vote cast: {'approve' if approve else 'reject'}",
        )
        return vote

    def _check_vote_result(self, vote: Vote, background_tasks: BackgroundTasks) -> None:
        casts = self.db.query(VoteCast).filter(VoteCast.vote_id == vote.id).all()
        if len(casts) < 1:
            return

        yes = sum(1 for c in casts if c.approved)
        no = sum(1 for c in casts if not c.approved)
        total = len(casts)
        approval_pct = (yes / total) * 100 if total > 0 else 0

        if approval_pct >= settings.VOTE_APPROVAL_PERCENT:
            vote.status = "approved"
            tx = self.db.query(Transaction).filter(Transaction.id == vote.transaction_id).first()
            if tx:
                tx.status = "approved"
                user = self.db.query(User).filter(User.id == tx.user_id).first()
                if user:
                    email_service.send_transaction_approved(user.email, user.name, tx.description, tx.amount, background_tasks)
        elif no > 0 and (no / total) * 100 > 50:
            vote.status = "rejected"
            tx = self.db.query(Transaction).filter(Transaction.id == vote.transaction_id).first()
            if tx:
                tx.status = "rejected"
                user = self.db.query(User).filter(User.id == tx.user_id).first()
                if user:
                    email_service.send_transaction_rejected(user.email, user.name, tx.description, tx.amount, background_tasks)

        self.db.commit()

    def get_results(self, vote: Vote) -> dict:
        casts = self.db.query(VoteCast).filter(VoteCast.vote_id == vote.id).all()
        yes = sum(1 for c in casts if c.approved)
        no = sum(1 for c in casts if not c.approved)
        total = len(casts)
        approval_pct = (yes / total * 100) if total > 0 else 0

        voter_details = []
        for c in casts:
            u = self.db.query(User).filter(User.id == c.user_id).first()
            voter_details.append({
                "user_id": c.user_id,
                "user_name": u.name if u else "Unknown",
                "approved": c.approved,
            })

        return {
            "vote_id": vote.id,
            "status": vote.status,
            "yes_votes": yes,
            "no_votes": no,
            "total_votes": total,
            "approval_percentage": round(approval_pct, 1),
            "voters": voter_details,
        }

    def get_pending_count(self, user: User) -> int:
        tx_ids = [t.id for t in self.db.query(Transaction).filter(Transaction.user_id == user.id).all()]
        return self.db.query(Vote).filter(Vote.status == "open", Vote.transaction_id.in_(tx_ids)).count()
