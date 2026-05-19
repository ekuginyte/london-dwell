import type { FiltersState } from "./filters.store";
import { STATIONS, type Station } from "./stations";

export type LsoaScore = {
  c: [number, number]; // centroid [lng,lat]
  safety: number; // 0..1, higher = safer (PLACEHOLDER — replace with data.police.uk)
  schools: number; // 0..1, higher = better Ofsted (PLACEHOLDER — replace with GIAS+Ofsted)
};

export type Scores = Record<string, LsoaScore>;

// Haversine distance in metres
function distM(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// --- Station-anchored commute estimator (no API key) ---
// For any point, find the nearest rail/tube station, walk to it (5 km/h),
// then estimate the on-train leg from each station's "time from Zone 1"
// using the heuristic from London Isochrone:
//   transit ≈ min(timeA + timeB,  geo_km_between_stations * 2.0 + 5)
// plus a small interchange penalty when both legs are non-zero.
const WALK_MIN_PER_KM = 12;     // ~5 km/h
const STATION_MAX_WALK_KM = 6;  // cap walking leg, beyond this we drive to the station (slower)
const DRIVE_MIN_PER_KM = 2.5;

function nearestStation(pt: [number, number]): { s: Station; km: number } {
  let best: Station = STATIONS[0];
  let bestKm = Infinity;
  for (const s of STATIONS) {
    const km = distM(pt, [s.lng, s.lat]) / 1000;
    if (km < bestKm) { bestKm = km; best = s; }
  }
  return { s: best, km: bestKm };
}

function accessMinutes(km: number): number {
  if (km <= STATION_MAX_WALK_KM) return km * WALK_MIN_PER_KM;
  // long access leg: drive/bus
  return STATION_MAX_WALK_KM * WALK_MIN_PER_KM +
         (km - STATION_MAX_WALK_KM) * DRIVE_MIN_PER_KM;
}

export function estimateCommuteMinutes(
  from: [number, number],
  to: [number, number],
): number {
  const a = nearestStation(from);
  const b = nearestStation(to);

  const accessA = accessMinutes(a.km);
  const accessB = accessMinutes(b.km);

  let transit: number;
  if (a.s.id === b.s.id) {
    transit = 0;
  } else {
    const stationKm = distM([a.s.lng, a.s.lat], [b.s.lng, b.s.lat]) / 1000;
    const viaCentre = a.s.timeFromCentre + b.s.timeFromCentre;
    const direct = stationKm * 2.0 + 5;
    transit = Math.min(viaCentre, direct);
    // Interchange / waiting buffer when actually riding
    transit += 4;
  }

  return accessA + transit + accessB;
}

// Ray-casting point-in-polygon (single ring, lng/lat)
export function pointInPolygon(pt: [number, number], ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > pt[1] !== yj > pt[1] &&
      pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export type ComputedRow = {
  passes: boolean;
  score: number; // 0..100
};

export function computeAll(
  scores: Scores,
  filters: FiltersState,
): Record<string, ComputedRow> {
  const out: Record<string, ComputedRow> = {};
  const target = filters.commuteTargetLngLat;

  for (const code in scores) {
    const s = scores[code];
    const c = s.c;

    // Per-criterion subscore 0..1 (1 = ideal)
    const commuteMin = target ? estimateCommuteMinutes(c, target) : 0;
    const commuteSub = target
      ? Math.max(0, Math.min(1, 1 - commuteMin / 90))
      : 0.5;

    const schoolsSub = s.schools;
    const safetySub = s.safety;

    // Parks: PLACEHOLDER — proxy via safety+schools blend until real OSM parks layer.
    // (Real version: nearest-park distance from public/data/parks.geojson.)
    const parksSub = (s.schools + s.safety) / 2;

    // Radius: 1 if inside, falls off outside
    let radiusSub = 1;
    if (filters.radius) {
      const d = distM(c, [filters.radius.lng, filters.radius.lat]) / 1000;
      radiusSub = d <= filters.radius.radiusKm ? 1 : 0;
    }

    // Avoid: 0 if inside any avoid polygon
    let avoidOk = true;
    for (const poly of filters.avoid) {
      if (pointInPolygon(c, poly.coords)) {
        avoidOk = false;
        break;
      }
    }

    // ---- Filter mode (boolean pass/fail) ----
    let passes = true;
    if (filters.commuteEnabled && target && commuteMin > filters.commuteMaxMinutes) passes = false;
    if (filters.schoolsEnabled && schoolsSub < filters.schoolsMin) passes = false;
    if (filters.parksEnabled && parksSub < 0.5) passes = false;
    if (filters.radius && radiusSub < 1) passes = false;
    if (!avoidOk) passes = false;

    // ---- Heatmap score 0..100 (weighted blend, normalised) ----
    const wSum =
      filters.wCommute + filters.wSchools + filters.wParks + filters.wSafety || 1;
    let score =
      (filters.wCommute * commuteSub +
        filters.wSchools * schoolsSub +
        filters.wParks * parksSub +
        filters.wSafety * safetySub) /
      wSum;
    score *= radiusSub;
    if (!avoidOk) score = 0;

    out[code] = { passes, score: Math.round(score * 100) };
  }

  return out;
}
