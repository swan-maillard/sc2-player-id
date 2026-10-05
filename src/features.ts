// Port of the feature extraction in notebook-rf-v1.ipynb (cells 21, 28 and 29).
// Same constants, same order of operations, same quirks.

export type Phase = "start" | "early" | "mid";
export type Race = "Protoss" | "Terran" | "Zerg";

export const PHASES: Phase[] = ["start", "early", "mid"];
export const RACES: Race[] = ["Protoss", "Terran", "Zerg"];

export const START_MAX = 60;
export const EARLY_MAX = 360;
export const MID_MAX = 1500;
export const CUT_MARKER = "t1500";

export const RATE_KEYS = [
  "hk_0", "hk_1", "hk_2", "hk_3", "hk_4", "hk_5", "hk_6", "hk_7", "hk_8", "hk_9",
  "hk_created", "hk_used", "base", "mineral", "other",
] as const;
export type RateKey = (typeof RATE_KEYS)[number];

// Column order of feature_cols in the notebook: the race dummies first, then 15 rates per phase.
export const FEATURE_NAMES: string[] = [
  ...RACES.map((r) => `played_race_${r}`),
  ...PHASES.flatMap((p) => RATE_KEYS.map((k) => `${p}_${k}`)),
];

export interface Chunk {
  start: number;
  end: number;
  actions: string[];
}

export type Features = Record<string, number>;

export function isTimeMarker(token: string): boolean {
  return token.startsWith("t");
}

// Python's int() on the marker. Tokens like "tx" make the notebook crash, so they are rejected before this.
export function markerSeconds(token: string): number {
  return parseInt(token.slice(1), 10);
}

export function ceilActionsFromDuration(actions: string[]): string[] {
  const i = actions.indexOf(CUT_MARKER);
  return i === -1 ? actions : actions.slice(0, i + 1);
}

export function chunkifyActions(actions: string[]): Chunk[] {
  const chunks: Chunk[] = [];
  let currentTime = 0;
  let chunkActions: string[] = [];

  for (const a of actions) {
    if (isTimeMarker(a)) {
      const endTime = markerSeconds(a);
      if (chunkActions.length > 0) chunks.push({ start: currentTime, end: endTime, actions: chunkActions });
      currentTime = endTime;
      chunkActions = [];
    } else {
      chunkActions.push(a);
    }
  }
  // Actions after the last marker form a zero-length window, which the notebook counts as 1 second below.
  if (chunkActions.length > 0) chunks.push({ start: currentTime, end: currentTime, actions: chunkActions });
  return chunks;
}

export function getPhase(t: number): Phase | undefined {
  if (t < START_MAX) return "start";
  if (t < EARLY_MAX) return "early";
  if (t < MID_MAX) return "mid";
  return undefined;
}

export function chunkDuration(chunk: Chunk): number {
  return Math.max(1, chunk.end - chunk.start);
}

export type ActionKind = "hotkey" | "base" | "mineral" | "other" | "ignored";

export function actionKind(a: string): ActionKind {
  if (a.startsWith("hotkey")) return "hotkey";
  if (a === "sBase" || a === "Base") return "base";
  if (a === "sMineral" || a === "SingleMineral") return "mineral";
  if (a === "s") return "other";
  return "ignored";
}

// hotkey30 -> slot 3, and the last digit says what happened to it (0 created, 1 updated, 2 used).
export function hotkeySlot(a: string): number {
  return parseInt(a.charAt(a.length - 2), 10);
}

// Which of the 15 rate keys a single action adds 1 to.
export function rateKeysOf(a: string): RateKey[] {
  switch (actionKind(a)) {
    case "hotkey": {
      const keys: RateKey[] = [`hk_${hotkeySlot(a)}` as RateKey];
      if (a.endsWith("0")) keys.push("hk_created");
      else if (a.endsWith("2")) keys.push("hk_used");
      return keys;
    }
    case "base":
      return ["base"];
    case "mineral":
      return ["mineral"];
    case "other":
      return ["other"];
    default:
      return [];
  }
}

export interface PhaseTotals {
  counts: Record<Phase, Record<RateKey, number>>;
  durations: Record<Phase, number>;
}

function emptyCounts(): Record<RateKey, number> {
  return Object.fromEntries(RATE_KEYS.map((k) => [k, 0])) as Record<RateKey, number>;
}

export function phaseTotals(chunks: Chunk[]): PhaseTotals {
  const counts = { start: emptyCounts(), early: emptyCounts(), mid: emptyCounts() };
  const durations = { start: 0, early: 0, mid: 0 };

  for (const chunk of chunks) {
    if (chunk.start >= MID_MAX) break;
    // The notebook files the whole window under the phase it starts in.
    const phase = getPhase(chunk.start) as Phase;
    for (const a of chunk.actions) {
      for (const key of rateKeysOf(a)) counts[phase][key] += 1;
    }
    durations[phase] += chunkDuration(chunk);
  }
  return { counts, durations };
}

export function computeFeaturesPerChunk(chunks: Chunk[]): Features {
  const { counts, durations } = phaseTotals(chunks);
  const feats: Features = {};
  for (const phase of PHASES) {
    const dur = durations[phase];
    for (const key of RATE_KEYS) {
      feats[`${phase}_${key}`] = dur === 0 ? 0 : counts[phase][key] / dur;
    }
  }
  return feats;
}

export function raceDummies(race: Race): Features {
  return Object.fromEntries(RACES.map((r) => [`played_race_${r}`, r === race ? 1 : 0]));
}

// The whole path a game takes in rf v1: cut at t1500, split into windows, average per phase, add the race.
export function gameFeatures(actions: string[], race: Race): Features {
  const rates = computeFeaturesPerChunk(chunkifyActions(ceilActionsFromDuration(actions)));
  return { ...raceDummies(race), ...rates };
}

export function featureVector(features: Features): number[] {
  return FEATURE_NAMES.map((name) => features[name]);
}
