"use client";

import type { BusinessView } from "@orivilo/intent-engine";
import { useMemo, useRef, useState } from "react";
import {
  Alert,
  type BoardNode,
  Button,
  CanvasBoard,
  CanvasControls,
  Dialog,
  DialogContent,
  type Graph,
  PageHeader,
  ScrollArea,
} from "../components/index";
import { useLocale, useMessages } from "../i18n/LocaleProvider";
import { fill } from "../i18n/messages/index";
import { BusinessAccessNotice, type BusinessAccess } from "./business-access";
import { boardGraphOf } from "./business-graph";
import {
  BusinessNodeView,
  type PositioningControls,
  type PositioningEditor,
} from "./business-node-view";
import {
  FIELD_NOTE,
  fieldLabel,
  formatSavedAt,
  foundationFieldLabel,
  foundationStateLine,
  nodeTitle,
  readReasonLine,
} from "./business-text";
import {
  type FoundationControls,
  type FoundationEditor,
  FoundationNodeView,
} from "./foundation-view";
import { TrueHandles } from "./true-handles";

/**
 * The project board screen, slice 2 (ORV-281 design sections 6.1 and 6.3, ORV-282): the project
 * name, what the page holds, when it was saved, then the five business nodes on a read-only present
 * board. A node at rest is a card with its state and the names of its fields, never an answer: each
 * answer must carry its label, which belongs in the view. Opening a node (click, Enter or Space)
 * shows that node's view in a viewer dialog. It takes a `BusinessView`, which holds keys and values
 * and no resolved text, so a language switch redraws it with no second load. Slice 3 (ORV-283): when
 * the saved record has no model reading, an info Alert under the header says AI did not read and
 * why, and the viewer's view carries the readings or the same line. Slice 4 (ORV-285): the Positioning
 * node shows the state of its gate on the card and holds the controls to draft options, pick or edit one,
 * write one's own statement or skip in its view. The text of an open editor is held here, so it stays while the viewer closes and
 * opens. It knows no route and no action: the page's wrapper gives it `positioning`. ORV-291: the
 * foundation nodes of the view follow the business nodes on the same board; a card shows its state
 * line and the names of its fields, never an answer, and opening it shows `FoundationNodeView`.
 */
export interface BusinessBoardScreenProps {
  access: BusinessAccess;
  /** Where the sign-in link goes on a signed-out screen. */
  signInHref: string;
  /** Where the project list is. */
  listHref: string;
  /** The project's brand guidebook (ORV-302). Absent, the header has no link to it. */
  guidebookHref?: string | undefined;
  /** The saved project. Required when `access` is `ready`, ignored otherwise. */
  view?: BusinessView | undefined;
  /**
   * The Positioning gate's decision: the request that is running, what the server refused or failed
   * with, and what to call. Absent, the view shows the statement and its labels with no control.
   */
  positioning?: Omit<PositioningControls, "editor" | "onEditor"> | undefined;
  /** The foundation nodes' entries, as `positioning` is for the gate. Absent, their views show no control. */
  foundation?: Omit<FoundationControls, "editor" | "onEditor"> | undefined;
}

export function BusinessBoardScreen(props: BusinessBoardScreenProps) {
  const m = useMessages();
  if (props.access !== "ready") {
    return (
      <div className="@container mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-6 p-6 wrap-anywhere">
        <PageHeader title={m.business.list.heading} />
        <BusinessAccessNotice access={props.access} signInHref={props.signInHref} />
      </div>
    );
  }
  if (props.view === undefined) throw new Error("BusinessBoardScreen: access ready needs a view");
  return (
    <ReadyBoard
      view={props.view}
      listHref={props.listHref}
      guidebookHref={props.guidebookHref}
      positioning={props.positioning}
      foundation={props.foundation}
    />
  );
}

function ReadyBoard({
  view,
  listHref,
  guidebookHref,
  positioning,
  foundation,
}: {
  view: BusinessView;
  listHref: string;
  guidebookHref: string | undefined;
  positioning: BusinessBoardScreenProps["positioning"];
  foundation: BusinessBoardScreenProps["foundation"];
}) {
  const m = useMessages();
  const locale = useLocale();
  const built = useMemo(() => boardGraphOf(view, m), [view, m]);
  // The board writes selection and size back; the graph it was built from wins again when the view
  // or the language changes.
  const [held, setHeld] = useState<{ source: Graph; graph: Graph }>({
    source: built,
    graph: built,
  });
  const graph = held.source === built ? held.graph : built;
  const [openId, setOpenId] = useState<string | null>(null);
  const [editor, setEditor] = useState<PositioningEditor>(null);
  const [foundationEditor, setFoundationEditor] = useState<FoundationEditor>(null);
  const board = useRef<HTMLDivElement>(null);
  const viewer = useRef<HTMLDivElement>(null);
  const opened = openId === null ? undefined : view.nodes.find((n) => n.id === openId);
  const openedFoundation =
    openId === null ? undefined : view.foundation.find((n) => n.id === openId);
  const openedId = (opened ?? openedFoundation)?.id;
  // Closing the viewer leaves the gate undecided: the caller drops the last failure.
  const closeViewer = () => {
    setOpenId(null);
    positioning?.onDismiss?.();
    foundation?.onDismiss?.();
  };

  const renderBody = (boardNode: BoardNode) => {
    const found = view.foundation.find((n) => n.id === boardNode.id);
    if (found !== undefined) {
      return (
        <div className="flex flex-col gap-2">
          <p className={FIELD_NOTE} data-node-state={found.state}>
            {foundationStateLine(m, locale, found)}
          </p>
          <ul className="flex flex-col gap-1 text-body-sm">
            {found.fields.map((field) => (
              <li key={field}>{foundationFieldLabel(m, field)}</li>
            ))}
          </ul>
          {found.id === "core-idea" ? (
            <p className={FIELD_NOTE}>
              {found.gatePassed ? m.business.coreIdea.gatePassed : m.business.state.gate}
            </p>
          ) : null}
        </div>
      );
    }
    const node = view.nodes.find((n) => n.id === boardNode.id);
    if (node === undefined) return undefined;
    return (
      <div className="flex flex-col gap-2">
        <p className={FIELD_NOTE} data-node-state={node.state}>
          {m.business.state[node.state]}
        </p>
        <ul className="flex flex-col gap-1 text-body-sm">
          {node.fields.map((f) => (
            <li key={f.field}>{fieldLabel(m, f.field)}</li>
          ))}
          {node.id === "positioning" ? <li>{m.business.field.statement}</li> : null}
        </ul>
        {node.gatePassed ? (
          <p className={FIELD_NOTE}>{m.business.positioning.gatePassed}</p>
        ) : node.gate ? (
          <p className={FIELD_NOTE}>{m.business.state.gate}</p>
        ) : null}
      </div>
    );
  };

  return (
    <div className="@container mx-auto flex w-full min-w-0 flex-col gap-6 p-6 wrap-anywhere">
      <PageHeader
        title={<bdi>{view.projectName}</bdi>}
        description={m.business.board.lede}
        meta={
          <span className={FIELD_NOTE}>
            {fill(m.business.board.savedAt, { date: formatSavedAt(view.savedAt, locale) })}
          </span>
        }
        actions={
          <>
            {guidebookHref === undefined ? null : (
              <Button asChild variant="secondary">
                <a href={guidebookHref}>{m.business.board.openGuidebook}</a>
              </Button>
            )}
            <Button asChild variant="secondary">
              <a href={listHref}>{m.business.list.heading}</a>
            </Button>
          </>
        }
      />
      {view.reading.status === "rule-based" ? (
        <Alert
          variant="info"
          live="off"
          title={m.business.label.aiUnavailable}
          description={readReasonLine(m, view.reading.reason)}
        />
      ) : null}
      {/* The board's height is layout: 70 percent of the window, never under 480 px. */}
      <div ref={board} className="h-[70dvh] min-h-[480px] min-w-0">
        <CanvasBoard
          variant="present"
          chrome={false}
          minimap={false}
          fitView
          graph={graph}
          onChange={(next) => setHeld({ source: built, graph: next })}
          label={m.business.board.label}
          renderBody={renderBody}
          onNodeOpen={setOpenId}
        >
          <CanvasControls position="center" />
          <TrueHandles />
        </CanvasBoard>
      </div>
      {openedId === undefined ? null : (
        <Dialog open onOpenChange={(next) => (next ? undefined : closeViewer())}>
          <DialogContent
            size="viewer"
            title={nodeTitle(m, openedId)}
            description={
              opened?.gatePassed
                ? m.business.positioning.gatePassed
                : opened?.gate
                  ? m.business.state.gate
                  : openedFoundation?.id === "core-idea"
                    ? openedFoundation.gatePassed
                      ? m.business.coreIdea.gatePassed
                      : m.business.state.gate
                    : undefined
            }
            onOpenAutoFocus={(event) => {
              // Arrow keys scroll the view, so focus goes to its scroll region.
              event.preventDefault();
              viewer.current?.querySelector<HTMLElement>('[role="region"]')?.focus();
            }}
            onCloseAutoFocus={(event) => {
              // Back to the node that opened it, and the viewport stays where it was.
              event.preventDefault();
              board.current
                ?.querySelector<HTMLElement>(`.react-flow__node[data-id="${openedId}"]`)
                ?.focus({ preventScroll: true });
            }}
          >
            <div ref={viewer} className="flex min-h-0 flex-1 flex-col">
              <ScrollArea label={nodeTitle(m, openedId)} className="min-h-0 flex-1">
                {/* Radix draws the bar over the viewport: leave it room, bar 4 plus 8 (row D3). */}
                <div className="pe-3">
                  {opened === undefined ? null : (
                    <BusinessNodeView
                      node={opened}
                      heading={false}
                      reading={view.reading}
                      positioning={view.positioning}
                      controls={
                        positioning === undefined
                          ? undefined
                          : { ...positioning, editor, onEditor: setEditor }
                      }
                    />
                  )}
                  {openedFoundation === undefined ? null : (
                    <FoundationNodeView
                      node={openedFoundation}
                      heading={false}
                      controls={
                        foundation === undefined
                          ? undefined
                          : {
                              ...foundation,
                              editor: foundationEditor,
                              onEditor: setFoundationEditor,
                            }
                      }
                    />
                  )}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
