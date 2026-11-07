/** How one item is marked: `page` for the page itself, `true` for a place that holds it. */
export type CurrentMark = "page" | "true";

/** What the matcher reads of an item: its `href` and the caller's own `current` override. */
export interface CurrentCandidate {
  href: string;
  /** `true` marks the item when the path does not; `false` never marks it. */
  current?: boolean | undefined;
}

/** Drops the query and the hash, and the trailing slashes except on the root (`nav-current-1` step 1). */
export function normalizePath(path: string): string {
  const bare = (path.split(/[?#]/)[0] ?? "").replace(/\/+$/, "");
  return bare === "" ? "/" : bare;
}

function markOf(href: string, path: string): CurrentMark | null {
  const own = normalizePath(href);
  if (own === path) return "page";
  // An href of "/" holds every path, so it never matches as a parent.
  return own !== "/" && path.startsWith(`${own}/`) ? "true" : null;
}

/**
 * The one matcher of both navigations in every form (`nav-current-1`). It returns one entry per
 * item, in order, and at most one entry is not null: an exact match wins, then the longest `href`
 * among the places that hold the path. With no `currentPath` nothing is marked.
 */
export function markCurrent(
  items: readonly CurrentCandidate[],
  currentPath: string | undefined,
): (CurrentMark | null)[] {
  if (currentPath === undefined) return items.map(() => null);
  const path = normalizePath(currentPath);
  const hits = items.flatMap((item, index) => {
    if (item.current === false) return [];
    const mark = markOf(item.href, path) ?? (item.current === true ? "true" : null);
    return mark ? [{ index, mark, length: normalizePath(item.href).length }] : [];
  });
  const winner =
    hits.find((hit) => hit.mark === "page") ?? [...hits].sort((a, b) => b.length - a.length)[0];
  return items.map((_, index) => (winner?.index === index ? winner.mark : null));
}
