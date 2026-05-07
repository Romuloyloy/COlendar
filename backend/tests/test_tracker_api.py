from fastapi.testclient import TestClient


def test_create_water_entry(client: TestClient) -> None:
    response = client.post(
        "/api/tracker/water",
        json={"entry_date": "2026-05-07", "amount_ml": 300, "note": "Morning"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["entry_date"] == "2026-05-07"
    assert data["amount_ml"] == 300
    assert data["note"] == "Morning"
    assert data["is_archived"] is False


def test_reject_non_positive_water_amount(client: TestClient) -> None:
    zero_response = client.post(
        "/api/tracker/water",
        json={"entry_date": "2026-05-07", "amount_ml": 0},
    )
    negative_response = client.post(
        "/api/tracker/water",
        json={"entry_date": "2026-05-07", "amount_ml": -100},
    )

    assert zero_response.status_code == 422
    assert negative_response.status_code == 422


def test_list_water_entries_by_date(client: TestClient) -> None:
    client.post("/api/tracker/water", json={"entry_date": "2026-05-07", "amount_ml": 250})
    client.post("/api/tracker/water", json={"entry_date": "2026-05-08", "amount_ml": 500})

    response = client.get("/api/tracker/water?date=2026-05-07")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["amount_ml"] == 250


def test_tracker_summary_calculates_daily_water_total(client: TestClient) -> None:
    client.post("/api/tracker/water", json={"entry_date": "2026-05-07", "amount_ml": 250})
    client.post("/api/tracker/water", json={"entry_date": "2026-05-07", "amount_ml": 500})
    client.post("/api/tracker/water", json={"entry_date": "2026-05-08", "amount_ml": 1000})

    response = client.get("/api/tracker/summary?date=2026-05-07")

    assert response.status_code == 200
    data = response.json()
    assert data["total_water_ml"] == 750
    assert len(data["water_entries"]) == 2


def test_archive_water_entry(client: TestClient) -> None:
    entry = client.post(
        "/api/tracker/water",
        json={"entry_date": "2026-05-07", "amount_ml": 300},
    ).json()

    archive_response = client.delete(f"/api/tracker/water/{entry['id']}")
    list_response = client.get("/api/tracker/water?date=2026-05-07")
    missing_response = client.delete(f"/api/tracker/water/{entry['id']}")

    assert archive_response.status_code == 204
    assert list_response.json() == []
    assert missing_response.status_code == 404


def test_create_activity_entry(client: TestClient) -> None:
    response = client.post(
        "/api/tracker/activity",
        json={
            "entry_date": "2026-05-07",
            "activity_type": "Walk",
            "duration_minutes": 30,
            "quantity": "2.50",
            "note": "Easy pace",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["entry_date"] == "2026-05-07"
    assert data["activity_type"] == "Walk"
    assert data["duration_minutes"] == 30
    assert data["quantity"] == "2.50"
    assert data["note"] == "Easy pace"
    assert data["is_archived"] is False


def test_reject_blank_activity_type(client: TestClient) -> None:
    response = client.post(
        "/api/tracker/activity",
        json={"entry_date": "2026-05-07", "activity_type": "   "},
    )

    assert response.status_code == 422


def test_reject_negative_activity_numbers(client: TestClient) -> None:
    duration_response = client.post(
        "/api/tracker/activity",
        json={
            "entry_date": "2026-05-07",
            "activity_type": "Run",
            "duration_minutes": -1,
        },
    )
    quantity_response = client.post(
        "/api/tracker/activity",
        json={
            "entry_date": "2026-05-07",
            "activity_type": "Pushups",
            "quantity": "-10",
        },
    )

    assert duration_response.status_code == 422
    assert quantity_response.status_code == 422


def test_list_activity_entries_by_date(client: TestClient) -> None:
    client.post(
        "/api/tracker/activity",
        json={"entry_date": "2026-05-07", "activity_type": "Walk"},
    )
    client.post(
        "/api/tracker/activity",
        json={"entry_date": "2026-05-08", "activity_type": "Run"},
    )

    response = client.get("/api/tracker/activity?date=2026-05-07")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["activity_type"] == "Walk"


def test_archive_activity_entry(client: TestClient) -> None:
    entry = client.post(
        "/api/tracker/activity",
        json={"entry_date": "2026-05-07", "activity_type": "Walk"},
    ).json()

    archive_response = client.delete(f"/api/tracker/activity/{entry['id']}")
    list_response = client.get("/api/tracker/activity?date=2026-05-07")
    missing_response = client.delete(f"/api/tracker/activity/{entry['id']}")

    assert archive_response.status_code == 204
    assert list_response.json() == []
    assert missing_response.status_code == 404


def test_create_calorie_entry(client: TestClient) -> None:
    response = client.post(
        "/api/tracker/calories",
        json={
            "entry_date": "2026-05-07",
            "amount_kcal": 450,
            "label": "Lunch",
            "note": "Rice bowl",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["entry_date"] == "2026-05-07"
    assert data["amount_kcal"] == 450
    assert data["label"] == "Lunch"
    assert data["note"] == "Rice bowl"
    assert data["is_archived"] is False


def test_reject_non_positive_calorie_amount(client: TestClient) -> None:
    zero_response = client.post(
        "/api/tracker/calories",
        json={"entry_date": "2026-05-07", "amount_kcal": 0},
    )
    negative_response = client.post(
        "/api/tracker/calories",
        json={"entry_date": "2026-05-07", "amount_kcal": -50},
    )

    assert zero_response.status_code == 422
    assert negative_response.status_code == 422


def test_list_calorie_entries_by_date(client: TestClient) -> None:
    client.post(
        "/api/tracker/calories",
        json={"entry_date": "2026-05-07", "amount_kcal": 350},
    )
    client.post(
        "/api/tracker/calories",
        json={"entry_date": "2026-05-08", "amount_kcal": 700},
    )

    response = client.get("/api/tracker/calories?date=2026-05-07")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["amount_kcal"] == 350


def test_tracker_summary_calculates_daily_calorie_total(client: TestClient) -> None:
    client.post(
        "/api/tracker/calories",
        json={"entry_date": "2026-05-07", "amount_kcal": 350},
    )
    client.post(
        "/api/tracker/calories",
        json={"entry_date": "2026-05-07", "amount_kcal": 450},
    )
    client.post(
        "/api/tracker/calories",
        json={"entry_date": "2026-05-08", "amount_kcal": 1000},
    )

    response = client.get("/api/tracker/summary?date=2026-05-07")

    assert response.status_code == 200
    data = response.json()
    assert data["total_calories_kcal"] == 800
    assert len(data["calorie_entries"]) == 2


def test_archive_calorie_entry(client: TestClient) -> None:
    entry = client.post(
        "/api/tracker/calories",
        json={"entry_date": "2026-05-07", "amount_kcal": 300},
    ).json()

    archive_response = client.delete(f"/api/tracker/calories/{entry['id']}")
    list_response = client.get("/api/tracker/calories?date=2026-05-07")
    summary_response = client.get("/api/tracker/summary?date=2026-05-07")
    missing_response = client.delete(f"/api/tracker/calories/{entry['id']}")

    assert archive_response.status_code == 204
    assert list_response.json() == []
    assert summary_response.json()["total_calories_kcal"] == 0
    assert missing_response.status_code == 404


def test_tracker_summary_includes_activity_totals(client: TestClient) -> None:
    client.post(
        "/api/tracker/activity",
        json={
            "entry_date": "2026-05-07",
            "activity_type": "Walk",
            "duration_minutes": 30,
        },
    )
    client.post(
        "/api/tracker/calories",
        json={"entry_date": "2026-05-07", "amount_kcal": 550},
    )
    client.post(
        "/api/tracker/activity",
        json={
            "entry_date": "2026-05-07",
            "activity_type": "Stretch",
            "duration_minutes": 10,
        },
    )

    response = client.get("/api/tracker/summary?date=2026-05-07")

    assert response.status_code == 200
    data = response.json()
    assert data["activity_count"] == 2
    assert data["total_activity_minutes"] == 40


def test_dashboard_summary_includes_tracker_data(client: TestClient) -> None:
    archived = client.post(
        "/api/tracker/water",
        json={"entry_date": "2026-05-07", "amount_ml": 1000},
    ).json()
    client.delete(f"/api/tracker/water/{archived['id']}")
    client.post(
        "/api/tracker/water",
        json={"entry_date": "2026-05-07", "amount_ml": 250},
    )
    client.post(
        "/api/tracker/activity",
        json={
            "entry_date": "2026-05-07",
            "activity_type": "Walk",
            "duration_minutes": 20,
        },
    )
    client.post(
        "/api/tracker/calories",
        json={"entry_date": "2026-05-07", "amount_kcal": 550},
    )

    response = client.get("/api/dashboard/summary?date=2026-05-07")

    assert response.status_code == 200
    data = response.json()
    assert data["tracker_summary"]["total_water_ml"] == 250
    assert data["tracker_summary"]["activity_count"] == 1
    assert data["tracker_summary"]["total_activity_minutes"] == 20
    assert data["tracker_summary"]["total_calories_kcal"] == 550
    assert data["counts"]["total_water_ml"] == 250
    assert data["counts"]["activity_count"] == 1
    assert data["counts"]["total_calories_kcal"] == 550
