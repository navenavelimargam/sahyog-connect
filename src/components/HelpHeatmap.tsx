// Client-only Leaflet heatmap for NGO dashboard.
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

interface Point {
  lat: number;
  lng: number;
  priority?: string;
  label?: string;
}

interface Volunteer {
  lat: number;
  lng: number;
  name: string;
}

interface Props {
  requests: Point[];
  volunteers?: Volunteer[];
  center?: [number, number];
  zoom?: number;
  height?: number;
}

export function HelpHeatmap({ requests, volunteers = [], center, zoom = 11, height = 320 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    let map: { remove: () => void } | null = null;
    (async () => {
      if (!ref.current) return;
      const L = (await import("leaflet")).default;
      await import("leaflet.heat");
      if (cancelled || !ref.current) return;

      const fallback: [number, number] = center
        ?? (requests[0] ? [requests[0].lat, requests[0].lng] : [20.5937, 78.9629]);

      map = L.map(ref.current).setView(fallback, zoom) as unknown as { remove: () => void };
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map as never);

      // Heat layer weighted by priority
      const weight = (p?: string) =>
        p === "critical" ? 1 : p === "high" ? 0.75 : p === "medium" ? 0.5 : 0.3;
      const heatPoints = requests
        .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng))
        .map((r) => [r.lat, r.lng, weight(r.priority)] as [number, number, number]);

      if (heatPoints.length > 0) {
        // @ts-expect-error - leaflet.heat extends L at runtime
        L.heatLayer(heatPoints, {
          radius: 35,
          blur: 25,
          maxZoom: 17,
          gradient: { 0.2: "#3b82f6", 0.4: "#f59e0b", 0.7: "#f97316", 1.0: "#dc2626" },
        }).addTo(map as never);
      }

      // Request markers
      requests.forEach((r) => {
        if (!Number.isFinite(r.lat) || !Number.isFinite(r.lng)) return;
        const color =
          r.priority === "critical" ? "#dc2626"
          : r.priority === "high" ? "#f97316"
          : r.priority === "medium" ? "#f59e0b"
          : "#22c55e";
        L.circleMarker([r.lat, r.lng], {
          radius: 7,
          color,
          fillColor: color,
          fillOpacity: 0.85,
          weight: 2,
        })
          .bindPopup(`<b>${r.label ?? "Help request"}</b><br/>Priority: ${r.priority ?? "—"}`)
          .addTo(map as never);
      });

      // Volunteer markers
      volunteers.forEach((v) => {
        if (!Number.isFinite(v.lat) || !Number.isFinite(v.lng)) return;
        L.circleMarker([v.lat, v.lng], {
          radius: 6,
          color: "#0ea5e9",
          fillColor: "#0ea5e9",
          fillOpacity: 0.9,
          weight: 2,
        })
          .bindPopup(`🙋 ${v.name}`)
          .addTo(map as never);
      });

      // Fit bounds if we have points
      const all = [
        ...requests.filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng)).map((r) => [r.lat, r.lng] as [number, number]),
        ...volunteers.filter((v) => Number.isFinite(v.lat) && Number.isFinite(v.lng)).map((v) => [v.lat, v.lng] as [number, number]),
      ];
      if (all.length > 1) {
        // @ts-expect-error - L.latLngBounds typing
        (map as never).fitBounds(L.latLngBounds(all).pad(0.2));
      }
    })();

    return () => {
      cancelled = true;
      if (map) map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(requests), JSON.stringify(volunteers)]);

  return <div ref={ref} style={{ height, width: "100%" }} className="rounded-2xl overflow-hidden border border-border" />;
}
