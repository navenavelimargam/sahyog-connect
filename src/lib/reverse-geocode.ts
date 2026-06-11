// Nominatim reverse-geocoding (OpenStreetMap) — free, no API key.
// Returns a clean human-readable label like "Dharavi, Mumbai".

export interface PlaceLabel {
  label: string;        // Best display label
  city: string | null;  // City / town / village
  area: string | null;  // Neighborhood / suburb
}

interface NominatimResponse {
  address?: Record<string, string>;
  display_name?: string;
}

export async function reverseGeocode(lat: number, lng: number): Promise<PlaceLabel> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=14&accept-language=en`;
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(`Nominatim ${r.status}`);
    const j = (await r.json()) as NominatimResponse;
    const a = j.address ?? {};
    const area =
      a.neighbourhood || a.suburb || a.village || a.hamlet || a.locality || null;
    const city =
      a.city || a.town || a.municipality || a.state_district || a.county || a.state || null;
    const label = [area, city].filter(Boolean).join(", ") || j.display_name || `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
    return { label, city, area };
  } catch {
    return { label: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, city: null, area: null };
  }
}
