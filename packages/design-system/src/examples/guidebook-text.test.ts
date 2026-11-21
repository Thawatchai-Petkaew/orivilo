import {
  GUIDEBOOK_FOUNDATION,
  GUIDEBOOK_HYPOTHESIS,
  GUIDEBOOK_LEAD,
  GUIDEBOOK_NOT_HELD,
  GUIDEBOOK_QUESTIONS,
  GUIDEBOOK_VISUAL,
  type GuidebookNote,
  PERSONALITY_AXES,
} from "@orivilo/intent-engine";
import { describe, expect, it } from "vitest";
import { DATE_TAGS, LOCALES } from "../i18n/locale";
import { messagesFor } from "../i18n/messages/index";
import {
  axisLegendLine,
  guidebookStateLine,
  hypothesisLine,
  itemTitle,
  noteLine,
  notHeldLines,
  questionLine,
} from "./guidebook-text";

/**
 * ORV-302 tech notes T19 (spec rows 1 and 14): the guidebook's text helpers look the engine's keys
 * up in the catalog in both languages. Each helper resolves every key the engine's closed lists
 * name, so a key with no line fails here and not on a page.
 */

const ALL_ITEMS = [...GUIDEBOOK_FOUNDATION, ...GUIDEBOOK_VISUAL] as const;

const NOTES: GuidebookNote[] = [
  { key: "business.architecture.notInVersion" },
  { key: "business.guidebook.notYet.logoMark" },
  { key: "business.positioning.stale" },
  { key: "business.color.waitsForLineup" },
  { key: "business.color.needsPersonality" },
  { key: "business.color.bothCrowded", first: "lime", second: "cyan" },
  { key: "business.color.notDecided" },
];

describe.each(LOCALES)("the guidebook's text helpers in %s", (locale) => {
  const m = messagesFor(locale);

  it("titles all thirteen ids, each with a line of its own", () => {
    const ids = [...GUIDEBOOK_LEAD, ...ALL_ITEMS];
    expect(ids).toHaveLength(13);
    const titles = ids.map((id) => itemTitle(m, id));
    for (const title of titles) expect(title).not.toBe("");
    expect(new Set(titles).size).toBe(13);
    expect(itemTitle(m, "logo-mark")).toBe(m.business.node.logoMark);
    expect(itemTitle(m, "situation")).toBe(m.business.node.situation);
    expect(itemTitle(m, "color")).toBe(m.business.node.color);
  });

  it("fills the nodes a waiting item waits for with the page's list format", () => {
    const line = guidebookStateLine(m, locale, {
      state: "waiting",
      waitingFor: ["positioning", "name"],
    });
    const list = new Intl.ListFormat(DATE_TAGS[locale], { type: "conjunction" }).format([
      m.business.node.positioning,
      m.business.node.name,
    ]);
    expect(line).toBe(m.business.state.waiting.replace("{nodes}", list));
    expect(line).toContain(list);
  });

  it("resolves partly, needsAnswer and every other state to the board's line", () => {
    for (const state of [
      "agreed",
      "given",
      "derived",
      "partly",
      "needsAnswer",
      "skipped",
      "empty",
      "notInVersion",
      "proposed",
      "awaitingChoice",
    ] as const) {
      expect(guidebookStateLine(m, locale, { state })).toBe(m.business.state[state]);
    }
    expect(guidebookStateLine(m, locale, { state: "partly" })).not.toBe(
      guidebookStateLine(m, locale, { state: "derived" }),
    );
  });

  it("resolves every question key of the closed table", () => {
    const keys = [...new Set(Object.values(GUIDEBOOK_QUESTIONS).flat())];
    expect(keys).toHaveLength(8);
    for (const key of keys) {
      const line = questionLine(m, key);
      expect(line).not.toBe("");
      expect(line).toBe(m.business.question[key.slice("business.question.".length) as never]);
    }
  });

  it("resolves every note, the two families of a crowded colour filled in", () => {
    const lines = NOTES.map((note) => noteLine(m, note));
    for (const line of lines) expect(line).not.toBe("");
    expect(new Set(lines).size).toBe(NOTES.length);
    expect(noteLine(m, { key: "business.color.bothCrowded", first: "lime", second: "cyan" })).toBe(
      m.business.color.bothCrowded
        .replace("{first}", m.business.color.family.lime)
        .replace("{second}", m.business.color.family.cyan),
    );
  });

  it("resolves each hypothesis key of the closed table", () => {
    for (const key of Object.values(GUIDEBOOK_HYPOTHESIS)) {
      expect(hypothesisLine(m, key)).not.toBe("");
    }
    expect(hypothesisLine(m, "business.identity.hypothesis")).toBe(m.business.identity.hypothesis);
  });

  it("names the two ends of each of the five personality scales", () => {
    const legends = PERSONALITY_AXES.map((axis) => axisLegendLine(m, axis));
    expect(new Set(legends).size).toBe(5);
    expect(axisLegendLine(m, "warm")).toBe(
      m.business.identity.axisLegend
        .replace("{low}", m.business.axis.warm.low)
        .replace("{high}", m.business.axis.warm.high),
    );
  });

  it("gives each of the eight nodes not held a title and a reason", () => {
    expect(GUIDEBOOK_NOT_HELD).toHaveLength(8);
    for (const id of GUIDEBOOK_NOT_HELD) {
      const { title, reason } = notHeldLines(m, id);
      expect(title).toBe(m.business.guidebook.notHeld[id].title);
      expect(reason).toBe(m.business.guidebook.notHeld[id].reason);
      expect(title).not.toBe("");
      expect(reason).not.toBe("");
    }
  });

  it("throws on a key with no line, and on a key that names a group instead of a line", () => {
    expect(() => questionLine(m, "business.question.nope" as never)).toThrow(
      "guidebook: no catalog line for business.question.nope",
    );
    expect(() => questionLine(m, "business.question" as never)).toThrow(
      "guidebook: no catalog line for business.question",
    );
    expect(() => hypothesisLine(m, "business.nope.nope" as never)).toThrow(
      "guidebook: no catalog line for business.nope.nope",
    );
  });
});
