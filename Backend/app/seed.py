from app.database import SessionLocal
from app.Models.user import User
from app.Services.auth_service import AuthService


def create_default_admin():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.role == "admin").first()
        if not existing:
            admin = User(
                name="Admin",
                email="admin@budgetcollab.com",
                password=AuthService.hash_password("admin123"),
                role="admin",
            )
            db.add(admin)
            db.commit()
            print("Default admin created: admin@budgetcollab.com / admin123")
        else:
            print(f"Admin already exists: {existing.email}")
    finally:
        db.close()
