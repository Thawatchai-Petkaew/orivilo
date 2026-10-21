import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Field } from "../field/Field";
import { fixtures } from "../fixtures";
import { Matrix, Narrow } from "../matrix";
import { Textarea } from "./Textarea";

const meta = {
  title: "Base/Textarea",
  component: Textarea,
  args: { placeholder: "เล่าสั้น ๆ ว่าแบรนด์นี้ทำอะไรและเพื่อใคร" },
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Field label="บรีฟ">
          <Story />
        </Field>
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  decorators: [],
  render: (args) => (
    <div className="flex max-w-md flex-col gap-4">
      <Field label="กลาง">
        <Textarea {...args} size="md" />
      </Field>
      <Field label="ใหญ่">
        <Textarea {...args} size="lg" />
      </Field>
    </div>
  ),
};

export const InteractionStates: Story = {
  decorators: [],
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

export const Invalid: Story = {
  decorators: [],
  render: (args) => (
    <div className="max-w-md">
      <Field label="บรีฟ" error="บรีฟสั้นเกินไป เขียนอย่างน้อยสองประโยคว่าแบรนด์ทำอะไรและเพื่อใคร">
        <Textarea {...args} defaultValue="ขายของ" />
      </Field>
    </div>
  ),
};

export const Disabled: Story = { args: { disabled: true, defaultValue: fixtures.mixed } };

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: fixtures.mixed } };

export const LongContentAt360: Story = {
  decorators: [],
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
  decorators: [],
  render: (args) => (
    <Matrix>
      <Field label="บรีฟ">
        <Textarea {...args} defaultValue={fixtures.mixed} rows={2} />
      </Field>
      <Field label="ผิดพลาด" error="บรีฟสั้นเกินไป เขียนอย่างน้อยสองประโยค">
        <Textarea {...args} defaultValue="ขายของ" rows={2} />
      </Field>
    </Matrix>
  ),
};
