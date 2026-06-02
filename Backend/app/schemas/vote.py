from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class VoteResponse(BaseModel):
    id: str
    transaction_id: str
    transaction_description: str = ""
    transaction_amount: float = 0.0
    created_by: str
    creator_name: str = ""
    threshold_amount: float
    status: str
    yes_votes: int = 0
    no_votes: int = 0
    total_votes: int = 0
    approval_percentage: float = 0.0
    created_at: datetime

    class Config:
        from_attributes = True


class CastVoteRequest(BaseModel):
    approve: bool


class VoteConfig(BaseModel):
    threshold: float = 500.0
    approval_percent: float = 50.0
