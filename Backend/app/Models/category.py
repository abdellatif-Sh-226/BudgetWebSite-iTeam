import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    color = Column(String(7), nullable=False)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    shared_budget_id = Column(String(36), ForeignKey("shared_budgets.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="categories")
    shared_budget = relationship("SharedBudget", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category")
