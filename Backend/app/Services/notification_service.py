from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.Models.notification import Notification


class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def get_for_user(self, user_id: str, include_read: bool = False) -> dict:
        query = self.db.query(Notification).filter(Notification.user_id == user_id)
        if not include_read:
            query = query.filter(Notification.is_read == False)
        notifications = query.order_by(Notification.created_at.desc()).limit(50).all()

        unread = (
            self.db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read == False)
            .count()
        )

        return {
            "notifications": [self._to_frontend(n) for n in notifications],
            "unreadCount": unread,
        }

    def mark_read(self, user_id: str, notif_id: str) -> None:
        if notif_id == "all":
            self.db.query(Notification).filter(Notification.user_id == user_id).update({"is_read": True})
        else:
            notif = (
                self.db.query(Notification)
                .filter(Notification.id == notif_id, Notification.user_id == user_id)
                .first()
            )
            if not notif:
                raise HTTPException(status_code=404, detail="Notification not found")
            notif.is_read = True
        self.db.commit()

    def _to_frontend(self, n: Notification) -> dict:
        return {
            "id": n.id,
            "userId": n.user_id,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "relatedId": n.related_id,
            "read": n.is_read,
            "createdAt": n.created_at.isoformat() if n.created_at else None,
        }
