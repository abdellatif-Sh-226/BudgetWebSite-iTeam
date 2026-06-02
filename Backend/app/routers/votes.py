from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.Models.user import User
from app.schemas.vote import VoteResponse, CastVoteRequest
from app.Services.vote_service import VoteService

router = APIRouter(prefix="/api/votes", tags=["Votes"])


@router.get("", response_model=list[VoteResponse])
def list_votes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = VoteService(db)
    votes = service.get_visible(current_user)
    result = []
    for v in votes:
        results = service.get_results(v)
        resp = VoteResponse.model_validate(v)
        tx = v.transaction
        if tx:
            resp.transaction_description = tx.description
            resp.transaction_amount = tx.amount
        creator = tx.user if tx else None
        if creator:
            resp.creator_name = creator.name
        resp.yes_votes = results["yes_votes"]
        resp.no_votes = results["no_votes"]
        resp.total_votes = results["total_votes"]
        resp.approval_percentage = results["approval_percentage"]
        result.append(resp)
    return result


@router.get("/{vote_id}", response_model=VoteResponse)
def get_vote(
    vote_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = VoteService(db)
    v = service.get_by_id(vote_id)
    results = service.get_results(v)
    resp = VoteResponse.model_validate(v)
    tx = v.transaction
    if tx:
        resp.transaction_description = tx.description
        resp.transaction_amount = tx.amount
    creator = tx.user if tx else None
    if creator:
        resp.creator_name = creator.name
    resp.yes_votes = results["yes_votes"]
    resp.no_votes = results["no_votes"]
    resp.total_votes = results["total_votes"]
    resp.approval_percentage = results["approval_percentage"]
    return resp


@router.post("/{vote_id}/cast", response_model=VoteResponse)
def cast_vote(
    vote_id: str,
    data: CastVoteRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = VoteService(db)
    v = service.cast_vote(vote_id, current_user, data.approve, background_tasks)
    results = service.get_results(v)
    resp = VoteResponse.model_validate(v)
    tx = v.transaction
    if tx:
        resp.transaction_description = tx.description
        resp.transaction_amount = tx.amount
    creator = tx.user if tx else None
    if creator:
        resp.creator_name = creator.name
    resp.yes_votes = results["yes_votes"]
    resp.no_votes = results["no_votes"]
    resp.total_votes = results["total_votes"]
    resp.approval_percentage = results["approval_percentage"]
    return resp
