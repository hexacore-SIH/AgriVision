"use client";

import { useTranslations } from "next-intl";
import { RequireRole } from "@/components/RequireRole";
import { TopNav } from "@/components/TopNav";
import { NearbyMandisView } from "@/components/map/NearbyMandisView";

function MandiNearbyContent() {
  const t = useTranslations("map");

  return (
    <div className="flex min-h-screen flex-col bg-[#f8faf7]">
      <TopNav />
      <main className="mx-auto w-full max-w-3xl flex-1 p-4">
        <h1 className="mb-2 text-2xl font-bold text-stone-900">{t("nearbyTitle")}</h1>
        <p className="mb-4 text-sm font-medium text-stone-600">{t("mandiHeadHint")}</p>
        <NearbyMandisView />
      </main>
    </div>
  );
}

export default function MandiNearbyPage() {
  return (
    <RequireRole roles={["MANDI_HEAD"]}>
      <MandiNearbyContent />
    </RequireRole>
  );
}
