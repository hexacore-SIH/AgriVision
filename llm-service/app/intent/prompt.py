import json
import re

from app.intent.schema import IntentResult, fallback_result
from app.sarvam_client import client

# Mirrors backend/prisma/seed.ts Crop.slug values. Python has no DB access by
# design (Node owns all data), so this list must be kept in sync manually
# whenever the seeded crop catalog changes.
KNOWN_CROP_SLUGS = [
    "wheat",
    "rice",
    "onion",
    "potato",
    "tomato",
    "cotton",
    "sugarcane",
    "soybean",
    "maize",
    "chana",
]

_JSON_SCHEMA_EXAMPLE = json.dumps(
    {
        "intent": "price_query",
        "entities": {
            "crop": "wheat",
            "quantity": None,
            "unit": None,
            "price": None,
            "mandi_id": None,
        },
        "draft_reply_text": None,
    }
)


def build_system_prompt(role: str) -> str:
    crop_list = ", ".join(KNOWN_CROP_SLUGS)
    return (
        "You are an intent classifier for a farmer voice assistant serving Indian "
        "farmers who speak Hindi, Marathi, Punjabi or Gujarati. "
        "Given a transcript and the speaker's role, output ONLY a single JSON object "
        f"matching exactly this shape: {_JSON_SCHEMA_EXAMPLE}\n\n"
        "The speaker's role is: " + role + "\n\n"
        "Valid values for \"intent\":\n"
        "- price_query: the speaker is asking about a crop's current mandi price.\n"
        "- sell_offer: the speaker (a farmer) states they have produce available to sell, "
        "e.g. \"I have 100kg rice to sell\".\n"
        "- price_update: ONLY valid if role is mandi_head - the speaker is stating a new "
        "price for a crop, e.g. \"onion is 18 rupees a kg today\". If role is not "
        "mandi_head, never output price_update - use general_query instead.\n"
        "- general_query: anything else, including farming advice or small talk. For this "
        "intent only, also write a short, simple, practical draft_reply_text in the SAME "
        "language as the transcript. For every other intent, draft_reply_text must be null.\n\n"
        "For \"crop\", always output the canonical English slug from this exact list: "
        f"{crop_list}. If no crop is mentioned, or it isn't in this list, output null.\n"
        "For \"unit\", only use one of: kg, quintal, ton, or null.\n"
        "\"quantity\" and \"price\" must be plain numbers (no currency symbols or units), "
        "or null if not mentioned.\n\n"
        "Output ONLY the JSON object. Do not include any other text, explanation, or "
        "markdown formatting."
    )


def _extract_json_block(text: str) -> dict:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("No JSON object found in LLM output")
    return json.loads(match.group(0))


def classify_intent(transcript: str, role: str) -> IntentResult:
    try:
        response = client.chat.completions(
            model="sarvam-105b",
            messages=[
                {"role": "system", "content": build_system_prompt(role)},
                {"role": "user", "content": transcript},
            ],
        )
        raw_text = response.choices[0].message.content
        parsed = _extract_json_block(raw_text)
        result = IntentResult.model_validate(parsed)

        if result.intent == "price_update" and role != "mandi_head":
            return fallback_result("price_update not allowed for this role")

        return result
    except Exception as error:  # noqa: BLE001 - a voice UX must always reply with something
        print("Intent extraction failed, falling back to general_query:", error)
        return fallback_result(str(error))
