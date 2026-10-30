import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { fixtures } from "../fixtures";
import { ArtifactIcon, KnowledgeIcon, ReferenceIcon } from "../icons";
import { Matrix, Narrow } from "../matrix";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs";

const SECTIONS = [
  { value: "tokens", label: "Tokens", body: "ค่าสีและระยะที่ profile นี้ใช้" },
  { value: "decisions", label: "การตัดสินใจ", body: "shape, surfaceTreatment และเหตุผล" },
  { value: "history", label: "ประวัติ", body: fixtures.missingLabel },
] as const;

function Fixture({
  size = "md",
  disabledValue,
  defaultValue = "tokens",
}: {
  size?: "sm" | "md";
  disabledValue?: string;
  defaultValue?: string;
}) {
  return (
    <Tabs defaultValue={defaultValue} className="max-w-md">
      <TabsList size={size} aria-label="ส่วนของ profile">
        {SECTIONS.map((s) => (
          <TabsTrigger key={s.value} value={s.value} disabled={s.value === disabledValue}>
            {s.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {SECTIONS.map((s) => (
        <TabsContent key={s.value} value={s.value} className="pt-4 text-body-md">
          {s.body}
        </TabsContent>
      ))}
    </Tabs>
  );
}

const RICH = [
  { value: "sources", label: "แหล่งข้อมูล", icon: <KnowledgeIcon />, count: 4 },
  { value: "decisions", label: "การตัดสินใจ", icon: <ArtifactIcon />, count: 12 },
  { value: "history", label: "ประวัติ", icon: <ReferenceIcon />, count: 0 },
  { value: "archive", label: "Archive", icon: <ReferenceIcon />, count: 1204 },
  { value: "plain", label: "Plain" },
] as const;

function RichFixture({
  orientation = "horizontal",
  size = "md",
  disabledValue,
}: {
  orientation?: "horizontal" | "vertical";
  size?: "sm" | "md";
  disabledValue?: string;
}) {
  return (
    <Tabs defaultValue="decisions" orientation={orientation} className="max-w-md">
      <TabsList size={size} aria-label="ส่วนของ inspector">
        {RICH.map((t) => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            disabled={t.value === disabledValue}
            icon={"icon" in t ? t.icon : undefined}
            count={"count" in t ? t.count : undefined}
          >
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {RICH.map((t) => (
        <TabsContent key={t.value} value={t.value} className="p-4 text-body-md">
          {t.label}
        </TabsContent>
      ))}
    </Tabs>
  );
}

const meta = {
  title: "Base/Tabs",
  component: Tabs,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Arrow keys move selection; the panel is labelled by its tab (AC 10). */
export const Default: Story = {
  render: () => <Fixture />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole("tab", { name: "Tokens" });
    first.focus();
    await userEvent.keyboard("{ArrowRight}");
    const second = canvas.getByRole("tab", { name: "การตัดสินใจ" });
    await expect(second).toHaveAttribute("aria-selected", "true");
    await expect(second).toHaveFocus();
    const panel = canvas.getByRole("tabpanel");
    await expect(panel).toHaveAttribute("aria-labelledby", second.id);
    await expect(panel).toHaveTextContent("shape, surfaceTreatment");
  },
};

/** AC 6: Up and Down move, Left and Right do nothing; the edge is on the side facing the panel. */
export const Vertical: Story = {
  render: () => <RichFixture orientation="vertical" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole("tablist");
    await expect(list).toHaveAttribute("aria-orientation", "vertical");
    const decisions = canvas.getByRole("tab", { name: "การตัดสินใจ 12" });
    decisions.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowLeft}");
    await expect(decisions).toHaveAttribute("aria-selected", "true");
    await expect(decisions).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    const history = canvas.getByRole("tab", { name: "ประวัติ 0" });
    await expect(history).toHaveAttribute("aria-selected", "true");
    await expect(history).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}");
    await expect(decisions).toHaveAttribute("aria-selected", "true");
    // The list sits beside the panel, not above it.
    const panel = canvas.getByRole("tabpanel");
    await expect(panel.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      list.getBoundingClientRect().right - 1,
    );
    // The selected tab's 2 px edge is on the inner side (inline end) in the selection colour,
    // and the focus ring is a separate outline.
    const edge = getComputedStyle(decisions, "::after");
    await expect(edge.width).toBe("2px");
    const probe = document.createElement("i");
    probe.style.color = "var(--cmp-tabs-indicator)";
    decisions.append(probe);
    await expect(edge.backgroundColor).toBe(getComputedStyle(probe).color);
    probe.remove();
    await expect(edge.insetInlineEnd).toBe("-1px");
  },
};

/** AC 7: icon before the label (hidden), count after it as text read with the tab; 0 shows. */
export const IconAndCount: Story = {
  render: () => <RichFixture />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const decisions = canvas.getByRole("tab", { name: "การตัดสินใจ 12" });
    const icon = decisions.querySelector(".ds-tabs__icon");
    await expect(icon).toHaveAttribute("aria-hidden", "true");
    await expect(decisions.firstElementChild).toBe(icon);
    await expect(decisions.querySelector(".ds-tabs__count")).toHaveTextContent("12");
    // A count of 0 still shows.
    const zero = canvas.getByRole("tab", { name: "ประวัติ 0" });
    await expect(zero.querySelector(".ds-tabs__count")).toHaveTextContent(/^0$/);
    // Above 999 it caps and keeps the full number in the title.
    const big = canvas.getByRole("tab", { name: "Archive 999+" });
    await expect(big.querySelector(".ds-tabs__count")).toHaveAttribute("title", "1204");
    // No count prop, no count.
    const plain = canvas.getByRole("tab", { name: "Plain" });
    await expect(plain.querySelector(".ds-tabs__count")).toBeNull();
    await expect(plain.querySelector(".ds-tabs__icon")).toBeNull();
  },
};

export const VerticalSmall: Story = {
  render: () => <RichFixture orientation="vertical" size="sm" disabledValue="archive" />,
};

export const Small: Story = { render: () => <Fixture size="sm" /> };

/**
 * Focus selects (automatic activation), so the focused tab shows the ring over the selected edge;
 * hover is the third tab. A synthetic pointer sets no `:hover`, so `parameters.pseudo` forces the
 * hover look on that tab (spec ORV-84, `hover-force-1`).
 */
export const InteractionStates: Story = {
  parameters: { pseudo: { rootSelector: "body", hover: ['[role="tab"][id$="-trigger-history"]'] } },
  render: () => <Fixture defaultValue="decisions" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole("tab", { name: "ประวัติ" }));
    canvas.getByRole("tab", { name: "Tokens" }).focus();
    await expect(canvas.getByRole("tab", { name: "Tokens" })).toHaveFocus();
    await expect(canvas.getByRole("tab", { name: "Tokens" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    // The selection moved to Tokens, so การตัดสินใจ is at rest; the hover rule changes ink and ground.
    const hover = getComputedStyle(canvas.getByRole("tab", { name: "ประวัติ" }));
    const rest = getComputedStyle(canvas.getByRole("tab", { name: "การตัดสินใจ" }));
    await waitFor(() => expect(hover.color).not.toBe(rest.color));
    await waitFor(() => expect(hover.backgroundColor).not.toBe(rest.backgroundColor));
  },
};

export const Disabled: Story = { render: () => <Fixture disabledValue="history" /> };

export const LongLabelsAt360: Story = {
  render: () => (
    <Narrow>
      <Tabs defaultValue="a">
        <TabsList aria-label="ส่วนยาว">
          <TabsTrigger value="a">{fixtures.mixed}</TabsTrigger>
          <TabsTrigger value="b">{fixtures.longThai}</TabsTrigger>
          <TabsTrigger value="c">{fixtures.latin}</TabsTrigger>
        </TabsList>
        <TabsContent value="a" className="pt-4 text-body-md">
          {fixtures.mixed}
        </TabsContent>
        <TabsContent value="b" className="pt-4 text-body-md">
          {fixtures.longThai}
        </TabsContent>
        <TabsContent value="c" className="pt-4 text-body-md">
          {fixtures.latin}
        </TabsContent>
      </Tabs>
    </Narrow>
  ),
};

export const VerticalAt360: Story = {
  render: () => (
    <Narrow>
      <RichFixture orientation="vertical" />
    </Narrow>
  ),
};

export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <Fixture size="sm" defaultValue="decisions" disabledValue="history" />
      <RichFixture size="sm" disabledValue="archive" />
      <RichFixture orientation="vertical" />
    </Matrix>
  ),
};
