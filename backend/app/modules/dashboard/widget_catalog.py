DEFAULT_DASHBOARD_WIDGET_KEYS = [
    "today-overview",
    "quick-actions",
    "daily-tasks",
    "weekly-tasks",
    "recent-notes",
    "upcoming-events",
    "tracker-summary",
]

OPTIONAL_DASHBOARD_WIDGET_KEYS = [
    "category-overview",
    "review-summary",
]

VALID_DASHBOARD_WIDGET_KEYS = set(DEFAULT_DASHBOARD_WIDGET_KEYS) | set(
    OPTIONAL_DASHBOARD_WIDGET_KEYS
)
