import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentType } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Field } from "../field/Field";
import { fixtures } from "../fixtures";
import { Matrix, Narrow } from "../matrix";
import { Textarea } from "./Textarea";

/** A Field around the story, for stories of one textarea. Storybook adds a meta decorator to every
 * story (a story's `decorators: []` does not remove it), so each story that wants it names it. */
const inField = (Story: ComponentType) => (
  <div className="max-w-md">
    <Field label="บรีฟ">
      <Story />
    </Field>
  </div>
);

const meta = {
  title: "Base/Textarea",
  component: Textarea,
  args: { placeholder: "เล่าสั้น ๆ ว่าแบรนด์นี้ทำอะไรและเพื่อใคร" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { decorators: [inField] };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex max-w-md flex-col gap-4">
      <Field label="เล็ก">
        <Textarea {...args} size="sm" />
      </Field>
      <Field label="กลาง">
        <Textarea {...args} size="md" />
      </Field>
      <Field label="ใหญ่">
        <Textarea {...args} size="lg" />
      </Field>
    </div>
  ),
  play: ({ canvasElement }) => {
    // No Field nested in a Field: a meta decorator wrapping these stories would break labels.
    expect(canvasElement.querySelectorAll(".ds-field .ds-field")).toHaveLength(0);
  },
};

export const InteractionStates: Story = {
  render: (args) => (
    <div className="flex max-w-md flex-col gap-4">
      <Field label="Hover">
        <Textarea {...args} data-testid="hover" />
      </Field>
      <Field label="Focus">
        <Textarea {...args} data-testid="focus" />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByTestId("hover"));
    canvas.getByTestId("focus").focus();
    await expect(canvas.getByTestId("focus")).toHaveFocus();
  },
};

/** Grows from `rows` to `maxRows`, then scrolls (AC 9). */
export const AutoGrow: Story = {
  decorators: [inField],
  args: { rows: 2, maxRows: 4 },
  play: async ({ canvasElement }) => {
    const textarea = within(canvasElement).getByLabelText("บรีฟ") as HTMLTextAreaElement;
    const start = textarea.getBoundingClientRect().height;
    await userEvent.click(textarea);
    await userEvent.keyboard("หนึ่ง{Enter}สอง{Enter}สาม");
    await waitFor(() => expect(textarea.getBoundingClientRect().height).toBeGreaterThan(start));
    const atThree = textarea.getBoundingClientRect().height;
    await expect(textarea.style.overflowY).toBe("hidden");
    await userEvent.keyboard("{Enter}สี่{Enter}ห้า{Enter}หก{Enter}เจ็ด");
    await waitFor(() => expect(textarea.style.overflowY).toBe("auto"));
    const bounded = textarea.getBoundingClientRect().height;
    await expect(bounded).toBeGreaterThan(atThree);
    await expect(bounded).toBeLessThan(atThree * 2);
  },
};

/** The counter counts graphemes, not UTF-16 units (ORV-72, AC 4): `น้ำใจ` is 3, not 5. */
export const Counter: Story = {
  decorators: [inField],
  args: { maxLength: 10, rows: 2 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("บรีฟ");
    await expect(canvas.getByText("0/10")).toBeVisible();
    await userEvent.click(textarea);
    await userEvent.keyboard("น้ำใจ");
    await expect(textarea).toHaveValue("น้ำใจ");
    await expect(canvas.getByText("3/10")).toBeVisible();
    await expect(textarea).toHaveAccessibleDescription("ตัวอักษร 3 จาก 10");
    await expect(textarea).not.toHaveAttribute("aria-invalid");
    await expect(textarea).not.toHaveAttribute("maxlength");
  },
};

/** `showCount` without a limit: the count alone (AC 6). */
export const CountWithoutLimit: Story = {
  decorators: [inField],
  args: { showCount: true, rows: 2, defaultValue: "แบรนด์ ORIVILO" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("13")).toBeVisible();
    await expect(canvas.getByLabelText("บรีฟ")).toHaveAccessibleDescription("ตัวอักษร 13");
  },
};

/**
 * Past the limit typing is not cut (AC 5): the counter turns danger ink, the box is invalid and
 * its description says how many over.
 */
export const OverLimit: Story = {
  decorators: [inField],
  args: { maxLength: 5, rows: 2, defaultValue: "น้ำใจ" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("บรีฟ");
    await userEvent.click(textarea);
    await userEvent.keyboard("ไมตรี");
    await expect(textarea).toHaveValue("น้ำใจไมตรี");
    await expect(canvas.getByText("7/5")).toBeVisible();
    await expect(textarea).toHaveAttribute("aria-invalid", "true");
    await expect(textarea).toHaveAccessibleDescription("ตัวอักษร 7 จาก 5 เกินมา 2 ตัวอักษร");
  },
};

export const Invalid: Story = {
  render: (args) => (
    <div className="max-w-md">
      <Field label="บรีฟ" error="บรีฟสั้นเกินไป เขียนอย่างน้อยสองประโยคว่าแบรนด์ทำอะไรและเพื่อใคร">
        <Textarea {...args} defaultValue="ขายของ" />
      </Field>
    </div>
  ),
};

export const Disabled: Story = {
  decorators: [inField],
  args: { disabled: true, defaultValue: fixtures.mixed },
};

export const ReadOnly: Story = {
  decorators: [inField],
  args: { readOnly: true, defaultValue: fixtures.mixed },
};

export const LongContentAt360: Story = {
  render: (args) => (
    <Narrow>
      <Field label="บรีฟ">
        <Textarea
          {...args}
          defaultValue={`${fixtures.longThai}\n${fixtures.longLatin}\n${fixtures.mixed}`}
        />
      </Field>
    </Narrow>
  ),
};

export const RecipesAndModes: Story = {
  render: (args) => (
    <Matrix>
      <Field label="บรีฟ">
        <Textarea {...args} defaultValue={fixtures.mixed} rows={2} />
      </Field>
      <Field label="ผิดพลาด" error="บรีฟสั้นเกินไป เขียนอย่างน้อยสองประโยค">
        <Textarea {...args} defaultValue="ขายของ" rows={2} />
      </Field>
      <Field label="นับตัวอักษร">
        <Textarea {...args} defaultValue="น้ำใจ" maxLength={20} rows={2} size="sm" />
      </Field>
      <Field label="เกินจำนวน">
        <Textarea {...args} defaultValue="น้ำใจไมตรี" maxLength={5} rows={2} size="sm" />
      </Field>
    </Matrix>
  ),
  play: ({ canvasElement }) => {
    // No Field nested in a Field: a meta decorator wrapping these stories would break labels.
    expect(canvasElement.querySelectorAll(".ds-field .ds-field")).toHaveLength(0);
  },
};
