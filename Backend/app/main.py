from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import uuid as _uuid

from app.config import settings
from app.database import Base, engine, get_db
from app.dependencies import get_current_user, get_optional_user
from app.Models.user import User
from app.routers import (
    auth,
    users,
    budgets,
    categories,
    transactions,
    shared_budgets,
    votes,
    dashboard,
    stats,
    activity_logs,
    data,
    save,
    pendings,
    approvals,
    notifications_router,
)
from app.Services.user_service import UserService
from app.schemas.user import LoginRequest, UserCreate
from app.routers.auth import _login_response
from app.seed import create_default_admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    create_default_admin()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(budgets.router)
app.include_router(categories.router)
app.include_router(transactions.router)
app.include_router(shared_budgets.router)
app.include_router(votes.router)
app.include_router(dashboard.router)
app.include_router(stats.router)
app.include_router(activity_logs.router)
app.include_router(data.router)
app.include_router(save.router)
app.include_router(pendings.router)
app.include_router(approvals.router)
app.include_router(notifications_router.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


@app.post("/api/login")
def api_login(request: LoginRequest, db: Session = Depends(get_db)):
    user_service = UserService(db)
    user = user_service.authenticate(request.email, request.password)
    return _login_response(user)


@app.post("/api/register")
def api_register(request: UserCreate, db: Session = Depends(get_db)):
    from app.Services.auth_service import AuthService
    existing = UserService(db).get_by_email(request.email)
    if existing:
        from fastapi import HTTPException
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        id=str(_uuid.uuid4()),
        name=request.name,
        email=request.email,
        password=AuthService.hash_password(request.password),
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _login_response(user)


@app.post("/api/logout")
def api_logout():
    return {"success": True}


@app.delete("/api/delete-transaction")
def api_delete_transaction(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.Models.transaction import Transaction
    from app.Services.activity_service import ActivityService
    tx = db.query(Transaction).filter(Transaction.id == id).first()
    if not tx:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Transaction not found")
    if tx.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized to delete this transaction")
    db.delete(tx)
    db.commit()
    ActivityService.log(db, current_user.id, "transaction.deleted", "Transaction", id, "Transaction deleted")
    return {"success": True}
