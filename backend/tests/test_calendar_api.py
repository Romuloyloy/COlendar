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
    assert data["is_archived"] is False


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
