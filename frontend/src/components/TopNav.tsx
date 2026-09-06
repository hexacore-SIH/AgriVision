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
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-green-700">
          <span className="text-xl">🌾</span>
          <span>{t("common.appName")}</span>
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {user?.role === "FARMER" && (
            <>
              <Link href="/farmer" className="text-stone-600 hover:text-stone-900">
                {t("nav.dashboard")}
              </Link>
              <Link href="/farmer/listings" className="text-stone-600 hover:text-stone-900">
                {t("nav.listings")}
              </Link>
            </>
          )}
          {user?.role === "MANDI_HEAD" && (
            <>
              <Link href="/mandi" className="text-stone-600 hover:text-stone-900">
                {t("nav.dashboard")}
              </Link>
              <Link href="/mandi/history" className="text-stone-600 hover:text-stone-900">
                {t("nav.history")}
              </Link>
            </>
          )}
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="text-stone-600 hover:text-stone-900">
              {t("nav.admin")}
            </Link>
          )}

          <LanguageSwitcher />

          {user && (
            <button
              onClick={handleLogout}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-stone-600 hover:bg-stone-100"
            >
              {t("common.logout")}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
