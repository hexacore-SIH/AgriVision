"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  Grid2 as Grid,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import type { Locale, ProfitCalculatorResult, Unit } from "@agrivision/shared-types";
import { UNITS } from "@agrivision/shared-types";
import { RequireRole } from "@/components/RequireRole";
import { TopNav } from "@/components/TopNav";
import { apiJson } from "@/lib/apiClient";
import { useAppLocale } from "@/lib/LocaleContext";
import { cropLabel } from "@/lib/cropName";
import { muiTheme } from "@/lib/muiTheme";

interface MandiOption {
  id: string;
  name: string;
}
interface CropOption {
  id: string;
  slug: string;
  defaultUnit: Unit;
  localNames: Record<string, string>;
}

function ScenarioCard({
  title,
  scenario,
  recommended,
  t,
}: {
  title: string;
  scenario: ProfitCalculatorResult["sellNow"];
  recommended: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        flex: 1,
        borderColor: recommended ? "primary.main" : undefined,
        borderWidth: recommended ? 2 : 1,
        position: "relative",
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle1" fontWeight={600}>
            {title}
          </Typography>
          {recommended && (
            <Chip
              icon={<TrendingUpIcon />}
              label={t("recommended")}
              color="primary"
              size="small"
            />
          )}
        </Stack>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          ₹{scenario.netRevenue.toLocaleString("en-IN")}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          {t("netRevenue")}
        </Typography>
        <Divider sx={{ my: 1.5 }} />
        <Stack spacing={0.5}>
          <Row label={t("grossRevenue")} value={scenario.grossRevenue} />
          <Row label={t("commission")} value={-scenario.commission} />
          {scenario.storageCost > 0 && <Row label={t("storageCost")} value={-scenario.storageCost} />}
        </Stack>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">
        {value < 0 ? "-" : ""}₹{Math.abs(value).toLocaleString("en-IN")}
      </Typography>
    </Stack>
  );
}

function ProfitCalculatorContent() {
  const t = useTranslations("profit");
  const tu = useTranslations("units");
  const { locale } = useAppLocale();

  const [mandis, setMandis] = useState<MandiOption[]>([]);
  const [crops, setCrops] = useState<CropOption[]>([]);
  const [mandiId, setMandiId] = useState("");
  const [cropId, setCropId] = useState("");
  const [quantity, setQuantity] = useState("100");
  const [unit, setUnit] = useState<Unit>("KG");
  const [waitDays, setWaitDays] = useState(7);
  const [result, setResult] = useState<ProfitCalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiJson<MandiOption[]>("/mandis").then(setMandis).catch(() => undefined);
    apiJson<CropOption[]>("/crops").then(setCrops).catch(() => undefined);
  }, []);

  useEffect(() => {
    // Resets the unit to the newly-picked crop's default whenever the crop
    // selection changes - the farmer can still override it afterwards.
    const crop = crops.find((c) => c.id === cropId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (crop) setUnit(crop.defaultUnit);
  }, [cropId, crops]);

  async function handleCalculate() {
    if (!mandiId || !cropId || !quantity) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiJson<ProfitCalculatorResult>("/tools/profit-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mandiId,
          cropId,
          quantity: Number(quantity),
          unit,
          waitDays,
        }),
      });
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("selectPrompt"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <Stack spacing={3}>
        <Card variant="outlined">
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t("mandi")}</InputLabel>
                  <Select value={mandiId} label={t("mandi")} onChange={(e) => setMandiId(e.target.value)}>
                    {mandis.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t("crop")}</InputLabel>
                  <Select value={cropId} label={t("crop")} onChange={(e) => setCropId(e.target.value)}>
                    {crops.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {cropLabel(c.localNames, locale as Locale, c.slug)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={t("quantity")}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t("unit")}</InputLabel>
                  <Select value={unit} label={t("unit")} onChange={(e) => setUnit(e.target.value as Unit)}>
                    {UNITS.map((u) => (
                      <MenuItem key={u} value={u}>
                        {tu(u)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t("waitDays")}: {waitDays}
                </Typography>
                <Slider
                  value={waitDays}
                  onChange={(_e, v) => setWaitDays(v as number)}
                  min={1}
                  max={60}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }} display="flex" alignItems="center">
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleCalculate}
                  disabled={busy || !mandiId || !cropId || !quantity}
                >
                  {t("calculate")}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        {result && (
          <Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <ScenarioCard
                title={t("sellNow")}
                scenario={result.sellNow}
                recommended={result.recommendation === "SELL_NOW"}
                t={t}
              />
              <ScenarioCard
                title={t("waitAndSell", { days: result.waitDays })}
                scenario={result.waitAndSell}
                recommended={result.recommendation === "WAIT"}
                t={t}
              />
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" mt={2}>
              {result.trendPerDayPerUnit !== 0 ? (
                result.trendPerDayPerUnit > 0 ? (
                  <TrendingUpIcon color="primary" fontSize="small" />
                ) : (
                  <TrendingDownIcon color="error" fontSize="small" />
                )
              ) : null}
              <Typography variant="caption" color="text.secondary">
                {result.trendPerDayPerUnit !== 0
                  ? t("trendNote", { trend: result.trendPerDayPerUnit })
                  : t("noHistory")}
              </Typography>
            </Stack>
          </Box>
        )}
      </Stack>
    </ThemeProvider>
  );
}

export default function ProfitCalculatorPage() {
  return (
    <RequireRole roles={["FARMER"]}>
      <div className="flex min-h-screen flex-col">
        <TopNav />
        <main className="mx-auto w-full max-w-3xl flex-1 p-4">
          <ProfitCalculatorHeader />
          <ProfitCalculatorContent />
        </main>
      </div>
    </RequireRole>
  );
}

function ProfitCalculatorHeader() {
  const t = useTranslations("profit");
  return (
    <div className="mb-4">
      <h1 className="text-xl font-semibold text-stone-900">{t("title")}</h1>
      <p className="text-sm text-stone-500">{t("subtitle")}</p>
    </div>
  );
}
