import subprocess
import glob

# Find FFmpeg automatically
paths = glob.glob(
    r"C:\Users\Hp\AppData\Local\Microsoft\WinGet\Packages\**\ffmpeg.exe",
    recursive=True
)

if not paths:
    print("FFmpeg nahi mila!")
    exit()

ffmpeg = paths[0]
print("FFmpeg found:", ffmpeg)

subprocess.run([
    ffmpeg,
    "-i", "C:\\Users\\Hp\\Documents\\Sound recordings\\Recording (2).m4a",
    "-ar", "16000",
    "-ac", "1",
    "test.wav"
], check=True)

print("Audio converted successfully!")