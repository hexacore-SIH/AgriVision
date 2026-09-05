import os
from dotenv import load_dotenv
from sarvamai import SarvamAI

load_dotenv()

client = SarvamAI(
    api_subscription_key=os.getenv("SARVAM_API_KEY")
)

response = client.chat.completions(
    model="sarvam-105b",
    messages=[
        {
            "role": "system",
            "content": "You are a helpful farmer assistant for Maharashtra. Reply in simple Hindi or Marathi according to the user's language. Keep answers short, clear and practical."
        },
        {
            "role": "user",
            "content": "मेरी फसल में कीड़े लग गए हैं, क्या करूं?"
        }
    ]
)

print("\n--- AI Response ---")
print(response.choices[0].message.content)