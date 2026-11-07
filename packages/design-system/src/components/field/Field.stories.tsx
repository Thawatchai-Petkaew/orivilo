import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { fixtures, fixtureOptions, radioFixtures, switchFixtures } from "../fixtures";
import { Input } from "../input/Input";
import { Matrix, Narrow } from "../matrix";
import { RadioGroup, RadioGroupItem } from "../radio-group/RadioGroup";
import { Select } from "../select/Select";
import { Switch } from "../switch/Switch";
import { Textarea } from "../textarea/Textarea";
import { expectTitleOverText } from "../../testing/visual-asserts";
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
    // ORV-192 row 17: a compact pair, 14 / 500 label over 14 / 400 secondary text, 4 px apart.
    const label = canvasElement.querySelector(".ds-field__label");
    const text = canvasElement.querySelector(".ds-field__description");
    if (!label || !text) throw new Error("the field has no label or description");
    expectTitleOverText(label, text, { gap: 4 });
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
    // Without `group` the label stays a <label> whose `for` is the control's id (field-group-1).
    const label = canvasElement.querySelector(".ds-field__label") as HTMLLabelElement;
    await expect(label.tagName).toBe("LABEL");
    await expect(label.htmlFor).toBe(canvas.getByLabelText("ชื่อโปรเจกต์").id);
    const trigger = canvas.getByRole("combobox", { name: "โมดูล" });
    await expect(trigger).toHaveAttribute("aria-invalid", "true");
    await expect(trigger).toHaveAccessibleDescription("เลือกโมดูลที่งานนี้สังกัด");
  },
};

/**
 * `group`: the control is a RadioGroup, a `div` that `for` cannot reach, so the label is a `span`
 * with an id and the group names itself with `aria-labelledby` (field-group-1).
 */
export const GroupControl: Story = {
  args: {
    group: true,
    label: radioFixtures.label,
    description: radioFixtures.help,
    children: (
      <RadioGroup defaultValue="members">
        <RadioGroupItem value="members" label={radioFixtures.members} />
        <RadioGroupItem value="organization" label={radioFixtures.organization} />
      </RadioGroup>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const label = canvasElement.querySelector(".ds-field__label") as HTMLElement;
    await expect(label.tagName).toBe("SPAN");
    await expect(label.hasAttribute("for")).toBe(false);
    const group = canvas.getByRole("radiogroup", { name: radioFixtures.label });
    await expect(group).toHaveAttribute("aria-labelledby", label.id);
    await expect(group).toHaveAccessibleDescription(radioFixtures.help);
  },
};

/** The shared check of the two horizontal stories: the order of the DOM, and where each part sits. */
async function expectHorizontalRow(canvasElement: HTMLElement, withError: boolean) {
  const field = canvasElement.querySelector(".ds-field") as HTMLElement;
  await expect(field).toHaveAttribute("data-orientation", "horizontal");
  // DOM order: label, description, control, error (field-row-1).
  const order = Array.from(field.children).map((el) =>
    el.classList.contains("ds-field__label")
      ? "label"
      : el.classList.contains("ds-field__description")
        ? "description"
        : el.classList.contains("ds-field__error")
          ? "error"
          : "control",
  );
  await expect(order).toEqual(
    withError ? ["label", "description", "control", "error"] : ["label", "description", "control"],
  );
  const box = (selector: string) =>
    (field.querySelector(selector) as HTMLElement).getBoundingClientRect();
  const label = box(".ds-field__label");
  const description = box(".ds-field__description");
  const control = box(".ds-switch__track");
  // The control is at the inline end of the first line, centred on the label's line.
  await expect(control.left).toBeGreaterThanOrEqual(label.right);
  await expect(control.left).toBeGreaterThanOrEqual(description.right);
  await expect(
    Math.abs(control.top + control.height / 2 - (label.top + label.height / 2)),
  ).toBeLessThanOrEqual(1);
  await expect(control.right).toBeLessThanOrEqual(field.getBoundingClientRect().right);
  if (withError) {
    // The error sits under both columns and spans them.
    const error = box(".ds-field__error");
    await expect(error.top).toBeGreaterThanOrEqual(Math.max(description.bottom, control.bottom));
    await expect(Math.abs(error.left - label.left)).toBeLessThanOrEqual(0.5);
    await expect(Math.abs(error.right - control.right)).toBeLessThanOrEqual(0.5);
  }
}

/**
 * `orientation="horizontal"`: the label and description in one column, a Switch at the end of the
 * first line. The label keeps `for`, so a click on it toggles the switch (field-row-1). The row
 * needs a width, as a form column gives it.
 */
export const Horizontal: Story = {
  render: () => (
    <div className="w-[480px] max-w-full">
      <Field
        orientation="horizontal"
        label={switchFixtures.comments}
        description={switchFixtures.commentsHelp}
      >
        <Switch />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole("switch", { name: switchFixtures.comments });
    await expect(sw).toHaveAccessibleDescription(switchFixtures.commentsHelp);
    await expectHorizontalRow(canvasElement, false);
    await userEvent.click(canvas.getByText(switchFixtures.comments));
    await expect(sw).toHaveAttribute("aria-checked", "true");
  },
};

/** The error stays `Field`'s alert, under both columns, and the control reads it in its description. */
export const HorizontalInvalid: Story = {
  render: () => (
    <div className="w-[480px] max-w-full">
      <Field
        orientation="horizontal"
        label={switchFixtures.comments}
        description={switchFixtures.commentsHelp}
        error={switchFixtures.saveError}
      >
        <Switch />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole("switch", { name: switchFixtures.comments });
    await expect(sw).toHaveAttribute("aria-invalid", "true");
    await expect(sw).toHaveAccessibleDescription(
      `${switchFixtures.saveError} ${switchFixtures.commentsHelp}`,
    );
    await expect(canvas.getAllByRole("alert")).toHaveLength(1);
    await expectHorizontalRow(canvasElement, true);
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
