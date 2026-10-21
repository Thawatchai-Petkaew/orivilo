import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { fixtures } from "../fixtures";
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

export const Small: Story = { render: () => <Fixture size="sm" /> };

/** Focus selects (automatic activation), so the focused tab shows the ring over the selected edge; hover is the third tab. */
export const InteractionStates: Story = {
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

export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <Fixture size="sm" defaultValue="decisions" disabledValue="history" />
    </Matrix>
  ),
};
