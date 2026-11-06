import { describe, expect, it } from "vitest";
import { fixtures } from "../fixtures";
import {
  filterGroups,
  filterOptions,
  matches,
  nextActive,
  statusKey,
  type StatusState,
} from "./options";

/** The six strings `comboboxFixtures.options` takes (worked example W1). */
const LABELS = [
  fixtures.thai,
  fixtures.latin,
  fixtures.mixed,
  fixtures.thaiMarks,
  fixtures.thaiMarks2,
  fixtures.longThai,
];

describe("matches (cbx-filter-1, W1)", () => {
  it.each([
    ["brand", 1],
    ["SAVE", 1],
    ["ปิ่น", 1],
    // Without its tone mark the query does not match: no Thai folding.
    ["ปิน", 0],
    ["โต", 1],
    ["แบรนด์", 1],
    ["   ", 6],
  ])("query %j keeps %i of the six labels", (query, count) => {
    expect(LABELS.filter((label) => matches(label, query))).toHaveLength(count);
  });
});

describe("filterOptions and filterGroups (cbx-filter-1)", () => {
  const options = [
    { value: "a", label: "Alpha", description: "first letter" },
    { value: "b", label: "Beta", disabled: true },
    { value: "c", label: "Gamma" },
  ];

  it("matches the label and the description, and keeps a disabled option", () => {
    expect(filterOptions(options, "letter").map((o) => o.value)).toEqual(["a"]);
    expect(filterOptions(options, "BET").map((o) => o.value)).toEqual(["b"]);
    expect(filterOptions(options, "").map((o) => o.value)).toEqual(["a", "b", "c"]);
  });

  it("drops a group with no option left", () => {
    const groups = [
      { label: "One", options: options.slice(0, 1) },
      { label: "Two", options: options.slice(2) },
    ];
    expect(filterGroups(groups, "gam").map((g) => g.label)).toEqual(["Two"]);
    expect(filterGroups(groups, "zzz")).toEqual([]);
  });
});

describe("statusKey (cbx-status-1, W3)", () => {
  const s = (
    open: boolean,
    async_: boolean,
    phase: StatusState["phase"],
    query: string,
    count: number,
  ): StatusState => ({ open, async: async_, phase, query, count });

  it.each([
    [s(false, false, "idle", "", 7), ""],
    [s(true, false, "idle", "แบรนด์", 1), "combobox.countOne"],
    [s(true, false, "idle", "", 7), "combobox.count"],
    [s(true, false, "idle", "ปิน", 0), "combobox.empty"],
    [s(true, false, "idle", "", 0), "emptyText"],
    [s(true, true, "idle", "", 0), "combobox.prompt"],
    [s(true, true, "pending", "ปิ่", 0), "combobox.pending"],
    [s(true, true, "idle", "ปิ่", 1), "combobox.countOne"],
    [s(true, true, "idle", "zzz", 0), "combobox.empty"],
    [s(true, true, "error", "zzz", 0), "combobox.error"],
  ])("state %#", (state, key) => {
    expect(statusKey(state)).toBe(key);
  });

  it("treats a blank query of spaces as blank", () => {
    expect(statusKey(s(true, true, "idle", "   ", 0))).toBe("combobox.prompt");
  });

  it("says nothing while closed, whatever the phase", () => {
    expect(statusKey(s(false, true, "pending", "ปิ่", 0))).toBe("");
    expect(statusKey(s(false, true, "error", "ปิ่", 0))).toBe("");
  });
});

describe("nextActive (cbx-keys-1, W5)", () => {
  const disabled = [false, false, true, false, false, false, false];

  it.each([
    [-1, 1, 0],
    [1, 1, 3],
    [6, 1, 0],
    [0, -1, 6],
    [3, -1, 1],
    [-1, -1, 6],
  ] as const)("from %i in direction %i lands on %i", (active, direction, expected) => {
    expect(nextActive(active, direction, disabled)).toBe(expected);
  });

  it("reaches the last option from none, and the active option itself when it is the only one enabled", () => {
    expect(nextActive(-1, 1, [true, true, false])).toBe(2);
    expect(nextActive(-1, -1, [false, true, true])).toBe(0);
    expect(nextActive(1, 1, [true, false, true])).toBe(1);
    expect(nextActive(1, -1, [true, false, true])).toBe(1);
  });

  it("returns -1 when every option is disabled or there is none", () => {
    expect(
      nextActive(
        -1,
        1,
        disabled.map(() => true),
      ),
    ).toBe(-1);
    expect(nextActive(-1, 1, [])).toBe(-1);
  });
});
