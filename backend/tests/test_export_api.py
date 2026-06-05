from fastapi.testclient import TestClient


def test_full_export_returns_backup_shape_and_metadata(client: TestClient) -> None:
    seed_export_data(client)

    response = client.get("/api/export/full")

    assert response.status_code == 200
    data = response.json()
    assert data["metadata"]["app"] == "COlendar"
    assert data["metadata"]["version"] == "v0.1-alpha"
    assert data["metadata"]["format"] == "backup-json-v1"
    assert data["metadata"]["archived_records"] == "included"
    assert "exported_at" in data["metadata"]
    assert set(data["data"]) == {
        "categories",
        "folders",
        "notes",
        "tasks",
        "calendar",
        "tracker",
        "sheets",
        "dashboard",
    }


def test_full_export_includes_all_current_modules(client: TestClient) -> None:
    seed_export_data(client)

    data = client.get("/api/export/full").json()["data"]

    assert [category["name"] for category in data["categories"]] == ["Work"]
    assert [folder["name"] for folder in data["folders"]] == ["Archive box"]
    assert [note["title"] for note in data["notes"]] == ["Backup note"]
    assert [task["title"] for task in data["tasks"]["one_time_tasks"]] == ["Backup task"]
    assert [task["title"] for task in data["tasks"]["recurring_tasks"]] == [
        "Weekly backup",
    ]
    assert len(data["tasks"]["recurring_task_completions"]) == 1
    assert [event["title"] for event in data["calendar"]["events"]] == [
        "Backup event",
    ]
    assert data["tracker"]["water_entries"][0]["amount_ml"] == 250
    assert data["tracker"]["activity_entries"][0]["quantity"] == 2.5
    assert data["tracker"]["calorie_entries"][0]["amount_kcal"] == 400
    assert any(sheet["name"] == "Today" for sheet in data["sheets"]["sheets"])
    assert len(data["sheets"]["sheet_widget_slots"]) >= 8


def test_export_includes_archived_records_for_backup_completeness(
    client: TestClient,
) -> None:
    category = client.post(
        "/api/tasks/categories",
        json={"name": "Archived category", "color": "#999999"},
    ).json()
    note = client.post("/api/notes", json={"title": "Archived note"}).json()
    client.delete(f"/api/tasks/categories/{category['id']}")
    client.delete(f"/api/notes/{note['id']}")

    data = client.get("/api/export/full").json()["data"]

    exported_category = next(
        item for item in data["categories"] if item["id"] == category["id"]
    )
    exported_note = next(item for item in data["notes"] if item["id"] == note["id"])
    assert exported_category["is_archived"] is True
    assert exported_note["is_archived"] is True


def test_per_module_export_routes_return_json(client: TestClient) -> None:
    seed_export_data(client)

    assert client.get("/api/export/notes").json()["notes"][0]["title"] == "Backup note"
    assert client.get("/api/export/tasks").json()["one_time_tasks"][0]["title"] == "Backup task"
    assert client.get("/api/export/calendar").json()["events"][0]["title"] == "Backup event"
    assert client.get("/api/export/tracker").json()["water_entries"][0]["amount_ml"] == 250
    assert client.get("/api/export/categories").json()["categories"][0]["name"] == "Work"
    assert "sheet_widget_slots" in client.get("/api/export/sheets").json()


def seed_export_data(client: TestClient) -> None:
    category = client.post(
        "/api/tasks/categories",
        json={"name": "Work", "color": "#14b8a6"},
    ).json()
    folder = client.post("/api/folders", json={"name": "Archive box"}).json()
    client.post(
        "/api/notes",
        json={
            "title": "Backup note",
            "content": "Keep me",
            "folder_id": folder["id"],
            "category_id": category["id"],
        },
    )
    client.post(
        "/api/tasks/daily",
        json={
            "title": "Backup task",
            "task_date": "2026-06-05",
            "category_id": category["id"],
        },
    )
    recurring_task = client.post(
        "/api/tasks/weekly",
        json={
            "title": "Weekly backup",
            "weekdays": [4],
            "category_id": category["id"],
        },
    ).json()
    client.post(
        f"/api/tasks/weekly/{recurring_task['id']}/complete?completion_date=2026-06-05",
    )
    client.post(
        "/api/calendar/events",
        json={
            "title": "Backup event",
            "event_date": "2026-06-05",
            "category_id": category["id"],
        },
    )
    client.post(
        "/api/tracker/water",
        json={"entry_date": "2026-06-05", "amount_ml": 250},
    )
    client.post(
        "/api/tracker/activity",
        json={
            "entry_date": "2026-06-05",
            "activity_type": "Walk",
            "quantity": "2.50",
        },
    )
    client.post(
        "/api/tracker/calories",
        json={"entry_date": "2026-06-05", "amount_kcal": 400, "label": "Lunch"},
    )
    client.get("/api/sheets")
