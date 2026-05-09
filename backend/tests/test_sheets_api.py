from fastapi.testclient import TestClient

TODAY_WIDGET_KEYS = [
    "today-overview",
    "daily-tasks",
    "weekly-tasks",
    "upcoming-events",
    "recent-notes",
    "tracker-summary",
    "quick-actions",
    "planning-summary",
]


def test_sheets_returns_default_sheet(client: TestClient) -> None:
    response = client.get("/api/sheets")

    assert response.status_code == 200
    sheets = response.json()
    assert [sheet["name"] for sheet in sheets] == ["Today", "Planning", "Health"]
    assert [sheet["sort_order"] for sheet in sheets] == [0, 1, 2]


def test_sheet_detail_returns_slots_in_predictable_order(client: TestClient) -> None:
    sheet_id = client.get("/api/sheets").json()[0]["id"]

    response = client.get(f"/api/sheets/{sheet_id}")

    assert response.status_code == 200
    slots = response.json()["slots"]
    assert [slot["slot_index"] for slot in slots] == list(range(8))
    assert [slot["widget_key"] for slot in slots] == TODAY_WIDGET_KEYS
    assert all(slot["config_json"] == {} for slot in slots)


def test_create_sheet(client: TestClient) -> None:
    client.get("/api/sheets")

    response = client.post("/api/sheets", json={"name": "Health"})

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Health"
    assert data["sort_order"] == 3
    assert len(data["slots"]) == 8
    assert all(slot["widget_key"] is None for slot in data["slots"])


def test_rename_sheet(client: TestClient) -> None:
    sheet = client.post("/api/sheets", json={"name": "Work"}).json()

    response = client.patch(f"/api/sheets/{sheet['id']}", json={"name": "School"})

    assert response.status_code == 200
    assert response.json()["name"] == "School"


def test_delete_sheet_when_more_than_one_exists(client: TestClient) -> None:
    default_sheet_ids = [sheet["id"] for sheet in client.get("/api/sheets").json()]
    second_sheet = client.post("/api/sheets", json={"name": "Work"}).json()

    response = client.delete(f"/api/sheets/{second_sheet['id']}")

    assert response.status_code == 204
    sheets = client.get("/api/sheets").json()
    assert [sheet["id"] for sheet in sheets] == default_sheet_ids


def test_delete_last_sheet_is_rejected(client: TestClient) -> None:
    sheets = client.get("/api/sheets").json()
    for sheet in sheets[1:]:
        response = client.delete(f"/api/sheets/{sheet['id']}")
        assert response.status_code == 204

    sheet_id = sheets[0]["id"]

    response = client.delete(f"/api/sheets/{sheet_id}")

    assert response.status_code == 409
    assert response.json()["detail"] == "Cannot delete the last sheet"


def test_set_widget_slots(client: TestClient) -> None:
    sheet_id = client.get("/api/sheets").json()[0]["id"]

    response = client.put(
        f"/api/sheets/{sheet_id}/slots",
        json={
            "slots": [
                {"slot_index": 0, "widget_key": "tracker-summary"},
                {"slot_index": 1, "widget_key": None},
                {
                    "slot_index": 2,
                    "widget_key": "recent-notes",
                    "config_json": {"title_override": "Notes"},
                },
            ]
        },
    )

    assert response.status_code == 200
    slots = response.json()["slots"]
    assert slots[0]["widget_key"] == "tracker-summary"
    assert slots[1]["widget_key"] is None
    assert slots[2]["widget_key"] == "recent-notes"
    assert slots[2]["config_json"] == {"title_override": "Notes"}
    assert slots[3]["widget_key"] is None


def test_reject_invalid_slot_index(client: TestClient) -> None:
    sheet_id = client.get("/api/sheets").json()[0]["id"]

    response = client.put(
        f"/api/sheets/{sheet_id}/slots",
        json={"slots": [{"slot_index": 8, "widget_key": "daily-tasks"}]},
    )

    assert response.status_code == 422


def test_reject_unknown_widget_key(client: TestClient) -> None:
    sheet_id = client.get("/api/sheets").json()[0]["id"]

    response = client.put(
        f"/api/sheets/{sheet_id}/slots",
        json={"slots": [{"slot_index": 0, "widget_key": "mystery-widget"}]},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Unknown dashboard widget key: mystery-widget"


def test_allow_duplicate_widgets_on_one_sheet_with_different_config(
    client: TestClient,
) -> None:
    sheet_id = client.get("/api/sheets").json()[0]["id"]
    category = client.post(
        "/api/tasks/categories",
        json={"name": "School", "color": "#14b8a6"},
    ).json()

    response = client.put(
        f"/api/sheets/{sheet_id}/slots",
        json={
            "slots": [
                {
                    "slot_index": 0,
                    "widget_key": "daily-tasks",
                    "config_json": {"category_id": None, "title_override": "All Tasks"},
                },
                {
                    "slot_index": 1,
                    "widget_key": "daily-tasks",
                    "config_json": {
                        "category_id": category["id"],
                        "title_override": "School",
                    },
                },
            ]
        },
    )

    assert response.status_code == 200
    slots = response.json()["slots"]
    assert slots[0]["widget_key"] == "daily-tasks"
    assert slots[1]["widget_key"] == "daily-tasks"
    assert slots[1]["config_json"]["category_id"] == category["id"]


def test_reject_invalid_task_widget_category_config(client: TestClient) -> None:
    sheet_id = client.get("/api/sheets").json()[0]["id"]

    response = client.put(
        f"/api/sheets/{sheet_id}/slots",
        json={
            "slots": [
                {
                    "slot_index": 0,
                    "widget_key": "weekly-tasks",
                    "config_json": {"category_id": 999},
                },
            ]
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Task widget category_id does not exist"


def test_sheet_slot_config_persists_after_update(client: TestClient) -> None:
    sheet_id = client.get("/api/sheets").json()[0]["id"]
    category = client.post(
        "/api/tasks/categories",
        json={"name": "Health", "color": "#22c55e"},
    ).json()

    client.put(
        f"/api/sheets/{sheet_id}/slots",
        json={
            "slots": [
                {
                    "slot_index": 3,
                    "widget_key": "weekly-tasks",
                    "config_json": {
                        "category_id": category["id"],
                        "title_override": "Health Weekly",
                    },
                }
            ]
        },
    )

    response = client.get(f"/api/sheets/{sheet_id}")

    assert response.status_code == 200
    slot = response.json()["slots"][3]
    assert slot["widget_key"] == "weekly-tasks"
    assert slot["config_json"] == {
        "category_id": category["id"],
        "title_override": "Health Weekly",
    }


def test_reset_default_sheets(client: TestClient) -> None:
    client.post("/api/sheets", json={"name": "Work"})

    response = client.post("/api/sheets/reset-default")

    assert response.status_code == 200
    sheets = response.json()
    assert [sheet["name"] for sheet in sheets] == ["Today", "Planning", "Health"]
    assert [sheet["sort_order"] for sheet in sheets] == [0, 1, 2]


def test_move_sheet_left(client: TestClient) -> None:
    sheets = client.get("/api/sheets").json()
    planning_sheet_id = sheets[1]["id"]

    response = client.post(f"/api/sheets/{planning_sheet_id}/move-left")

    assert response.status_code == 200
    moved_sheets = response.json()
    assert [sheet["name"] for sheet in moved_sheets] == ["Planning", "Today", "Health"]
    assert [sheet["sort_order"] for sheet in moved_sheets] == [0, 1, 2]


def test_move_sheet_right(client: TestClient) -> None:
    sheets = client.get("/api/sheets").json()
    planning_sheet_id = sheets[1]["id"]

    response = client.post(f"/api/sheets/{planning_sheet_id}/move-right")

    assert response.status_code == 200
    moved_sheets = response.json()
    assert [sheet["name"] for sheet in moved_sheets] == ["Today", "Health", "Planning"]
    assert [sheet["sort_order"] for sheet in moved_sheets] == [0, 1, 2]


def test_move_sheet_left_at_boundary_is_noop(client: TestClient) -> None:
    sheets = client.get("/api/sheets").json()
    first_sheet_id = sheets[0]["id"]

    response = client.post(f"/api/sheets/{first_sheet_id}/move-left")

    assert response.status_code == 200
    moved_sheets = response.json()
    assert [sheet["id"] for sheet in moved_sheets] == [sheet["id"] for sheet in sheets]
    assert [sheet["sort_order"] for sheet in moved_sheets] == [0, 1, 2]


def test_move_sheet_right_at_boundary_is_noop(client: TestClient) -> None:
    sheets = client.get("/api/sheets").json()
    last_sheet_id = sheets[-1]["id"]

    response = client.post(f"/api/sheets/{last_sheet_id}/move-right")

    assert response.status_code == 200
    moved_sheets = response.json()
    assert [sheet["id"] for sheet in moved_sheets] == [sheet["id"] for sheet in sheets]
    assert [sheet["sort_order"] for sheet in moved_sheets] == [0, 1, 2]


def test_sheet_order_persists_after_move(client: TestClient) -> None:
    sheets = client.get("/api/sheets").json()
    planning_sheet_id = sheets[1]["id"]

    client.post(f"/api/sheets/{planning_sheet_id}/move-left")

    response = client.get("/api/sheets")

    assert response.status_code == 200
    assert [sheet["name"] for sheet in response.json()] == [
        "Planning",
        "Today",
        "Health",
    ]


def test_health_default_uses_health_category_when_it_exists(
    client: TestClient,
) -> None:
    category = client.post(
        "/api/tasks/categories",
        json={"name": "Health", "color": "#22c55e"},
    ).json()

    sheets = client.get("/api/sheets").json()
    health_sheet_id = next(sheet["id"] for sheet in sheets if sheet["name"] == "Health")
    response = client.get(f"/api/sheets/{health_sheet_id}")

    assert response.status_code == 200
    slots = response.json()["slots"]
    assert slots[1]["widget_key"] == "daily-tasks"
    assert slots[1]["config_json"] == {
        "category_id": category["id"],
        "title_override": "Health Tasks",
    }
    assert slots[2]["widget_key"] == "weekly-tasks"
    assert slots[2]["config_json"] == {
        "category_id": category["id"],
        "title_override": "Health Tasks",
    }
