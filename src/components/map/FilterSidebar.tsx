import { useFilters } from "@/lib/map/filters.store";
import { usePins } from "@/lib/map/pins.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { MapPin, Trash2, Pencil, Crosshair } from "lucide-react";

type Props = {
  pinDropMode: boolean;
  setPinDropMode: (v: boolean) => void;
  radiusDropMode: boolean;
  setRadiusDropMode: (v: boolean) => void;
  drawAvoidMode: boolean;
  setDrawAvoidMode: (v: boolean) => void;
};

export function FilterSidebar({
  pinDropMode,
  setPinDropMode,
  radiusDropMode,
  setRadiusDropMode,
  drawAvoidMode,
  setDrawAvoidMode,
}: Props) {
  const f = useFilters();
  const pins = usePins((s) => s.pins);
  const removePin = usePins((s) => s.remove);

  return (
    <aside className="w-[340px] shrink-0 h-full overflow-y-auto border-r border-border bg-card/95 backdrop-blur px-5 py-5 space-y-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">London Map</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Layer filters to reveal desirable areas
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-md border border-border p-0.5 bg-muted/40">
        {(["filter", "heatmap"] as const).map((m) => (
          <button
            key={m}
            onClick={() => f.set({ mode: m })}
            className={`flex-1 text-xs font-medium py-1.5 rounded transition ${
              f.mode === m ? "bg-card shadow-sm" : "text-muted-foreground"
            }`}
          >
            {m === "filter" ? "Strict filter" : "Heatmap score"}
          </button>
        ))}
      </div>

      <Separator />

      {/* Commute */}
      <Section
        title="Commute"
        enabled={f.commuteEnabled}
        onToggle={(v) => f.set({ commuteEnabled: v })}
      >
        <div className="space-y-2">
          <Label className="text-xs">Target postcode</Label>
          <Input
            value={f.commuteTargetPostcode}
            onChange={(e) => f.set({ commuteTargetPostcode: e.target.value })}
            className="h-8 text-sm"
            placeholder="EC2A 4NE"
          />
          <div className="flex items-center justify-between text-xs">
            <span>Max minutes</span>
            <span className="font-mono">{f.commuteMaxMinutes}</span>
          </div>
          <Slider
            value={[f.commuteMaxMinutes]}
            min={10}
            max={90}
            step={5}
            onValueChange={([v]) => f.set({ commuteMaxMinutes: v })}
          />
          <p className="text-[10px] text-muted-foreground leading-snug">
            Estimated via straight-line × London transit factor. Replace with TfL Journey Planner for real isochrones.
          </p>
        </div>
      </Section>

      {/* Schools */}
      <Section
        title="Schools"
        enabled={f.schoolsEnabled}
        onToggle={(v) => f.set({ schoolsEnabled: v })}
      >
        <div className="flex items-center justify-between text-xs">
          <span>Min Ofsted score</span>
          <span className="font-mono">{Math.round(f.schoolsMin * 100)}%</span>
        </div>
        <Slider
          value={[f.schoolsMin * 100]}
          min={0}
          max={100}
          step={5}
          onValueChange={([v]) => f.set({ schoolsMin: v / 100 })}
        />
      </Section>

      {/* Parks */}
      <Section
        title="Parks proximity"
        enabled={f.parksEnabled}
        onToggle={(v) => f.set({ parksEnabled: v })}
      >
        <div className="flex items-center justify-between text-xs">
          <span>Within</span>
          <span className="font-mono">{f.parksMaxMetres}m</span>
        </div>
        <Slider
          value={[f.parksMaxMetres]}
          min={200}
          max={2000}
          step={100}
          onValueChange={([v]) => f.set({ parksMaxMetres: v })}
        />
      </Section>

      {/* Custom radius */}
      <Section title="Custom radius" alwaysOn>
        <Button
          size="sm"
          variant={radiusDropMode ? "default" : "outline"}
          className="w-full h-8 text-xs"
          onClick={() => setRadiusDropMode(!radiusDropMode)}
        >
          <Crosshair className="w-3 h-3 mr-1" />
          {radiusDropMode ? "Click map to place..." : f.radius ? "Move radius pin" : "Drop radius pin"}
        </Button>
        {f.radius && (
          <>
            <div className="flex items-center justify-between text-xs mt-2">
              <span>Radius</span>
              <span className="font-mono">{f.radius.radiusKm} km</span>
            </div>
            <Slider
              value={[f.radius.radiusKm]}
              min={0.5}
              max={15}
              step={0.5}
              onValueChange={([v]) =>
                f.setRadius(f.radius ? { ...f.radius, radiusKm: v } : null)
              }
            />
            <Button
              size="sm"
              variant="ghost"
              className="w-full h-7 text-xs mt-1"
              onClick={() => f.setRadius(null)}
            >
              Remove
            </Button>
          </>
        )}
      </Section>

      {/* Avoid zones */}
      <Section title="Avoid zones" alwaysOn>
        <Button
          size="sm"
          variant={drawAvoidMode ? "default" : "outline"}
          className="w-full h-8 text-xs"
          onClick={() => setDrawAvoidMode(!drawAvoidMode)}
        >
          <Pencil className="w-3 h-3 mr-1" />
          {drawAvoidMode ? "Click to add points, double-click to finish" : "Draw avoid polygon"}
        </Button>
        {f.avoid.length > 0 && (
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{f.avoid.length} zone(s)</span>
            <button
              className="hover:text-foreground underline"
              onClick={() => f.clearAvoid()}
            >
              clear all
            </button>
          </div>
        )}
      </Section>

      {f.mode === "heatmap" && (
        <>
          <Separator />
          <Section title="Heatmap weights" alwaysOn>
            <Weight label="Commute" value={f.wCommute} onChange={(v) => f.set({ wCommute: v })} />
            <Weight label="Schools" value={f.wSchools} onChange={(v) => f.set({ wSchools: v })} />
            <Weight label="Parks" value={f.wParks} onChange={(v) => f.set({ wParks: v })} />
            <Weight label="Safety" value={f.wSafety} onChange={(v) => f.set({ wSafety: v })} />
          </Section>
        </>
      )}

      <Separator />

      {/* Pins */}
      <Section title={`Saved properties (${pins.length})`} alwaysOn>
        <Button
          size="sm"
          variant={pinDropMode ? "default" : "outline"}
          className="w-full h-8 text-xs"
          onClick={() => setPinDropMode(!pinDropMode)}
        >
          <MapPin className="w-3 h-3 mr-1" />
          {pinDropMode ? "Click map to drop pin..." : "Drop property pin"}
        </Button>
        {pins.length > 0 && (
          <ul className="mt-2 space-y-1">
            {pins.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-muted/40"
              >
                <span className="truncate">{p.label}</span>
                <button
                  onClick={() => removePin(p.id)}
                  className="text-muted-foreground hover:text-destructive shrink-0 ml-2"
                  aria-label="Remove"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <p className="text-[10px] text-muted-foreground leading-snug pt-2">
        Crime, schools & parks shown are placeholder demo data. Wire data.police.uk, GIAS+Ofsted and OSM Overpass to make them real.
      </p>
    </aside>
  );
}

function Section({
  title,
  children,
  enabled,
  onToggle,
  alwaysOn,
}: {
  title: string;
  children: React.ReactNode;
  enabled?: boolean;
  onToggle?: (v: boolean) => void;
  alwaysOn?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">{title}</h2>
        {!alwaysOn && (
          <Switch checked={!!enabled} onCheckedChange={onToggle} />
        )}
      </div>
      {(alwaysOn || enabled) && <div className="space-y-2">{children}</div>}
    </div>
  );
}

function Weight({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span>{label}</span>
        <span className="font-mono">{value.toFixed(2)}</span>
      </div>
      <Slider value={[value * 100]} min={0} max={100} step={5} onValueChange={([v]) => onChange(v / 100)} />
    </div>
  );
}
