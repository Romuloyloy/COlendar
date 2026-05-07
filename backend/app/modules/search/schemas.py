from datetime import date as date_type
from typing import Literal

from pydantic import BaseModel


SearchResultType = Literal[
    "note",
    "folder",
    "daily_task",
    "weekly_task",
    "calendar_event",
]


class SearchResult(BaseModel):
    id: int
    type: SearchResultType
    title: str
    subtitle: str | None = None
    preview: str | None = None
    date: date_type | None = None
    target_url: str


class SearchResultGroups(BaseModel):
    notes: list[SearchResult]
    folders: list[SearchResult]
    daily_tasks: list[SearchResult]
    weekly_tasks: list[SearchResult]
    calendar_events: list[SearchResult]


class SearchResponse(BaseModel):
    query: str
    results: SearchResultGroups
