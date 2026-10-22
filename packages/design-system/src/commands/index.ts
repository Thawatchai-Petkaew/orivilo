/**
 * The canvas command registry at runtime (ADR 0004 item 5): the generated list and the one place
 * a keyboard event is matched against a shortcut. Components never spell a key; they ask
 * `commandForKey` which registry command, if any, the event means in the scopes that apply.
 *
 * Shortcut spelling (checked by tests/check-commands.test.ts): `Mod`, `Shift`, `Alt` joined with
 * `+` before one key. `Mod` is Command on macOS and Control elsewhere. A letter or digit key
 * matches without Shift unless Shift is spelled; a named key (`ArrowUp`, `Delete`, `F2`) matches
 * `event.key` exactly; a symbol (`/`, `=`, `-`) matches `event.key` exactly.
 */
import { COMMANDS, COMMAND_SCOPES } from "./generated";

export { COMMANDS, COMMAND_SCOPES, COMMAND_SURFACES, COMMAND_REGISTRY_VERSION } from "./generated";

export type Command = (typeof COMMANDS)[number];
export type CommandId = Command["id"];
export type CommandScope = keyof typeof COMMAND_SCOPES;

/** The part of a keyboard event the matcher reads; a React or DOM KeyboardEvent fits. */
export interface KeyLike {
  key: string;
  /** The physical key (`KeyV`, `Digit1`, `Slash`); lets a shortcut work under a Thai layout. */
  code?: string | undefined;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

/** The `event.code` of each symbol the registry may spell, for layouts where Shift changes `key`. */
const SYMBOL_CODE: Record<string, string> = {
  "/": "Slash",
  "=": "Equal",
  "-": "Minus",
  ".": "Period",
  ",": "Comma",
  "[": "BracketLeft",
  "]": "BracketRight",
  "\\": "Backslash",
  ";": "Semicolon",
  "'": "Quote",
  "`": "Backquote",
};

/** True on Apple platforms, where `Mod` is Command. Read once per call so tests can pass it. */
export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = `${navigator.platform ?? ""} ${navigator.userAgent ?? ""}`;
  return /Mac|iPhone|iPad|iPod/.test(ua);
}

export function commandById(id: CommandId): Command {
  const found = COMMANDS.find((c) => c.id === id);
  if (!found) throw new Error(`no command ${id}`);
  return found;
}

/** The shortcuts the registry gives a command, as spelled there. */
export function shortcutsOf(id: CommandId): readonly string[] {
  return commandById(id).shortcuts;
}

/** Whether a keyboard event is the given shortcut. */
export function eventMatches(event: KeyLike, shortcut: string, apple = isApplePlatform()): boolean {
  const parts = shortcut.split("+");
  const key = parts.at(-1) ?? "";
  const mods = new Set(parts.slice(0, -1));
  const wantMod = mods.has("Mod");
  const modDown = apple ? event.metaKey : event.ctrlKey;
  const otherModDown = apple ? event.ctrlKey : event.metaKey;
  if (modDown !== wantMod || otherModDown) return false;
  if (event.altKey !== mods.has("Alt")) return false;
  // Shift must match what is spelled for every key; the key itself may read as its shifted
  // form ("?" for Shift+/, "!" for Shift+1) or as a Thai letter under a Thai layout, so the
  // physical key (`event.code`) counts as the same key.
  if (event.shiftKey !== mods.has("Shift")) return false;
  if (/^[A-Z]$/.test(key)) {
    return (
      (event.key.toUpperCase() === key && event.key.length === 1) || event.code === `Key${key}`
    );
  }
  if (/^[0-9]$/.test(key)) {
    return event.key === key || event.code === `Digit${key}`;
  }
  const code = SYMBOL_CODE[key];
  return event.key === key || (code !== undefined && event.code === code);
}

/**
 * The first registry command in the given scopes (in order) whose shortcut the event matches, or
 * undefined. The caller passes the scopes that are active, most specific first (`node` before
 * `selection` before `board` before `app`), so an id that repeats a key across scopes resolves to
 * the active one.
 */
export function commandForKey(
  event: KeyLike,
  scopes: readonly CommandScope[],
  apple = isApplePlatform(),
): Command | undefined {
  for (const scope of scopes) {
    for (const command of COMMANDS) {
      if (command.scope !== scope) continue;
      if (command.shortcuts.some((s) => eventMatches(event, s, apple))) return command;
    }
  }
  return undefined;
}

/** The commands of one scope, in registry order. */
export function commandsInScope(scope: CommandScope): Command[] {
  return COMMANDS.filter((c) => c.scope === scope);
}

/**
 * The story this build of the package implements up to. A command whose `since` is later is in
 * the registry (so the shortcut sheet can list it with the story that brings it) but no surface
 * offers it (AGENTS.md rule 4: never show what does not work).
 */
export const CURRENT_STORY = "E4-3";

/** Story keys compare by epic then number: E4-10 is after E4-3. */
export function storyOrder(key: string): number {
  const m = /^E(\d+)-(\d+)$/.exec(key);
  if (!m) return Number.MAX_SAFE_INTEGER;
  return Number(m[1]) * 1000 + Number(m[2]);
}

export function commandAvailable(command: Command, current: string = CURRENT_STORY): boolean {
  return storyOrder(command.since) <= storyOrder(current);
}

export type CommandSurface = Command["surfaces"][number];

/**
 * The available commands a surface shows, in registry order, limited to the given scopes when the
 * surface is contextual (a context menu on a node shows node, selection and board items).
 */
export function surfaceCommands(
  surface: CommandSurface,
  scopes?: readonly CommandScope[],
  current: string = CURRENT_STORY,
): Command[] {
  return COMMANDS.filter(
    (c) =>
      (c.surfaces as readonly string[]).includes(surface) &&
      commandAvailable(c, current) &&
      (!scopes || scopes.includes(c.scope)),
  );
}
