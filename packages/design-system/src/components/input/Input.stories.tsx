import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentType } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Field } from "../field/Field";
import { fixtures } from "../fixtures";
import { Matrix, Narrow } from "../matrix";
import { Input } from "./Input";

/** A Field around the story, for stories of one control. Storybook adds a meta decorator to every
 * story (a story's `decorators: []` does not drop it), so each story that wants it names it. */
const inField = (Story: ComponentType) => (
  <div className="max-w-md">
    <Field label="ชื่อโปรเจกต์">
      <Story />
    </Field>
  </div>
);

const meta = {
  title: "Base/Input",
  component: Input,
  args: { placeholder: "เช่น Brand Canvas" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { decorators: [inField] };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex max-w-md flex-col gap-4">
      <Field label="เล็ก">
        <Input {...args} size="sm" />
      </Field>
      <Field label="กลาง">
        <Input {...args} size="md" />
      </Field>
      <Field label="ใหญ่">
        <Input {...args} size="lg" />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // No Field nested in a Field: a meta decorator wrapping this story would break its labels.
    await expect(canvasElement.querySelectorAll(".ds-field .ds-field")).toHaveLength(0);
  },
};

/** Hover and focus-visible via the play function; the focused edge is the brand border plus its halo (ORV-192 row 9). */
/** A synthetic pointer sets no `:hover`, so `parameters.pseudo` forces the hover look (spec ORV-84, `hover-force-1`). */
export const InteractionStates: Story = {
  parameters: { pseudo: { rootSelector: "body", hover: ['[data-testid="hover"]'] } },
  render: (args) => (
    <div className="flex max-w-md flex-col gap-4">
      <Field label="Default">
        <Input {...args} data-testid="default" />
      </Field>
      <Field label="Hover">
        <Input {...args} data-testid="hover" />
      </Field>
      <Field label="Focus">
        <Input {...args} data-testid="focus" />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByTestId("hover"));
    canvas.getByTestId("focus").focus();
    await expect(canvas.getByTestId("focus")).toHaveFocus();
    await waitFor(() =>
      expect(getComputedStyle(canvas.getByTestId("hover")).borderColor).not.toBe(
        getComputedStyle(canvas.getByTestId("default")).borderColor,
      ),
    );
  },
};

export const WithValue: Story = { decorators: [inField], args: { defaultValue: fixtures.mixed } };

export const Invalid: Story = {
  render: (args) => (
    <div className="max-w-md">
      <Field label="อีเมล" error="อีเมลต้องมีเครื่องหมาย @ เช่น name@example.com">
        <Input {...args} type="email" defaultValue="name.example.com" />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByLabelText("อีเมล")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  },
};

export const Disabled: Story = {
  decorators: [inField],
  args: { disabled: true, defaultValue: fixtures.latin },
};

/** Read-only looks like text, not like a disabled control (DESIGN.md §7). */
export const ReadOnly: Story = {
  decorators: [inField],
  args: { readOnly: true, defaultValue: fixtures.thai },
};

export const Types: Story = {
  render: (args) => (
    <div className="flex max-w-md flex-col gap-4">
      <Field label="จำนวน">
        <Input {...args} type="number" defaultValue={12} placeholder="0" />
      </Field>
      <Field label="รหัสผ่าน">
        <Input {...args} type="password" defaultValue="correct horse" placeholder="" />
      </Field>
      <Field label="ค้นหา">
        <Input {...args} type="search" placeholder="ค้นหาโปรเจกต์" />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // No Field nested in a Field: a meta decorator wrapping this story would break its labels.
    await expect(canvasElement.querySelectorAll(".ds-field .ds-field")).toHaveLength(0);
  },
};

export const LongValueAt360: Story = {
  render: (args) => (
    <Narrow>
      <Field label={fixtures.longThai}>
        <Input {...args} defaultValue={fixtures.longThai} />
      </Field>
    </Narrow>
  ),
};

export const RecipesAndModes: Story = {
  render: (args) => (
    <Matrix>
      <Field label="ชื่อโปรเจกต์">
        <Input {...args} />
      </Field>
      <Field label="มีค่า">
        <Input {...args} defaultValue={fixtures.mixed} />
      </Field>
      <Field label="ผิดพลาด" error="ใส่ชื่อโปรเจกต์อย่างน้อย 3 ตัวอักษร">
        <Input {...args} defaultValue="ab" />
      </Field>
      <Field label="ปิดใช้งาน">
        <Input {...args} disabled defaultValue={fixtures.latin} />
      </Field>
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    // No Field nested in a Field: a meta decorator wrapping this story would break its labels.
    await expect(canvasElement.querySelectorAll(".ds-field .ds-field")).toHaveLength(0);
  },
};
