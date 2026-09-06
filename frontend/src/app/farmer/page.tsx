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
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-4">
        <h1 className="text-xl font-semibold text-stone-900">{t("dashboardTitle")}</h1>
        <p className="text-sm text-stone-500">{t("voiceHint")}</p>

        <VoiceRecorder onResult={handleVoiceResult} />

        <section>
          <h2 className="mb-3 font-medium text-stone-800">{t("myListings")}</h2>
          {listings.length === 0 ? (
            <p className="text-sm text-stone-400">{t("noListings")}</p>
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
