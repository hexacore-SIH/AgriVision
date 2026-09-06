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
  OPEN: "bg-green-100 text-green-700",
  SOLD: "bg-stone-200 text-stone-600",
  CANCELLED: "bg-red-100 text-red-600",
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
    <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4">
      <div>
        <p className="font-medium text-stone-900">
          {listing.quantity} {unit} · {crop}
        </p>
        {listing.askingPricePerUnit && (
          <p className="text-sm text-stone-500">₹{listing.askingPricePerUnit} / {unit}</p>
        )}
        <p className="text-xs text-stone-400">
          {t("farmer.createdOn", { date: new Date(listing.createdAt).toLocaleDateString() })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[listing.status]}`}>
          {t(`farmer.status_${listing.status}`)}
        </span>
        {onStatusChange && listing.status === "OPEN" && (
          <select
            className="rounded-lg border border-stone-300 px-2 py-1 text-xs"
            value=""
            onChange={(e) => {
              if (e.target.value) onStatusChange(listing.id, e.target.value as ListingStatus);
            }}
          >
            <option value="" disabled>
              …
            </option>
            <option value="SOLD">{t("farmer.status_SOLD")}</option>
            <option value="CANCELLED">{t("farmer.status_CANCELLED")}</option>
          </select>
        )}
      </div>
    </div>
  );
}
