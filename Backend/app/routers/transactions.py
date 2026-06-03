from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.Models.user import User
from app.Models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionResponse, TransactionSummary
from app.Services.transaction_service import TransactionService
from app.Services.vote_service import VoteService
from app.Services.category_service import CategoryService

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


@router.get("", response_model=list[TransactionResponse])
def list_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = TransactionService(db)
    cat_service = CategoryService(db)
    txs = service.get_visible(current_user)
    result = []
    for t in txs:
        resp = TransactionResponse.model_validate(t)
        user = db.query(User).filter(User.id == t.user_id).first()
        resp.user_name = user.name if user else ""
        if t.category_id:
            try:
                cat = cat_service.get_by_id(t.category_id)
                resp.category_name = cat.name
                resp.category_color = cat.color
            except Exception:
                pass
        result.append(resp)
    return result


@router.get("/summary", response_model=TransactionSummary)
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = TransactionService(db)
    return TransactionSummary(**service.get_summary(current_user))


@router.post("", response_model=TransactionResponse, status_code=201)
def create_transaction(
    data: TransactionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = TransactionService(db)
    tx = service.create(data, current_user, background_tasks)

    if tx.status == "pending":
        vote_service = VoteService(db)
        vote_service.create_vote(tx, current_user)

    return TransactionResponse.model_validate(tx)


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = TransactionService(db)
    tx = service.get_by_id(transaction_id)
    return TransactionResponse.model_validate(tx)


@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: str,
    data: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = TransactionService(db)
    tx = service.update(transaction_id, data, current_user)
    return TransactionResponse.model_validate(tx)


@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = TransactionService(db)
    service.delete(transaction_id, current_user)
    return {"detail": "Transaction deleted"}


@router.post("/{transaction_id}/approve", response_model=TransactionResponse)
def approve_transaction(
    transaction_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    service = TransactionService(db)
    tx = service.approve(transaction_id, current_user, background_tasks)
    return TransactionResponse.model_validate(tx)


@router.post("/{transaction_id}/reject", response_model=TransactionResponse)
def reject_transaction(
    transaction_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    service = TransactionService(db)
    tx = service.reject(transaction_id, current_user, background_tasks)
    return TransactionResponse.model_validate(tx)
