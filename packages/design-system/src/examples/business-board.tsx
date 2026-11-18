"use client";

import type { BusinessView } from "@orivilo/intent-engine";
import { useMemo, useRef, useState } from "react";
import {
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
import { BusinessNodeView } from "./business-node-view";
import { FIELD_NOTE, fieldLabel, formatSavedAt, nodeTitle } from "./business-text";

/**
 * The project board screen, slice 2 (ORV-281 design sections 6.1 and 6.3, ORV-282): the project
 * name, what the page holds, when it was saved, then the five business nodes on a read-only present
 * board. A node at rest is a card with its state and the names of its fields, never an answer: each
 * answer must carry its label, which belongs in the view. Opening a node (click, Enter or Space)
 * shows that node's view in a viewer dialog. It takes a `BusinessView`, which holds keys and values
 * and no resolved text, so a language switch redraws it with no second load. It knows no route.
 */
export interface BusinessBoardScreenProps {
  access: BusinessAccess;
  /** Where the sign-in link goes on a signed-out screen. */
  signInHref: string;
  /** Where the project list is. */
  listHref: string;
  /** The saved project. Required when `access` is `ready`, ignored otherwise. */
  view?: BusinessView | undefined;
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
  return <ReadyBoard view={props.view} listHref={props.listHref} />;
}

function ReadyBoard({ view, listHref }: { view: BusinessView; listHref: string }) {
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
  const board = useRef<HTMLDivElement>(null);
  const viewer = useRef<HTMLDivElement>(null);
  const opened = openId === null ? undefined : view.nodes.find((n) => n.id === openId);

  const renderBody = (boardNode: BoardNode) => {
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
        </ul>
        {node.gate ? <p className={FIELD_NOTE}>{m.business.state.gate}</p> : null}
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
          <Button asChild variant="secondary">
            <a href={listHref}>{m.business.list.heading}</a>
          </Button>
        }
      />
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
        </CanvasBoard>
      </div>
      {opened === undefined ? null : (
        <Dialog open onOpenChange={(next) => (next ? undefined : setOpenId(null))}>
          <DialogContent
            size="viewer"
            title={nodeTitle(m, opened.id)}
            description={opened.gate ? m.business.state.gate : undefined}
            onOpenAutoFocus={(event) => {
              // Arrow keys scroll the view, so focus goes to its scroll region.
              event.preventDefault();
              viewer.current?.querySelector<HTMLElement>('[role="region"]')?.focus();
            }}
            onCloseAutoFocus={(event) => {
              // Back to the node that opened it, and the viewport stays where it was.
              event.preventDefault();
              board.current
                ?.querySelector<HTMLElement>(`.react-flow__node[data-id="${opened.id}"]`)
                ?.focus({ preventScroll: true });
            }}
          >
            <div ref={viewer} className="flex min-h-0 flex-1 flex-col">
              <ScrollArea label={nodeTitle(m, opened.id)} className="min-h-0 flex-1">
                <BusinessNodeView node={opened} heading={false} />
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
