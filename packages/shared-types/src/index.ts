export const ROLES = ["FARMER", "MANDI_HEAD", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const LANGUAGES = ["hi_IN", "mr_IN", "pa_IN", "gu_IN", "en_IN"] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_TO_SARVAM_CODE: Record<Language, string> = {
  hi_IN: "hi-IN",
  mr_IN: "mr-IN",
  pa_IN: "pa-IN",
  gu_IN: "gu-IN",
  en_IN: "en-IN",
};

export const SARVAM_CODE_TO_LANGUAGE: Record<string, Language> = {
  "hi-IN": "hi_IN",
  "mr-IN": "mr_IN",
  "pa-IN": "pa_IN",
  "gu-IN": "gu_IN",
  "en-IN": "en_IN",
};

export const LOCALES = ["hi", "mr", "pa", "gu", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const LANGUAGE_TO_LOCALE: Record<Language, Locale> = {
  hi_IN: "hi",
  mr_IN: "mr",
  pa_IN: "pa",
  gu_IN: "gu",
  en_IN: "en",
};

export const LOCALE_TO_LANGUAGE: Record<Locale, Language> = {
  hi: "hi_IN",
  mr: "mr_IN",
  pa: "pa_IN",
  gu: "gu_IN",
  en: "en_IN",
};

export const UNITS = ["KG", "QUINTAL", "TON"] as const;
export type Unit = (typeof UNITS)[number];

export const LISTING_STATUSES = ["OPEN", "SOLD", "CANCELLED"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const VOICE_INTENTS = [
  "price_query",
  "sell_offer",
  "price_update",
  "general_query",
] as const;
export type VoiceIntent = (typeof VOICE_INTENTS)[number];

export interface ExtractedEntities {
  crop: string | null;
  quantity: number | null;
  unit: "kg" | "quintal" | "ton" | null;
  price: number | null;
  mandi_id: string | null;
}

export interface ProcessResult {
  transcript: string;
  detected_language: string;
  intent: VoiceIntent;
  entities: ExtractedEntities;
  draft_reply_text: string | null;
}

export interface VoiceInteractResponse {
  transcript: string;
  detectedLanguage: string;
  intent: VoiceIntent;
  entities: ExtractedEntities;
  replyText: string;
  listing?: {
    id: string;
    cropSlug: string;
    quantity: number;
    unit: Unit;
  };
  price?: {
    id: string;
    cropSlug: string;
    pricePerUnit: number;
    unit: Unit;
  };
  audio: {
    mimeType: string;
    base64: string;
  };
}
