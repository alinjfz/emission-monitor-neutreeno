from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

from fastapi.testclient import TestClient


def test_complete_review_flow_and_concurrent_open(clients: tuple[TestClient, TestClient]) -> None:
    first, second = clients

    login = first.post("/api/auth/login", json={"email": "a@a.a", "password": "1234"})
    assert login.status_code == 200
    assert "HttpOnly" in login.headers["set-cookie"]

    register = second.post(
        "/api/auth/register",
        json={"name": "Sam Reviewer", "email": "sam@example.com", "password": "pass"},
    )
    assert register.status_code == 201
    assert register.json()["role"] == "reviewer"

    listing = first.get("/api/submissions")
    assert listing.status_code == 200
    list_body = listing.json()
    assert list_body["total"] == 36
    assert list_body["page_size"] == 10
    assert list_body["status_counts"] == {
        "all": 36,
        "new": 36,
        "pending": 0,
        "approved": 0,
        "rejected": 0,
    }
    assert list_body["items"][0]["footprint_value"] == "1.234567"
    assert list_body["items"][0]["last_modified_at"] == list_body["items"][0]["submitted_at"]
    submission_id = list_body["items"][0]["id"]

    barrier = Barrier(2)

    def open_at_once(client: TestClient) -> int:
        barrier.wait()
        return client.post(f"/api/submissions/{submission_id}/open").status_code

    with ThreadPoolExecutor(max_workers=2) as executor:
        statuses = list(executor.map(open_at_once, (first, second)))
    assert statuses == [200, 200]

    detail = first.get(f"/api/submissions/{submission_id}")
    assert detail.status_code == 200
    pending = detail.json()
    assert pending["status"] == "pending"
    assert pending["version"] == 2
    assert [event["action"] for event in pending["review_history"]] == ["opened"]

    approval = first.post(
        f"/api/submissions/{submission_id}/reviews",
        json={
            "action": "approved",
            "comment": "  Method and reporting period verified.  ",
            "expected_version": 2,
        },
    )
    assert approval.status_code == 200
    approved = approval.json()
    assert approved["status"] == "approved"
    assert approved["version"] == 3
    assert approved["review_history"][0]["comment"] == "Method and reporting period verified."

    stale = second.post(
        f"/api/submissions/{submission_id}/reviews",
        json={"action": "rejected", "expected_version": 2},
    )
    assert stale.status_code == 409
    assert stale.json()["error"]["code"] == "submission_conflict"
    assert stale.json()["error"]["latest_submission"]["version"] == 3

    rejection = second.post(
        f"/api/submissions/{submission_id}/reviews",
        json={"action": "rejected", "expected_version": 3},
    )
    assert rejection.status_code == 200
    rejected = rejection.json()
    assert rejected["status"] == "rejected"
    assert rejected["version"] == 4
    assert [event["action"] for event in rejected["review_history"]] == [
        "rejected",
        "approved",
        "opened",
    ]
    assert rejected["last_modified_at"] == rejected["review_history"][0]["created_at"]

    latest_activity = first.get(
        "/api/submissions", params={"sort": "last_modified_at", "direction": "desc"}
    )
    assert latest_activity.status_code == 200
    assert latest_activity.json()["items"][0]["id"] == submission_id

    literal_wildcards = first.get("/api/submissions", params={"search": "%_\\"})
    assert literal_wildcards.status_code == 200
    assert literal_wildcards.json()["total"] == 0

    reseed = first.post("/api/debug/reseed")
    assert reseed.status_code == 204
    assert first.get("/api/auth/me").status_code == 401
    assert second.get("/api/auth/me").status_code == 401

    relogin = first.post("/api/auth/login", json={"email": "a@a.a", "password": "1234"})
    assert relogin.status_code == 200
    reseeded_listing = first.get("/api/submissions").json()
    assert reseeded_listing["total"] == 36
    assert reseeded_listing["status_counts"]["new"] == 36
    assert reseeded_listing["status_counts"]["pending"] == 0
