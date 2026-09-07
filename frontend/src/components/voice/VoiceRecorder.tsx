"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { VoiceInteractResponse } from "@agrivision/shared-types";
import { apiFetch } from "@/lib/apiClient";

type Status = "idle" | "recording" | "processing" | "error";

export function VoiceRecorder({
  onResult,
}: {
  onResult?: (result: VoiceInteractResponse) => void;
}) {
  const t = useTranslations("voice");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<VoiceInteractResponse | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function startRecording() {
    setErrorMessage(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const options: MediaRecorderOptions = MediaRecorder.isTypeSupported("audio/webm")
        ? { mimeType: "audio/webm" }
        : {};
      const recorder = new MediaRecorder(stream, options);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => handleStopped(recorder.mimeType || "audio/webm");

      recorder.start(250);
      recorderRef.current = recorder;
      setStatus("recording");
    } catch {
      setStatus("error");
      setErrorMessage(t("micError"));
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function handleStopped(mimeType: string) {
    const blob = new Blob(chunksRef.current, { type: mimeType });
    if (blob.size === 0) {
      setStatus("error");
      setErrorMessage(t("noAudio"));
      return;
    }

    setStatus("processing");

    try {
      const form = new FormData();
      form.append("audio", blob, "clip.webm");

      const response = await apiFetch("/voice/interact", {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
        throw new Error(body.error || body.message || `Request failed: ${response.status}`);
      }

      const data = (await response.json()) as VoiceInteractResponse;
      setResult(data);
      onResult?.(data);
      setStatus("idle");

      if (audioRef.current && data.audio?.base64) {
        audioRef.current.src = `data:${data.audio.mimeType};base64,${data.audio.base64}`;
        audioRef.current.play().catch(() => {
          /* autoplay may be blocked, user can press play manually */
        });
      }
    } catch (err: unknown) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setErrorMessage("Cannot connect to server. Please check backend status.");
      } else {
        setErrorMessage(msg || t("noAudio"));
      }
    }
  }

  function handleClick() {
    if (status === "recording") {
      stopRecording();
    } else {
      startRecording();
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-stone-300/80 bg-white p-6 shadow-sm">
      <button
        onClick={handleClick}
        disabled={status === "processing"}
        className={`flex h-24 w-24 items-center justify-center rounded-full text-4xl text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50 ${
          status === "recording" ? "bg-red-600 animate-pulse ring-4 ring-red-200" : "bg-green-700 hover:bg-green-800"
        }`}
        aria-label={status === "recording" ? t("stop") : t("start")}
      >
        {status === "recording" ? "⏹" : "🎙️"}
      </button>

      <p className={`text-sm font-semibold ${status === "error" ? "text-red-700" : "text-stone-800"}`}>
        {status === "recording" && t("recording")}
        {status === "processing" && t("processing")}
        {status === "idle" && t("start")}
        {status === "error" && errorMessage}
      </p>

      {result && (
        <div className="mt-2 w-full space-y-2 rounded-xl border border-stone-200 bg-stone-100/80 p-4 text-sm text-stone-900">
          <p>
            <span className="font-bold text-stone-900">{t("transcript")}: </span>
            <span className="text-stone-800">{result.transcript}</span>
          </p>
          <p>
            <span className="font-bold text-stone-900">{t("response")}: </span>
            <span className="text-stone-800">{result.replyText}</span>
          </p>
        </div>
      )}

      <audio ref={audioRef} controls className="w-full" />
    </div>
  );
}
