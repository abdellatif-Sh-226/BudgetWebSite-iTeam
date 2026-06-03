import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class PendingApproval(Base):
    __tablename__ = "pending_approvals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pending_transaction_id = Column(String(36), ForeignKey("pending_transactions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    status = Column(String(16), nullable=False, default="pending")
    responded_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    pending_transaction = relationship("PendingTransaction", back_populates="approvals")
    user = relationship("User")
