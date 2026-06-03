import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Text, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(20), nullable=False, default="expense")
    description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False, default=0.0)
    date = Column(Date, nullable=False)
    category_id = Column(String(36), ForeignKey("categories.id"), nullable=True)
    notes = Column(Text, nullable=True)
    destination_type = Column(String(20), nullable=False, default="wallet")
    destination_id = Column(String(36), nullable=True)
    status = Column(String(20), nullable=False, default="approved")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    votes = relationship("Vote", back_populates="transaction", cascade="all, delete-orphan")
