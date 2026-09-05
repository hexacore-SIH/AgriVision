import sounddevice as sd
from scipy.io.wavfile import write

duration = 5
sample_rate = 16000

print("🎤 Recording started... Speak now!")

audio = sd.rec(
    int(duration * sample_rate),
    samplerate=sample_rate,
    channels=1,
    dtype="int16"
)

sd.wait()

write("test.wav", sample_rate, audio)

print("✅ Recording saved as test.wav")