import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ComponentType, useState } from "react";
import { expect, fireEvent, userEvent, within } from "storybook/test";
import { Matrix } from "../matrix";
import { Slider } from "./Slider";

/** A width cap around the story. Storybook adds a meta decorator to every story (a story's
 * `decorators: []` does not drop it), so each story that wants it names it. */
const inWidth = (Story: ComponentType) => (
  <div className="max-w-sm">
    <Story />
  </div>
);

const meta = {
  title: "Base/Slider",
  component: Slider,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A bounded number with an immediate visible effect (E4-4): density, strength, zoom. The value always shows as text beside the track and is announced as aria-valuetext.",
      },
    },
  },
  args: { label: "ความหนาแน่น", defaultValue: 40, format: (v: number) => `${v}%` },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Arrows step by 1, Page keys by 10, Home and End jump to the bounds; the text follows. */
export const Default: Story = {
  decorators: [inWidth],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const thumb = canvas.getByRole("slider", { name: "ความหนาแน่น" });
    await expect(thumb).toHaveAttribute("aria-valuetext", "40%");
    thumb.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(thumb).toHaveAttribute("aria-valuenow", "41");
    await userEvent.keyboard("{PageUp}");
    await expect(thumb).toHaveAttribute("aria-valuenow", "51");
    await userEvent.keyboard("{End}");
    await expect(thumb).toHaveAttribute("aria-valuenow", "100");
    await userEvent.keyboard("{Home}");
    await expect(thumb).toHaveAttribute("aria-valuetext", "0%");
    await expect(canvas.getByText("0%")).toBeVisible();
  },
};

function Committed() {
  const [live, setLive] = useState(50);
  const [committed, setCommitted] = useState(50);
  return (
    <div className="flex flex-col gap-3">
      <Slider
        label="ความเข้มของกราฟิก"
        value={live}
        onValueChange={setLive}
        onValueCommit={setCommitted}
        step={5}
      />
      <p className="text-body-sm text-text-secondary">บันทึกแล้วที่ {committed}</p>
    </div>
  );
}

/** Controlled, with the commit fired once on release (dragging state while the pointer is down). */
export const Dragging: Story = {
  decorators: [inWidth],
  render: () => <Committed />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const thumb = canvas.getByRole("slider", { name: "ความเข้มของกราฟิก" });
    thumb.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await expect(thumb).toHaveAttribute("aria-valuenow", "60");
    // Radix commits keyboard steps at once; a pointer commits on release.
    fireEvent.keyUp(thumb, { key: "ArrowRight" });
    await expect(canvas.getByText("บันทึกแล้วที่ 60")).toBeVisible();
  },
};

export const Disabled: Story = {
  decorators: [inWidth],
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const thumb = within(canvasElement).getByRole("slider");
    await expect(thumb).toHaveAttribute("data-disabled");
  },
};

export const RecipesAndModes: Story = {
  render: (args) => (
    <Matrix>
      <Slider {...args} />
      <Slider {...args} label="ปิดอยู่" disabled />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    // No Field nested in a Field: a meta decorator wrapping this story would break its labels.
    await expect(canvasElement.querySelectorAll(".ds-field .ds-field")).toHaveLength(0);
    // The matrix is not inside the width cap: a meta decorator wrapping this story would narrow it.
    await expect(canvasElement.querySelector(".max-w-sm")).toBeNull();
  },
};
