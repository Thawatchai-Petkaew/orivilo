import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Narrow, Under } from "../components/matrix";
import { MEMBERS, MembersScreen } from "./members";

const meta = {
  title: "Examples/Application: Members (agent)",
  component: MembersScreen,
  parameters: {
    docs: {
      description: {
        component:
          "A builder agent (model claude-sonnet-5-5) composed this screen from the public entry in one run. All data is sample data: no invitation or email is sent and nothing is saved.",
      },
    },
  },
} satisfies Meta<typeof MembersScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

const TITLE = "ทีมออกแบบ Brand Canvas";
const NO_DATA = "ไม่มีข้อมูล";
const EMAIL_HINT = "ใส่อีเมลก่อนเชิญ เช่น name@example.com";
const INVITE = "เชิญสมาชิก";

const body = () => within(document.body);
const countLine = (active: number, invited: number) =>
  `สมาชิก ${active} คน, รอตอบรับ ${invited} คน`;
const countOf = (state: "active" | "invited") =>
  MEMBERS.filter((member) => member.state === state).length;
const invitedMessage = (email: string) => `เชิญ ${email} แล้ว เป็นข้อมูลตัวอย่าง ไม่ได้ส่งจริง`;
const rowsOf = (root: HTMLElement) => Array.from(root.querySelectorAll("tbody > tr"));
const firstRow = (root: HTMLElement) => rowsOf(root)[0];

function memberAt(index: number) {
  const member = MEMBERS[index];
  if (!member) throw new Error(`MEMBERS has no entry at ${index}`);
  return member;
}

function rowOf(root: HTMLElement, name: string) {
  const row = rowsOf(root).find((candidate) => candidate.textContent?.includes(name));
  if (!row) throw new Error(`no row holds ${name}`);
  return row;
}

/** Opens the actions of one person and waits for the menu. */
async function openActions(canvasElement: HTMLElement, name: string) {
  await userEvent.click(within(canvasElement).getByRole("button", { name: `จัดการ ${name}` }));
  return body().findByRole("menu");
}

/** Six people with the five facts, the long name inside its row, one primary action, the counts and the sample note (rows 1). */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: TITLE })).toBeVisible();
    await expect(canvas.getByText(countLine(countOf("active"), countOf("invited")))).toBeVisible();
    await expect(canvas.getByText("ข้อมูลตัวอย่าง ไม่มีการบันทึกหรือส่งจริง")).toBeVisible();

    const rows = rowsOf(canvasElement);
    await expect(rows).toHaveLength(MEMBERS.length);
    for (const [index, row] of rows.entries()) {
      const member = memberAt(index);
      await expect(row).toHaveTextContent(member.name);
      if (member.email) await expect(row).toHaveTextContent(member.email);
    }

    const table = canvas.getByRole("table");
    await expect(within(table).getAllByText(NO_DATA)).toHaveLength(
      MEMBERS.filter((member) => !member.email).length,
    );

    const long = MEMBERS.findIndex(
      (member) => member.name.length > 24 && !member.name.includes(" "),
    );
    const longRow = rows[long];
    await expect(long).toBeGreaterThanOrEqual(0);
    await expect(
      within(table).getByText(memberAt(long).name).getBoundingClientRect().right,
    ).toBeLessThanOrEqual(longRow?.getBoundingClientRect().right ?? 0);

    await expect(canvasElement.querySelectorAll('[data-variant="primary"]')).toHaveLength(1);
  },
};

/** Ordered by date, then by name, then only the invited choice: three choices in sight, counts unchanged (row 2). */
export const FilterInvited: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("radiogroup", { name: "สถานะ" });
    await expect(within(group).getAllByRole("radio")).toHaveLength(3);
    for (const name of ["ทั้งหมด", "ใช้งานอยู่", "รอตอบรับ"]) {
      await expect(within(group).getByRole("radio", { name })).toBeVisible();
    }

    const byDate = [...MEMBERS].sort((a, b) => a.joined.localeCompare(b.joined));
    await userEvent.click(canvas.getByRole("button", { name: "วันที่เข้าร่วม" }));
    await expect(firstRow(canvasElement)).toHaveTextContent(byDate[0]?.name ?? "");

    await userEvent.click(canvas.getByRole("button", { name: "ชื่อ" }));
    await expect(firstRow(canvasElement)).not.toHaveTextContent(byDate[0]?.name ?? "");

    await userEvent.click(within(group).getByRole("radio", { name: "รอตอบรับ" }));
    const invited = MEMBERS.filter((member) => member.state === "invited");
    const rows = rowsOf(canvasElement);
    await expect(rows).toHaveLength(invited.length);
    for (const row of rows) await expect(row).toHaveTextContent("รอตอบรับ");
    await expect(canvas.getByText(countLine(countOf("active"), countOf("invited")))).toBeVisible();
  },
};

/** An empty email, one with no @, then a valid one with the copy choice off, then on: the error, pending, the new first row, the status text (row 3). */
export const InviteMember: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const active = countOf("active");
    const invited = countOf("invited");

    await userEvent.click(canvas.getByRole("button", { name: INVITE }));
    let dialog = await body().findByRole("dialog", { name: INVITE });
    const submit = within(dialog).getByRole("button", { name: INVITE });
    await userEvent.click(submit);
    await expect(within(dialog).getByRole("alert")).toHaveTextContent(EMAIL_HINT);
    await expect(rowsOf(canvasElement)).toHaveLength(MEMBERS.length);

    const email = within(dialog).getByLabelText(/อีเมล/);
    await userEvent.type(email, "nobody");
    await userEvent.click(submit);
    await expect(within(dialog).getByRole("alert")).toHaveTextContent(EMAIL_HINT);
    await expect(rowsOf(canvasElement)).toHaveLength(MEMBERS.length);

    await userEvent.clear(email);
    await userEvent.type(email, "new.person@example.com");
    await userEvent.click(submit);
    await expect(submit).toHaveAttribute("aria-busy", "true");
    await expect(dialog).toHaveAttribute("aria-busy", "true");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(rowsOf(canvasElement)).toHaveLength(MEMBERS.length + 1);
    await expect(firstRow(canvasElement)).toHaveTextContent("new.person@example.com");
    await expect(firstRow(canvasElement)).toHaveTextContent("รอตอบรับ");
    await expect(firstRow(canvasElement)).toHaveTextContent("2026-11-06");
    await expect(canvas.getByText(countLine(active, invited + 1))).toBeVisible();
    await expect(canvas.getByText(invitedMessage("new.person@example.com"))).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: INVITE }));
    dialog = await body().findByRole("dialog", { name: INVITE });
    await userEvent.type(within(dialog).getByLabelText(/อีเมล/), "copy.me@example.com");
    await userEvent.click(within(dialog).getByRole("checkbox", { name: "ส่งสำเนาให้ฉันด้วย" }));
    await userEvent.click(within(dialog).getByRole("button", { name: INVITE }));
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(rowsOf(canvasElement)).toHaveLength(MEMBERS.length + 2);
    await expect(firstRow(canvasElement)).toHaveTextContent("copy.me@example.com");
    await expect(canvas.getByText(countLine(active, invited + 2))).toBeVisible();
    await expect(
      canvas.getByText(`${invitedMessage("copy.me@example.com")} สำเนาก็ไม่ได้ส่งเช่นกัน`),
    ).toBeVisible();
  },
};

/** Make admin, then remove: cancel first, then confirm; the menu order, the role word, the consequence, the announcement (row 4). */
export const RemoveMember: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const target = MEMBERS.find(
      (member) => member.role !== "admin" && member.role !== "owner" && member.state === "active",
    );
    if (!target) throw new Error("MEMBERS has no person who is not admin");
    const { name } = target;
    const closed = () => waitFor(() => expect(body().queryByRole("menu")).toBeNull());
    const gone = () => waitFor(() => expect(body().queryByRole("dialog")).toBeNull());

    let menu = await openActions(canvasElement, name);
    const items = within(menu).getAllByRole("menuitem");
    await expect(items.map((item) => item.textContent)).toEqual(["ตั้งเป็นผู้ดูแล", "นำออก"]);
    await expect(items[1]).toHaveAttribute("data-destructive");
    await expect(items[0]).not.toHaveAttribute("data-destructive");
    await userEvent.click(items[0] ?? menu);
    await closed();
    await expect(rowOf(canvasElement, name)).toHaveTextContent("ผู้ดูแล");

    menu = await openActions(canvasElement, name);
    await userEvent.click(within(menu).getByRole("menuitem", { name: "นำออก" }));
    let dialog = await body().findByRole("dialog", { name: `นำ ${name} ออกจากเวิร์กสเปซ` });
    await expect(dialog).toHaveTextContent(
      `${name} จะเข้าเวิร์กสเปซนี้ไม่ได้อีก และต้องเชิญใหม่หากจะกลับมา`,
    );
    await userEvent.click(within(dialog).getByRole("button", { name: "ยกเลิก" }));
    await gone();
    await expect(rowsOf(canvasElement)).toHaveLength(MEMBERS.length);
    await expect(rowOf(canvasElement, name)).toHaveTextContent("ผู้ดูแล");

    menu = await openActions(canvasElement, name);
    await userEvent.click(within(menu).getByRole("menuitem", { name: "นำออก" }));
    dialog = await body().findByRole("dialog", { name: `นำ ${name} ออกจากเวิร์กสเปซ` });
    await userEvent.click(within(dialog).getByRole("button", { name: "นำออก" }));
    await gone();
    await expect(rowsOf(canvasElement)).toHaveLength(MEMBERS.length - 1);
    await expect(canvasElement.textContent ?? "").not.toContain(`จัดการ ${name}`);
    await expect(canvas.getByText(`นำ ${name} ออกแล้ว`)).toBeVisible();
  },
};

/** 360 px: the header stacks, the table becomes blocks, nothing scrolls sideways (row 5). */
export const At360: Story = {
  render: () => (
    <Narrow>
      <MembersScreen />
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    // The story's outer wrappers are as wide as the viewport; the frame is every ancestor 360 px wide.
    const table = within(canvasElement).getByRole("table");
    const frames: HTMLElement[] = [];
    for (let up = table.parentElement; up && canvasElement.contains(up); up = up.parentElement) {
      if (Math.round(up.getBoundingClientRect().width) === 360) frames.push(up);
    }
    await expect(frames.length).toBeGreaterThan(1);
    for (const frame of frames) await expect(frame.scrollWidth).toBe(frame.clientWidth);
    await expect(getComputedStyle(table).display).toBe("block");
  },
};

/** The screen under the Friendly profile in dark mode, checked by the a11y addon (row 5). */
export const FriendlyDark: Story = {
  render: () => (
    <Under profile="friendly" mode="dark">
      <MembersScreen />
    </Under>
  ),
  play: async ({ canvasElement }) => {
    const boundary = canvasElement.querySelector("[data-matrix-profile]");
    await expect(boundary).toHaveAttribute("data-matrix-profile", "friendly");
    await expect(within(canvasElement).getByRole("heading", { name: TITLE })).toBeVisible();
  },
};
