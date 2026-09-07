"use client";

import { useTranslations } from "next-intl";
import type { Locale, ListingStatus, Unit } from "@agrivision/shared-types";
import { useAppLocale } from "@/lib/LocaleContext";
import { cropLabel } from "@/lib/cropName";

export interface ListingItem {
  id: string;
  cropSlug: string;
  localNames?: Record<string, string>;
  quantity: number;
  unit: Unit;
  askingPricePerUnit: number | null;
  status: ListingStatus;
  createdAt: string;
}

const STATUS_STYLES: Record<ListingStatus, string> = {
  OPEN: "bg-green-100 text-green-900 border border-green-300 font-semibold",
  SOLD: "bg-stone-200 text-stone-900 border border-stone-300 font-semibold",
  CANCELLED: "bg-red-100 text-red-900 border border-red-300 font-semibold",
};

export function ListingCard({
  listing,
  onStatusChange,
}: {
  listing: ListingItem;
  onStatusChange?: (id: string, status: ListingStatus) => void;
}) {
  const t = useTranslations();
  const { locale } = useAppLocale();

  const crop = cropLabel(listing.localNames, locale as Locale, listing.cropSlug);
  const unit = t(`units.${listing.unit}`);

  return (
    <div className="flex items-center justify-between rounded-xl border border-stone-300/80 bg-white p-4 shadow-xs">
      <div>
        <p className="font-semibold text-stone-950">
          {listing.quantity} {unit} · {crop}
        </p>
        {listing.askingPricePerUnit && (
          <p className="text-sm font-semibold text-stone-700">₹{listing.askingPricePerUnit} / {unit}</p>
        )}
        <p className="text-xs font-medium text-stone-600">
          {t("farmer.createdOn", { date: new Date(listing.createdAt).toLocaleDateString() })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs ${STATUS_STYLES[listing.status]}`}>
          {t(`farmer.status_${listing.status}`)}
        </span>
        {onStatusChange && listing.status === "OPEN" && (
          <select
            className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-semibold text-stone-800 shadow-xs focus:border-green-600 focus:outline-none"
            value=""
            onChange={(e) => {
              if (e.target.value) onStatusChange(listing.id, e.target.value as ListingStatus);
            }}
          >
            <option value="" disabled className="text-stone-500">
              …
            </option>
            <option value="SOLD" className="text-stone-900 bg-white">{t("farmer.status_SOLD")}</option>
            <option value="CANCELLED" className="text-stone-900 bg-white">{t("farmer.status_CANCELLED")}</option>
          </select>
        )}
      </div>
    </div>
  );
}
