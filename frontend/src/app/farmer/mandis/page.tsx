"use client";

import { useTranslations } from "next-intl";
import { RequireRole } from "@/components/RequireRole";
import { TopNav } from "@/components/TopNav";
import { NearbyMandisView } from "@/components/map/NearbyMandisView";

function FarmerMandisContent() {
  const t = useTranslations("map");

  return (
    <div className="flex min-h-screen flex-col bg-[#f8faf7]">
      <TopNav />
      <main className="mx-auto w-full max-w-3xl flex-1 p-4">
        <h1 className="mb-4 text-2xl font-bold text-stone-900">{t("nearbyTitle")}</h1>
        <NearbyMandisView />
      </main>
    </div>
  );
}

export default function FarmerMandisPage() {
  return (
    <RequireRole roles={["FARMER"]}>
      <FarmerMandisContent />
    </RequireRole>
  );
}
