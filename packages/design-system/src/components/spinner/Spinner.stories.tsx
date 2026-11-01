import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import { expectNoGlyphClip } from "../../testing/visual-asserts";
import { fixtures } from "../fixtures";
import { Matrix } from "../matrix";
import { Spinner } from "./Spinner";

const meta = {
  title: "Base/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "The waiting ring (ORV-201). One status region holds the hidden ring and its label, so the state is spoken in the person's language. The ring keeps turning under reduced motion: it is essential motion and the label carries the state. `decorative` draws the ring alone for a control that owns its status, such as Button while loading.",
      },
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The ring beside "กำลังโหลด", in one status region; the svg is hidden and has no name. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const statuses = canvas.getAllByRole("status");
    await expect(statuses).toHaveLength(1);
    await expect(statuses[0]).toHaveTextContent("กำลังโหลด");
    const svg = canvasElement.querySelector("svg");
    await expect(svg).toHaveAttribute("aria-hidden", "true");
    await expect(svg).not.toHaveAttribute("role");
    await expect(svg).not.toHaveAttribute("aria-label");
    await expect(getComputedStyle(svg as SVGSVGElement).width).toBe("20px");
  },
};

/** The ring alone; the status still holds the text, visually hidden (1 by 1 px). */
export const LabelHidden: Story = {
  args: { labelHidden: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const status = canvas.getByRole("status");
    await expect(status).toHaveTextContent("กำลังโหลด");
    const label = canvasElement.querySelector<HTMLElement>(".ds-spinner__label");
    const box = (label as HTMLElement).getBoundingClientRect();
    await expect(box.width).toBe(1);
    await expect(box.height).toBe(1);
  },
};

/** Sm 16, md 20, lg 24 px; `lg` stacks the label under the ring. */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-start gap-6">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Computed size, not the bounding box: the turning ring's bounding box grows while it rotates.
    const rings = Array.from(canvasElement.querySelectorAll<SVGSVGElement>("svg"));
    await expect(rings.map((ring) => getComputedStyle(ring).width)).toEqual([
      "16px",
      "20px",
      "24px",
    ]);
    await expect(rings.map((ring) => getComputedStyle(ring).height)).toEqual([
      "16px",
      "20px",
      "24px",
    ]);
  },
};

/** The ring alone with no status region, for a control that owns its status. */
export const Decorative: Story = {
  args: { decorative: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryAllByRole("status")).toHaveLength(0);
    await expect(canvasElement.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    await expect(canvasElement.querySelector(".ds-spinner__label")).toBeNull();
  },
};

/** No reduced-motion rule stops the ring: it keeps its turn and the label carries the state. */
export const ReducedMotion: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("กำลังโหลด")).toBeVisible();
    const svg = canvasElement.querySelector<SVGSVGElement>("svg");
    await expect(getComputedStyle(svg as SVGSVGElement).animationName).toBe("ds-spin");
    const stopped: string[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
      for (const rule of Array.from(sheet.cssRules)) {
        if (rule instanceof CSSMediaRule && rule.conditionText.includes("prefers-reduced-motion")) {
          for (const inner of Array.from(rule.cssRules)) {
            if (
              inner instanceof CSSStyleRule &&
              /\.ds-spin(ner)?\b/.test(inner.selectorText) &&
              inner.style.animationName !== ""
            ) {
              stopped.push(inner.selectorText);
            }
          }
        }
      }
    }
    await expect(stopped).toEqual([]);
  },
};

/** English: "Loading" beside the ring, then the ring alone; both statuses hold the word. */
export const InEnglish: Story = {
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  render: () => (
    <div className="flex items-center gap-6">
      <Spinner />
      <Spinner labelHidden />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const statuses = within(canvasElement).getAllByRole("status");
    await expect(statuses).toHaveLength(2);
    for (const status of statuses) await expect(status).toHaveTextContent("Loading");
  },
};

/** A long Thai label wraps beside the ring in a 360 px frame with no sideways scroll. */
export const LongLabelAt360: Story = {
  render: () => (
    <div data-testid="frame" className="w-[360px] max-w-full overflow-hidden">
      <Spinner label={fixtures.longThai} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(360);
    const label = canvasElement.querySelector<HTMLElement>(".ds-spinner__label");
    await expect((label as HTMLElement).getBoundingClientRect().height).toBeGreaterThan(24);
    expectNoGlyphClip(frame);
    // The ring centres on the first line (a 23.8 px line box of body.sm) and the frame holds both.
    const ring = canvasElement.querySelector<SVGSVGElement>("svg") as SVGSVGElement;
    const labelBox = (label as HTMLElement).getBoundingClientRect();
    const frameBox = frame.getBoundingClientRect();
    const ringBox = ring.getBoundingClientRect();
    await expect(
      Math.abs(ringBox.top + ringBox.height / 2 - (labelBox.top + 23.8 / 2)),
    ).toBeLessThan(2.5);
    await expect(labelBox.right).toBeLessThanOrEqual(frameBox.right + 0.5);
    await expect(ringBox.left + ringBox.width / 2).toBeGreaterThanOrEqual(frameBox.left + 10);
  },
};

export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <Spinner />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll("[data-matrix-cell]")).toHaveLength(6);
    await expect(within(canvasElement).getAllByRole("status")).toHaveLength(6);
  },
};
