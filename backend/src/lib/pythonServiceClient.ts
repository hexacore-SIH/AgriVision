import type { ProcessResult } from "@agrivision/shared-types";
import { env } from "../config/env.js";

export async function callProcess(params: {
  audioBuffer: Buffer;
  filename: string;
  mimeType: string;
  role: string;
  preferredLanguage: string;
  mandiId: string | null;
}): Promise<ProcessResult> {
  const form = new FormData();
  form.append(
    "audio",
    new Blob([params.audioBuffer], { type: params.mimeType }),
    params.filename
  );
  form.append("role", params.role);
  form.append("preferred_language", params.preferredLanguage);
  if (params.mandiId) form.append("mandi_id", params.mandiId);

  const response = await fetch(`${env.llmServiceUrl}/process`, {
    method: "POST",
    headers: { "X-Internal-Key": env.internalApiKey },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`LLM service /process failed: ${response.status}`);
  }

  return (await response.json()) as ProcessResult;
}

export async function callSpeak(params: {
  text: string;
  languageCode: string;
}): Promise<{ mimeType: string; buffer: Buffer }> {
  const response = await fetch(`${env.llmServiceUrl}/speak`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Key": env.internalApiKey,
    },
    body: JSON.stringify({ text: params.text, language_code: params.languageCode }),
  });

  if (!response.ok) {
    throw new Error(`LLM service /speak failed: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return { mimeType: "audio/wav", buffer: Buffer.from(arrayBuffer) };
}
