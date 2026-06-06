// Browser geolocation helpers (zero manual input).

export interface Coords {
  lat: number;
  lng: number;
  accuracy?: number;
}

export function getCurrentPosition(opts: PositionOptions = {}): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation not supported by this browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => reject(new Error(err.message || "Unable to detect location")),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000, ...opts },
    );
  });
}

export function watchPosition(
  cb: (c: Coords) => void,
  onError?: (e: Error) => void,
): number | null {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return navigator.geolocation.watchPosition(
    (pos) => cb({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
    (err) => onError?.(new Error(err.message)),
    { enableHighAccuracy: true, maximumAge: 25000, timeout: 30000 },
  );
}

export function clearWatch(id: number | null) {
  if (id != null && typeof navigator !== "undefined" && navigator.geolocation) {
    navigator.geolocation.clearWatch(id);
  }
}

export function formatCoords(c: Coords | null): string {
  if (!c) return "";
  return `GPS ${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`;
}

// Haversine distance in km.
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
