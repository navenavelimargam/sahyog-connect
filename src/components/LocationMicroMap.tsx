import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  lat: number;
  lng: number;
  height?: number;
  label?: string;
}

// Pulsing red marker on a clean Leaflet/OSM tile.
export function LocationMicroMap({ lat, lng, height = 180, label }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (!mapRef.current) {
      mapRef.current = L.map(ref.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
      }).setView([lat, lng], 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(mapRef.current);

      const icon = L.divIcon({
        className: "",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        html: `
          <span style="position:relative;display:block;width:24px;height:24px;">
            <span style="position:absolute;inset:0;border-radius:9999px;background:rgba(239,68,68,0.35);animation:lmm-pulse 1.6s ease-out infinite;"></span>
            <span style="position:absolute;top:6px;left:6px;width:12px;height:12px;border-radius:9999px;background:#ef4444;border:2px solid #fff;box-shadow:0 0 6px rgba(239,68,68,0.8);"></span>
          </span>
          <style>@keyframes lmm-pulse{0%{transform:scale(.6);opacity:.9}100%{transform:scale(2.6);opacity:0}}</style>
        `,
      });
      L.marker([lat, lng], { icon }).addTo(mapRef.current);
    } else {
      mapRef.current.setView([lat, lng], 15);
    }
  }, [lat, lng]);

  useEffect(() => () => { mapRef.current?.remove(); mapRef.current = null; }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border shadow-card">
      <div ref={ref} style={{ height }} className="w-full" aria-label="location-map" />
      {label && (
        <div className="absolute bottom-2 left-2 right-2 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur">
          📍 {label}
        </div>
      )}
    </div>
  );
}
