import { create } from "zustand";

export type Mode = "filter" | "heatmap";

export type RadiusPin = {
  lng: number;
  lat: number;
  radiusKm: number;
} | null;

export type AvoidPolygon = {
  id: string;
  coords: [number, number][]; // [lng,lat] ring, closed
};

export type FiltersState = {
  mode: Mode;
  // Commute
  commuteEnabled: boolean;
  commuteTargetPostcode: string;
  commuteTargetLngLat: [number, number] | null;
  commuteMaxMinutes: number;
  // Schools (Ofsted-equivalent placeholder score 0..1)
  schoolsEnabled: boolean;
  schoolsMin: number; // 0..1
  // Parks proximity
  parksEnabled: boolean;
  parksMaxMetres: number;
  // Custom radius pin
  radius: RadiusPin;
  // Avoid polygons
  avoid: AvoidPolygon[];
  // Heatmap weights (only used in heatmap mode)
  wCommute: number;
  wSchools: number;
  wParks: number;
  wSafety: number;
  // Setters
  set: (p: Partial<FiltersState>) => void;
  addAvoid: (poly: AvoidPolygon) => void;
  clearAvoid: () => void;
  setRadius: (r: RadiusPin) => void;
};

export const useFilters = create<FiltersState>((set) => ({
  mode: "filter",
  commuteEnabled: false,
  commuteTargetPostcode: "EC2A 4NE",
  commuteTargetLngLat: [-0.0807, 51.5237], // Old Street default
  commuteMaxMinutes: 40,
  schoolsEnabled: false,
  schoolsMin: 0.6,
  parksEnabled: false,
  parksMaxMetres: 600,
  radius: null,
  avoid: [],
  wCommute: 0.4,
  wSchools: 0.2,
  wParks: 0.2,
  wSafety: 0.2,
  set: (p) => set(p),
  addAvoid: (poly) => set((s) => ({ avoid: [...s.avoid, poly] })),
  clearAvoid: () => set({ avoid: [] }),
  setRadius: (r) => set({ radius: r }),
}));
