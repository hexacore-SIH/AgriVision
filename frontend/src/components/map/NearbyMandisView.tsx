"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
  ThemeProvider,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { useTranslations } from "next-intl";
import type { Locale, NearbyMandi } from "@agrivision/shared-types";
import { MandiMap } from "./MandiMapLoader";
import { apiJson } from "@/lib/apiClient";
import { useGeolocation } from "@/lib/useGeolocation";
import { useAppLocale } from "@/lib/LocaleContext";
import { cropLabel } from "@/lib/cropName";
import { muiTheme } from "@/lib/muiTheme";

interface MandiCropRow {
  cropId: string;
  cropSlug: string;
  localNames: Record<string, string>;
  unit: string;
  currentPrice: number | null;
}

export function NearbyMandisView() {
  const t = useTranslations("map");
  const tu = useTranslations("units");
  const { locale } = useAppLocale();
  const geo = useGeolocation();

  const [mandis, setMandis] = useState<NearbyMandi[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prices, setPrices] = useState<MandiCropRow[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);

  useEffect(() => {
    if (geo.status === "granted" && geo.location) {
      apiJson<NearbyMandi[]>(`/mandis/nearest?lat=${geo.location.lat}&lng=${geo.location.lng}&limit=10`)
        .then(setMandis)
        .catch(() => undefined);
    } else if (geo.status === "denied" || geo.status === "unsupported") {
      apiJson<NearbyMandi[]>("/mandis")
        .then((data) => setMandis(data.map((m) => ({ ...m, distanceKm: null }))))
        .catch(() => undefined);
    }
  }, [geo.status, geo.location]);

  useEffect(() => {
    if (!selectedId) return;
    // Flagging the loading state before the fetch starts is the point of
    // this effect, not a side effect of it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPricesLoading(true);
    apiJson<MandiCropRow[]>(`/mandi-crops?mandiId=${selectedId}`)
      .then(setPrices)
      .catch(() => setPrices([]))
      .finally(() => setPricesLoading(false));
  }, [selectedId]);

  const selectedMandi = mandis.find((m) => m.id === selectedId) ?? null;

  return (
    <ThemeProvider theme={muiTheme}>
      <Stack spacing={2}>
        {geo.status === "locating" && (
          <Typography variant="body2" color="text.secondary">
            {t("locating")}
          </Typography>
        )}
        {geo.status === "denied" && (
          <Typography variant="body2" color="text.secondary">
            {t("locationDenied")}
          </Typography>
        )}

        <Card variant="outlined">
          <MandiMap
            mandis={mandis}
            userLocation={geo.location}
            selectedMandiId={selectedId ?? undefined}
            onSelectMandi={setSelectedId}
          />
        </Card>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Stack spacing={1.5} flex={1}>
            {mandis.map((mandi) => (
              <Card
                key={mandi.id}
                variant="outlined"
                sx={{ borderColor: selectedId === mandi.id ? "primary.main" : undefined }}
              >
                <CardActionArea onClick={() => setSelectedId(mandi.id)}>
                  <CardContent
                    sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                  >
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {mandi.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {mandi.district ? `${mandi.district}, ` : ""}
                        {mandi.state}
                      </Typography>
                    </Box>
                    {typeof mandi.distanceKm === "number" && (
                      <Chip
                        icon={<LocationOnIcon />}
                        label={t("distanceAway", { km: mandi.distanceKm })}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Stack>

          {selectedMandi && (
            <Card variant="outlined" sx={{ flex: 1, minWidth: 0 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  {selectedMandi.name}
                </Typography>
                {pricesLoading ? (
                  <Typography variant="body2" color="text.secondary">
                    …
                  </Typography>
                ) : prices.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t("noPricesYet")}
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableBody>
                      {prices.map((row) => (
                        <TableRow key={row.cropId}>
                          <TableCell>{cropLabel(row.localNames, locale as Locale, row.cropSlug)}</TableCell>
                          <TableCell align="right">
                            {row.currentPrice !== null ? (
                              <Typography component="span" fontWeight={600} color="text.primary">
                                {`₹${row.currentPrice} `}
                                <Typography component="span" variant="body2" color="text.secondary">
                                  {`/ ${tu(row.unit)}`}
                                </Typography>
                              </Typography>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </Stack>
      </Stack>
    </ThemeProvider>
  );
}
