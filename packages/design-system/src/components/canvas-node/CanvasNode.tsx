"use client";

import { type NodeProps, useUpdateNodeInternals } from "@xyflow/react";
import {
  type ComponentType,
  type CSSProperties,
  type SVGProps,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type FillState, blockById, fillState, missingInputs, summarize } from "../../blocks/index";
import { pick } from "../../i18n/locale";
import { useBoard } from "../canvas-board/context";
import { type BoardNode, elapsedSince, type NodeStep, type StepTask } from "../canvas-board/graph";
import {
  ArtifactIcon,
  CompareStepIcon,
  DirectionIcon,
  DraftStepIcon,
  FillEmptyIcon,
  FillPartialIcon,
  FillSummarizedIcon,
  FillUnlinkedIcon,
  GenerateStepIcon,
  GroupIcon,
  InputBlockIcon,
  KnowledgeIcon,
  LockIcon,
  NoteIcon,
  OpenIcon,
  ReadStepIcon,
  ReferenceIcon,
  ReviewStepIcon,
  SpinnerIcon,
  StaleIcon,
  WarningIcon,
} from "../icons";
import type { NodeKind } from "../../tokens/canvas";
import { NodePort } from "../node-port/NodePort";
import { useLocale, useMessages, useWord } from "../../i18n/LocaleProvider";
import { fill } from "../../i18n/messages/index";
import { CANVAS_WORDS } from "../../tokens/canvas";
import { NodeToolbar } from "../node-toolbar/NodeToolbar";

export type CanvasNodeProps = NodeProps<BoardNode>;

type Glyph = ComponentType<Omit<SVGProps<SVGSVGElement>, "children">>;

const KIND_ICON: Record<NodeKind, Glyph> = {
  "input-block": InputBlockIcon,
  knowledge: KnowledgeIcon,
  artifact: ArtifactIcon,
  reference: ReferenceIcon,
  direction: DirectionIcon,
  note: NoteIcon,
  group: GroupIcon,
};

const STEP_ICON: Record<StepTask, Glyph> = {
  read: ReadStepIcon,
  draft: DraftStepIcon,
  compare: CompareStepIcon,
  generate: GenerateStepIcon,
  review: ReviewStepIcon,
};

const FILL_ICON: Record<FillState, Glyph> = {
  empty: FillEmptyIcon,
  partial: FillPartialIcon,
  summarized: FillSummarizedIcon,
  unlinked: FillUnlinkedIcon,
};

/** Summary lines a node shows before it says how many more there are. */
const SUMMARY_LINES = 3;

/** The middle of each `[data-port-row]` element, from the card's padding box top, in node pixels. */
function measureRows(card: HTMLElement): Record<string, number> {
  const box = card.getBoundingClientRect();
  // The viewport scales the card; a node pixel is a screen pixel divided by that ratio.
  const ratio = card.offsetWidth > 0 ? box.width / card.offsetWidth : 1;
  const top = box.top + card.clientTop * ratio;
  const rows: Record<string, number> = {};
  for (const row of card.querySelectorAll<HTMLElement>("[data-port-row]")) {
    const name = row.dataset["portRow"];
    if (!name) continue;
    const r = row.getBoundingClientRect();
    rows[name] = Math.round(((r.top + r.height / 2 - top) / ratio) * 100) / 100;
  }
  return rows;
}

const sameRows = (a: Record<string, number>, b: Record<string, number>) => {
  const keys = Object.keys(b);
  return Object.keys(a).length === keys.length && keys.every((k) => a[k] === b[k]);
};

/** The time since a run started, ticking once a second while the node runs. */
function useElapsed(startedAt: string | undefined, running: boolean): string | undefined {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running || !startedAt) return undefined;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running, startedAt]);
  return running ? elapsedSince(startedAt, now) : undefined;
}

/**
 * Anything placed on the board (ADR 0004 item 2). One surface, no header band (ORV-57): a top row
 * with the kind's icon and word, the status and the run time; the title; a body per variant; the
 * run's steps while it runs; a missing-inputs row, an error row, and the ports in the footer.
 * React Flow renders it inside the focusable node wrapper, which carries the accessible name
 * ("title, kind") and the selection; this component paints every state from the node tokens.
 * Status is a word and a glyph, never a tint (catalog rule); a running node also turns the AI
 * gradient ring. Steps and time show only when the run reports them.
 *
 * A node made from a registry block (ORV-44 part 2) also shows its fill state, derived from its
 * answers and edges: empty (dashed frame, its first question as the body), partial ("N more to
 * ask"), summarized, or unlinked; the body is then the rule-based summary, up to three lines,
 * with a swatch row when it holds colours, labelled as made by rules.
 *
 * A present board (`board.readOnly`) draws the node as one card (ORV-274): the kind glyph, title,
 * status and basis form a label above the card; the ports are glyph dots on the card edge; the
 * source line is a pill under the card. A node with `open` ends its title row with the pages word
 * and the open glyph on both boards; with no `open.count` (ORV-282) it ends with the glyph only. Ports with a `row` sit at the middle of their body row.
 */
export function CanvasNode({ id, data, selected, dragging }: CanvasNodeProps) {
  const board = useBoard();
  const m = useMessages();
  const word = useWord();
  const kind = word(CANVAS_WORDS.node[data.kind]);
  const basis = data.basis
    ? data.basis === "rules"
      ? m.taskBar.basisRules
      : m.taskBar.basisMock
    : undefined;
  const status = data.status ? word(CANVAS_WORDS.status[data.status]) : undefined;
  const candidate =
    board.connecting?.targets[board.connecting.index]?.nodeId === id ? "" : undefined;
  const body = board.renderBody?.({ id, type: "orivilo", position: { x: 0, y: 0 }, data });
  const locked = data.status === "locked";
  const running = data.status === "running";
  const elapsed = useElapsed(data.startedAt, running);
  const steps = running ? (data.steps ?? []) : [];
  const KindIcon = KIND_ICON[data.kind];
  const locale = useLocale();
  const graph = board.graph;
  const block = useMemo(() => {
    if (!data.block || !blockById(data.block)) return undefined;
    const state = fillState(graph, id);
    const missing = missingInputs(graph, id);
    return { state, missing, summary: summarize(graph, id, locale) };
  }, [graph, id, data.block, locale]);
  const fillWord = block?.state
    ? block.state === "partial"
      ? fill(m.node.fill.partial, { count: String(block.missing.length) })
      : m.node.fill[block.state]
    : undefined;
  const FillIcon = block?.state ? FILL_ICON[block.state] : undefined;
  const present = board.readOnly;
  // The present card's floor reads the larger side's count of ports without a row (ORV-282, D5).
  const sidePorts = Math.max(
    data.inputs.filter((p) => p.row === undefined).length,
    data.outputs.filter((p) => p.row === undefined).length,
  );
  const card = useRef<HTMLDivElement>(null);
  const updateInternals = useUpdateNodeInternals();
  const rowNames = [...data.inputs, ...data.outputs].flatMap((p) => (p.row ? [p.row] : []));
  const rowKey = rowNames.join("|");
  const hasRows = present && rowNames.length > 0;
  const [rowY, setRowY] = useState<Record<string, number>>({});
  // Each row port sits at its row's middle: measured on the card, again when the card resizes, then
  // React Flow reads the moved handles. A measured layout position, not a design value.
  useLayoutEffect(() => {
    const el = card.current;
    if (!el || !hasRows) return undefined;
    const measure = () => {
      const next = measureRows(el);
      setRowY((prev) => (sameRows(prev, next) ? prev : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasRows, rowKey]);
  useLayoutEffect(() => {
    if (hasRows) updateInternals(id);
  }, [hasRows, rowY, id, updateInternals]);
  const pages =
    data.open?.count === undefined
      ? undefined
      : fill(m.node.pages, { count: String(data.open.count) });
  const openGlyph = data.open ? <OpenIcon className="ds-node__open" /> : null;
  const statusChip = status ? (
    <span className="ds-node__status" data-status={data.status}>
      {running ? <SpinnerIcon className="ds-spin" /> : null}
      {data.status === "stale" ? <StaleIcon /> : null}
      {locked ? <LockIcon /> : null}
      {status}
    </span>
  ) : null;
  const stepState: Record<NodeStep["state"], string> = {
    done: m.node.stepDone,
    current: m.node.stepCurrent,
    pending: m.node.stepPending,
  };

  return (
    <div
      ref={card}
      className="ds-node"
      data-kind={data.kind}
      data-pad={data.pad ?? "text"}
      data-open={data.open ? "" : undefined}
      data-size={data.size ?? "md"}
      data-status={data.status}
      data-selected={selected ? "" : undefined}
      data-dragging={dragging ? "" : undefined}
      data-collapsed={data.collapsed ? "" : undefined}
      data-readonly={board.readOnly ? "" : undefined}
      data-error={data.error ? "" : undefined}
      data-missing={data.missing && data.missing.length > 0 ? "" : undefined}
      data-fill={block?.state}
      data-connect-candidate={candidate}
      aria-busy={data.status === "running" ? true : undefined}
      style={
        present && sidePorts > 0 ? ({ "--_ports": String(sidePorts) } as CSSProperties) : undefined
      }
    >
      <NodeToolbar node={{ id, data, selected }} />
      {present ? (
        <div className="ds-node__label">
          <KindIcon />
          <span className="ds-node__title">{data.title}</span>
          {basis ? <span className="ds-node__basis">{basis}</span> : null}
          {statusChip}
          {pages ? <span className="ds-node__pages">{pages}</span> : null}
          {openGlyph}
        </div>
      ) : (
        <div className="ds-node__header">
          <div className="ds-node__meta">
            <span className="ds-node__chip">
              <KindIcon />
            </span>
            <span className="ds-node__kind">
              {kind}
              {basis ? (
                <>
                  {" "}
                  <span className="ds-node__basis">{basis}</span>
                </>
              ) : null}
            </span>
            {statusChip}
            {fillWord && FillIcon ? (
              <span className="ds-node__fill" data-fill={block?.state}>
                <FillIcon />
                {fillWord}
              </span>
            ) : null}
            {elapsed ? (
              <span
                className="ds-node__elapsed"
                aria-label={fill(m.node.elapsed, { time: elapsed })}
              >
                {elapsed}
              </span>
            ) : null}
          </div>
          {data.open ? (
            <div className="ds-node__heading">
              <span className="ds-node__title">{data.title}</span>
              {pages ? <span className="ds-node__pages">{pages}</span> : null}
              {openGlyph}
            </div>
          ) : (
            <span className="ds-node__title">{data.title}</span>
          )}
        </div>
      )}
      {data.collapsed ? null : (
        <div className="ds-node__body">
          {body ??
            (block ? (
              <BlockBody {...block} />
            ) : (
              (data.summary ?? <span className="ds-node__empty">{m.node.empty}</span>)
            ))}
        </div>
      )}
      {steps.length > 0 && !data.collapsed ? (
        <ol className="ds-node__steps" aria-label={m.node.steps}>
          {steps.map((step) => {
            const StepIcon = STEP_ICON[step.task];
            return (
              <li key={step.id} className="ds-node__step" data-state={step.state}>
                <StepIcon />
                <span>{step.label}</span>
                <span className="ds-node__step-state">{stepState[step.state]}</span>
              </li>
            );
          })}
        </ol>
      ) : null}
      {data.missing && data.missing.length > 0 ? (
        <p className="ds-node__missing">
          {fill(m.node.missing, { list: data.missing.join(", ") })}
        </p>
      ) : null}
      {data.error ? (
        <p className="ds-node__error">
          <WarningIcon />
          {data.error}
        </p>
      ) : null}
      {data.inputs.length > 0 || data.outputs.length > 0 ? (
        <div className="ds-node__ports">
          <ul className="ds-node__port-list" data-direction="input" aria-label={m.node.inputs}>
            {data.inputs.map((port) => (
              <NodePort
                key={port.id}
                port={port}
                direction="input"
                disabled={locked}
                rowY={port.row ? rowY[port.row] : undefined}
              />
            ))}
          </ul>
          <ul className="ds-node__port-list" data-direction="output" aria-label={m.node.outputs}>
            {data.outputs.map((port) => (
              <NodePort
                key={port.id}
                port={port}
                direction="output"
                disabled={locked}
                rowY={port.row ? rowY[port.row] : undefined}
              />
            ))}
          </ul>
        </div>
      ) : null}
      {data.source ? <p className="ds-node__source">{data.source}</p> : null}
    </div>
  );
}

/** The body of a block node: its first question while empty, else the rule-based summary. */
function BlockBody({
  state,
  missing,
  summary,
}: {
  state: FillState | undefined;
  missing: ReturnType<typeof missingInputs>;
  summary: ReturnType<typeof summarize>;
}) {
  const m = useMessages();
  const locale = useLocale();
  const first = missing[0];
  if (state === "empty" && first) {
    return <p className="ds-node__question">{pick(first.question, locale)}</p>;
  }
  const shown = summary.lines.slice(0, SUMMARY_LINES);
  const more = summary.lines.length - shown.length;
  return (
    <div className="ds-node__summary">
      {summary.colours.length > 0 ? (
        <span className="ds-node__swatches" aria-hidden>
          {summary.colours.map((colour) => (
            <span key={colour} className="ds-node__swatch" style={{ backgroundColor: colour }} />
          ))}
        </span>
      ) : null}
      <ul className="ds-node__lines">
        {shown.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <span className="ds-node__rule">
        {more > 0 ? `${fill(m.node.moreLines, { count: String(more) })}, ` : null}
        {m.node.byRules}
      </span>
    </div>
  );
}
