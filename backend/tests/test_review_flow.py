"""High-value API flows covering security, data integrity, and concurrency."""

from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

from fastapi.testclient import TestClient


def test_complete_review_flow_and_concurrent_open(clients: tuple[TestClient, TestClient]) -> None:
    """Exercise the primary reviewer journey plus competing open/review requests."""
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
        """Release both test clients together and return the open response status."""
        barrier.wait()
        return client.post(f"/api/submissions/{submission_id}/open").status_code

    with ThreadPoolExecutor(max_workers=2) as executor:
        # Releasing both workers together makes the exactly-once open invariant observable.
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
        # The second reviewer still holds version 2 after the first committed version 3.
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
    # LIKE metacharacters are searched literally rather than expanding the result set.
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


def test_submission_create_update_and_delete(clients: tuple[TestClient, TestClient]) -> None:
    """Cover system-owned fields and shared-versus-unshared product catalog behavior."""
    client, _second = clients
    assert (
        client.post("/api/auth/login", json={"email": "a@a.a", "password": "1234"}).status_code
        == 200
    )

    payload = {
        "supplier_name": "Northwind Materials",
        "product_name": "Low-carbon panel",
        "product_code": "NW-001",
        "footprint_value": "12.345678",
        "unit_code": "per_item",
        "uncertainty": "8.25",
        "period_start": "2026-01-01",
        "period_end": "2026-03-31",
        "methodology": "Measured energy data with supplier-specific material factors.",
        "status": "approved",
        "version": 99,
    }
    # Extra system fields are ignored; clients cannot choose initial status/version.
    created_response = client.post("/api/submissions", json=payload)
    assert created_response.status_code == 201
    created = created_response.json()
    assert created["status"] == "new"
    assert created["version"] == 1
    assert created["footprint_value"] == "12.345678"
    assert created["review_history"] == []
    submission_id = created["id"]

    updated_response = client.patch(
        f"/api/submissions/{submission_id}",
        json={
            **payload,
            "supplier_name": "Northwind Renewables",
            "product_name": "Ultra-low-carbon panel",
            "product_code": "NW-002",
            "footprint_value": "9.000001",
        },
    )
    assert updated_response.status_code == 200
    updated = updated_response.json()
    assert updated["supplier"]["name"] == "Northwind Renewables"
    assert updated["product"]["name"] == "Ultra-low-carbon panel"
    assert updated["product"]["code"] == "NW-002"
    assert updated["footprint_value"] == "9.000001"
    assert updated["status"] == "new"
    assert updated["version"] == 2

    renamed_response = client.patch(
        f"/api/submissions/{submission_id}",
        json={
            **payload,
            "supplier_name": "Northwind Renewables",
            "product_name": "Renamed carbon panel",
            "product_code": "NW-002",
            "footprint_value": "9.000001",
        },
    )
    assert renamed_response.status_code == 200
    renamed = renamed_response.json()
    assert renamed["product"]["name"] == "Renamed carbon panel"
    assert renamed["version"] == 3

    shared_response = client.post(
        "/api/submissions",
        json={
            **payload,
            "supplier_name": "Northwind Renewables",
            "product_name": "Renamed carbon panel",
            "product_code": "NW-002",
        },
    )
    assert shared_response.status_code == 201
    shared = shared_response.json()
    reassigned_response = client.patch(
        # Once a product is shared, editing creates/reuses another row instead of
        # renaming the product beneath the first submission.
        f"/api/submissions/{shared['id']}",
        json={
            **payload,
            "supplier_name": "Northwind Circular",
            "product_name": "Circular carbon panel",
            "product_code": "NW-003",
        },
    )
    assert reassigned_response.status_code == 200
    reassigned = reassigned_response.json()
    assert reassigned["supplier"]["name"] == "Northwind Circular"
    assert reassigned["product"]["name"] == "Circular carbon panel"
    assert client.delete(f"/api/submissions/{shared['id']}").status_code == 204

    reviewed = client.post(
        f"/api/submissions/{submission_id}/reviews",
        json={"action": "approved", "comment": "Verified.", "expected_version": 3},
    )
    assert reviewed.status_code == 200
    assert reviewed.json()["review_history"][0]["action"] == "approved"

    deleted = client.delete(f"/api/submissions/{submission_id}")
    assert deleted.status_code == 204
    assert client.get(f"/api/submissions/{submission_id}").status_code == 404
    assert client.get("/api/submissions").json()["total"] == 36


def test_submission_write_validation(clients: tuple[TestClient, TestClient]) -> None:
    """Reject excess precision, out-of-range uncertainty, and reversed periods."""
    client, _second = clients
    assert (
        client.post("/api/auth/login", json={"email": "a@a.a", "password": "1234"}).status_code
        == 200
    )

    response = client.post(
        "/api/submissions",
        json={
            "supplier_name": "Supplier",
            "product_name": "Product",
            "product_code": "P-1",
            "footprint_value": "1.0000001",
            "unit_code": "per_item",
            "uncertainty": "101",
            "period_start": "2026-02-01",
            "period_end": "2026-01-01",
            "methodology": "Measured data.",
        },
    )
    assert response.status_code == 422
    errors = response.json()["error"]["field_errors"]
    assert "footprint_value" in errors
    assert "uncertainty" in errors

    invalid_period = client.post(
        "/api/submissions",
        json={
            "supplier_name": "Supplier",
            "product_name": "Product",
            "product_code": "P-1",
            "footprint_value": "1.000001",
            "unit_code": "per_item",
            "uncertainty": "10",
            "period_start": "2026-02-01",
            "period_end": "2026-01-01",
            "methodology": "Measured data.",
        },
    )
    assert invalid_period.status_code == 422
    assert "request" in invalid_period.json()["error"]["field_errors"]
