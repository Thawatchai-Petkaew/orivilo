import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { expect } from "storybook/test";
import { DesignProfileBoundary } from "../boundary/DesignProfileBoundary";
import { fixtures } from "../components/fixtures";
import { LocaleProvider } from "../i18n/LocaleProvider";
import { InputGroup } from "../components/input-group/InputGroup";
import { Tag } from "../components/tag/Tag";
import { CloseIcon, WarningIcon } from "../components/icons";
import {
  expectEdgeInk,
  expectFrameCutsNoInk,
  expectInkClearsAbove,
  expectLabelInkWhole,
  expectNoGlyphClip,
  expectPaintAt,
  expectPaintsAt,
  expectPillsClear,
  expectPortPillsClear,
  expectSameHeight,
  inVitest,
  measureInkCentre,
} from "./visual-asserts";

const meta = {
  title: "Foundations/Visual asserts",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Proof that the shared play helpers (L-0018) go red on the three ORV-107 defects and green on the fixed render, and that the paint helper (ORV-118) goes red on a wrong colour. The edge story renders the defect's CSS beside the fixed CSS. The gone chip stories render the real chip markup and recipe classes with the verbatim ORV-107 c1c9fad gone chip rules, then the shipped chip. These are test fixtures, not components.",
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const q = <T extends Element = HTMLElement>(root: ParentNode, selector: string) =>
  root.querySelector(selector) as T;

const FOCUS = "var(--cmp-input-border-focus)";
const edgeBox: CSSProperties = {
  height: 48,
  width: 200,
  borderRadius: 8,
  background: "var(--ds-surface-canvas)",
};

/** `0f0b4a5` in one mode: a 1 px border in the focus ink plus a 1 px outline at offset 0 beside it. The two draw as one 2 px edge. */
function edgeInkStory(mode: "light" | "dark"): Story {
  return {
    render: () => (
      <DesignProfileBoundary mode={mode} profile="neutral">
        <div
          style={{
            display: "flex",
            gap: 24,
            padding: 16,
            background: "var(--ds-surface-canvas)",
          }}
        >
          <div
            data-case="double"
            style={{
              ...edgeBox,
              border: `1px solid ${FOCUS}`,
              outline: "1px solid var(--ds-focus-ring)",
              outlineOffset: 0,
            }}
          />
          <div data-case="single" style={{ ...edgeBox, border: `1px solid ${FOCUS}` }} />
        </div>
      </DesignProfileBoundary>
    ),
    play: async ({ canvasElement }) => {
      if (!inVitest) return; // the screenshot needs Vitest browser mode
      // Red: the border and the outline read as the 2 px the user sees, on the top and the left edge.
      await expect(
        expectEdgeInk(q(canvasElement, "[data-case='double']"), ["top", "left"], 1),
      ).rejects.toThrow(/edge of <div> draws 2 px of ink, expected 1 px/);
      // Green: one 1 px border reads 1 px on every side.
      await expectEdgeInk(
        q(canvasElement, "[data-case='single']"),
        ["top", "right", "bottom", "left"],
        1,
      );
    },
  };
}
export const EdgeInkLight: Story = edgeInkStory("light");
export const EdgeInkDark: Story = edgeInkStory("dark");

/**
 * The gone chip rules of ORV-107 `c1c9fad`, verbatim from `recipes.css` at that commit. The shipped
 * recipe no longer has them (v1.6 moved the gone words under the chip row), so the fixture carries them.
 * The last rule undoes the fixed tag height of ORV-192 row 18, which the defect predates: a wrapped
 * chip must grow here, or there is no unequal height for `expectSameHeight` to catch.
 */
const C1C9FAD_CSS = `
.c1c9fad .ds-chat__gone-label { display: flex; flex-wrap: wrap; column-gap: var(--cmp-tag-gap); white-space: normal; }
.c1c9fad .ds-chat__gone-title { min-width: 0; max-inline-size: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.c1c9fad .ds-chat__gone-words { min-width: 0; }
.c1c9fad .ds-tag { height: auto; }
`;

/** The `c1c9fad` gone chip markup, with the real `.ds-tag` and `.ds-chat__*` recipe classes. */
function GoneChipC1c9fad({ title, words }: { title: string; words: string }) {
  return (
    <li className="ds-chat__chip" data-gone="" data-case="gone">
      <span className="ds-chat__mark ds-chat__gone-mark" aria-hidden="true">
        <WarningIcon />
      </span>
      <span className="ds-tag" data-size="sm">
        <span className="ds-tag__main">
          <span className="ds-tag__label ds-chat__gone-label">
            <span className="ds-chat__gone-title">{title}</span>{" "}
            <span className="ds-chat__gone-words">{words}</span>
          </span>
        </span>
        <button type="button" className="ds-tag__remove" aria-label="Remove">
          <CloseIcon className="size-4" />
        </button>
      </span>
    </li>
  );
}

function goneFixture(locale: "th" | "en", title: string, words: string, width: number): Story {
  return {
    render: () => (
      <DesignProfileBoundary mode="light" profile="neutral">
        <LocaleProvider locale={locale}>
          <style>{C1C9FAD_CSS}</style>
          <ul className="ds-chat__chips c1c9fad" style={{ width }}>
            <li className="ds-chat__chip" data-case="normal">
              <Tag size="sm" label="Brand" onRemove={() => undefined} />
            </li>
            <GoneChipC1c9fad title={title} words={words} />
          </ul>
        </LocaleProvider>
      </DesignProfileBoundary>
    ),
  };
}

/** `c1c9fad`, English at 240 px: the gone chip wraps to two lines, taller than the one-line chip beside it. */
export const SameHeight: Story = {
  ...goneFixture("en", "Brand Canvas project of the team", "is no longer on the board", 240),
  play: async ({ canvasElement }) => {
    const gone = q(canvasElement, "[data-case='gone'] .ds-tag");
    const normal = q(canvasElement, "[data-case='normal'] .ds-tag");
    await expect(() => expectSameHeight(gone, normal)).toThrow(
      /is \d+(?:\.\d+|) px tall but .* is \d+(?:\.\d+|) px/,
    );
    // Two chips of one height pass.
    expectSameHeight(normal, normal);
  },
};

/** `c1c9fad` with the Thai title `ปิ่นโต้` at 120 px (the title and the gone words no longer fit one line, so the chip wraps): a glyph box of the title falls outside the pill's clip. */
export const GlyphClip: Story = {
  ...goneFixture("th", fixtures.thaiMarks, "ไม่อยู่บนบอร์ดแล้ว", 120),
  play: async ({ canvasElement }) => {
    const gone = q(canvasElement, "[data-case='gone'] .ds-tag");
    await expect(() => expectNoGlyphClip(gone)).toThrow(/ปิ่นโต้.*outside the clip.*corner/);
  },
};

/**
 * ORV-192 row 19: a caption flush over a 56 px Thai display line. With the top padding set to 0
 * (the 5e20cf8 look) the stack of ฟื้ rises into the caption and `expectInkClearsAbove` throws;
 * with the shipped `text-display-lg` padding it passes.
 */
export const StackClear: Story = {
  render: () => (
    <DesignProfileBoundary mode="light" profile="neutral">
      <div data-case="caption" className="font-mono text-body-sm">
        Display 56: 56 / 1.2, weight 500
      </div>
      <div data-case="display" className="font-display text-display-lg">
        ฟื้นฟู
      </div>
    </DesignProfileBoundary>
  ),
  play: async ({ canvasElement }) => {
    if (!inVitest) return;
    // The display line is Anuphan (ORV-275 type-face-1): load it first so both shots draw one face.
    await document.fonts.load("500 56px Anuphan", "ฟื้นฟู");
    const caption = q(canvasElement, "[data-case='caption']");
    const display = q(canvasElement, "[data-case='display']");
    display.style.paddingBlockStart = "0";
    await expect(expectInkClearsAbove(display, caption, 4)).rejects.toThrow(/expected at least 4/);
    display.style.paddingBlockStart = "";
    await expectInkClearsAbove(display, caption, 4);
  },
};

/**
 * ORV-205: a one-line ellipsis label as the recipe builds it (a 4 px block padding that a negative
 * margin cancels) shows the whole stack of Thai marks, and `expectLabelInkWhole` passes; with the
 * padding taken out (the look before ORV-194 row 7) `overflow: hidden` cuts the stack above the
 * line and the helper throws. The sample font is loaded first so both shots draw the same face.
 */
export const LabelInkWhole: Story = {
  render: () => (
    <DesignProfileBoundary mode="light" profile="neutral">
      <div
        style={{ display: "flex", gap: 24, padding: 16, background: "var(--ds-surface-canvas)" }}
      >
        <span
          data-case="label"
          className="font-body"
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.7,
            paddingBlock: 4,
            marginBlock: -4,
          }}
        >
          ฟื้นฟูปั้นปี๊บ
        </span>
      </div>
    </DesignProfileBoundary>
  ),
  play: async ({ canvasElement }) => {
    if (!inVitest) return;
    const label = q(canvasElement, "[data-case='label']");
    await document.fonts.load("500 14px Sarabun", "ฟื้ปั้ปี๊");
    await document.fonts.ready;
    await expectLabelInkWhole(label);
    label.style.paddingBlock = "0";
    label.style.marginBlock = "0";
    // Padding out alone cuts 1 px on this machine, a speck on Linux chromium in CI (the run of
    // ORV-274 passed the negative case's call): a line height of 1 makes the cut 6 px and clear.
    label.style.lineHeight = "1";
    await expect(expectLabelInkWhole(label)).rejects.toThrow(
      /cuts [0-9.]+ px of its Thai stack above the clip box/,
    );
  },
};

/** Pills past the right, left, top and bottom of the 400 by 120 board, each over a card out there. */
const OUTSIDE = [
  [500, 50],
  [-300, 50],
  [100, -200],
  [100, 300],
] as const;

/**
 * ORV-274, sign-off 2 R1: `expectPillsClear` passes when a drawn edge pill is 72 px from a port dot
 * and 80 px from a card, and throws, naming the pill and the clearance, when the card covers it
 * (-30 px), a dot or a card's title line sits near it, or a zero-width box with a card's class sits on it. It reads
 * only the pills that are drawn: a hidden one, a `display: none` one, a zero-width one and one
 * outside the board's frame are ignored although each overlaps a card. The board is plain boxes, so
 * the rects are the ones set here and no font width is read.
 */
export const PillsClear: Story = {
  render: () => {
    const box = (left: number, top: number, width: number, height: number): CSSProperties => ({
      position: "absolute",
      left,
      top,
      width,
      height,
    });
    return (
      <div
        className="react-flow"
        data-case="board"
        style={{
          ...box(0, 0, 400, 120),
          position: "relative",
          background: "var(--ds-surface-canvas)",
        }}
      >
        <div className="ds-node" data-case="card" style={box(0, 20, 60, 80)}>
          <span className="ds-port__handle" data-case="dot" style={box(60, 50, 8, 8)} />
          <span className="ds-node__label" data-case="title" style={box(0, 0, 20, 10)} />
        </div>
        <div className="ds-node__label" data-case="thin" style={box(150, 20, 0, 80)} />
        {OUTSIDE.map(([left, top]) => (
          <div
            key={`node-${left}-${top}`}
            className="ds-node"
            style={box(left - 20, top - 20, 120, 60)}
          />
        ))}
        <span className="ds-edge__label" data-case="pill" style={box(140, 50, 80, 20)}>
          input, stale
        </span>
        <span className="ds-edge__label" style={{ ...box(30, 50, 80, 20), visibility: "hidden" }}>
          hidden
        </span>
        <span className="ds-edge__label" style={{ ...box(30, 50, 80, 20), display: "none" }}>
          gone
        </span>
        <span
          className="ds-edge__label"
          style={{ ...box(30, 50, 0, 20), padding: 0, border: 0, minWidth: 0 }}
        />
        {OUTSIDE.map(([left, top]) => (
          <span
            key={`pill-${left}-${top}`}
            className="ds-edge__label"
            style={box(left, top, 80, 20)}
          >
            outside
          </span>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const board = q(canvasElement, "[data-case='board']");
    const card = q(canvasElement, "[data-case='card']");
    const dot = q(canvasElement, "[data-case='dot']");
    const title = q(canvasElement, "[data-case='title']");
    const thin = q(canvasElement, "[data-case='thin']");
    // One pill is drawn. The dot is the nearest thing to it, and the rule takes half a pixel of
    // rounding: a gap passes when asked for 0.5 px more, and does not when asked for 1 px more.
    const pill = q(canvasElement, "[data-case='pill']");
    const gap = pill.getBoundingClientRect().left - dot.getBoundingClientRect().right;
    expect(gap).toBeGreaterThan(60);
    expect(expectPillsClear(board)).toBe(1);
    expectPillsClear(board, gap + 0.5);
    expect(() => expectPillsClear(board, gap + 1)).toThrow(
      new RegExp(`is ${gap.toFixed(1)} px from <span\\.ds-port__handle>`),
    );
    // A zero-width box is not read; given width it covers the pill.
    thin.style.width = "10px";
    expect(() => expectPillsClear(board)).toThrow(/the pill "input, stale" is -20\.0 px from/);
    thin.style.width = "0";
    // The card grows under the pill: it is covered by 30 px.
    card.style.width = "170px";
    expect(() => expectPillsClear(board)).toThrow(
      /the pill "input, stale" is -30\.0 px from <div\./,
    );
    card.style.width = "60px";
    // The dot ends 1 px short of the pill: clearance 1 against the 4 px asked for.
    dot.style.left = `${60 + gap - 1}px`;
    expect(() => expectPillsClear(board)).toThrow(/is 1\.0 px from <span\.ds-port__handle>/);
    dot.style.left = "60px";
    // A title line is read from every side: 20 px above the pill and 10 px below it pass at those
    // gaps, so the vertical gaps count, and one beside it is read by its horizontal gap.
    title.style.left = "145px";
    title.style.top = "0";
    expectPillsClear(board, 18);
    title.style.top = "60px";
    expectPillsClear(board, 8);
    // A title line that sits out of its card is read on its own.
    title.style.left = "145px";
    title.style.top = "30px";
    expect(() => expectPillsClear(board)).toThrow(/is -?\d+\.0 px from <span\.ds-node__label>/);
  },
};

/**
 * ORV-280 rows 20 and 21: `expectPillsClear` also reads the drawn port name pills and source pills,
 * against every other drawn pill. Two edge pills 2 px apart throw; a port pill of node a over an edge
 * pill or over a pill of node b throws, naming both; the two pills of one node (a port pill and its
 * source pill) overlap and pass, since they are its own rows; a port pill under a card or a dot is not
 * an error, since it sits beside its own card by design, while an edge pill there still is; hidden
 * port and source pills are not read. The board is plain boxes, so no font width is read.
 */
export const PillsClearAmongPills: Story = {
  render: () => {
    const box = (left: number, top: number, width: number, height: number): CSSProperties => ({
      position: "absolute",
      left,
      top,
      width,
      height,
    });
    return (
      <div
        className="react-flow"
        data-case="board"
        style={{ ...box(0, 0, 500, 200), position: "relative" }}
      >
        <div className="react-flow__node" data-id="a" style={box(0, 0, 0, 0)}>
          <span className="ds-port__label" data-case="a-port" style={box(0, 100, 80, 20)}>
            a port
          </span>
          <span
            className="ds-node__source"
            data-case="a-source"
            style={{ ...box(10, 110, 80, 20), visibility: "visible" }}
          >
            a source
          </span>
        </div>
        <div className="react-flow__node" data-id="b" style={box(0, 0, 0, 0)}>
          <span className="ds-port__label" data-case="b-port" style={box(300, 100, 80, 20)}>
            b port
          </span>
        </div>
        <span className="ds-edge__label" data-case="edge-1" style={box(200, 20, 80, 20)}>
          edge one
        </span>
        <span className="ds-edge__label" data-case="edge-2" style={box(200, 60, 80, 20)}>
          edge two
        </span>
        <div className="ds-node" data-case="card" style={box(400, 150, 90, 40)} />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const board = q(canvasElement, "[data-case='board']");
    const at = (name: string) => q(canvasElement, `[data-case='${name}']`);
    const place = (name: string, left: number, top: number) => {
      at(name).style.left = `${left}px`;
      at(name).style.top = `${top}px`;
    };
    // Two edge pills 40 px apart, a port pill and its source pill overlapping (one node), a port pill
    // of b far off: every pill is drawn and clear, so five are read.
    expect(expectPillsClear(board)).toBe(5);
    // Two edge pills 2 px apart.
    place("edge-2", 200, 42);
    expect(() => expectPillsClear(board)).toThrow(
      /the pill "edge one" is 2\.0 px from the pill "edge two", expected at least 4/,
    );
    expectPillsClear(board, 2);
    place("edge-2", 200, 60);
    // A port pill of a over an edge pill.
    place("a-port", 190, 25);
    expect(() => expectPillsClear(board)).toThrow(
      /the pill "edge one" is -?\d+\.0 px from the pill "a port"/,
    );
    // Hidden, the same pill is not read.
    at("a-port").style.visibility = "hidden";
    expectPillsClear(board);
    at("a-port").style.visibility = "";
    place("a-port", 0, 100);
    // A port pill of a over a port pill of b.
    place("a-port", 290, 105);
    expect(() => expectPillsClear(board)).toThrow(
      /the pill "a port" is -?\d+\.0 px from the pill "b port"/,
    );
    place("a-port", 0, 100);
    // A source pill is read the same way.
    place("a-source", 200, 22);
    expect(() => expectPillsClear(board)).toThrow(
      /the pill "edge one" is -?\d+\.0 px from the pill "a source"/,
    );
    place("a-source", 10, 110);
    // A port pill under a card is its own node's business: no error. An edge pill there is.
    place("b-port", 405, 155);
    expectPillsClear(board);
    place("b-port", 300, 100);
    place("edge-2", 400, 150);
    expect(() => expectPillsClear(board)).toThrow(
      /the pill "edge two" is -?\d+\.0 px from <div\.ds-node>/,
    );
  },
};

/**
 * ORV-282, design row D4: `expectPortPillsClear` reads the port name pills of one board node. Two
 * pills 7.9 world px apart (a 40 pitch with a 32.1 pill) pass the default 7.5 and throw, naming both
 * pills, at 8.5; on the old 24 pitch they overlap by 8.1 and throw at the default. A card, a title
 * line or a dot of another node 7 px from a pill throws at the default 8 and passes at 6.5 asked; the
 * node's own card and own dot sitting under its pills are not read. Hidden, `display: none`,
 * zero-width and out-of-frame pills are not read. At a 0.5 zoom the bounds halve, so the same layout
 * passes at the defaults, and a card 6 world px away (3 on screen) throws and reads "6.0 world px".
 * The board is plain boxes in a viewport, so no font width is read.
 */
export const PortPillsClear: Story = {
  render: () => {
    const box = (left: number, top: number, width: number, height: number): CSSProperties => ({
      position: "absolute",
      left,
      top,
      width,
      height,
      boxSizing: "border-box",
      padding: 0,
      border: 0,
    });
    const pill = (left: number, top: number, extra: CSSProperties = {}): CSSProperties => ({
      ...box(left, top, 80, 32.1),
      visibility: "visible",
      ...extra,
    });
    return (
      <div
        className="react-flow"
        data-case="board"
        style={{ position: "relative", width: 400, height: 140, overflow: "hidden" }}
      >
        <div
          className="react-flow__viewport"
          data-case="viewport"
          style={{ ...box(0, 0, 400, 140), transformOrigin: "0 0" }}
        >
          <div
            className="react-flow__node"
            data-case="a"
            style={{ position: "absolute", inset: 0 }}
          >
            <div className="ds-node" style={box(0, 0, 100, 120)} />
            <span className="ds-port__handle" style={box(104, 20, 8, 8)} />
            <span className="ds-port__label" data-case="first" style={pill(110, 10)}>
              first
            </span>
            <span className="ds-port__label" data-case="second" style={pill(110, 50)}>
              second
            </span>
            <span className="ds-port__label" style={pill(110, 50, { visibility: "hidden" })}>
              hidden
            </span>
            <span className="ds-port__label" style={pill(110, 50, { display: "none" })}>
              gone
            </span>
            <span className="ds-port__label" style={pill(110, 50, { width: 0, minWidth: 0 })} />
            <span className="ds-port__label" style={pill(900, 50)}>
              outside
            </span>
          </div>
          <div
            className="react-flow__node"
            data-case="b"
            style={{ position: "absolute", inset: 0 }}
          >
            <div className="ds-node" data-case="card" style={box(310, 0, 80, 120)} />
            <div className="ds-node__label" data-case="title" style={box(300, 124, 80, 10)} />
            <span className="ds-port__handle" data-case="dot" style={box(300, 100, 8, 8)} />
          </div>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const a = q(canvasElement, "[data-case='a']");
    const second = q(canvasElement, "[data-case='second']");
    const viewport = q(canvasElement, "[data-case='viewport']");
    const card = q(canvasElement, "[data-case='card']");
    const title = q(canvasElement, "[data-case='title']");
    const dot = q(canvasElement, "[data-case='dot']");
    // Two pills are drawn; the node's own card and dot sit under them and are not read.
    expect(expectPortPillsClear(a)).toBe(2);
    expectPortPillsClear(a, 8, 8.3);
    expect(() => expectPortPillsClear(a, 8, 8.5)).toThrow(
      /the port pill "first" is 7\.9 world px from the pill "second", expected at least 8\.5/,
    );
    // The old 24 pitch: the pills overlap by 8.1.
    second.style.top = "34px";
    expect(() => expectPortPillsClear(a)).toThrow(
      /the port pill "first" is -8\.1 world px from the pill "second"/,
    );
    // The bounds take 0.5 px of rounding: 7.2 apart passes the default 7.5 and 8 would not.
    second.style.top = "49.3px";
    expectPortPillsClear(a);
    second.style.top = "50px";
    // Another node's card, title line and dot, each 7 px from a pill, are read at the default 8.
    card.style.left = "197px";
    expect(() => expectPortPillsClear(a)).toThrow(/is 7\.0 world px from <div\.ds-node>/);
    expectPortPillsClear(a, 6.5);
    card.style.left = "197.7px";
    expectPortPillsClear(a);
    card.style.left = "310px";
    title.style.left = "110px";
    title.style.top = "89.1px";
    expect(() => expectPortPillsClear(a)).toThrow(/is 7\.0 world px from <div\.ds-node__label>/);
    title.style.left = "300px";
    title.style.top = "124px";
    dot.style.left = "197px";
    dot.style.top = "20px";
    expect(() => expectPortPillsClear(a)).toThrow(/is 7\.0 world px from <span\.ds-port__handle>/);
    dot.style.left = "300px";
    dot.style.top = "100px";
    // At a 0.5 zoom the bounds halve: the same layout passes, and a card 6 world px away is 3 on screen.
    viewport.style.transform = "scale(0.5)";
    expect(expectPortPillsClear(a)).toBe(2);
    expect(() => expectPortPillsClear(a, 8, 9)).toThrow(
      /the port pill "first" is 7\.9 world px from the pill "second"/,
    );
    card.style.left = "198px";
    expectPortPillsClear(a);
    card.style.left = "196px";
    expect(() => expectPortPillsClear(a)).toThrow(/is 6\.0 world px from <div\.ds-node>/);
    card.style.left = "310px";
    viewport.style.transform = "";
  },
};

/**
 * ORV-205: a difference that only the `overflow: visible` shot has, drawn inside the label's own
 * block padding (a 2 px stripe, rows 1 to 3 under the top of the border box), is not a cut: the
 * clip never touches the padding box, and Chromium on Linux drew such a difference by raster noise
 * in some runs. `expectLabelInkWhole` reads from the clip edge up and passes. Read from the label
 * line, as it did before, it would see the stripe 3 px above the line and throw.
 */
export const LabelPaddingNoise: Story = {
  render: () => (
    <DesignProfileBoundary mode="light" profile="neutral">
      <style>{`[data-case='noisy'][style*='overflow: visible'] { background: linear-gradient(to bottom, transparent 1px, black 1px, black 3px, transparent 3px); }`}</style>
      <div
        style={{ display: "flex", gap: 24, padding: 16, background: "var(--ds-surface-canvas)" }}
      >
        <span
          data-case="noisy"
          className="font-body"
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.7,
            paddingBlock: 4,
            marginBlock: -4,
          }}
        >
          ฟื้นฟูปั้นปี๊บ
        </span>
      </div>
    </DesignProfileBoundary>
  ),
  play: async ({ canvasElement }) => {
    if (!inVitest) return;
    const label = q(canvasElement, "[data-case='noisy']");
    await document.fonts.load("500 14px Sarabun", "ฟื้ปั้ปี๊");
    await document.fonts.ready;
    await expectLabelInkWhole(label);
  },
};

/**
 * ORV-222 rows 4 and 18: `expectFrameCutsNoInk` reads a clip that sits on the frame or on any
 * ancestor between the name and the frame, which `expectLabelInkWhole` cannot (it forces only its
 * own clone visible, so such a clip cuts both its shots alike). The name sits at the top of the
 * frame with a tight line, so its Thai tone marks draw above the frame's box. With the frame clip
 * on, the helper throws; with an `overflow: hidden` on the wrapper between them, it throws; with
 * nothing clipping, it passes. A frame that is not an ancestor of the name throws, and the inline
 * overflow values are back after every call.
 */
export const FrameCutsNoInk: Story = {
  render: () => (
    <DesignProfileBoundary mode="light" profile="neutral">
      <div style={{ padding: 16, background: "var(--ds-surface-canvas)" }}>
        <div data-case="frame" style={{ width: 240 }}>
          <div data-case="wrapper">
            <span
              data-case="name"
              className="font-body"
              style={{ display: "block", fontSize: 14, fontWeight: 500, lineHeight: 1 }}
            >
              ฟื้นฟูปั้นปี๊บ
            </span>
          </div>
        </div>
      </div>
    </DesignProfileBoundary>
  ),
  play: async ({ canvasElement }) => {
    if (!inVitest) return;
    const frame = q(canvasElement, "[data-case='frame']");
    const wrapper = q(canvasElement, "[data-case='wrapper']");
    const name = q(canvasElement, "[data-case='name']");
    await document.fonts.load("500 14px Sarabun", "ฟื้ปั้ปี๊");
    await document.fonts.ready;
    await expectFrameCutsNoInk(name, frame);
    frame.style.overflow = "hidden";
    await expect(expectFrameCutsNoInk(name, frame)).rejects.toThrow(/cuts ink: the pixel at x/);
    await expect(frame.style.overflow).toBe("hidden");
    frame.style.overflow = "";
    wrapper.style.overflow = "hidden";
    await expect(expectFrameCutsNoInk(name, frame)).rejects.toThrow(/cuts ink: the pixel at x/);
    await expect(wrapper.style.overflow).toBe("hidden");
    wrapper.style.overflow = "";
    await expectFrameCutsNoInk(name, frame);
    await expect(expectFrameCutsNoInk(frame, name)).rejects.toThrow(/is not an ancestor of/);
  },
};

/** The shipped chip (one line, same height as a normal chip, text clear of the pill's curve) passes both helpers. */
export const ShippedChipPasses: Story = {
  render: () => (
    <DesignProfileBoundary mode="light" profile="neutral">
      <ul className="ds-chat__chips" style={{ width: 240 }}>
        <li className="ds-chat__chip" data-case="normal">
          <Tag size="sm" label="Brand" onRemove={() => undefined} />
        </li>
        <li className="ds-chat__chip" data-case="thai">
          <Tag size="sm" label={fixtures.thaiMarks} onRemove={() => undefined} />
        </li>
        <li className="ds-chat__chip" data-case="long">
          <Tag
            size="sm"
            label={`${fixtures.thaiMarks} ${fixtures.longThai}`}
            onRemove={() => undefined}
          />
        </li>
      </ul>
    </DesignProfileBoundary>
  ),
  play: async ({ canvasElement }) => {
    const normal = q(canvasElement, "[data-case='normal'] .ds-tag");
    for (const name of ["thai", "long"]) {
      const tag = q(canvasElement, `[data-case='${name}'] .ds-tag`);
      expectSameHeight(tag, normal);
      expectNoGlyphClip(tag);
    }
  },
};

const INK = "#16151D";
const DOT = "#D9F66F";

/** Two svgs, read together and apart: a square one, and a letterboxed one (a 100 x 50 drawing in a 200 x 50 box, so it is centred). Each draws an ink rect and a lime dot. */
export const PaintAt: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 24, padding: 16 }}>
      <svg data-case="square" width={64} height={64} viewBox="0 0 128 128" aria-hidden="true">
        <rect x="0" y="0" width="64" height="128" fill={INK} />
        <circle cx="96" cy="64" r="16" fill={DOT} />
      </svg>
      <svg data-case="letterbox" width={200} height={50} viewBox="0 0 100 50" aria-hidden="true">
        <rect x="0" y="0" width="50" height="50" fill={INK} />
        <circle cx="75" cy="25" r="10" fill={DOT} />
      </svg>
    </div>
  ),
  play: async ({ canvasElement }) => {
    if (!inVitest) return; // the screenshot needs Vitest browser mode
    const square = q<SVGSVGElement>(canvasElement, "[data-case='square']");
    const letterbox = q<SVGSVGElement>(canvasElement, "[data-case='letterbox']");
    // Green: the right colour at each probe, including through the letterbox offset.
    await expectPaintAt(square, [
      { x: 32, y: 64, hex: INK },
      { x: 96, y: 64, hex: DOT },
    ]);
    await expectPaintAt(letterbox, [
      { x: 25, y: 25, hex: INK },
      { x: 75, y: 25, hex: DOT },
    ]);
    // Red: the dot probed for the ink colour, and the ink probed for the dot colour.
    await expect(expectPaintAt(square, [{ x: 96, y: 64, hex: INK }])).rejects.toThrow(
      /paints #D9F66F at \(96, 64\), expected #16151D/,
    );
    await expect(expectPaintAt(letterbox, [{ x: 25, y: 25, hex: DOT }])).rejects.toThrow(
      /paints #16151D at \(25, 25\), expected #D9F66F/,
    );
    // Red: a colour a few steps off the right one is still inside the tolerance, a visibly different one is not.
    await expectPaintAt(square, [{ x: 96, y: 64, hex: "#D9F66A" }]);
    await expect(expectPaintAt(square, [{ x: 96, y: 64, hex: "#D9F67F" }])).rejects.toThrow(
      /expected #D9F67F/,
    );
    // One screenshot for both svgs (ORV-118 R2): green on the right colours in each, red on the
    // second svg's wrong colour, which a read of the first svg's origin alone would not catch.
    const both = [
      { svg: square, probes: [{ x: 96, y: 64, hex: DOT }] },
      { svg: letterbox, probes: [{ x: 25, y: 25, hex: INK }] },
    ];
    await expectPaintsAt(both);
    await expect(
      expectPaintsAt([
        both[0] as (typeof both)[0],
        { svg: letterbox, probes: [{ x: 75, y: 25, hex: INK }] },
      ]),
    ).rejects.toThrow(/paints #D9F66F at \(75, 25\), expected #16151D/);
  },
};

/**
 * ORV-198, ink-corner-1 clause 5: a box that holds one `<input>` and no text (`.ds-input-group`) is
 * read by the input's value, over the input's content box, with the group's own border box and
 * rounded corners. The pixels outside the corner curve are not ink: the band the play reads is the
 * label's own, not the whole padding box. Before the fix the helper threw "has no text to measure"
 * on a group, and on a rounded box the curve's pixels took the band to the padding box (offset 0.00).
 */
export const InkCentreInputGroup: Story = {
  render: () => (
    <>
      {(["light", "dark"] as const).map((mode) => (
        <DesignProfileBoundary key={mode} mode={mode} profile="neutral">
          <div
            data-case={`input-group-${mode}`}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              padding: 16,
              background: "var(--ds-surface-canvas)",
            }}
          >
            {(["md", "lg"] as const).map((size) => (
              <InputGroup
                key={size}
                size={size}
                aria-label={size}
                defaultValue={fixtures.thai}
                groupClassName="w-64"
              />
            ))}
          </div>
        </DesignProfileBoundary>
      ))}
    </>
  ),
  play: async ({ canvasElement }) => {
    if (!inVitest) return; // the screenshot needs Vitest browser mode
    for (const mode of ["light", "dark"]) {
      const cell = q(canvasElement, `[data-case='input-group-${mode}']`);
      const groups = [...cell.querySelectorAll(".ds-input-group")];
      expect(groups).toHaveLength(2);
      const readings = await measureInkCentre(cell, groups);
      for (const [i, reading] of readings.entries()) {
        const group = groups[i] as Element;
        const height = group.getBoundingClientRect().height;
        expect(reading.name, "the group is read by its input's value").toContain(fixtures.thai);
        // The label's ink sits clear of the border rows: the band is not the whole padding box.
        expect(reading.ink.inkTop, `${reading.name} top of the band`).toBeGreaterThan(4);
        expect(reading.ink.inkBottom, `${reading.name} bottom of the band`).toBeLessThan(
          height - 4,
        );
        expect(Number.isFinite(reading.body.offset)).toBe(true);
      }
    }
  },
};

/**
 * ORV-199, ink-group-1: a box that holds exactly one `<input>` is read by that input's value, even
 * when it also holds a text addon. The ORV-198 holder read any box with a text node by itself, so a
 * group with `end="THB"` was read by "THB" (clause 2). A box that holds two inputs has no one value
 * to read: the helper rejects and names it, and never falls back to the box's text (clause 3).
 */
export const InkCentreGroupAddon: Story = {
  render: () => (
    <>
      {(["light", "dark"] as const).map((mode) => (
        <DesignProfileBoundary key={mode} mode={mode} profile="neutral">
          <div
            data-case={`group-addon-${mode}`}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              padding: 16,
              background: "var(--ds-surface-canvas)",
            }}
          >
            <InputGroup
              aria-label="with addon"
              defaultValue={fixtures.thai}
              end="THB"
              groupClassName="w-64"
            />
            <InputGroup aria-label="no addon" defaultValue={fixtures.thai} groupClassName="w-64" />
            <div data-box="two-inputs" style={{ display: "flex", gap: 8 }}>
              <input aria-label="first" defaultValue={fixtures.thai} />
              <input aria-label="second" defaultValue={fixtures.latin} />
            </div>
          </div>
        </DesignProfileBoundary>
      ))}
    </>
  ),
  play: async ({ canvasElement }) => {
    if (!inVitest) return; // the screenshot needs Vitest browser mode
    for (const mode of ["light", "dark"]) {
      const cell = q(canvasElement, `[data-case='group-addon-${mode}']`);
      const groups = [...cell.querySelectorAll(".ds-input-group")];
      expect(groups).toHaveLength(2);
      const [withAddon, plain] = await measureInkCentre(cell, groups);
      for (const reading of [withAddon, plain]) {
        expect(reading?.name, "the group is read by its input's value").toContain(fixtures.thai);
        expect(reading?.name, "the addon is not the label").not.toContain("THB");
      }
      expect(withAddon?.body.offset.toFixed(2), "the addon does not move the body reading").toBe(
        plain?.body.offset.toFixed(2),
      );
      await expect(measureInkCentre(cell, [q(cell, "[data-box='two-inputs']")])).rejects.toThrow(
        /<div>: holds more than one input to measure/,
      );
    }
  },
};
