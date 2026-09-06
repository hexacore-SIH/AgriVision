from typing import Literal, Optional

from pydantic import BaseModel, ValidationError

IntentName = Literal["price_query", "sell_offer", "price_update", "general_query"]
UnitName = Literal["kg", "quintal", "ton"]


class ExtractedEntities(BaseModel):
    crop: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[UnitName] = None
    price: Optional[float] = None
    mandi_id: Optional[str] = None


class IntentResult(BaseModel):
    intent: IntentName
    entities: ExtractedEntities
    draft_reply_text: Optional[str] = None


def fallback_result(reason: str) -> IntentResult:
    return IntentResult(
        intent="general_query",
        entities=ExtractedEntities(),
        draft_reply_text=None,
    )


__all__ = ["ExtractedEntities", "IntentResult", "fallback_result", "ValidationError"]
