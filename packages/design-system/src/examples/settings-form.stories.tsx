import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Narrow, Under } from "../components/matrix";
import { SettingsForm } from "./settings-form";

const meta = {
  title: "Examples/Base: Settings form",
  component: SettingsForm,
  parameters: {
    docs: {
      description: {
        component:
          "Base tier page example (E2-7): Tabs, Field, Input, Textarea, Select, Checkbox, Popover, Tooltip and Button composed into a settings page. Fixture content; nothing is saved. Read `src/examples/settings-form.tsx` before composing a form.",
      },
    },
  },
} satisfies Meta<typeof SettingsForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const primaryButtons = (root: HTMLElement) =>
  root.querySelectorAll('.ds-button[data-variant="primary"]');

/** Every control is labelled, the panel is labelled by its tab, and the page has one primary action (AC 2). */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText(/ชื่อเวิร์กสเปซ/)).toBeInstanceOf(HTMLInputElement);
    await expect(canvas.getByLabelText("ลิงก์")).toBeInstanceOf(HTMLInputElement);
    await expect(canvas.getByLabelText("คำอธิบาย")).toBeInstanceOf(HTMLTextAreaElement);
    await expect(canvas.getByRole("combobox", { name: /Profile เริ่มต้น/ })).toBeInTheDocument();
    await expect(
      canvas.getByRole("checkbox", { name: "ส่งสรุปรายสัปดาห์ให้ทุกคนในเวิร์กสเปซ" }),
    ).toBeChecked();
    const tab = canvas.getByRole("tab", { name: "ทั่วไป" });
    await expect(canvas.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", tab.id);
    await expect(canvas.getByRole("button", { name: "คัดลอกลิงก์" })).toBeInTheDocument();
    await expect(primaryButtons(canvasElement)).toHaveLength(1);
  },
};

/** A failed save: each message sits on its field, says the fix, and is announced (AC 2). */
export const Invalid: Story = {
  args: {
    errors: {
      name: "ใส่ชื่อเวิร์กสเปซอย่างน้อย 3 ตัวอักษร",
      profile: "เลือก profile เริ่มต้นก่อนบันทึก",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("alert")).toHaveLength(2);
    await expect(canvas.getByLabelText(/ชื่อเวิร์กสเปซ/)).toHaveAttribute("aria-invalid", "true");
    await expect(canvas.getByRole("combobox", { name: /Profile เริ่มต้น/ })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  },
};

/** Saving: the primary is busy and announces, every control is disabled so nothing changes under the save (AC 2). */
export const Saving: Story = {
  args: { saving: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const save = canvas.getByRole("button", { name: /บันทึกการเปลี่ยนแปลง/ });
    await expect(save).toHaveAttribute("aria-busy", "true");
    await expect(canvas.getByRole("status")).toHaveTextContent("กำลังบันทึก");
    await expect(canvas.getByLabelText(/ชื่อเวิร์กสเปซ/)).toBeDisabled();
    await expect(canvas.getByLabelText("คำอธิบาย")).toBeDisabled();
    await expect(canvas.getByRole("combobox", { name: /Profile เริ่มต้น/ })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "ยกเลิก" })).toBeDisabled();
  },
};

/** 360 px: the form stacks, the actions wrap, nothing scrolls sideways (AC 5). */
export const LongContentAt360: Story = {
  render: () => (
    <Narrow>
      <SettingsForm errors={{ name: "ใส่ชื่อเวิร์กสเปซอย่างน้อย 3 ตัวอักษร" }} />
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.firstElementChild as HTMLElement;
    await expect(frame.scrollWidth).toBe(frame.clientWidth);
  },
};

/** The same page under a second recipe (DESIGN.md §11). The toolbar covers every other pair. */
export const Professional: Story = {
  render: () => (
    <Under profile="professional" mode="light">
      <SettingsForm errors={{ profile: "เลือก profile เริ่มต้นก่อนบันทึก" }} />
    </Under>
  ),
};

export const FriendlyDark: Story = {
  render: () => (
    <Under profile="friendly" mode="dark">
      <SettingsForm errors={{ profile: "เลือก profile เริ่มต้นก่อนบันทึก" }} />
    </Under>
  ),
};

export const Dark: Story = {
  render: () => (
    <Under profile="neutral" mode="dark">
      <SettingsForm errors={{ profile: "เลือก profile เริ่มต้นก่อนบันทึก" }} />
    </Under>
  ),
};
