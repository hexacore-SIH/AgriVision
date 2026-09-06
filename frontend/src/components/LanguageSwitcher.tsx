"use client";

import type { Locale } from "@agrivision/shared-types";
import { LOCALES, LOCALE_TO_LANGUAGE } from "@agrivision/shared-types";
import { useAppLocale } from "@/lib/LocaleContext";
import { useAuth } from "@/lib/AuthContext";
import { apiFetch } from "@/lib/apiClient";

const LABELS: Record<Locale, string> = {
  hi: "हिन्दी",
  mr: "मराठी",
  pa: "ਪੰਜਾਬੀ",
  gu: "ગુજરાતી",
  en: "English",
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useAppLocale();
  const { user, updateUser } = useAuth();

  async function handleChange(next: Locale) {
    setLocale(next);
    if (user) {
      const preferredLanguage = LOCALE_TO_LANGUAGE[next];
      updateUser({ preferredLanguage });
      await apiFetch("/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredLanguage }),
      }).catch(() => undefined);
    }
  }

  return (
    <select
      value={locale}
      onChange={(e) => handleChange(e.target.value as Locale)}
      className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm"
      aria-label="Language"
    >
      {LOCALES.map((code) => (
        <option key={code} value={code}>
          {LABELS[code]}
        </option>
      ))}
    </select>
  );
}
