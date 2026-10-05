import { describe, expect, it } from "vitest";
import { FEATURE_NAMES } from "../src/features";
import { IMPURITY, PERMUTATION } from "../src/importance";
import { MODELS, PRINTED_FULL_GAME } from "../src/data";

describe("importances read off the plots", () => {
  it("name each of the 48 features once", () => {
    expect(Object.keys(IMPURITY).sort()).toEqual([...FEATURE_NAMES].sort());
    expect(Object.keys(PERMUTATION).sort()).toEqual([...FEATURE_NAMES].sort());
  });

  it("keep the order of the plots", () => {
    const desc = (xs: number[]) => xs.every((x, i) => i === 0 || xs[i - 1] >= x);
    expect(desc(Object.values(IMPURITY))).toBe(true);
    expect(desc(Object.values(PERMUTATION).map((p) => p.mean))).toBe(true);
  });

  it("add up to about 1 for impurity, as scikit-learn normalises them", () => {
    const total = Object.values(IMPURITY).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(0.99);
    expect(total).toBeLessThan(1.01);
  });
});

describe("model results", () => {
  it("match what each notebook printed", () => {
    for (const m of MODELS) {
      const n = Number(m.printed.match(/([\d.]+)%?$/)![1]);
      expect(m.test, m.id).toBeCloseTo(m.printed.endsWith("%") ? n / 100 : n, 10);
    }
  });

  it("only quote full-game values for real features", () => {
    for (const values of Object.values(PRINTED_FULL_GAME)) {
      for (const name of Object.keys(values)) expect(FEATURE_NAMES).toContain(name);
    }
  });
});
