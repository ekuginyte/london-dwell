import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MlMap, type MapMouseEvent } from "maplibre-gl";
import { useFilters } from "@/lib/map/filters.store";
import { usePins, type Pin } from "@/lib/map/pins.store";
import { computeAll, type Scores } from "@/lib/map/desirability";
import { COMMUTER_TOWNS } from "@/lib/map/commuter-towns";
import { ListingHoverPreview } from "./ListingHoverPreview";

type Props = {
  pinDropMode: boolean;
  drawAvoidMode: boolean;
  onPinDrop: (lng: number, lat: number) => void;
  onRadiusDrop: (lng: number, lat: number) => void;
  radiusDropMode: boolean;
};

// CartoCDN Positron — soft, friendly light tiles. Free, no key.
const STYLE_URL = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

type HoverState = { pin: Pin; x: number; y: number } | null;

export function MapView({
  pinDropMode,
  drawAvoidMode,
  radiusDropMode,
  onPinDrop,
  onRadiusDrop,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const geojsonRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const scoresRef = useRef<Scores | null>(null);
  const drawCoordsRef = useRef<[number, number][]>([]);
  const filters = useFilters();
  const pins = usePins((s) => s.pins);
  const addAvoid = useFilters((s) => s.addAvoid);
  const [hover, setHover] = useState<HoverState>(null);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [-0.1278, 51.5074],
      zoom: 9.6,
      minZoom: 7.5,
      maxZoom: 16,
      // Wider bounds so users can pan to commuter towns (St Albans, Brighton, etc.)
      maxBounds: [
        [-2.2, 50.5],
        [1.6, 52.6],
      ],
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    // Container can be 0×0 for an instant during hydration; nudge maplibre once
    // the real layout settles, and again on any container resize.
    const nudge = () => map.resize();
    requestAnimationFrame(nudge);
    setTimeout(nudge, 250);
    const ro = new ResizeObserver(nudge);
    ro.observe(containerRef.current);

    map.on("load", async () => {
      let geojson: GeoJSON.FeatureCollection;
      let scores: Scores;
      try {
        [geojson, scores] = await Promise.all([
          fetch("/data/lsoa-london.geojson").then((r) => r.json()),
          fetch("/data/lsoa-scores.json").then((r) => r.json() as Promise<Scores>),
        ]);
      } catch (e) {
        console.error("Failed to load map data", e);
        return;
      }
      if (!geojson?.features) return;
      geojsonRef.current = geojson;
      scoresRef.current = scores;

      const computed = computeAll(scores, useFilters.getState());
      for (const f of geojson.features) {
        const c = f.properties!.code as string;
        f.properties!.score = computed[c]?.score ?? 0;
        f.properties!.passes = computed[c]?.passes ? 1 : 0;
      }

      map.addSource("lsoa", { type: "geojson", data: geojson });

      // Soft, Coinbase-cosy gradient (warm cream → mint → friendly green)
      map.addLayer({
        id: "lsoa-heat",
        type: "fill",
        source: "lsoa",
        paint: {
          "fill-color": [
            "interpolate", ["linear"], ["get", "score"],
            0, "#fdf7ee",
            25, "#f0ead6",
            50, "#d8ebcf",
            75, "#9fd4a6",
            100, "#3fb47a",
          ],
          "fill-opacity": 0.6,
        },
      });
      map.addLayer({
        id: "lsoa-mask",
        type: "fill",
        source: "lsoa",
        paint: {
          "fill-color": "#0b1430",
          "fill-opacity": ["case", ["==", ["get", "passes"], 0], 0.5, 0],
        },
        layout: { visibility: "none" },
      });
      map.addLayer({
        id: "lsoa-line",
        type: "line",
        source: "lsoa",
        paint: { "line-color": "#94a3b8", "line-width": 0.3, "line-opacity": 0.35 },
      });

      // LSOA hover info popup
      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: "lhh-popup",
      });
      map.on("mousemove", "lsoa-heat", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        map.getCanvas().style.cursor = "crosshair";
        popup
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="font:12px -apple-system,system-ui;padding:4px 2px;line-height:1.45">
               <div style="font-weight:600;color:#0b1430">${f.properties!.name}</div>
               <div style="color:#475569">Score <b style="color:#0852ff">${f.properties!.score}</b>/100</div>
             </div>`,
          )
          .addTo(map);
      });
      map.on("mouseleave", "lsoa-heat", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });

      // Radius / avoid / draw sources
      for (const id of ["radius", "avoid", "draw"]) {
        map.addSource(id, { type: "geojson", data: emptyFC() });
      }
      map.addLayer({
        id: "radius-fill", type: "fill", source: "radius",
        paint: { "fill-color": "#0852ff", "fill-opacity": 0.08 },
      });
      map.addLayer({
        id: "radius-line", type: "line", source: "radius",
        paint: { "line-color": "#0852ff", "line-width": 1.5, "line-dasharray": [2, 2] },
      });
      map.addLayer({
        id: "avoid-fill", type: "fill", source: "avoid",
        paint: { "fill-color": "#ef4444", "fill-opacity": 0.15 },
      });
      map.addLayer({
        id: "avoid-line", type: "line", source: "avoid",
        paint: { "line-color": "#ef4444", "line-width": 1.5 },
      });
      map.addLayer({
        id: "draw-line", type: "line", source: "draw",
        paint: { "line-color": "#ef4444", "line-width": 2, "line-dasharray": [1, 1] },
      });

      // Commuter town markers (always visible — outside the LSOA layer)
      for (const t of COMMUTER_TOWNS) {
        const el = document.createElement("div");
        el.style.cssText =
          "display:flex;align-items:center;gap:6px;padding:4px 9px 4px 6px;background:white;border-radius:999px;box-shadow:0 2px 6px rgba(8,20,48,.12);border:1px solid rgba(8,20,48,.08);font:600 11px -apple-system,system-ui;color:#0b1430;cursor:pointer;white-space:nowrap";
        el.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f59e0b"></span>${t.name} · ${t.trainMinsToLondon}min`;
        el.title = `${t.name} — ~${t.trainMinsToLondon} min to central London by train`;
        el.addEventListener("click", () => {
          map.flyTo({ center: [t.lng, t.lat], zoom: 12, duration: 900 });
        });
        new maplibregl.Marker({ element: el, anchor: "left" })
          .setLngLat([t.lng, t.lat])
          .addTo(map);
      }

      window.dispatchEvent(new Event("__lhh_overlays_ready"));
    });

    const flyHandler = (e: Event) => {
      const t = (e as CustomEvent).detail as { lng: number; lat: number };
      if (t && typeof t.lng === "number") {
        map.flyTo({ center: [t.lng, t.lat], zoom: 12, duration: 900 });
      }
    };
    window.addEventListener("__lhh_fly", flyHandler);

    return () => {
      window.removeEventListener("__lhh_fly", flyHandler);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Recompute on every filter change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const sync = () => {
      const src = map.getSource("lsoa") as maplibregl.GeoJSONSource | undefined;
      const scores = scoresRef.current;
      const data = geojsonRef.current;
      if (!src || !scores || !data) return;
      const computed = computeAll(scores, filters);
      for (const f of data.features) {
        const c = f.properties!.code as string;
        f.properties!.score = computed[c]?.score ?? 0;
        f.properties!.passes = computed[c]?.passes ? 1 : 0;
      }
      src.setData(data);

      const mode = filters.mode;
      map.setLayoutProperty("lsoa-mask", "visibility", mode === "filter" ? "visible" : "none");
      map.setPaintProperty("lsoa-heat", "fill-opacity", mode === "heatmap" ? 0.72 : 0.5);

      if (filters.radius) {
        (map.getSource("radius") as maplibregl.GeoJSONSource).setData(
          circleFC(filters.radius.lng, filters.radius.lat, filters.radius.radiusKm),
        );
      } else {
        (map.getSource("radius") as maplibregl.GeoJSONSource).setData(emptyFC());
      }

      (map.getSource("avoid") as maplibregl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: filters.avoid.map((p) => ({
          type: "Feature", properties: {},
          geometry: { type: "Polygon", coordinates: [closeRing(p.coords)] },
        })),
      });
    };
    if (map.isStyleLoaded() && map.getSource("lsoa")) sync();
    else window.addEventListener("__lhh_overlays_ready", sync, { once: true });
  }, [filters]);

  // Click handlers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handler = (e: MapMouseEvent) => {
      if (pinDropMode) return onPinDrop(e.lngLat.lng, e.lngLat.lat);
      if (radiusDropMode) return onRadiusDrop(e.lngLat.lng, e.lngLat.lat);
      if (drawAvoidMode) {
        drawCoordsRef.current.push([e.lngLat.lng, e.lngLat.lat]);
        (map.getSource("draw") as maplibregl.GeoJSONSource | undefined)?.setData({
          type: "FeatureCollection",
          features: [{
            type: "Feature", properties: {},
            geometry: { type: "LineString", coordinates: drawCoordsRef.current },
          }],
        });
      }
    };
    map.on("click", handler);
    map.getCanvas().style.cursor = pinDropMode || radiusDropMode || drawAvoidMode ? "crosshair" : "";
    return () => { map.off("click", handler); };
  }, [pinDropMode, radiusDropMode, drawAvoidMode, onPinDrop, onRadiusDrop]);

  // Finish draw on dblclick
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !drawAvoidMode) return;
    const finish = () => {
      const coords = drawCoordsRef.current;
      if (coords.length >= 3) addAvoid({ id: crypto.randomUUID(), coords });
      drawCoordsRef.current = [];
      (map.getSource("draw") as maplibregl.GeoJSONSource | undefined)?.setData(emptyFC());
    };
    map.on("dblclick", finish);
    map.doubleClickZoom.disable();
    return () => { map.off("dblclick", finish); map.doubleClickZoom.enable(); };
  }, [drawAvoidMode, addAvoid]);

  // Property pins with rich hover preview
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers: maplibregl.Marker[] = [];
    for (const p of pins) {
      const el = document.createElement("div");
      el.style.cssText =
        "width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:linear-gradient(135deg,#0852ff,#3b82f6);border:2px solid white;box-shadow:0 3px 10px rgba(8,82,255,.35);cursor:pointer;transition:transform .15s";
      el.addEventListener("mouseenter", () => {
        el.style.transform = "rotate(-45deg) scale(1.15)";
        const pt = map.project([p.lng, p.lat]);
        setHover({ pin: p, x: pt.x, y: pt.y });
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "rotate(-45deg)";
        // small delay so user can move into the floating card
        setTimeout(() => {
          setHover((h) => (h?.pin.id === p.id ? null : h));
        }, 120);
      });
      const m = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([p.lng, p.lat])
        .addTo(map);
      markers.push(m);
    }
    return () => markers.forEach((m) => m.remove());
  }, [pins]);

  // Commute target marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!filters.commuteEnabled || !filters.commuteTargetLngLat) return undefined;
    const el = document.createElement("div");
    el.style.cssText =
      "width:16px;height:16px;border-radius:50%;background:#f59e0b;border:3px solid white;box-shadow:0 2px 8px rgba(245,158,11,.45)";
    const m = new maplibregl.Marker({ element: el })
      .setLngLat(filters.commuteTargetLngLat)
      .setPopup(new maplibregl.Popup({ offset: 12 }).setText(`Work: ${filters.commuteTargetPostcode}`))
      .addTo(map);
    return () => { m.remove(); };
  }, [filters.commuteEnabled, filters.commuteTargetLngLat, filters.commuteTargetPostcode]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {hover && (
        <div
          className="absolute z-30 pointer-events-auto"
          style={{
            left: hover.x,
            top: hover.y - 12,
            transform: "translate(-50%, -100%)",
          }}
          onMouseEnter={() => setHover(hover)}
          onMouseLeave={() => setHover(null)}
        >
          <div className="rounded-2xl bg-card border border-border shadow-xl p-1">
            <div className="px-3 pt-2 pb-1 font-semibold text-sm">{hover.pin.label}</div>
            {hover.pin.url ? (
              <ListingHoverPreview url={hover.pin.url} />
            ) : (
              <div className="px-3 pb-3 text-xs text-muted-foreground w-[260px]">
                {hover.pin.notes || "No listing URL added."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function emptyFC(): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}

function closeRing(coords: [number, number][]): [number, number][] {
  if (coords.length === 0) return coords;
  const [a, b] = coords[0];
  const [x, y] = coords[coords.length - 1];
  return a === x && b === y ? coords : [...coords, [a, b]];
}

function circleFC(lng: number, lat: number, radiusKm: number): GeoJSON.FeatureCollection {
  const points = 64;
  const coords: [number, number][] = [];
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= points; i++) {
    const a = (i / points) * 2 * Math.PI;
    coords.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  return {
    type: "FeatureCollection",
    features: [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [coords] } }],
  };
}
