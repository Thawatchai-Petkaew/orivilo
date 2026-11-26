"use client";

/**
 * The ORIVILO canvas prototype page (ORV-274 design and tech notes, slice ORV-278): one read-only
 * board from brief to product, with live catalog parts, art drawn from tokens, and a preview dialog
 * that pages through each result. Every node, edge, page and piece is a record in
 * `orivilo-canvas.data.ts`; this file draws them. Colour is a token name and a mode (a `Paint`),
 * never a value; the only data colours are the palette's own hex values and the read-back points.
 */
import {
  ViewportPortal,
  useNodesInitialized,
  useReactFlow,
  useStore,
  useViewport,
} from "@xyflow/react";
import {
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type ComponentType,
  type ReactNode,
  createContext,
  startTransition,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DesignProfileBoundary,
  type BoundaryMode,
  useDesignProfile,
} from "../boundary/DesignProfileBoundary";
import {
  Alert,
  Avatar,
  Badge,
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbPage,
  Button,
  CanvasBoard,
  CanvasChat,
  CanvasControls,
  Checkbox,
  Dialog,
  DialogContent,
  FeaturedIcon,
  Field,
  Input,
  Inspector,
  Kbd,
  Logo,
  PageHeader,
  Progress,
  RadioGroup,
  RadioGroupItem,
  ScrollArea,
  Select,
  Skeleton,
  Slider,
  Spinner,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  TaskBar,
  Tag,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
  TopNavigation,
} from "../components/index";
import { fixtureTaskJobs, fixtureTaskJobsEn } from "../components/fixtures";
import type { BoardNode, Graph, PortSpec } from "../components/canvas-board/graph";
import { cx } from "../components/cx";
import {
  ArtifactIcon,
  ChatIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  CompareStepIcon,
  CopyIcon,
  CursorIcon,
  DirectionIcon,
  DraftStepIcon,
  EyeIcon,
  FitIcon,
  GenerateStepIcon,
  GroupIcon,
  HandIcon,
  type IconProps,
  InputBlockIcon,
  KnowledgeIcon,
  LockIcon,
  NoteIcon,
  PlusIcon,
  ReadStepIcon,
  RedoIcon,
  ReferenceIcon,
  RetryIcon,
  SearchIcon,
  SendIcon,
  TrashIcon,
  UndoIcon,
  UploadIcon,
} from "../components/icons";
import { DOT_RADIUS, GEOMETRY, RING_STROKE } from "../components/logo/geometry";
import { formatNumber } from "../i18n/format";
import { useLocale, useMessages } from "../i18n/LocaleProvider";
import { fill, type Messages } from "../i18n/messages/index";
import { BRAND_PROFILES } from "../profiles/index";
import { tokens } from "../tokens/index";
import { BusinessBoardScreen } from "./business-board";
import { ENGLISH_VIEW, THAI_VIEW } from "./business-fixtures";
import { GuidebookScreen } from "./guidebook";
import { done } from "./guidebook-fixtures";
import { OriviloLanding, heroBody, heroGraph } from "./orivilo-landing";
import { TrueHandles } from "./true-handles";
import {
  type ArtText,
  type ArtToken,
  type BoardId,
  type BookArt,
  type BookPageRecord,
  type BodyRecord,
  type Box,
  type ChapterId,
  type CopyKey,
  type IconName,
  type ImageId,
  type LiveId,
  type NodeRecord,
  type Paint,
  type PaletteId,
  type PieceContent,
  type PhoneCrop,
  type PhoneView,
  type PieceRecord,
  type Placement,
  type PreviewPageRecord,
  type RowRecord,
  type SequenceId,
  type Size,
  type TypeStyle,
  ADDRESS,
  BOARDS,
  BOOK,
  BOOK_FRAME,
  BRAND_NAME,
  BROWSER,
  CHAPTERS,
  chapterViewport,
  CLOCK,
  copyOf,
  DOCK_MARGIN,
  FRAMES,
  graphOf,
  IMAGES,
  INK,
  NODES,
  PALETTE,
  PAPER,
  PHONE_AT,
  PHONE_BAR,
  PHONE_BOARD,
  PHONE_EDGES,
  PHONE_INTENT,
  PHONE_SCALES,
  PIECES,
  phoneView,
  placeOnQuad,
  quadInTile,
  SEQUENCES,
  SHEETS,
  studioGraph,
  textOf,
  TYPE_SAMPLE,
  TYPE_SPECIMEN,
  VIOLET,
  VIEW_PAD,
  VIOLET_ON_INK,
  WINDOW_AT,
} from "./orivilo-canvas.data";

export interface OriviloCanvasProps {
  /** The chapter the board frames at the start; `overview` (default) shows the whole board. */
  chapter?: ChapterId | "overview" | undefined;
  /** Opens the preview of a sequence at a page (1 based), as a click on its node would. */
  preview?: { sequence: SequenceId; page: number } | undefined;
  /** Image ids to draw as their missing state, as if the file were absent. */
  missingImages?: readonly ImageId[] | undefined;
}

// ---- small helpers

type Mode = "light" | "dark";
const BOARD_DESIGN: Size = { w: 1280, h: 800 };
const THAI = /[\u0E00-\u0E7F]/;

/** The attributes that re-resolve every token under an element in a fixed mode of the base profile. */
const scope = (mode: Mode) => ({ "data-mode": mode, "data-design-profile": "neutral" }) as const;
/** The custom property of a semantic token name, such as "brand.signature". */
const tokenVar = (token: ArtToken): string => `var(--ds-${token.replace(".", "-")})`;
/** The mode whose `text.primary` reads on a flood of this paint. */
const textMode = (paint: Paint): Mode =>
  paint.token === "brand.signature" ? (paint.mode === "light" ? "dark" : "light") : paint.mode;

function at<T>(items: readonly T[], i: number): T {
  const item = items[i];
  if (item === undefined) throw new RangeError(`orivilo-canvas: no item at ${i}`);
  return item;
}
const langOf = (s: string): "th" | "en" => (THAI.test(s) ? "th" : "en");

const INSET_MD = (() => {
  const token = tokens.get("semantic", "space.inset.md");
  if (!token) throw new Error("semantic space.inset.md missing");
  return parseFloat(String(tokens.resolve(token, "light").value));
})();

function imageOf(id: ImageId) {
  const record = IMAGES.find((i) => i.id === id);
  if (!record) throw new RangeError(`orivilo-canvas: no image ${id}`);
  return record;
}
function pieceOf(id: string): PieceRecord {
  const record = PIECES.find((p) => p.id === id);
  if (!record) throw new RangeError(`orivilo-canvas: no piece ${id}`);
  return record;
}
function paletteOf(id: PaletteId) {
  const record = PALETTE.find((p) => p.id === id);
  if (!record) throw new RangeError(`orivilo-canvas: no colour ${id}`);
  return record;
}
function bookPage(n: number): BookPageRecord {
  const record = BOOK.find((p) => p.n === n);
  if (!record) throw new RangeError(`orivilo-canvas: no book page ${n}`);
  return record;
}
const lineAt = (lines: readonly ArtText[], i: number): ArtText => at(lines, i);

// ---- page context

interface PageContextValue {
  /** The mode the page runs in, handed to the live trees. */
  mode: BoundaryMode;
  missing: ReadonlySet<ImageId>;
  /** Live trees mount once this is true; the canvas turns it on after the first fit. */
  live: boolean;
  fail: (id: ImageId) => void;
}
const PageContext = createContext<PageContextValue>({
  mode: "light",
  missing: new Set(),
  live: true,
  fail: () => undefined,
});

// ---- frames

interface LiveFrameProps {
  /** The outer box; `h: "auto"` takes the scaled height of the page. */
  outer: { w: number; h: number | "auto" };
  /** The width the page is laid out at, in design px. */
  design: number;
  /** Design px down from the top. */
  start?: number | undefined;
  /**
   * A selector inside the page: the frame starts at its top, less `space.inset-md`. Measured with a
   * `ResizeObserver`, so a font that swaps in later moves the start and not the page's lines.
   * Internal to this example (spec ORV-309 C2).
   */
  startAt?: string | undefined;
  /** Fades the cropped bottom edge into the page's own canvas colour (C1), by tokens only. */
  fade?: boolean | undefined;
  mode?: BoundaryMode | undefined;
  children: ReactNode;
}

/**
 * A live tree at its design width, scaled into a fixed box. A transform does not change layout, so
 * the page keeps its design-width layout and its container queries; `inert` and `aria-hidden` take
 * it out of the tab order and the accessibility tree.
 */
function LiveFrame({ outer, design, start = 0, startAt, fade, mode, children }: LiveFrameProps) {
  const { live, mode: pageMode } = useContext(PageContext);
  const scale = outer.w / design;
  // The scaled box, and inside it the page, which slides up to its start.
  const inner = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(start);
  const [auto, setAuto] = useState(0);
  useLayoutEffect(() => {
    const box = inner.current;
    const el = page.current;
    if (!box || !el || !live) return;
    const measure = () => {
      if (outer.h === "auto") setAuto(box.offsetHeight * scale);
      if (startAt === undefined) return;
      const target = el.querySelector(startAt);
      if (!target) return;
      // Screen px per design px: this frame's scale times the zoom of any board that holds it.
      const drawn = box.getBoundingClientRect().width / box.offsetWidth;
      if (!(drawn > 0)) return;
      setOffset(
        Math.max(
          0,
          (target.getBoundingClientRect().top - el.getBoundingClientRect().top) / drawn - INSET_MD,
        ),
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [live, outer.h, scale, startAt]);
  return (
    <div
      className="relative overflow-hidden"
      data-live-frame=""
      style={{ width: outer.w, height: outer.h === "auto" ? auto : outer.h }}
      inert
      aria-hidden="true"
    >
      {live ? (
        <DesignProfileBoundary profile={BRAND_PROFILES[0]} mode={mode ?? pageMode}>
          {/* A fixed frame clips its page at its own box. The clip is a scroll region without a bar
              (never scrolled: the page slides by a transform), because the a11y checker's colour
              stack clips at scroll regions, not at `overflow: hidden`, and would read the page's
              dark canvas behind the label of the node below. */}
          <div
            ref={inner}
            className="absolute left-0 top-0"
            style={{
              width: design,
              ...(outer.h === "auto"
                ? {}
                : { height: outer.h / scale, overflow: "auto", scrollbarWidth: "none" }),
              transform: `scale(${scale})`,
              transformOrigin: "0 0",
            }}
          >
            <div ref={page} style={{ transform: `translateY(-${offset}px)` }}>
              <div className="bg-surface-canvas font-body text-text-primary">{children}</div>
            </div>
          </div>
          {fade ? (
            <div
              aria-hidden="true"
              data-crop-fade=""
              className="pointer-events-none absolute inset-x-0 bottom-0 h-12"
              style={{
                background: "linear-gradient(to bottom, transparent, var(--ds-surface-canvas))",
              }}
            />
          ) : null}
        </DesignProfileBoundary>
      ) : null}
    </div>
  );
}

/** Art at its design size, scaled to a width: a board, a book page or a piece. */
function ArtFrame({
  design,
  width,
  lines,
  children,
}: {
  design: Size;
  width: number;
  /** The tiles of a page of rounded tiles, in design px: each gets one untransformed line box. */
  lines?: readonly Box[] | undefined;
  children: ReactNode;
}) {
  const scale = width / design.w;
  return (
    <div
      className="relative overflow-hidden"
      data-art-frame=""
      style={
        {
          width,
          height: (width * design.h) / design.w,
          "--_art-scale": String(scale),
        } as CSSProperties
      }
      inert
      aria-hidden="true"
    >
      <div
        className="absolute left-0 top-0"
        style={{
          width: design.w,
          height: design.h,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        {children}
      </div>
      {lines ? (
        <div data-page-lines="" {...scope("light")}>
          {lines.map((b, i) => (
            <span
              key={i}
              style={{
                left: b.x * scale,
                top: b.y * scale,
                width: b.w * scale,
                height: b.h * scale,
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ---- floods, art type, photographs

interface FloodProps extends ComponentPropsWithoutRef<"div"> {
  paint: Paint;
}

/** A box painted with a token in a fixed mode: the art keeps its floods in both page modes. */
function Flood({ paint, style, ...rest }: FloodProps) {
  return (
    <div {...scope(paint.mode)} {...rest} style={{ background: tokenVar(paint.token), ...style }} />
  );
}

const STYLE_CLASS: Record<TypeStyle, string> = {
  "display-md": "font-display text-display-md",
  // The scale has no heading-lg; display-md is the nearest step (deviation, see the report).
  "heading-lg": "font-display text-display-md",
  "heading-md": "font-display text-heading-md",
  "heading-sm": "font-display text-heading-sm",
  "body-lg": "font-body text-body-lg",
  "body-md": "font-body text-body-md",
  "body-sm": "font-body text-body-sm",
  "body-xs": "font-body text-body-xs",
  "code-md": "font-mono text-code-md",
  "label-sm": "font-body text-label-sm",
  "label-md": "font-body text-label-md",
};

/** One line of the art: display-lg's size times k, or a step of the type scale, in its own ink. */
function ArtLine({ line, className }: { line: ArtText; className?: string | undefined }) {
  const m = useMessages();
  const raw = textOf(m, line.text);
  const thai = THAI.test(raw);
  const style: CSSProperties = {
    color: tokenVar(line.ink.token),
    ...(line.maxWidth === undefined ? {} : { maxWidth: line.maxWidth }),
  };
  let cls = "m-0 min-w-0 whitespace-pre-line";
  if ("k" in line.size) {
    style.fontSize = `calc(var(--ds-type-display-lg-font-size) * ${line.size.k})`;
    style.fontFamily =
      line.family === "thai-body" ? "var(--ds-font-body)" : "var(--ds-type-display-lg-font-family)";
    style.fontWeight = "var(--ds-type-display-lg-font-weight)";
    style.lineHeight =
      !thai && line.leading === "numeral"
        ? "var(--ds-type-numeral-lg-line-height)"
        : !thai && line.leading === 1.05
          ? 1.05
          : "var(--ds-type-display-lg-line-height)";
  } else {
    cls = cx(
      cls,
      line.family === "thai-body"
        ? STYLE_CLASS[line.size.style].replace("font-display", "font-body")
        : STYLE_CLASS[line.size.style],
    );
  }
  const accent = line.accent;
  const at0 = accent ? raw.indexOf(accent.match) : -1;
  // The boundary sits on a wrapper that adds no box. The unlayered `[data-design-profile]` rule
  // sets the body-md size and family on whatever element carries the attributes, so an element
  // that also carries a type class would lose it (ORV-278 findings I2 and I3).
  return (
    <div {...scope(line.ink.mode)} className="contents">
      <p
        data-art-line=""
        {...("k" in line.size ? { "data-k": line.size.k } : {})}
        {...("data" in line.text ? { lang: langOf(raw) } : {})}
        className={cx(cls, className)}
        style={style}
      >
        {accent && at0 >= 0 ? (
          <>
            {raw.slice(0, at0)}
            <span
              {...scope(accent.ink.mode)}
              style={{ font: "inherit", color: tokenVar(accent.ink.token) }}
            >
              {accent.match}
            </span>
            {raw.slice(at0 + accent.match.length)}
          </>
        ) : (
          raw
        )}
      </p>
    </div>
  );
}

const TREATMENT: Record<"violet" | "paper" | "photo", CSSProperties> = {
  violet: { filter: "grayscale(1) contrast(1.1)", mixBlendMode: "luminosity" },
  paper: { filter: "grayscale(1) brightness(1.2) contrast(1.15)", mixBlendMode: "screen" },
  photo: {},
};

/** The missing state: the flood, the image id and the catalog's line, no frame. */
function MissingLabel({ id, paint }: { id: ImageId; paint: Paint }) {
  const m = useMessages();
  return (
    <div
      {...scope(textMode(paint))}
      className="absolute flex flex-col gap-1 font-body"
      style={{ left: 20, bottom: 16, color: "var(--ds-text-primary)" }}
    >
      <span className="text-label-sm">{id}</span>
      <span className="text-body-xs">{m.orvCanvas.image.missing}</span>
    </div>
  );
}

function Photo({
  id,
  size,
  flood,
  focus,
  className,
  children,
}: {
  id: ImageId;
  size: Size;
  flood: Paint;
  focus?: readonly [number, number] | undefined;
  className?: string | undefined;
  children?: ReactNode;
}) {
  const m = useMessages();
  const { missing, fail } = useContext(PageContext);
  const record = imageOf(id);
  const gone = missing.has(id);
  // The paper treatment screens the photograph onto the brand violet and multiplies the paper over
  // it, so while the image is there its container is violet (design gap 21); the paper flood is
  // the missing state's ground only.
  const ground = !gone && record.treatment === "paper" ? VIOLET : flood;
  return (
    <Flood
      paint={ground}
      className={cx("relative isolate overflow-hidden", className)}
      style={{ width: size.w, height: size.h }}
      data-photo={id}
    >
      {gone ? (
        <MissingLabel id={id} paint={flood} />
      ) : (
        <>
          <img
            src={record.file}
            width={record.width}
            height={record.height}
            alt={copyOf(m, `image.alt.${id}` as CopyKey)}
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
            style={{
              ...TREATMENT[record.treatment],
              ...(focus ? { objectPosition: `${focus[0]}% ${focus[1]}%` } : {}),
            }}
            onError={() => fail(id)}
          />
          {record.treatment === "paper" ? (
            <span
              {...scope("light")}
              aria-hidden="true"
              className="absolute inset-0 bg-surface-canvas mix-blend-multiply"
            />
          ) : null}
        </>
      )}
      {children}
    </Flood>
  );
}

// ---- drawn marks

/** The mark drawn from the logo's geometry at a size, the ring and the dot each in a Paint. */
function GiantMark({
  size,
  ring,
  dot,
  style,
}: {
  size: number;
  ring: Paint;
  dot: Paint;
  style?: CSSProperties | undefined;
}) {
  const { ring: r, dot: d } = GEOMETRY.mark;
  return (
    <svg
      viewBox="0 0 150 150"
      width={size}
      height={size}
      className="ds-logo"
      data-kind="mark"
      data-form="master"
      data-tone="full"
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", ...style }}
    >
      <g {...scope(ring.mode)}>
        <path
          className="ds-logo__ring"
          d={r.d}
          fill="none"
          strokeWidth={RING_STROKE.master}
          strokeLinecap={r.cap}
          style={{ stroke: tokenVar(ring.token) }}
        />
      </g>
      <g {...scope(dot.mode)}>
        <circle
          className="ds-logo__dot"
          cx={d.cx}
          cy={d.cy}
          r={DOT_RADIUS.master}
          style={{ fill: tokenVar(dot.token) }}
        />
      </g>
    </svg>
  );
}

/** A small drawn mark for the history and the build equation: any ring path, any dot. */
function DrawnMark({
  ring,
  dotRadius,
  dotFill,
  size = 36,
  dotClass = true,
}: {
  ring: string;
  dotRadius: number;
  dotFill?: string | undefined;
  size?: number | undefined;
  dotClass?: boolean | undefined;
}) {
  const { dot } = GEOMETRY.mark;
  return (
    <svg
      viewBox="0 0 150 150"
      width={size}
      height={size}
      className="ds-logo"
      data-kind="mark"
      data-form="master"
      data-tone="full"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="ds-logo__ring"
        d={ring}
        fill="none"
        strokeWidth={RING_STROKE.master}
        strokeLinecap="round"
      />
      <circle
        className={dotClass ? "ds-logo__dot" : undefined}
        cx={dot.cx}
        cy={dot.cy}
        r={dotRadius}
        {...(dotFill === undefined ? {} : { fill: dotFill })}
      />
    </svg>
  );
}

const RING_110 = GEOMETRY.mark.ring.d;
const RING_80 = "M 70.42 25.2 A 52.5 52.5 0 1 0 125.71 63.91";

/** The construction drawing of the mark, in the mark's own units with a clear-space margin of 45. */
function Construction({
  values,
}: {
  values: { opening: string; ring: string; dot: string; stroke: string; clear: string };
}) {
  const m = useMessages();
  const { ring, dot } = GEOMETRY.mark;
  const [cx0, cy0] = ring.centre;
  const label: CSSProperties = {
    fill: tokenVar("text.brand"),
    fontFamily: "var(--ds-font-mono)",
    fontSize: "calc(var(--ds-type-code-md-font-size) / 2.5)",
  };
  const guide: CSSProperties = { stroke: tokenVar("text.brand"), fill: "none" };
  const grid = Array.from({ length: 17 }, (_, i) => -45 + 15 * i);
  return (
    <svg
      viewBox="-45 -45 240 240"
      width={600}
      height={600}
      className="ds-logo"
      data-kind="mark"
      data-form="master"
      data-tone="full"
      aria-hidden="true"
      focusable="false"
    >
      <g style={{ stroke: tokenVar("border.subtle") }} strokeWidth={0.3}>
        {grid.map((v) => (
          <g key={v}>
            <line x1={v} y1={-45} x2={v} y2={195} />
            <line x1={-45} y1={v} x2={195} y2={v} />
          </g>
        ))}
      </g>
      <rect
        x={-30}
        y={-30}
        width={210}
        height={210}
        strokeWidth={0.6}
        strokeDasharray="4 4"
        style={guide}
      />
      <rect
        x={0}
        y={0}
        width={150}
        height={150}
        fill="none"
        strokeWidth={0.5}
        style={{ stroke: tokenVar("border.control") }}
      />
      <path
        className="ds-logo__ring"
        d={ring.d}
        fill="none"
        strokeWidth={RING_STROKE.master}
        strokeLinecap="round"
      />
      <circle className="ds-logo__dot" cx={dot.cx} cy={dot.cy} r={DOT_RADIUS.master} />
      <g strokeWidth={0.5} style={guide}>
        <line x1={cx0 - 4} y1={cy0} x2={cx0 + 4} y2={cy0} />
        <line x1={cx0} y1={cy0 - 4} x2={cx0} y2={cy0 + 4} />
        <line x1={cx0} y1={cy0} x2={ring.start[0]} y2={ring.start[1]} />
        <line x1={cx0} y1={cy0} x2={ring.end[0]} y2={ring.end[1]} />
        <path d={`M ${cx0 + 22} ${cy0} A 22 22 0 0 0 ${cx0 - 7.52} ${cy0 - 20.67}`} />
        <line x1={cx0} y1={cy0} x2={cx0 - 37.12} y2={cy0 + 37.12} />
        <line x1={dot.cx} y1={dot.cy} x2={dot.cx + 19} y2={dot.cy} />
        <line x1={7.5} y1={cy0 + 24} x2={37.5} y2={cy0 + 24} />
        <line x1={-30} y1={cy0 - 30} x2={0} y2={cy0 - 30} />
      </g>
      <text x={cx0 + 14} y={cy0 - 8} style={label}>
        {values.opening}
      </text>
      <text x={cx0 - 52} y={cy0 + 50} style={label}>
        {`r ${values.ring}`}
      </text>
      <text x={dot.cx + 22} y={dot.cy - 3} style={label}>
        {`r ${values.dot}`}
      </text>
      <text x={-36} y={cy0 + 36} style={label}>
        {copyOf(m, "wall.strokeLabel", { value: values.stroke })}
      </text>
      <text x={-40} y={cy0 - 34} style={label}>
        {copyOf(m, "wall.clearLabel", { value: values.clear })}
      </text>
    </svg>
  );
}

// ---- the pieces of the two boards

function Scene({
  piece,
  content,
  size,
}: {
  piece: PieceRecord;
  content: Extract<PieceRecord["content"], { kind: "scene" }>;
  size: Size;
}) {
  const { missing } = useContext(PageContext);
  const image = imageOf(content.image);
  const quad = image.quad;
  if (!quad) throw new RangeError(`orivilo-canvas: scene ${image.id} has no quad`);
  const imageSize = { w: image.width, h: image.height };
  const points = quadInTile(quad, size, imageSize);
  const gone = missing.has(content.image);
  const { face, lockup, surface } = content;
  const lockupWidth = lockup.width * face.w;
  const corners = [
    [0, 0],
    [face.w, 0],
    [face.w, face.h],
    [0, face.h],
  ] as const;
  return (
    <Photo id={content.image} size={size} flood={piece.flood} className="rounded-media">
      {gone ? (
        <svg
          className="absolute left-0 top-0"
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
          aria-hidden="true"
        >
          <g {...scope(surface.mode)}>
            <polygon
              points={points.map(([x, y]) => `${x},${y}`).join(" ")}
              style={{ fill: tokenVar(surface.token) }}
            />
          </g>
        </svg>
      ) : null}
      <div
        className="absolute left-0 top-0 flex items-center justify-center"
        data-face=""
        style={{
          width: face.w,
          height: face.h,
          transform: placeOnQuad(quad, face, size, imageSize),
          transformOrigin: "0 0",
        }}
      >
        {/* An image of the generated lockup, not the inline Logo: real Chrome draws stroked SVG wrongly
            under this perspective matrix (ORV-308). Its colours are inside the file. Decorative. */}
        <img
          src={lockup.file}
          width={lockupWidth}
          height={(lockupWidth * 150) / 663}
          alt=""
          data-lockup=""
          data-tone={lockup.tone}
          className="block"
          style={{ width: lockupWidth, height: (lockupWidth * 150) / 663 }}
        />
        {corners.map(([x, y], i) => (
          <span
            key={i}
            data-quad-marker={i}
            aria-hidden="true"
            className="absolute"
            style={{ left: x, top: y, width: 0, height: 0 }}
          />
        ))}
      </div>
    </Photo>
  );
}

const ICON_BY_NAME: Record<IconName, ComponentType<IconProps>> = {
  Cursor: CursorIcon,
  Hand: HandIcon,
  Plus: PlusIcon,
  Search: SearchIcon,
  Undo: UndoIcon,
  Redo: RedoIcon,
  InputBlock: InputBlockIcon,
  Knowledge: KnowledgeIcon,
  Artifact: ArtifactIcon,
  Reference: ReferenceIcon,
  Direction: DirectionIcon,
  Note: NoteIcon,
  ReadStep: ReadStepIcon,
  DraftStep: DraftStepIcon,
  CompareStep: CompareStepIcon,
  GenerateStep: GenerateStepIcon,
  Eye: EyeIcon,
  Group: GroupIcon,
  Chat: ChatIcon,
  Send: SendIcon,
  Upload: UploadIcon,
  Copy: CopyIcon,
  Trash: TrashIcon,
  Fit: FitIcon,
};

const TILE = "relative overflow-hidden rounded-media";

/**
 * The app in a browser at its design size (A): a tab strip, a toolbar with the address, and below
 * them ORIVILO's own Studio, the same `TopNavigation` and the same live board the landing shows,
 * with the Positioning node selected. Drawn from catalog parts; nothing in it is an image.
 */
function BrowserWindow({ design }: { design: Size }) {
  const m = useMessages();
  const use = m.orvCanvas.use;
  const words = m.oriviloLanding.board;
  const graph = heroGraph(words, false);
  // The window's own positions (row 3.2); Positioning is the selected node.
  const nodes = graph.nodes.map((n) => {
    const [x, y] = WINDOW_AT[n.id] ?? [n.position.x, n.position.y];
    return { ...n, position: { x, y }, ...(n.id === "pos" ? { selected: true } : {}) };
  });
  return (
    <div
      {...scope("dark")}
      className="flex flex-col overflow-hidden rounded-container border border-border-subtle bg-surface-sunken font-body text-text-primary"
      style={{ width: design.w, height: design.h }}
      data-browser=""
    >
      <div className="flex h-11 shrink-0 items-end gap-2 px-3">
        <div className="flex h-9 w-60 items-center gap-2 rounded-t-media bg-surface-canvas px-3">
          <Logo kind="mark" height={16} decorative />
          <span className="text-label-sm">{BRAND_NAME}</span>
          <CloseIcon className="ms-auto size-3.5 text-text-secondary" />
        </div>
        <PlusIcon className="mb-2.5 size-4 text-text-secondary" />
      </div>
      <div className="flex h-12 shrink-0 items-center gap-4 border-b border-border-subtle bg-surface-canvas px-4">
        <ChevronLeftIcon className="size-4 text-text-secondary" />
        <ChevronRightIcon className="size-4 text-text-secondary" />
        <RetryIcon className="size-4 text-text-secondary" />
        <div className="flex h-8 flex-1 items-center gap-2 rounded-control bg-surface-sunken px-4">
          <LockIcon className="size-3.5 text-text-secondary" />
          <span className="text-body-sm">{ADDRESS}</span>
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        <DesignProfileBoundary profile={BRAND_PROFILES[0]} mode="dark">
          <div className="absolute inset-0 flex flex-col bg-surface-canvas text-text-primary">
            <TopNavigation
              name={use.studioName}
              brand={<Logo kind="horizontal" height={20} decorative />}
              items={[
                { label: m.orvCanvas.sheet.view.board, href: "/board" },
                { label: m.orvCanvas.sheet.view.guidebook, href: "/guidebook" },
              ]}
              currentPath="/board"
              actions={<Avatar name={m.orvCanvas.sheet.owner} size="sm" decorative />}
              contentClassName="px-5"
            />
            <div className="relative min-h-0 flex-1 bg-surface-board">
              <div className="absolute inset-0">
                <CanvasBoard
                  label={words.label}
                  graph={{ ...graph, nodes }}
                  variant="edit"
                  minimap={false}
                  renderBody={heroBody(words, false)}
                >
                  <TrueHandles />
                </CanvasBoard>
              </div>
            </div>
          </div>
        </DesignProfileBoundary>
      </div>
    </div>
  );
}

/**
 * The graph of the phone board screen (ORV-312 design row 2, revision 3): four knowledge nodes, two
 * artifacts and the guidebook, placed by number, the guidebook selected, and six edges, every one
 * running forward. The four knowledge nodes are not in the landing's graph, so the graph builds each
 * node's data here, with its words from the locale's messages. The guidebook keeps no output port:
 * the product node is not on this screen, and a port with no edge would be a loose end.
 */
function phoneGraph(m: Messages): Graph {
  const words = m.oriviloLanding.board;
  const port = (id: string, kind: PortSpec["kind"], label: string): PortSpec => ({
    id,
    kind,
    label,
  });
  const text = port("out", "text", words.text);
  const into = port("in", "text", words.text);
  const node = (
    id: string,
    title: string,
    kind: BoardNode["data"]["kind"],
    inputs: PortSpec[],
    outputs: PortSpec[],
  ): BoardNode => {
    const place = PHONE_AT[id];
    if (!place) throw new RangeError(`no phone place for ${id}`);
    return {
      id,
      type: "orivilo",
      position: { x: place.at[0], y: place.at[1] },
      width: place.width,
      data: {
        title,
        kind,
        size: "custom",
        pad: kind === "knowledge" ? "text" : "media",
        inputs,
        outputs,
      },
      ...(id === "guide" ? { selected: true } : {}),
    };
  };
  const nodes = [
    node("brief", words.brief, "knowledge", [], [text]),
    node("audience", m.orvCanvas.node.audience, "knowledge", [], [text]),
    node("personality", m.orvCanvas.node.personality, "knowledge", [], [text]),
    node("feeling", m.orvCanvas.node.feeling, "knowledge", [], [text]),
    node("logo", words.logo, "artifact", [into], [port("out", "image", words.image)]),
    node("colour", words.colour, "artifact", [into], [port("out", "palette", words.palette)]),
    node(
      "guide",
      words.guidebook,
      "artifact",
      [port("img", "image", words.image), port("pal", "palette", words.palette)],
      [],
    ),
  ];
  const edges = PHONE_EDGES.map(
    ([source, sourceHandle, target, targetHandle]) =>
      ({
        id: `${source}-${target}`,
        type: "orivilo",
        source,
        sourceHandle,
        target,
        targetHandle,
        data: { meaning: "input", label: false },
      }) as const,
  );
  return { nodes, edges };
}

/**
 * The bodies of the phone board's seven nodes (ORV-312 design row 2): the brief's line, two short
 * secondary lines, three scales, the mark, four swatches and a violet cover. They are the phone's
 * own, so the landing's hero board keeps its look. Every word is a label the product draws.
 */
function phoneBody(m: Messages) {
  const words = m.oriviloLanding.board;
  return (node: BoardNode): ReactNode => {
    switch (node.id) {
      case "brief":
        return <p className="m-0 text-balance text-body-md">{words.briefText}</p>;
      case "audience":
        return (
          <p className="m-0 text-balance text-body-sm text-text-secondary">
            {m.orvCanvas.audience.founder}
          </p>
        );
      case "feeling":
        return (
          <p className="m-0 text-balance text-body-sm text-text-secondary">
            {m.orvCanvas.sheet.answer.feeling}
          </p>
        );
      case "personality":
        // Three scales, no words: a hairline track and a dot at a fixed sample share.
        return (
          <div className="flex flex-col gap-3 py-1">
            {PHONE_SCALES.map((at) => (
              <div key={at} className="relative h-3">
                <div className="absolute inset-x-0 top-1.5 border-t border-border-strong" />
                <div
                  className="absolute top-0 size-3 rounded-round bg-brand-signature"
                  style={{ left: `calc(${at}% - 6px)` }}
                />
              </div>
            ))}
          </div>
        );
      case "logo":
        return (
          <div className="ds-node__media flex h-20 items-center justify-center bg-surface-sunken">
            <Logo kind="mark" height={44} decorative />
          </div>
        );
      case "colour":
        return (
          <div className="ds-node__media flex h-20 overflow-hidden">
            <div className="h-full bg-brand-signature" style={{ flexGrow: 3 }} />
            <div className="h-full bg-surface-sunken" style={{ flexGrow: 3 }} />
            <div className="h-full bg-text-primary" style={{ flexGrow: 2 }} />
            <div
              className="h-full bg-action-intent"
              data-design-profile="neutral"
              data-mode="light"
              style={{ flexGrow: 1 }}
            />
          </div>
        );
      case "guide":
        // The cover: no title, the label above the card names the node.
        return (
          <div
            className="ds-node__media relative h-[312px] overflow-hidden bg-brand-signature"
            data-mode="dark"
            data-design-profile="neutral"
          >
            <div className="absolute left-3 top-3">
              <Logo kind="mark" height={24} tone="one-colour" decorative />
            </div>
            <div className="absolute -bottom-[34px] -right-[34px]">
              <Logo kind="mark" height={128} tone="one-colour" decorative />
            </div>
          </div>
        );
      default:
        return null;
    }
  };
}

/**
 * The phone's screen (ORV-312 design rows 1 to 4), in a box of the screen's own design size: an app
 * bar under the status row, ORIVILO's own board in its present form below it, and the one intent
 * button at the end corner. The board is placed by number and its view never moves, so the screen is
 * the same on every open. Sample data; the frame is inert and nothing on it runs.
 */
function PhoneBoardScreen({ status, height }: { status: number; height: number }) {
  const m = useMessages();
  return (
    <div className="relative overflow-hidden" style={{ width: 390, height }}>
      <div
        className="absolute overflow-hidden"
        style={{
          left: PHONE_BOARD.x,
          top: PHONE_BOARD.y,
          width: PHONE_BOARD.w,
          height: PHONE_BOARD.h,
        }}
      >
        <CanvasBoard
          label={m.oriviloLanding.board.label}
          graph={phoneGraph(m)}
          variant="present"
          fitView={false}
          chrome={false}
          minimap={false}
          renderBody={phoneBody(m)}
        >
          <TrueHandles />
        </CanvasBoard>
      </div>
      <div
        className="absolute left-0 top-0 w-full border-b border-border-subtle bg-surface-canvas"
        style={{ height: PHONE_BAR, paddingTop: status }}
      >
        <TopNavigation
          name={m.orvCanvas.use.studioName}
          brand={<Logo kind="horizontal" height={20} decorative />}
          items={[]}
          actions={<Avatar name={m.orvCanvas.sheet.owner} size="sm" decorative />}
          contentClassName="px-4 py-2"
        />
      </div>
      <div
        className="absolute inset-x-0 flex justify-end"
        style={{ bottom: PHONE_INTENT.bottom, paddingInlineEnd: PHONE_INTENT.end }}
      >
        <span data-design-profile="neutral" data-mode="light" className="contents">
          <Button variant="intent" size="lg">
            {m.business.board.openGuidebook}
          </Button>
        </span>
      </div>
    </div>
  );
}

/**
 * The one device (design rows 4.1 and 4.2): the phone picture in a tile, and the live screen laid on
 * its display. The picture is a straight-on view, so the screen is a box under one scale and one
 * translate: `[data-phone-screen]` at the display's place, its corner the picture's own (image
 * geometry from the record, not a UI radius), and inside it a design box 390 wide under `scale(k)`.
 * The pill is drawn again above the live screen so one surface runs edge to edge. With the picture
 * missing the tile shows its flood and the missing label only: a screen without its device would be
 * a drawn phone again. `over` draws above the picture in tile px, for the page 11 measure.
 */
function PhoneScene({
  piece,
  image,
  size,
  crop,
  mode,
  screen,
  lines,
  over,
}: {
  piece: PieceRecord;
  image: ImageId;
  size: Size;
  crop: PhoneCrop;
  /** The mode the status row reads in: the mode of the screen's own ground. */
  mode: Mode;
  screen: (view: PhoneView) => ReactNode;
  /** Dashed layout lines over the display, at x of the 390 wide screen (page 11 only). */
  lines?: readonly number[] | undefined;
  over?: ((view: PhoneView) => ReactNode) | undefined;
}) {
  const m = useMessages();
  const { missing, fail } = useContext(PageContext);
  const record = imageOf(image);
  if (!record.device) throw new RangeError(`orivilo-canvas: image ${image} has no device`);
  const view = phoneView(size, { w: record.width, h: record.height }, record.device, crop);
  const { picture, island } = view;
  // The display's box and its corner, which come from the record: one place, used by the screen and
  // by the lines that clip with it.
  const display: CSSProperties = {
    left: view.screen.x,
    top: view.screen.y,
    width: view.screen.w,
    height: view.screen.h,
    borderRadius: view.radius,
  };
  return (
    <Flood
      paint={piece.flood}
      className={TILE}
      style={{ width: size.w, height: size.h }}
      data-photo={image}
    >
      {missing.has(image) ? (
        <MissingLabel id={image} paint={piece.flood} />
      ) : (
        <>
          <img
            src={record.file}
            width={record.width}
            height={record.height}
            alt={copyOf(m, `image.alt.${image}` as CopyKey)}
            loading="lazy"
            decoding="async"
            className="absolute"
            style={{
              left: picture.x,
              top: picture.y,
              width: picture.w,
              height: picture.h,
              maxWidth: "none",
            }}
            onError={() => fail(image)}
          />
          <div className="absolute overflow-hidden" data-phone-screen="" style={display}>
            <div
              className="relative"
              style={{
                width: view.design.w,
                height: view.design.h,
                transform: `scale(${view.k})`,
                transformOrigin: "0 0",
              }}
            >
              {screen(view)}
              <span
                {...scope(mode)}
                className="absolute flex items-center justify-center font-body text-label-md text-text-primary"
                data-clock=""
                style={{ left: 0, top: island.y, width: island.x, height: island.h }}
              >
                {CLOCK}
              </span>
              <Flood
                paint={INK}
                className="absolute rounded-round"
                data-island=""
                style={{ left: island.x, top: island.y, width: island.w, height: island.h }}
              />
            </div>
          </div>
          {lines ? (
            <div
              {...scope("dark")}
              className="absolute overflow-hidden"
              data-layout-grid=""
              style={display}
            >
              {lines.map((x) => (
                <div
                  key={x}
                  className="absolute bottom-0 top-0 border-s border-dashed border-brand-signature"
                  style={{ left: x * view.k }}
                />
              ))}
            </div>
          ) : null}
          {over?.(view)}
        </>
      )}
    </Flood>
  );
}

/**
 * The board on a phone (B): the picture whole, the live phone board screen on its display.
 * Page 11's variant "grid" adds the layout grid over the display and the measure above the phone.
 */
function PhonePiece({
  piece,
  content: c,
  size,
  grid,
}: {
  piece: PieceRecord;
  content: Extract<PieceContent, { kind: "phone" }>;
  size: Size;
  grid: boolean;
}) {
  const m = useMessages();
  return (
    <PhoneScene
      piece={piece}
      image={c.image}
      size={size}
      crop="whole"
      mode="dark"
      lines={grid ? c.grid.lines : undefined}
      screen={(view) => (
        <LiveFrame
          outer={{ w: c.screenWidth, h: view.design.h }}
          design={c.screenWidth}
          mode="dark"
        >
          <PhoneBoardScreen status={c.status} height={view.design.h} />
        </LiveFrame>
      )}
      over={
        grid
          ? (view) => {
              const xs = c.grid.measure.map((x) => view.screen.x + x * view.k);
              const x0 = at(xs, 0);
              const x3 = at(xs, 3);
              const top = view.screen.y;
              return (
                <>
                  <div
                    {...scope(textMode(piece.flood))}
                    className="absolute inset-0 font-body"
                    data-measure=""
                  >
                    <div
                      className="absolute border-t border-text-primary"
                      style={{ left: x0, width: x3 - x0, top: top - 18 }}
                    />
                    {xs.map((x, i) => (
                      <div
                        key={i}
                        className="absolute border-s border-text-primary"
                        style={{ left: x, top: top - 24, height: 12 }}
                      />
                    ))}
                    {c.grid.measure.slice(1).map((end, i) => {
                      const start = at(c.grid.measure, i);
                      // Centred over its span on one line: the 24 px spans are narrower than their numerals.
                      return (
                        <span
                          key={i}
                          className="absolute -translate-x-1/2 whitespace-nowrap font-mono text-code-md text-text-primary"
                          style={{ left: (at(xs, i) + at(xs, i + 1)) / 2, top: top - 48 }}
                        >
                          {end - start}
                        </span>
                      );
                    })}
                    <p
                      className="absolute m-0 text-label-md text-text-primary"
                      style={{ left: 24, bottom: 16 }}
                    >
                      {m.orvCanvas.use.grid}
                    </p>
                  </div>
                </>
              );
            }
          : undefined
      }
    />
  );
}

/**
 * The app icon on a phone's home screen (C), at a real phone's scale (design rows 3.1 and 4.4): the
 * upper part of the phone picture, and on its display a grid of 60 pt icons with ORIVILO's among
 * them. The icon is 15% of the screen's width, as on a phone, and the crop carries its legibility.
 */
function HomeScreenPiece({
  piece,
  content: c,
  size,
}: {
  piece: PieceRecord;
  content: Extract<PieceContent, { kind: "icon" }>;
  size: Size;
}) {
  const { grid, app } = c;
  const slots = Array.from({ length: grid.cols * grid.rows }, (_, i) => ({
    col: i % grid.cols,
    row: Math.floor(i / grid.cols),
  }));
  return (
    <PhoneScene
      piece={piece}
      image={c.image}
      size={size}
      crop={{ inset: c.inset }}
      mode="light"
      screen={() => (
        <Flood paint={PAPER} className="absolute inset-0" data-home-screen="">
          <div {...scope("light")} className="absolute inset-0 font-body text-text-primary">
            {slots.map(({ col, row }) => {
              const x = grid.start + col * grid.pitch[0];
              const y = grid.top + row * grid.pitch[1];
              if (col !== app.col || row !== app.row) {
                return (
                  <div
                    key={`${col}-${row}`}
                    className="absolute overflow-hidden rounded-container"
                    style={{ left: x, top: y, width: grid.icon, height: grid.icon }}
                  >
                    <Skeleton shape="block" className="size-full" />
                  </div>
                );
              }
              return (
                <div key="app">
                  <Flood
                    paint={INK}
                    className="absolute flex items-center justify-center rounded-container"
                    style={{ left: x, top: y, width: grid.icon, height: grid.icon }}
                    data-app-icon=""
                  >
                    <div {...scope("dark")}>
                      <Logo kind="mark" height={grid.icon * app.mark} decorative />
                    </div>
                  </Flood>
                  <span
                    className="absolute whitespace-nowrap text-center text-label-sm"
                    style={{
                      left: x + (grid.icon - grid.pitch[0]) / 2,
                      top: y + grid.icon + grid.gap,
                      width: grid.pitch[0],
                    }}
                  >
                    {BRAND_NAME}
                  </span>
                </div>
              );
            })}
          </div>
        </Flood>
      )}
    />
  );
}

/** The link share card (E): the image at 1.91 : 1 over the share tagline and the address. */
function SharePiece({
  piece,
  content: c,
  size,
}: {
  piece: PieceRecord;
  content: Extract<PieceContent, { kind: "share" }>;
  size: Size;
}) {
  const m = useMessages();
  const card = Math.min(c.card.max, size.w - 2 * c.card.margin);
  const k = card / c.image.w;
  return (
    <Flood paint={piece.flood} className={TILE} style={{ width: size.w, height: size.h }}>
      <div className="flex h-full items-center justify-center">
        <div
          {...scope("light")}
          className="overflow-hidden rounded-container border border-border-subtle bg-surface-card font-body text-text-primary"
          style={{ width: card }}
        >
          <Flood
            paint={INK}
            className="relative overflow-hidden"
            style={{ width: card, height: c.image.h * k }}
            data-share-image=""
          >
            <div
              className="relative"
              style={{
                width: c.image.w,
                height: c.image.h,
                transform: `scale(${k})`,
                transformOrigin: "0 0",
              }}
            >
              <GiantMark
                size={c.mark.size}
                ring={VIOLET}
                dot={VIOLET_ON_INK}
                style={{ left: c.mark.at[0], top: c.mark.at[1] }}
              />
              <div
                {...scope("dark")}
                className="absolute"
                style={{ left: c.logo.inset, bottom: c.logo.inset }}
              >
                <Logo kind="horizontal" height={c.logo.height} decorative />
              </div>
            </div>
          </Flood>
          <div className="flex flex-col gap-0.5 px-3 py-2.5">
            <span className="text-label-md">{m.orvCanvas.use.shareTagline}</span>
            <span className="text-body-xs text-text-secondary">{ADDRESS}</span>
          </div>
        </div>
      </div>
    </Flood>
  );
}

/** The icon set specimen (page 11): the glyphs of `icons.tsx` on a grid of hairlines, 6 across. */
function IconSet({ glyphs, size }: { glyphs: readonly IconName[]; size: Size }) {
  const m = useMessages();
  return (
    <Flood
      paint={INK}
      className={TILE}
      style={{ width: size.w, height: size.h }}
      data-specimen="icons"
    >
      <div
        {...scope("dark")}
        className="flex h-full flex-col justify-between p-6 font-body text-text-primary"
      >
        <span className="text-label-md">{m.orvCanvas.use.icons}</span>
        <div className="grid grid-cols-6 self-center border-s border-t border-border-subtle">
          {glyphs.map((name) => {
            const Glyph = ICON_BY_NAME[name];
            return (
              <div
                key={name}
                data-glyph={name}
                className="flex size-9 items-center justify-center border-e border-b border-border-subtle"
              >
                <Glyph className="size-5" />
              </div>
            );
          })}
        </div>
        <span className="text-body-xs text-text-secondary">{m.orvCanvas.use.iconsNote}</span>
      </div>
    </Flood>
  );
}

/** One piece drawn at a tile size; the variant "grid" is the phone of the book's page 11. */
function PieceArt({
  piece,
  size,
  variant,
}: {
  piece: PieceRecord;
  size: Size;
  variant?: "grid" | undefined;
}) {
  const c = piece.content;
  const tile = "relative overflow-hidden rounded-media";
  const box = { width: size.w, height: size.h };
  switch (c.kind) {
    case "photo":
      return (
        <Photo
          id={c.image}
          size={size}
          flood={piece.flood}
          focus={c.focus}
          className="rounded-media"
        />
      );
    case "scene":
      return <Scene piece={piece} content={c} size={size} />;
    case "lines":
      return (
        <Flood paint={piece.flood} className={tile} style={box}>
          <div className="absolute flex flex-col gap-5" style={{ left: 40, right: 40, bottom: 40 }}>
            {c.lines.map((line, i) => (
              <ArtLine key={i} line={line} />
            ))}
          </div>
        </Flood>
      );
    case "type":
      return (
        <Flood paint={piece.flood} className={tile} style={box}>
          <div
            className="flex h-full flex-col justify-between gap-5"
            style={{ padding: "40px 30px 32px" }}
          >
            {c.lines.map((line, i) => (
              <ArtLine key={i} line={line} />
            ))}
          </div>
        </Flood>
      );
    case "window": {
      // The browser is laid from `inset` of the tile width, `span` times as wide as the tile, so it
      // bleeds off the end and the bottom; the tile clips it.
      const inset = size.w * c.inset;
      const width = size.w * c.span;
      const scale = width / c.design.w;
      return (
        <Flood paint={piece.flood} className={tile} style={box}>
          <div
            className="absolute overflow-hidden rounded-container"
            style={{ left: inset, top: inset }}
          >
            <LiveFrame outer={{ w: width, h: c.design.h * scale }} design={c.design.w} mode="dark">
              <BrowserWindow design={c.design} />
            </LiveFrame>
          </div>
        </Flood>
      );
    }
    case "phone":
      return <PhonePiece piece={piece} content={c} size={size} grid={variant === "grid"} />;
    case "icon":
      return <HomeScreenPiece piece={piece} content={c} size={size} />;
    case "share":
      return <SharePiece piece={piece} content={c} size={size} />;
  }
}

/** A board at 1280 x 800: its pieces at their boxes. */
function BoardArt({ board }: { board: BoardId }) {
  return (
    <div
      className="relative"
      data-board-art=""
      style={{ width: BOARD_DESIGN.w, height: BOARD_DESIGN.h }}
    >
      {BOARDS[board].pieces.map((id) => {
        const piece = pieceOf(id);
        return (
          <div
            key={id}
            className="absolute"
            data-piece={id}
            style={{ left: piece.box.x, top: piece.box.y }}
          >
            <PieceArt piece={piece} size={{ w: piece.box.w, h: piece.box.h }} />
          </div>
        );
      })}
    </div>
  );
}

// ---- the brandbook: twelve pages at 1280 x 800

const BODY_TOP = 82;
const BODY_BOTTOM = 76;

/** The top and bottom furniture rows; each part sits in the colour of the ground it is on. */
function Furniture({
  page,
  startPaint,
  endPaint,
  left,
  width,
}: {
  page: BookPageRecord;
  startPaint: Paint;
  endPaint: Paint;
  left: number;
  width: number;
}) {
  const m = useMessages();
  const { pad, mark } = BOOK_FRAME;
  const part = (paint: Paint, children: ReactNode, extra?: string) => (
    <div {...scope(textMode(paint))} className="contents">
      <div
        className={cx(
          "flex items-center gap-2 whitespace-nowrap font-body text-body-sm text-text-secondary",
          extra,
        )}
      >
        {children}
      </div>
    </div>
  );
  const number = String(page.n).padStart(2, "0");
  return (
    <>
      <div
        className="absolute flex items-center justify-between"
        data-furniture="top"
        style={{ left, width, top: pad.top }}
      >
        {part(
          startPaint,
          <>
            <Logo kind="mark" height={mark} tone="one-colour" decorative />
            <span>{m.orvCanvas.wall.guidelines}</span>
          </>,
        )}
        {part(endPaint, <span>{copyOf(m, page.section)}</span>)}
      </div>
      <div
        className="absolute flex items-center justify-between"
        data-furniture="bottom"
        style={{ left, width, bottom: pad.bottom }}
      >
        {part(startPaint, <span>ORIVILO v1.5</span>)}
        {part(endPaint, <span>{number}</span>)}
      </div>
    </>
  );
}

function ColumnLines({ lines, from, to }: { lines: readonly ArtText[]; from: number; to: number }) {
  return (
    <>
      {lines.slice(from, to).map((line, i) => (
        <ArtLine key={from + i} line={line} />
      ))}
    </>
  );
}

/** One live screen of page 10's field: a rounded, floating, inert frame at a ratio of its width. */
function FieldScreen({
  w,
  ratio,
  design,
  mode,
  children,
}: {
  w: number;
  ratio: number;
  design: number;
  mode: Mode;
  children: ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-container shadow-overlay"
      style={{ width: w, height: w * ratio }}
    >
      <LiveFrame outer={{ w, h: w * ratio }} design={design} mode={mode}>
        {children}
      </LiveFrame>
    </div>
  );
}

/**
 * Page 10's art: the three things the prototype shows, the landing, the board and the guidebook, as
 * live screens in a group turned about its centre on the brand flood. The landing's one intent
 * button is the page's only lime.
 */
function FieldArt({ art, size }: { art: Extract<BookArt, { kind: "field" }>; size: Size }) {
  const locale = useLocale();
  const { group, phone, column } = art;
  const phoneDesign = 390;
  const ratio = 2.06;
  return (
    <Flood
      paint={art.ground}
      className="relative overflow-hidden"
      style={{ width: size.w, height: size.h }}
      data-field-art=""
    >
      <div
        className="absolute"
        style={{
          left: group.x,
          top: group.y,
          width: group.w,
          height: group.h,
          transform: `rotate(${group.rotate}deg)`,
          transformOrigin: "50% 50%",
        }}
      >
        <div className="absolute" style={{ left: phone.at[0], top: phone.at[1] }}>
          <FieldScreen w={phone.width} ratio={ratio} design={phoneDesign} mode="dark">
            <OriviloLanding lang={locale} width={phoneDesign} photograph={false} />
          </FieldScreen>
        </div>
        <div
          className="absolute flex flex-col"
          style={{ left: column.at[0], top: column.at[1], gap: column.gap }}
        >
          <FieldScreen
            w={column.window}
            ratio={BROWSER.h / BROWSER.w}
            design={BROWSER.w}
            mode="dark"
          >
            <BrowserWindow design={BROWSER} />
          </FieldScreen>
          <FieldScreen w={column.guidebook} ratio={ratio} design={phoneDesign} mode="light">
            <div style={{ width: phoneDesign }}>
              <GuidebookScreen
                access="ready"
                guidebook={done(locale)}
                boardHref="#"
                signInHref="#"
              />
            </div>
          </FieldScreen>
        </div>
      </div>
    </Flood>
  );
}

function Opener({ page }: { page: BookPageRecord }) {
  const { inkHalf, size, pad } = BOOK_FRAME;
  const rows: ReactNode[] = [];
  for (let i = 2; i + 1 < page.lines.length; i += 2) {
    rows.push(
      <div key={i} className="flex items-baseline gap-4">
        <ArtLine line={lineAt(page.lines, i)} />
        <ArtLine line={lineAt(page.lines, i + 1)} />
      </div>,
    );
  }
  const art = page.art;
  const panel = { left: inkHalf, top: 0, width: size.w - inkHalf, height: size.h };
  return (
    <>
      <div
        className="absolute flex flex-col gap-5"
        style={{ left: pad.side, top: BODY_TOP, width: inkHalf - 2 * pad.side }}
      >
        <ArtLine line={lineAt(page.lines, 0)} />
        <ArtLine line={lineAt(page.lines, 1)} />
      </div>
      <div
        className="absolute flex flex-col gap-3"
        style={{ left: pad.side, bottom: BODY_BOTTOM, width: inkHalf - 2 * pad.side }}
      >
        {rows}
      </div>
      {art?.kind === "giant-mark" && art.ground ? (
        <Flood paint={art.ground} className="absolute overflow-hidden" style={panel}>
          <GiantMark
            size={art.size}
            ring={art.ring}
            dot={art.dot}
            style={{ left: art.x, top: art.y }}
          />
        </Flood>
      ) : null}
      {art?.kind === "fields" ? (
        <div className="absolute flex" style={panel}>
          {art.ratio.map((r, i) => (
            <Flood
              key={i}
              paint={at(art.paints, i)}
              style={{ flex: `${r} 1 0`, minWidth: 0 }}
              data-field=""
            />
          ))}
        </div>
      ) : null}
      {art?.kind === "field" ? (
        <div className="absolute" style={{ left: panel.left, top: 0 }}>
          <FieldArt art={art} size={{ w: panel.width, h: panel.height }} />
        </div>
      ) : null}
    </>
  );
}

function Construction4({ page }: { page: BookPageRecord }) {
  const l = page.lines;
  const m = useMessages();
  const text = (i: number) => textOf(m, lineAt(l, i).text);
  const facts: [number, number][] = [
    [1, 2],
    [3, 4],
    [5, 6],
    [7, 8],
    [9, 10],
  ];
  return (
    <>
      <Flood
        paint={{ token: "surface.card", mode: "light" }}
        className="absolute flex items-center justify-center rounded-container"
        style={{ left: 48, top: BODY_TOP, width: 690, height: 800 - BODY_TOP - BODY_BOTTOM }}
      >
        <Construction
          values={{
            opening: text(6),
            ring: text(2),
            dot: text(8),
            stroke: text(4),
            clear: text(4),
          }}
        />
      </Flood>
      <div
        className="absolute flex flex-col gap-6"
        style={{ left: 770, top: BODY_TOP, width: 462 }}
      >
        <ArtLine line={lineAt(l, 0)} />
        <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
          {facts.map(([a, b]) => (
            <div key={a} className="contents">
              <ArtLine line={lineAt(l, a)} />
              <ArtLine line={lineAt(l, b)} />
            </div>
          ))}
        </div>
        <div className="flex items-end gap-8">
          {[11, 12, 13, 14].map((i) => (
            <div key={i} {...scope("light")} className="flex flex-col items-start gap-2">
              <Logo kind="mark" height={Number(text(i))} decorative />
              <ArtLine line={lineAt(l, i)} />
            </div>
          ))}
        </div>
        <ArtLine line={lineAt(l, 15)} />
      </div>
    </>
  );
}

function Grounds({ page }: { page: BookPageRecord }) {
  const grounds = page.ground as readonly Paint[];
  const third = BOOK_FRAME.size.w / 3;
  return (
    <div className="absolute inset-0 flex">
      {grounds.map((paint, i) => (
        <Flood
          key={i}
          paint={paint}
          className="relative"
          style={{ width: third, height: BOOK_FRAME.size.h }}
        >
          <div
            {...scope(textMode(paint))}
            className="absolute flex items-center justify-center"
            style={{ left: 0, right: 0, top: 0, bottom: 0 }}
          >
            <Logo kind="horizontal" height={64} tone={i === 0 ? "one-colour" : "full"} decorative />
          </div>
          <div className="absolute" style={{ left: BOOK_FRAME.pad.side, bottom: 84 }}>
            <ArtLine line={lineAt(page.lines, i)} />
          </div>
        </Flood>
      ))}
    </div>
  );
}

function PaletteFields({ page }: { page: BookPageRecord }) {
  const m = useMessages();
  const ids = page.swatches ?? [];
  const ratio = [44, 26, 18, 12];
  const field = (id: PaletteId, mode: Mode, lines: number[], split?: number) => {
    const entry = paletteOf(id);
    return (
      <div
        key={id}
        {...scope(mode)}
        data-swatch={id}
        className="relative flex min-h-0 flex-col justify-between border border-border-subtle text-text-primary"
        style={{ background: entry.hex, flex: `${split ?? 1} 1 0`, padding: 20 }}
      >
        <div className="flex flex-col gap-1 font-body">
          <span className="text-label-md">{copyOf(m, entry.name)}</span>
          <span className="font-mono text-code-md">{entry.hex}</span>
        </div>
        <div className="flex flex-col gap-2">
          {lines.map((i) => (
            <ArtLine key={i} line={lineAt(page.lines, i)} />
          ))}
        </div>
      </div>
    );
  };
  const [canvas, ink, violet, violetDark, lime] = ids;
  if (!canvas || !ink || !violet || !violetDark || !lime) return null;
  return (
    <div
      className="absolute flex"
      style={{ left: 0, top: 70, width: BOOK_FRAME.size.w, height: 666, gap: 3 }}
    >
      <div className="flex" style={{ flex: `${ratio[0]} 1 0` }}>
        {field(canvas, "light", [0, 1])}
      </div>
      <div className="flex" style={{ flex: `${ratio[1]} 1 0` }}>
        {field(ink, "dark", [2, 3])}
      </div>
      <div className="flex" style={{ flex: `${ratio[2]} 1 0` }}>
        {field(violet, "dark", [4, 5])}
      </div>
      <div className="flex flex-col" style={{ flex: `${ratio[3]} 1 0`, gap: 3 }}>
        {field(violetDark, "light", [6], 55)}
        {field(lime, "light", [7], 45)}
      </div>
    </div>
  );
}

function TypePage({ page }: { page: BookPageRecord }) {
  return (
    <>
      <div className="absolute" style={{ left: BOOK_FRAME.pad.side, top: BODY_TOP }}>
        <ArtLine line={lineAt(page.lines, 0)} />
      </div>
      <div
        className="absolute grid grid-cols-3"
        style={{ left: 48, right: 48, bottom: BODY_BOTTOM, gap: 28 }}
      >
        {[1, 7, 13].map((from) => (
          <div
            key={from}
            {...scope("light")}
            className="flex min-w-0 flex-col gap-5 border-t border-border-subtle pt-5"
          >
            <ColumnLines lines={page.lines} from={from} to={from + 6} />
          </div>
        ))}
      </div>
    </>
  );
}

function VoicePage({ page }: { page: BookPageRecord }) {
  return (
    <>
      <div className="absolute flex flex-col gap-5" style={{ left: 48, top: BODY_TOP, right: 48 }}>
        <ArtLine line={lineAt(page.lines, 0)} />
        <ArtLine line={lineAt(page.lines, 1)} />
      </div>
      <div
        className="absolute grid grid-cols-3"
        style={{ left: 48, right: 48, bottom: BODY_BOTTOM, gap: 28 }}
      >
        {[2, 4, 6].map((from) => (
          <div
            key={from}
            {...scope("dark")}
            className="flex flex-col gap-2 border-t border-border-strong pt-5"
          >
            <ColumnLines lines={page.lines} from={from} to={from + 2} />
          </div>
        ))}
      </div>
    </>
  );
}

function Applications({ page }: { page: BookPageRecord }) {
  const art = page.art;
  if (art?.kind !== "pieces") return null;
  return (
    <>
      {art.pieces.map((p: Placement, i) => (
        <div
          key={i}
          className="absolute"
          style={{ left: p.box.x, top: p.box.y }}
          {...("piece" in p ? { "data-piece": p.piece } : { "data-placement": p.specimen })}
        >
          {"piece" in p ? (
            <PieceArt
              piece={pieceOf(p.piece)}
              size={{ w: p.box.w, h: p.box.h }}
              variant={p.variant}
            />
          ) : (
            <IconSet glyphs={p.glyphs} size={{ w: p.box.w, h: p.box.h }} />
          )}
        </div>
      ))}
    </>
  );
}

function Checks({ page }: { page: BookPageRecord }) {
  return (
    <>
      <div className="absolute flex flex-col gap-4" style={{ left: 48, top: BODY_TOP, width: 700 }}>
        <ArtLine line={lineAt(page.lines, 0)} />
        <ArtLine line={lineAt(page.lines, 1)} />
      </div>
      <div
        className="absolute grid grid-cols-4"
        style={{ left: 48, right: 48, bottom: BODY_BOTTOM, gap: 28 }}
      >
        {[2, 4, 6, 8].map((from) => (
          <div
            key={from}
            {...scope("light")}
            className="flex flex-col gap-3 border-t border-border-strong pt-5"
          >
            <ColumnLines lines={page.lines} from={from} to={from + 2} />
          </div>
        ))}
      </div>
    </>
  );
}

function Cover({ page }: { page: BookPageRecord }) {
  const art = page.art;
  return (
    <>
      {art?.kind === "giant-mark" ? (
        <GiantMark
          size={art.size}
          ring={art.ring}
          dot={art.dot}
          style={{ left: art.x, top: art.y }}
        />
      ) : null}
      <div {...scope("dark")} className="absolute" style={{ left: 48, top: BODY_TOP }}>
        <Logo kind="horizontal" height={64} tone="one-colour" decorative />
      </div>
      <div className="absolute" style={{ left: 48, bottom: BODY_BOTTOM }}>
        <ArtLine line={lineAt(page.lines, 0)} />
      </div>
    </>
  );
}

function Contents({ page }: { page: BookPageRecord }) {
  return (
    <>
      <div className="absolute" style={{ left: 48, top: BODY_TOP }}>
        <ArtLine line={lineAt(page.lines, 0)} />
      </div>
      <div
        className="absolute grid grid-cols-3"
        style={{ left: 48, right: 48, bottom: BODY_BOTTOM, gap: 28 }}
      >
        {[1, 4, 7].map((from) => (
          <div
            key={from}
            {...scope("light")}
            className="flex flex-col justify-between border-t border-border-strong pt-5"
            style={{ height: 260 }}
          >
            <ArtLine line={lineAt(page.lines, from)} />
            <div className="flex flex-col gap-2">
              <ArtLine line={lineAt(page.lines, from + 1)} />
              <ArtLine line={lineAt(page.lines, from + 2)} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/** One brandbook page at 1280 x 800, with the furniture rows on every page. */
function BookPageArt({ n }: { n: number }) {
  const page = bookPage(n);
  const { size, pad, inkHalf } = BOOK_FRAME;
  const grounds = Array.isArray(page.ground) ? (page.ground as readonly Paint[]) : null;
  const single = grounds ? null : (page.ground as Paint);
  const startPaint = page.split ? INK : grounds ? at(grounds, 0) : (single ?? PAPER);
  const endPaint = grounds ? at(grounds, grounds.length - 1) : startPaint;
  const left = pad.side;
  const width = (page.split ? inkHalf : size.w) - 2 * pad.side;
  const body = (() => {
    switch (page.layout) {
      case "cover":
        return <Cover page={page} />;
      case "contents":
        return <Contents page={page} />;
      case "opener":
        return <Opener page={page} />;
      case "construction":
        return <Construction4 page={page} />;
      case "grounds":
        return <Grounds page={page} />;
      case "palette":
        return <PaletteFields page={page} />;
      case "type":
        return <TypePage page={page} />;
      case "voice":
        return <VoicePage page={page} />;
      case "applications":
        return <Applications page={page} />;
      case "checks":
        return <Checks page={page} />;
    }
  })();
  const ground = grounds ? at(grounds, 0) : (single ?? PAPER);
  return (
    <Flood
      paint={page.split ? INK : ground}
      className="relative overflow-hidden"
      data-book-page={n}
      style={{ width: size.w, height: size.h }}
    >
      {body}
      <Furniture
        page={page}
        startPaint={startPaint}
        endPaint={endPaint}
        left={left}
        width={width}
      />
    </Flood>
  );
}

// ---- the logo, type and palette pages of the previews

function LogoPage({ kind }: { kind: "mark" | "horizontal" | "onInk" }) {
  const dark = kind === "onInk";
  return (
    <Flood
      paint={dark ? INK : PAPER}
      className="flex items-center justify-center"
      style={{ width: BOARD_DESIGN.w, height: BOARD_DESIGN.h }}
    >
      <div {...scope(dark ? "dark" : "light")}>
        {kind === "mark" ? (
          <Logo kind="mark" height={460} decorative />
        ) : (
          <Logo kind="horizontal" height={kind === "horizontal" ? 220 : 200} decorative />
        )}
      </div>
    </Flood>
  );
}

function TypeSpecimen({ kind }: { kind: "latin" | "thai" }) {
  const m = useMessages();
  const latin = kind === "latin";
  const { face, glyphs, alphabet, tagline } = TYPE_SPECIMEN[kind];
  return (
    <Flood
      paint={PAPER}
      className="flex flex-col justify-between"
      style={{ width: BOARD_DESIGN.w, height: BOARD_DESIGN.h, padding: 80 }}
    >
      <div {...scope("light")} className="flex flex-col gap-6 text-text-primary">
        <p className="m-0 font-mono text-code-md text-text-secondary">{face}</p>
        <p
          className="m-0 font-display"
          style={{
            fontSize: "calc(var(--ds-type-display-lg-font-size) * 4.2)",
            lineHeight: "var(--ds-type-display-lg-line-height)",
          }}
          lang={latin ? "en" : "th"}
        >
          {glyphs}
        </p>
      </div>
      <div {...scope("light")} className="flex flex-col gap-4 text-text-primary">
        <p className="m-0 font-body text-body-lg" lang={latin ? "en" : "th"}>
          {alphabet}
        </p>
        <p className="m-0 font-display text-heading-md" lang={latin ? "en" : "th"}>
          {tagline}
        </p>
        <p className="m-0 font-body text-body-md text-text-secondary">
          {latin ? m.orvCanvas.preview.latin : m.orvCanvas.preview.thaiNote}
        </p>
      </div>
    </Flood>
  );
}

function PaletteSpecimen({ which }: { which: "all" | PaletteId }) {
  const m = useMessages();
  const ids: readonly PaletteId[] = which === "all" ? PALETTE.map((p) => p.id) : [which];
  const modeOf = (id: PaletteId): Mode => (id === "violet" || id === "ink" ? "dark" : "light");
  return (
    <div className="flex" style={{ width: BOARD_DESIGN.w, height: BOARD_DESIGN.h, gap: 3 }}>
      {ids.map((id) => {
        const entry = paletteOf(id);
        return (
          <div
            key={id}
            {...scope(modeOf(id))}
            data-swatch={id}
            className="flex min-w-0 flex-1 flex-col justify-between border border-border-subtle text-text-primary"
            style={{ background: entry.hex, padding: 40 }}
          >
            <div className="flex flex-col gap-2 font-body">
              <span className="font-display text-display-md">{copyOf(m, entry.name)}</span>
              <span className="font-mono text-heading-sm">{entry.hex}</span>
            </div>
            <span className="font-body text-body-md">{copyOf(m, entry.role)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---- node bodies

const MUTED = "m-0 font-body text-body-xs text-text-secondary";

type RowsBody = Extract<BodyRecord, { kind: "rows" }>;

function Rows({ body }: { body: RowsBody }) {
  const m = useMessages();
  const locale = useLocale();
  const head = body.head;
  const headText = head ? textOf(m, head.text) : "";
  const sub = head?.sub ? textOf(m, head.sub) : null;
  const headBlock = head ? (
    <div className="flex flex-col gap-1">
      <p className={cx("m-0 text-text-primary", STYLE_CLASS[head.style])} lang={langOf(headText)}>
        {headText}
      </p>
      {sub ? (
        <p className="m-0 font-body text-body-sm text-text-secondary" lang={langOf(sub)}>
          {sub}
        </p>
      ) : null}
    </div>
  ) : null;
  const note = body.note ? <p className={MUTED}>{copyOf(m, body.note)}</p> : null;
  const name = (row: RowRecord) => textOf(m, row.name);
  switch (body.look) {
    case "plain":
      return headBlock;
    case "pairs":
      return (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {body.rows.map((row) => (
            <li key={row.id} className="flex flex-col">
              <span className="font-body text-label-md text-text-primary">{name(row)}</span>
              <span className="font-body text-body-sm text-text-secondary">
                {row.value ? textOf(m, row.value) : null}
              </span>
            </li>
          ))}
        </ul>
      );
    case "bars":
      return (
        <div className="flex flex-col gap-2">
          <ul className="m-0 grid list-none grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 p-0">
            {body.rows.map((row) => (
              <li key={row.id} className="col-span-3 grid grid-cols-subgrid items-center">
                <span className="font-body text-label-md text-text-primary">{name(row)}</span>
                <div
                  aria-hidden="true"
                  className="h-1.5 overflow-hidden rounded-round bg-surface-sunken"
                >
                  <div
                    className="h-full rounded-round bg-text-primary"
                    style={{ width: `${row.number ?? 0}%` }}
                  />
                </div>
                <span className="font-mono text-code-md text-text-secondary">
                  {formatNumber(row.number ?? 0, locale)}
                </span>
              </li>
            ))}
          </ul>
          {note}
        </div>
      );
    case "chips":
      return (
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {body.rows.map((row) => (
            <li
              key={row.id}
              className="inline-flex items-center gap-1 rounded-check border border-border-subtle px-2 py-0.5 font-body text-label-sm text-text-primary"
            >
              <CloseIcon className="size-3 text-text-secondary" aria-hidden="true" />
              {name(row)}
            </li>
          ))}
        </ul>
      );
    case "attributes":
      return (
        <dl className="m-0 flex flex-col gap-2.5">
          {body.rows.map((row) => (
            <div key={row.id} className="flex flex-col">
              <dt className="font-body text-label-sm text-text-secondary">{name(row)}</dt>
              <dd className="m-0 font-body text-body-sm text-text-primary">
                {row.value ? textOf(m, row.value) : null}
              </dd>
            </div>
          ))}
        </dl>
      );
    case "named":
      return (
        <div className="flex flex-col gap-3">
          {headBlock}
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {body.rows.map((row) => (
              <li key={row.id} className="flex items-baseline gap-3">
                <span className="w-8 shrink-0 font-mono text-code-md text-text-brand">
                  {row.key}
                </span>
                <span className="font-body text-body-sm text-text-secondary">{name(row)}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "reasons":
      return (
        <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
          {body.rows.map((row) => (
            <li key={row.id} className="flex items-start gap-3">
              <span className="flex h-6 items-center font-display text-heading-sm text-text-brand">
                {row.key}
              </span>
              <span className="font-body text-body-sm text-text-primary">{name(row)}</span>
            </li>
          ))}
        </ol>
      );
    case "versions":
      return (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {body.rows.map((row) => (
            <li key={row.id} className="flex items-center gap-2">
              <span className="flex shrink-0" aria-hidden="true">
                {(row.colours ?? []).map((hex, i) => (
                  <span
                    key={i}
                    className="border border-border-subtle"
                    style={{ width: 10, height: 24, background: hex }}
                  />
                ))}
              </span>
              <span className="font-mono text-code-md text-text-primary">{row.key}</span>
              <span className="min-w-0 flex-1 font-body text-body-sm text-text-secondary">
                {name(row)}
              </span>
              {row.badge ? (
                <Badge variant="brand" size="sm">
                  {m.orvCanvas.inUse}
                </Badge>
              ) : null}
            </li>
          ))}
        </ul>
      );
    case "segments": {
      const summary = body.rows.map((row) => `${name(row)} ${row.number ?? 0}`).join(", ");
      return (
        <div className="flex flex-col gap-2">
          <div role="img" aria-label={summary} className="flex" style={{ height: 36, gap: 2 }}>
            {body.rows.map((row) => (
              <span
                key={row.id}
                className="border border-border-subtle"
                style={{
                  flexGrow: row.number ?? 0,
                  flexBasis: 0,
                  background: row.palette ? paletteOf(row.palette).hex : undefined,
                }}
              />
            ))}
          </div>
          {body.note ? (
            <p className="m-0 font-body text-body-sm text-text-secondary">{copyOf(m, body.note)}</p>
          ) : null}
        </div>
      );
    }
  }
}

function Quote({ body }: { body: Extract<BodyRecord, { kind: "quote" }> }) {
  const m = useMessages();
  const locale = useLocale();
  return (
    <div className={cx("flex flex-col", body.badges ? "gap-1.5" : "gap-2")}>
      <p
        className={cx(
          "m-0 font-body text-text-primary",
          body.size === "md" ? "text-body-md" : "text-body-lg",
        )}
        lang={body.lang}
      >
        {body.quote}
      </p>
      {body.gloss && body.lang !== locale ? (
        <p className={MUTED}>{`${m.orvCanvas.paraphrase}: ${copyOf(m, body.gloss)}`}</p>
      ) : null}
      {body.note ? <p className={MUTED}>{copyOf(m, body.note)}</p> : null}
      {body.badges ? (
        <div className="flex flex-wrap gap-2">
          {body.badges.map((key) => (
            <Badge key={key} size="sm">
              {copyOf(m, key)}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BoardBody({ board }: { board: BoardId }) {
  const m = useMessages();
  const record = BOARDS[board];
  return (
    <>
      <div className="ds-node__media">
        <ArtFrame design={BOARD_DESIGN} width={542}>
          <BoardArt board={board} />
        </ArtFrame>
      </div>
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Badge size="sm">{copyOf(m, record.badge)}</Badge>
        <span className={MUTED}>{copyOf(m, record.line)}</span>
      </div>
    </>
  );
}

function BuildTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex size-12 items-center justify-center rounded-media bg-surface-sunken">
        {children}
      </div>
      <span className="font-body text-body-xs text-text-secondary">{label}</span>
    </div>
  );
}

function LogoBody({
  part,
  note,
}: {
  part: "build" | "history" | "mark";
  note?: CopyKey | undefined;
}) {
  const m = useMessages();
  const { ring, dot } = GEOMETRY.mark;
  const operator = (glyph: string) => (
    <span aria-hidden="true" className="font-display text-heading-sm text-text-secondary">
      {glyph}
    </span>
  );
  if (part === "build") {
    return (
      <div className="flex items-start justify-between">
        <BuildTile label={m.orvCanvas.build.loop}>
          <svg viewBox="0 0 150 150" width={36} height={36} className="ds-logo" aria-hidden="true">
            <circle
              className="ds-logo__ring"
              cx={75}
              cy={77.5}
              r={52.5}
              fill="none"
              strokeWidth={RING_STROKE.master}
            />
          </svg>
        </BuildTile>
        {operator("−")}
        <BuildTile label="110°">
          <svg viewBox="0 0 150 150" width={36} height={36} className="ds-logo" aria-hidden="true">
            <path
              d={`M 75 77.5 L ${ring.start[0]} ${ring.start[1]} A 52.5 52.5 0 0 1 ${ring.end[0]} ${ring.end[1]} Z`}
              className="ds-logo__ring"
              strokeWidth={4}
              style={{ fill: tokenVar("text.brand") }}
            />
          </svg>
        </BuildTile>
        {operator("+")}
        <BuildTile label={m.orvCanvas.build.dot}>
          <svg viewBox="0 0 150 150" width={36} height={36} className="ds-logo" aria-hidden="true">
            <circle className="ds-logo__dot" cx={dot.cx} cy={dot.cy} r={DOT_RADIUS.master} />
          </svg>
        </BuildTile>
        {operator("=")}
        <BuildTile label={m.orvCanvas.build.mark}>
          <Logo kind="mark" height={36} decorative />
        </BuildTile>
      </div>
    );
  }
  if (part === "history") {
    const versions: { key: string; mark: ReactNode }[] = [
      {
        key: "v1.1",
        mark: (
          <DrawnMark
            ring={RING_80}
            dotRadius={15}
            dotFill={paletteOf("lime").hex}
            dotClass={false}
          />
        ),
      },
      { key: "v1.2", mark: <DrawnMark ring={RING_80} dotRadius={15} /> },
      { key: "v1.3", mark: <DrawnMark ring={RING_110} dotRadius={15} /> },
      { key: "v1.4", mark: <DrawnMark ring={RING_110} dotRadius={21} /> },
      {
        key: "v1.5",
        mark: (
          <span className="flex items-center justify-center rounded-control bg-surface-sunken">
            <Logo kind="mark" height={36} decorative />
          </span>
        ),
      },
    ];
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          {versions.map((v) => (
            <div key={v.key} className="flex flex-col items-center gap-1">
              {v.mark}
              <span className="font-mono text-code-md text-text-secondary">{v.key}</span>
            </div>
          ))}
        </div>
        {note ? <p className={MUTED}>{copyOf(m, note)}</p> : null}
      </div>
    );
  }
  return (
    <>
      <div className="ds-node__media flex h-60 items-center justify-center bg-surface-sunken">
        <Logo kind="mark" height={160} />
      </div>
      <div className="flex h-16 items-center px-2">
        <Logo kind="horizontal" height={36} />
      </div>
    </>
  );
}

function PaletteBody() {
  const m = useMessages();
  const modeOf = (id: PaletteId): Mode => (id === "violet" || id === "ink" ? "dark" : "light");
  return (
    <>
      <div className="ds-node__media flex" style={{ height: 220, gap: 2 }}>
        {PALETTE.map((entry) => (
          <div
            key={entry.id}
            {...scope(modeOf(entry.id))}
            data-swatch={entry.id}
            className="flex min-w-0 flex-1 flex-col justify-end gap-1 border border-border-subtle p-1.5 text-text-primary"
            style={{ background: entry.hex }}
          >
            <span className="font-body text-label-sm [overflow-wrap:anywhere]">
              {copyOf(m, entry.name)}
            </span>
            <span className="font-mono text-body-xs whitespace-nowrap">{entry.hex}</span>
          </div>
        ))}
      </div>
      <p className={cx(MUTED, "px-2 py-2")}>{m.orvCanvas.palette.limeNote}</p>
    </>
  );
}

function ContrastBody({ rows }: { rows: readonly RowRecord[] }) {
  const m = useMessages();
  const locale = useLocale();
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex items-center justify-center rounded-control border border-border-subtle font-display text-label-md"
            style={{
              width: 44,
              height: 32,
              color: row.pair?.fg,
              background: row.pair?.bg,
            }}
          >
            Aa
          </span>
          <span className="flex-1 font-body text-body-sm text-text-primary">
            {textOf(m, row.name)}
          </span>
          <span className="font-display text-heading-sm text-text-primary">
            {`${formatNumber(row.number ?? 0, locale)} : 1`}
          </span>
        </li>
      ))}
    </ul>
  );
}

function DemoBody({ body }: { body: Extract<BodyRecord, { kind: "demo" }> }) {
  const m = useMessages();
  const { mode } = useContext(PageContext);
  const record = imageOf(body.image);
  const width = 342;
  const size = { w: width, h: Math.round((width * record.height) / record.width) };
  return (
    <>
      <div className="ds-node__media relative">
        <Photo id={body.image} size={size} flood={PAPER} />
        <div className="absolute" style={{ left: 8, top: 8 }}>
          <Badge variant="warning" size="sm">
            {m.orvCanvas.demo.badge}
          </Badge>
        </div>
        {body.points.map((point) => (
          <span
            key={point.n}
            aria-hidden="true"
            className={cx(
              "absolute rounded-round ring-2",
              // In dark the card's own ground would melt into the black paper at point 3.
              mode === "dark" ? "ring-border-subtle" : "ring-surface-card",
            )}
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              width: 22,
              height: 22,
              translate: "-50% -50%",
            }}
          >
            <span
              {...scope("dark")}
              className="flex size-full items-center justify-center rounded-round bg-surface-canvas text-text-primary"
            >
              {/* The scope resets the type, so the numeral sets its own step inside it (ORV-290 row 31). */}
              <span className="font-body text-label-sm leading-none tabular-nums">{point.n}</span>
            </span>
          </span>
        ))}
      </div>
      <div className="flex gap-1 px-2 pt-2">
        {body.points.map((point) => (
          <span
            key={point.n}
            title={point.hex}
            className="flex-1 border border-border-subtle"
            style={{ height: 20, background: point.hex }}
          />
        ))}
      </div>
      <p className={cx(MUTED, "px-2 py-2")}>{m.orvCanvas.demo.note}</p>
    </>
  );
}

const FIRST_PAGE: Record<string, number> = { cover: 1, logo: 3, colour: 6, use: 10 };

function BookStack({ part }: { part: keyof typeof FIRST_PAGE }) {
  const edge = "h-1.5 rounded-t-media border border-b-0 border-border-card bg-surface-card";
  return (
    <div className="flex flex-col">
      <div className={cx(edge, "mx-4")} aria-hidden="true" />
      <div className={cx(edge, "mx-2")} aria-hidden="true" />
      <div className="ds-node__media">
        <ArtFrame design={BOARD_DESIGN} width={342}>
          <BookPageArt n={FIRST_PAGE[part] ?? 1} />
        </ArtFrame>
      </div>
    </div>
  );
}

// ---- the design system sheets (spec ORV-309 rows 8 and 9)

/** Sheet data, not copy: the project the sheets are about, and an address that is not complete. */
const SHEET_PROJECT = "ORIVILO";
const SHEET_SITE = "orivilo.example";
/** The sheet's media slot: 540 wide at 1280 x 800 is 337.5 high. */
const SHEET_FRAME_HEIGHT = 337.5;

/** A catalog entry on the base sheet: its code name over one live instance (base-sheet-1). */
function Item({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1" data-catalog={name}>
      <span className="font-body text-label-sm text-text-secondary">{name}</span>
      {children}
    </div>
  );
}

/**
 * The base sheet: three columns at 1280 x 800, one live instance of each catalog entry of
 * `SHEETS.base` under its name. It shows default, selected, disabled, loading, error and empty
 * states; focus is shown by a play. No intent button (intent-once-1).
 */
function BaseSheet() {
  const m = useMessages();
  const s = m.orvCanvas.sheet;
  const entries: Record<string, ReactNode> = {
    Button: (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary">{s.button.start}</Button>
          <Button variant="secondary">{s.button.open}</Button>
          <Button variant="ghost">{s.button.skip}</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="destructive" size="sm">
            {s.button.remove}
          </Button>
          <Button variant="primary" size="sm" loading loadingLabel={s.button.saving}>
            {s.button.saving}
          </Button>
          <Button variant="secondary" size="sm" disabled>
            {s.button.publish}
          </Button>
          <Button variant="link" size="sm">
            {s.button.readGuide}
          </Button>
        </div>
      </>
    ),
    ToggleGroup: (
      <div className="flex">
        <ToggleGroup type="single" defaultValue="board" size="sm" aria-label={s.view.board}>
          <ToggleGroupItem value="board">{s.view.board}</ToggleGroupItem>
          <ToggleGroupItem value="list">{s.view.list}</ToggleGroupItem>
        </ToggleGroup>
      </div>
    ),
    Tabs: (
      <Tabs defaultValue="board">
        <TabsList size="sm">
          <TabsTrigger value="board">{s.view.board}</TabsTrigger>
          <TabsTrigger value="guide">{s.view.guidebook}</TabsTrigger>
          <TabsTrigger value="history" count={3}>
            {s.view.history}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    ),
    Breadcrumb: (
      <Breadcrumb>
        <BreadcrumbLink href="#">{s.view.projects}</BreadcrumbLink>
        <BreadcrumbLink href="#">{SHEET_PROJECT}</BreadcrumbLink>
        <BreadcrumbPage>{s.view.board}</BreadcrumbPage>
      </Breadcrumb>
    ),
    Kbd: (
      <div className="flex items-center gap-3 font-body text-body-sm text-text-secondary">
        <Kbd shortcut="Mod+K" />
        {s.view.command}
      </div>
    ),
    Avatar: (
      <div className="flex items-center gap-2">
        <Avatar name={s.owner} size="md" />
        <span className="font-body text-body-sm">{s.owner}</span>
      </div>
    ),
    FeaturedIcon: (
      <div className="flex items-center gap-3">
        <FeaturedIcon variant="info" size="md" />
        <FeaturedIcon variant="success" size="md" />
      </div>
    ),
    Field: (
      <Field label={s.field.name} required>
        <Input size="sm" defaultValue={SHEET_PROJECT} />
      </Field>
    ),
    Input: (
      <Field label={s.field.site} error={s.siteError}>
        <Input size="sm" defaultValue={SHEET_SITE} />
      </Field>
    ),
    Select: (
      <Field label={s.field.language}>
        <Select
          size="sm"
          defaultValue="en"
          options={[
            { value: "en", label: s.option.english },
            { value: "th", label: s.option.thai },
          ]}
        />
      </Field>
    ),
    Checkbox: <Checkbox label={s.option.both} defaultChecked />,
    Switch: (
      <div className="flex items-center gap-3">
        <Switch defaultChecked aria-label={s.option.dark} />
        <span className="font-body text-body-sm">{s.option.dark}</span>
      </div>
    ),
    Slider: <Slider label={s.option.radius} defaultValue={16} max={24} />,
    Textarea: (
      <Field label={s.field.brief}>
        <Textarea size="sm" rows={2} maxLength={280} showCount defaultValue={s.briefValue} />
      </Field>
    ),
    Badge: (
      <div className="flex flex-wrap gap-2">
        <Badge variant="brand">{at(BRAND_PROFILES, 0).id}</Badge>
        <Badge variant="success">{s.badge.agreed}</Badge>
        <Badge variant="warning">{s.badge.sample}</Badge>
        <Badge variant="info">{s.badge.rules}</Badge>
      </div>
    ),
    Tag: (
      <div className="flex flex-wrap gap-2">
        {[s.voice.thoughtful, s.voice.clear, s.voice.reasoned].map((label, i) => (
          <Tag key={label} label={label} defaultSelected={i === 0} />
        ))}
      </div>
    ),
    RadioGroup: (
      <RadioGroup defaultValue="mine" aria-label={s.radio.whose}>
        <RadioGroupItem value="mine" label={s.radio.mine} />
        <RadioGroupItem value="competitor" label={s.radio.competitor} />
      </RadioGroup>
    ),
    Progress: <Progress label={s.reading} value={60} />,
    Alert: <Alert variant="info" title={s.alert.title} description={s.alert.text} />,
    Spinner: <Spinner size="sm" label={s.loading} labelHidden />,
    Skeleton: (
      <div className="flex flex-col gap-2">
        <Skeleton shape="text" />
        <Skeleton shape="text" className="w-2/3" />
      </div>
    ),
  };
  return (
    <div
      className="grid h-[800px] w-[1280px] grid-cols-3 gap-14 overflow-hidden bg-surface-canvas px-12 py-6"
      data-sheet="base"
    >
      {SHEETS.base.map((column) => (
        <section key={column.id} className="flex min-w-0 flex-col gap-2" data-column={column.id}>
          <h3 className="m-0 border-b border-border-subtle pb-3 font-display text-heading-sm text-text-primary">
            {copyOf(m, column.title)}
          </h3>
          {column.entries.map((name) => {
            const entry = entries[name];
            if (entry === undefined) throw new RangeError(`orivilo-canvas: no sheet entry ${name}`);
            return (
              <Item key={name} name={name}>
                {entry}
              </Item>
            );
          })}
        </section>
      ))}
    </div>
  );
}

/**
 * The composed sheet: a working Studio at 1280 x 800. A board of five block nodes with the
 * selected one's toolbar, the canvas controls and a collapsed task bar; beside it the inspector of
 * the selected node and the rules chat. The chat holds one sample exchange, asked once when the
 * sheet mounts: the starter question and one fixed reply, labelled "By rules" (nothing is read).
 */
function ComposedSheet() {
  const m = useMessages();
  const locale = useLocale();
  const root = useRef<HTMLDivElement>(null);
  const asked = useRef(false);
  const graph = useMemo(() => studioGraph(locale, m), [locale, m]);
  const reply = useMemo(
    () =>
      async function* () {
        yield { text: m.orvCanvas.sheet.rulesReply, basis: "rules" as const };
      },
    [m],
  );
  useEffect(() => {
    if (asked.current) return;
    const starter = root.current?.querySelector<HTMLButtonElement>(".ds-chat__starters button");
    const form = root.current?.querySelector<HTMLFormElement>(".ds-chat__composer");
    if (!starter || !form) return;
    asked.current = true;
    // The starter fills the box; the next frame has rendered the filled box, which can be sent.
    starter.click();
    requestAnimationFrame(() => {
      if (form.isConnected) form.requestSubmit();
    });
  }, []);
  return (
    // The seeding click bubbles; the node, the stage or the page that holds this sheet must not
    // take it for a click of the person (it would select the node or turn the preview's page).
    <div
      ref={root}
      className="flex h-[800px] w-[1280px] overflow-hidden bg-surface-canvas"
      data-sheet="composed"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="relative min-w-0 flex-1">
        <CanvasBoard label={m.orvCanvas.sheet.studio} graph={graph} minimap={false}>
          <TrueHandles />
          {/* C6: a bottom inset of space.6 keeps the board's attribution link clear of the bar. */}
          <TaskBar
            className="bottom-6!"
            jobs={locale === "en" ? fixtureTaskJobsEn : fixtureTaskJobs}
            defaultExpanded={false}
          />
        </CanvasBoard>
      </div>
      <div className="grid w-[400px] shrink-0 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-3 border-s border-border-subtle p-3">
        <div className="min-h-0 overflow-hidden rounded-container border border-border-card">
          <Inspector graph={graph} onAnswer={() => undefined} />
        </div>
        <CanvasChat variant="sidebar" basis="rules" onAsk={reply} />
      </div>
    </div>
  );
}

/** A sheet on a result node: the 1280 x 800 sheet scaled to the media slot (540 wide). */
function SheetBody({ sheet }: { sheet: "base" | "composed" }) {
  return (
    <div className="ds-node__media border border-border-subtle">
      <LiveFrame outer={{ w: 540, h: SHEET_FRAME_HEIGHT }} design={1280}>
        {sheet === "base" ? <BaseSheet /> : <ComposedSheet />}
      </LiveFrame>
    </div>
  );
}

/**
 * The landing and the two product screens, live, at their design width (spec ORV-309 rows 5 to 7).
 * The landing brings its own dark profile and language; the app is a 1280 x 800 box, so the board
 * inside it fits the same way at any scale; the guidebook is the page itself.
 */
function LivePage({ id }: { id: LiveId }) {
  const locale = useLocale();
  const { missing } = useContext(PageContext);
  if (id === "landing") {
    return <OriviloLanding lang={locale} photograph={!missing.has("direction-making")} />;
  }
  if (id === "app") {
    return (
      <div style={{ height: 800 }}>
        <BusinessBoardScreen
          access="ready"
          view={locale === "en" ? ENGLISH_VIEW : THAI_VIEW}
          signInHref="#"
          listHref="#"
          guidebookHref="#"
        />
      </div>
    );
  }
  return <GuidebookScreen access="ready" guidebook={done(locale)} boardHref="#" signInHref="#" />;
}

function PageBody({ id }: { id: LiveId }) {
  const m = useMessages();
  const frame = FRAMES.find((f) => f.id === id);
  if (!frame) throw new RangeError(`orivilo-canvas: no frame ${id}`);
  const p = m.orvCanvas.product;
  return (
    <>
      <div className="ds-node__media border border-border-subtle">
        <LiveFrame
          outer={{ w: 460, h: frame.height - 2 }}
          design={frame.width}
          start={frame.start}
          startAt={frame.startAt}
          fade={frame.fade}
          mode={id === "landing" ? "dark" : undefined}
        >
          <LivePage id={id} />
        </LiveFrame>
      </div>
      <div className="flex items-center gap-2 px-2 py-2">
        <Badge variant="warning" size="sm">
          {id === "landing" ? p.landingBadge : p.badge}
        </Badge>
        <span className={MUTED}>{p[`${id}Note` as const]}</span>
      </div>
    </>
  );
}

function TypeBody() {
  return (
    <p className="m-0 font-display text-display-lg text-text-primary" lang="th">
      {TYPE_SAMPLE}
    </p>
  );
}

function NodeBody({ record }: { record: NodeRecord }) {
  const body = record.body;
  switch (body.kind) {
    case "rows":
      return <Rows body={body} />;
    case "quote":
      return <Quote body={body} />;
    case "board":
      return <BoardBody board={body.board} />;
    case "logo":
      return <LogoBody part={body.part} note={body.note} />;
    case "type":
      return <TypeBody />;
    case "palette":
      return <PaletteBody />;
    case "contrast":
      return <ContrastBody rows={body.rows} />;
    case "demo":
      return <DemoBody body={body} />;
    case "book":
      return <BookStack part={body.part} />;
    case "sheet":
      return <SheetBody sheet={body.sheet} />;
    case "page":
      return <PageBody id={body.page} />;
  }
}

// ---- the preview

function Stage({ children }: { children: (size: Size) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const style = getComputedStyle(el);
      const x = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const y = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      setSize({ w: Math.max(0, el.clientWidth - x), h: Math.max(0, el.clientHeight - y) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      data-stage=""
      className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-container bg-surface-sunken p-6"
    >
      {size ? children(size) : null}
    </div>
  );
}

function Scrolling({
  label,
  size,
  width,
  opensAt,
  children,
}: {
  label: string;
  size: Size;
  width: number;
  /** A selector inside the page: the page opens scrolled to it. */
  opensAt?: string | undefined;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // The guidebook opens at its foundation heading. A web font that swaps in after mount, or a late
  // image, moves the heading, so the offset is applied again whenever the content resizes, until
  // the reader moves the page themselves (review R1-7).
  useEffect(() => {
    if (opensAt === undefined) return;
    const root = ref.current;
    const viewport = root?.querySelector<HTMLElement>(".ds-scroll__viewport");
    const content = viewport?.firstElementChild;
    if (!root || !viewport || !content) return;
    // Where the last apply left the area: a scroll event that lands elsewhere is the reader's
    // (a scrollbar drag, a key, a wheel or a touch), not the apply's own.
    let placed = viewport.scrollTop;
    const apply = () => {
      const target = root.querySelector(opensAt);
      if (!target) return;
      viewport.scrollTop =
        target.getBoundingClientRect().top -
        viewport.getBoundingClientRect().top +
        viewport.scrollTop -
        INSET_MD;
      placed = viewport.scrollTop;
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(content);
    const stop = () => observer.disconnect();
    const moves = ["wheel", "pointerdown", "keydown", "touchstart"] as const;
    for (const type of moves) viewport.addEventListener(type, stop, { once: true });
    const onScroll = () => {
      if (Math.abs(viewport.scrollTop - placed) >= 1) stop();
    };
    viewport.addEventListener("scroll", onScroll);
    return () => {
      observer.disconnect();
      for (const type of moves) viewport.removeEventListener(type, stop);
      viewport.removeEventListener("scroll", onScroll);
    };
  }, [opensAt]);
  return (
    <div ref={ref} style={{ width, height: size.h }}>
      <ScrollArea label={label} className="size-full">
        {children}
      </ScrollArea>
    </div>
  );
}

function LiveScreen({ id, size }: { id: LiveId; size: Size }) {
  const m = useMessages();
  const label = copyOf(m, `node.${id}` as const);
  if (id === "landing") {
    const width = Math.min(size.w, 1280);
    return (
      <Scrolling label={label} size={size} width={width}>
        <LiveFrame outer={{ w: width, h: "auto" }} design={1280} mode="dark">
          <LivePage id={id} />
        </LiveFrame>
      </Scrolling>
    );
  }
  if (id === "app") {
    // A 1280 x 800 box scaled to fit the stage whole: the board inside it keeps its fit.
    const width = Math.min(size.w, (size.h * 1280) / 800, 1280);
    return (
      <LiveFrame outer={{ w: width, h: (width * 800) / 1280 }} design={1280}>
        <LivePage id={id} />
      </LiveFrame>
    );
  }
  // The guidebook at its design width, opened at its foundation heading.
  const frame = FRAMES.find((f) => f.id === id);
  const width = Math.min(size.w, 800);
  return (
    <Scrolling label={label} size={size} width={width} opensAt={frame?.startAt}>
      <LiveFrame outer={{ w: width, h: "auto" }} design={800}>
        <LivePage id={id} />
      </LiveFrame>
    </Scrolling>
  );
}

function PreviewArt({ rec, size }: { rec: PreviewPageRecord; size: Size }) {
  const show = rec.show;
  const contain = (design: Size, node: ReactNode, lines?: readonly Box[]) => (
    <ArtFrame
      design={design}
      width={Math.min(size.w, (size.h * design.w) / design.h)}
      lines={lines}
    >
      {node}
    </ArtFrame>
  );
  if ("board" in show) {
    return contain(
      BOARD_DESIGN,
      <BoardArt board={show.board} />,
      BOARDS[show.board].pieces.map((id) => pieceOf(id).box),
    );
  }
  if ("piece" in show) {
    const piece = pieceOf(show.piece);
    // Whole design px: inside a scale Chrome lays each box on whole px before it scales them.
    const design = { w: Math.round(piece.box.w), h: Math.round(piece.box.h) };
    return contain(design, <PieceArt piece={piece} size={design} />, [{ x: 0, y: 0, ...design }]);
  }
  if ("book" in show) return contain(BOARD_DESIGN, <BookPageArt n={show.book} />);
  if ("logo" in show) return contain(BOARD_DESIGN, <LogoPage kind={show.logo} />);
  if ("type" in show) return contain(BOARD_DESIGN, <TypeSpecimen kind={show.type} />);
  if ("palette" in show) return contain(BOARD_DESIGN, <PaletteSpecimen which={show.palette} />);
  if ("sheet" in show) {
    // A 1280 x 800 sheet scaled to fit the stage whole, like the app screen.
    const width = Math.min(size.w, (size.h * 1280) / 800, 1280);
    return (
      <LiveFrame outer={{ w: width, h: (width * 800) / 1280 }} design={1280}>
        {show.sheet === "base" ? <BaseSheet /> : <ComposedSheet />}
      </LiveFrame>
    );
  }
  return <LiveScreen id={show.live} size={size} />;
}

function Preview({
  sequence,
  page,
  opener,
  onPage,
  onClose,
}: {
  sequence: SequenceId;
  page: number;
  opener: string | null;
  onPage: (page: number) => void;
  onClose: () => void;
}) {
  const m = useMessages();
  const ctx = useContext(PageContext);
  const live = useMemo(() => ({ ...ctx, live: true }), [ctx]);
  const footer = useRef<HTMLDivElement>(null);
  const seq = SEQUENCES.find((s) => s.id === sequence);
  if (!seq) throw new RangeError(`orivilo-canvas: no sequence ${sequence}`);
  const count = seq.pages.length;
  const rec = at(seq.pages, page - 1);
  const pager = (which: "previous" | "next") =>
    footer.current?.querySelector<HTMLButtonElement>(`[data-pager="${which}"]`) ?? null;
  const go = (n: number) => {
    const target = Math.min(count, Math.max(1, n));
    if (target === page) return;
    const active = document.activeElement;
    if (target === count && active === pager("next")) pager("previous")?.focus();
    if (target === 1 && active === pager("previous")) pager("next")?.focus();
    onPage(target);
  };
  const piece = "piece" in rec.show ? pieceOf(rec.show.piece) : null;
  const photoId =
    piece &&
    (piece.content.kind === "photo" ||
      piece.content.kind === "scene" ||
      piece.content.kind === "phone" ||
      piece.content.kind === "icon")
      ? piece.content.image
      : null;
  const missingNow = photoId !== null && ctx.missing.has(photoId);
  const second = missingNow ? photoId : rec.second ? copyOf(m, rec.second) : null;
  const caption = (
    <div className="grid grid-cols-1 items-center gap-3 min-[600px]:grid-cols-[1fr_auto_1fr]">
      <div className="min-w-0">
        <p className="m-0 font-body text-label-md text-text-primary">{copyOf(m, rec.caption)}</p>
        {second ? <p className={MUTED}>{second}</p> : null}
      </div>
      {count > 1 ? (
        <div className="flex items-center gap-2 justify-self-center">
          <Button
            variant="secondary"
            size="sm"
            iconOnly
            aria-label={m.orvCanvas.preview.previous}
            data-pager="previous"
            disabled={page === 1}
            onClick={() => go(page - 1)}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span aria-hidden="true" className="font-body text-label-md text-text-primary">
            {`${page} / ${count}`}
          </span>
          <span className="sr-only" aria-live="polite">
            {fill(m.orvCanvas.preview.count, { page, count })}
          </span>
          <Button
            variant="secondary"
            size="sm"
            iconOnly
            aria-label={m.orvCanvas.preview.next}
            data-pager="next"
            disabled={page === count}
            onClick={() => go(page + 1)}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      ) : (
        <span />
      )}
      <span aria-hidden="true" className="hidden min-[600px]:block" />
    </div>
  );
  return (
    <PageContext.Provider value={live}>
      <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
        <DialogContent
          size="viewer"
          title={copyOf(m, seq.title)}
          description={seq.description ? copyOf(m, seq.description) : undefined}
          footer={<div ref={footer}>{caption}</div>}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            (pager(page === count ? "previous" : "next") ?? pager("previous"))?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (opener === null) return;
            document
              .querySelector<HTMLElement>(`.react-flow__node[data-id="${opener}"]`)
              ?.focus({ preventScroll: true });
          }}
          onKeyDown={(event) => {
            const target = event.target;
            if (target instanceof Element && target.closest("[data-stage]")) return;
            if (event.altKey || event.ctrlKey || event.metaKey) return;
            const next =
              event.key === "ArrowLeft"
                ? page - 1
                : event.key === "ArrowRight"
                  ? page + 1
                  : event.key === "Home"
                    ? 1
                    : event.key === "End"
                      ? count
                      : null;
            if (next === null) return;
            event.preventDefault();
            go(next);
          }}
        >
          <Stage>{(size) => <PreviewArt rec={rec} size={size} />}</Stage>
        </DialogContent>
      </Dialog>
    </PageContext.Provider>
  );
}

// ---- the board's children: levels of detail, chapter titles, the chapter fit and the dock

const lodOf = (zoom: number): "far" | "mid" | "near" =>
  zoom < 0.4 ? "far" : zoom < 0.7 ? "mid" : "near";

/** Writes `data-lod` on the closest board, so the recipe hides what a zoom cannot read. */
function Lod() {
  const { zoom } = useViewport();
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    ref.current?.closest(".ds-board")?.setAttribute("data-lod", lodOf(zoom));
  }, [zoom]);
  return <span ref={ref} hidden />;
}

/** At far zoom the node labels hide and each chapter shows its title over its first card. */
function ChapterTitles() {
  const m = useMessages();
  const { zoom } = useViewport();
  if (lodOf(zoom) !== "far") return null;
  return (
    <ViewportPortal>
      {CHAPTERS.map((chapter) => {
        const node = NODES.find((n) => n.id === chapter.anchor);
        if (!node || chapter.number === null) return null;
        const text = copyOf(m, chapter.title);
        const rest = text.startsWith(chapter.number) ? text.slice(chapter.number.length) : text;
        return (
          <div
            key={chapter.id}
            aria-hidden="true"
            data-chapter-title={chapter.id}
            className="absolute whitespace-nowrap bg-surface-canvas font-body text-label-md text-text-primary"
            style={{
              transform: `translate(${node.x}px, ${node.y - 16 / zoom}px) scale(${1 / zoom}) translateY(-100%)`,
              transformOrigin: "0 0",
            }}
          >
            <span className="text-text-tertiary">{chapter.number}</span>
            {rest}
          </div>
        );
      })}
    </ViewportPortal>
  );
}

interface Jump {
  id: ChapterId | "overview";
  n: number;
}

/**
 * The height the board's own bottom furniture covers: the dock and the task bar, from the pane's
 * bottom to the top of the highest. A panel inside a live frame belongs to a board that the page
 * draws, not to this one, and covers nothing of it.
 */
function coverOf(pane: Element): number {
  const bottom = pane.getBoundingClientRect().bottom;
  return Math.max(
    0,
    ...Array.from(pane.querySelectorAll(".react-flow__panel.bottom, .ds-taskbar"))
      .filter((o) => o.closest("[data-live-frame]") === null)
      .map((o) => bottom - o.getBoundingClientRect().top),
  );
}

/**
 * Frames the chosen chapter with no animation (a jump, not a glide). The view is computed here,
 * from the chapter's measured boxes and the pane's size, and set with `setViewport`, never with
 * `fitView`: xyflow queues a fit and runs it on the next node update with whatever fit options the
 * store holds then, and the board's own `fitViewOptions` prop (a new object on each render) puts
 * its all-nodes options there, so a chapter fit lost to the board's own in some opens and not in
 * others (sign-off F4, the survey of c20cb1b). It runs again whenever what the view depends on
 * settles: the measured size of the chapter's nodes, the size of the pane, the fonts and the dock's own box. The view
 * is a function of those and the chapter, so it is the same on every open.
 */
function ChapterFit({ jump }: { jump: Jump }) {
  const flow = useReactFlow();
  const ready = useNodesInitialized();
  const dom = useStore((s) => s.domNode);
  const chapter = CHAPTERS.find((c) => c.id === jump.id);
  // The overview frames the whole board.
  const ids = useMemo(
    () => (jump.id === "overview" ? NODES.map((n) => n.id) : (chapter?.nodes ?? [])),
    [jump.id, chapter],
  );
  const measured = useStore((s) =>
    ids
      .map((id) => {
        const size = s.nodeLookup.get(id)?.measured;
        return `${size?.width ?? 0}x${size?.height ?? 0}`;
      })
      .join(","),
  );
  const pane = useStore((s) => `${s.width}x${s.height}`);
  // A font that swaps in changes a node's lines and the dock's buttons: fit again once it has.
  const [fonts, setFonts] = useState(0);
  useEffect(() => {
    const again = () => setFonts((n) => n + 1);
    void document.fonts.ready.then(again);
    document.fonts.addEventListener("loadingdone", again);
    return () => document.fonts.removeEventListener("loadingdone", again);
  }, []);
  // The dock and the task bar set how much of the pane's bottom the chapter must clear: fit again
  // when their own boxes change, so a late change of either never leaves a stale view.
  const [cover, setCover] = useState(0);
  useEffect(() => {
    if (!dom || !ready) return;
    const observer = new ResizeObserver(() => setCover((n) => n + 1));
    for (const furniture of dom.querySelectorAll(".react-flow__panel.bottom, .ds-taskbar")) {
      if (furniture.closest("[data-live-frame]") === null) observer.observe(furniture);
    }
    return () => observer.disconnect();
  }, [dom, ready]);
  // `setViewport` does nothing before the pane's zoom handler exists.
  const initialized = flow.viewportInitialized;
  const instance = useRef(flow);
  useEffect(() => {
    instance.current = flow;
  });
  useEffect(() => {
    if (!ready || !initialized || !chapter || !dom) return;
    const frame = requestAnimationFrame(() => {
      const { x, y, width, height } = instance.current.getNodesBounds([...ids]);
      void instance.current.setViewport(
        chapterViewport(
          { x, y, w: width, h: height },
          { w: dom.clientWidth, h: dom.clientHeight },
          coverOf(dom),
          jump.id === "overview" ? VIEW_PAD.overview : VIEW_PAD.chapter,
          DOCK_MARGIN,
        ),
        { duration: 0 },
      );
    });
    return () => cancelAnimationFrame(frame);
    // `jump` carries a counter, so a second click on the same chapter fits again.
  }, [ready, initialized, jump, chapter, dom, ids, measured, pane, fonts, cover]);
  return null;
}

function LiveReady({ onLive }: { onLive: () => void }) {
  const ready = useNodesInitialized();
  useEffect(() => {
    if (ready) startTransition(onLive);
  }, [ready, onLive]);
  return null;
}

function ChapterStrip({ jump, onJump }: { jump: Jump; onJump: (id: Jump["id"]) => void }) {
  const m = useMessages();
  return (
    <div role="group" aria-label={m.orvCanvas.dock.chapters} className="flex shrink-0 gap-2">
      {CHAPTERS.map((chapter) => (
        <Button
          key={chapter.id}
          variant="ghost"
          size="sm"
          aria-current={jump.id === chapter.id ? "true" : undefined}
          onClick={() => onJump(chapter.id)}
        >
          {copyOf(m, chapter.title)}
        </Button>
      ))}
    </div>
  );
}

function renderBody(node: BoardNode): ReactNode {
  const record = NODES.find((n) => n.id === node.id);
  return record ? <NodeBody record={record} /> : null;
}

/** The node whose pages the preview opens at: the last of its sequence that starts at or before. */
function openerOf(sequence: SequenceId, page: number): string | null {
  const nodes = NODES.filter((n) => n.open?.sequence === sequence);
  const best = nodes.filter((n) => (n.open?.page ?? 1) <= page).at(-1) ?? nodes[0];
  return best?.id ?? null;
}

function statusOf(m: Messages, jump: Jump): string {
  if (jump.id === "overview") return fill(m.orvCanvas.status.overview, { count: NODES.length });
  const chapter = CHAPTERS.find((c) => c.id === jump.id);
  return fill(m.board.jumped, { title: chapter ? copyOf(m, chapter.title) : jump.id });
}

/**
 * The concept prototype page: a read-only board of the whole path from brief to product, a dock
 * that jumps by chapter, and a preview dialog for every result. A prototype with sample data and
 * AI images made for this demo; nothing here reads a site or sends anything.
 */
export function OriviloCanvas({
  chapter = "overview",
  preview,
  missingImages = [],
}: OriviloCanvasProps) {
  const m = useMessages();
  const profile = useDesignProfile();
  // The board is controlled: React Flow reports each node's measured size through `onChange`, and
  // `useNodesInitialized` reads it from the graph the host passes back. A new locale rebuilds it.
  const [held, setHeld] = useState(() => ({ m, graph: graphOf(m) }));
  const graph = held.m === m ? held.graph : graphOf(m);
  const setGraph = (next: Graph) => setHeld({ m, graph: next });
  const [jump, setJump] = useState<Jump>({ id: chapter, n: 0 });
  const [live, setLive] = useState(false);
  const [failed, setFailed] = useState<ReadonlySet<ImageId>>(new Set());
  const [open, setOpen] = useState<{
    sequence: SequenceId;
    page: number;
    opener: string | null;
  } | null>(
    preview
      ? {
          sequence: preview.sequence,
          page: preview.page,
          opener: openerOf(preview.sequence, preview.page),
        }
      : null,
  );
  const missing = useMemo(
    () => new Set<ImageId>([...missingImages, ...failed]),
    [missingImages, failed],
  );
  const context = useMemo<PageContextValue>(
    () => ({
      mode: profile?.mode ?? "light",
      missing,
      live,
      fail: (id) => setFailed((prev) => new Set(prev).add(id)),
    }),
    [profile?.mode, missing, live],
  );
  const onLive = useMemo(() => () => setLive(true), []);
  return (
    <PageContext.Provider value={context}>
      <main className="flex min-h-dvh flex-col gap-4 p-4">
        <PageHeader title={m.orvCanvas.title} description={m.orvCanvas.description} />
        <div
          className="min-h-0"
          style={{ height: "max(640px, calc(var(--story-fill, 0px) - 8rem))" }}
        >
          {/* The recipe rule `.ds-board:has(.ds-taskbar)` (recipes.css) matches any task bar below the
              board, so the one nested in the composed sheet of p-pat would lift this board's dock and
              status line by 74 px. This board has no task bar of its own: `--_lift` is cancelled
              here (the nested board sets its own on itself, so its controls keep their lift). Scoping
              the recipe to a board's own task bar is a follow-up (ORV-309 review r2, R2-1). */}
          <CanvasBoard
            className="[--_lift:0px]!"
            variant="present"
            chrome={false}
            minimap={false}
            fitView={false}
            graph={graph}
            onChange={setGraph}
            label={m.orvCanvas.board}
            status={statusOf(m, jump)}
            renderBody={renderBody}
            onNodeOpen={(id) => {
              const record = NODES.find((n) => n.id === id);
              if (record?.open) {
                setOpen({ sequence: record.open.sequence, page: record.open.page, opener: id });
              }
            }}
          >
            <Lod />
            <ChapterTitles />
            <ChapterFit jump={jump} />
            <LiveReady onLive={onLive} />
            <CanvasControls position="center">
              <ChapterStrip jump={jump} onJump={(id) => setJump((j) => ({ id, n: j.n + 1 }))} />
            </CanvasControls>
          </CanvasBoard>
        </div>
        {open ? (
          <Preview
            sequence={open.sequence}
            page={open.page}
            opener={open.opener}
            onPage={(page) => setOpen({ ...open, page })}
            onClose={() => setOpen(null)}
          />
        ) : null}
      </main>
    </PageContext.Provider>
  );
}
