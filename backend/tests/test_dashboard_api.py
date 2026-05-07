from fastapi.testclient import TestClient


def test_dashboard_summary_returns_selected_date(client: TestClient) -> None:
    response = client.get("/api/dashboard/summary?date=2026-05-07")

    assert response.status_code == 200
    assert response.json()["selected_date"] == "2026-05-07"


def test_dashboard_summary_includes_daily_tasks_for_date(client: TestClient) -> None:
    client.post("/api/tasks/daily", json={"title": "Today", "task_date": "2026-05-07"})
    client.post("/api/tasks/daily", json={"title": "Tomorrow", "task_date": "2026-05-08"})

    response = client.get("/api/dashboard/summary?date=2026-05-07")

    assert response.status_code == 200
    data = response.json()
    assert [task["title"] for task in data["daily_tasks"]] == ["Today"]
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
