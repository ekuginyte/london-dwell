import type { FiltersState } from "./filters.store";

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

// Commute estimator without TfL: distance + radial-to-centre boost.
// Tube/rail averages ~25 km/h door-to-door (~2.4 min/km). Trips that run
// roughly along a London radial (origin & destination both reasonably aligned
// with central London) get a small speed-up to reflect direct tube/rail lines;
// trips that need an awkward cross-town hop get a small penalty.
const LONDON_CENTRE: [number, number] = [-0.1278, 51.5074];
export function estimateCommuteMinutes(
  from: [number, number],
  to: [number, number],
): number {
  const km = distM(from, to) / 1000;
  // Angle between (centre→from) and (centre→to) — small angle = aligned radial.
  const v1 = [from[0] - LONDON_CENTRE[0], from[1] - LONDON_CENTRE[1]];
  const v2 = [to[0] - LONDON_CENTRE[0], to[1] - LONDON_CENTRE[1]];
  const n1 = Math.hypot(v1[0], v1[1]) || 1e-9;
  const n2 = Math.hypot(v2[0], v2[1]) || 1e-9;
  const cos = (v1[0] * v2[0] + v1[1] * v2[1]) / (n1 * n2);
  const angleFactor = 1 - 0.25 * Math.max(0, cos); // up to -25% for aligned trips
  return km * 2.4 * angleFactor + 6; // +6 min fixed walk/wait overhead
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
