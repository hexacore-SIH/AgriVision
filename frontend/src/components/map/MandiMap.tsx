"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslations } from "next-intl";

// Leaflet's default marker images are referenced as relative paths that
// don't resolve once bundled -- point them at the same CDN copies leaflet
// itself ships, rather than shipping the PNGs ourselves.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const FALLBACK_CENTER: [number, number] = [19.75, 75.71]; // Maharashtra, roughly

export interface MapMandi {
  id: string;
  name: string;
  district: string | null;
  state: string;
  latitude: number | null;
  longitude: number | null;
  distanceKm?: number | null;
  isActive?: boolean;
}

function Recenter({ center }: { center: [number, number] }) {
  // react-leaflet doesn't re-center an existing map on prop change by
  // itself; nudge it via the map instance once we know the real center.
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1]]);
  return null;
}

export function MandiMap({
  mandis,
  userLocation,
  selectedMandiId,
  onSelectMandi,
  height = 380,
}: {
  mandis: MapMandi[];
  userLocation?: { lat: number; lng: number } | null;
  selectedMandiId?: string;
  onSelectMandi?: (id: string) => void;
  height?: number;
}) {
  const t = useTranslations("map");

  const located = useMemo(() => mandis.filter((m) => m.latitude !== null && m.longitude !== null), [mandis]);

  const center: [number, number] = useMemo(() => {
    if (userLocation) return [userLocation.lat, userLocation.lng];
    if (located.length > 0) {
      return [
        located.reduce((sum, m) => sum + (m.latitude ?? 0), 0) / located.length,
        located.reduce((sum, m) => sum + (m.longitude ?? 0), 0) / located.length,
      ];
    }
    return FALLBACK_CENTER;
  }, [userLocation, located]);

  return (
    <MapContainer
      center={center}
      zoom={userLocation ? 9 : 7}
      style={{ height, width: "100%", borderRadius: 12 }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} />

      {userLocation && (
        <CircleMarker
          center={[userLocation.lat, userLocation.lng]}
          radius={9}
          pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.9 }}
        >
          <Popup>{t("you")}</Popup>
        </CircleMarker>
      )}

      {located.map((mandi) => (
        <Marker
          key={mandi.id}
          position={[mandi.latitude as number, mandi.longitude as number]}
          eventHandlers={onSelectMandi ? { click: () => onSelectMandi(mandi.id) } : undefined}
          opacity={selectedMandiId && selectedMandiId !== mandi.id ? 0.6 : 1}
        >
          <Popup>
            <strong>{mandi.name}</strong>
            <br />
            {mandi.district ? `${mandi.district}, ` : ""}
            {mandi.state}
            {typeof mandi.distanceKm === "number" && (
              <>
                <br />
                {t("distanceAway", { km: mandi.distanceKm })}
              </>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
