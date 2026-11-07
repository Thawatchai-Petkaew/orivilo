/**
 * The matcher of `nav-current-1` (ORV-252 row 23), clause by clause: the normalising, an exact
 * match, a parent match, the `current` override, the single winner and the missing path.
 */
import { describe, expect, it } from "vitest";
import { type CurrentCandidate, markCurrent, normalizePath } from "./current";

/** W1: the item that is marked, as `href mark`, or `none`. */
function pick(items: CurrentCandidate[], path: string | undefined): string {
  const marks = markCurrent(items, path);
  const index = marks.findIndex((mark) => mark !== null);
  return index < 0 ? "none" : `${items[index]?.href} ${marks[index]}`;
}

const top = [{ href: "/directions" }, { href: "/account" }];

describe("markCurrent, worked example W1 (nav-current-1)", () => {
  it("gives the ten results of W1 in order", () => {
    expect(
      [
        pick(top, "/"),
        pick(top, "/directions"),
        pick(top, "/directions/"),
        pick(top, "/directions?x=1"),
        pick(top, "/directions/abc"),
        pick(top, "/directionsx"),
        pick([{ href: "/directions", current: true }, { href: "/account" }], "/workspace"),
        pick([{ href: "/" }, { href: "/directions" }], "/directions"),
        pick([{ href: "/a" }, { href: "/a/b" }], "/a/b/c"),
        pick([{ href: "/directions", current: false }], "/directions"),
      ].join(", "),
    ).toBe(
      "none, /directions page, /directions page, /directions page, /directions true, none, /directions true, /directions page, /a/b true, none",
    );
  });
});

describe("markCurrent, clause by clause", () => {
  it("step 1: drops the query and the hash, and trailing slashes except on the root", () => {
    expect(normalizePath("/a/b/?x=1#top")).toBe("/a/b");
    expect(normalizePath("/a//")).toBe("/a");
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("//")).toBe("/");
    expect(normalizePath("/?x=1")).toBe("/");
    expect(pick([{ href: "/a/" }], "/a#x")).toBe("/a/ page");
  });

  it("step 2: an equal path is the page", () => {
    expect(markCurrent([{ href: "/a" }], "/a")).toEqual(["page"]);
    expect(markCurrent([{ href: "/" }], "/")).toEqual(["page"]);
  });

  it("step 3: a path under href + slash is a parent match, and an href of root never is", () => {
    expect(markCurrent([{ href: "/a" }], "/a/b")).toEqual(["true"]);
    expect(markCurrent([{ href: "/a" }], "/ab")).toEqual([null]);
    expect(markCurrent([{ href: "/" }], "/a")).toEqual([null]);
    // A path that starts with two slashes holds the prefix "//" of the root, and still no match.
    expect(markCurrent([{ href: "/" }], "//a")).toEqual([null]);
  });

  it("step 4: current true marks when the path did not, and does not outrank a match", () => {
    expect(markCurrent([{ href: "/a", current: true }], "/zzz")).toEqual(["true"]);
    expect(markCurrent([{ href: "/a", current: true }], "/a")).toEqual(["page"]);
  });

  it("step 4: current false never marks, on an exact or a parent match", () => {
    expect(markCurrent([{ href: "/a", current: false }], "/a")).toEqual([null]);
    expect(markCurrent([{ href: "/a", current: false }], "/a/b")).toEqual([null]);
  });

  it("step 5: the page wins over a longer parent match", () => {
    const items = [{ href: "/a/b" }, { href: "/a" }];
    expect(markCurrent(items, "/a")).toEqual([null, "page"]);
    expect(markCurrent([{ href: "/a", current: true }, { href: "/z" }], "/z")).toEqual([
      null,
      "page",
    ]);
  });

  it("step 5: among parent matches the longest href wins, whatever the order", () => {
    expect(markCurrent([{ href: "/a" }, { href: "/a/b" }], "/a/b/c")).toEqual([null, "true"]);
    expect(markCurrent([{ href: "/a/b" }, { href: "/a" }], "/a/b/c")).toEqual(["true", null]);
  });

  it("step 5: the length compared is the normalised href, so a query or a hash adds nothing", () => {
    // "/a?tab=overview" is 15 long raw and "/a" is 2 once normalised; "/a/b" is 4.
    expect(markCurrent([{ href: "/a/b" }, { href: "/a?tab=overview" }], "/a/b/c")).toEqual([
      "true",
      null,
    ]);
    expect(markCurrent([{ href: "/a/b#top" }, { href: "/a/?x=1" }], "/a/b/c")).toEqual([
      "true",
      null,
    ]);
  });

  it("step 5: at most one item is marked", () => {
    const items = [{ href: "/a" }, { href: "/a/b" }, { href: "/c", current: true }];
    expect(markCurrent(items, "/a/b/c").filter((mark) => mark !== null)).toHaveLength(1);
  });

  it("marks nothing without a currentPath, even for current true", () => {
    expect(markCurrent([{ href: "/a", current: true }, { href: "/" }], undefined)).toEqual([
      null,
      null,
    ]);
  });
});
