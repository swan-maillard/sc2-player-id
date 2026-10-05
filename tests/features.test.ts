import { describe, expect, it } from "vitest";
import fixture from "./fixtures/notebook-features.json";
import {
  FEATURE_NAMES,
  ceilActionsFromDuration,
  chunkifyActions,
  computeFeaturesPerChunk,
  gameFeatures,
} from "../src/features";
import { EXAMPLES } from "../src/data";
import { parseLog } from "../src/parse";

// notebook-features.json comes from scripts/notebook_reference.py, which runs the notebook's own Python.
const cases = fixture.cases;

describe("the port gives the notebook's numbers", () => {
  it.each(cases.map((c) => [c.name, c] as const))("%s", (_name, c) => {
    const kept = ceilActionsFromDuration(c.actions);
    expect(kept).toEqual(c.kept);

    const chunks = chunkifyActions(kept);
    expect(chunks.map((ch) => [ch.start, ch.end, ch.actions])).toEqual(c.chunks);

    const features = computeFeaturesPerChunk(chunks);
    expect(Object.keys(features)).toEqual(Object.keys(c.features));
    for (const [name, value] of Object.entries(c.features)) {
      expect(features[name], name).toBe(value);
    }
  });

  it("covers every real example shown on the page", () => {
    for (const ex of EXAMPLES) {
      const c = cases.find((x) => x.name === ex.id);
      expect(c, ex.id).toBeDefined();
      expect(c!.actions).toEqual(ex.actions);
    }
  });
});

describe("the 48 columns", () => {
  it("are in the notebook's feature_cols order", () => {
    // Printed by notebook-rf-v1, cell 38.
    const printed =
      "'played_race_Protoss', 'played_race_Terran', 'played_race_Zerg', 'start_hk_0', 'start_hk_1', 'start_hk_2', 'start_hk_3', 'start_hk_4', 'start_hk_5', 'start_hk_6', 'start_hk_7', 'start_hk_8', 'start_hk_9', 'start_hk_created', 'start_hk_used', 'start_base', 'start_mineral', 'start_other', 'early_hk_0', 'early_hk_1', 'early_hk_2', 'early_hk_3', 'early_hk_4', 'early_hk_5', 'early_hk_6', 'early_hk_7', 'early_hk_8', 'early_hk_9', 'early_hk_created', 'early_hk_used', 'early_base', 'early_mineral', 'early_other', 'mid_hk_0', 'mid_hk_1', 'mid_hk_2', 'mid_hk_3', 'mid_hk_4', 'mid_hk_5', 'mid_hk_6', 'mid_hk_7', 'mid_hk_8', 'mid_hk_9', 'mid_hk_created', 'mid_hk_used', 'mid_base', 'mid_mineral', 'mid_other'";
    expect(FEATURE_NAMES).toEqual(printed.split(", ").map((s) => s.slice(1, -1)));
  });

  it("put the race first as 0/1 dummies", () => {
    const f = gameFeatures(EXAMPLES[5].actions, "Zerg");
    expect([f.played_race_Protoss, f.played_race_Terran, f.played_race_Zerg]).toEqual([0, 0, 1]);
    expect(Object.keys(f)).toEqual(FEATURE_NAMES);
  });
});

describe("pasting a log", () => {
  it("reads the line from the competition's data page", () => {
    const parsed = parseLog("5, Protoss, Base, s, s, s, s, s, t5, Base, s, hotkey30, hotkey00, t10, t15");
    expect(parsed.race).toBe("Protoss");
    expect(parsed.actions).toEqual(EXAMPLES.find((e) => e.id === "data-page")!.actions);
    expect(parsed.errors).toEqual([]);
  });

  it("reads the notebook's list repr", () => {
    expect(parseLog("[Base, s, s, s, Base, s, hotkey30, hotkey00]").actions).toEqual(EXAMPLES[2].actions);
  });

  it("refuses tokens that are not in the data format", () => {
    const parsed = parseLog("s, tea, hotkey3, s");
    expect(parsed.actions).toEqual(["s", "s"]);
    expect(parsed.errors).toHaveLength(2);
  });
});
