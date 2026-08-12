from typing import Optional
from sqlalchemy.orm import Session
from app.domain.repositories.base import BaseRepository
from app.domain.models.experience import Avatar
from pydantic import BaseModel


class AvatarRepository(BaseRepository[Avatar]):
    """Repository for Avatar CRUD with user-centric queries."""

    def get_by_user(self, db: Session, user_id: int) -> Optional[Avatar]:
        return db.query(Avatar).filter(Avatar.user_id == user_id).first()

    def upsert(self, db: Session, user_id: int, data: dict) -> Avatar:
        """
        Create or update the Avatar for a given user.
        Uses dict-based partial update to support evolving fields gracefully.
        """
        avatar = self.get_by_user(db, user_id)
        if avatar:
            for key, value in data.items():
                if hasattr(avatar, key) and value is not None:
                    setattr(avatar, key, value)
            db.add(avatar)
        else:
            avatar = Avatar(user_id=user_id, **{k: v for k, v in data.items() if v is not None})
            db.add(avatar)
        db.commit()
        db.refresh(avatar)
        return avatar

    def delete_by_user(self, db: Session, user_id: int) -> bool:
        avatar = self.get_by_user(db, user_id)
        if avatar:
            db.delete(avatar)
            db.commit()
            return True
        return False


# Singleton
avatar_repo = AvatarRepository(Avatar)
