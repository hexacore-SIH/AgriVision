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
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#f8faf7] p-4 text-stone-900">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-stone-300/90 bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <div className="text-4xl">🌾</div>
          <h1 className="mt-2 text-xl font-bold text-stone-900">{t("title")}</h1>
          <p className="mt-1 text-sm font-medium text-stone-600">{t("subtitle")}</p>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-stone-800">
                {t("phoneLabel")}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("phonePlaceholder")}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500 shadow-xs focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
                autoFocus
              />
            </div>
            {error && <p className="text-sm font-medium text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-green-700 hover:bg-green-800 py-2.5 font-semibold text-white shadow-xs transition-colors disabled:opacity-50"
            >
              {t("sendOtp")}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-stone-800">
                {t("otpLabel")}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t("otpPlaceholder")}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500 shadow-xs focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
                autoFocus
              />
              {devOtp && (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs font-semibold text-amber-800">
                  {t("devOtpHint", { code: devOtp })}
                </div>
              )}
            </div>
            {error && <p className="text-sm font-medium text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-green-700 hover:bg-green-800 py-2.5 font-semibold text-white shadow-xs transition-colors disabled:opacity-50"
            >
              {t("verify")}
            </button>
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="w-full text-sm font-medium text-stone-600 hover:text-stone-900"
            >
              {t("changeNumber")}
            </button>
          </form>
        )}
      </div>

      <p className="text-xs font-medium text-stone-600">
        {tc("language")}: {LOCALE_TO_LANGUAGE[locale]}
      </p>
    </div>
  );
}
