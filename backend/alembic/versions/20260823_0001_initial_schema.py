"""Create the Emissions Monitor schema.

Revision ID: 20260823_0001
Revises:
Create Date: 2026-08-23
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260823_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("role", sa.String(30), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "suppliers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(140), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("name", name="uq_suppliers_name"),
    )
    op.create_index("ix_suppliers_name", "suppliers", ["name"])

    op.create_table(
        "sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("user_id", name="uq_sessions_user_id"),
        sa.UniqueConstraint("token_hash", name="uq_sessions_token_hash"),
    )
    op.create_index("ix_sessions_user_id", "sessions", ["user_id"])
    op.create_index("ix_sessions_token_hash", "sessions", ["token_hash"])
    op.create_index("ix_sessions_expires_at", "sessions", ["expires_at"])

    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("supplier_id", sa.Integer(), sa.ForeignKey("suppliers.id"), nullable=False),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("code", sa.String(50), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("supplier_id", "code", name="uq_products_supplier_code"),
    )
    op.create_index("ix_products_supplier_id", "products", ["supplier_id"])
    op.create_index("ix_products_name", "products", ["name"])
    op.create_index("ix_products_code", "products", ["code"])

    op.create_table(
        "footprint_submissions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("footprint_value_micros", sa.BigInteger(), nullable=False),
        sa.Column("unit_code", sa.String(20), nullable=False),
        sa.Column("uncertainty_basis_points", sa.BigInteger(), nullable=False),
        sa.Column("period_start", sa.Date(), nullable=False),
        sa.Column("period_end", sa.Date(), nullable=False),
        sa.Column("methodology", sa.Text(), nullable=False),
        sa.Column("submitted_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.CheckConstraint(
            "status IN ('new', 'pending', 'approved', 'rejected')", name="ck_submission_status"
        ),
        sa.CheckConstraint("unit_code IN ('per_item', 'per_kg')", name="ck_submission_unit"),
        sa.CheckConstraint(
            "footprint_value_micros BETWEEN 0 AND 999999999999999999",
            name="ck_submission_footprint_range",
        ),
        sa.CheckConstraint(
            "uncertainty_basis_points BETWEEN 0 AND 10000", name="ck_submission_uncertainty_range"
        ),
        sa.CheckConstraint("period_end >= period_start", name="ck_submission_period"),
        sa.CheckConstraint("version >= 1", name="ck_submission_version"),
    )
    op.create_index("ix_submissions_product_id", "footprint_submissions", ["product_id"])
    op.create_index("ix_submissions_submitted_at", "footprint_submissions", ["submitted_at"])
    op.create_index("ix_submissions_updated_at", "footprint_submissions", ["updated_at"])
    op.create_index(
        "ix_submissions_queue",
        "footprint_submissions",
        ["status", "submitted_at", "updated_at"],
    )

    op.create_table(
        "review_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "submission_id", sa.Integer(), sa.ForeignKey("footprint_submissions.id"), nullable=False
        ),
        sa.Column("reviewer_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("action", sa.String(20), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.CheckConstraint(
            "action IN ('opened', 'approved', 'rejected')", name="ck_review_event_action"
        ),
    )
    op.create_index(
        "ix_review_events_submission_created",
        "review_events",
        ["submission_id", "created_at"],
    )
    op.create_index(
        "uq_review_events_one_opened_per_submission",
        "review_events",
        ["submission_id"],
        unique=True,
        sqlite_where=sa.text("action = 'opened'"),
    )


def downgrade() -> None:
    op.drop_index("uq_review_events_one_opened_per_submission", table_name="review_events")
    op.drop_index("ix_review_events_submission_created", table_name="review_events")
    op.drop_table("review_events")
    op.drop_index("ix_submissions_queue", table_name="footprint_submissions")
    op.drop_index("ix_submissions_updated_at", table_name="footprint_submissions")
    op.drop_index("ix_submissions_submitted_at", table_name="footprint_submissions")
    op.drop_index("ix_submissions_product_id", table_name="footprint_submissions")
    op.drop_table("footprint_submissions")
    op.drop_index("ix_products_code", table_name="products")
    op.drop_index("ix_products_name", table_name="products")
    op.drop_index("ix_products_supplier_id", table_name="products")
    op.drop_table("products")
    op.drop_index("ix_sessions_expires_at", table_name="sessions")
    op.drop_index("ix_sessions_token_hash", table_name="sessions")
    op.drop_index("ix_sessions_user_id", table_name="sessions")
    op.drop_table("sessions")
    op.drop_index("ix_suppliers_name", table_name="suppliers")
    op.drop_table("suppliers")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
