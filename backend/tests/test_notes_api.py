from fastapi.testclient import TestClient


def test_create_root_folder(client: TestClient) -> None:
    response = client.post("/api/folders", json={"name": "Work"})

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Work"
    assert data["parent_folder_id"] is None
    assert data["is_archived"] is False


def test_create_nested_folder(client: TestClient) -> None:
    root = client.post("/api/folders", json={"name": "Work"}).json()

    response = client.post(
        "/api/folders",
        json={"name": "Projects", "parent_folder_id": root["id"]},
    )

    assert response.status_code == 201
    assert response.json()["parent_folder_id"] == root["id"]


def test_prevent_invalid_parent_folder_usage(client: TestClient) -> None:
    root = client.post("/api/folders", json={"name": "Root"}).json()
    child = client.post(
        "/api/folders",
        json={"name": "Child", "parent_folder_id": root["id"]},
    ).json()

    self_parent = client.patch(
        f"/api/folders/{root['id']}",
        json={"parent_folder_id": root["id"]},
    )
    circular = client.patch(
        f"/api/folders/{root['id']}",
        json={"parent_folder_id": child["id"]},
    )
    missing_parent = client.post(
        "/api/folders",
        json={"name": "Missing", "parent_folder_id": 9999},
    )

    assert self_parent.status_code == 400
    assert circular.status_code == 400
    assert missing_parent.status_code == 404


def test_reject_empty_folder_name(client: TestClient) -> None:
    create_response = client.post("/api/folders", json={"name": "   "})
    folder = client.post("/api/folders", json={"name": "Valid"}).json()
    update_response = client.patch(
        f"/api/folders/{folder['id']}",
        json={"name": "   "},
    )

    assert create_response.status_code == 422
    assert update_response.status_code == 422


def test_create_note_without_folder(client: TestClient) -> None:
    response = client.post(
        "/api/notes",
        json={"title": "Loose note", "content": "Just an idea"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Loose note"
    assert data["folder_id"] is None


def test_create_note_inside_folder(client: TestClient) -> None:
    folder = client.post("/api/folders", json={"name": "Inbox"}).json()

    response = client.post(
        "/api/notes",
        json={
            "title": "Folder note",
            "content": "Stored in Inbox",
            "folder_id": folder["id"],
        },
    )

    assert response.status_code == 201
    assert response.json()["folder_id"] == folder["id"]


def test_create_and_update_note_with_shared_category(client: TestClient) -> None:
    category = client.post(
        "/api/tasks/categories",
        json={"name": "Work", "color": "#14b8a6"},
    ).json()
    second_category = client.post(
        "/api/tasks/categories",
        json={"name": "Ideas", "color": "#8b5cf6"},
    ).json()

    note = client.post(
        "/api/notes",
        json={"title": "Categorized", "category_id": category["id"]},
    )

    assert note.status_code == 201
    assert note.json()["category_id"] == category["id"]

    response = client.patch(
        f"/api/notes/{note.json()['id']}",
        json={"category_id": second_category["id"]},
    )

    assert response.status_code == 200
    assert response.json()["category_id"] == second_category["id"]


def test_reject_invalid_or_archived_note_category(client: TestClient) -> None:
    category = client.post(
        "/api/tasks/categories",
        json={"name": "Archive", "color": "#999999"},
    ).json()
    note = client.post("/api/notes", json={"title": "Loose"}).json()
    client.delete(f"/api/tasks/categories/{category['id']}")

    create_response = client.post(
        "/api/notes",
        json={"title": "Bad", "category_id": 9999},
    )
    update_response = client.patch(
        f"/api/notes/{note['id']}",
        json={"category_id": category["id"]},
    )

    assert create_response.status_code == 400
    assert update_response.status_code == 400


def test_reject_missing_folder_when_creating_or_moving_note(client: TestClient) -> None:
    note = client.post("/api/notes", json={"title": "Loose"}).json()

    create_response = client.post(
        "/api/notes",
        json={"title": "Bad folder", "folder_id": 9999},
    )
    move_response = client.patch(
        f"/api/notes/{note['id']}",
        json={"folder_id": 9999},
    )

    assert create_response.status_code == 404
    assert move_response.status_code == 404


def test_reject_empty_note_title(client: TestClient) -> None:
    create_response = client.post("/api/notes", json={"title": "   "})
    note = client.post("/api/notes", json={"title": "Valid"}).json()
    update_response = client.patch(
        f"/api/notes/{note['id']}",
        json={"title": "   "},
    )

    assert create_response.status_code == 422
    assert update_response.status_code == 422


def test_update_note(client: TestClient) -> None:
    note = client.post("/api/notes", json={"title": "Draft", "content": ""}).json()

    response = client.patch(
        f"/api/notes/{note['id']}",
        json={"title": "Updated", "content": "Edited body"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated"
    assert data["content"] == "Edited body"


def test_move_note_between_folders(client: TestClient) -> None:
    first = client.post("/api/folders", json={"name": "First"}).json()
    second = client.post("/api/folders", json={"name": "Second"}).json()
    note = client.post(
        "/api/notes",
        json={"title": "Move me", "folder_id": first["id"]},
    ).json()

    response = client.patch(
        f"/api/notes/{note['id']}",
        json={"folder_id": second["id"]},
    )

    assert response.status_code == 200
    assert response.json()["folder_id"] == second["id"]


def test_list_notes_can_filter_by_folder_and_descendants(
    client: TestClient,
) -> None:
    root = client.post("/api/folders", json={"name": "Root"}).json()
    child = client.post(
        "/api/folders",
        json={"name": "Child", "parent_folder_id": root["id"]},
    ).json()
    client.post("/api/notes", json={"title": "Root note", "folder_id": root["id"]})
    client.post("/api/notes", json={"title": "Child note", "folder_id": child["id"]})
    client.post("/api/notes", json={"title": "Loose note"})

    descendants_response = client.get(f"/api/notes?folder_id={root['id']}")
    direct_response = client.get(
        f"/api/notes?folder_id={root['id']}&include_descendants=false"
    )

    assert descendants_response.status_code == 200
    assert {note["title"] for note in descendants_response.json()} == {
        "Root note",
        "Child note",
    }
    assert direct_response.status_code == 200
    assert [note["title"] for note in direct_response.json()] == ["Root note"]


def test_archive_note(client: TestClient) -> None:
    note = client.post("/api/notes", json={"title": "Archive me"}).json()

    archive_response = client.delete(f"/api/notes/{note['id']}")
    get_response = client.get(f"/api/notes/{note['id']}")
    list_response = client.get("/api/notes")

    assert archive_response.status_code == 204
    assert get_response.status_code == 404
    assert list_response.json() == []


def test_folder_must_be_empty_before_archive(client: TestClient) -> None:
    folder = client.post("/api/folders", json={"name": "Keep"}).json()
    client.post("/api/notes", json={"title": "Inside", "folder_id": folder["id"]})

    response = client.delete(f"/api/folders/{folder['id']}")

    assert response.status_code == 409


def test_archive_empty_folder(client: TestClient) -> None:
    folder = client.post("/api/folders", json={"name": "Empty"}).json()

    archive_response = client.delete(f"/api/folders/{folder['id']}")
    list_response = client.get("/api/folders")

    assert archive_response.status_code == 204
    assert list_response.json() == []


def test_folder_with_child_folder_cannot_be_archived(client: TestClient) -> None:
    root = client.post("/api/folders", json={"name": "Root"}).json()
    client.post(
        "/api/folders",
        json={"name": "Child", "parent_folder_id": root["id"]},
    )

    response = client.delete(f"/api/folders/{root['id']}")

    assert response.status_code == 409
