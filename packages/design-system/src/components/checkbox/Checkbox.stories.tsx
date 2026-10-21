import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { fixtures } from "../fixtures";
import { Matrix, Narrow } from "../matrix";
import { Checkbox } from "./Checkbox";

const meta = {
  title: "Base/Checkbox",
  component: Checkbox,
  args: { label: "ส่งสรุปให้ทีมเมื่ออนุมัติ" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Clicking the label toggles the box: the label is part of the hit area (catalog rule). */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole("checkbox", { name: "ส่งสรุปให้ทีมเมื่ออนุมัติ" });
    await expect(box).toHaveAttribute("aria-checked", "false");
    await userEvent.click(canvas.getByText("ส่งสรุปให้ทีมเมื่ออนุมัติ"));
    await expect(box).toHaveAttribute("aria-checked", "true");
  },
};

export const Checked: Story = { args: { defaultChecked: true } };

/** Exposed as aria-checked="mixed" with a minus glyph (AC 8). */
export const Indeterminate: Story = {
  args: { checked: "indeterminate", label: "เลือกทั้งหมด", description: "เลือกไว้ 2 จาก 5 รายการ" },
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole("checkbox", { name: "เลือกทั้งหมด" });
    await expect(box).toHaveAttribute("aria-checked", "mixed");
  },
};

export const InteractionStates: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Checkbox {...args} label="Hover" id="cb-hover" />
      <Checkbox {...args} label="Focus" id="cb-focus" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByText("Hover"));
    canvas.getByRole("checkbox", { name: "Focus" }).focus();
    await expect(canvas.getByRole("checkbox", { name: "Focus" })).toHaveFocus();
  },
};

export const WithDescription: Story = {
  args: { description: "สรุปจะส่งทางอีเมลถึงทุกคนในโปรเจกต์" },
};

export const Invalid: Story = {
  args: {
    label: "ยอมรับเงื่อนไขการใช้งาน",
    error: "ติ๊กยอมรับเงื่อนไขก่อนจึงจะสร้างโปรเจกต์ได้",
    required: true,
  },
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole("checkbox", { name: "ยอมรับเงื่อนไขการใช้งาน" });
    await expect(box).toHaveAttribute("aria-invalid", "true");
    await expect(box).toHaveAccessibleDescription("ติ๊กยอมรับเงื่อนไขก่อนจึงจะสร้างโปรเจกต์ได้");
  },
};

export const Disabled: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Checkbox {...args} disabled />
      <Checkbox {...args} disabled defaultChecked label="ปิดใช้งานและเลือกไว้" />
    </div>
  ),
};

export const LongLabelAt360: Story = {
  render: (args) => (
    <Narrow>
      <Checkbox {...args} label={fixtures.longThai} description={fixtures.longLatin} />
    </Narrow>
  ),
};

export const RecipesAndModes: Story = {
  render: (args) => (
    <Matrix>
      <Checkbox {...args} />
      <Checkbox {...args} defaultChecked label="เลือกไว้" />
      <Checkbox {...args} checked="indeterminate" label="บางส่วน" />
      <Checkbox {...args} error="ติ๊กยอมรับเงื่อนไขก่อน" label="ผิดพลาด" />
      <Checkbox {...args} disabled label="ปิดใช้งาน" />
    </Matrix>
  ),
};
