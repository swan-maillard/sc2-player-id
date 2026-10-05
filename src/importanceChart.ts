import { FEATURE_NAMES, PHASES } from "./features";
import { IMPURITY, PERMUTATION } from "./importance";
import { IMPURITY_RANK, PERMUTATION_RANK, parseName } from "./describe";
import { el, ordinal } from "./format";

export type Measure = "impurity" | "permutation";
export type Order = "rank" | "phase";

export interface ImportanceView {
  measure: Measure;
  order: Order;
  showAll: boolean;
  selected: string | null;
}

interface Item {
  name: string;
  value: number;
  std?: number;
}

const DOMAIN: Record<Measure, [number, number]> = {
  impurity: [0, 0.05],
  permutation: [-0.004, 0.024],
};
const TICKS: Record<Measure, number[]> = {
  impurity: [0, 0.01, 0.02, 0.03, 0.04, 0.05],
  permutation: [0, 0.01, 0.02],
};
const TOP = 15;

export function items(measure: Measure): Item[] {
  return measure === "impurity"
    ? Object.entries(IMPURITY).map(([name, value]) => ({ name, value }))
    : Object.entries(PERMUTATION).map(([name, p]) => ({ name, value: p.mean, std: p.std }));
}

function groupOf(name: string): string {
  return parseName(name).phase ?? "race";
}

const GROUP_TITLE: Record<string, string> = {
  start: "Start, the first minute",
  early: "Early, 1 to 6 minutes",
  mid: "Mid, 6 to 25 minutes",
  race: "Race",
};

export function fixed(v: number): string {
  return v.toFixed(4);
}

export function renderImportance(
  host: HTMLElement,
  view: ImportanceView,
  onPick: (name: string) => void,
): void {
  const all = items(view.measure);
  const [lo, hi] = DOMAIN[view.measure];
  const pos = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const zero = pos(0);

  const row = (it: Item) => {
    const left = Math.min(pos(it.value), zero);
    const width = Math.max(Math.abs(pos(it.value) - zero), 0.4);
    const bar = el("span", { class: `bar${it.value < 0 ? " negative" : ""}` });
    bar.style.left = `${left}%`;
    bar.style.width = `${width}%`;
    const track = el("span", { class: "track", "aria-hidden": "true" }, bar);
    if (it.std !== undefined) {
      const err = el("span", { class: "err" });
      err.style.left = `${pos(it.value - it.std)}%`;
      err.style.width = `${pos(it.value + it.std) - pos(it.value - it.std)}%`;
      track.append(err);
    }
    const label = it.std !== undefined ? `${fixed(it.value)} ± ${fixed(it.std)}` : fixed(it.value);
    const button = el("button", {
      type: "button",
      class: "imp-row",
      "aria-pressed": String(view.selected === it.name),
      "data-feature": it.name,
    },
      el("code", { class: "imp-name" }, it.name),
      track,
      el("span", { class: "imp-val" }, label),
    );
    button.addEventListener("click", () => onPick(it.name));
    return el("li", {}, button);
  };

  const list = el("ol", { class: "imp-list" });
  if (view.order === "rank") {
    const shown = view.showAll ? all : all.slice(0, TOP);
    shown.forEach((it) => list.append(row(it)));
    const sel = all.find((it) => it.name === view.selected);
    if (!view.showAll && sel && !shown.includes(sel)) {
      list.append(el("li", { class: "imp-gap" }, `Your pick, ranked ${ordinal(all.indexOf(sel) + 1)}`), row(sel));
    }
  } else {
    for (const group of [...PHASES, "race"]) {
      const inGroup = all.filter((it) => groupOf(it.name) === group);
      const shown = view.showAll ? inGroup : inGroup.slice(0, 5);
      list.append(el("li", { class: "imp-group" }, GROUP_TITLE[group]));
      shown.forEach((it) => list.append(row(it)));
      const sel = inGroup.find((it) => it.name === view.selected);
      if (sel && !shown.includes(sel)) list.append(row(sel));
    }
  }

  const axis = el("div", { class: "imp-axis", "aria-hidden": "true" }, el("span"));
  const ticks = el("span", { class: "ticks" });
  for (const t of TICKS[view.measure]) {
    const tick = el("span", { class: "tick" }, t === 0 ? "0" : String(t));
    tick.style.left = `${pos(t)}%`;
    ticks.append(tick);
  }
  axis.append(ticks, el("span"));
  host.style.setProperty("--zero", `${zero}%`);
  host.replaceChildren(list, axis);
}

export function summarize(measure: Measure): string {
  const all = items(measure);
  const top10 = all.slice(0, 10);
  const n = (g: string) => top10.filter((it) => groupOf(it.name) === g).length;
  if (measure === "impurity") {
    return `By impurity decrease, ${n("start")} of the top 10 come from the first minute and ${n("early")} from minutes 1 to 6. ${all[0].name} leads with ${fixed(all[0].value)}. The three race columns are near the bottom: a 0 or 1 column offers a single split, and this measure tends to undervalue that.`;
  }
  const negative = all.filter((it) => it.value < 0).length;
  return `By permutation, shuffling ${all[0].name} costs ${(all[0].value * 100).toFixed(1)} points of accuracy on average, the most of all 48. ${n("start")} of the top 10 come from the first minute. played_race_Protoss climbs to ${ordinal(PERMUTATION_RANK.played_race_Protoss)}. ${negative} features score just below 0: shuffling them changes nothing beyond noise.`;
}

export function rankLine(name: string): string {
  const p = PERMUTATION[name];
  return `Impurity decrease ${fixed(IMPURITY[name])}, ${ordinal(IMPURITY_RANK[name])} of ${FEATURE_NAMES.length}. Permutation ${fixed(p.mean)} ± ${fixed(p.std)}, ${ordinal(PERMUTATION_RANK[name])} of ${FEATURE_NAMES.length}.`;
}
