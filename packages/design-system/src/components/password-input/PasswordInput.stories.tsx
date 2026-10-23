import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Field } from "../field/Field";
import { fixtures } from "../fixtures";
import { LockIcon } from "../icons";
import { Matrix, Narrow } from "../matrix";
import { PasswordInput } from "./PasswordInput";

const meta = {
  title: "Base/Password input",
  component: PasswordInput,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A password field with a reveal toggle (ORV-67), built on InputGroup. The toggle is a real button with aria-pressed, named for what pressing it does, and focus stays in the field.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Field label="รหัสผ่าน">
          <Story />
        </Field>
      </div>
    ),
  ],
  args: { defaultValue: "correct horse" },
} satisfies Meta<typeof PasswordInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Pressing the button toggles the type, the name and `aria-pressed`; focus stays in the field (AC 5). */
export const Reveal: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("รหัสผ่าน");
    await expect(input).toHaveAttribute("type", "password");
    const show = canvas.getByRole("button", { name: "แสดงรหัสผ่าน" });
    await expect(show).toHaveAttribute("aria-pressed", "false");
    await expect(show.tagName).toBe("BUTTON");
    input.focus();
    await userEvent.click(show);
    await expect(input).toHaveAttribute("type", "text");
    await expect(input).toHaveFocus();
    const hide = canvas.getByRole("button", { name: "ซ่อนรหัสผ่าน" });
    await expect(hide).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(hide);
    await expect(input).toHaveAttribute("type", "password");
    await expect(input).toHaveFocus();
    await expect(canvas.getByRole("button", { name: "แสดงรหัสผ่าน" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  },
};

/** Reached by keyboard: Tab from the field lands on the button, and Space reveals. */
export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("รหัสผ่าน");
    input.focus();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "แสดงรหัสผ่าน" })).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(input).toHaveAttribute("type", "text");
    await expect(canvas.getByRole("button", { name: "ซ่อนรหัสผ่าน" })).toHaveFocus();
  },
};

export const WithStartIcon: Story = {
  args: { start: <LockIcon /> },
};

export const Invalid: Story = {
  decorators: [],
  render: (args) => (
    <div className="max-w-md">
      <Field label="รหัสผ่าน" error="รหัสผ่านต้องยาวอย่างน้อย 12 ตัวอักษร">
        <PasswordInput {...args} defaultValue="short" />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByLabelText("รหัสผ่าน")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  },
};

/** Disabled disables the toggle with the field, including when the Field is the one that is disabled. */
export const Disabled: Story = {
  decorators: [],
  render: (args) => (
    <div className="max-w-md">
      <Field label="รหัสผ่าน" disabled>
        <PasswordInput {...args} />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText("รหัสผ่าน")).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "แสดงรหัสผ่าน" })).toBeDisabled();
  },
};

export const Sizes: Story = {
  decorators: [],
  render: (args) => (
    <div className="flex max-w-md flex-col gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Field key={size} label={size}>
          <PasswordInput {...args} size={size} />
        </Field>
      ))}
    </div>
  ),
};

export const At360: Story = {
  decorators: [],
  render: (args) => (
    <Narrow>
      <Field label={fixtures.longThai}>
        <PasswordInput {...args} defaultValue={fixtures.longThai} />
      </Field>
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector<HTMLElement>(".ds-input-group") as HTMLElement;
    await expect(group.scrollWidth).toBeLessThanOrEqual(group.clientWidth);
  },
};

export const RecipesAndModes: Story = {
  decorators: [],
  render: (args) => (
    <Matrix>
      <Field label="รหัสผ่าน">
        <PasswordInput {...args} />
      </Field>
      <Field label="ผิดพลาด" error="รหัสผ่านต้องยาวอย่างน้อย 12 ตัวอักษร">
        <PasswordInput {...args} defaultValue="short" />
      </Field>
      <Field label="ปิดใช้งาน" disabled>
        <PasswordInput {...args} />
      </Field>
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll("[data-matrix-cell]")).toHaveLength(6);
    await expect(canvasElement.querySelectorAll(".ds-input-group")).toHaveLength(6 * 3);
  },
};
