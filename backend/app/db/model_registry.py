"""Import SQLAlchemy models here so Alembic can discover them.

Future feature modules should keep their models inside their own module folders
and add imports here when those models are ready for migrations.
"""

from app.modules.calendar.models import CalendarEvent  # noqa: F401
from app.modules.notes.models import Folder, Note  # noqa: F401
from app.modules.tasks.models import DailyTask, WeeklyTask, WeeklyTaskCompletion  # noqa: F401
from app.modules.tracker.models import ActivityEntry, WaterEntry  # noqa: F401
