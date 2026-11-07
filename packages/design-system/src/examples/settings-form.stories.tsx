import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { fixtures, radioFixtures, switchFixtures } from "../components/fixtures";
import { Narrow, Under } from "../components/matrix";
import { SettingsForm } from "./settings-form";

const meta = {
  title: "Examples/Base: Settings form",
  component: SettingsForm,
  parameters: {
    docs: {
      description: {
        component:
          "Base tier page example (E2-7): Tabs, Field, Input, Textarea, Select, RadioGroup, Switch, Checkbox, Popover, Tooltip and Button composed into a settings page. Fixture content; nothing is saved. Read `src/examples/settings-form.tsx` before composing a form.",
      },
    },
  },
} satisfies Meta<typeof SettingsForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const primaryButtons = (root: HTMLElement) =>
  root.querySelectorAll('.ds-button[data-variant="primary"]');

/** One page header per screen: its own root, no header element or banner, one level 1 heading (ORV-225 AC 9). */
async function expectOnePageHeader(root: HTMLElement) {
  await expect(root.querySelectorAll(".ds-page-header")).toHaveLength(1);
  await expect(root.querySelector("header")).toBeNull();
  await expect(within(root).queryByRole("banner")).toBeNull();
  await expect(within(root).getAllByRole("heading", { level: 1 })).toHaveLength(1);
}

/** Every control is labelled, the panel is labelled by its tab, and the page has one primary action (AC 2). */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectOnePageHeader(canvasElement);
    await expect(canvas.getByLabelText(/ชื่อเวิร์กสเปซ/)).toBeInstanceOf(HTMLInputElement);
    await expect(canvas.getByLabelText("ลิงก์")).toBeInstanceOf(HTMLInputElement);
    await expect(canvas.getByLabelText("คำอธิบาย")).toBeInstanceOf(HTMLTextAreaElement);
    await expect(canvas.getByRole("combobox", { name: /Profile เริ่มต้น/ })).toBeInTheDocument();
    await expect(
      canvas.getByRole("checkbox", { name: "ส่งสรุปรายสัปดาห์ให้ทุกคนในเวิร์กสเปซ" }),
    ).toBeChecked();
    await expect(canvas.getByRole("radiogroup", { name: radioFixtures.label })).toBeInTheDocument();
    await expect(canvas.getAllByRole("radio")).toHaveLength(3);
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
      access: radioFixtures.error,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("alert")).toHaveLength(3);
    await expect(canvas.getByRole("radiogroup", { name: radioFixtures.label })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
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
    for (const radio of canvas.getAllByRole("radio")) await expect(radio).toBeDisabled();
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

/** Opens the notifications tab and returns its panel. */
async function openNotifications(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole("tab", { name: "การแจ้งเตือน" }));
  return canvas.getByRole("tabpanel");
}

/**
 * The notifications tab: a group named by its heading, the help line, and two switch rows that
 * apply at once. Fixture content: each flips locally and nothing is saved (settings-example-1).
 */
export const Notifications: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await userEvent.click(page.getByRole("tab", { name: "สมาชิก" }));
    await expect(primaryButtons(canvasElement)).toHaveLength(0);
    await expect(page.queryByRole("button", { name: "ยกเลิก" })).toBeNull();
    const panel = within(await openNotifications(canvasElement));
    await expect(primaryButtons(canvasElement)).toHaveLength(0);
    await expect(page.queryByRole("button", { name: "ยกเลิก" })).toBeNull();
    const group = panel.getByRole("group", { name: switchFixtures.setLabel });
    await expect(panel.getByText(switchFixtures.setHelp)).toBeVisible();
    await expect(panel.queryByText(fixtures.missingLabel)).toBeNull();
    const switches = within(group).getAllByRole("switch");
    await expect(switches).toHaveLength(2);
    const comments = within(group).getByRole("switch", { name: switchFixtures.comments });
    await expect(comments).toHaveAccessibleDescription(switchFixtures.commentsHelp);
    await expect(comments).toHaveAttribute("aria-checked", "true");
    await userEvent.click(within(group).getByText(switchFixtures.comments));
    await expect(comments).toHaveAttribute("aria-checked", "false");
    await expect(within(group).getByRole("switch", { name: switchFixtures.jobs })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  },
};

/** 360 px: the rows keep their switch at the end of the first line and nothing scrolls sideways. */
export const NotificationsAt360: Story = {
  render: () => (
    <Narrow>
      <SettingsForm />
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.firstElementChild as HTMLElement;
    const panel = await openNotifications(canvasElement);
    await expect(frame.scrollWidth).toBe(frame.clientWidth);
    for (const sw of within(panel).getAllByRole("switch")) {
      await expect(sw.getBoundingClientRect().right).toBeLessThanOrEqual(
        frame.getBoundingClientRect().right,
      );
    }
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
