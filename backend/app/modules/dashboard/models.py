from sqlalchemy import Boolean, Integer, JSON, String, UniqueConstraint, true
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class DashboardWidgetPreference(TimestampMixin, Base):
    __tablename__ = "dashboard_widget_preferences"
    __table_args__ = (
        UniqueConstraint("widget_key", name="uq_dashboard_widget_preferences_widget_key"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    widget_key: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    is_visible: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=true(),
    )
    config_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
