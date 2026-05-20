from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.notes.models import Folder, Note
from app.modules.notes.schemas import (
    FolderCreate,
    FolderRead,
    FolderUpdate,
    NoteCreate,
    NoteRead,
    NoteUpdate,
)
from app.modules.notes.service import get_active_folder_or_404, validate_parent_folder
from app.modules.tasks.service import validate_optional_category

router = APIRouter(prefix="/api", tags=["notes"])


@router.get("/folders", response_model=list[FolderRead])
def list_folders(db: Session = Depends(get_db)) -> list[Folder]:
    return list(
        db.scalars(
            select(Folder)
            .where(Folder.is_archived.is_(False))
            .order_by(Folder.name.asc(), Folder.id.asc())
        )
    )


@router.post("/folders", response_model=FolderRead, status_code=status.HTTP_201_CREATED)
def create_folder(payload: FolderCreate, db: Session = Depends(get_db)) -> Folder:
    validate_parent_folder(db, payload.parent_folder_id)

    folder = Folder(name=payload.name.strip(), parent_folder_id=payload.parent_folder_id)
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


@router.patch("/folders/{folder_id}", response_model=FolderRead)
def update_folder(
    folder_id: int,
    payload: FolderUpdate,
    db: Session = Depends(get_db),
) -> Folder:
    folder = get_active_folder_or_404(db, folder_id)

    if "name" in payload.model_fields_set and payload.name is not None:
        folder.name = payload.name.strip()

    if "parent_folder_id" in payload.model_fields_set:
        validate_parent_folder(db, payload.parent_folder_id, folder_id=folder.id)
        folder.parent_folder_id = payload.parent_folder_id

    db.commit()
    db.refresh(folder)
    return folder


@router.delete("/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_folder(folder_id: int, db: Session = Depends(get_db)) -> Response:
    folder = get_active_folder_or_404(db, folder_id)

    has_child_folder = db.scalar(
        select(Folder.id).where(
            Folder.parent_folder_id == folder.id,
            Folder.is_archived.is_(False),
        )
    )
    has_note = db.scalar(
        select(Note.id).where(Note.folder_id == folder.id, Note.is_archived.is_(False))
    )
    if has_child_folder is not None or has_note is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Folder must be empty before it can be archived",
        )

    folder.is_archived = True
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/notes", response_model=list[NoteRead])
def list_notes(db: Session = Depends(get_db)) -> list[Note]:
    return list(
        db.scalars(
            select(Note)
            .where(Note.is_archived.is_(False))
            .order_by(Note.updated_at.desc(), Note.id.desc())
        )
    )


@router.post("/notes", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
def create_note(payload: NoteCreate, db: Session = Depends(get_db)) -> Note:
    if payload.folder_id is not None:
        get_active_folder_or_404(db, payload.folder_id)
    validate_optional_category(db, payload.category_id)

    note = Note(
        title=payload.title.strip(),
        content=payload.content,
        folder_id=payload.folder_id,
        category_id=payload.category_id,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.get("/notes/{note_id}", response_model=NoteRead)
def get_note(note_id: int, db: Session = Depends(get_db)) -> Note:
    note = db.scalar(select(Note).where(Note.id == note_id, Note.is_archived.is_(False)))
    if note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )
    return note


@router.patch("/notes/{note_id}", response_model=NoteRead)
def update_note(
    note_id: int,
    payload: NoteUpdate,
    db: Session = Depends(get_db),
) -> Note:
    note = get_note(note_id, db)

    if "title" in payload.model_fields_set and payload.title is not None:
        note.title = payload.title.strip()
    if "content" in payload.model_fields_set and payload.content is not None:
        note.content = payload.content
    if "folder_id" in payload.model_fields_set:
        if payload.folder_id is not None:
            get_active_folder_or_404(db, payload.folder_id)
        note.folder_id = payload.folder_id
    if "category_id" in payload.model_fields_set:
        validate_optional_category(db, payload.category_id)
        note.category_id = payload.category_id

    db.commit()
    db.refresh(note)
    return note


@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_note(note_id: int, db: Session = Depends(get_db)) -> Response:
    note = get_note(note_id, db)
    note.is_archived = True
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
