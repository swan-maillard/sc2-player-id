import {
  CUT_MARKER,
  EARLY_MAX,
  MID_MAX,
  PHASES,
  RACES,
  RATE_KEYS,
  START_MAX,
  actionKind,
  ceilActionsFromDuration,
  chunkDuration,
  chunkifyActions,
  gameFeatures,
  getPhase,
  hotkeySlot,
  isTimeMarker,
  markerSeconds,
  phaseTotals,
  rateKeysOf,
  type Chunk,
  type Features,
  type Phase,
  type PhaseTotals,
  type Race,
} from "./features";
import { EXAMPLES, PRINTED_FULL_GAME, type Example } from "./data";
import { formatLog, parseLog } from "./parse";
import { PHASE_SPAN, countWord, parseName, rowLabel } from "./describe";
import { el, plural, rate } from "./format";

export interface Game {
  actions: string[];
  race: Race;
  example: Example | null;
}

export interface Derived {
  kept: string[];
  dropped: number;
  chunks: Chunk[];
  totals: PhaseTotals;
  features: Features;
}

export function derive(game: Game): Derived {
  const kept = ceilActionsFromDuration(game.actions);
  const chunks = chunkifyActions(kept);
  return {
    kept,
    dropped: game.actions.length - kept.length,
    chunks,
    totals: phaseTotals(chunks),
    features: gameFeatures(game.actions, game.race),
  };
}

type Row =
  | { type: "window"; chunk: Chunk; phase: Phase | undefined }
  | { type: "gap"; from: number; to: number };

// The notebook drops windows with no action, so the seconds they cover never reach a rate.
// I show them anyway, greyed out, so the counted seconds add up on screen.
function displayRows(kept: string[], chunks: Chunk[]): Row[] {
  const rows: Row[] = [];
  let reached = 0;
  let stopped = false;
  for (const chunk of chunks) {
    if (chunk.start > reached) rows.push({ type: "gap", from: reached, to: chunk.start });
    stopped ||= chunk.start >= MID_MAX;
    rows.push({ type: "window", chunk, phase: stopped ? undefined : getPhase(chunk.start) });
    reached = chunk.end;
  }
  const markers = kept.filter(isTimeMarker).map(markerSeconds);
  const lastMarker = markers.length ? markers[markers.length - 1] : 0;
  if (lastMarker > reached) rows.push({ type: "gap", from: reached, to: lastMarker });
  return rows;
}

function tokenMeaning(a: string): string {
  switch (actionKind(a)) {
    case "hotkey": {
      const action = { "0": "created", "1": "updated", "2": "used" }[a.slice(-1)] ?? "pressed";
      return `hotkey slot ${hotkeySlot(a)}, ${action}`;
    }
    case "base":
      return "base selected";
    case "mineral":
      return "mineral selected";
    case "other":
      return "something else selected";
    default:
      return "not counted by any feature";
  }
}

const MAX_ROWS = 80;

export function renderWindows(host: HTMLElement, d: Derived, selected: string | null): void {
  const target = selected ? parseName(selected) : {};
  const rows = displayRows(d.kept, d.chunks);
  const list = el("ol", { class: "windows" });

  for (const row of rows.slice(0, MAX_ROWS)) {
    if (row.type === "gap") {
      list.append(
        el("li", { class: "window gap" },
          el("span", { class: "win-head" }, `${row.from} to ${row.to} s`),
          el("span", { class: "win-note" }, "no action, so these seconds aren't counted"),
        ),
      );
      continue;
    }
    const { chunk, phase } = row;
    const open = chunk.end === chunk.start;
    const span = open ? `after ${chunk.start} s` : `${chunk.start} to ${chunk.end} s`;
    const counted = phase ? `${phase}, counts ${plural(chunkDuration(chunk), "second")}` : "ignored, the count stops at 1500 s";
    const inFocus = !!target.phase && target.phase === phase;
    const li = el("li", { class: `window${inFocus ? " focus" : ""}${phase ? "" : " ignored"}` });
    li.append(el("span", { class: "win-head" }, span, el("span", { class: "win-note" }, ` ${counted}`)));

    const chips = el("span", { class: "chips" });
    for (const a of chunk.actions) {
      const hit = inFocus && !!target.key && rateKeysOf(a).includes(target.key);
      const chip = el("span", { class: `chip kind-${actionKind(a)}${hit ? " hit" : ""}`, title: tokenMeaning(a) }, a);
      chips.append(chip);
    }
    li.append(chips);
    list.append(li);
  }
  host.replaceChildren(list);
  if (rows.length > MAX_ROWS) {
    host.append(el("p", { class: "note" }, `${rows.length - MAX_ROWS} more windows not drawn, but counted in the rates.`));
  }
  if (d.dropped > 0) {
    host.append(el("p", { class: "note" }, `${plural(d.dropped, "token")} after ${CUT_MARKER} cut off, as in the notebook.`));
  }
  if (rows.length === 0) {
    host.append(el("p", { class: "note" }, "No actions yet. Pick a game or add some with the buttons above."));
  }
}

const x = (t: number) => `${(t / MID_MAX) * 100}%`;

export function renderPhaseBar(host: HTMLElement, d: Derived, selected: string | null): void {
  const focus = selected ? parseName(selected).phase : undefined;
  const bounds: Record<Phase, [number, number]> = { start: [0, START_MAX], early: [START_MAX, EARLY_MAX], mid: [EARLY_MAX, MID_MAX] };
  const track = el("div", { class: "phase-track" });
  for (const p of PHASES) {
    const [a, b] = bounds[p];
    const band = el("span", { class: `band${focus === p ? " focus" : ""}` });
    band.style.left = x(a);
    band.style.width = `calc(${x(b - a)} - 2px)`;
    track.append(band);
  }
  for (const chunk of d.chunks) {
    if (chunk.start >= MID_MAX) break;
    const counted = el("span", { class: "counted" });
    counted.style.left = x(chunk.start);
    counted.style.width = `max(2px, ${x(Math.min(chunkDuration(chunk), MID_MAX - chunk.start))})`;
    track.append(counted);
  }
  const ticks = el("div", { class: "phase-ticks" });
  for (const t of [0, START_MAX, EARLY_MAX, MID_MAX]) {
    const tick = el("span", { class: `tick${t === 0 || t === START_MAX ? " first" : t === MID_MAX ? " last" : ""}` }, t === 0 ? "0" : `${t} s`);
    tick.style.left = x(t);
    ticks.append(tick);
  }
  const parts = PHASES.map((p) => `${p} counts ${plural(d.totals.durations[p], "second")}`);
  host.setAttribute("aria-label", `Game time from 0 to 1500 seconds, split into start (0 to 60 s), early (60 to 360 s) and mid (360 to 1500 s). Counted windows are filled in. In this log, ${parts.join(", ")}.`);
  host.replaceChildren(track, ticks);
}

export function renderPhaseLegend(host: HTMLElement, d: Derived): void {
  const actionsIn = (p: Phase) => {
    let n = 0;
    for (const c of d.chunks) {
      if (c.start >= MID_MAX) break;
      if (getPhase(c.start) === p) n += c.actions.length;
    }
    return n;
  };
  host.replaceChildren(
    ...PHASES.map((p) => {
      const n = actionsIn(p);
      return el("li", {},
        el("span", { class: "phase-name" }, p),
        ` ${PHASE_SPAN[p]}: ${plural(d.totals.durations[p], "second")} counted, ${plural(n, "action")}`,
      );
    }),
  );
}

const GROUPS: { title: string; keys: (typeof RATE_KEYS)[number][] }[] = [
  { title: "Hotkey presses, by slot", keys: ["hk_0", "hk_1", "hk_2", "hk_3", "hk_4", "hk_5", "hk_6", "hk_7", "hk_8", "hk_9"] },
  { title: "Hotkeys created or used", keys: ["hk_created", "hk_used"] },
  { title: "Selections", keys: ["base", "mineral", "other"] },
];

export function renderRates(table: HTMLTableElement, d: Derived, selected: string | null, onPick: (name: string) => void): void {
  const values = PHASES.flatMap((p) => RATE_KEYS.map((k) => d.features[`${p}_${k}`]));
  const max = Math.max(...values, 1e-9);

  const head = el("thead", {}, el("tr", {},
    el("th", { scope: "col" }, el("span", { class: "visually-hidden" }, "Rate")),
    ...PHASES.map((p) => el("th", { scope: "col" }, p)),
  ));
  const body = el("tbody");
  for (const group of GROUPS) {
    body.append(el("tr", { class: "group" }, el("th", { scope: "rowgroup", colspan: "4" }, group.title)));
    for (const key of group.keys) {
      const tr = el("tr", {}, el("th", { scope: "row" }, rowLabel(key)));
      for (const p of PHASES) {
        const name = `${p}_${key}`;
        const v = d.features[name];
        const button = el("button", {
          type: "button",
          class: `cell${v === 0 ? " zero" : ""}`,
          "aria-pressed": String(selected === name),
          "aria-label": `${name} = ${rate(v)}`,
          "data-feature": name,
        }, rate(v));
        // Shade by value so the busy cells stand out. Each cell keeps its number, so colour isn't needed to read it.
        button.style.setProperty("--fill", String(v === 0 ? 0 : 0.12 + 0.5 * (v / max)));
        button.addEventListener("click", () => onPick(name));
        tr.append(el("td", {}, button));
      }
      body.append(tr);
    }
  }
  table.replaceChildren(head, body);
}

export function renderRace(host: HTMLElement, d: Derived, selected: string | null, onPick: (name: string) => void): void {
  host.replaceChildren(
    ...RACES.map((r) => {
      const name = `played_race_${r}`;
      const b = el("button", {
        type: "button",
        class: `cell race${d.features[name] ? "" : " zero"}`,
        "aria-pressed": String(selected === name),
        "data-feature": name,
      }, el("span", { class: "race-name" }, r), ` ${d.features[name]}`);
      b.style.setProperty("--fill", d.features[name] ? "0.5" : "0");
      b.addEventListener("click", () => onPick(name));
      return b;
    }),
  );
}

export function renderFullGame(host: HTMLElement, game: Game, d: Derived): void {
  const printed = game.example ? PRINTED_FULL_GAME[game.example.id] : undefined;
  host.hidden = !printed;
  if (!printed || !game.example) return;
  const rows = Object.entries(printed).map(([name, full]) =>
    el("tr", {},
      el("th", { scope: "row" }, el("code", {}, name)),
      el("td", {}, rate(d.features[name])),
      el("td", {}, String(full)),
    ),
  );
  host.querySelector("table")!.replaceChildren(
    el("thead", {}, el("tr", {},
      el("th", { scope: "col" }, "Feature"),
      el("th", { scope: "col" }, "From the log above"),
      el("th", { scope: "col" }, "Whole game, as printed"),
    )),
    el("tbody", {}, ...rows),
  );
}

export function describeGame(game: Game, d: Derived): string {
  const ex = game.example;
  const who = ex
    ? `${ex.label}${ex.player !== undefined ? `, player ${ex.player}` : ex.id.startsWith("test") ? ", player unknown (test set)" : ""}, ${game.race}.`
    : `Your log, played as ${game.race}.`;
  const nActions = d.kept.filter((a) => !isTimeMarker(a)).length;
  const nMarkers = d.kept.length - nActions;
  if (nActions === 0) return `${who} No actions yet, so all 45 rates are 0. Only the race columns say anything.`;

  const live = PHASES.filter((p) => d.totals.durations[p] > 0);
  const counted = live.map((p) => `${p} ${plural(d.totals.durations[p], "second")}`).join(", ");
  const open = d.chunks.length > 0 && d.chunks[d.chunks.length - 1].end === d.chunks[d.chunks.length - 1].start;
  let text = `${who} ${plural(nActions, "action")} and ${plural(nMarkers, "time marker")} make ${plural(d.chunks.length, "window")}. Counted time: ${counted}.`;
  if (open) text += " The actions after the last marker form an open window, which the notebook counts as 1 second.";
  const empty = PHASES.filter((p) => d.totals.durations[p] === 0);
  if (empty.length) text += ` Nothing reaches ${empty.join(" or ")}, so those rates stay at 0.`;
  if (ex?.player === 53) text += " Games 0, 2 and 4 all belong to player 53, and all three create hotkey 3 within the first seconds.";
  if (ex?.player === 29) text += " Games 1 and 3 both belong to player 29: in the part we have, three base selections each and no hotkey yet.";
  return text;
}

export function describeFeature(name: string, game: Game, d: Derived): string {
  const parsed = parseName(name);
  if (parsed.race) {
    return `${name} is ${d.features[name]}: this game was played as ${game.race}. The race isn't in the keystrokes, it's the second field of every line, so it goes in as three 0 or 1 columns.`;
  }
  const phase = parsed.phase!;
  const key = parsed.key!;
  const count = d.totals.counts[phase][key];
  const secs = d.totals.durations[phase];
  if (secs === 0) {
    return `${name} is 0. No window starts in the ${phase} phase (${PHASE_SPAN[phase]}) in this log, and the notebook sets every rate of an empty phase to 0.`;
  }
  const words = count === 0 ? `no ${countWord(key, 2)}` : `${count} ${countWord(key, count)}`;
  return `${name} = ${count} ÷ ${secs} = ${rate(d.features[name])}. That's ${words} in the ${phase} phase (${PHASE_SPAN[phase]}), which has ${plural(secs, "counted second")}.`;
}

export { EXAMPLES, formatLog, parseLog, tokenMeaning };
