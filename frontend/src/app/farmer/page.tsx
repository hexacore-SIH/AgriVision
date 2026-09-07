"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { VoiceInteractResponse } from "@agrivision/shared-types";
import { RequireRole } from "@/components/RequireRole";
import { TopNav } from "@/components/TopNav";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";
import { ListingCard, type ListingItem } from "@/components/listings/ListingCard";
import { apiJson } from "@/lib/apiClient";

function FarmerDashboardContent() {
  const t = useTranslations("farmer");
  const [listings, setListings] = useState<ListingItem[]>([]);

  const loadListings = useCallback(() => {
    apiJson<ListingItem[]>("/listings/mine")
      .then((data) => setListings(data.slice(0, 5)))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  function handleVoiceResult(result: VoiceInteractResponse) {
    if (result.intent === "sell_offer" && result.listing) {
      loadListings();
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8faf7]">
      <TopNav />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{t("dashboardTitle")}</h1>
          <p className="mt-1 text-sm font-medium text-stone-600">{t("voiceHint")}</p>
        </div>

        <VoiceRecorder onResult={handleVoiceResult} />

        <section>
          <h2 className="mb-3 font-bold text-stone-900">{t("myListings")}</h2>
          {listings.length === 0 ? (
            <p className="text-sm font-medium text-stone-600">{t("noListings")}</p>
          ) : (
            <div className="space-y-2">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function FarmerDashboardPage() {
  return (
    <RequireRole roles={["FARMER"]}>
      <FarmerDashboardContent />
    </RequireRole>
  );
}
