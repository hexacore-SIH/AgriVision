"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/AuthContext";
import { useAppLocale } from "@/lib/LocaleContext";
import { LOCALE_TO_LANGUAGE } from "@agrivision/shared-types";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const ROLE_HOME: Record<string, string> = {
  FARMER: "/farmer",
  MANDI_HEAD: "/mandi",
  ADMIN: "/admin",
};

export default function LoginPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const { requestOtp, verifyOtp } = useAuth();
  const { locale } = useAppLocale();
  const router = useRouter();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (phone.trim().length < 8) {
      setError(t("invalidPhone"));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await requestOtp(phone.trim());
      setDevOtp(res.devOtp ?? null);
      setStep("otp");
    } catch {
      setError(t("invalidPhone"));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const user = await verifyOtp(phone.trim(), code.trim());
      router.replace(ROLE_HOME[user.role] ?? "/");
    } catch {
      setError(t("invalidOtp"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-stone-50 p-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <div className="text-3xl">🌾</div>
          <h1 className="mt-2 text-lg font-semibold text-stone-900">{t("title")}</h1>
          <p className="mt-1 text-sm text-stone-500">{t("subtitle")}</p>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                {t("phoneLabel")}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("phonePlaceholder")}
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-green-600 py-2 font-medium text-white disabled:opacity-50"
            >
              {t("sendOtp")}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                {t("otpLabel")}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t("otpPlaceholder")}
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
                autoFocus
              />
              {devOtp && (
                <p className="mt-1 text-xs text-amber-600">
                  {t("devOtpHint", { code: devOtp })}
                </p>
              )}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-green-600 py-2 font-medium text-white disabled:opacity-50"
            >
              {t("verify")}
            </button>
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="w-full text-sm text-stone-500"
            >
              {t("changeNumber")}
            </button>
          </form>
        )}
      </div>

      <p className="text-xs text-stone-400">
        {tc("language")}: {LOCALE_TO_LANGUAGE[locale]}
      </p>
    </div>
  );
}
