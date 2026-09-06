"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Locale, Role } from "@agrivision/shared-types";
import { ROLES } from "@agrivision/shared-types";
import { RequireRole } from "@/components/RequireRole";
import { TopNav } from "@/components/TopNav";
import { apiJson } from "@/lib/apiClient";
import { useAppLocale } from "@/lib/LocaleContext";
import { cropLabel } from "@/lib/cropName";

interface AdminUser {
  id: string;
  phone: string;
  name: string | null;
  role: Role;
  mandiId: string | null;
}

interface MandiOption {
  id: string;
  name: string;
  state: string;
  district: string | null;
}

interface CropOption {
  id: string;
  slug: string;
  defaultUnit: string;
  localNames: Record<string, string>;
}

function UsersSection({ mandis }: { mandis: MandiOption[] }) {
  const t = useTranslations("admin");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pendingRole, setPendingRole] = useState<Record<string, Role>>({});
  const [pendingMandi, setPendingMandi] = useState<Record<string, string>>({});

  function load() {
    apiJson<AdminUser[]>("/admin/users").then(setUsers).catch(() => undefined);
  }

  useEffect(load, []);

  async function handlePromote(userId: string) {
    const role = pendingRole[userId];
    if (!role) return;
    const mandiId = pendingMandi[userId];
    await apiJson(`/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, mandiId: role === "MANDI_HEAD" ? mandiId : undefined }),
    });
    load();
  }

  return (
    <section>
      <h2 className="mb-3 font-medium text-stone-800">{t("usersTitle")}</h2>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-white p-3">
            <div className="min-w-[140px]">
              <p className="font-medium">{u.name ?? u.phone}</p>
              <p className="text-xs text-stone-400">
                {u.phone} · {u.role}
              </p>
            </div>
            <select
              defaultValue=""
              onChange={(e) =>
                setPendingRole((prev) => ({ ...prev, [u.id]: e.target.value as Role }))
              }
              className="rounded-lg border border-stone-300 px-2 py-1 text-sm"
            >
              <option value="" disabled>
                {t("role")}
              </option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {pendingRole[u.id] === "MANDI_HEAD" && (
              <select
                defaultValue=""
                onChange={(e) =>
                  setPendingMandi((prev) => ({ ...prev, [u.id]: e.target.value }))
                }
                className="rounded-lg border border-stone-300 px-2 py-1 text-sm"
              >
                <option value="" disabled>
                  {t("assignMandi")}
                </option>
                {mandis.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => handlePromote(u.id)}
              disabled={!pendingRole[u.id]}
              className="rounded-lg bg-green-600 px-3 py-1 text-sm font-medium text-white disabled:opacity-50"
            >
              {t("promote")}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function MandisSection({ mandis, onChange }: { mandis: MandiOption[]; onChange: () => void }) {
  const t = useTranslations("admin");
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !state) return;
    await apiJson("/mandis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, state, district: district || undefined }),
    });
    setName("");
    setState("");
    setDistrict("");
    onChange();
  }

  return (
    <section>
      <h2 className="mb-3 font-medium text-stone-800">{t("mandisTitle")}</h2>
      <div className="mb-3 space-y-2">
        {mandis.map((m) => (
          <div key={m.id} className="rounded-xl border border-stone-200 bg-white p-3 text-sm">
            {m.name} — {m.district ? `${m.district}, ` : ""}
            {m.state}
          </div>
        ))}
      </div>
      <form onSubmit={handleAdd} className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("mandiName")}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
        <input
          value={state}
          onChange={(e) => setState(e.target.value)}
          placeholder={t("state")}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
        <input
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          placeholder={t("district")}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white">
          {t("addMandi")}
        </button>
      </form>
    </section>
  );
}

function CropsSection() {
  const t = useTranslations("admin");
  const { locale } = useAppLocale();
  const [crops, setCrops] = useState<CropOption[]>([]);

  useEffect(() => {
    apiJson<CropOption[]>("/crops").then(setCrops).catch(() => undefined);
  }, []);

  return (
    <section>
      <h2 className="mb-3 font-medium text-stone-800">{t("cropsTitle")}</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {crops.map((crop) => (
          <div key={crop.id} className="rounded-xl border border-stone-200 bg-white p-3 text-sm">
            {cropLabel(crop.localNames, locale as Locale, crop.slug)}
            <span className="ml-1 text-xs text-stone-400">({crop.defaultUnit})</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function AdminContent() {
  const t = useTranslations("admin");
  const [mandis, setMandis] = useState<MandiOption[]>([]);

  function loadMandis() {
    apiJson<MandiOption[]>("/mandis").then(setMandis).catch(() => undefined);
  }

  useEffect(loadMandis, []);

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 p-4">
        <h1 className="text-xl font-semibold text-stone-900">{t("dashboardTitle")}</h1>
        <UsersSection mandis={mandis} />
        <MandisSection mandis={mandis} onChange={loadMandis} />
        <CropsSection />
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireRole roles={["ADMIN"]}>
      <AdminContent />
    </RequireRole>
  );
}
