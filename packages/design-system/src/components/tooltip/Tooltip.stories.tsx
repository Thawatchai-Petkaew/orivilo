import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { DesignProfileBoundary } from "../../boundary/DesignProfileBoundary";
import { Button } from "../button/Button";
import { fixtures } from "../fixtures";
import { Matrix } from "../matrix";
import { Tooltip } from "./Tooltip";

function CloseGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  );
}

const meta = {
  title: "Base/Tooltip",
  component: Tooltip,
  args: {
    content: "ปิดแผงนี้",
    children: (
      <Button iconOnly aria-label="ปิด" variant="ghost">
        <CloseGlyph />
      </Button>
    ),
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = () => within(document.body);

/** Opens on focus as well as hover and is linked with aria-describedby; Escape closes (catalog a11y). */
export const Closed: Story = {
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "ปิด" });
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    const tooltip = await body().findByRole("tooltip");
    await expect(tooltip).toHaveTextContent("ปิดแผงนี้");
    await expect(trigger).toHaveAttribute("aria-describedby", tooltip.id);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("tooltip")).toBeNull());
  },
};

export const Open: Story = { args: { open: true } };

/** Hover waits for the delay; focus does not. */
export const Delayed: Story = {
  args: { delay: 700 },
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole("button", { name: "ปิด" }));
    await expect(body().queryByRole("tooltip")).toBeNull();
    await expect(await body().findByRole("tooltip", {}, { timeout: 2000 })).toBeVisible();
  },
};

export const Sides: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-6 p-12">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Tooltip key={side} {...args} side={side} content={`${side}: ${fixtures.thai}`}>
          <Button variant="secondary">{side}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};

/** The content is rendered in a portal and still carries the trigger's profile (AC 7). */
export const InsideProfile: Story = {
  render: (args) => (
    <DesignProfileBoundary profile="friendly" mode="light">
      <div className="rounded-container bg-surface-canvas p-4 font-body text-text-primary">
        <Tooltip {...args} open />
      </div>
    </DesignProfileBoundary>
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "ปิด" });
    const tooltip = await body().findByRole("tooltip");
    const scope = tooltip.closest<HTMLElement>("[data-design-profile]");
    await expect(scope?.dataset["designProfile"]).toBe("friendly");
    const read = (el: Element) =>
      getComputedStyle(el).getPropertyValue("--ds-surface-inverse").trim();
    await expect(read(tooltip)).toBe(read(trigger));
  },
};

export const LongContent: Story = {
  args: { content: fixtures.longThai, open: true },
};

export const RecipesAndModes: Story = {
  render: (args) => (
    <Matrix>
      <div className="flex min-h-24 items-end gap-3">
        <Tooltip {...args} open side="top" content={fixtures.mixed} description={fixtures.thai}>
          <Button variant="secondary" size="sm">
            {fixtures.latin}
          </Button>
        </Tooltip>
      </div>
    </Matrix>
  ),
};

/** A name and one line that explains it; both are read with the trigger, nothing inside can take focus (AC 1, 3). */
export const WithDescription: Story = {
  args: {
    content: "ปิดแผงนี้",
    description: "แผงจะกลับมาเมื่อเลือกโหนดอีกครั้ง",
  },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "ปิด" });
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    const tooltip = await body().findByRole("tooltip");
    await expect(tooltip).toHaveTextContent("ปิดแผงนี้ แผงจะกลับมาเมื่อเลือกโหนดอีกครั้ง");
    await expect(trigger).toHaveAttribute("aria-describedby", tooltip.id);
    const visible = document.querySelector(".ds-tooltip");
    await expect(visible?.querySelector(".ds-tooltip__description")).toHaveTextContent(
      "แผงจะกลับมาเมื่อเลือกโหนดอีกครั้ง",
    );
    await expect(
      visible?.querySelectorAll("a, button, input, select, textarea, [tabindex]"),
    ).toHaveLength(0);
  },
};

/** `start` and `end` line the tooltip up with the trigger's edge, so it stays inside a panel (AC 2). */
export const Align: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-24 p-12">
      {(["start", "center", "end"] as const).map((align) => (
        <Tooltip
          key={align}
          {...args}
          open
          side="bottom"
          align={align}
          content={align}
          description={fixtures.thai}
        >
          <Button variant="secondary">{align}</Button>
        </Tooltip>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const edge = (name: string) => {
      const trigger = within(canvasElement).getByRole("button", { name }).getBoundingClientRect();
      const tip = [...document.querySelectorAll<HTMLElement>(".ds-tooltip")].find((el) =>
        el.textContent?.startsWith(name),
      );
      return { trigger, tip: tip?.getBoundingClientRect() };
    };
    await waitFor(() => expect(document.querySelectorAll(".ds-tooltip")).toHaveLength(3));
    const start = edge("start");
    await expect(Math.abs((start.tip?.left ?? -99) - start.trigger.left)).toBeLessThan(1);
    const end = edge("end");
    await expect(Math.abs((end.tip?.right ?? -99) - end.trigger.right)).toBeLessThan(1);
  },
};
