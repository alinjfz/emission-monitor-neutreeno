"""Deterministic, idempotent demo data for local development and tests."""

from datetime import date, datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.footprint_submission import FootprintSubmission, SubmissionStatus, UnitCode
from app.models.product import Product
from app.models.supplier import Supplier
from app.models.user import User

SUPPLIER_NAMES = [
    "Northstar Components",
    "Alder Packaging",
    "Cirrus Electronics",
    "Redwood Materials",
    "Harbor Metalworks",
    "Solace Textiles",
    "Brightline Plastics",
    "Meadow Paper Co.",
    "Quartz Industrial",
    "Juniper Assembly",
    "Atlas Glassworks",
    "Cobalt Fasteners",
]

PRODUCT_NAMES = [
    "Recycled aluminium enclosure",
    "Moulded fibre insert",
    "Control board assembly",
    "Cold-rolled steel bracket",
    "Precision bearing set",
    "Organic cotton sleeve",
    "Reprocessed polymer housing",
    "Kraft shipping carton",
    "Industrial relay module",
    "Cable management tray",
    "Tempered display panel",
    "Stainless fastening kit",
    "Machined heat sink",
    "Compostable protective wrap",
    "Sensor interface board",
    "Powder-coated support rail",
    "Electric motor rotor",
    "Woven transport pouch",
    "Injection-moulded connector",
    "Corrugated divider set",
    "Power supply module",
    "Aluminium mounting plate",
    "Borosilicate cover",
    "Threaded insert pack",
    "Copper busbar",
    "Paper pulp end cap",
    "Low-power telemetry unit",
    "Structural steel frame",
    "Sealed bearing cartridge",
    "Recycled fabric liner",
    "Polycarbonate lens",
    "Returnable transit carton",
    "Embedded controller",
    "Extruded chassis rail",
    "Laminated safety glass",
    "High-tensile bolt set",
]

METHODOLOGIES = [
    "Cradle-to-gate calculation using supplier-specific energy and material activity data.",
    "Process-based assessment aligned with ISO 14067 boundaries and current grid factors.",
    "Mass-balance model combining primary production records with verified secondary datasets.",
    "Component-level bill-of-materials assessment including manufacturing scrap allocation.",
    "Factory energy allocation by production volume with inbound transport included.",
    "Hybrid assessment using measured facility data and conservative material emission factors.",
]


def seed_database(db: Session) -> None:
    """Add missing demo fixtures without duplicating an already-seeded database."""
    demo = db.scalar(select(User).where(User.email == "a@a.a"))
    if demo is None:
        db.add(
            User(
                name="Ali Njfz",
                email="a@a.a",
                password_hash=hash_password("1234"),
                role="reviewer",
            )
        )

    if (db.scalar(select(func.count(FootprintSubmission.id))) or 0) == 0:
        suppliers = [Supplier(name=name) for name in SUPPLIER_NAMES]
        db.add_all(suppliers)
        db.flush()
        submitted_base = datetime(2025, 1, 5, 9, 0)
        for index, product_name in enumerate(PRODUCT_NAMES):
            # Formulas derive every varying value from the index, so repeated test
            # databases receive the same useful mix without randomness.
            product = Product(
                supplier_id=suppliers[index % len(suppliers)].id,
                name=product_name,
                code=f"EM-{index + 1:03d}",
            )
            db.add(product)
            db.flush()
            period_start = date(2024, 1, 1) + timedelta(days=index * 7)
            period_end = period_start + timedelta(days=29 + (index % 8) * 15)
            submitted_at = submitted_base + timedelta(days=index, hours=index % 5)
            db.add(
                FootprintSubmission(
                    product_id=product.id,
                    status=SubmissionStatus.NEW.value,
                    footprint_value=Decimal((index + 1) * 1_234_567) / Decimal(1_000_000),
                    unit_code=(
                        UnitCode.PER_ITEM.value if index % 2 == 0 else UnitCode.PER_KG.value
                    ),
                    uncertainty=Decimal((index * 337 + 425) % 10_001) / Decimal(100),
                    period_start=period_start,
                    period_end=period_end,
                    methodology=METHODOLOGIES[index % len(METHODOLOGIES)],
                    submitted_at=submitted_at,
                    updated_at=submitted_at,
                    version=1,
                )
            )
    db.commit()


def seed() -> None:
    """CLI entry point that owns and closes its database session."""
    with SessionLocal() as db:
        seed_database(db)


if __name__ == "__main__":
    seed()
