from typing import List, Optional
from sqlalchemy.orm import Session
from app.domain.repositories.base import BaseRepository
from app.domain.models.experience import Avatar


class AvatarRepository(BaseRepository[Avatar]):
    """Repository for Avatar CRUD. A user can own several avatars."""

    def list_by_user(self, db: Session, user_id: int) -> List[Avatar]:
        """All avatars of a user, oldest first (stable order for the UI)."""
        return (
            db.query(Avatar)
            .filter(Avatar.user_id == user_id)
            .order_by(Avatar.id)
            .all()
        )

    def count_by_user(self, db: Session, user_id: int) -> int:
        return db.query(Avatar).filter(Avatar.user_id == user_id).count()

    def get_for_user(self, db: Session, user_id: int, avatar_id: int) -> Optional[Avatar]:
        """Fetch an avatar only if it belongs to the user (ownership check)."""
        return (
            db.query(Avatar)
            .filter(Avatar.id == avatar_id, Avatar.user_id == user_id)
            .first()
        )

    def get_first_by_user(self, db: Session, user_id: int) -> Optional[Avatar]:
        """The user's oldest avatar, used when no avatar is selected explicitly."""
        return (
            db.query(Avatar)
            .filter(Avatar.user_id == user_id)
            .order_by(Avatar.id)
            .first()
        )

    def create_for_user(self, db: Session, user_id: int, data: dict) -> Avatar:
        avatar = Avatar(user_id=user_id, **{k: v for k, v in data.items() if v is not None})
        db.add(avatar)
        db.commit()
        db.refresh(avatar)
        return avatar

    def update_fields(self, db: Session, avatar: Avatar, data: dict) -> Avatar:
        """Partial update: only provided, non-null fields are changed."""
        for key, value in data.items():
            if hasattr(avatar, key) and value is not None:
                setattr(avatar, key, value)
        db.add(avatar)
        db.commit()
        db.refresh(avatar)
        return avatar

    def delete_for_user(self, db: Session, user_id: int, avatar_id: int) -> bool:
        avatar = self.get_for_user(db, user_id, avatar_id)
        if not avatar:
            return False
        db.delete(avatar)
        db.commit()
        return True


# Singleton
avatar_repo = AvatarRepository(Avatar)
