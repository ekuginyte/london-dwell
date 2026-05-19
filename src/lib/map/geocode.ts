// Free, no-key UK postcode geocoder via postcodes.io.
// Docs: https://postcodes.io/ — fully open, generous rate limits, CORS enabled.

export type GeocodeResult = {
  lng: number;
  lat: number;
  postcode: string;
  area: string; // e.g. "Hackney" or "St Albans"
};

const cache = new Map<string, GeocodeResult | null>();

export async function geocodePostcode(raw: string): Promise<GeocodeResult | null> {
  const pc = raw.trim().toUpperCase();
  if (!pc) return null;
  if (cache.has(pc)) return cache.get(pc) ?? null;

  try {
    const r = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`);
    if (!r.ok) {
      // Try outward-code only (e.g. "EC2A") as a fallback.
      const outward = pc.split(" ")[0];
      const r2 = await fetch(`https://api.postcodes.io/outcodes/${encodeURIComponent(outward)}`);
      if (!r2.ok) { cache.set(pc, null); return null; }
      const j2 = await r2.json();
      const res: GeocodeResult = {
        lng: j2.result.longitude,
        lat: j2.result.latitude,
        postcode: outward,
        area: j2.result.admin_district?.[0] ?? outward,
      };
      cache.set(pc, res);
      return res;
    }
    const j = await r.json();
    const res: GeocodeResult = {
      lng: j.result.longitude,
      lat: j.result.latitude,
      postcode: j.result.postcode,
      area: j.result.admin_district ?? j.result.parish ?? "",
    };
    cache.set(pc, res);
    return res;
  } catch {
    cache.set(pc, null);
    return null;
  }
}

export function safeHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
