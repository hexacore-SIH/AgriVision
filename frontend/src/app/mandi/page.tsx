"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Locale, Unit, VoiceInteractResponse } from "@agrivision/shared-types";
import { RequireRole } from "@/components/RequireRole";
import { TopNav } from "@/components/TopNav";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";
import { DraggablePriceList, type MandiCropItem } from "@/components/mandi/DraggablePriceList";
import { apiJson } from "@/lib/apiClient";
import { useAppLocale } from "@/lib/LocaleContext";
import { cropLabel } from "@/lib/cropName";

interface CropOption {
  id: string;
  slug: string;
  localNames: Record<string, string>;
}

function MandiDashboardContent() {
  const t = useTranslations("mandi");
  const { locale } = useAppLocale();

  const [items, setItems] = useState<MandiCropItem[]>([]);
  const [allCrops, setAllCrops] = useState<CropOption[]>([]);
  const [addCropId, setAddCropId] = useState("");

  const loadItems = useCallback(() => {
    apiJson<MandiCropItem[]>("/mandi-crops").then(setItems).catch(() => undefined);
  }, []);

  useEffect(() => {
    loadItems();
    apiJson<CropOption[]>("/crops").then(setAllCrops).catch(() => undefined);
  }, [loadItems]);

  async function handleReorder(orderedMandiCropIds: string[]) {
    setItems((prev) => {
      const byId = new Map(prev.map((i) => [i.mandiCropId, i]));
      return orderedMandiCropIds.map((id) => byId.get(id)!).filter(Boolean);
    });
    await apiJson("/mandi-crops/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedMandiCropIds }),
    });
  }

  async function handleUpdatePrice(cropId: string, price: number, unit: Unit) {
    await apiJson("/mandi-prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cropId, pricePerUnit: price, unit }),
    });
    loadItems();
  }

  async function handleAddCrop() {
    if (!addCropId) return;
    await apiJson("/mandi-crops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cropId: addCropId }),
    });
    setAddCropId("");
    loadItems();
  }

  function handleVoiceResult(result: VoiceInteractResponse) {
    if (result.intent === "price_update" && result.price) {
      loadItems();
    }
  }

  const trackedCropIds = new Set(items.map((i) => i.cropId));
  const availableCrops = allCrops.filter((c) => !trackedCropIds.has(c.id));

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-4">
        <h1 className="text-xl font-semibold text-stone-900">{t("dashboardTitle")}</h1>

        <div>
          <h2 className="mb-2 font-medium text-stone-800">{t("voicePanelTitle")}</h2>
          <VoiceRecorder onResult={handleVoiceResult} />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-medium text-stone-800">{t("currentPrice")}</h2>
            <p className="text-xs text-stone-400">{t("dragHint")}</p>
          </div>

          <DraggablePriceList
            items={items}
            onReorder={handleReorder}
            onUpdatePrice={handleUpdatePrice}
          />

          {availableCrops.length > 0 && (
            <div className="mt-3 flex gap-2">
              <select
                value={addCropId}
                onChange={(e) => setAddCropId(e.target.value)}
                className="flex-1 rounded-lg border border-stone-300 px-3 py-2"
              >
                <option value="">{t("selectCrop")}</option>
                {availableCrops.map((crop) => (
                  <option key={crop.id} value={crop.id}>
                    {cropLabel(crop.localNames, locale as Locale, crop.slug)}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddCrop}
                disabled={!addCropId}
                className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white disabled:opacity-50"
              >
                {t("addCrop")}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function MandiDashboardPage() {
  return (
    <RequireRole roles={["MANDI_HEAD"]}>
      <MandiDashboardContent />
    </RequireRole>
  );
}
