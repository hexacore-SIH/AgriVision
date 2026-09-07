"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { Locale } from "@agrivision/shared-types";
import { RequireRole } from "@/components/RequireRole";
import { TopNav } from "@/components/TopNav";
import { apiJson } from "@/lib/apiClient";
import { useAuth } from "@/lib/AuthContext";
import { useAppLocale } from "@/lib/LocaleContext";
import { cropLabel } from "@/lib/cropName";

interface CropOption {
  id: string;
  slug: string;
  localNames: Record<string, string>;
}

interface HistoryPoint {
  pricePerUnit: number;
  unit: string;
  createdAt: string;
}

function MandiHistoryContent() {
  const t = useTranslations("mandi");
  const { user } = useAuth();
  const { locale } = useAppLocale();

  const [crops, setCrops] = useState<CropOption[]>([]);
  const [cropId, setCropId] = useState("");
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  useEffect(() => {
    apiJson<CropOption[]>("/crops").then(setCrops).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!cropId || !user?.mandiId) return;
    apiJson<HistoryPoint[]>(
      `/mandi-prices/history?mandiId=${user.mandiId}&cropId=${cropId}&days=90`
    )
      .then(setHistory)
      .catch(() => undefined);
  }, [cropId, user?.mandiId]);

  const chartData = history.map((point) => ({
    date: new Date(point.createdAt).toLocaleDateString(),
    price: point.pricePerUnit,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-[#f8faf7]">
      <TopNav />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-4">
        <h1 className="text-2xl font-bold text-stone-900">{t("priceHistoryTitle")}</h1>

        <select
          value={cropId}
          onChange={(e) => setCropId(e.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 shadow-xs focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
        >
          <option value="" className="text-stone-500">{t("selectCrop")}</option>
          {crops.map((crop) => (
            <option key={crop.id} value={crop.id} className="text-stone-900 bg-white">
              {cropLabel(crop.localNames, locale as Locale, crop.slug)}
            </option>
          ))}
        </select>

        {chartData.length > 0 ? (
          <div className="h-72 rounded-2xl border border-stone-300/80 bg-white p-4 shadow-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#44403c" }} />
                <YAxis tick={{ fontSize: 12, fill: "#44403c" }} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#d6d3d1", color: "#1c1917", borderRadius: "8px" }} />
                <Line type="monotone" dataKey="price" stroke="#15803d" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          cropId && <p className="text-sm font-medium text-stone-600">{t("noPriceYet")}</p>
        )}
      </main>
    </div>
  );
}

export default function MandiHistoryPage() {
  return (
    <RequireRole roles={["MANDI_HEAD"]}>
      <MandiHistoryContent />
    </RequireRole>
  );
}
