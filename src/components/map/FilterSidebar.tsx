import { useEffect, useState } from "react";
import { useFilters } from "@/lib/map/filters.store";
import { usePins } from "@/lib/map/pins.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { MapPin, Trash2, Pencil, Crosshair, Download, Sparkles, Check, Loader2 } from "lucide-react";
import { COMMUTER_TOWNS } from "@/lib/map/commuter-towns";
import { exportShortlistPDF } from "@/lib/map/export-pdf";
import { geocodePostcode, safeHostname } from "@/lib/map/geocode";

type Props = {
  pinDropMode: boolean;
  setPinDropMode: (v: boolean) => void;
  radiusDropMode: boolean;
  setRadiusDropMode: (v: boolean) => void;
  drawAvoidMode: boolean;
  setDrawAvoidMode: (v: boolean) => void;
};

export function FilterSidebar({
  pinDropMode, setPinDropMode,
  radiusDropMode, setRadiusDropMode,
  drawAvoidMode, setDrawAvoidMode,
}: Props) {
  const f = useFilters();
  const pins = usePins((s) => s.pins);
  const removePin = usePins((s) => s.remove);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [geoLabel, setGeoLabel] = useState<string>("");

  // Debounced geocode of the work postcode → updates commute target on the map.
  useEffect(() => {
    const pc = f.commuteTargetPostcode.trim();
    if (!pc) { setGeoStatus("idle"); return; }
    setGeoStatus("loading");
    const t = setTimeout(async () => {
      const res = await geocodePostcode(pc);
      if (!res) { setGeoStatus("err"); return; }
      setGeoStatus("ok");
      setGeoLabel(res.area ? `${res.postcode} · ${res.area}` : res.postcode);
      f.set({ commuteTargetLngLat: [res.lng, res.lat] });
      window.dispatchEvent(new CustomEvent("__lhh_fly", { detail: { lng: res.lng, lat: res.lat } }));
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.commuteTargetPostcode]);

  const handleExport = () => {
    const summary: string[] = [];
    if (f.commuteEnabled) summary.push(`Commute ≤ ${f.commuteMaxMinutes} min to ${f.commuteTargetPostcode}`);
    if (f.schoolsEnabled) summary.push(`Schools rating ≥ ${Math.round(f.schoolsMin * 100)}%`);
    if (f.parksEnabled) summary.push(`Parks within ${f.parksMaxMetres} m`);
    if (f.radius) summary.push(`Within ${f.radius.radiusKm} km of custom pin`);
    if (f.avoid.length) summary.push(`${f.avoid.length} avoid zone(s)`);
    exportShortlistPDF(pins, summary);
  };

  return (
    <aside className="w-[360px] shrink-0 h-full overflow-y-auto bg-card border-r border-border">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">Home Compass</h1>
            <p className="text-[11px] text-muted-foreground">London & commuter belt</p>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-5 pb-8">
        {/* Mode toggle */}
        <div className="flex rounded-full bg-muted p-1">
          {(["filter", "heatmap"] as const).map((m) => (
            <button
              key={m}
              onClick={() => f.set({ mode: m })}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-full transition ${
                f.mode === m ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              }`}
            >
              {m === "filter" ? "Strict filter" : "Heatmap"}
            </button>
          ))}
        </div>

        {/* Commute */}
        <Card
          title="Commute"
          emoji="🚇"
          enabled={f.commuteEnabled}
          onToggle={(v) => f.set({ commuteEnabled: v })}
        >
          <Label className="text-[11px] text-muted-foreground">Work postcode</Label>
          <div className="relative">
            <Input
              value={f.commuteTargetPostcode}
              onChange={(e) => f.set({ commuteTargetPostcode: e.target.value })}
              className="h-9 rounded-xl text-sm pr-8 uppercase"
              placeholder="EC2A 4NE"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
              {geoStatus === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
              {geoStatus === "ok" && <Check className="w-3.5 h-3.5 text-primary" />}
              {geoStatus === "err" && <span className="text-[10px] text-destructive">not found</span>}
            </span>
          </div>
          {geoStatus === "ok" && geoLabel && (
            <p className="text-[10px] text-muted-foreground -mt-1">📍 {geoLabel}</p>
          )}
          <Row label="Max minutes" value={`${f.commuteMaxMinutes}`} />
          <Slider
            value={[f.commuteMaxMinutes]}
            min={10} max={90} step={5}
            onValueChange={([v]) => f.set({ commuteMaxMinutes: v })}
          />
          <p className="text-[10px] text-muted-foreground leading-snug">
            Estimate uses real distance plus a London radial-line boost — no API key needed.
          </p>
        </Card>

        {/* Schools */}
        <Card title="Schools" emoji="🎓" enabled={f.schoolsEnabled} onToggle={(v) => f.set({ schoolsEnabled: v })}>
          <Row label="Min Ofsted score" value={`${Math.round(f.schoolsMin * 100)}%`} />
          <Slider value={[f.schoolsMin * 100]} min={0} max={100} step={5}
            onValueChange={([v]) => f.set({ schoolsMin: v / 100 })} />
        </Card>

        {/* Parks */}
        <Card title="Parks proximity" emoji="🌳" enabled={f.parksEnabled} onToggle={(v) => f.set({ parksEnabled: v })}>
          <Row label="Within" value={`${f.parksMaxMetres} m`} />
          <Slider value={[f.parksMaxMetres]} min={200} max={2000} step={100}
            onValueChange={([v]) => f.set({ parksMaxMetres: v })} />
        </Card>

        {/* Custom radius */}
        <Card title="Custom radius" emoji="📍" alwaysOn>
          <Button
            variant={radiusDropMode ? "default" : "outline"}
            className="w-full h-9 rounded-xl text-xs"
            onClick={() => setRadiusDropMode(!radiusDropMode)}
          >
            <Crosshair className="w-3.5 h-3.5 mr-1.5" />
            {radiusDropMode ? "Click map to place…" : f.radius ? "Move radius pin" : "Drop radius pin"}
          </Button>
          {f.radius && (
            <>
              <Row label="Radius" value={`${f.radius.radiusKm} km`} />
              <Slider value={[f.radius.radiusKm]} min={0.5} max={15} step={0.5}
                onValueChange={([v]) => f.setRadius(f.radius ? { ...f.radius, radiusKm: v } : null)} />
              <Button variant="ghost" className="w-full h-7 text-xs" onClick={() => f.setRadius(null)}>
                Remove
              </Button>
            </>
          )}
        </Card>

        {/* Avoid zones */}
        <Card title="Avoid zones" emoji="🚫" alwaysOn>
          <Button
            variant={drawAvoidMode ? "default" : "outline"}
            className="w-full h-9 rounded-xl text-xs"
            onClick={() => setDrawAvoidMode(!drawAvoidMode)}
          >
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            {drawAvoidMode ? "Click points, double-click to finish" : "Draw avoid polygon"}
          </Button>
          {f.avoid.length > 0 && (
            <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
              <span>{f.avoid.length} zone(s)</span>
              <button className="hover:text-foreground underline" onClick={() => f.clearAvoid()}>clear all</button>
            </div>
          )}
        </Card>

        {/* Commuter towns */}
        <Card title="Commuter towns" emoji="🚆" alwaysOn>
          <p className="text-[11px] text-muted-foreground -mt-1">
            Jump to popular spots within an hour of central London.
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {COMMUTER_TOWNS.map((t) => (
              <button
                key={t.name}
                onClick={() => window.dispatchEvent(new CustomEvent("__lhh_fly", { detail: t }))}
                className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-[11px] font-medium hover:bg-accent/80 transition"
                title={`~${t.trainMinsToLondon} min by train`}
              >
                {t.name} · {t.trainMinsToLondon}m
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground leading-snug pt-1">
            Heatmap covers Greater London LSOAs. Pins can be dropped anywhere in the map area.
          </p>
        </Card>

        {f.mode === "heatmap" && (
          <Card title="Heatmap weights" emoji="✨" alwaysOn>
            <Weight label="Commute" value={f.wCommute} onChange={(v) => f.set({ wCommute: v })} />
            <Weight label="Schools" value={f.wSchools} onChange={(v) => f.set({ wSchools: v })} />
            <Weight label="Parks" value={f.wParks} onChange={(v) => f.set({ wParks: v })} />
            <Weight label="Safety" value={f.wSafety} onChange={(v) => f.set({ wSafety: v })} />
          </Card>
        )}

        <Separator />

        {/* Shortlist */}
        <Card title={`Shortlist (${pins.length})`} emoji="💛" alwaysOn>
          <Button
            variant={pinDropMode ? "default" : "outline"}
            className="w-full h-9 rounded-xl text-xs"
            onClick={() => setPinDropMode(!pinDropMode)}
          >
            <MapPin className="w-3.5 h-3.5 mr-1.5" />
            {pinDropMode ? "Click map to drop pin…" : "Add property pin"}
          </Button>
          {pins.length > 0 && (
            <>
              <ul className="space-y-1 pt-1">
                {pins.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-muted">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{p.label}</div>
                      {p.url && safeHostname(p.url) && (
                        <a href={p.url} target="_blank" rel="noopener"
                          className="text-[10px] text-primary truncate block">
                          {safeHostname(p.url)}
                        </a>
                      )}
                    </div>
                    <button onClick={() => removePin(p.id)}
                      className="text-muted-foreground hover:text-destructive shrink-0 ml-2"
                      aria-label="Remove">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <Button onClick={handleExport} className="w-full h-9 rounded-xl text-xs mt-2 bg-primary hover:bg-primary/90">
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export shortlist PDF
              </Button>
            </>
          )}
          <p className="text-[10px] text-muted-foreground leading-snug">
            Paste a Rightmove / Zoopla / OnTheMarket URL in a pin — hover the pin to preview the listing.
          </p>
        </Card>

        <div className="rounded-xl bg-accent/60 p-3 text-[11px] text-accent-foreground flex gap-2">
          <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>Schools, parks & safety are demo data — wire GIAS+Ofsted, OSM and data.police.uk to make them real.</span>
        </div>
      </div>
    </aside>
  );
}

function Card({
  title, emoji, children, enabled, onToggle, alwaysOn,
}: {
  title: string; emoji: string; children: React.ReactNode;
  enabled?: boolean; onToggle?: (v: boolean) => void; alwaysOn?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 space-y-2.5 shadow-[0_1px_2px_rgba(8,20,48,0.04)]">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <span>{emoji}</span>{title}
        </h2>
        {!alwaysOn && <Switch checked={!!enabled} onCheckedChange={onToggle} />}
      </div>
      {(alwaysOn || enabled) && <div className="space-y-2.5">{children}</div>}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}

function Weight({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">{value.toFixed(2)}</span>
      </div>
      <Slider value={[value * 100]} min={0} max={100} step={5} onValueChange={([v]) => onChange(v / 100)} />
    </div>
  );
}
