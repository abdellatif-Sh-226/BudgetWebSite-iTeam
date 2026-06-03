import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Text, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class PendingTransaction(Base):
    __tablename__ = "pending_transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    group_id = Column(String(36), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(16), nullable=False, default="expense")
    description = Column(Text, nullable=True)
    amount = Column(Float, nullable=False, default=0.0)
    date = Column(Date, nullable=False)
    category_id = Column(String(36), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(16), nullable=False, default="pending")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User")
    approvals = relationship("PendingApproval", back_populates="pending_transaction", cascade="all, delete-orphan")
