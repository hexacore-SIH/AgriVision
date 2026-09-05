from sarvamai import SarvamAI
from dotenv import load_dotenv
import os

load_dotenv()

client = SarvamAI(
    api_subscription_key=os.getenv("SARVAM_API_KEY")
)

with open("test.wav", "rb") as audio_file:
    response = client.speech_to_text.transcribe(
        file=audio_file,
        model="saaras:v3",
        language_code="unknown",
        mode="transcribe"
    )

print("\n--- Transcription ---")
print(response.transcript)