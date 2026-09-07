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
    <div className="flex min-h-screen flex-col bg-[#f8faf7]">
      <TopNav />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-4">
        <h1 className="text-2xl font-bold text-stone-900">{t("myListings")}</h1>

        <form
          onSubmit={handleCreate}
          className="grid grid-cols-2 gap-3.5 rounded-2xl border border-stone-300/80 bg-white p-5 shadow-xs"
        >
          <p className="col-span-2 font-bold text-stone-900">{t("createListing")}</p>

          <select
            value={cropId}
            onChange={(e) => setCropId(e.target.value)}
            className="col-span-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 shadow-xs focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
          >
            <option value="" className="text-stone-500">{t("crop")}</option>
            {crops.map((crop) => (
              <option key={crop.id} value={crop.id} className="text-stone-900 bg-white">
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
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500 shadow-xs focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
          />

          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as Unit)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 shadow-xs focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
          >
            {UNITS.map((u) => (
              <option key={u} value={u} className="text-stone-900 bg-white">
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
            className="col-span-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500 shadow-xs focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
          />

          <button
            type="submit"
            disabled={busy || !cropId || !quantity}
            className="col-span-2 rounded-lg bg-green-700 hover:bg-green-800 py-2.5 font-semibold text-white shadow-xs transition-colors disabled:opacity-50"
          >
            {tc("submit")}
          </button>
        </form>

        <div className="space-y-2">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} onStatusChange={handleStatusChange} />
          ))}
          {listings.length === 0 && <p className="text-sm font-medium text-stone-600">{t("noListings")}</p>}
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
