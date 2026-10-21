import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Field } from "../field/Field";
import { fixtures } from "../fixtures";
import { Matrix, Narrow } from "../matrix";
import { Input } from "./Input";

const meta = {
  title: "Base/Input",
  component: Input,
  args: { placeholder: "เช่น Brand Canvas" },
  parameters: { layout: "padded" },
  /** Every input has a visible label (catalog rule); the Field supplies it. */
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Field label="ชื่อโปรเจกต์">
          <Story />
        </Field>
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  decorators: [],
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
};

/** Hover and focus-visible via the play function; the focused edge is `focus.ring` plus the global ring. */
export const InteractionStates: Story = {
  decorators: [],
  render: (args) => (
    <div className="flex max-w-md flex-col gap-4">
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
  },
};

export const WithValue: Story = { args: { defaultValue: fixtures.mixed } };

export const Invalid: Story = {
  decorators: [],
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

export const Disabled: Story = { args: { disabled: true, defaultValue: fixtures.latin } };

/** Read-only looks like text, not like a disabled control (DESIGN.md §7). */
export const ReadOnly: Story = { args: { readOnly: true, defaultValue: fixtures.thai } };

export const Types: Story = {
  decorators: [],
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
};

export const LongValueAt360: Story = {
  decorators: [],
  render: (args) => (
    <Narrow>
      <Field label={fixtures.longThai}>
        <Input {...args} defaultValue={fixtures.longThai} />
      </Field>
    </Narrow>
  ),
};

export const RecipesAndModes: Story = {
  decorators: [],
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
};
