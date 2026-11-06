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

    const order = canvas.getByRole("radiogroup", { name: "เรียงตาม" });
    await expect(within(order).getAllByRole("radio")).toHaveLength(2);
    const byDate = [...MEMBERS].sort((a, b) => a.joined.localeCompare(b.joined));
    const byName = [...MEMBERS].sort((a, b) => a.name.localeCompare(b.name, "th"));
    const start = memberAt(0).name;
    // The sample rows start in neither order, so a choice that leaves them as they came is seen.
    await expect(start).not.toBe(byDate[0]?.name);
    await expect(start).not.toBe(byName[0]?.name);
    await expect(firstRow(canvasElement)).toHaveTextContent(start);

    await userEvent.click(within(order).getByRole("radio", { name: "วันที่เข้าร่วม" }));
    await waitFor(() => expect(firstRow(canvasElement)).toHaveTextContent(byDate[0]?.name ?? ""));
    await expect(firstRow(canvasElement)).not.toHaveTextContent(start);

    await userEvent.click(within(order).getByRole("radio", { name: "ชื่อ" }));
    await waitFor(() => expect(firstRow(canvasElement)).toHaveTextContent(byName[0]?.name ?? ""));
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

/** Make admin, then remove: cancel, Escape, then confirm; the menu order, the role word, the consequence, where focus lands, who is gone, the announcement (row 4). */
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

    const menu = await openActions(canvasElement, name);
    const items = within(menu).getAllByRole("menuitem");
    await expect(items.map((item) => item.textContent)).toEqual(["ตั้งเป็นผู้ดูแล", "นำออก"]);
    await expect(items[1]).toHaveAttribute("data-destructive");
    await expect(items[0]).not.toHaveAttribute("data-destructive");
    await userEvent.click(items[0] ?? menu);
    await closed();
    await expect(rowOf(canvasElement, name)).toHaveTextContent("ผู้ดูแล");

    const control = () => canvas.getByRole("button", { name: `จัดการ ${name}` });
    const focusIs = (element: () => HTMLElement) =>
      waitFor(() => {
        expect(document.body).not.toHaveFocus();
        expect(element()).toHaveFocus();
      });
    const askRemove = async () => {
      const opened = await openActions(canvasElement, name);
      await userEvent.click(within(opened).getByRole("menuitem", { name: "นำออก" }));
      return body().findByRole("dialog", { name: `นำ ${name} ออกจากเวิร์กสเปซ` });
    };

    let dialog = await askRemove();
    await expect(dialog).toHaveTextContent(
      `${name} จะเข้าเวิร์กสเปซนี้ไม่ได้อีก และต้องเชิญใหม่หากจะกลับมา`,
    );
    await userEvent.click(within(dialog).getByRole("button", { name: "ยกเลิก" }));
    await gone();
    await expect(rowsOf(canvasElement)).toHaveLength(MEMBERS.length);
    await expect(rowOf(canvasElement, name)).toHaveTextContent("ผู้ดูแล");
    await focusIs(control);

    dialog = await askRemove();
    await userEvent.keyboard("{Escape}");
    await gone();
    await expect(rowsOf(canvasElement)).toHaveLength(MEMBERS.length);
    await expect(rowOf(canvasElement, name)).toHaveTextContent("ผู้ดูแล");
    await focusIs(control);

    dialog = await askRemove();
    await userEvent.click(within(dialog).getByRole("button", { name: "นำออก" }));
    await gone();
    await expect(rowsOf(canvasElement)).toHaveLength(MEMBERS.length - 1);
    // The name lives in a row's name cell, so the rows tell who is gone; the page text holds c-15 too.
    await expect(rowsOf(canvasElement).some((row) => row.textContent?.includes(name))).toBe(false);
    await expect(canvas.queryByRole("button", { name: `จัดการ ${name}` })).toBeNull();
    for (const member of MEMBERS.filter((other) => other.id !== target.id)) {
      await expect(rowOf(canvasElement, member.name)).toBeInTheDocument();
    }
    await expect(canvas.getByText(`นำ ${name} ออกแล้ว`)).toBeVisible();
    await focusIs(() => canvas.getByRole("button", { name: INVITE }));
  },
};

/** An address with no space and no hyphen, so no line can break inside it (N9). */
const LONG_ADDRESS = `${"a".repeat(64)}@example.com`;

/** The frame is every ancestor of the table that is 360 px wide; none may scroll sideways. */
function framesOf(canvasElement: HTMLElement) {
  const table = within(canvasElement).getByRole("table");
  const frames: HTMLElement[] = [];
  for (let up = table.parentElement; up && canvasElement.contains(up); up = up.parentElement) {
    if (Math.round(up.getBoundingClientRect().width) === 360) frames.push(up);
  }
  return frames;
}

async function expectNoSideScroll(canvasElement: HTMLElement) {
  const frames = framesOf(canvasElement);
  await expect(frames.length).toBeGreaterThan(1);
  for (const frame of frames) await expect(frame.scrollWidth).toBe(frame.clientWidth);
}

/**
 * Every keyboard stop inside the screen is drawn: a box wider and taller than a pixel, inside the
 * 360 px frame, matching :focus-visible, with its centre not clipped away. Returns what each stop is called.
 */
async function expectDrawnStops(canvasElement: HTMLElement) {
  const frame = framesOf(canvasElement)[0];
  if (!frame) throw new Error("no 360 px frame");
  const box = frame.getBoundingClientRect();
  const names: string[] = [];
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  for (let stop = 0; stop < 30; stop += 1) {
    await userEvent.tab();
    const el = document.activeElement;
    if (!(el instanceof HTMLElement) || !canvasElement.contains(el)) break;
    const rect = el.getBoundingClientRect();
    await expect(rect.width).toBeGreaterThan(8);
    await expect(rect.height).toBeGreaterThan(8);
    await expect(rect.left).toBeGreaterThanOrEqual(box.left);
    await expect(rect.right).toBeLessThanOrEqual(box.right);
    await expect(el.matches(":focus-visible")).toBe(true);
    // A stop clipped away by an ancestor has a box but no pixels: the point at its centre hits something else.
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    await expect(el.contains(hit)).toBe(true);
    names.push(el.getAttribute("aria-label") ?? el.textContent ?? "");
  }
  return names;
}

/** 360 px: the header stacks, the table becomes blocks, nothing scrolls sideways, before and after a long address is invited (row 5). */
export const At360: Story = {
  render: () => (
    <Narrow>
      <MembersScreen />
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectNoSideScroll(canvasElement);
    await expect(getComputedStyle(canvas.getByRole("table")).display).toBe("block");

    // The order by name and by date is in sight and reachable, and no stop is hidden (N2).
    const order = canvas.getByRole("radiogroup", { name: "เรียงตาม" });
    for (const name of ["ชื่อ", "วันที่เข้าร่วม"]) {
      const radio = within(order).getByRole("radio", { name });
      await expect(radio).toBeVisible();
      await expect(radio.getBoundingClientRect().right).toBeLessThanOrEqual(
        framesOf(canvasElement)[0]?.getBoundingClientRect().right ?? 0,
      );
    }
    const stops = await expectDrawnStops(canvasElement);
    await expect(stops.slice(0, 3)).toEqual([INVITE, "ทั้งหมด", "ชื่อ"]);
    await expect(stops.slice(3)).toEqual(MEMBERS.map((member) => `จัดการ ${member.name}`));

    await userEvent.click(canvas.getByRole("button", { name: INVITE }));
    const dialog = await body().findByRole("dialog", { name: INVITE });
    await userEvent.type(within(dialog).getByLabelText(/อีเมล/), LONG_ADDRESS);
    await userEvent.click(within(dialog).getByRole("button", { name: INVITE }));
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(firstRow(canvasElement)).toHaveTextContent(LONG_ADDRESS));
    await expect(canvas.getByText(invitedMessage(LONG_ADDRESS))).toBeVisible();
    await expectNoSideScroll(canvasElement);
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
