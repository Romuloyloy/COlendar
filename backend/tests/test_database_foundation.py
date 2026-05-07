from sqlalchemy import Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class FoundationExample(TimestampMixin, Base):
    __tablename__ = "_test_foundation_example"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)


def test_timestamp_mixin_adds_expected_columns() -> None:
    columns = FoundationExample.__table__.columns

    assert "created_at" in columns
    assert "updated_at" in columns
    assert columns["created_at"].nullable is False
    assert columns["updated_at"].nullable is False
