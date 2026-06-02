import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    period = Column(String(20), nullable=False, default="monthly")
    limit_amount = Column(Float, nullable=False, default=0.0)
    category_id = Column(String(36), ForeignKey("categories.id"), nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="budgets")
    category = relationship("Category")
