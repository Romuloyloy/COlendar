from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class FolderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    parent_folder_id: int | None = None

    @field_validator("name")
    @classmethod
    def name_cannot_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Folder name cannot be empty")
        return value


class FolderUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    parent_folder_id: int | None = None

    @field_validator("name")
    @classmethod
    def name_cannot_be_blank(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Folder name cannot be empty")
        return value


class FolderRead(BaseModel):
    id: int
    name: str
    parent_folder_id: int | None
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NoteCreate(BaseModel):
    title: str = Field(min_length=1, max_length=250)
    content: str = ""
    folder_id: int | None = None

    @field_validator("title")
    @classmethod
    def title_cannot_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Note title cannot be empty")
        return value


class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=250)
    content: str | None = None
    folder_id: int | None = None

    @field_validator("title")
    @classmethod
    def title_cannot_be_blank(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Note title cannot be empty")
        return value


class NoteRead(BaseModel):
    id: int
    title: str
    content: str
    folder_id: int | None
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
