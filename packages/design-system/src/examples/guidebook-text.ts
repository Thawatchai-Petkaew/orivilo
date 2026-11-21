import type {
  GuidebookHypothesisKey,
  GuidebookItemId,
  GuidebookLeadId,
  GuidebookNote,
  GuidebookNotHeldId,
  GuidebookQuestionKey,
  GuidebookStateKey,
  MarkRef,
  PersonalityAxis,
} from "@orivilo/intent-engine";
import type { Locale } from "../i18n/locale";
import { fill, type Messages } from "../i18n/messages/index";
import { familyWord, listOfNodes, nodeTitle } from "./business-text";

/**
 * Looks the guidebook's keys up in the catalog (ORV-302 tech notes section 6). The engine's
 * `Guidebook` holds keys and values only; these helpers turn a key into the line of the page's
 * language. `guidebook-text.test.ts` proves every key of the engine's closed lists resolves in both
 * languages.
 */

/** The title of an item or a lead line: the node's title; the logo mark has its own line. */
export function itemTitle(m: Messages, id: GuidebookItemId | GuidebookLeadId | MarkRef): string {
  return id === "logo-mark" ? m.business.node.logoMark : nodeTitle(m, id);
}

/** The legend of a personality scale: `business.identity.axisLegend` with the words of its two ends. */
export function axisLegendLine(m: Messages, axis: PersonalityAxis): string {
  return fill(m.business.identity.axisLegend, {
    low: m.business.axis[axis].low,
    high: m.business.axis[axis].high,
  });
}

/**
 * The board's state line of an item or a lead line (`business.state.*`); for `waiting` the line with
 * the nodes the item waits for, joined by `Intl.ListFormat` in the page's locale.
 */
export function guidebookStateLine(
  m: Messages,
  locale: Locale,
  item: { state: GuidebookStateKey; waitingFor?: readonly MarkRef[] },
): string {
  return item.state === "waiting"
    ? fill(m.business.state.waiting, { nodes: listOfNodes(m, locale, item.waitingFor ?? []) })
    : m.business.state[item.state];
}

/** The text of a dotted catalog key such as `business.question.only`; a key with no text throws. */
function catalogLine(m: Messages, key: string): string {
  let at: unknown = m;
  for (const part of key.split(".")) {
    at = typeof at === "object" && at !== null ? (at as Record<string, unknown>)[part] : undefined;
  }
  if (typeof at !== "string") throw new Error(`guidebook: no catalog line for ${key}`);
  return at;
}

/** The question line of guidebook-open-1 (a key of `business.question.*`). */
export function questionLine(m: Messages, key: GuidebookQuestionKey): string {
  return catalogLine(m, key);
}

/** The hypothesis label of a done item (guidebook-item-1, column "Hypothesis label"). */
export function hypothesisLine(m: Messages, key: GuidebookHypothesisKey): string {
  return catalogLine(m, key);
}

/** The line under an item's state line, beyond its questions (guidebook-open-1). */
export function noteLine(m: Messages, note: GuidebookNote): string {
  switch (note.key) {
    case "business.architecture.notInVersion":
      return m.business.architecture.notInVersion;
    case "business.guidebook.notYet.logoMark":
      return m.business.guidebook.notYet.logoMark;
    case "business.positioning.stale":
      return m.business.positioning.stale;
    case "business.color.waitsForLineup":
      return m.business.color.waitsForLineup;
    case "business.color.needsPersonality":
      return m.business.color.needsPersonality;
    case "business.color.bothCrowded":
      return fill(m.business.color.bothCrowded, {
        first: familyWord(m, note.first),
        second: familyWord(m, note.second),
      });
    case "business.color.notDecided":
      return m.business.color.notDecided;
  }
}

/** The title and the reason of a node ORV-126 names that this version does not hold (W3). */
export function notHeldLines(
  m: Messages,
  id: GuidebookNotHeldId,
): { title: string; reason: string } {
  return m.business.guidebook.notHeld[id];
}
