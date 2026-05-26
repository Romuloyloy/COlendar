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
    assert data["planned_time"] is None
    assert data["due_date"] is None
    assert data["due_time"] is None
    assert data["is_completed"] is False
    assert data["category_id"] is None


def test_create_daily_task_with_planned_time(client: TestClient) -> None:
    response = client.post(
        "/api/tasks/daily",
        json={
            "title": "Study",
            "task_date": "2026-05-07",
            "planned_time": "09:30",
        },
    )

    assert response.status_code == 201
    assert response.json()["planned_time"] == "09:30:00"


def test_create_daily_task_with_due_date_and_time(client: TestClient) -> None:
    response = client.post(
        "/api/tasks/daily",
        json={
            "title": "Submit form",
            "task_date": "2026-05-07",
            "due_date": "2026-05-09",
            "due_time": "17:00",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["due_date"] == "2026-05-09"
    assert data["due_time"] == "17:00:00"


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
    client.post(
        "/api/tasks/daily",
        json={
            "title": "Today",
            "task_date": "2026-05-07",
            "planned_time": "08:45",
            "due_date": "2026-05-09",
        },
    )
    client.post("/api/tasks/daily", json={"title": "Tomorrow", "task_date": "2026-05-08"})

    response = client.get("/api/tasks/daily?date=2026-05-07")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Today"
    assert data[0]["planned_time"] == "08:45:00"
    assert data[0]["due_date"] == "2026-05-09"


def test_list_open_daily_tasks_carries_forward_incomplete_tasks(
    client: TestClient,
) -> None:
    past = client.post(
        "/api/tasks/daily",
        json={"title": "Past open", "task_date": "2026-05-06"},
    ).json()
    today = client.post(
        "/api/tasks/daily",
        json={"title": "Today open", "task_date": "2026-05-07"},
    ).json()
    completed = client.post(
        "/api/tasks/daily",
        json={"title": "Done", "task_date": "2026-05-05"},
    ).json()
    future = client.post(
        "/api/tasks/daily",
        json={"title": "Future", "task_date": "2026-05-08"},
    ).json()
    archived = client.post(
        "/api/tasks/daily",
        json={"title": "Archived", "task_date": "2026-05-04"},
    ).json()
    client.post(f"/api/tasks/daily/{completed['id']}/complete")
    client.delete(f"/api/tasks/daily/{archived['id']}")

    response = client.get("/api/tasks/daily?date=2026-05-07&mode=open")

    assert response.status_code == 200
    assert [task["id"] for task in response.json()] == [past["id"], today["id"]]
    assert future["id"] not in [task["id"] for task in response.json()]


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
            "planned_time": "10:15",
            "due_date": "2026-05-10",
            "due_time": "18:30",
            "category_id": category["id"],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated"
    assert data["description"] == "Edited"
    assert data["task_date"] == "2026-05-08"
    assert data["planned_time"] == "10:15:00"
    assert data["due_date"] == "2026-05-10"
    assert data["due_time"] == "18:30:00"
    assert data["category_id"] == category["id"]


def test_clear_daily_task_optional_time_fields(client: TestClient) -> None:
    task = client.post(
        "/api/tasks/daily",
        json={
            "title": "Draft",
            "task_date": "2026-05-07",
            "planned_time": "10:00",
            "due_date": "2026-05-08",
            "due_time": "17:00",
        },
    ).json()

    response = client.patch(
        f"/api/tasks/daily/{task['id']}",
        json={"planned_time": None, "due_date": None, "due_time": None},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["planned_time"] is None
    assert data["due_date"] is None
    assert data["due_time"] is None


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
    assert data["recurrence_type"] == "weekly"
    assert data["interval_weeks"] == 1
    assert data["anchor_date"] is None
    assert data["day_of_month"] is None
    assert data["end_date"] is None
    assert data["category_id"] is None


def test_create_biweekly_task(client: TestClient) -> None:
    response = client.post(
        "/api/tasks/weekly",
        json={
            "title": "Deep clean",
            "weekdays": [0],
            "recurrence_type": "biweekly",
            "anchor_date": "2026-05-04",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["recurrence_type"] == "biweekly"
    assert data["interval_weeks"] == 2
    assert data["anchor_date"] == "2026-05-04"
    assert data["weekdays"] == [0]


def test_create_monthly_day_task(client: TestClient) -> None:
    response = client.post(
        "/api/tasks/weekly",
        json={
            "title": "Pay rent",
            "recurrence_type": "monthly_day",
            "day_of_month": 1,
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["recurrence_type"] == "monthly_day"
    assert data["day_of_month"] == 1
    assert data["weekdays"] == []


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


def test_reject_biweekly_task_without_anchor_date(client: TestClient) -> None:
    response = client.post(
        "/api/tasks/weekly",
        json={
            "title": "No anchor",
            "weekdays": [0],
            "recurrence_type": "biweekly",
        },
    )

    assert response.status_code == 422


def test_reject_monthly_task_without_day_of_month(client: TestClient) -> None:
    response = client.post(
        "/api/tasks/weekly",
        json={"title": "No day", "recurrence_type": "monthly_day"},
    )

    assert response.status_code == 422


def test_reject_invalid_recurrence_type(client: TestClient) -> None:
    response = client.post(
        "/api/tasks/weekly",
        json={"title": "Bad", "weekdays": [0], "recurrence_type": "yearly"},
    )

    assert response.status_code == 422


def test_reject_invalid_day_of_month(client: TestClient) -> None:
    response = client.post(
        "/api/tasks/weekly",
        json={
            "title": "Bad day",
            "recurrence_type": "monthly_day",
            "day_of_month": 32,
        },
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


def test_list_biweekly_tasks_by_occurrence_date(client: TestClient) -> None:
    client.post(
        "/api/tasks/weekly",
        json={
            "title": "Alternating Monday",
            "weekdays": [0],
            "recurrence_type": "biweekly",
            "anchor_date": "2026-05-04",
        },
    )

    on_week = client.get("/api/tasks/weekly?date=2026-05-18")
    off_week = client.get("/api/tasks/weekly?date=2026-05-11")

    assert on_week.status_code == 200
    assert [task["title"] for task in on_week.json()] == ["Alternating Monday"]
    assert off_week.status_code == 200
    assert off_week.json() == []


def test_list_monthly_day_tasks_by_occurrence_date(client: TestClient) -> None:
    client.post(
        "/api/tasks/weekly",
        json={
            "title": "Submit report",
            "recurrence_type": "monthly_day",
            "day_of_month": 11,
        },
    )

    matching = client.get("/api/tasks/weekly?date=2026-05-11")
    non_matching = client.get("/api/tasks/weekly?date=2026-05-12")

    assert matching.status_code == 200
    assert [task["title"] for task in matching.json()] == ["Submit report"]
    assert non_matching.status_code == 200
    assert non_matching.json() == []


def test_monthly_day_31_skips_short_months(client: TestClient) -> None:
    client.post(
        "/api/tasks/weekly",
        json={
            "title": "Long month task",
            "recurrence_type": "monthly_day",
            "day_of_month": 31,
        },
    )

    short_month = client.get("/api/tasks/weekly?date=2026-04-30")
    long_month = client.get("/api/tasks/weekly?date=2026-05-31")

    assert short_month.status_code == 200
    assert short_month.json() == []
    assert long_month.status_code == 200
    assert [task["title"] for task in long_month.json()] == ["Long month task"]


def test_recurring_task_end_date_excludes_later_occurrences(
    client: TestClient,
) -> None:
    client.post(
        "/api/tasks/weekly",
        json={
            "title": "Temporary",
            "weekdays": [0],
            "recurrence_type": "weekly",
            "end_date": "2026-05-11",
        },
    )

    included = client.get("/api/tasks/weekly?date=2026-05-11")
    excluded = client.get("/api/tasks/weekly?date=2026-05-18")

    assert [task["title"] for task in included.json()] == ["Temporary"]
    assert excluded.json() == []


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
            "recurrence_type": "weekly",
            "category_id": category["id"],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated"
    assert data["description"] == "Edited"
    assert data["weekdays"] == [2, 4]
    assert data["recurrence_type"] == "weekly"
    assert data["category_id"] == category["id"]


def test_update_weekly_task_to_monthly_day(client: TestClient) -> None:
    task = client.post(
        "/api/tasks/weekly",
        json={"title": "Draft", "weekdays": [0]},
    ).json()

    response = client.patch(
        f"/api/tasks/weekly/{task['id']}",
        json={"recurrence_type": "monthly_day", "day_of_month": 15},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["recurrence_type"] == "monthly_day"
    assert data["day_of_month"] == 15
    assert data["weekdays"] == []


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


def test_complete_and_incomplete_biweekly_task_occurrence(client: TestClient) -> None:
    task = client.post(
        "/api/tasks/weekly",
        json={
            "title": "Review",
            "weekdays": [0],
            "recurrence_type": "biweekly",
            "anchor_date": "2026-05-04",
        },
    ).json()

    complete_response = client.post(
        f"/api/tasks/weekly/{task['id']}/complete?completion_date=2026-05-18"
    )
    off_week_response = client.post(
        f"/api/tasks/weekly/{task['id']}/complete?completion_date=2026-05-11"
    )
    incomplete_response = client.post(
        f"/api/tasks/weekly/{task['id']}/incomplete?completion_date=2026-05-18"
    )

    assert complete_response.status_code == 200
    assert off_week_response.status_code == 400
    assert incomplete_response.status_code == 204


def test_complete_monthly_task_occurrence(client: TestClient) -> None:
    task = client.post(
        "/api/tasks/weekly",
        json={
            "title": "Report",
            "recurrence_type": "monthly_day",
            "day_of_month": 11,
        },
    ).json()

    complete_response = client.post(
        f"/api/tasks/weekly/{task['id']}/complete?completion_date=2026-05-11"
    )
    wrong_day_response = client.post(
        f"/api/tasks/weekly/{task['id']}/complete?completion_date=2026-05-12"
    )

    assert complete_response.status_code == 200
    assert wrong_day_response.status_code == 400


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
