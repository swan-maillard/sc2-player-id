import { RACES, type Race } from "./features";

export interface ParsedLog {
  actions: string[];
  race?: Race;
  errors: string[];
}

// Accepts what people are likely to paste: a raw line from TRAIN.CSV ("5, Protoss, Base, s, ..."),
// the notebook's list repr ("[Base, s, ...]") or bare tokens separated by commas, spaces or new lines.
export function parseLog(text: string): ParsedLog {
  const tokens = text
    .replace(/[[\]'"]/g, " ")
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  let race: Race | undefined;
  const actions: string[] = [];
  const errors: string[] = [];

  tokens.forEach((token, i) => {
    const asRace = RACES.find((r) => r.toLowerCase() === token.toLowerCase());
    if (asRace && actions.length === 0) {
      race = asRace;
      return;
    }
    // The player id or profile url that starts a training line is the label, not an action.
    if (i === 0 && (/^\d+$/.test(token) || token.startsWith("http"))) return;

    if (token.startsWith("t") && !/^t\d+$/.test(token)) {
      errors.push(`"${token}" starts with t, so it's read as a time marker, but it has no number of seconds.`);
      return;
    }
    if (token.startsWith("hotkey") && !/^hotkey\d\d$/.test(token)) {
      errors.push(`"${token}" isn't a hotkey the data uses. They look like hotkey30: slot 3, action 0.`);
      return;
    }
    actions.push(token);
  });

  return { actions, race, errors };
}

export function formatLog(actions: string[]): string {
  return actions.join(", ");
}
