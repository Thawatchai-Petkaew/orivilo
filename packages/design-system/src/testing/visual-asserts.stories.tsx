import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { expect } from "storybook/test";
import { DesignProfileBoundary } from "../boundary/DesignProfileBoundary";
import { fixtures } from "../components/fixtures";
import { LocaleProvider } from "../i18n/LocaleProvider";
import { Tag } from "../components/tag/Tag";
import { CloseIcon, WarningIcon } from "../components/icons";
import { expectEdgeInk, expectNoGlyphClip, expectSameHeight, inVitest } from "./visual-asserts";

const meta = {
  title: "Foundations/Visual asserts",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Proof that the shared play helpers (L-0018) go red on the three ORV-107 defects and green on the fixed render. The edge story renders the defect's CSS beside the fixed CSS. The gone chip stories render the real chip markup and recipe classes with the verbatim ORV-107 c1c9fad gone chip rules, then the shipped chip. These are test fixtures, not components.",
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
 */
const C1C9FAD_CSS = `
.c1c9fad .ds-chat__gone-label { display: flex; flex-wrap: wrap; column-gap: var(--cmp-tag-gap); white-space: normal; }
.c1c9fad .ds-chat__gone-title { min-width: 0; max-inline-size: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.c1c9fad .ds-chat__gone-words { min-width: 0; }
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
      /is \d+(\.\d+)? px tall but .* is \d+(\.\d+)? px/,
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
