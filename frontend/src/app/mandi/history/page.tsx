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
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-4">
        <h1 className="text-xl font-semibold text-stone-900">{t("priceHistoryTitle")}</h1>

        <select
          value={cropId}
          onChange={(e) => setCropId(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        >
          <option value="">{t("selectCrop")}</option>
          {crops.map((crop) => (
            <option key={crop.id} value={crop.id}>
              {cropLabel(crop.localNames, locale as Locale, crop.slug)}
            </option>
          ))}
        </select>

        {chartData.length > 0 ? (
          <div className="h-72 rounded-2xl border border-stone-200 bg-white p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="price" stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          cropId && <p className="text-sm text-stone-400">{t("noPriceYet")}</p>
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
