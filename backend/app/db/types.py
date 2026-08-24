from decimal import Decimal, InvalidOperation

from sqlalchemy import BigInteger
from sqlalchemy.engine.interfaces import Dialect
from sqlalchemy.types import TypeDecorator


class ScaledDecimal(TypeDecorator[Decimal]):
    """Persist an exact Decimal as a scaled SQLite integer."""

    impl = BigInteger
    cache_ok = True

    def __init__(self, scale: int) -> None:
        super().__init__()
        self.scale = scale
        self.factor = Decimal(10) ** scale

    def process_bind_param(
        self, value: Decimal | str | int | None, _dialect: Dialect
    ) -> int | None:
        if value is None:
            return None
        try:
            decimal_value = Decimal(value)
        except (InvalidOperation, TypeError) as exc:
            raise ValueError("Value must be an exact decimal.") from exc
        scaled = decimal_value * self.factor
        if not scaled.is_finite() or scaled != scaled.to_integral_value():
            raise ValueError(f"Value supports at most {self.scale} decimal places.")
        return int(scaled)

    def process_result_value(self, value: int | None, _dialect: Dialect) -> Decimal | None:
        if value is None:
            return None
        return Decimal(value) / self.factor
