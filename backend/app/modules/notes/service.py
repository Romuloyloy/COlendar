from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.notes.models import Folder


def get_active_folder_or_404(db: Session, folder_id: int) -> Folder:
    folder = db.scalar(
        select(Folder).where(Folder.id == folder_id, Folder.is_archived.is_(False))
    )
    if folder is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found",
        )
    return folder


def validate_parent_folder(
    db: Session,
    parent_folder_id: int | None,
    folder_id: int | None = None,
) -> None:
    if parent_folder_id is None:
        return

    if folder_id is not None and parent_folder_id == folder_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Folder cannot be its own parent",
        )

    parent = get_active_folder_or_404(db, parent_folder_id)

    while parent.parent_folder_id is not None:
        if folder_id is not None and parent.parent_folder_id == folder_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Folder nesting cannot be circular",
            )
        parent = get_active_folder_or_404(db, parent.parent_folder_id)
