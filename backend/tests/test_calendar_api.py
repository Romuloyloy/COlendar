from fastapi.testclient import TestClient


def test_create_calendar_event(client: TestClient) -> None:
    response = client.post(
        "/api/calendar/events",
        json={
            "title": "Dentist",
            "description": "Routine check",
            "event_date": "2026-05-07",
            "start_time": "09:30",
            "end_time": "10:00",
            "location": "Clinic",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Dentist"
    assert data["event_date"] == "2026-05-07"
    assert data["start_time"] == "09:30:00"
    assert data["end_time"] == "10:00:00"
    assert data["location"] == "Clinic"
    assert data["category_id"] is None
    assert data["recurrence_type"] == "none"
    assert data["weekdays"] == []
    assert data["is_archived"] is False


def test_create_calendar_event_with_shared_category(client: TestClient) -> None:
    category = client.post(
        "/api/tasks/categories",
        json={"name": "School", "color": "#14b8a6"},
    ).json()

    response = client.post(
        "/api/calendar/events",
        json={
            "title": "Seminar",
            "event_date": "2026-05-07",
            "category_id": category["id"],
        },
    )

    assert response.status_code == 201
    assert response.json()["category_id"] == category["id"]


def test_reject_invalid_or_archived_calendar_event_category(
    client: TestClient,
) -> None:
    category = client.post(
        "/api/tasks/categories",
        json={"name": "Archived", "color": "#999999"},
    ).json()
    event = client.post(
        "/api/calendar/events",
        json={"title": "Event", "event_date": "2026-05-07"},
    ).json()
    client.delete(f"/api/tasks/categories/{category['id']}")

    create_response = client.post(
        "/api/calendar/events",
        json={
            "title": "Bad category",
            "event_date": "2026-05-07",
            "category_id": 9999,
        },
    )
    update_response = client.patch(
        f"/api/calendar/events/{event['id']}",
        json={"category_id": category["id"]},
    )

    assert create_response.status_code == 400
    assert update_response.status_code == 400


def test_reject_blank_calendar_event_title(client: TestClient) -> None:
    response = client.post(
        "/api/calendar/events",
        json={"title": "   ", "event_date": "2026-05-07"},
    )

    assert response.status_code == 422


def test_reject_calendar_event_end_time_before_start_time(
    client: TestClient,
) -> None:
    create_response = client.post(
        "/api/calendar/events",
        json={
            "title": "Backwards",
            "event_date": "2026-05-07",
            "start_time": "11:00",
            "end_time": "10:00",
        },
    )
    event = client.post(
        "/api/calendar/events",
        json={
            "title": "Valid",
            "event_date": "2026-05-07",
            "start_time": "09:00",
            "end_time": "10:00",
        },
    ).json()
    update_response = client.patch(
        f"/api/calendar/events/{event['id']}",
        json={"end_time": "08:00"},
    )

    assert create_response.status_code == 422
    assert update_response.status_code == 400


def test_list_calendar_events(client: TestClient) -> None:
    client.post(
        "/api/calendar/events",
        json={"title": "Second", "event_date": "2026-05-08"},
    )
    client.post(
        "/api/calendar/events",
        json={"title": "First", "event_date": "2026-05-07", "start_time": "09:00"},
    )

    response = client.get("/api/calendar/events")

    assert response.status_code == 200
    assert [event["title"] for event in response.json()] == ["First", "Second"]


def test_list_calendar_events_for_specific_date(client: TestClient) -> None:
    client.post(
        "/api/calendar/events",
        json={"title": "Today", "event_date": "2026-05-07"},
    )
    client.post(
        "/api/calendar/events",
        json={"title": "Tomorrow", "event_date": "2026-05-08"},
    )

    response = client.get("/api/calendar/events?date=2026-05-07")

    assert response.status_code == 200
    assert [event["title"] for event in response.json()] == ["Today"]


def test_list_calendar_events_for_date_range(client: TestClient) -> None:
    client.post("/api/calendar/events", json={"title": "Before", "event_date": "2026-05-06"})
    client.post("/api/calendar/events", json={"title": "Inside", "event_date": "2026-05-07"})
    client.post("/api/calendar/events", json={"title": "After", "event_date": "2026-05-09"})

    response = client.get(
        "/api/calendar/events?from_date=2026-05-07&to_date=2026-05-08"
    )

    assert response.status_code == 200
    assert [event["title"] for event in response.json()] == ["Inside"]


def test_list_calendar_events_for_date_range_excludes_archived(
    client: TestClient,
) -> None:
    archived = client.post(
        "/api/calendar/events",
        json={"title": "Archived", "event_date": "2026-05-07"},
    ).json()
    client.post(
        "/api/calendar/events",
        json={"title": "Active", "event_date": "2026-05-08"},
    )
    client.delete(f"/api/calendar/events/{archived['id']}")

    response = client.get(
        "/api/calendar/events?from_date=2026-05-01&to_date=2026-05-31"
    )

    assert response.status_code == 200
    assert [event["title"] for event in response.json()] == ["Active"]


def test_calendar_overview_composes_events_and_tasks(client: TestClient) -> None:
    client.post(
        "/api/calendar/events",
        json={"title": "Appointment", "event_date": "2026-05-07"},
    )
    client.post(
        "/api/tasks/daily",
        json={"title": "One-time", "task_date": "2026-05-07"},
    )
    recurring = client.post(
        "/api/tasks/weekly",
        json={"title": "Recurring", "weekdays": [3]},
    ).json()
    client.post(f"/api/tasks/weekly/{recurring['id']}/complete?completion_date=2026-05-07")

    response = client.get(
        "/api/calendar/overview?from_date=2026-05-07&to_date=2026-05-08"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["from_date"] == "2026-05-07"
    assert data["to_date"] == "2026-05-08"
    first_day = data["days"][0]
    second_day = data["days"][1]
    assert first_day["date"] == "2026-05-07"
    assert [event["title"] for event in first_day["calendar_events"]] == [
        "Appointment"
    ]
    assert [task["title"] for task in first_day["daily_tasks"]] == ["One-time"]
    assert [task["title"] for task in first_day["recurring_tasks"]] == ["Recurring"]
    assert first_day["recurring_tasks"][0]["is_completed"] is True
    assert second_day["calendar_events"] == []
    assert second_day["daily_tasks"] == []
    assert second_day["recurring_tasks"] == []


def test_calendar_overview_excludes_archived_items(client: TestClient) -> None:
    event = client.post(
        "/api/calendar/events",
        json={"title": "Archived event", "event_date": "2026-05-07"},
    ).json()
    daily_task = client.post(
        "/api/tasks/daily",
        json={"title": "Archived one-time", "task_date": "2026-05-07"},
    ).json()
    recurring = client.post(
        "/api/tasks/weekly",
        json={"title": "Archived recurring", "weekdays": [3]},
    ).json()
    client.delete(f"/api/calendar/events/{event['id']}")
    client.delete(f"/api/tasks/daily/{daily_task['id']}")
    client.delete(f"/api/tasks/weekly/{recurring['id']}")

    response = client.get(
        "/api/calendar/overview?from_date=2026-05-07&to_date=2026-05-07"
    )

    assert response.status_code == 200
    day = response.json()["days"][0]
    assert day["calendar_events"] == []
    assert day["daily_tasks"] == []
    assert day["recurring_tasks"] == []


def test_calendar_overview_respects_recurring_rules(client: TestClient) -> None:
    client.post(
        "/api/tasks/weekly",
        json={
            "title": "Bi-weekly Monday",
            "weekdays": [0],
            "recurrence_type": "biweekly",
            "anchor_date": "2026-05-04",
        },
    )
    client.post(
        "/api/tasks/weekly",
        json={
            "title": "Monthly 31",
            "recurrence_type": "monthly_day",
            "day_of_month": 31,
        },
    )

    response = client.get(
        "/api/calendar/overview?from_date=2026-05-11&to_date=2026-05-31"
    )

    assert response.status_code == 200
    by_date = {day["date"]: day for day in response.json()["days"]}
    assert by_date["2026-05-11"]["recurring_tasks"] == []
    assert [task["title"] for task in by_date["2026-05-18"]["recurring_tasks"]] == [
        "Bi-weekly Monday"
    ]
    assert [task["title"] for task in by_date["2026-05-31"]["recurring_tasks"]] == [
        "Monthly 31"
    ]


def test_calendar_overview_includes_recurring_event_occurrences(
    client: TestClient,
) -> None:
    client.post(
        "/api/calendar/events",
        json={
            "title": "Weekly standup",
            "event_date": "2026-05-04",
            "recurrence_type": "weekly",
            "weekdays": [0],
        },
    )
    client.post(
        "/api/calendar/events",
        json={
            "title": "Bi-weekly sync",
            "event_date": "2026-05-04",
            "recurrence_type": "biweekly",
            "weekdays": [0],
            "anchor_date": "2026-05-04",
        },
    )
    client.post(
        "/api/calendar/events",
        json={
            "title": "Monthly review",
            "event_date": "2026-05-01",
            "recurrence_type": "monthly_day",
            "day_of_month": 31,
        },
    )

    response = client.get(
        "/api/calendar/overview?from_date=2026-05-11&to_date=2026-05-31"
    )

    assert response.status_code == 200
    by_date = {day["date"]: day for day in response.json()["days"]}
    assert [event["title"] for event in by_date["2026-05-11"]["calendar_events"]] == [
        "Weekly standup"
    ]
    assert [event["title"] for event in by_date["2026-05-18"]["calendar_events"]] == [
        "Weekly standup",
        "Bi-weekly sync",
    ]
    assert [event["title"] for event in by_date["2026-05-31"]["calendar_events"]] == [
        "Monthly review"
    ]


def test_recurring_calendar_event_end_date_and_archive_are_respected(
    client: TestClient,
) -> None:
    archived = client.post(
        "/api/calendar/events",
        json={
            "title": "Archived weekly",
            "event_date": "2026-05-04",
            "recurrence_type": "weekly",
            "weekdays": [0],
        },
    ).json()
    client.delete(f"/api/calendar/events/{archived['id']}")
    client.post(
        "/api/calendar/events",
        json={
            "title": "Short weekly",
            "event_date": "2026-05-04",
            "recurrence_type": "weekly",
            "weekdays": [0],
            "recurrence_end_date": "2026-05-11",
        },
    )

    response = client.get(
        "/api/calendar/overview?from_date=2026-05-11&to_date=2026-05-18"
    )

    assert response.status_code == 200
    by_date = {day["date"]: day for day in response.json()["days"]}
    assert [event["title"] for event in by_date["2026-05-11"]["calendar_events"]] == [
        "Short weekly"
    ]
    assert by_date["2026-05-18"]["calendar_events"] == []


def test_reject_invalid_recurring_calendar_event(client: TestClient) -> None:
    missing_weekday = client.post(
        "/api/calendar/events",
        json={
            "title": "Weekly",
            "event_date": "2026-05-04",
            "recurrence_type": "weekly",
            "weekdays": [],
        },
    )
    missing_anchor = client.post(
        "/api/calendar/events",
        json={
            "title": "Bi-weekly",
            "event_date": "2026-05-04",
            "recurrence_type": "biweekly",
            "weekdays": [0],
        },
    )
    invalid_monthly = client.post(
        "/api/calendar/events",
        json={
            "title": "Monthly",
            "event_date": "2026-05-04",
            "recurrence_type": "monthly_day",
        },
    )

    assert missing_weekday.status_code == 422
    assert missing_anchor.status_code == 422
    assert invalid_monthly.status_code == 422


def test_reject_invalid_calendar_event_date_query(client: TestClient) -> None:
    response = client.get(
        "/api/calendar/events?from_date=2026-05-08&to_date=2026-05-07"
    )

    assert response.status_code == 400


def test_list_upcoming_calendar_events(client: TestClient) -> None:
    client.post("/api/calendar/events", json={"title": "Old", "event_date": "2099-01-01"})
    client.post("/api/calendar/events", json={"title": "Next", "event_date": "2099-01-02"})

    response = client.get("/api/calendar/events?upcoming=true&from_date=2099-01-02")

    assert response.status_code == 200
    assert [event["title"] for event in response.json()] == ["Next"]


def test_update_calendar_event(client: TestClient) -> None:
    event = client.post(
        "/api/calendar/events",
        json={"title": "Draft", "event_date": "2026-05-07"},
    ).json()

    response = client.patch(
        f"/api/calendar/events/{event['id']}",
        json={
            "title": "Updated",
            "description": "Edited",
            "event_date": "2026-05-08",
            "start_time": "14:00",
            "end_time": "15:00",
            "location": "Library",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated"
    assert data["description"] == "Edited"
    assert data["event_date"] == "2026-05-08"
    assert data["start_time"] == "14:00:00"
    assert data["end_time"] == "15:00:00"
    assert data["location"] == "Library"


def test_archive_calendar_event(client: TestClient) -> None:
    event = client.post(
        "/api/calendar/events",
        json={"title": "Archive me", "event_date": "2026-05-07"},
    ).json()

    archive_response = client.delete(f"/api/calendar/events/{event['id']}")
    get_response = client.get(f"/api/calendar/events/{event['id']}")
    list_response = client.get("/api/calendar/events?date=2026-05-07")

    assert archive_response.status_code == 204
    assert get_response.status_code == 404
    assert list_response.json() == []


def test_missing_calendar_event_returns_404(client: TestClient) -> None:
    response = client.get("/api/calendar/events/9999")

    assert response.status_code == 404


def test_dashboard_summary_includes_upcoming_events(client: TestClient) -> None:
    archived = client.post(
        "/api/calendar/events",
        json={"title": "Archived", "event_date": "2026-05-07"},
    ).json()
    client.delete(f"/api/calendar/events/{archived['id']}")
    client.post(
        "/api/calendar/events",
        json={"title": "Next", "event_date": "2026-05-07", "start_time": "09:00"},
    )
    client.post(
        "/api/calendar/events",
        json={"title": "Later", "event_date": "2026-05-08"},
    )

    response = client.get("/api/dashboard/summary?date=2026-05-07")

    assert response.status_code == 200
    data = response.json()
    assert [event["title"] for event in data["upcoming_events"]] == ["Next", "Later"]
    assert data["counts"]["upcoming_event_count"] == 2


def test_dashboard_summary_includes_recurring_event_occurrences(
    client: TestClient,
) -> None:
    client.post(
        "/api/calendar/events",
        json={
            "title": "Weekly event",
            "event_date": "2026-05-04",
            "recurrence_type": "weekly",
            "weekdays": [0],
        },
    )

    response = client.get("/api/dashboard/summary?date=2026-05-11")

    assert response.status_code == 200
    events = response.json()["upcoming_events"]
    assert events[0]["title"] == "Weekly event"
    assert events[0]["event_date"] == "2026-05-11"
