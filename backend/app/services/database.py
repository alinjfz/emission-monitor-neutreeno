from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.db.seed import seed_database
from app.models.footprint_submission import FootprintSubmission
from app.models.product import Product
from app.models.review_event import ReviewEvent
from app.models.session import AuthSession
from app.models.supplier import Supplier
from app.models.user import User


def reseed_database(db: Session) -> None:
    try:
        for model in (
            ReviewEvent,
            AuthSession,
            FootprintSubmission,
            Product,
            Supplier,
            User,
        ):
            db.execute(delete(model))
        db.flush()
        db.expunge_all()
        seed_database(db)
    except Exception:
        db.rollback()
        raise
