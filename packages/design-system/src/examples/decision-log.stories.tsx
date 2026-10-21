import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { fixtures } from "../components/fixtures";
import { Narrow, Under } from "../components/matrix";
import { DECISIONS, DecisionLog } from "./decision-log";

const meta = {
  title: "Examples/Application: Decision log",
  component: DecisionLog,
  parameters: {
    docs: {
      description: {
        component:
          "Application tier page example (E2-7): the airy bento (DESIGN.md §2) of Card metric tiles over a Table of decisions, Tabs as the filter, and the new-decision Dialog from the page's one primary action. Fixture content; the metrics are computed from the rows shown. Read `src/examples/decision-log.tsx` before composing an overview.",
      },
    },
  },
} satisfies Meta<typeof DecisionLog>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = () => within(document.body);
const REVIEW = DECISIONS.filter((d) => d.status === "review").length;

/** Three metric tiles computed from the rows, one primary, and the tab filters the table (AC 3). */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("article")).toHaveLength(3);
    await expect(canvas.getByText(String(DECISIONS.length))).toBeInTheDocument();
    await expect(canvas.getByText("80%")).toBeInTheDocument();
    await expect(canvasElement.querySelectorAll('.ds-button[data-variant="primary"]')).toHaveLength(
      1,
    );
    const rows = () => within(canvas.getByRole("table")).getAllByRole("row").length - 1;
    await expect(rows()).toBe(DECISIONS.length);
    await expect(within(canvas.getByRole("table")).getByText(fixtures.missingLabel)).toBeVisible();
    await userEvent.click(canvas.getByRole("tab", { name: "รอรีวิว" }));
    await waitFor(() => expect(rows()).toBe(REVIEW));
    await expect(canvas.getByRole("table", { name: "การตัดสินใจที่รอรีวิว" })).toBeInTheDocument();
  },
};

/** The dialog opens from the primary and receives focus; Escape returns it (AC 3). */
export const NewDecision: Story = {
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "บันทึกการตัดสินใจใหม่" });
    await userEvent.click(trigger);
    const dialog = await body().findByRole("dialog", { name: "บันทึกการตัดสินใจใหม่" });
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    await expect(within(dialog).getByLabelText(/การตัดสินใจ/)).toBeInstanceOf(HTMLInputElement);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(trigger).toHaveFocus();
  },
};

export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("table")).toHaveAttribute("aria-busy", "true");
  },
};

/** No rows: the metrics read zero and the table invites the first decision (AC 3). */
export const Empty: Story = {
  args: { rows: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("0%")).toBeInTheDocument();
    await expect(canvas.getByText("ยังไม่มีการตัดสินใจในมุมมองนี้")).toBeInTheDocument();
    await userEvent.click(
      within(canvas.getByRole("table")).getByRole("button", { name: "บันทึกการตัดสินใจใหม่" }),
    );
    await body().findByRole("dialog", { name: "บันทึกการตัดสินใจใหม่" });
  },
};

export const ErrorState: Story = {
  name: "Error",
  args: { error: "โหลดรายการไม่สำเร็จ เพราะการเชื่อมต่อขาด ลองอีกครั้ง" },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("alert")).toHaveTextContent("ลองอีกครั้ง");
  },
};

/** 360 px: the bento stacks, the table becomes blocks and its truncating column wraps, nothing scrolls sideways (AC 5). */
export const LongContentAt360: Story = {
  render: () => (
    <Narrow>
      <DecisionLog />
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.firstElementChild as HTMLElement;
    await expect(frame.scrollWidth).toBe(frame.clientWidth);
    const table = within(canvasElement).getByRole("table");
    await expect(getComputedStyle(table).display).toBe("block");
    // The bento stacks: the metric tiles sit one under another.
    const tiles = within(canvasElement).getAllByRole("article");
    await expect(tiles[1]?.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      tiles[0]?.getBoundingClientRect().bottom ?? Infinity,
    );
    // The truncating reason column wraps instead of cutting the reason off.
    const reason = table.querySelector("[data-truncate] > .ds-table__cell") as HTMLElement;
    await expect(reason.scrollWidth).toBeLessThanOrEqual(reason.clientWidth);
  },
};

/** The same page under a second recipe (DESIGN.md §11). The toolbar covers every other pair. */
export const Professional: Story = {
  render: () => (
    <Under profile="professional" mode="light">
      <DecisionLog />
    </Under>
  ),
};

export const FriendlyDark: Story = {
  render: () => (
    <Under profile="friendly" mode="dark">
      <DecisionLog />
    </Under>
  ),
};

export const Dark: Story = {
  render: () => (
    <Under profile="neutral" mode="dark">
      <DecisionLog />
    </Under>
  ),
};
