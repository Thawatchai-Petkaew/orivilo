import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ComponentType, useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { fixtures } from "../fixtures";
import { Matrix, Narrow } from "../matrix";
import { RangeSlider } from "./RangeSlider";

/** A width cap around the story. Storybook adds a meta decorator to every story (a story's
 * `decorators: []` does not drop it), so each story that wants it names it. */
const inWidth = (Story: ComponentType) => (
  <div className="max-w-sm">
    <Story />
  </div>
);

const meta = {
  title: "Base/Range slider",
  component: RangeSlider,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A lower and an upper bound on one track (ORV-77): a spacing or size range. Both values always show as text; each thumb has its own name and aria-valuetext; the thumbs meet but never cross.",
      },
    },
  },
  args: { label: "ช่วงระยะห่าง", defaultValue: [20, 60], format: (v: number) => `${v} px` },
} satisfies Meta<typeof RangeSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

const thumbs = (root: HTMLElement) => {
  const canvas = within(root);
  return {
    lower: canvas.getByRole("slider", { name: "ค่าต่ำสุด ช่วงระยะห่าง" }),
    upper: canvas.getByRole("slider", { name: "ค่าสูงสุด ช่วงระยะห่าง" }),
  };
};

/** Both values read as text without hover; each thumb is named and reads its own value (AC 1, 5). */
export const Default: Story = {
  decorators: [inWidth],
  play: async ({ canvasElement }) => {
    const { lower, upper } = thumbs(canvasElement);
    await expect(within(canvasElement).getByText("20 px ถึง 60 px")).toBeVisible();
    await expect(lower).toHaveAttribute("aria-valuetext", "20 px");
    await expect(upper).toHaveAttribute("aria-valuetext", "60 px");
  },
};

/** Each thumb takes arrows, Page and Home/End on its own (AC 2). */
export const Keyboard: Story = {
  decorators: [inWidth],
  play: async ({ canvasElement }) => {
    const { lower, upper } = thumbs(canvasElement);
    lower.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(lower).toHaveAttribute("aria-valuenow", "21");
    await userEvent.keyboard("{Home}");
    await expect(lower).toHaveAttribute("aria-valuenow", "0");
    await expect(upper).toHaveAttribute("aria-valuenow", "60");
    upper.focus();
    await userEvent.keyboard("{PageUp}");
    await expect(upper).toHaveAttribute("aria-valuenow", "70");
    await userEvent.keyboard("{End}");
    await expect(upper).toHaveAttribute("aria-valuenow", "100");
    await expect(lower).toHaveAttribute("aria-valuenow", "0");
    await expect(within(canvasElement).getByText("0 px ถึง 100 px")).toBeVisible();
  },
};

/**
 * Pushing the lower thumb past the upper stops it there: the values stay ordered and the thumb
 * the user moved keeps focus and keeps moving itself afterwards (AC 3).
 */
export const NoCrossing: Story = {
  decorators: [inWidth],
  args: { defaultValue: [55, 60] },
  play: async ({ canvasElement }) => {
    const { lower, upper } = thumbs(canvasElement);
    lower.focus();
    await userEvent.keyboard("{End}");
    await expect(lower).toHaveAttribute("aria-valuenow", "60");
    await expect(upper).toHaveAttribute("aria-valuenow", "60");
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await expect(lower).toHaveAttribute("aria-valuenow", "60");
    await expect(upper).toHaveAttribute("aria-valuenow", "60");
    await expect(lower).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(lower).toHaveAttribute("aria-valuenow", "59");
    await expect(upper).toHaveAttribute("aria-valuenow", "60");
  },
};

/** `minGap` keeps the thumbs apart (AC 4). */
export const MinGap: Story = {
  decorators: [inWidth],
  args: { defaultValue: [40, 60], minGap: 10 },
  play: async ({ canvasElement }) => {
    const { lower, upper } = thumbs(canvasElement);
    lower.focus();
    await userEvent.keyboard("{End}");
    await expect(lower).toHaveAttribute("aria-valuenow", "50");
    await expect(upper).toHaveAttribute("aria-valuenow", "60");
  },
};

function Committed() {
  const [live, setLive] = useState<[number, number]>([20, 60]);
  const [committed, setCommitted] = useState<[number, number]>([20, 60]);
  return (
    <div className="flex flex-col gap-3">
      <RangeSlider
        label="ช่วงระยะห่าง"
        value={live}
        onValueChange={setLive}
        onValueCommit={setCommitted}
        step={5}
      />
      <p>
        บันทึกแล้วที่ {committed[0]} ถึง {committed[1]}
      </p>
    </div>
  );
}

/** Controlled; a keyboard step commits at once with both values (AC 6). A drag commits on release in Radix. */
export const Commit: Story = {
  decorators: [inWidth],
  render: () => <Committed />,
  play: async ({ canvasElement }) => {
    const { upper } = thumbs(canvasElement);
    upper.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(within(canvasElement).getByText("บันทึกแล้วที่ 20 ถึง 65")).toBeVisible();
  },
};

export const Disabled: Story = {
  decorators: [inWidth],
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    for (const thumb of within(canvasElement).getAllByRole("slider")) {
      await expect(thumb).toHaveAttribute("data-disabled");
    }
  },
};

export const LongLabelAt360: Story = {
  render: (args) => (
    <Narrow>
      <RangeSlider {...args} label={fixtures.longThai} />
    </Narrow>
  ),
};

export const RecipesAndModes: Story = {
  render: (args) => (
    <Matrix>
      <RangeSlider {...args} />
      <RangeSlider {...args} label="ปิดอยู่" disabled />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    // The matrix is not inside the width cap: a meta decorator wrapping this story would narrow it.
    await expect(canvasElement.querySelector(".max-w-sm")).toBeNull();
  },
};
