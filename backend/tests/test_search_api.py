from fastapi.testclient import TestClient


def search(client: TestClient, query: str):
    return client.get("/api/search", params={"q": query})


def test_search_notes_by_title(client: TestClient) -> None:
    note = client.post(
        "/api/notes",
        json={"title": "Gym plan", "content": "Leg day"},
    ).json()

    response = search(client, "gym")

    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "gym"
    assert data["results"]["notes"][0]["id"] == note["id"]
    assert data["results"]["notes"][0]["target_url"] == "/notes"


def test_search_notes_by_content(client: TestClient) -> None:
    note = client.post(
        "/api/notes",
        json={"title": "Saturday", "content": "Pick up climbing shoes"},
    ).json()

    response = search(client, "climbing")

    assert response.status_code == 200
    assert response.json()["results"]["notes"][0]["id"] == note["id"]


def test_search_folders(client: TestClient) -> None:
    folder = client.post("/api/folders", json={"name": "Fitness"}).json()

    response = search(client, "fit")

    assert response.status_code == 200
    assert response.json()["results"]["folders"][0]["id"] == folder["id"]


def test_search_daily_tasks(client: TestClient) -> None:
    task = client.post(
        "/api/tasks/daily",
        json={
            "title": "Buy groceries",
            "description": "Milk and oats",
            "task_date": "2026-05-07",
        },
    ).json()

    response = search(client, "oats")

    assert response.status_code == 200
    result = response.json()["results"]["daily_tasks"][0]
    assert result["id"] == task["id"]
    assert result["date"] == "2026-05-07"
    assert result["target_url"] == "/tasks"


def test_search_weekly_tasks(client: TestClient) -> None:
    task = client.post(
        "/api/tasks/weekly",
        json={"title": "Clean desk", "description": "Reset workspace", "weekdays": [0, 4]},
    ).json()

    response = search(client, "workspace")

    assert response.status_code == 200
    assert response.json()["results"]["weekly_tasks"][0]["id"] == task["id"]


def test_search_calendar_events(client: TestClient) -> None:
    event = client.post(
        "/api/calendar/events",
        json={
            "title": "Doctor appointment",
            "description": "Annual checkup",
            "event_date": "2026-05-08",
            "location": "North clinic",
        },
    ).json()

    response = search(client, "clinic")

    assert response.status_code == 200
    result = response.json()["results"]["calendar_events"][0]
    assert result["id"] == event["id"]
    assert result["date"] == "2026-05-08"
    assert result["target_url"] == "/calendar"


def test_search_excludes_archived_records(client: TestClient) -> None:
    note = client.post("/api/notes", json={"title": "Archive gym"}).json()
    daily = client.post(
        "/api/tasks/daily",
        json={"title": "Archive gym", "description": "", "task_date": "2026-05-07"},
    ).json()
    weekly = client.post(
        "/api/tasks/weekly",
        json={"title": "Archive gym", "description": "", "weekdays": [2]},
    ).json()
    event = client.post(
        "/api/calendar/events",
        json={"title": "Archive gym", "event_date": "2026-05-07"},
    ).json()
    folder = client.post("/api/folders", json={"name": "Archive gym"}).json()

    client.delete(f"/api/notes/{note['id']}")
    client.delete(f"/api/tasks/daily/{daily['id']}")
    client.delete(f"/api/tasks/weekly/{weekly['id']}")
    client.delete(f"/api/calendar/events/{event['id']}")
    client.delete(f"/api/folders/{folder['id']}")

    response = search(client, "archive gym")

    assert response.status_code == 200
    assert response.json()["results"] == {
        "notes": [],
        "folders": [],
        "daily_tasks": [],
        "weekly_tasks": [],
        "calendar_events": [],
    }


def test_search_rejects_empty_query(client: TestClient) -> None:
    response = search(client, "   ")

    assert response.status_code == 422
    assert response.json()["detail"] == "Search query cannot be empty"


def test_search_is_case_insensitive(client: TestClient) -> None:
    note = client.post(
        "/api/notes",
        json={"title": "Meal Prep", "content": ""},
    ).json()

    response = search(client, "meal prep")

    assert response.status_code == 200
    assert response.json()["results"]["notes"][0]["id"] == note["id"]
