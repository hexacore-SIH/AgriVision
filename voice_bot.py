import os
from dotenv import load_dotenv
from sarvamai import SarvamAI
from sarvamai.play import save

load_dotenv()

client = SarvamAI(
    api_subscription_key=os.getenv("SARVAM_API_KEY")
)

# 1. Farmer ki recorded voice
with open("test.wav", "rb") as audio_file:
    stt_response = client.speech_to_text.transcribe(
        file=audio_file,
        model="saaras:v3",
        language_code="unknown",
        mode="transcribe"
    )

farmer_text = stt_response.transcript

print("\n--- Farmer ---")
print(farmer_text)

# Detected language
language = getattr(stt_response, "language_code", "hi-IN")

if language not in ["hi-IN", "mr-IN"]:
    language = "hi-IN"

print("\nDetected Language:", language)


# 2. AI answer
llm_response = client.chat.completions(
    model="sarvam-105b",
    messages=[
        {
            "role": "system",
            "content": (
                "You are a helpful farmer assistant for Maharashtra. "
                "Reply in the same language as the farmer. "
                "Support Hindi and Marathi. "
                "Use very simple language and keep the answer short and practical."
            )
        },
        {
            "role": "user",
            "content": farmer_text
        }
    ]
)

ai_text = llm_response.choices[0].message.content

print("\n--- AI Response ---")
print(ai_text)


# 3. AI answer → Voice
tts_response = client.text_to_speech.convert(
    text=ai_text,
    model="bulbul:v3",
    language_code=language,
    speaker="shubh"
)

save(tts_response, "final_farmer_reply.wav")

print("\n--- Done ---")
print("Voice saved as final_farmer_reply.wav")