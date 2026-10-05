import "@fontsource/josefin-sans/latin-500";
import "@fontsource/barlow/latin-400";
import "@fontsource/barlow/latin-500";
import "@fontsource/barlow-condensed/latin-500";
import "./style.css";

import { isTimeMarker, markerSeconds, type Race } from "./features";
import {
  EXAMPLES,
  derive,
  describeFeature,
  describeGame,
  formatLog,
  parseLog,
  renderFullGame,
  renderPhaseBar,
  renderPhaseLegend,
  renderRace,
  renderRates,
  renderWindows,
  tokenMeaning,
  type Game,
} from "./lab";
import { rankLine, renderImportance, summarize, type ImportanceView, type Measure, type Order } from "./importanceChart";
import { describeModel, renderModels, type ModelSort, type ModelsView } from "./modelsChart";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const ui = {
  game: $<HTMLSelectElement>("game"),
  race: $<HTMLSelectElement>("race"),
  source: $("source"),
  log: $<HTMLTextAreaElement>("log"),
  errors: $("log-errors"),
  windows: $("windows"),
  phaseBar: $("phase-bar"),
  phaseLegend: $("phase-legend"),
  raceCells: $("race-cells"),
  rates: $<HTMLTableElement>("rates"),
  fullGame: $("full-game"),
  explain: $("explain"),
  detail: $("detail"),
  detailName: $("detail-name"),
  detailRanks: $("detail-ranks"),
  impChart: $("imp-chart"),
  impSummary: $("imp-summary"),
  impOrder: $<HTMLSelectElement>("imp-order"),
  impAll: $<HTMLInputElement>("imp-all"),
  modelChart: $("model-chart"),
  modelExplain: $("model-explain"),
  modelSort: $<HTMLSelectElement>("model-sort"),
  modelCv: $<HTMLInputElement>("model-cv"),
};

const CUSTOM = "custom";
const first = EXAMPLES[0];
let game: Game = { actions: [...first.actions], race: first.race, example: first };
let history: string[][] = [];
let selected: string | null = null;
const importance: ImportanceView = { measure: "impurity", order: "rank", showAll: false, selected: null };
const models: ModelsView = { sort: "test", showCv: false, selected: "rf-v1" };

function fillGameSelect(): void {
  const groups: [string, (id: string) => boolean][] = [
    ["Training games, first actions", (id) => id.startsWith("train")],
    ["Test games, first actions", (id) => id.startsWith("test")],
    ["Other", (id) => id === "data-page"],
  ];
  for (const [label, keep] of groups) {
    const group = document.createElement("optgroup");
    group.label = label;
    for (const ex of EXAMPLES.filter((e) => keep(e.id))) {
      const opt = new Option(ex.player !== undefined ? `${ex.label}, player ${ex.player}` : ex.label, ex.id);
      group.append(opt);
    }
    ui.game.append(group);
  }
  ui.game.append(new Option("Your own log", CUSTOM));
}

function render(explainWith?: string): void {
  const d = derive(game);
  ui.game.value = game.example?.id ?? CUSTOM;
  ui.race.value = game.race;
  ui.source.textContent = game.example
    ? `Real log, first actions only. Source: ${game.example.source}.`
    : "Your own log. It isn't a real game, but the numbers are computed exactly as the notebook would.";

  renderWindows(ui.windows, d, selected);
  renderPhaseBar(ui.phaseBar, d, selected);
  renderPhaseLegend(ui.phaseLegend, d);
  renderRace(ui.raceCells, d, selected, pickFeature);
  renderRates(ui.rates, d, selected, pickFeature);
  renderFullGame(ui.fullGame, game, d);

  ui.explain.textContent = explainWith ?? (selected ? describeFeature(selected, game, d) : describeGame(game, d));
  ui.detail.hidden = !selected;
  if (selected) {
    ui.detailName.textContent = selected;
    ui.detailRanks.textContent = rankLine(selected);
  }
}

function renderImportanceChart(): void {
  importance.selected = selected;
  renderImportance(ui.impChart, importance, pickFeature);
}

function renderModelChart(): void {
  renderModels(ui.modelChart, models, (id) => {
    models.selected = id;
    renderModelChart();
    ui.modelExplain.textContent = describeModel(id);
  });
}

function pickFeature(name: string): void {
  selected = selected === name ? null : name;
  const focused = document.activeElement as HTMLElement | null;
  const focusKey = focused?.dataset.feature;
  const inChart = !!focused && ui.impChart.contains(focused);
  render();
  renderImportanceChart();
  // Re-rendering replaces the buttons, so put focus back on the one that was pressed.
  if (focusKey) {
    const scope = inChart ? ui.impChart : document.querySelector(".visual")!;
    scope.querySelector<HTMLElement>(`[data-feature="${focusKey}"]`)?.focus();
  }
}

function setActions(actions: string[], note?: string): void {
  history.push(game.actions);
  if (history.length > 200) history.shift();
  game = { ...game, actions, example: null };
  ui.log.value = formatLog(actions);
  ui.errors.textContent = "";
  render(note);
}

function lastMarker(actions: string[]): number {
  for (let i = actions.length - 1; i >= 0; i--) if (isTimeMarker(actions[i])) return markerSeconds(actions[i]);
  return 0;
}

function addAction(token: string): void {
  setActions([...game.actions, token]);
  const d = derive(game);
  const last = d.chunks[d.chunks.length - 1];
  const where = d.dropped > 0 ? "It comes after t1500, so the notebook cuts it off." : last && last.end === last.start
    ? `It sits in the open window after ${last.start} s, which counts as 1 second until the next marker.`
    : "";
  ui.explain.textContent = `Added ${token}: ${tokenMeaning(token)}. ${where}`;
}

function addSeconds(seconds: number): void {
  let t = lastMarker(game.actions);
  const markers: string[] = [];
  for (let s = 0; s < seconds; s += 5) markers.push(`t${(t += 5)}`);
  setActions([...game.actions, ...markers]);
  ui.explain.textContent = seconds === 5
    ? `Added ${markers[0]}. It closes the window that was open, so that window now counts its real length.`
    : `Added a minute of markers, ${markers[0]} to ${markers[markers.length - 1]}. With no action between them, those windows are dropped and the seconds don't count.`;
}

function wire(): void {
  ui.game.addEventListener("change", () => {
    const ex = EXAMPLES.find((e) => e.id === ui.game.value);
    if (!ex) {
      game = { ...game, example: null };
      render();
      return;
    }
    history.push(game.actions);
    game = { actions: [...ex.actions], race: ex.race, example: ex };
    ui.log.value = formatLog(ex.actions);
    ui.errors.textContent = "";
    render(describeGame(game, derive(game)));
  });

  ui.race.addEventListener("change", () => {
    game = { ...game, race: ui.race.value as Race };
    render();
  });

  let pending = 0;
  ui.log.addEventListener("input", () => {
    window.clearTimeout(pending);
    pending = window.setTimeout(() => {
      const parsed = parseLog(ui.log.value);
      history.push(game.actions);
      game = { actions: parsed.actions, race: parsed.race ?? game.race, example: null };
      ui.errors.textContent = parsed.errors.join(" ");
      render();
    }, 250);
  });

  document.querySelectorAll<HTMLButtonElement>("[data-add]").forEach((b) =>
    b.addEventListener("click", () => addAction(b.dataset.add!)),
  );
  document.querySelectorAll<HTMLButtonElement>("[data-time]").forEach((b) =>
    b.addEventListener("click", () => addSeconds(Number(b.dataset.time))),
  );
  $("add-hotkey").addEventListener("click", () => {
    const slot = ($("hk-slot") as HTMLSelectElement).value;
    const action = ($("hk-action") as HTMLSelectElement).value;
    addAction(`hotkey${slot}${action}`);
  });
  $("undo").addEventListener("click", () => {
    const previous = history.pop();
    if (!previous) {
      ui.explain.textContent = "Nothing to undo.";
      return;
    }
    game = { ...game, actions: previous, example: null };
    ui.log.value = formatLog(previous);
    render();
  });
  $("clear").addEventListener("click", () => setActions([], "Cleared. Add actions and markers with the buttons, or paste a line."));

  $("detail-jump").addEventListener("click", () => {
    if (!selected) return;
    renderImportanceChart();
    const target = ui.impChart.querySelector<HTMLElement>(`[data-feature="${selected}"]`);
    $("importance").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    target?.focus({ preventScroll: true });
  });

  document.querySelectorAll<HTMLInputElement>('input[name="measure"]').forEach((r) =>
    r.addEventListener("change", () => {
      importance.measure = r.value as Measure;
      renderImportanceChart();
      ui.impSummary.textContent = summarize(importance.measure);
    }),
  );
  ui.impOrder.addEventListener("change", () => {
    importance.order = ui.impOrder.value as Order;
    renderImportanceChart();
  });
  ui.impAll.addEventListener("change", () => {
    importance.showAll = ui.impAll.checked;
    renderImportanceChart();
  });

  ui.modelSort.addEventListener("change", () => {
    models.sort = ui.modelSort.value as ModelSort;
    renderModelChart();
  });
  ui.modelCv.addEventListener("change", () => {
    models.showCv = ui.modelCv.checked;
    renderModelChart();
  });
}

fillGameSelect();
wire();
ui.log.value = formatLog(game.actions);
render();
renderImportanceChart();
ui.impSummary.textContent = summarize(importance.measure);
renderModelChart();
ui.modelExplain.textContent = describeModel(models.selected);
