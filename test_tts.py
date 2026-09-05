import os
from dotenv import load_dotenv
from sarvamai import SarvamAI
from sarvamai.play import save

load_dotenv()

client = SarvamAI(
    api_subscription_key=os.getenv("SARVAM_API_KEY")
)

response = client.text_to_speech.convert(
    text="नमस्ते! मैं आपका किसान सहायक हूँ। आपकी खेती से जुड़ी समस्या में मैं आपकी मदद कर सकता हूँ।",
    model="bulbul:v3",
    language_code="hi-IN",
    speaker="shubh"
)

save(response, "farmer_reply.wav")

print("Voice generated successfully!")
print("File saved as farmer_reply.wav")