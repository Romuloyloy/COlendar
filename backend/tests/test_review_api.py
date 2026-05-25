from fastapi.testclient import TestClient


def test_review_daily_summary_includes_core_modules(client: TestClient) -> None:
    task = client.post(
        "/api/tasks/daily",
        json={"title": "Write recap", "task_date": "2026-05-25"},
    ).json()
    client.post(f"/api/tasks/daily/{task['id']}/complete")
    weekly_task = client.post(
        "/api/tasks/weekly",
        json={
            "title": "Practice",
            "weekdays": [0],
            "recurrence_type": "weekly",
        },
    ).json()
    client.post(
        f"/api/tasks/weekly/{weekly_task['id']}/complete?completion_date=2026-05-25"
    )
    client.post(
        "/api/calendar/events",
        json={"title": "Check-in", "event_date": "2026-05-25"},
    )
    client.post(
        "/api/tracker/water",
        json={"entry_date": "2026-05-25", "amount_ml": 500},
    )
    client.post(
        "/api/tracker/calories",
        json={"entry_date": "2026-05-25", "amount_kcal": 700},
    )
    client.post(
        "/api/tracker/activity",
        json={
            "entry_date": "2026-05-25",
            "activity_type": "Walk",
            "duration_minutes": 20,
        },
    )
    client.post("/api/notes", json={"title": "Daily note", "content": "Done"})

    response = client.get("/api/review/summary?date=2026-05-25")

    assert response.status_code == 200
    data = response.json()
    daily = data["daily"]
    assert daily["counts"]["completed_daily_tasks"] == 1
    assert daily["counts"]["incomplete_daily_tasks"] == 0
    assert daily["counts"]["completed_recurring_tasks"] == 1
    assert daily["counts"]["incomplete_recurring_tasks"] == 0
    assert [event["title"] for event in daily["calendar_events"]] == ["Check-in"]
    assert daily["tracker_summary"]["total_water_ml"] == 500
    assert daily["tracker_summary"]["total_calories_kcal"] == 700
    assert daily["tracker_summary"]["activity_count"] == 1
    assert daily["tracker_summary"]["total_activity_minutes"] == 20
    assert [note["title"] for note in daily["notes"]] == ["Daily note"]


def test_review_weekly_summary_returns_seven_days_and_totals(
    client: TestClient,
) -> None:
    completed = client.post(
        "/api/tasks/daily",
        json={"title": "Done", "task_date": "2026-05-25"},
    ).json()
    client.post(f"/api/tasks/daily/{completed['id']}/complete")
    client.post(
        "/api/tasks/daily",
        json={"title": "Open", "task_date": "2026-05-26"},
    )
    weekly_task = client.post(
        "/api/tasks/weekly",
        json={
            "title": "Weekly",
            "weekdays": [0, 1],
            "recurrence_type": "weekly",
        },
    ).json()
    client.post(
        f"/api/tasks/weekly/{weekly_task['id']}/complete?completion_date=2026-05-25"
    )
    client.post(
        "/api/calendar/events",
        json={"title": "Event", "event_date": "2026-05-27"},
    )
    client.post(
        "/api/tracker/water",
        json={"entry_date": "2026-05-25", "amount_ml": 300},
    )
    client.post(
        "/api/tracker/water",
        json={"entry_date": "2026-05-26", "amount_ml": 400},
    )

    response = client.get("/api/review/summary?date=2026-05-27")

    assert response.status_code == 200
    weekly = response.json()["weekly"]
    assert weekly["week_start"] == "2026-05-25"
    assert weekly["week_end"] == "2026-05-31"
    assert len(weekly["days"]) == 7
    assert weekly["totals"]["completed_daily_tasks"] == 1
    assert weekly["totals"]["incomplete_daily_tasks"] == 1
    assert weekly["totals"]["completed_recurring_tasks"] == 1
    assert weekly["totals"]["incomplete_recurring_tasks"] == 1
    assert weekly["totals"]["event_count"] == 1
    assert weekly["totals"]["tracker"]["total_water_ml"] == 700


def test_review_weekly_totals_exclude_archived_records(
    client: TestClient,
) -> None:
    task = client.post(
        "/api/tasks/daily",
        json={"title": "Archived task", "task_date": "2026-05-25"},
    ).json()
    client.delete(f"/api/tasks/daily/{task['id']}")
    weekly_task = client.post(
        "/api/tasks/weekly",
        json={
            "title": "Archived recurring",
            "weekdays": [0],
            "recurrence_type": "weekly",
        },
    ).json()
    client.delete(f"/api/tasks/weekly/{weekly_task['id']}")
    event = client.post(
        "/api/calendar/events",
        json={"title": "Archived event", "event_date": "2026-05-25"},
    ).json()
    client.delete(f"/api/calendar/events/{event['id']}")
    water = client.post(
        "/api/tracker/water",
        json={"entry_date": "2026-05-25", "amount_ml": 500},
    ).json()
    client.delete(f"/api/tracker/water/{water['id']}")
    note = client.post(
        "/api/notes",
        json={"title": "Archived note", "content": ""},
    ).json()
    client.delete(f"/api/notes/{note['id']}")

    response = client.get("/api/review/summary?date=2026-05-25")

    assert response.status_code == 200
    totals = response.json()["weekly"]["totals"]
    assert totals["completed_daily_tasks"] == 0
    assert totals["incomplete_daily_tasks"] == 0
    assert totals["completed_recurring_tasks"] == 0
    assert totals["incomplete_recurring_tasks"] == 0
    assert totals["event_count"] == 0
    assert totals["note_count"] == 0
    assert totals["tracker"]["total_water_ml"] == 0


def test_review_category_summary_composes_categorized_items(
    client: TestClient,
) -> None:
    work = client.post(
        "/api/tasks/categories",
        json={"name": "Work", "color": "#0f766e"},
    ).json()
    health = client.post(
        "/api/tasks/categories",
        json={"name": "Health", "color": "#22c55e"},
    ).json()
    client.post(
        "/api/tasks/daily",
        json={
            "title": "Work task",
            "task_date": "2026-05-25",
            "category_id": work["id"],
        },
    )
    client.post(
        "/api/tasks/weekly",
        json={
            "title": "Work recurring",
            "weekdays": [0, 2],
            "recurrence_type": "weekly",
            "category_id": work["id"],
        },
    )
    client.post(
        "/api/calendar/events",
        json={
            "title": "Work event",
            "event_date": "2026-05-26",
            "category_id": work["id"],
        },
    )
    client.post(
        "/api/notes",
        json={"title": "Work note", "content": "", "category_id": work["id"]},
    )
    client.post(
        "/api/tasks/daily",
        json={
            "title": "Health task",
            "task_date": "2026-05-25",
            "category_id": health["id"],
        },
    )
    client.post(
        "/api/tracker/water",
        json={"entry_date": "2026-05-25", "amount_ml": 900},
    )

    response = client.get("/api/review/summary?date=2026-05-25")

    assert response.status_code == 200
    categories = {
        item["category"]["name"]: item for item in response.json()["categories"]
    }
    assert categories["Work"]["daily_task_count"] == 1
    assert categories["Work"]["recurring_task_occurrence_count"] == 2
    assert categories["Work"]["note_count"] == 1
    assert categories["Work"]["event_count"] == 1
    assert categories["Health"]["daily_task_count"] == 1
    assert categories["Health"]["recurring_task_occurrence_count"] == 0
    assert categories["Health"]["note_count"] == 0
    assert categories["Health"]["event_count"] == 0
