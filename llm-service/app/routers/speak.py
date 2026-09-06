from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from app.auth import require_internal_key
from app.config import DEFAULT_SPEAKER, FALLBACK_SPEAKER
from app.sarvam_client import client
from app.tempfiles import temp_path

try:
    from sarvamai.play import save
except ImportError:  # pragma: no cover - defensive, sarvamai always ships this helper
    save = None

router = APIRouter()


class SpeakRequest(BaseModel):
    text: str
    language_code: str
    speaker: str | None = None


def _synthesize(text: str, language_code: str, speaker: str, output_path: str):
    tts_response = client.text_to_speech.convert(
        text=text,
        model="bulbul:v3",
        language_code=language_code,
        speaker=speaker,
    )
    save(tts_response, output_path)


@router.post("/speak", dependencies=[Depends(require_internal_key)])
async def speak(body: SpeakRequest):
    speaker = body.speaker or DEFAULT_SPEAKER

    with temp_path(".wav") as output_path:
        try:
            _synthesize(body.text, body.language_code, speaker, output_path)
        except Exception as first_error:
            if speaker == FALLBACK_SPEAKER:
                raise HTTPException(status_code=502, detail=str(first_error)) from first_error
            try:
                _synthesize(body.text, body.language_code, FALLBACK_SPEAKER, output_path)
            except Exception as second_error:
                raise HTTPException(status_code=502, detail=str(second_error)) from second_error

        with open(output_path, "rb") as f:
            audio_bytes = f.read()

    return Response(content=audio_bytes, media_type="audio/wav")
