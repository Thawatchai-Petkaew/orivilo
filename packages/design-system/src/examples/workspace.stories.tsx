import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import type { ProfileId } from "../boundary/DesignProfileBoundary";
import { fixtures } from "../components/fixtures";
import { Narrow, Under } from "../components/matrix";
import { PROJECTS, WorkspaceScreen } from "./workspace";

const meta = {
  title: "Examples/Application: Workspace (reference)",
  component: WorkspaceScreen,
  args: { latency: 150 },
  parameters: {
    docs: {
      description: {
        component:
          "The reference screen (handoff §19, E2-8): a team workspace with project creation, composed from the public components only and rendered by the app at /workspace. Fixture data that the screen labels as such; creation and archive change the screen's own state with a short simulated delay.",
      },
    },
  },
} satisfies Meta<typeof WorkspaceScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = () => within(document.body);
const rowCount = (root: HTMLElement) =>
  within(within(root).getByRole("table")).getAllByRole("row").length - 1;

/** Six fixture projects, the long name inside its cell, one missing owner, one primary, the fixture label (AC 1, 2). */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(rowCount(canvasElement)).toBe(PROJECTS.length);
    const table = canvas.getByRole("table", { name: "โปรเจกต์ในเวิร์กสเปซ" });
    await expect(within(table).getAllByText(fixtures.missingLabel)).toHaveLength(1);
    const long = within(table).getByText(fixtures.longThai);
    await expect(long.getBoundingClientRect().right).toBeLessThanOrEqual(
      table.getBoundingClientRect().right,
    );
    await expect(canvasElement.querySelectorAll('.ds-button[data-variant="primary"]')).toHaveLength(
      1,
    );
    await expect(canvas.getByText("ข้อมูลตัวอย่าง")).toBeVisible();
    await expect(canvas.getByText(`${PROJECTS.length} โปรเจกต์, สมาชิก 4 คน`)).toBeVisible();
  },
};

/** Empty name, a duplicate name, then a new name: field error, dialog error, pending, the new row first (AC 3, 4, 5). */
export const CreateProject: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "สร้างโปรเจกต์" }));
    const dialog = await body().findByRole("dialog", { name: "สร้างโปรเจกต์" });
    const create = within(dialog).getByRole("button", { name: "สร้าง" });
    await userEvent.click(create);
    await expect(within(dialog).getByRole("alert")).toHaveTextContent("ใส่ชื่อโปรเจกต์ก่อนสร้าง");
    const name = within(dialog).getByLabelText(/ชื่อโปรเจกต์/);
    await userEvent.type(name, fixtures.mixed);
    await userEvent.click(create);
    await waitFor(() =>
      expect(within(dialog).getByRole("alert")).toHaveTextContent("มีโปรเจกต์ชื่อนี้อยู่แล้ว"),
    );
    await expect(dialog).toBeVisible();
    await userEvent.clear(name);
    await userEvent.type(name, "แอปสั่งอาหาร Lumen");
    await userEvent.click(create);
    await expect(create).toHaveAttribute("aria-busy", "true");
    await expect(dialog).toHaveAttribute("aria-busy", "true");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(rowCount(canvasElement)).toBe(PROJECTS.length + 1);
    const firstRow = within(canvas.getByRole("table")).getAllByRole("row")[1];
    await expect(firstRow).toHaveTextContent("แอปสั่งอาหาร Lumen");
    await expect(firstRow).toHaveTextContent("ฉบับร่าง");
    await expect(canvas.getByText("สร้างโปรเจกต์ แอปสั่งอาหาร Lumen แล้ว")).toBeInTheDocument();
    await expect(canvas.getByText(`${PROJECTS.length + 1} โปรเจกต์, สมาชิก 4 คน`)).toBeVisible();
  },
};

/** Two rows selected show the bar; the destructive confirm removes them and announces it (AC 6). */
export const ArchiveSelected: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("button", { name: "เก็บถาวร" })).toBeNull();
    for (const row of [PROJECTS[4], PROJECTS[5]]) {
      await userEvent.click(canvas.getByRole("checkbox", { name: `เลือก ${row?.name ?? ""}` }));
    }
    await expect(canvas.getByText("เลือกอยู่ 2 โปรเจกต์")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "เก็บถาวร" }));
    const dialog = await body().findByRole("dialog", { name: "เก็บถาวร 2 โปรเจกต์" });
    await userEvent.click(within(dialog).getByRole("button", { name: "เก็บถาวร" }));
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(rowCount(canvasElement)).toBe(PROJECTS.length - 2);
    await expect(canvas.getByText("เก็บถาวร 2 โปรเจกต์แล้ว")).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "เก็บถาวร" })).toBeNull();
  },
};

export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("table")).toHaveAttribute("aria-busy", "true");
  },
};

/** The error row says what went wrong and how to fix it; the action shows the rows again (AC 7). */
export const LoadError: Story = {
  args: { loadError: "โหลดรายการโปรเจกต์ไม่สำเร็จ เพราะการเชื่อมต่อขาด ลองอีกครั้ง" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole("alert");
    await expect(alert).toHaveTextContent("โหลดรายการโปรเจกต์ไม่สำเร็จ");
    await userEvent.click(within(alert).getByRole("button", { name: "ลองอีกครั้ง" }));
    await expect(canvas.queryByRole("alert")).toBeNull();
    await expect(rowCount(canvasElement)).toBe(PROJECTS.length);
  },
};

/** 360 px: the header stacks, the table becomes blocks, nothing scrolls sideways (AC 8). */
export const LongContentAt360: Story = {
  render: (args) => (
    <Narrow>
      <WorkspaceScreen {...args} />
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.firstElementChild as HTMLElement;
    await expect(frame.scrollWidth).toBe(frame.clientWidth);
    const table = within(canvasElement).getByRole("table");
    await expect(getComputedStyle(table).display).toBe("block");
    await userEvent.click(within(canvasElement).getByRole("button", { name: "สร้างโปรเจกต์" }));
    const dialog = await body().findByRole("dialog", { name: "สร้างโปรเจกต์" });
    await expect(dialog.getBoundingClientRect().width).toBeLessThanOrEqual(window.innerWidth);
  },
};

/** The create dialog carries the screen's profile through the portal, not the shell's (AC 9). */
function underProfile(profile: ProfileId): NonNullable<Story["play"]> {
  return async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "สร้างโปรเจกต์" });
    await userEvent.click(trigger);
    const dialog = await body().findByRole("dialog", { name: "สร้างโปรเจกต์" });
    const scope = dialog.closest<HTMLElement>("[data-design-profile]");
    await expect(scope?.dataset["designProfile"]).toBe(profile);
    const read = (el: Element) =>
      getComputedStyle(el).getPropertyValue("--ds-action-primary").trim();
    await expect(read(dialog)).toBe(read(trigger));
  };
}

export const Professional: Story = {
  render: (args) => (
    <Under profile="professional" mode="light">
      <WorkspaceScreen {...args} />
    </Under>
  ),
  play: underProfile("professional"),
};

export const FriendlyDark: Story = {
  render: (args) => (
    <Under profile="friendly" mode="dark">
      <WorkspaceScreen {...args} />
    </Under>
  ),
  play: underProfile("friendly"),
};

export const Dark: Story = {
  render: (args) => (
    <Under profile="neutral" mode="dark">
      <WorkspaceScreen {...args} />
    </Under>
  ),
};
