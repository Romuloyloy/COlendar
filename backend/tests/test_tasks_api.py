from fastapi.testclient import TestClient


def create_category(client: TestClient, name: str = "School") -> dict:
    return client.post(
        "/api/tasks/categories",
        json={"name": name, "color": "#14b8a6"},
    ).json()


def test_create_task_category(client: TestClient) -> None:
    response = client.post(
        "/api/tasks/categories",
        json={"name": "School", "color": "#14b8a6"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "School"
    assert data["color"] == "#14b8a6"
    assert data["is_archived"] is False


def test_reject_blank_task_category_name(client: TestClient) -> None:
    response = client.post(
        "/api/tasks/categories",
        json={"name": "   ", "color": "#14b8a6"},
    )

    assert response.status_code == 422


def test_edit_task_category(client: TestClient) -> None:
    category = create_category(client)

    response = client.patch(
        f"/api/tasks/categories/{category['id']}",
        json={"name": "Gym", "color": "#f97316"},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Gym"
    assert response.json()["color"] == "#f97316"


def test_archive_task_category(client: TestClient) -> None:
    category = create_category(client)

    archive_response = client.delete(f"/api/tasks/categories/{category['id']}")
    list_response = client.get("/api/tasks/categories")

    assert archive_response.status_code == 204
    assert list_response.json() == []


def test_create_daily_task(client: TestClient) -> None:
    response = client.post(
        "/api/tasks/daily",
        json={"title": "Study", "description": "German", "task_date": "2026-05-07"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Study"
    assert data["task_date"] == "2026-05-07"
    assert data["is_completed"] is False
    assert data["category_id"] is None


def test_create_daily_task_with_category(client: TestClient) -> None:
    category = create_category(client)

    response = client.post(
        "/api/tasks/daily",
        json={
            "title": "Study",
            "task_date": "2026-05-07",
            "category_id": category["id"],
        },
    )

    assert response.status_code == 201
    assert response.json()["category_id"] == category["id"]


def test_reject_blank_daily_task_title(client: TestClient) -> None:
    response = client.post(
        "/api/tasks/daily",
        json={"title": "   ", "task_date": "2026-05-07"},
    )

    assert response.status_code == 422


def test_list_daily_tasks_by_date(client: TestClient) -> None:
    client.post("/api/tasks/daily", json={"title": "Today", "task_date": "2026-05-07"})
    client.post("/api/tasks/daily", json={"title": "Tomorrow", "task_date": "2026-05-08"})

    response = client.get("/api/tasks/daily?date=2026-05-07")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Today"


def test_update_daily_task(client: TestClient) -> None:
    category = create_category(client)
    task = client.post(
        "/api/tasks/daily",
        json={"title": "Draft", "task_date": "2026-05-07"},
    ).json()

    response = client.patch(
        f"/api/tasks/daily/{task['id']}",
        json={
            "title": "Updated",
            "description": "Edited",
            "task_date": "2026-05-08",
            "category_id": category["id"],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated"
    assert data["description"] == "Edited"
    assert data["task_date"] == "2026-05-08"
    assert data["category_id"] == category["id"]


def test_filter_daily_tasks_by_category(client: TestClient) -> None:
    school = create_category(client, "School")
    gym = create_category(client, "Gym")
    client.post(
        "/api/tasks/daily",
        json={
            "title": "Study",
            "task_date": "2026-05-07",
            "category_id": school["id"],
        },
    )
    client.post(
        "/api/tasks/daily",
        json={
            "title": "Lift",
            "task_date": "2026-05-07",
            "category_id": gym["id"],
        },
    )

    response = client.get(f"/api/tasks/daily?date=2026-05-07&category_id={school['id']}")

    assert response.status_code == 200
    assert [task["title"] for task in response.json()] == ["Study"]


def test_reject_invalid_daily_task_category_id(client: TestClient) -> None:
    response = client.post(
        "/api/tasks/daily",
        json={
            "title": "Study",
            "task_date": "2026-05-07",
            "category_id": 999,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Task category not found"


def test_complete_and_incomplete_daily_task(client: TestClient) -> None:
    task = client.post(
        "/api/tasks/daily",
        json={"title": "Complete me", "task_date": "2026-05-07"},
    ).json()

    complete_response = client.post(f"/api/tasks/daily/{task['id']}/complete")
    second_complete_response = client.post(f"/api/tasks/daily/{task['id']}/complete")
    incomplete_response = client.post(f"/api/tasks/daily/{task['id']}/incomplete")
    second_incomplete_response = client.post(f"/api/tasks/daily/{task['id']}/incomplete")

    assert complete_response.status_code == 200
    assert complete_response.json()["is_completed"] is True
    assert complete_response.json()["completed_at"] is not None
    assert second_complete_response.status_code == 200
    assert second_complete_response.json()["is_completed"] is True
    assert incomplete_response.status_code == 200
    assert incomplete_response.json()["is_completed"] is False
    assert incomplete_response.json()["completed_at"] is None
    assert second_incomplete_response.status_code == 200
    assert second_incomplete_response.json()["is_completed"] is False


def test_archive_daily_task(client: TestClient) -> None:
    task = client.post(
        "/api/tasks/daily",
        json={"title": "Archive me", "task_date": "2026-05-07"},
    ).json()

    archive_response = client.delete(f"/api/tasks/daily/{task['id']}")
    list_response = client.get("/api/tasks/daily?date=2026-05-07")

    assert archive_response.status_code == 204
    assert list_response.json() == []


def test_create_weekly_task(client: TestClient) -> None:
    response = client.post(
        "/api/tasks/weekly",
        json={"title": "Gym", "description": "Upper body", "weekdays": [1, 3]},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Gym"
    assert data["weekdays"] == [1, 3]
    assert data["category_id"] is None


def test_create_weekly_task_with_category(client: TestClient) -> None:
    category = create_category(client, "Health")

    response = client.post(
        "/api/tasks/weekly",
        json={"title": "Gym", "weekdays": [1, 3], "category_id": category["id"]},
    )

    assert response.status_code == 201
    assert response.json()["category_id"] == category["id"]


def test_reject_weekly_task_with_no_weekdays(client: TestClient) -> None:
    response = client.post(
        "/api/tasks/weekly",
        json={"title": "No days", "weekdays": []},
    )

    assert response.status_code == 422


def test_reject_invalid_weekdays(client: TestClient) -> None:
    response = client.post(
        "/api/tasks/weekly",
        json={"title": "Bad day", "weekdays": [7]},
    )

    assert response.status_code == 422


def test_list_and_filter_weekly_tasks(client: TestClient) -> None:
    client.post("/api/tasks/weekly", json={"title": "Monday", "weekdays": [0]})
    client.post("/api/tasks/weekly", json={"title": "Tuesday", "weekdays": [1]})

    all_response = client.get("/api/tasks/weekly")
    monday_response = client.get("/api/tasks/weekly?weekday=0")

    assert all_response.status_code == 200
    assert len(all_response.json()) == 2
    assert monday_response.status_code == 200
    assert len(monday_response.json()) == 1
    assert monday_response.json()[0]["title"] == "Monday"


def test_filter_weekly_tasks_by_category(client: TestClient) -> None:
    school = create_category(client, "School")
    health = create_category(client, "Health")
    client.post(
        "/api/tasks/weekly",
        json={"title": "Study", "weekdays": [0], "category_id": school["id"]},
    )
    client.post(
        "/api/tasks/weekly",
        json={"title": "Gym", "weekdays": [0], "category_id": health["id"]},
    )

    response = client.get(f"/api/tasks/weekly?weekday=0&category_id={health['id']}")

    assert response.status_code == 200
    assert [task["title"] for task in response.json()] == ["Gym"]


def test_update_weekly_task(client: TestClient) -> None:
    category = create_category(client, "School")
    task = client.post(
        "/api/tasks/weekly",
        json={"title": "Draft", "description": "", "weekdays": [0]},
    ).json()

    response = client.patch(
        f"/api/tasks/weekly/{task['id']}",
        json={
            "title": "Updated",
            "description": "Edited",
            "weekdays": [2, 4],
            "category_id": category["id"],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated"
    assert data["description"] == "Edited"
    assert data["weekdays"] == [2, 4]
    assert data["category_id"] == category["id"]


def test_reject_invalid_weekly_task_category_id(client: TestClient) -> None:
    response = client.post(
        "/api/tasks/weekly",
        json={"title": "Gym", "weekdays": [1], "category_id": 999},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Task category not found"


def test_archived_category_is_not_assignable(client: TestClient) -> None:
    category = create_category(client)
    client.delete(f"/api/tasks/categories/{category['id']}")

    response = client.post(
        "/api/tasks/daily",
        json={
            "title": "Study",
            "task_date": "2026-05-07",
            "category_id": category["id"],
        },
    )

    assert response.status_code == 400


def test_complete_and_incomplete_weekly_task_occurrence(client: TestClient) -> None:
    task = client.post(
        "/api/tasks/weekly",
        json={"title": "Review", "weekdays": [3]},
    ).json()

    complete_response = client.post(
        f"/api/tasks/weekly/{task['id']}/complete?completion_date=2026-05-07"
    )
    second_complete_response = client.post(
        f"/api/tasks/weekly/{task['id']}/complete?completion_date=2026-05-07"
    )
    incomplete_response = client.post(
        f"/api/tasks/weekly/{task['id']}/incomplete?completion_date=2026-05-07"
    )
    second_incomplete_response = client.post(
        f"/api/tasks/weekly/{task['id']}/incomplete?completion_date=2026-05-07"
    )

    assert complete_response.status_code == 200
    assert complete_response.json()["completion_date"] == "2026-05-07"
    assert second_complete_response.status_code == 200
    assert second_complete_response.json()["id"] == complete_response.json()["id"]
    assert incomplete_response.status_code == 204
    assert second_incomplete_response.status_code == 204


def test_reject_weekly_completion_on_unscheduled_date(client: TestClient) -> None:
    task = client.post(
        "/api/tasks/weekly",
        json={"title": "Monday only", "weekdays": [0]},
    ).json()

    complete_response = client.post(
        f"/api/tasks/weekly/{task['id']}/complete?completion_date=2026-05-07"
    )
    incomplete_response = client.post(
        f"/api/tasks/weekly/{task['id']}/incomplete?completion_date=2026-05-07"
    )

    assert complete_response.status_code == 400
    assert incomplete_response.status_code == 400


def test_list_weekly_task_completions_by_date(client: TestClient) -> None:
    task = client.post(
        "/api/tasks/weekly",
        json={"title": "Review", "weekdays": [3]},
    ).json()
    client.post(f"/api/tasks/weekly/{task['id']}/complete?completion_date=2026-05-07")

    response = client.get("/api/tasks/weekly/completions?completion_date=2026-05-07")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["weekly_task_id"] == task["id"]


def test_archive_weekly_task(client: TestClient) -> None:
    task = client.post(
        "/api/tasks/weekly",
        json={"title": "Archive weekly", "weekdays": [4]},
    ).json()

    archive_response = client.delete(f"/api/tasks/weekly/{task['id']}")
    list_response = client.get("/api/tasks/weekly")

    assert archive_response.status_code == 204
    assert list_response.json() == []
