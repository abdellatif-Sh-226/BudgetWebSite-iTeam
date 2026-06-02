import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship

from app.database import Base


vote_casts = Table(
    "vote_casts",
    Base.metadata,
    Column("vote_id", String(36), ForeignKey("votes.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("approved", Boolean, nullable=False),
    Column("created_at", DateTime, default=lambda: datetime.now(timezone.utc)),
)


class Vote(Base):
    __tablename__ = "votes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = Column(String(36), ForeignKey("transactions.id"), nullable=False, index=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    threshold_amount = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, default="open")
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    transaction = relationship("Transaction", back_populates="votes")
    creator = relationship("User")
    cast_votes = relationship("VoteCast", back_populates="vote", cascade="all, delete-orphan")


class VoteCast(Base):
    __tablename__ = "vote_casts_table"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vote_id = Column(String(36), ForeignKey("votes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    approved = Column(Boolean, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    vote = relationship("Vote", back_populates="cast_votes")
    user = relationship("User", back_populates="vote_casts")
