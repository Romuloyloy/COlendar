from fastapi.testclient import TestClient


def test_daily_planning_endpoint_returns_selected_date(client: TestClient) -> None:
    response = client.get("/api/planning/daily?date=2026-05-07")

    assert response.status_code == 200
    assert response.json()["selected_date"] == "2026-05-07"


def test_daily_planning_includes_daily_tasks(client: TestClient) -> None:
    client.post("/api/tasks/daily", json={"title": "Today", "task_date": "2026-05-07"})
    client.post("/api/tasks/daily", json={"title": "Tomorrow", "task_date": "2026-05-08"})

    response = client.get("/api/planning/daily?date=2026-05-07")

    assert response.status_code == 200
    assert [task["title"] for task in response.json()["daily_tasks"]] == ["Today"]


def test_daily_planning_includes_weekly_scheduled_tasks(client: TestClient) -> None:
    client.post("/api/tasks/weekly", json={"title": "Thursday", "weekdays": [3]})
    client.post("/api/tasks/weekly", json={"title": "Friday", "weekdays": [4]})

    response = client.get("/api/planning/daily?date=2026-05-07")

    assert response.status_code == 200
    assert [task["title"] for task in response.json()["weekly_tasks"]] == ["Thursday"]


def test_daily_planning_includes_calendar_events(client: TestClient) -> None:
    client.post(
        "/api/calendar/events",
        json={"title": "Appointment", "event_date": "2026-05-07"},
    )
    client.post(
        "/api/calendar/events",
        json={"title": "Different day", "event_date": "2026-05-08"},
    )

    response = client.get("/api/planning/daily?date=2026-05-07")

    assert response.status_code == 200
    assert [event["title"] for event in response.json()["calendar_events"]] == [
        "Appointment"
    ]


def test_weekly_planning_endpoint_returns_seven_days(client: TestClient) -> None:
    response = client.get("/api/planning/weekly?date=2026-05-07")

    assert response.status_code == 200
    data = response.json()
    assert data["week_start"] == "2026-05-04"
    assert data["week_end"] == "2026-05-10"
    assert len(data["days"]) == 7
    assert [day["date"] for day in data["days"]] == [
        "2026-05-04",
        "2026-05-05",
        "2026-05-06",
        "2026-05-07",
        "2026-05-08",
        "2026-05-09",
        "2026-05-10",
    ]


def test_weekly_planning_groups_events_and_tasks_by_day(client: TestClient) -> None:
    client.post("/api/tasks/daily", json={"title": "Daily", "task_date": "2026-05-07"})
    client.post("/api/tasks/weekly", json={"title": "Weekly", "weekdays": [3]})
    client.post(
        "/api/calendar/events",
        json={"title": "Event", "event_date": "2026-05-07"},
    )

    response = client.get("/api/planning/weekly?date=2026-05-07")

    assert response.status_code == 200
    thursday = next(day for day in response.json()["days"] if day["date"] == "2026-05-07")
    assert [task["title"] for task in thursday["daily_tasks"]] == ["Daily"]
    assert [task["title"] for task in thursday["weekly_tasks"]] == ["Weekly"]
    assert [event["title"] for event in thursday["calendar_events"]] == ["Event"]


def test_planning_excludes_archived_tasks_and_events(client: TestClient) -> None:
    daily_task = client.post(
        "/api/tasks/daily",
        json={"title": "Archived daily", "task_date": "2026-05-07"},
    ).json()
    weekly_task = client.post(
        "/api/tasks/weekly",
        json={"title": "Archived weekly", "weekdays": [3]},
    ).json()
    event = client.post(
        "/api/calendar/events",
        json={"title": "Archived event", "event_date": "2026-05-07"},
    ).json()
    client.delete(f"/api/tasks/daily/{daily_task['id']}")
    client.delete(f"/api/tasks/weekly/{weekly_task['id']}")
    client.delete(f"/api/calendar/events/{event['id']}")

    response = client.get("/api/planning/daily?date=2026-05-07")

    assert response.status_code == 200
    data = response.json()
    assert data["daily_tasks"] == []
    assert data["weekly_tasks"] == []
    assert data["calendar_events"] == []
