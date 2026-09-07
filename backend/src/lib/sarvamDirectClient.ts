import type { ExtractedEntities, ProcessResult, VoiceIntent } from "@agrivision/shared-types";
import { env } from "../config/env.js";

const KNOWN_CROPS: Record<string, string[]> = {
  wheat: ["wheat", "गेहूं", "गहू", "ਕਣਕ", "ઘઉં"],
  rice: ["rice", "चावल", "तांदूळ", "ਚੌਲ", "ચોખા"],
  onion: ["onion", "प्याज", "कांदा", "ਪਿਆਜ਼", "ડુંગળી"],
  potato: ["potato", "आलू", "बटाटा", "ਆਲੂ", "બટાકા"],
  tomato: ["tomato", "टमाटर", "टोमॅटो", "ਟਮਾਟਰ", "ટામેટા"],
  cotton: ["cotton", "कपास", "कापूस", "ਕਪਾਹ", "કપાસ"],
  sugarcane: ["sugarcane", "गन्ना", "ऊस", "ਗੰਨਾ", "શેરડી"],
  soybean: ["soybean", "सोयाबीन", "ਸੋਇਆਬੀਨ", "સોયਾਬીન"],
  maize: ["maize", "मक्का", "मका", "ਮੱਕੀ", "મકાઈ"],
  chana: ["chana", "चना", "हरभरा", "ਛੋਲੇ", "ચણા", "chickpea"],
};

const KNOWN_MANDIS: Record<string, string[]> = {
  "seed-mandi-pune": ["pune", "पुणे"],
  "seed-mandi-nashik": ["nashik", "नाशिक", "नासिक"],
  "seed-mandi-solapur": ["solapur", "सोलापुर", "सोलापूर"],
  "seed-mandi-ahmednagar": ["ahmednagar", "अहमदनगर"],
  "seed-mandi-lucknow": ["lucknow", "लखनऊ"],
};

export async function transcribeWithSarvam(
  audioBuffer: Buffer,
  mimeType: string,
  filename = "audio.webm"
): Promise<{ transcript: string; detectedLanguage: string }> {
  const form = new FormData();
  form.append(
    "file",
    new Blob([audioBuffer], { type: mimeType || "audio/webm" }),
    filename
  );
  form.append("model", "saaras:v3");
  form.append("language_code", "unknown");
  form.append("mode", "transcribe");

  const response = await fetch("https://api.sarvam.ai/speech-to-text", {
    method: "POST",
    headers: {
      "api-subscription-key": env.sarvamApiKey,
    },
    body: form,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Sarvam STT failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { transcript?: string; language_code?: string };
  return {
    transcript: data.transcript?.trim() || "",
    detectedLanguage: data.language_code || "hi-IN",
  };
}

export function matchCrop(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [slug, aliases] of Object.entries(KNOWN_CROPS)) {
    for (const alias of aliases) {
      if (lower.includes(alias.toLowerCase())) {
        return slug;
      }
    }
  }
  return null;
}

export function matchMandi(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [mandiId, aliases] of Object.entries(KNOWN_MANDIS)) {
    for (const alias of aliases) {
      if (lower.includes(alias.toLowerCase())) {
        return mandiId;
      }
    }
  }
  return null;
}

export async function classifyIntentDirect(
  transcript: string,
  role: string,
  preferredLanguage: string,
  defaultMandiId?: string | null
): Promise<ProcessResult> {
  const crop = matchCrop(transcript);
  const mandi = matchMandi(transcript) || defaultMandiId || null;

  let intent: VoiceIntent = "general_query";
  const lower = transcript.toLowerCase();

  if (
    lower.includes("भाव") ||
    lower.includes("रेट") ||
    lower.includes("price") ||
    lower.includes("दर") ||
    lower.includes("कीमत") ||
    lower.includes("rate") ||
    crop !== null
  ) {
    intent = "price_query";
  } else if (
    lower.includes("बेचना") ||
    lower.includes("विक्री") ||
    lower.includes("sell") ||
    lower.includes("वेचવું")
  ) {
    intent = "sell_offer";
  }

  const entities: ExtractedEntities = {
    crop,
    mandi_id: mandi,
    quantity: null,
    unit: null,
    price: null,
  };

  const qtyMatch = transcript.match(/(\d+)\s*(kg|किलो|क्विंटल|quintal|टन|ton)/i);
  if (qtyMatch) {
    entities.quantity = Number(qtyMatch[1]);
    const u = qtyMatch[2].toLowerCase();
    if (u.includes("kg") || u.includes("किलो")) entities.unit = "kg";
    else if (u.includes("टन") || u.includes("ton")) entities.unit = "ton";
    else entities.unit = "quintal";
  }

  return {
    transcript,
    detected_language: preferredLanguage,
    intent,
    entities,
    draft_reply_text: null,
  };
}

export async function speakWithSarvam(
  text: string,
  languageCode = "hi-IN"
): Promise<{ mimeType: string; buffer: Buffer }> {
  let targetLang = languageCode;
  if (targetLang.includes("_")) {
    targetLang = targetLang.replace("_", "-");
  }

  const response = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: {
      "api-subscription-key": env.sarvamApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: [text],
      target_language_code: targetLang,
      speaker: "aditya",
      model: "bulbul:v3",
    }),
  });

  if (!response.ok) {
    const textErr = await response.text().catch(() => "");
    throw new Error(`Sarvam TTS failed (${response.status}): ${textErr}`);
  }

  const data = (await response.json()) as { audios?: string[] };
  if (!data.audios || data.audios.length === 0) {
    throw new Error("No audio returned from Sarvam TTS");
  }

  return {
    mimeType: "audio/wav",
    buffer: Buffer.from(data.audios[0], "base64"),
  };
}
