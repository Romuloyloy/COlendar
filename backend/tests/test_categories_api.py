from fastapi.testclient import TestClient


def test_category_overview_composes_category_workspace(
    client: TestClient,
) -> None:
    category = client.post(
        "/api/tasks/categories",
        json={"name": "Work", "color": "#0f766e"},
    ).json()
    other_category = client.post(
        "/api/tasks/categories",
        json={"name": "Health", "color": "#22c55e"},
    ).json()

    client.post(
        "/api/tasks/daily",
        json={
            "title": "Write brief",
            "task_date": "2026-05-22",
            "category_id": category["id"],
        },
    )
    completed_task = client.post(
        "/api/tasks/daily",
        json={
            "title": "Already done",
            "task_date": "2026-05-22",
            "category_id": category["id"],
        },
    ).json()
    client.post(f"/api/tasks/daily/{completed_task['id']}/complete")
    client.post(
        "/api/tasks/daily",
        json={
            "title": "Gym",
            "task_date": "2026-05-22",
            "category_id": other_category["id"],
        },
    )

    client.post(
        "/api/tasks/weekly",
        json={
            "title": "Standup",
            "weekdays": [4],
            "category_id": category["id"],
        },
    )
    client.post(
        "/api/notes",
        json={
            "title": "Work note",
            "content": "Context for the category workspace",
            "category_id": category["id"],
        },
    )
    client.post(
        "/api/notes",
        json={
            "title": "Health note",
            "content": "Not in this overview",
            "category_id": other_category["id"],
        },
    )
    client.post(
        "/api/calendar/events",
        json={
            "title": "Work review",
            "event_date": "2026-05-23",
            "category_id": category["id"],
        },
    )
    client.post(
        "/api/calendar/events",
        json={
            "title": "Workout",
            "event_date": "2026-05-23",
            "category_id": other_category["id"],
        },
    )

    response = client.get(
        f"/api/categories/{category['id']}/overview?date=2026-05-22"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["category"]["name"] == "Work"
    assert [task["title"] for task in data["daily_tasks"]] == ["Write brief"]
    assert [task["title"] for task in data["recurring_tasks"]] == ["Standup"]
    assert [note["title"] for note in data["recent_notes"]] == ["Work note"]
    assert [event["title"] for event in data["upcoming_events"]] == ["Work review"]


def test_category_overview_rejects_archived_category(client: TestClient) -> None:
    category = client.post(
        "/api/tasks/categories",
        json={"name": "Archived", "color": "#94a3b8"},
    ).json()
    client.delete(f"/api/tasks/categories/{category['id']}")

    response = client.get(
        f"/api/categories/{category['id']}/overview?date=2026-05-22"
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Task category not found"
