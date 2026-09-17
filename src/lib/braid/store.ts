import { create } from "zustand";
import { runSimulation } from "./engine";
import {
  DEFAULT_PARAMS,
  type Glyph,
  type SimParams,
  type Simulation,
} from "./types";

const STORAGE_KEY = "braid-memory-lab-v2";

function loadParams(): SimParams {
  if (typeof window === "undefined") return DEFAULT_PARAMS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PARAMS;
    const parsed = JSON.parse(raw) as Partial<SimParams>;
    const source = parsed.source === "random" ? "random" : "operators";
    return { ...DEFAULT_PARAMS, ...parsed, source };
  } catch {
    return DEFAULT_PARAMS;
  }
}

function persist(params: SimParams) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
  } catch {
    /* ignore quota */
  }
}

export type BraidView = "gemini" | "artin";

interface LabState {
  params: SimParams;
  sim: Simulation;
  cursor: number;
  playing: boolean;
  view: BraidView;
  selectedT: number | null;
  recallGlyph: Glyph | null;
  hydrated: boolean;
  hydrate: () => void;
  setParams: (patch: Partial<SimParams>) => void;
  applyPreset: (patch: Partial<SimParams>) => void;
  reseed: () => void;
  setCursor: (t: number) => void;
  setView: (view: BraidView) => void;
  setSelectedT: (t: number | null) => void;
  setRecallGlyph: (g: Glyph | null) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stepBy: (dir: -1 | 1) => void;
}

function rebuild(params: SimParams): Pick<LabState, "params" | "sim" | "cursor"> {
  const sim = runSimulation(params);
  return {
    params: sim.params,
    sim,
    cursor: sim.params.steps - 1,
  };
}

export const useLab = create<LabState>((set, get) => ({
  params: DEFAULT_PARAMS,
  sim: runSimulation(DEFAULT_PARAMS),
  cursor: DEFAULT_PARAMS.steps - 1,
  playing: false,
  view: "gemini",
  selectedT: null,
  recallGlyph: null,
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const next = rebuild(loadParams());
    set({ ...next, hydrated: true, playing: false });
  },

  setParams: (patch) => {
    const params = { ...get().params, ...patch };
    persist(params);
    set({ ...rebuild(params), playing: false, selectedT: null });
  },

  applyPreset: (patch) => {
    const params = { ...DEFAULT_PARAMS, ...patch };
    persist(params);
    set({ ...rebuild(params), playing: false, selectedT: null, recallGlyph: null });
  },

  reseed: () => {
    const seed = (Math.floor(Math.random() * 9000) + 1) | 0;
    get().setParams({ seed });
  },

  setCursor: (t) => {
    const max = get().sim.params.steps - 1;
    set({ cursor: Math.max(0, Math.min(max, t)), playing: false });
  },

  setView: (view) => set({ view }),
  setSelectedT: (t) => set({ selectedT: t }),
  setRecallGlyph: (g) => set({ recallGlyph: g === get().recallGlyph ? null : g }),

  play: () => {
    const { cursor, sim } = get();
    const nextCursor = cursor >= sim.params.steps - 1 ? 0 : cursor;
    set({ playing: true, cursor: nextCursor });
  },
  pause: () => set({ playing: false }),
  togglePlay: () => {
    if (get().playing) get().pause();
    else get().play();
  },
  stepBy: (dir) => {
    const { cursor, sim } = get();
    const max = sim.params.steps - 1;
    set({
      cursor: Math.max(0, Math.min(max, cursor + dir)),
      playing: false,
    });
  },
}));
