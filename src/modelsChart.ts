import { MODELS, type ModelResult } from "./data";
import { el, pct } from "./format";

export type ModelSort = "test" | "cv";

export interface ModelsView {
  sort: ModelSort;
  showCv: boolean;
  selected: string;
}

const LO = 0.85;
const HI = 0.96;
const pos = (v: number) => ((v - LO) / (HI - LO)) * 100;

export function sortedModels(sort: ModelSort): ModelResult[] {
  const key = (m: ModelResult) => (sort === "test" ? m.test : m.cv ?? -1);
  return [...MODELS].sort((a, b) => key(b) - key(a));
}

export function renderModels(host: HTMLElement, view: ModelsView, onPick: (id: string) => void): void {
  const list = el("ol", { class: "model-list" });
  for (const m of sortedModels(view.sort)) {
    const track = el("span", { class: "track", "aria-hidden": "true" });
    if (view.showCv && m.cv !== undefined) {
      const link = el("span", { class: "cv-link" });
      link.style.left = `${pos(Math.min(m.cv, m.test))}%`;
      link.style.width = `${Math.abs(pos(m.test) - pos(m.cv))}%`;
      const cv = el("span", { class: "dot cv" });
      cv.style.left = `${pos(m.cv)}%`;
      track.append(link, cv);
    }
    const dot = el("span", { class: "dot test" });
    dot.style.left = `${pos(m.test)}%`;
    track.append(dot);

    const values = view.showCv
      ? `${pct(m.test)} · ${m.cv !== undefined ? pct(m.cv) : "no CV"}`
      : pct(m.test);
    const button = el("button", {
      type: "button",
      class: "model-row",
      "aria-pressed": String(view.selected === m.id),
    }, el("span", { class: "model-name" }, m.name), track, el("span", { class: "model-val" }, values));
    button.addEventListener("click", () => onPick(m.id));
    list.append(el("li", {}, button));
  }

  const axis = el("div", { class: "model-axis", "aria-hidden": "true" }, el("span"));
  const ticks = el("span", { class: "ticks" });
  for (const t of [0.85, 0.88, 0.91, 0.94]) {
    const tick = el("span", { class: "tick" }, `${Math.round(t * 100)}%`);
    tick.style.left = `${pos(t)}%`;
    ticks.append(tick);
  }
  axis.append(ticks, el("span"));
  host.replaceChildren(list, axis);
}

export function describeModel(id: string): string {
  const m = MODELS.find((x) => x.id === id)!;
  const rank = sortedModels("test").indexOf(m) + 1;
  const cv = m.cv !== undefined
    ? ` Its best 5-fold cross-validation score during the search was ${pct(m.cv)}.`
    : " It had no hyperparameter search, so there's no cross-validation score.";
  return `${m.name}: ${pct(m.test)} of the held-out games named correctly, ${rank === 1 ? "the best of the seven" : `number ${rank} of 7`}.${cv} ${m.what} ${m.cutoff}. The notebook printed "${m.printed}".`;
}
