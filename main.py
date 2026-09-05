from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import tempfile

from dotenv import load_dotenv
from sarvamai import SarvamAI
from sarvamai.play import save

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = SarvamAI(
    api_subscription_key=os.getenv("SARVAM_API_KEY")
)


@app.get("/")
def home():
    return {
        "message": "Kisan Voice Bot API is running!"
    }


@app.post("/voice-chat")
async def voice_chat(file: UploadFile = File(...)):

    # Save uploaded audio in Windows TEMP folder
    temp_dir = tempfile.gettempdir()

    input_file = os.path.join(
        temp_dir,
        "kisan_farmer_input.webm"
    )

    output_file = os.path.join(
        temp_dir,
        "kisan_farmer_reply.wav"
    )

    # Save browser audio
    with open(input_file, "wb") as buffer:
        while True:
            chunk = await file.read(1024 * 1024)

            if not chunk:
                break

            buffer.write(chunk)

    print("Audio received:", input_file)

    # ---------------- STT ----------------

    with open(input_file, "rb") as audio_file:

        stt_response = client.speech_to_text.transcribe(
            file=audio_file,
            model="saaras:v3",
            language_code="unknown",
            mode="transcribe"
        )

    farmer_text = stt_response.transcript

    language = getattr(
        stt_response,
        "language_code",
        "hi-IN"
    )

    if language not in ["hi-IN", "mr-IN"]:
        language = "hi-IN"

    print("Farmer:", farmer_text)
    print("Language:", language)

    # ---------------- LLM ----------------

    llm_response = client.chat.completions(
        model="sarvam-105b",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a helpful farmer assistant for Maharashtra. "
                    "Reply in the same language as the farmer. "
                    "Support Hindi and Marathi. "
                    "Keep answers short, simple and practical."
                )
            },
            {
                "role": "user",
                "content": farmer_text
            }
        ]
    )

    ai_text = llm_response.choices[0].message.content

    print("AI:", ai_text)

    # ---------------- TTS ----------------

    tts_response = client.text_to_speech.convert(
        text=ai_text,
        model="bulbul:v3",
        language_code=language,
        speaker="shubh"
    )

    save(
        tts_response,
        output_file
    )

    print("Voice reply created:", output_file)

    return {
        "farmer_text": farmer_text,
        "language": language,
        "ai_response": ai_text
    }


@app.get("/audio")
def get_audio():

    output_file = os.path.join(
        tempfile.gettempdir(),
        "kisan_farmer_reply.wav"
    )

    return FileResponse(
        output_file,
        media_type="audio/wav"
    )