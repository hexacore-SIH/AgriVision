"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid2 as Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ThemeProvider,
  Typography,
} from "@mui/material";
import type { Locale, MandiWithLocation, Role } from "@agrivision/shared-types";
import { ROLES } from "@agrivision/shared-types";
import { RequireRole } from "@/components/RequireRole";
import { TopNav } from "@/components/TopNav";
import { MandiMap } from "@/components/map/MandiMapLoader";
import { apiJson } from "@/lib/apiClient";
import { useAppLocale } from "@/lib/LocaleContext";
import { cropLabel } from "@/lib/cropName";
import { muiTheme } from "@/lib/muiTheme";

interface AdminUser {
  id: string;
  phone: string;
  name: string | null;
  role: Role;
  mandiId: string | null;
}

interface CropOption {
  id: string;
  slug: string;
  defaultUnit: string;
  localNames: Record<string, string>;
}

function UsersSection({ mandis }: { mandis: MandiWithLocation[] }) {
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
      <h2 className="mb-3 text-lg font-bold text-stone-900">{t("usersTitle")}</h2>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-300/80 bg-white p-3.5 shadow-xs">
            <div className="min-w-[140px]">
              <p className="font-semibold text-stone-900">{u.name ?? u.phone}</p>
              <p className="text-xs font-medium text-stone-600">
                {u.phone} · <span className="font-semibold text-stone-700">{u.role}</span>
              </p>
            </div>
            <select
              defaultValue=""
              onChange={(e) =>
                setPendingRole((prev) => ({ ...prev, [u.id]: e.target.value as Role }))
              }
              className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-sm font-medium text-stone-900 shadow-xs focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
            >
              <option value="" disabled className="text-stone-500">
                {t("role")}
              </option>
              {ROLES.map((r) => (
                <option key={r} value={r} className="text-stone-900 bg-white">
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
                className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-sm font-medium text-stone-900 shadow-xs focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
              >
                <option value="" disabled className="text-stone-500">
                  {t("assignMandi")}
                </option>
                {mandis.map((m) => (
                  <option key={m.id} value={m.id} className="text-stone-900 bg-white">
                    {m.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => handlePromote(u.id)}
              disabled={!pendingRole[u.id]}
              className="rounded-lg bg-green-700 hover:bg-green-800 px-3.5 py-1.5 text-sm font-semibold text-white shadow-xs transition-colors disabled:opacity-50"
            >
              {t("promote")}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function MandisSection({
  mandis,
  onChange,
}: {
  mandis: MandiWithLocation[];
  onChange: () => void;
}) {
  const t = useTranslations("admin");
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !state) return;
    setBusy(true);
    try {
      await apiJson("/mandis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          state,
          district: district || undefined,
          latitude: latitude ? Number(latitude) : undefined,
          longitude: longitude ? Number(longitude) : undefined,
        }),
      });
      setName("");
      setState("");
      setDistrict("");
      setLatitude("");
      setLongitude("");
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id: string) {
    await apiJson(`/mandis/${id}`, { method: "DELETE" });
    onChange();
  }

  async function handleRestore(id: string) {
    await apiJson(`/mandis/${id}/restore`, { method: "POST" });
    onChange();
  }

  const activeMandis = mandis.filter((m) => m.isActive);

  return (
    <ThemeProvider theme={muiTheme}>
      <section>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {t("mandisTitle")}
        </Typography>

        <Card variant="outlined" sx={{ mb: 2 }}>
          <MandiMap mandis={activeMandis} height={280} />
        </Card>

        <Card variant="outlined" sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t("mandiName")}</TableCell>
                <TableCell>{t("state")}</TableCell>
                <TableCell>{t("status")}</TableCell>
                <TableCell align="right">{t("actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mandis.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>
                    {m.district ? `${m.district}, ` : ""}
                    {m.state}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={m.isActive ? t("active") : t("inactive")}
                      color={m.isActive ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {m.isActive ? (
                      <Button size="small" color="error" onClick={() => handleRemove(m.id)}>
                        {t("removeMandi")}
                      </Button>
                    ) : (
                      <Button size="small" onClick={() => handleRestore(m.id)}>
                        {t("restoreMandi")}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Box component="form" onSubmit={handleAdd}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t("mandiName")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t("state")}
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t("district")}
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label={t("latitude")}
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label={t("longitude")}
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }} display="flex" alignItems="center">
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={busy || !name || !state}
                  >
                    {t("addMandi")}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </section>
    </ThemeProvider>
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
      <h2 className="mb-3 font-semibold text-stone-900">{t("cropsTitle")}</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {crops.map((crop) => (
          <div key={crop.id} className="rounded-xl border border-stone-300 bg-white p-3 text-sm font-medium text-stone-900 shadow-sm">
            {cropLabel(crop.localNames, locale as Locale, crop.slug)}
            <span className="ml-1 text-xs font-normal text-stone-600">({crop.defaultUnit})</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function AdminContent() {
  const t = useTranslations("admin");
  const [mandis, setMandis] = useState<MandiWithLocation[]>([]);

  function loadMandis() {
    apiJson<MandiWithLocation[]>("/mandis?includeInactive=true").then(setMandis).catch(() => undefined);
  }

  useEffect(loadMandis, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#f8faf7]">
      <TopNav />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 p-4">
        <h1 className="text-2xl font-bold text-stone-900">{t("dashboardTitle")}</h1>
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
