"use client";

import type {
  AxisPoint,
  EntryProblem,
  EntryRequest,
  FoundationNode,
  PersonalityAxis,
} from "@orivilo/intent-engine";
import { SectionHeader } from "../components/index";
import { useLocale, useMessages } from "../i18n/LocaleProvider";
import {
  FIELD_NOTE,
  foundationStateLine,
  nodeTitle,
  provisionalLines,
  uncheckedLine,
} from "./business-text";
import { ArchitectureView } from "./architecture-view";
import { IdentityFrameView } from "./identity-frame-view";
import { NameView } from "./name-view";

/**
 * One brand foundation node as a reading surface (ORV-291 design section 4): the shared head, a
 * state line with `role="status"` and, under it, the mark line of `foundation-marks-1`, then the
 * node's own fields and controls. Words only, no badge, no icon: a mark line is plain text in the
 * primary ink so the caveat is read before the value. Every name, answer and statement is a text
 * node inside `bdi`, `whitespace-pre-wrap`, never HTML and never a link. PRs 1 and 2 hold
 * Brand personality, Brand architecture and Name; PR 3 adds Core idea to the dispatch below.
 */

/** The open editor. Held by the board, so it stays while the viewer closes and opens; one at a time. */
export type FoundationEditor =
  | {
      node: "identity-frame";
      person: string;
      never: string;
      /** The points the person chose; a scale with no key has none, and no scale is ever preset. */
      axes: Partial<Record<PersonalityAxis, AxisPoint>>;
    }
  | { node: "name"; name: string }
  | null;

/** What the caller gives a view so a person can enter a value (`foundation-entry-1`). */
export interface FoundationControls {
  /** A request is running: its button shows `loading` with `business.positioning.saving`, every other button is inert. */
  pending: "saving" | null;
  /** What the server or the wrapper refused, by field path; a new value moves focus to the first field it names. */
  problems?: EntryProblem[] | null | undefined;
  /** A line already resolved by the caller (signed out, rate limited, failed), kept under the controls. */
  failure?: string | undefined;
  /** Called with an entry the view has checked; the caller checks again and calls the action. */
  onEnter: (entry: EntryRequest) => void;
  /** Cancel, or the viewer closing: drop the last outcome, so no failure line outlives its editor. */
  onDismiss?: (() => void) | undefined;
  editor: FoundationEditor;
  onEditor: (next: FoundationEditor) => void;
}

export interface FoundationNodeViewProps {
  node: FoundationNode;
  /** Draws the node's own level 2 heading; a surface that titles the node itself passes false. */
  heading?: boolean | undefined;
  /** Absent, the view shows content and labels with no control. */
  controls?: FoundationControls | undefined;
}

export function FoundationNodeView({ node, heading = true, controls }: FoundationNodeViewProps) {
  const m = useMessages();
  const locale = useLocale();
  const unchecked = uncheckedLine(m, locale, node);
  const provisional = provisionalLines(m, locale, node);
  return (
    <div className="flex min-w-0 max-w-[42rem] flex-col gap-6" data-node={node.id}>
      {heading ? <SectionHeader level={2} title={nodeTitle(m, node.id)} /> : null}
      <div className="flex flex-col gap-2" data-head>
        <p className={FIELD_NOTE} data-node-state={node.state} role="status">
          {foundationStateLine(m, locale, node)}
        </p>
        {provisional === null ? null : (
          <div className="flex flex-col gap-1" data-marks="provisional">
            <p className="text-body-sm">{provisional.provisional}</p>
            <p className="text-body-sm">{provisional.restsOn}</p>
          </div>
        )}
        {unchecked === null ? null : (
          <p className="text-body-sm" data-marks="unchecked">
            {unchecked}
          </p>
        )}
      </div>
      {node.id === "identity-frame" ? (
        <IdentityFrameView node={node} controls={controls} />
      ) : node.id === "architecture" ? (
        <ArchitectureView node={node} controls={controls} />
      ) : (
        <NameView node={node} controls={controls} />
      )}
    </div>
  );
}
