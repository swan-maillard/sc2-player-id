import { FEATURE_NAMES, type Phase, type RateKey } from "./features";
import { IMPURITY, PERMUTATION } from "./importance";

export const PHASE_SPAN: Record<Phase, string> = {
  start: "the first minute",
  early: "1 to 6 minutes",
  mid: "6 to 25 minutes",
};

export interface ParsedName {
  phase?: Phase;
  key?: RateKey;
  race?: string;
}

export function parseName(name: string): ParsedName {
  if (name.startsWith("played_race_")) return { race: name.slice("played_race_".length) };
  const [phase, ...rest] = name.split("_");
  return { phase: phase as Phase, key: rest.join("_") as RateKey };
}

// What one count in a rate stands for, in words.
export function countWord(key: RateKey, n: number): string {
  const s = n === 1 ? "" : "s";
  if (key.startsWith("hk_") && /\d$/.test(key)) return `press${n === 1 ? "" : "es"} of hotkey slot ${key.slice(3)}`;
  switch (key) {
    case "hk_created":
      return `hotkey${s} created`;
    case "hk_used":
      return `hotkey${s} used`;
    case "base":
      return `base selection${s}`;
    case "mineral":
      return `mineral selection${s}`;
    default:
      return `other selection${s}`;
  }
}

export function rowLabel(key: RateKey): string {
  if (/^hk_\d$/.test(key)) return `Slot ${key.slice(3)}`;
  const labels: Record<string, string> = { hk_created: "Created", hk_used: "Used", base: "Base", mineral: "Mineral", other: "Other" };
  return labels[key] ?? key;
}

// Both tables are written in the plots' top-to-bottom order, which also settles the ties.
function rankByOrder(values: object): Record<string, number> {
  return Object.fromEntries(Object.keys(values).map((name, i) => [name, i + 1]));
}

export const IMPURITY_RANK = rankByOrder(IMPURITY);
export const PERMUTATION_RANK = rankByOrder(PERMUTATION);
export const FEATURE_COUNT = FEATURE_NAMES.length;
