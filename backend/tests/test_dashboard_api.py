from fastapi.testclient import TestClient

DEFAULT_WIDGET_KEYS = [
    "today-overview",
    "quick-actions",
    "daily-tasks",
    "weekly-tasks",
    "recent-notes",
    "upcoming-events",
    "tracker-summary",
    "planning-summary",
]


def test_dashboard_summary_returns_selected_date(client: TestClient) -> None:
    response = client.get("/api/dashboard/summary?date=2026-05-07")

    assert response.status_code == 200
    assert response.json()["selected_date"] == "2026-05-07"


def test_dashboard_widgets_returns_default_layout(client: TestClient) -> None:
    response = client.get("/api/dashboard/widgets")

    assert response.status_code == 200
    widgets = response.json()["widgets"]
    assert [widget["widget_key"] for widget in widgets] == DEFAULT_WIDGET_KEYS
    assert [widget["sort_order"] for widget in widgets] == list(
        range(len(DEFAULT_WIDGET_KEYS))
    )
    assert all(widget["is_visible"] is True for widget in widgets)
    assert all(widget["config_json"] == {} for widget in widgets)


def test_dashboard_widgets_updates_widget_visibility(client: TestClient) -> None:
    payload = {
        "widgets": [
            {"widget_key": widget_key, "is_visible": widget_key != "daily-tasks"}
            for widget_key in DEFAULT_WIDGET_KEYS
        ]
    }

    response = client.put("/api/dashboard/widgets", json=payload)

    assert response.status_code == 200
    widgets_by_key = {
        widget["widget_key"]: widget for widget in response.json()["widgets"]
    }
    assert widgets_by_key["daily-tasks"]["is_visible"] is False
    assert widgets_by_key["weekly-tasks"]["is_visible"] is True


def test_dashboard_widgets_reorders_widgets(client: TestClient) -> None:
    reversed_keys = list(reversed(DEFAULT_WIDGET_KEYS))
    payload = {
        "widgets": [
            {"widget_key": widget_key, "is_visible": True}
            for widget_key in reversed_keys
        ]
    }

    response = client.put("/api/dashboard/widgets", json=payload)

    assert response.status_code == 200
    widgets = response.json()["widgets"]
    assert [widget["widget_key"] for widget in widgets] == reversed_keys
    assert [widget["sort_order"] for widget in widgets] == list(range(len(reversed_keys)))


def test_dashboard_widgets_rejects_unknown_widget_key(client: TestClient) -> None:
    response = client.put(
        "/api/dashboard/widgets",
        json={"widgets": [{"widget_key": "mystery-widget", "is_visible": True}]},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Unknown dashboard widget key: mystery-widget"


def test_dashboard_widgets_rejects_duplicate_widget_keys(client: TestClient) -> None:
    response = client.put(
        "/api/dashboard/widgets",
        json={
            "widgets": [
                {"widget_key": "daily-tasks", "is_visible": True},
                {"widget_key": "daily-tasks", "is_visible": False},
            ]
        },
    )

    assert response.status_code == 422


def test_dashboard_widgets_reset_restores_default_layout(client: TestClient) -> None:
    client.put(
        "/api/dashboard/widgets",
        json={
            "widgets": [
                {"widget_key": widget_key, "is_visible": widget_key != "recent-notes"}
                for widget_key in reversed(DEFAULT_WIDGET_KEYS)
            ]
        },
    )

    response = client.post("/api/dashboard/widgets/reset")

    assert response.status_code == 200
    widgets = response.json()["widgets"]
    assert [widget["widget_key"] for widget in widgets] == DEFAULT_WIDGET_KEYS
    assert all(widget["is_visible"] is True for widget in widgets)


def test_dashboard_summary_still_loads_after_customized_layout(
    client: TestClient,
) -> None:
    client.put(
        "/api/dashboard/widgets",
        json={
            "widgets": [
                {"widget_key": "quick-actions", "is_visible": False},
                {"widget_key": "today-overview", "is_visible": True},
            ]
        },
    )

    response = client.get("/api/dashboard/summary?date=2026-05-07")

    assert response.status_code == 200
    assert response.json()["selected_date"] == "2026-05-07"


def test_dashboard_summary_includes_daily_tasks_for_date(client: TestClient) -> None:
    client.post(
        "/api/tasks/daily",
        json={
            "title": "Today",
            "task_date": "2026-05-07",
            "planned_time": "09:00",
            "due_date": "2026-05-08",
        },
    )
    client.post("/api/tasks/daily", json={"title": "Tomorrow", "task_date": "2026-05-08"})

    response = client.get("/api/dashboard/summary?date=2026-05-07")

    assert response.status_code == 200
    data = response.json()
    assert [task["title"] for task in data["daily_tasks"]] == ["Today"]
    assert data["daily_tasks"][0]["planned_time"] == "09:00:00"
    assert data["daily_tasks"][0]["due_date"] == "2026-05-08"
    assert data["counts"]["daily_task_count"] == 1
    assert data["counts"]["incomplete_daily_task_count"] == 1


def test_dashboard_summary_excludes_archived_daily_tasks(client: TestClient) -> None:
    task = client.post(
        "/api/tasks/daily",
        json={"title": "Archived", "task_date": "2026-05-07"},
    ).json()
    client.delete(f"/api/tasks/daily/{task['id']}")

    response = client.get("/api/dashboard/summary?date=2026-05-07")

    assert response.status_code == 200
    assert response.json()["daily_tasks"] == []


def test_dashboard_summary_includes_weekly_tasks_scheduled_for_date(
    client: TestClient,
) -> None:
    client.post("/api/tasks/weekly", json={"title": "Thursday", "weekdays": [3]})
    client.post("/api/tasks/weekly", json={"title": "Friday", "weekdays": [4]})

    response = client.get("/api/dashboard/summary?date=2026-05-07")

    assert response.status_code == 200
    data = response.json()
    assert [task["title"] for task in data["weekly_tasks"]] == ["Thursday"]
    assert data["counts"]["weekly_task_count"] == 1
    assert data["counts"]["incomplete_weekly_task_count"] == 1


def test_dashboard_summary_includes_biweekly_and_monthly_occurrences(
    client: TestClient,
) -> None:
    client.post(
        "/api/tasks/weekly",
        json={
            "title": "Bi-weekly",
            "weekdays": [0],
            "recurrence_type": "biweekly",
            "anchor_date": "2026-05-04",
        },
    )
    client.post(
        "/api/tasks/weekly",
        json={
            "title": "Monthly",
            "recurrence_type": "monthly_day",
            "day_of_month": 18,
        },
    )

    response = client.get("/api/dashboard/summary?date=2026-05-18")

    assert response.status_code == 200
    assert [task["title"] for task in response.json()["weekly_tasks"]] == [
        "Bi-weekly",
        "Monthly",
    ]


def test_dashboard_summary_marks_completed_weekly_occurrences(
    client: TestClient,
) -> None:
    task = client.post(
        "/api/tasks/weekly",
        json={"title": "Review", "weekdays": [3]},
    ).json()
    client.post(f"/api/tasks/weekly/{task['id']}/complete?completion_date=2026-05-07")

    response = client.get("/api/dashboard/summary?date=2026-05-07")

    assert response.status_code == 200
    weekly_task = response.json()["weekly_tasks"][0]
    assert weekly_task["is_completed"] is True
    assert weekly_task["completion_id"] is not None
    assert response.json()["counts"]["incomplete_weekly_task_count"] == 0


def test_dashboard_summary_excludes_archived_weekly_tasks(client: TestClient) -> None:
    task = client.post(
        "/api/tasks/weekly",
        json={"title": "Archived weekly", "weekdays": [3]},
    ).json()
    client.delete(f"/api/tasks/weekly/{task['id']}")

    response = client.get("/api/dashboard/summary?date=2026-05-07")

    assert response.status_code == 200
    assert response.json()["weekly_tasks"] == []


def test_dashboard_summary_includes_recent_active_notes(client: TestClient) -> None:
    client.post("/api/notes", json={"title": "First", "content": "Older"})
    second = client.post(
        "/api/notes",
        json={"title": "Second", "content": "Archived"},
    ).json()
    client.post("/api/notes", json={"title": "Third", "content": "Newest"})
    client.delete(f"/api/notes/{second['id']}")

    response = client.get(
        "/api/dashboard/summary?date=2026-05-07&recent_notes_limit=2"
    )

    assert response.status_code == 200
    data = response.json()
    assert [note["title"] for note in data["recent_notes"]] == ["Third", "First"]
    assert data["counts"]["recent_note_count"] == 2
