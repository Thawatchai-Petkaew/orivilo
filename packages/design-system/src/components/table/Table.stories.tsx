import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Badge } from "../badge/Badge";
import { Button } from "../button/Button";
import { fixtures } from "../fixtures";
import { Matrix, Narrow } from "../matrix";
import { Table, type TableColumn, type TableProps, type TableSort } from "./Table";

/** The generic Table bound to the fixture row type, so Storybook infers typed args. */
function ProjectTable(props: TableProps<Project>) {
  return <Table {...props} />;
}

interface Project {
  id: string;
  name: string;
  owner: string | undefined;
  status: "draft" | "review" | "approved";
  decisions: number;
  updated: string;
}

/** Thai, Latin, a long Thai name without spaces, and a missing owner (DESIGN.md §4). */
const projects: readonly Project[] = [
  {
    id: "canvas",
    name: fixtures.mixed,
    owner: "วรรณา",
    status: "review",
    decisions: 128,
    updated: "2026-10-21",
  },
  {
    id: "long",
    name: fixtures.longThai,
    owner: "Priya N.",
    status: "draft",
    decisions: 7,
    updated: "2026-10-19",
  },
  {
    id: "latin",
    name: fixtures.longLatin,
    owner: fixtures.missing,
    status: "approved",
    decisions: 1043,
    updated: "2026-09-30",
  },
  {
    id: "thai",
    name: fixtures.thai,
    owner: "กมล",
    status: "approved",
    decisions: 0,
    updated: "2026-08-02",
  },
];

const STATUS_LABEL: Record<Project["status"], string> = {
  draft: "ฉบับร่าง",
  review: "รอรีวิว",
  approved: "อนุมัติแล้ว",
};
const STATUS_VARIANT = { draft: "neutral", review: "warning", approved: "success" } as const;

const columns: readonly TableColumn<Project>[] = [
  { key: "name", header: "โปรเจกต์", sortable: true },
  { key: "owner", header: "เจ้าของ", sortable: true },
  {
    key: "status",
    header: "สถานะ",
    cell: (row) => <Badge variant={STATUS_VARIANT[row.status]}>{STATUS_LABEL[row.status]}</Badge>,
  },
  { key: "decisions", header: "การตัดสินใจ", numeric: true, sortable: true },
  { key: "updated", header: "แก้ไขล่าสุด", numeric: true, sortable: true },
];

const meta = {
  title: "Application/Table",
  component: ProjectTable,
  parameters: { layout: "padded" },
  args: {
    caption: "โปรเจกต์ในเวิร์กสเปซ",
    columns,
    rows: projects,
    rowKey: (row: Project) => row.id,
    rowLabel: (row: Project) => `เลือก ${row.name}`,
  },
} satisfies Meta<typeof ProjectTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Thai and Latin rows, a long name that wraps, a missing owner that says so, numbers end-aligned in mono (AC 2). */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole("table", { name: "โปรเจกต์ในเวิร์กสเปซ" });
    await expect(within(table).getAllByText(fixtures.missingLabel)).toHaveLength(1);
    const long = within(table).getByText(fixtures.longThai);
    await expect(long.getBoundingClientRect().right).toBeLessThanOrEqual(
      table.getBoundingClientRect().right,
    );
  },
};

export const Compact: Story = { args: { density: "compact" } };

/** Clicking a header sorts, the second click reverses, and the sort is announced (AC 3). */
export const Sortable: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvas.getByRole("columnheader", { name: "การตัดสินใจ" });
    const button = within(header).getByRole("button");
    await userEvent.click(button);
    await expect(header).toHaveAttribute("aria-sort", "ascending");
    const firstCell = () =>
      canvas.getAllByRole("row")[1]?.querySelector("[data-numeric]")?.textContent;
    await expect(firstCell()).toBe("0");
    await expect(canvas.getByText("เรียงตาม การตัดสินใจ จากน้อยไปมาก")).toBeInTheDocument();
    await userEvent.click(button);
    await expect(header).toHaveAttribute("aria-sort", "descending");
    await expect(firstCell()).toBe("1043");
    await expect(canvas.getByText("เรียงตาม การตัดสินใจ จากมากไปน้อย")).toBeInTheDocument();
    // A missing value sorts last in both directions.
    const owner = within(canvas.getByRole("columnheader", { name: "เจ้าของ" })).getByRole("button");
    const lastOwner = () =>
      canvas.getAllByRole("row").at(-1)?.querySelector('[data-label="เจ้าของ"]')?.textContent;
    await userEvent.click(owner);
    await expect(lastOwner()).toBe(fixtures.missingLabel);
    await userEvent.click(owner);
    await expect(lastOwner()).toBe(fixtures.missingLabel);
  },
};

function ControlledSort() {
  const [sort, setSort] = useState<TableSort | null>({ key: "name", direction: "ascending" });
  return (
    <Table
      caption={`โปรเจกต์ในเวิร์กสเปซ, เรียงตาม ${sort?.key ?? "ไม่ได้เรียง"}`}
      columns={columns}
      rows={projects}
      rowKey={(row) => row.id}
      sort={sort}
      onSortChange={setSort}
    />
  );
}

/** The caller owns the sort; the table only asks for the next one. */
export const ControlledSortStory: Story = {
  name: "Controlled Sort",
  render: () => <ControlledSort />,
};

/** The header box selects every row, one row unchecked turns it mixed (AC 4). */
export const Selectable: Story = {
  args: { selectable: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const all = canvas.getByRole("checkbox", { name: "เลือกทุกแถว" });
    await userEvent.click(all);
    await expect(all).toHaveAttribute("aria-checked", "true");
    const rows = canvas.getAllByRole("row").slice(1);
    for (const row of rows) await expect(row).toHaveAttribute("data-selected");
    const one = canvas.getByRole("checkbox", { name: `เลือก ${fixtures.thai}` });
    await userEvent.click(one);
    await expect(all).toHaveAttribute("aria-checked", "mixed");
    await expect(one.closest("tr")).not.toHaveAttribute("data-selected");
  },
};

/** Selected rows: `surface.selected` ground and a `selection.fg` edge, distinct from focus. */
export const RowSelected: Story = {
  args: { selectable: true, defaultSelectedKeys: new Set(["canvas", "latin"]) },
};

/** Loading: the rows the table already has stay readable above a status row; nothing sorts or selects meanwhile (AC 5). */
export const Loading: Story = {
  args: { loading: true, selectable: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("table")).toHaveAttribute("aria-busy", "true");
    await expect(canvas.getByText("กำลังโหลด")).toBeInTheDocument();
    await expect(canvas.getByRole("checkbox", { name: "เลือกทุกแถว" })).toBeDisabled();
    const header = canvas.getByRole("columnheader", { name: "โปรเจกต์" });
    await expect(within(header).getByRole("button")).toBeDisabled();
  },
};

/** Empty invites an action (AC 6). */
export const Empty: Story = {
  args: {
    rows: [],
    empty: {
      title: "ยังไม่มีโปรเจกต์",
      description: "สร้างโปรเจกต์แรกจากบรีฟหรือจากแบรนด์ที่มีอยู่",
      action: <Button variant="primary">สร้างโปรเจกต์</Button>,
    },
  },
};

/** Error says what went wrong and how to fix it; the rows the table already had stay (AC 7). */
export const ErrorState: Story = {
  args: {
    error: {
      message: "โหลดรายการล่าสุดไม่สำเร็จ เพราะการเชื่อมต่อขาด ลองอีกครั้งเมื่อออนไลน์",
      action: (
        <Button variant="secondary" size="sm">
          ลองอีกครั้ง
        </Button>
      ),
    },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("alert")).toHaveTextContent(
      "โหลดรายการล่าสุดไม่สำเร็จ",
    );
  },
};

/** The name column opts into truncation at a fixed width; every other column wraps (AC 8). */
export const TruncatingColumn: Story = {
  args: {
    columns: [
      { ...columns[0], truncate: true, width: "14rem" } as TableColumn<Project>,
      ...columns.slice(1),
    ],
  },
};

/** 360 px: each row is a block, every cell prints its column name first, nothing scrolls sideways (AC 9). */
export const LongContentAt360: Story = {
  args: { selectable: true, defaultSelectedKeys: new Set(["long"]) },
  render: (args) => (
    <Narrow>
      <ProjectTable {...args} />
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole("table");
    await waitFor(() => expect(getComputedStyle(table).display).toBe("block"));
    const frame = table.parentElement;
    await expect(frame?.scrollWidth).toBe(frame?.clientWidth);
    const cell = canvas
      .getAllByRole("cell")
      .find((c) => c.dataset["label"] === "โปรเจกต์" && c.textContent?.includes(fixtures.longThai));
    await expect(cell).toBeDefined();
    if (!cell) return;
    await expect(getComputedStyle(cell, "::before").content).toBe('"โปรเจกต์"');
    await expect(canvas.getByRole("columnheader", { name: "โปรเจกต์" })).toBeInTheDocument();
  },
};

export const RecipesAndModes: Story = {
  args: { selectable: true, defaultSelectedKeys: new Set(["canvas"]), rows: projects.slice(0, 3) },
  render: (args) => (
    <Matrix>
      <ProjectTable {...args} />
    </Matrix>
  ),
};

/** Under the English locale the announcement, the missing cell and the selection names are English (spec ORV-39 AC 9). */
export const English: Story = {
  globals: { locale: "en" },
  args: { selectable: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole("table", { name: "โปรเจกต์ในเวิร์กสเปซ" });
    await expect(within(table).getAllByText("No data")).toHaveLength(1);
    await expect(canvas.getByRole("checkbox", { name: "Select every row" })).toBeInTheDocument();
    const header = canvas.getByRole("columnheader", { name: "การตัดสินใจ" });
    await userEvent.click(within(header).getByRole("button"));
    await expect(canvas.getByText("Sorted by การตัดสินใจ, ascending")).toBeInTheDocument();
  },
};
