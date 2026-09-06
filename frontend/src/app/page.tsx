"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/AuthContext";
import { TopNav } from "@/components/TopNav";

const ROLE_HOME: Record<string, string> = {
  FARMER: "/farmer",
  MANDI_HEAD: "/mandi",
  ADMIN: "/admin",
};

export default function HomePage() {
  const { user, initializing } = useAuth();
  const router = useRouter();
  const t = useTranslations();

  useEffect(() => {
    if (initializing) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    router.replace(ROLE_HOME[user.role] ?? "/login");
  }, [initializing, user, router]);

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="flex flex-1 items-center justify-center text-stone-500">
        {t("common.loading")}
      </main>
    </div>
  );
}
