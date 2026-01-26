from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field

class Profile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str

class Page(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    profile_id: int = Field(index=True)
    title: str
    order_index: int = 0

class Widget(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    page_id: int = Field(index=True)

    type: str  # "note", "tasks", "week", ...
    title: str = ""

    x: int = 0
    y: int = 0
    w: int = 1
    h: int = 1

    config_json: str = "{}"

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)