import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Text, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship

from app.database import Base


shared_budget_members = Table(
    "shared_budget_members",
    Base.metadata,
    Column("shared_budget_id", String(36), ForeignKey("shared_budgets.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)


class SharedBudget(Base):
    __tablename__ = "shared_budgets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    limit_amount = Column(Float, nullable=False, default=0.0)
    locked = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="owned_shared_budgets")
    members = relationship("User", secondary=shared_budget_members)
    categories = relationship("Category", back_populates="shared_budget")
