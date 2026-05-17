import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapView } from "@/components/map/MapView";
import { FilterSidebar } from "@/components/map/FilterSidebar";
import { PinDropDialog } from "@/components/map/PinDropDialog";
import { usePins } from "@/lib/map/pins.store";
import { useFilters } from "@/lib/map/filters.store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "London House Map — Find Your Best Neighbourhood" },
      {
        name: "description",
        content:
          "Overlay commute time, schools, parks and custom filters on a map of London to discover the most desirable areas to live.",
      },
      { property: "og:title", content: "London House Map" },
      {
        property: "og:description",
        content: "Layered London map for house-hunters: commute, schools, parks, custom radius and avoid zones.",
      },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const hydrate = usePins((s) => s.hydrate);
  const setRadius = useFilters((s) => s.setRadius);
  const setCommuteTarget = useFilters((s) => s.set);
  const [pinDropMode, setPinDropMode] = useState(false);
  const [radiusDropMode, setRadiusDropMode] = useState(false);
  const [drawAvoidMode, setDrawAvoidMode] = useState(false);
  const [pendingPin, setPendingPin] = useState<[number, number] | null>(null);
  const addPin = usePins((s) => s.add);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <FilterSidebar
        pinDropMode={pinDropMode}
        setPinDropMode={(v) => {
          setPinDropMode(v);
          if (v) {
            setRadiusDropMode(false);
            setDrawAvoidMode(false);
          }
        }}
        radiusDropMode={radiusDropMode}
        setRadiusDropMode={(v) => {
          setRadiusDropMode(v);
          if (v) {
            setPinDropMode(false);
            setDrawAvoidMode(false);
          }
        }}
        drawAvoidMode={drawAvoidMode}
        setDrawAvoidMode={(v) => {
          setDrawAvoidMode(v);
          if (v) {
            setPinDropMode(false);
            setRadiusDropMode(false);
          }
        }}
      />
      <main className="relative flex-1">
        <MapView
          pinDropMode={pinDropMode}
          drawAvoidMode={drawAvoidMode}
          radiusDropMode={radiusDropMode}
          onPinDrop={(lng, lat) => {
            setPendingPin([lng, lat]);
            setPinDropMode(false);
          }}
          onRadiusDrop={(lng, lat) => {
            setRadius({ lng, lat, radiusKm: 3 });
            setRadiusDropMode(false);
          }}
        />
      </main>
      <PinDropDialog
        open={!!pendingPin}
        lngLat={pendingPin}
        onClose={() => setPendingPin(null)}
        onSubmit={(data) => {
          if (pendingPin) addPin({ lng: pendingPin[0], lat: pendingPin[1], ...data });
          setPendingPin(null);
        }}
      />
    </div>
  );
}
