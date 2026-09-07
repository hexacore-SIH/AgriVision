"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/AuthContext";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function TopNav() {
  const { user, logout } = useAuth();
  const t = useTranslations();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="border-b border-stone-300/80 bg-white shadow-xs">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-green-800">
          <span className="text-xl">🌾</span>
          <span>{t("common.appName")}</span>
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {user?.role === "FARMER" && (
            <>
              <Link href="/farmer" className="font-semibold text-stone-700 hover:text-stone-950">
                {t("nav.dashboard")}
              </Link>
              <Link href="/farmer/listings" className="font-semibold text-stone-700 hover:text-stone-950">
                {t("nav.listings")}
              </Link>
              <Link href="/farmer/mandis" className="font-semibold text-stone-700 hover:text-stone-950">
                {t("nav.nearbyMandis")}
              </Link>
              <Link href="/farmer/profit-calculator" className="font-semibold text-stone-700 hover:text-stone-950">
                {t("nav.profitCalculator")}
              </Link>
            </>
          )}
          {user?.role === "MANDI_HEAD" && (
            <>
              <Link href="/mandi" className="font-semibold text-stone-700 hover:text-stone-950">
                {t("nav.dashboard")}
              </Link>
              <Link href="/mandi/history" className="font-semibold text-stone-700 hover:text-stone-950">
                {t("nav.history")}
              </Link>
              <Link href="/mandi/nearby" className="font-semibold text-stone-700 hover:text-stone-950">
                {t("nav.nearbyMandis")}
              </Link>
            </>
          )}
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="font-semibold text-stone-700 hover:text-stone-950">
              {t("nav.admin")}
            </Link>
          )}

          <LanguageSwitcher />

          {user && (
            <button
              onClick={handleLogout}
              className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-xs hover:bg-stone-100 hover:text-stone-950"
            >
              {t("common.logout")}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
