import type { Unit } from "@agrivision/shared-types";

const SARVAM_TO_LOCALE_KEY: Record<string, string> = {
  "hi-IN": "hi",
  "mr-IN": "mr",
  "pa-IN": "pa",
  "gu-IN": "gu",
  "en-IN": "en",
};

export function localizeCropName(
  localNames: unknown,
  languageCode: string,
  fallbackSlug: string
): string {
  const key = SARVAM_TO_LOCALE_KEY[languageCode] ?? "hi";
  if (localNames && typeof localNames === "object") {
    const names = localNames as Record<string, string>;
    return names[key] ?? names.hi ?? fallbackSlug;
  }
  return fallbackSlug;
}

const UNIT_LABELS: Record<Unit, Record<string, string>> = {
  KG: { "hi-IN": "किलो", "mr-IN": "किलो", "pa-IN": "ਕਿਲੋ", "gu-IN": "કિલો", "en-IN": "kg" },
  QUINTAL: {
    "hi-IN": "क्विंटल",
    "mr-IN": "क्विंटल",
    "pa-IN": "ਕੁਇੰਟਲ",
    "gu-IN": "ક્વિન્ટલ",
    "en-IN": "quintal",
  },
  TON: { "hi-IN": "टन", "mr-IN": "टन", "pa-IN": "ਟਨ", "gu-IN": "ટન", "en-IN": "ton" },
};

export function localizeUnit(unit: Unit, languageCode: string): string {
  return UNIT_LABELS[unit][languageCode] ?? UNIT_LABELS[unit]["hi-IN"];
}
