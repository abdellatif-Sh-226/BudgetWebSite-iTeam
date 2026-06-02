from sqlalchemy.orm import Session

from app.Models.activity_log import ActivityLog


class ActivityService:
    @staticmethod
    def log(
        db: Session,
        user_id: str,
        action: str,
        entity_type: str = None,
        entity_id: str = None,
        details: str = None,
    ) -> ActivityLog:
        log_entry = ActivityLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
        )
        db.add(log_entry)
        db.commit()
        return log_entry
