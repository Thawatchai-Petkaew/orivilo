import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { fixtures, fixtureOptions } from "../fixtures";
import { Input } from "../input/Input";
import { Matrix, Narrow } from "../matrix";
import { Select } from "../select/Select";
import { Textarea } from "../textarea/Textarea";
import { Field } from "./Field";

const meta = {
  title: "Base/Field",
  component: Field,
  args: { label: "ชื่อโปรเจกต์", children: <Input placeholder="เช่น Brand Canvas" /> },
  parameters: { layout: "padded" },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText("ชื่อโปรเจกต์");
    await expect(input).toBeInstanceOf(HTMLInputElement);
  },
};

export const WithDescription: Story = {
  args: { description: "ชื่อที่ทีมจะเห็นในรายการโปรเจกต์" },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText("ชื่อโปรเจกต์");
    await expect(input).toHaveAccessibleDescription("ชื่อที่ทีมจะเห็นในรายการโปรเจกต์");
  },
};

export const Required: Story = {
  args: { required: true },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText(/ชื่อโปรเจกต์/);
    await expect(input).toHaveAttribute("aria-required", "true");
  },
};

/** The label is linked by for/id, the error by aria-describedby, and aria-invalid is set (AC 6). */
export const Invalid: Story = {
  args: {
    description: "ชื่อที่ทีมจะเห็นในรายการโปรเจกต์",
    error: "ใส่ชื่อโปรเจกต์อย่างน้อย 3 ตัวอักษร",
    children: <Input defaultValue="ab" />,
  },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText("ชื่อโปรเจกต์");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleDescription(
      "ใส่ชื่อโปรเจกต์อย่างน้อย 3 ตัวอักษร ชื่อที่ทีมจะเห็นในรายการโปรเจกต์",
    );
    await expect(within(canvasElement).getByRole("alert")).toHaveTextContent("ใส่ชื่อโปรเจกต์");
  },
};

export const Disabled: Story = {
  args: { disabled: true, children: <Input defaultValue={fixtures.latin} /> },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByLabelText("ชื่อโปรเจกต์")).toBeDisabled();
  },
};

/** The same wiring around each text control. */
export const EveryControl: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-6">
      <Field label="ชื่อโปรเจกต์" error="ใส่ชื่อโปรเจกต์อย่างน้อย 3 ตัวอักษร">
        <Input defaultValue="ab" />
      </Field>
      <Field label="สรุปงาน" description="สั้นพอที่จะอ่านจบในหนึ่งนาที">
        <Textarea defaultValue={fixtures.mixed} />
      </Field>
      <Field label="โมดูล" error="เลือกโมดูลที่งานนี้สังกัด">
        <Select options={fixtureOptions} />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText("สรุปงาน")).toHaveAccessibleDescription(
      "สั้นพอที่จะอ่านจบในหนึ่งนาที",
    );
    const trigger = canvas.getByRole("combobox", { name: "โมดูล" });
    await expect(trigger).toHaveAttribute("aria-invalid", "true");
    await expect(trigger).toHaveAccessibleDescription("เลือกโมดูลที่งานนี้สังกัด");
  },
};

export const LongLabelAt360: Story = {
  render: () => (
    <Narrow>
      <Field label={fixtures.longThai} description={fixtures.longLatin} error={fixtures.longThai}>
        <Input defaultValue={fixtures.longThai} />
      </Field>
    </Narrow>
  ),
};

export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <Field
        label="ชื่อโปรเจกต์"
        description="ชื่อที่ทีมจะเห็น"
        error="ใส่ชื่อโปรเจกต์อย่างน้อย 3 ตัวอักษร"
      >
        <Input defaultValue="ab" />
      </Field>
    </Matrix>
  ),
};
