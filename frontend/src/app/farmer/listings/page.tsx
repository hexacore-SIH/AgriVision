"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Locale, ListingStatus, Unit } from "@agrivision/shared-types";
import { UNITS } from "@agrivision/shared-types";
import { RequireRole } from "@/components/RequireRole";
import { TopNav } from "@/components/TopNav";
import { ListingCard, type ListingItem } from "@/components/listings/ListingCard";
import { apiJson } from "@/lib/apiClient";
import { useAppLocale } from "@/lib/LocaleContext";
import { cropLabel } from "@/lib/cropName";

interface CropOption {
  id: string;
  slug: string;
  defaultUnit: Unit;
  localNames: Record<string, string>;
}

function FarmerListingsContent() {
  const t = useTranslations("farmer");
  const tc = useTranslations("common");
  const { locale } = useAppLocale();

  const [listings, setListings] = useState<ListingItem[]>([]);
  const [crops, setCrops] = useState<CropOption[]>([]);
  const [cropId, setCropId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<Unit>("KG");
  const [askingPrice, setAskingPrice] = useState("");
  const [busy, setBusy] = useState(false);

  const loadListings = useCallback(() => {
    apiJson<ListingItem[]>("/listings/mine").then(setListings).catch(() => undefined);
  }, []);

  useEffect(() => {
    loadListings();
    apiJson<CropOption[]>("/crops").then(setCrops).catch(() => undefined);
  }, [loadListings]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!cropId || !quantity) return;
    setBusy(true);
    try {
      await apiJson("/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropId,
          quantity: Number(quantity),
          unit,
          askingPricePerUnit: askingPrice ? Number(askingPrice) : undefined,
        }),
      });
      setQuantity("");
      setAskingPrice("");
      loadListings();
    } finally {
      setBusy(false);
    }
  }

  async function handleStatusChange(id: string, status: ListingStatus) {
    await apiJson(`/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadListings();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-4">
        <h1 className="text-xl font-semibold text-stone-900">{t("myListings")}</h1>

        <form
          onSubmit={handleCreate}
          className="grid grid-cols-2 gap-3 rounded-2xl border border-stone-200 bg-white p-4"
        >
          <p className="col-span-2 font-medium text-stone-800">{t("createListing")}</p>

          <select
            value={cropId}
            onChange={(e) => setCropId(e.target.value)}
            className="col-span-2 rounded-lg border border-stone-300 px-3 py-2"
          >
            <option value="">{t("crop")}</option>
            {crops.map((crop) => (
              <option key={crop.id} value={crop.id}>
                {cropLabel(crop.localNames, locale as Locale, crop.slug)}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            step="0.1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={t("quantity")}
            className="rounded-lg border border-stone-300 px-3 py-2"
          />

          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as Unit)}
            className="rounded-lg border border-stone-300 px-3 py-2"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            step="0.01"
            value={askingPrice}
            onChange={(e) => setAskingPrice(e.target.value)}
            placeholder={t("askingPrice")}
            className="col-span-2 rounded-lg border border-stone-300 px-3 py-2"
          />

          <button
            type="submit"
            disabled={busy || !cropId || !quantity}
            className="col-span-2 rounded-lg bg-green-600 py-2 font-medium text-white disabled:opacity-50"
          >
            {tc("submit")}
          </button>
        </form>

        <div className="space-y-2">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} onStatusChange={handleStatusChange} />
          ))}
          {listings.length === 0 && <p className="text-sm text-stone-400">{t("noListings")}</p>}
        </div>
      </main>
    </div>
  );
}

export default function FarmerListingsPage() {
  return (
    <RequireRole roles={["FARMER"]}>
      <FarmerListingsContent />
    </RequireRole>
  );
}
