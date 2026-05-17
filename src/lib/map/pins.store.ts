import { create } from "zustand";

export type Pin = {
  id: string;
  lng: number;
  lat: number;
  label: string;
  url?: string;
  notes?: string;
  createdAt: number;
};

type PinsState = {
  pins: Pin[];
  hydrated: boolean;
  hydrate: () => void;
  add: (p: Omit<Pin, "id" | "createdAt">) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const KEY = "lhh.pins.v1";

export const usePins = create<PinsState>((set, get) => ({
  pins: [],
  hydrated: false,
  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(KEY);
      const pins: Pin[] = raw ? JSON.parse(raw) : [];
      set({ pins, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
  add: (p) => {
    const pin: Pin = { ...p, id: crypto.randomUUID(), createdAt: Date.now() };
    const next = [...get().pins, pin];
    set({ pins: next });
    if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  },
  remove: (id) => {
    const next = get().pins.filter((p) => p.id !== id);
    set({ pins: next });
    if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  },
  clear: () => {
    set({ pins: [] });
    if (typeof window !== "undefined") localStorage.removeItem(KEY);
  },
}));
