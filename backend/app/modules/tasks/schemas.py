from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field, field_validator

VALID_WEEKDAYS = set(range(7))


def normalize_weekdays(value: list[int]) -> list[int]:
    unique_weekdays = sorted(set(value))
    if not unique_weekdays:
        raise ValueError("Weekly task must include at least one weekday")
    if any(weekday not in VALID_WEEKDAYS for weekday in unique_weekdays):
        raise ValueError("Weekdays must be integers from 0 to 6")
    return unique_weekdays


def weekdays_to_storage(weekdays: list[int]) -> str:
    return ",".join(str(weekday) for weekday in normalize_weekdays(weekdays))


def weekdays_from_storage(value: str) -> list[int]:
    if not value:
        return []
    return [int(weekday) for weekday in value.split(",")]


class DailyTaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=250)
    description: str = ""
    task_date: date
    planned_time: time | None = None
    due_date: date | None = None
    due_time: time | None = None
    category_id: int | None = None

    @field_validator("title")
    @classmethod
    def title_cannot_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Task title cannot be empty")
        return value


class DailyTaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=250)
    description: str | None = None
    task_date: date | None = None
    planned_time: time | None = None
    due_date: date | None = None
    due_time: time | None = None
    category_id: int | None = None

    @field_validator("title")
    @classmethod
    def title_cannot_be_blank(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Task title cannot be empty")
        return value


class DailyTaskRead(BaseModel):
    id: int
    title: str
    description: str
    task_date: date
    planned_time: time | None
    due_date: date | None
    due_time: time | None
    category_id: int | None
    is_completed: bool
    completed_at: datetime | None
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WeeklyTaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=250)
    description: str = ""
    weekdays: list[int]
    category_id: int | None = None

    @field_validator("title")
    @classmethod
    def title_cannot_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Task title cannot be empty")
        return value

    @field_validator("weekdays")
    @classmethod
    def weekdays_must_be_valid(cls, value: list[int]) -> list[int]:
        return normalize_weekdays(value)


class WeeklyTaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=250)
    description: str | None = None
    weekdays: list[int] | None = None
    category_id: int | None = None

    @field_validator("title")
    @classmethod
    def title_cannot_be_blank(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Task title cannot be empty")
        return value

    @field_validator("weekdays")
    @classmethod
    def weekdays_must_be_valid(cls, value: list[int] | None) -> list[int] | None:
        if value is None:
            return value
        return normalize_weekdays(value)


class WeeklyTaskRead(BaseModel):
    id: int
    title: str
    description: str
    weekdays: list[int]
    category_id: int | None
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskCategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    color: str = Field(default="", max_length=40)

    @field_validator("name")
    @classmethod
    def name_cannot_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Category name cannot be empty")
        return value.strip()


class TaskCategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    color: str | None = Field(default=None, max_length=40)

    @field_validator("name")
    @classmethod
    def name_cannot_be_blank(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Category name cannot be empty")
        return value.strip() if value is not None else value


class TaskCategoryRead(BaseModel):
    id: int
    name: str
    color: str
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WeeklyTaskCompletionRead(BaseModel):
    id: int
    weekly_task_id: int
    completion_date: date
    completed_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
