from typing import Optional

from fastapi import APIRouter, Depends, Form, UploadFile

from app.auth import require_internal_key
from app.config import DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES
from app.intent.prompt import classify_intent
from app.sarvam_client import client
from app.tempfiles import temp_path

router = APIRouter()


@router.post("/process", dependencies=[Depends(require_internal_key)])
async def process_audio(
    audio: UploadFile,
    role: str = Form(...),
    preferred_language: str = Form(DEFAULT_LANGUAGE),
    mandi_id: Optional[str] = Form(default=None),
):
    with temp_path(".webm") as input_path:
        with open(input_path, "wb") as buffer:
            buffer.write(await audio.read())

        with open(input_path, "rb") as audio_file:
            stt_response = client.speech_to_text.transcribe(
                file=audio_file,
                model="saaras:v3",
                language_code="unknown",
                mode="transcribe",
            )

    transcript = stt_response.transcript
    detected_language = getattr(stt_response, "language_code", None)

    if not detected_language or detected_language not in SUPPORTED_LANGUAGES:
        fallback = preferred_language if preferred_language in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE
        detected_language = fallback

    intent_result = classify_intent(transcript, role)

    return {
        "transcript": transcript,
        "detected_language": detected_language,
        "intent": intent_result.intent,
        "entities": intent_result.entities.model_dump(),
        "draft_reply_text": intent_result.draft_reply_text,
    }
