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
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

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
  if (/^[A-Z]$/.test(key)) {
    // A letter: Shift only when spelled; the key reads the same in either case.
    if (event.shiftKey !== mods.has("Shift")) return false;
    return event.key.toUpperCase() === key && event.key.length === 1;
  }
  if (/^[0-9]$/.test(key)) {
    if (event.shiftKey !== mods.has("Shift")) return false;
    return event.key === key;
  }
  // A named key or a symbol: Shift must match what is spelled, the key must read the same.
  if (event.shiftKey !== mods.has("Shift")) return false;
  return event.key === key;
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
