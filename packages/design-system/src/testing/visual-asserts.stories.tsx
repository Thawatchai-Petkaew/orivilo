import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { expect } from "storybook/test";
import { DesignProfileBoundary } from "../boundary/DesignProfileBoundary";
import { fixtures } from "../components/fixtures";
import { expectEdgeInk, expectNoGlyphClip, expectSameHeight } from "./visual-asserts";

const meta = {
  title: "Foundations/Visual asserts",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Proof that the shared play helpers (L-0018) go red on the three ORV-107 defects and green on the fixed render. Each story renders the defect's CSS and the fixed CSS side by side and asserts both outcomes. These are test fixtures, not components.",
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

const chip: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box",
  padding: "0 12px",
  fontSize: 14,
  lineHeight: "20px",
  border: "1px solid var(--cmp-input-border, currentColor)",
  borderRadius: 9999,
};

/** `c1c9fad`: the gone chip wraps to three lines at 240 px, an oval beside one-line chips. */
export const SameHeight: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8, width: 240, padding: 16 }}>
      <span data-case="normal" style={{ ...chip, height: 28, whiteSpace: "nowrap" }}>
        Brand
      </span>
      <span data-case="wrapped" style={{ ...chip, width: 90, padding: "4px 12px", height: "auto" }}>
        Gone from the board
      </span>
      <span data-case="whole" style={{ ...chip, height: 28, whiteSpace: "nowrap" }}>
        Gone
      </span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const normal = q(canvasElement, "[data-case='normal']");
    const wrapped = q(canvasElement, "[data-case='wrapped']");
    const whole = q(canvasElement, "[data-case='whole']");
    await expect(() => expectSameHeight(wrapped, normal)).toThrow(/px tall but/);
    expectSameHeight(whole, normal);
  },
};

const label: CSSProperties = {
  display: "flex",
  alignItems: "center",
  boxSizing: "border-box",
  width: 140,
  height: 40,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  borderRadius: 20,
  border: "1px solid var(--cmp-input-border, currentColor)",
  fontSize: 14,
};

/** `c1c9fad`: a Thai title with stacked marks at the start of a pill label that has no padding to clear the curve. */
export const GlyphClip: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
      <div data-case="clipped" style={{ ...label, paddingInline: 0 }}>
        <span>{fixtures.thaiMarks}</span>
      </div>
      <div data-case="clear" style={{ ...label, paddingInline: 22 }}>
        <span>{fixtures.thaiMarks}</span>
      </div>
      <div data-case="clear-2" style={{ ...label, paddingInline: 22 }}>
        <span>{fixtures.thaiMarks2}</span>
      </div>
      <div data-case="truncated" style={{ ...label, paddingInline: 22 }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {fixtures.thaiMarks} {fixtures.longThai}
        </span>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(() => expectNoGlyphClip(q(canvasElement, "[data-case='clipped']"))).toThrow(
      /ปิ่นโต้.*outside the clip.*corner/,
    );
    expectNoGlyphClip(q(canvasElement, "[data-case='clear']"));
    expectNoGlyphClip(q(canvasElement, "[data-case='clear-2']"));
    expectNoGlyphClip(q(canvasElement, "[data-case='truncated']"));
  },
};
