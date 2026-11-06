import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import {
  expectEdgeInk,
  expectFrameCutsNoInk,
  expectLinesClear,
  inVitest,
  resolvedColor,
} from "../../testing/visual-asserts";
import { fixtures, separatorFixtures } from "../fixtures";
import { Matrix, Narrow } from "../matrix";
import { Separator } from "./Separator";

const meta = {
  title: "Base/Separator",
  component: Separator,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          'A bare 1 px line between two blocks (ORV-230) on the Radix primitive. It is a border on `border.subtle`, so forced colours draw one line and not a hollow double line. By default it is decorative: space and the line divide on screen and a screen reader skips it. Pass `decorative={false}` for a real break between sections of content, which then has `role="separator"`. It has no label, no button and never takes focus; the space beside it is the caller\'s. The words in these stories are mock.',
      },
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

type Copy = (typeof separatorFixtures)[keyof typeof separatorFixtures];

/** One horizontal line between two words. The 16 px gap keeps the words clear of the 4 px `expectEdgeInk` reads each side. */
function Column({ copy, decorative }: { copy: Copy; decorative?: boolean }) {
  return (
    <div data-testid="column" className="flex w-64 flex-col items-center gap-4 text-label-md">
      <span>{copy.above}</span>
      <Separator decorative={decorative} />
      <span>{copy.below}</span>
    </div>
  );
}

/** One vertical line between two words in a row 40 px tall, and a second vertical line alone in a block parent. */
function Row({ copy, decorative }: { copy: Copy; decorative?: boolean }) {
  return (
    <div className="flex flex-col gap-4 text-label-md">
      <div data-testid="row" className="flex min-h-10 items-center gap-3">
        <span>{copy.start}</span>
        <Separator orientation="vertical" decorative={decorative} />
        <span>{copy.end}</span>
      </div>
      <div data-testid="block">
        <Separator orientation="vertical" decorative={decorative} />
      </div>
    </div>
  );
}

const linesOf = (root: Element) => Array.from(root.querySelectorAll<HTMLElement>(".ds-separator"));
/** Two lengths agree to 0.5 px; the message names both so a red run says by how much. */
async function expectNear(actual: number, expected: number, what: string) {
  await expect(
    Math.abs(actual - expected),
    `${what} is ${actual} px, expected ${expected} px`,
  ).toBeLessThanOrEqual(0.5);
}

/** The line is a border: 1 px, and no background that forced colours would paint out. */
async function expectBorderLine(line: HTMLElement, side: "block-start" | "inline-start") {
  const style = getComputedStyle(line);
  await expect(
    side === "block-start" ? style.borderBlockStartWidth : style.borderInlineStartWidth,
  ).toBe("1px");
  await expect(style.backgroundColor).toBe("rgba(0, 0, 0, 0)");
}

/** A thin line across the column between two words. */
export const Default: Story = {
  render: () => <Column copy={separatorFixtures.th} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(separatorFixtures.th.above)).toBeVisible();
    await expect(canvas.getByText(separatorFixtures.th.below)).toBeVisible();
    const [line] = linesOf(canvasElement) as [HTMLElement];
    await expect(line).toHaveAttribute("role", "none");
    await expect(line).toHaveAttribute("data-orientation", "horizontal");
    await expect(line).not.toHaveAttribute("aria-orientation");
    await expect(line).not.toHaveAttribute("tabindex");
    const parent = line.parentElement as HTMLElement;
    await expectNear(
      line.getBoundingClientRect().width,
      parent.getBoundingClientRect().width,
      "the line's width",
    );
    await expectBorderLine(line, "block-start");
    if (inVitest) await expectEdgeInk(line, "top", 1);
  },
};

/** A thin upright line as tall as its row; a second line alone in a block parent stays one line of text tall. */
export const Vertical: Story = {
  render: () => <Row copy={separatorFixtures.th} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(separatorFixtures.th.start)).toBeVisible();
    await expect(canvas.getByText(separatorFixtures.th.end)).toBeVisible();
    const [inRow, alone] = linesOf(canvasElement) as [HTMLElement, HTMLElement];
    for (const line of [inRow, alone]) {
      await expect(line).toHaveAttribute("role", "none");
      await expect(line).toHaveAttribute("data-orientation", "vertical");
      await expect(line).not.toHaveAttribute("aria-orientation");
      await expect(line).not.toHaveAttribute("tabindex");
      await expectBorderLine(line, "inline-start");
    }
    const row = within(canvasElement).getByTestId("row");
    await expectNear(
      inRow.getBoundingClientRect().height,
      row.getBoundingClientRect().height,
      "the line's height",
    );
    // In a block parent the line is not squashed to nothing: at least one line of text tall.
    const lineHeight = parseFloat(getComputedStyle(alone).lineHeight);
    await expect(Number.isNaN(lineHeight)).toBe(false);
    await expect(alone.getBoundingClientRect().height).toBeGreaterThanOrEqual(lineHeight - 0.5);
    if (inVitest) await expectEdgeInk(inRow, "left", 1);
  },
};

/** With `decorative={false}` the same two lines are separators for a screen reader. */
export const Semantic: Story = {
  render: () => (
    <div className="flex flex-col gap-4 text-label-md">
      <div className="flex w-64 flex-col gap-4">
        <span>{separatorFixtures.th.above}</span>
        <Separator decorative={false} />
        <span>{separatorFixtures.th.below}</span>
      </div>
      <div className="flex min-h-10 items-center gap-3">
        <span>{separatorFixtures.th.start}</span>
        <Separator orientation="vertical" decorative={false} />
        <span>{separatorFixtures.th.end}</span>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const separators = within(canvasElement).getAllByRole("separator");
    await expect(separators).toHaveLength(2);
    const [horizontal, vertical] = separators as [HTMLElement, HTMLElement];
    // Horizontal is the implicit orientation: Radix leaves `aria-orientation` off.
    await expect(horizontal).not.toHaveAttribute("aria-orientation");
    await expect(horizontal).toHaveAttribute("data-orientation", "horizontal");
    await expect(vertical).toHaveAttribute("aria-orientation", "vertical");
    await expect(vertical).toHaveAttribute("data-orientation", "vertical");
    for (const line of separators) await expect(line).not.toHaveAttribute("tabindex");
  },
};

/** English: the lines of the three stories above beside English words. */
export const InEnglish: Story = {
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  render: () => (
    <div className="flex flex-col gap-6">
      <Column copy={separatorFixtures.en} />
      <Row copy={separatorFixtures.en} />
      <div className="flex w-64 flex-col gap-4 text-label-md">
        <span>{separatorFixtures.en.above}</span>
        <Separator decorative={false} />
        <span>{separatorFixtures.en.below}</span>
      </div>
      <div className="flex min-h-10 items-center gap-3 text-label-md">
        <span>{separatorFixtures.en.start}</span>
        <Separator orientation="vertical" decorative={false} />
        <span>{separatorFixtures.en.end}</span>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const word of Object.values(separatorFixtures.en)) {
      await expect(canvas.getAllByText(word).length).toBeGreaterThan(0);
    }
    await expect(canvas.getAllByRole("separator")).toHaveLength(2);
  },
};

/**
 * In a 360 px frame two long Thai names wrap and the line spans the frame. The frame clips nothing:
 * the overflow loop reads the computed style of the paragraph and every ancestor up to the frame,
 * and `expectFrameCutsNoInk` reads the pixels, so a clip by the frame or any ancestor goes red.
 */
export const At360: Story = {
  render: () => (
    <Narrow>
      <p data-name="" className="m-0 text-label-md [overflow-wrap:anywhere]">
        {fixtures.longThai}
      </p>
      <Separator className="my-3" />
      <p className="m-0 text-label-md [overflow-wrap:anywhere]">{fixtures.longThai}</p>
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    const first = canvasElement.querySelector<HTMLElement>("[data-name]") as HTMLElement;
    const frame = first.parentElement as HTMLElement;
    await expect(frame.scrollWidth).toBeLessThanOrEqual(360);
    const [line] = linesOf(frame) as [HTMLElement];
    await expectNear(
      line.getBoundingClientRect().width,
      frame.getBoundingClientRect().width,
      "the line's width",
    );
    // Both names wrap onto more than one 24 px line.
    for (const paragraph of frame.querySelectorAll("p")) {
      await expect(paragraph.getBoundingClientRect().height).toBeGreaterThan(24);
    }
    // Every ancestor of the paragraph up to and including the frame clips nothing.
    for (let el: HTMLElement | null = first; el; el = el === frame ? null : el.parentElement) {
      const style = getComputedStyle(el);
      await expect(style.overflowX, `${el.localName} clips on x`).toBe("visible");
      await expect(style.overflowY, `${el.localName} clips on y`).toBe("visible");
    }
    if (inVitest) {
      await expectLinesClear(first);
      // Last, so the overflow loop above is not what stops the play.
      await expectFrameCutsNoInk(first, frame);
    }
  },
};

/** A horizontal and a vertical line in each of the six boundaries. */
export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <div className="flex flex-col gap-3 text-label-md">
        <span>{separatorFixtures.th.above}</span>
        <Separator />
        <div className="flex min-h-10 items-center gap-3">
          <span>{separatorFixtures.th.start}</span>
          <Separator orientation="vertical" />
          <span>{separatorFixtures.th.end}</span>
        </div>
      </div>
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    for (const cell of cells) {
      const lines = linesOf(cell);
      await expect(lines).toHaveLength(2);
      // The ink is the cell's own `separator.line`, not a value one boundary shares with the next.
      const ink = resolvedColor(cell, "--cmp-separator-line");
      await expect(getComputedStyle(lines[0] as HTMLElement).borderBlockStartColor).toBe(ink);
      await expect(getComputedStyle(lines[1] as HTMLElement).borderInlineStartColor).toBe(ink);
    }
    await expect(linesOf(canvasElement)).toHaveLength(12);
  },
};

/**
 * Type contract (`sep-api-1`), checked by `pnpm typecheck`. The rejected elements are created and
 * dropped, never mounted: a child, a variant and `asChild` are each a type error. The story draws
 * the one valid line.
 */
export const TypeContract: Story = {
  render: () => {
    const rejected = [
      // @ts-expect-error a separator is a bare line: there is no children prop
      <Separator>{separatorFixtures.th.above}</Separator>,
      // @ts-expect-error there is no variant prop
      <Separator variant="dashed" />,
      // @ts-expect-error there is no asChild prop
      <Separator asChild />,
    ];
    return (
      <div data-rejected={rejected.length} className="w-64">
        <Separator />
      </div>
    );
  },
};
