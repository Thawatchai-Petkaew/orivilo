"use client";

import {
  type ComponentType,
  type KeyboardEvent as ReactKeyboardEvent,
  type Ref,
  type SVGProps,
  useState,
} from "react";
import {
  type Answer,
  FILL_STATES,
  type FillState,
  blockById,
  fillState,
  fillWord,
  fillsOf,
  missingInputs,
  summarize,
} from "../../blocks/index";
import { commandForKey } from "../../commands/index";
import { pick } from "../../i18n/locale";
import { useLocale, useMessages, useWord } from "../../i18n/LocaleProvider";
import { fill } from "../../i18n/messages/index";
import { CANVAS_WORDS } from "../../tokens/canvas";
import { Badge } from "../badge/Badge";
import { Button } from "../button/Button";
import type { BoardNode, Graph } from "../canvas-board/graph";
import { cx } from "../cx";
import {
  CloseIcon,
  FillEmptyIcon,
  FillPartialIcon,
  FillSummarizedIcon,
  FillUnlinkedIcon,
} from "../icons";
import { MissingInputsPrompt } from "../missing-inputs-prompt/MissingInputsPrompt";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs/Tabs";

const FILL_ICON: Record<FillState, ComponentType<Omit<SVGProps<SVGSVGElement>, "children">>> = {
  empty: FillEmptyIcon,
  partial: FillPartialIcon,
  summarized: FillSummarizedIcon,
  unlinked: FillUnlinkedIcon,
};

export type InspectorTab = "summary" | "missing" | "sources";

export interface InspectorProps {
  /** The board; the Inspector shows its selection and reads everything from it. */
  graph: Graph;
  /** Writes one answer to a node (the missing tab's prompt). */
  onAnswer: (nodeId: string, inputId: string, value: Answer) => void;
  /** Moves the board to a node (a source in the sources tab). */
  onJumpToNode?: ((nodeId: string) => void) | undefined;
  /** Hides the panel; Escape inside it (`panel.close`) and the close control call it. */
  onClose?: ((reason: "escape" | "button") => void) | undefined;
  /** The panel's accessible name; `inspector.label` by default. */
  label?: string | undefined;
  /** The panel root, focusable, so the shell can move focus here on `node.open`. */
  ref?: Ref<HTMLElement> | undefined;
  className?: string | undefined;
}

/**
 * The panel beside the board for the selected node (spec ORV-44 part 3): what it knows, what it
 * still needs and where each piece came from. With nothing selected it counts the board's block
 * nodes by fill state; with several it asks for one. A block node gets three tabs: summary (every
 * line), missing (the MissingInputsPrompt) and sources (how each input is filled, what it feeds).
 * Everything is derived from the graph by the same rules as the node and the shelf; it stores
 * nothing and says it works by rules. The shell lays it out: a Resizable side panel, or a Sheet.
 */
export function Inspector({
  graph,
  onAnswer,
  onJumpToNode,
  onClose,
  label,
  ref,
  className,
}: InspectorProps) {
  const m = useMessages();
  const selected = graph.nodes.filter((n) => n.selected);
  const node = selected.length === 1 ? selected[0] : undefined;

  const onKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (!onClose || event.defaultPrevented) return;
    if (commandForKey(event, ["panel"])?.id === "panel.close") {
      event.preventDefault();
      onClose("escape");
    }
  };

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-label={label ?? m.inspector.label}
      className={cx("ds-inspector", className)}
      onKeyDown={onKeyDown}
    >
      {onClose ? (
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label={m.inspector.close}
          className="ds-inspector__close"
          onClick={() => onClose("button")}
        >
          <CloseIcon className="size-5" />
        </Button>
      ) : null}
      {node ? (
        <NodeDetails
          key={node.id}
          graph={graph}
          node={node}
          onAnswer={onAnswer}
          onJumpToNode={onJumpToNode}
        />
      ) : selected.length > 1 ? (
        <div className="ds-inspector__empty">
          <h2 className="ds-inspector__title">
            {fill(m.inspector.several, { count: String(selected.length) })}
          </h2>
          <p className="ds-inspector__muted">{m.inspector.pickOne}</p>
        </div>
      ) : (
        <BoardOverview graph={graph} />
      )}
    </section>
  );
}

/** Nothing selected: the prompt to pick a node and the board's block nodes counted by state. */
function BoardOverview({ graph }: { graph: Graph }) {
  const m = useMessages();
  const counts = FILL_STATES.map((state) => ({
    state,
    count: graph.nodes.filter((n) => fillState(graph, n.id) === state).length,
  })).filter((c) => c.count > 0);
  return (
    <div className="ds-inspector__empty">
      <h2 className="ds-inspector__title">{m.inspector.noSelection}</h2>
      <p className="ds-inspector__muted">
        {fill(m.inspector.onBoard, { count: String(graph.nodes.length) })}
      </p>
      {counts.length > 0 ? (
        <ul className="ds-inspector__counts">
          {counts.map(({ state, count }) => {
            const Icon = FILL_ICON[state];
            const word = state === "partial" ? m.inspector.partial : m.node.fill[state];
            return (
              <li key={state} data-fill={state}>
                <Icon />
                <span>{word}</span>
                <span className="ds-inspector__count">{count}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function NodeDetails({
  graph,
  node,
  onAnswer,
  onJumpToNode,
}: {
  graph: Graph;
  node: BoardNode;
  onAnswer: InspectorProps["onAnswer"];
  onJumpToNode: InspectorProps["onJumpToNode"];
}) {
  const m = useMessages();
  const word = useWord();
  const locale = useLocale();
  const block = node.data.block ? blockById(node.data.block) : undefined;
  const state = block ? fillState(graph, node.id) : undefined;
  const missing = block ? missingInputs(graph, node.id) : [];
  const [tab, setTab] = useState<InspectorTab>(state === "empty" ? "missing" : "summary");
  const FillIcon = state ? FILL_ICON[state] : undefined;

  const header = (
    <header className="ds-inspector__header">
      <p className="ds-inspector__meta">
        <span>{word(CANVAS_WORDS.node[node.data.kind])}</span>
        {state && FillIcon ? (
          <span className="ds-inspector__fill" data-fill={state}>
            <FillIcon />
            {fillWord(graph, node.id, locale)}
          </span>
        ) : null}
      </p>
      <h2 className="ds-inspector__title">{node.data.title}</h2>
      {block ? <p className="ds-inspector__rule">{m.inspector.byRules}</p> : null}
    </header>
  );

  if (!block) {
    return (
      <>
        {header}
        <div className="ds-inspector__body">
          <p className="ds-inspector__text">{node.data.summary ?? m.node.empty}</p>
          {node.data.missing && node.data.missing.length > 0 ? (
            <p className="ds-inspector__muted">
              {fill(m.node.missing, { list: node.data.missing.join(", ") })}
            </p>
          ) : null}
        </div>
      </>
    );
  }

  const summary = summarize(graph, node.id, locale);
  const fills = fillsOf(graph, node.id);
  const feeds = graph.edges
    .filter((e) => e.source === node.id)
    .map((e) => graph.nodes.find((n) => n.id === e.target))
    .filter((n): n is BoardNode => n !== undefined)
    .filter((n, i, all) => all.findIndex((x) => x.id === n.id) === i);

  return (
    <>
      {header}
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as InspectorTab)}
        className="ds-inspector__tabs"
      >
        <TabsList size="sm" aria-label={node.data.title}>
          <TabsTrigger value="summary">{m.inspector.summary}</TabsTrigger>
          <TabsTrigger value="missing">
            {m.inspector.missing}
            {missing.length > 0 ? (
              <Badge size="sm" className="ds-inspector__badge">
                {missing.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="sources">{m.inspector.sources}</TabsTrigger>
        </TabsList>
        <TabsContent value="summary" className="ds-inspector__body">
          {summary.lines.length === 0 ? (
            <p className="ds-inspector__muted">{m.inspector.emptySummary}</p>
          ) : (
            <>
              {summary.colours.length > 0 ? (
                <span className="ds-node__swatches" aria-hidden>
                  {summary.colours.map((c) => (
                    <span key={c} className="ds-node__swatch" style={{ backgroundColor: c }} />
                  ))}
                </span>
              ) : null}
              <ul className="ds-inspector__lines">
                {summary.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </>
          )}
        </TabsContent>
        <TabsContent value="missing" className="ds-inspector__body">
          <MissingInputsPrompt graph={graph} nodeId={node.id} onAnswer={onAnswer} />
        </TabsContent>
        <TabsContent value="sources" className="ds-inspector__body">
          <dl className="ds-inspector__sources">
            {fills.map((f) => (
              <div key={f.input.id} className="ds-inspector__source">
                <dt>{pick(f.input.label, locale)}</dt>
                <dd>
                  {f.answer !== undefined ? (
                    m.inspector.answered
                  ) : f.source ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!onJumpToNode}
                      onClick={() => f.source && onJumpToNode?.(f.source.id)}
                    >
                      {fill(m.inspector.from, { title: f.source.data.title })}
                    </Button>
                  ) : (
                    <span className="ds-inspector__muted">
                      {f.input.required ? m.inspector.notYet : m.inspector.optional}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <h3 className="ds-inspector__subtitle">{m.inspector.feeds}</h3>
          {feeds.length === 0 ? (
            <p className="ds-inspector__muted">{m.inspector.feedsNone}</p>
          ) : (
            <ul className="ds-inspector__feeds">
              {feeds.map((n) => (
                <li key={n.id}>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!onJumpToNode}
                    onClick={() => onJumpToNode?.(n.id)}
                  >
                    {n.data.title}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
