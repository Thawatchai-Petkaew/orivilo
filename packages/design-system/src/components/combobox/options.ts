import type { SelectGroup, SelectOption } from "../select/Select";

/** Case-insensitive substring match; a blank query matches. The method of `CommandMenu`, kept here so Combobox does not import board code. No Thai folding: a query missing a tone mark does not match. */
export function matches(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.trim().toLowerCase());
}

/** An option stays when its label and description match the query. Disabled options stay. */
export function filterOptions(
  options: readonly SelectOption[],
  query: string,
): readonly SelectOption[] {
  return options.filter((option) =>
    matches(option.description ? `${option.label} ${option.description}` : option.label, query),
  );
}

/** Groups after the filter; a group with no option left is dropped. */
export function filterGroups(
  groups: readonly SelectGroup[],
  query: string,
): readonly SelectGroup[] {
  return groups
    .map((group) => ({ label: group.label, options: filterOptions(group.options, query) }))
    .filter((group) => group.options.length > 0);
}

/** The phase of an async search. A local list is always `idle`. */
export type SearchPhase = "idle" | "pending" | "error";

export interface StatusState {
  /** The popup is open, with a list or with a line in place of one. */
  open: boolean;
  /** The list comes from `search`, not from a local filter. */
  async: boolean;
  phase: SearchPhase;
  query: string;
  /** Options left, a group heading does not count. */
  count: number;
}

/** What the status region and the visible line say; `emptyText` is the caller's line or `select.empty`. */
export type StatusKey =
  | ""
  | "combobox.pending"
  | "combobox.error"
  | "combobox.prompt"
  | "emptyText"
  | "combobox.empty"
  | "combobox.countOne"
  | "combobox.count";

/** The six cases of `cbx-status-1`, in order. */
export function statusKey({ open, async: isAsync, phase, query, count }: StatusState): StatusKey {
  if (!open) return "";
  if (phase === "pending") return "combobox.pending";
  if (phase === "error") return "combobox.error";
  if (count === 0) {
    if (query.trim() === "") return isAsync ? "combobox.prompt" : "emptyText";
    return "combobox.empty";
  }
  return count === 1 ? "combobox.countOne" : "combobox.count";
}

/**
 * The next enabled option from `active` (-1 for none) in `direction`, wrapping. From none, down
 * takes the first enabled option and up the last. Returns -1 when every option is disabled.
 */
export function nextActive(active: number, direction: 1 | -1, disabled: readonly boolean[]) {
  const n = disabled.length;
  for (let i = 1; i <= n; i++) {
    const k = active < 0 ? (direction > 0 ? i - 1 : n - i) : (active + direction * i + n * n) % n;
    if (!disabled[k]) return k;
  }
  return -1;
}
