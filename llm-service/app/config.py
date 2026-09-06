import os

from dotenv import load_dotenv

load_dotenv()

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")

if not SARVAM_API_KEY:
    raise RuntimeError("Missing required env var: SARVAM_API_KEY")

if not INTERNAL_API_KEY:
    raise RuntimeError("Missing required env var: INTERNAL_API_KEY")

SUPPORTED_LANGUAGES = ["hi-IN", "mr-IN", "pa-IN", "gu-IN"]
DEFAULT_LANGUAGE = "hi-IN"
DEFAULT_SPEAKER = "shubh"
# Confirmed valid bulbul:v3 speaker (verified against the live API's error
# message listing bulbul:v3-compatible speakers) - "manisha" is NOT one of them,
# despite being a valid speaker name for other Sarvam TTS models.
FALLBACK_SPEAKER = "aditya"
