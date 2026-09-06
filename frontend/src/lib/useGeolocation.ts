"use client";

import { useEffect, useState } from "react";

export interface GeoState {
  location: { lat: number; lng: number } | null;
  status: "idle" | "locating" | "granted" | "denied" | "unsupported";
}

export function useGeolocation(): GeoState {
  const [state, setState] = useState<GeoState>({ location: null, status: "idle" });

  useEffect(() => {
    // Kicking off a browser geolocation request is exactly the kind of
    // external-system synchronization effects are for; the "locating"/
    // "unsupported" status update has to happen here; navigator.geolocation
    // is unavailable during SSR so it can't be a lazy useState initializer.
    if (!("geolocation" in navigator)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ location: null, status: "unsupported" });
      return;
    }

    setState({ location: null, status: "locating" });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          location: { lat: position.coords.latitude, lng: position.coords.longitude },
          status: "granted",
        });
      },
      () => {
        setState({ location: null, status: "denied" });
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  return state;
}
