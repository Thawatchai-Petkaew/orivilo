"use client";

import { Panel, useReactFlow } from "@xyflow/react";
import {
  type ComponentType,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type SVGProps,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  type Block,
  type FillState,
  BLOCK_MODULES,
  blockById,
  blocksByModule,
  fillState,
  missingInputs,
  nodeOfBlock,
  summarize,
} from "../../blocks/index";
import { commandForKey } from "../../commands/index";
import { type Locale, pick } from "../../i18n/locale";
import { useLocale, useMessages } from "../../i18n/LocaleProvider";
import { fill, type Messages } from "../../i18n/messages/index";
import { useBoard } from "../canvas-board/context";
import type { Graph } from "../canvas-board/graph";
import { cx } from "../cx";
import {
  FillEmptyIcon,
  FillPartialIcon,
  FillSummarizedIcon,
  FillUnlinkedIcon,
  PlusIcon,
  SearchIcon,
} from "../icons";
import { Input } from "../input/Input";

/** What the shelf says about a block: not on the board yet, or its node's fill state. */
export type TileState = "absent" | FillState;

const TILE_ICON: Record<TileState, ComponentType<Omit<SVGProps<SVGSVGElement>, "children">>> = {
  absent: PlusIcon,
  empty: FillEmptyIcon,
  partial: FillPartialIcon,
  summarized: FillSummarizedIcon,
  unlinked: FillUnlinkedIcon,
};

/** The drag payload type: a block id, so a drop from another app never places anything. */
const DRAG_TYPE = "application/x-orivilo-block";

export interface BlockLibraryProps {
  /**
   * Adds a node of the block at a flow position (the drop point or the viewport centre). The shell
   * owns the graph; `placeBlock` from the package builds the next one with the node selected.
   */
  onPlace: (block: Block, position: { x: number; y: number }) => void;
  className?: string | undefined;
}

interface Tile {
  block: Block;
  state: TileState;
  word: string;
  colours: string[];
  nodeId: string | undefined;
}

function tileOf(graph: Graph, block: Block, m: Messages, locale: Locale): Tile {
  const node = nodeOfBlock(graph, block.id);
  const state: TileState = node ? (fillState(graph, node.id) ?? "empty") : "absent";
  const word =
    state === "absent"
      ? m.shelf.absent
      : state === "partial" && node
        ? fill(m.node.fill.partial, { count: String(missingInputs(graph, node.id).length) })
        : m.node.fill[state];
  const colours = node ? summarize(graph, node.id, locale).colours : [];
  return { block, state, word, colours, nodeId: node?.id };
}

function matches(block: Block, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === "") return true;
  return block.name.th.toLowerCase().includes(q) || block.name.en.toLowerCase().includes(q);
}

/**
 * The block library shelf at the bottom of the board (spec ORV-44 part 2, AC 10 to 13): every
 * registry block grouped by module, each tile saying in words and a mark whether its node is on
 * the board and how full it is. Drag a tile onto the board, or press Enter on it, to place a node
 * there or at the viewport centre; a block already on the board is selected and fitted instead of
 * placed twice. Search filters by Thai and English name; arrow keys move between tiles. Renders
 * inside CanvasBoard (its `children`), which gives it the graph and the viewport.
 */
export function BlockLibrary({ onPlace, className }: BlockLibraryProps) {
  const board = useBoard();
  const flow = useReactFlow();
  const m = useMessages();
  const locale = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | undefined>();
  const [announce, setAnnounce] = useState("");
  const headingId = useId();

  const groups = blocksByModule()
    .map((g) => ({
      module: g.module,
      tiles: g.blocks
        .filter((b) => matches(b, query))
        .map((b) => tileOf(board.graph, b, m, locale)),
    }))
    .filter((g) => g.tiles.length > 0);
  const visible: string[] = groups.flatMap((g) => g.tiles.map((t) => t.block.id));
  const tabStop = active && visible.includes(active) ? active : visible[0];

  // Latest values for the drop listener, which is attached once.
  const latest = useRef({ graph: board.graph, onPlace, jump: board.jumpToNode, m, locale });
  latest.current = { graph: board.graph, onPlace, jump: board.jumpToNode, m, locale };

  const place = (block: Block, position: { x: number; y: number }) => {
    const { graph, jump } = latest.current;
    const existing = nodeOfBlock(graph, block.id);
    if (existing) {
      jump(existing.id);
      return;
    }
    latest.current.onPlace(block, position);
    setAnnounce(
      fill(latest.current.m.shelf.placed, { title: pick(block.name, latest.current.locale) }),
    );
  };
  const placeRef = useRef(place);
  placeRef.current = place;

  /** The centre of the board in flow coordinates. */
  const centre = () => {
    const rect = ref.current?.closest(".ds-board")?.getBoundingClientRect();
    return rect
      ? flow.screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
      : { x: 0, y: 0 };
  };

  // The board is the drop target: a tile dropped anywhere on it places its block there.
  useEffect(() => {
    const surface = ref.current?.closest<HTMLElement>(".ds-board");
    if (!surface || board.readOnly) return undefined;
    const over = (event: DragEvent) => {
      if (!event.dataTransfer?.types.includes(DRAG_TYPE)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    };
    const drop = (event: DragEvent) => {
      const id = event.dataTransfer?.getData(DRAG_TYPE);
      const block = id ? blockById(id) : undefined;
      if (!block) return;
      event.preventDefault();
      placeRef.current(block, flow.screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    };
    surface.addEventListener("dragover", over);
    surface.addEventListener("drop", drop);
    return () => {
      surface.removeEventListener("dragover", over);
      surface.removeEventListener("drop", drop);
    };
  }, [flow, board.readOnly]);

  const focusTile = (id: string | undefined) => {
    if (!id) return;
    setActive(id);
    ref.current?.querySelector<HTMLElement>(`[data-block="${id}"]`)?.focus();
  };

  const onTileKey = (event: ReactKeyboardEvent<HTMLButtonElement>, tile: Tile) => {
    const at = visible.indexOf(tile.block.id);
    const step: Record<string, number> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    };
    if (event.key in step) {
      event.preventDefault();
      focusTile(visible[(at + (step[event.key] ?? 0) + visible.length) % visible.length]);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      focusTile(event.key === "Home" ? visible[0] : visible.at(-1));
    } else if (commandForKey(event, ["panel"])?.id === "panel.place-block") {
      event.preventDefault();
      place(tile.block, centre());
    }
  };

  const onDragStart = (event: ReactDragEvent<HTMLButtonElement>, tile: Tile) => {
    event.dataTransfer.setData(DRAG_TYPE, tile.block.id);
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <Panel
      position="bottom-center"
      className={cx("ds-shelf", className)}
      role="group"
      aria-labelledby={headingId}
      ref={ref}
    >
      <div className="ds-shelf__bar">
        <h2 id={headingId} className="ds-shelf__title">
          {m.shelf.label}
        </h2>
        <div className="ds-shelf__search">
          <SearchIcon />
          <Input
            type="search"
            size="sm"
            value={query}
            aria-label={m.shelf.search}
            placeholder={m.shelf.search}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      {groups.length === 0 ? (
        <p className="ds-shelf__empty">{fill(m.shelf.empty, { query: query.trim() })}</p>
      ) : (
        <div className="ds-shelf__groups">
          {groups.map((g) => (
            <div
              role="group"
              key={g.module}
              className="ds-shelf__group"
              aria-labelledby={`${headingId}-${g.module}`}
            >
              <h3 id={`${headingId}-${g.module}`} className="ds-shelf__module">
                {pick(BLOCK_MODULES[g.module], locale)}
              </h3>
              <ul className="ds-shelf__tiles">
                {g.tiles.map((tile) => {
                  const Icon = TILE_ICON[tile.state];
                  return (
                    <li key={tile.block.id}>
                      <button
                        type="button"
                        className="ds-shelf__tile"
                        data-block={tile.block.id}
                        data-state={tile.state}
                        tabIndex={tile.block.id === tabStop ? 0 : -1}
                        draggable={!board.readOnly}
                        disabled={board.readOnly && tile.state === "absent"}
                        onFocus={() => setActive(tile.block.id)}
                        onClick={() => place(tile.block, centre())}
                        onKeyDown={(e) => onTileKey(e, tile)}
                        onDragStart={(e) => onDragStart(e, tile)}
                      >
                        <span className="ds-shelf__name">{pick(tile.block.name, locale)}</span>
                        <span className="ds-shelf__state">
                          <Icon />
                          {tile.word}
                        </span>
                        {tile.colours.length > 0 ? (
                          <span className="ds-shelf__swatches" aria-hidden>
                            {tile.colours.map((c) => (
                              <span
                                key={c}
                                className="ds-node__swatch"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
      <p className="ds-shelf__status" role="status" aria-live="polite">
        {announce}
      </p>
    </Panel>
  );
}
