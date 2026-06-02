import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship

from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False, unique=True, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="user")
    active = Column(Boolean, default=True)
    delete_request = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="owner", cascade="all, delete-orphan")
    owned_shared_budgets = relationship("SharedBudget", back_populates="owner", cascade="all, delete-orphan")
    vote_casts = relationship("VoteCast", back_populates="user", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")
