import { useEffect, useRef } from "react";
import maplibregl, { type Map as MlMap, type MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useFilters } from "@/lib/map/filters.store";
import { usePins } from "@/lib/map/pins.store";
import { computeAll, type Scores } from "@/lib/map/desirability";

type Props = {
  pinDropMode: boolean;
  drawAvoidMode: boolean;
  onPinDrop: (lng: number, lat: number) => void;
  onRadiusDrop: (lng: number, lat: number) => void;
  radiusDropMode: boolean;
};

// Free, beautiful light style — Maptiler's "basic" demo tiles (no key needed for dev).
// Swap for your own Maptiler/Stadia key for production.
const STYLE_URL =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export function MapView({
  pinDropMode,
  drawAvoidMode,
  radiusDropMode,
  onPinDrop,
  onRadiusDrop,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const scoresRef = useRef<Scores | null>(null);
  const drawCoordsRef = useRef<[number, number][]>([]);
  const filters = useFilters();
  const pins = usePins((s) => s.pins);
  const addAvoid = useFilters((s) => s.addAvoid);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [-0.1278, 51.5074],
      zoom: 10.2,
      minZoom: 9,
      maxZoom: 16,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    map.on("load", async () => {
      const [geojson, scores] = await Promise.all([
        fetch("/data/lsoa-london.geojson").then((r) => r.json()),
        fetch("/data/lsoa-scores.json").then((r) => r.json() as Promise<Scores>),
      ]);
      scoresRef.current = scores;

      // Attach score + passes to each feature so MapLibre expressions can read them
      const computed = computeAll(scores, useFilters.getState());
      for (const f of geojson.features) {
        const c = f.properties.code as string;
        f.properties.score = computed[c]?.score ?? 0;
        f.properties.passes = computed[c]?.passes ? 1 : 0;
      }

      map.addSource("lsoa", { type: "geojson", data: geojson });

      // Heatmap fill (always present, opacity toggled by mode)
      map.addLayer({
        id: "lsoa-heat",
        type: "fill",
        source: "lsoa",
        paint: {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["get", "score"],
            0, "#f5f7fa",
            25, "#e8f0e3",
            50, "#cfe3c0",
            75, "#9ed18a",
            100, "#5fa867",
          ],
          "fill-opacity": 0.55,
        },
      });

      // Filter mask: pale grey over LSOAs that fail
      map.addLayer({
        id: "lsoa-mask",
        type: "fill",
        source: "lsoa",
        paint: {
          "fill-color": "#0f172a",
          "fill-opacity": [
            "case",
            ["==", ["get", "passes"], 0],
            0.55,
            0,
          ],
        },
        layout: { visibility: "none" },
      });

      // Hairline borders
      map.addLayer({
        id: "lsoa-line",
        type: "line",
        source: "lsoa",
        paint: { "line-color": "#94a3b8", "line-width": 0.3, "line-opacity": 0.4 },
      });

      // Hover info
      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });
      map.on("mousemove", "lsoa-heat", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        map.getCanvas().style.cursor = "crosshair";
        popup
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="font:12px system-ui;line-height:1.4">
               <div style="font-weight:600">${f.properties.name}</div>
               <div>Score: <b>${f.properties.score}</b>/100</div>
             </div>`,
          )
          .addTo(map);
      });
      map.on("mouseleave", "lsoa-heat", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });

      // Sources for radius circle, avoid polygons, target marker
      map.addSource("radius", { type: "geojson", data: emptyFC() });
      map.addLayer({
        id: "radius-fill",
        type: "fill",
        source: "radius",
        paint: { "fill-color": "#3b82f6", "fill-opacity": 0.08 },
      });
      map.addLayer({
        id: "radius-line",
        type: "line",
        source: "radius",
        paint: { "line-color": "#3b82f6", "line-width": 1.5, "line-dasharray": [2, 2] },
      });

      map.addSource("avoid", { type: "geojson", data: emptyFC() });
      map.addLayer({
        id: "avoid-fill",
        type: "fill",
        source: "avoid",
        paint: { "fill-color": "#ef4444", "fill-opacity": 0.15 },
      });
      map.addLayer({
        id: "avoid-line",
        type: "line",
        source: "avoid",
        paint: { "line-color": "#ef4444", "line-width": 1.5 },
      });

      map.addSource("draw", { type: "geojson", data: emptyFC() });
      map.addLayer({
        id: "draw-line",
        type: "line",
        source: "draw",
        paint: { "line-color": "#ef4444", "line-width": 2, "line-dasharray": [1, 1] },
      });

      // Trigger initial overlay sync
      window.dispatchEvent(new Event("__lhh_overlays_ready"));
    });

    return () => {
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
      if (!src || !scores) return;
      const data = (src as unknown as { _data: GeoJSON.FeatureCollection })._data;
      if (!data) return;
      const computed = computeAll(scores, filters);
      for (const f of data.features) {
        const c = f.properties!.code as string;
        f.properties!.score = computed[c]?.score ?? 0;
        f.properties!.passes = computed[c]?.passes ? 1 : 0;
      }
      src.setData(data);

      // Mode visibility
      const mode = filters.mode;
      map.setLayoutProperty("lsoa-mask", "visibility", mode === "filter" ? "visible" : "none");
      map.setPaintProperty(
        "lsoa-heat",
        "fill-opacity",
        mode === "heatmap" ? 0.7 : 0.45,
      );

      // Radius circle source
      if (filters.radius) {
        src.setData(data);
        (map.getSource("radius") as maplibregl.GeoJSONSource).setData(
          circleFC(filters.radius.lng, filters.radius.lat, filters.radius.radiusKm),
        );
      } else {
        (map.getSource("radius") as maplibregl.GeoJSONSource).setData(emptyFC());
      }

      // Avoid polygons
      (map.getSource("avoid") as maplibregl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: filters.avoid.map((p) => ({
          type: "Feature",
          properties: {},
          geometry: { type: "Polygon", coordinates: [closeRing(p.coords)] },
        })),
      });
    };
    if (map.isStyleLoaded() && map.getSource("lsoa")) sync();
    else window.addEventListener("__lhh_overlays_ready", sync, { once: true });
  }, [filters]);

  // Click handler for pin drop / radius drop / draw avoid
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handler = (e: MapMouseEvent) => {
      if (pinDropMode) {
        onPinDrop(e.lngLat.lng, e.lngLat.lat);
        return;
      }
      if (radiusDropMode) {
        onRadiusDrop(e.lngLat.lng, e.lngLat.lat);
        return;
      }
      if (drawAvoidMode) {
        drawCoordsRef.current.push([e.lngLat.lng, e.lngLat.lat]);
        const src = map.getSource("draw") as maplibregl.GeoJSONSource | undefined;
        if (src) {
          src.setData({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: { type: "LineString", coordinates: drawCoordsRef.current },
              },
            ],
          });
        }
      }
    };
    map.on("click", handler);
    map.getCanvas().style.cursor =
      pinDropMode || radiusDropMode || drawAvoidMode ? "crosshair" : "";
    return () => {
      map.off("click", handler);
    };
  }, [pinDropMode, radiusDropMode, drawAvoidMode, onPinDrop, onRadiusDrop]);

  // Finish drawing on double-click (commit polygon)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !drawAvoidMode) return;
    const finish = () => {
      const coords = drawCoordsRef.current;
      if (coords.length >= 3) {
        addAvoid({ id: crypto.randomUUID(), coords });
      }
      drawCoordsRef.current = [];
      (map.getSource("draw") as maplibregl.GeoJSONSource | undefined)?.setData(emptyFC());
    };
    map.on("dblclick", finish);
    map.doubleClickZoom.disable();
    return () => {
      map.off("dblclick", finish);
      map.doubleClickZoom.enable();
    };
  }, [drawAvoidMode, addAvoid]);

  // Property pins as DOM markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers: maplibregl.Marker[] = [];
    for (const p of pins) {
      const el = document.createElement("div");
      el.style.cssText =
        "width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#1e293b;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);cursor:pointer";
      el.title = p.label;
      const m = new maplibregl.Marker({ element: el })
        .setLngLat([p.lng, p.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 16 }).setHTML(
            `<div style="font:13px system-ui"><b>${escapeHtml(p.label)}</b>${p.url ? `<br><a href="${escapeAttr(p.url)}" target="_blank" rel="noopener">View listing</a>` : ""}${p.notes ? `<div style="margin-top:4px;color:#475569">${escapeHtml(p.notes)}</div>` : ""}</div>`,
          ),
        )
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
      "width:14px;height:14px;border-radius:50%;background:#0ea5e9;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)";
    const m = new maplibregl.Marker({ element: el })
      .setLngLat(filters.commuteTargetLngLat)
      .setPopup(new maplibregl.Popup({ offset: 12 }).setText(`Commute target: ${filters.commuteTargetPostcode}`))
      .addTo(map);
    return () => { m.remove(); };
  }, [filters.commuteEnabled, filters.commuteTargetLngLat, filters.commuteTargetPostcode]);

  return <div ref={containerRef} className="absolute inset-0" />;
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

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
function escapeAttr(s: string) {
  return escapeHtml(s);
}
