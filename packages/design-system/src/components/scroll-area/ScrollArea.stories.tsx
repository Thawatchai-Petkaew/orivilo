import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { fixtures } from "../fixtures";
import { useDesignProfile } from "../../boundary/DesignProfileBoundary";
import { Matrix } from "../matrix";
import { ScrollArea } from "./ScrollArea";

const rows = Array.from({ length: 24 }, (_, i) => (
  <p key={i} className="m-0 py-2 text-body-md">
    {i % 2 ? fixtures.longThai : fixtures.mixed}
  </p>
));

const meta = {
  title: "Base/Scroll area",
  component: ScrollArea,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A panel with its own scroll (E4-4): block library, inspector. The bar is drawn from tokens and shows whenever content overflows; the viewport is a labelled region the keyboard can reach.",
      },
    },
  },
  args: { label: "รายการบล็อก", children: rows, className: "h-64 max-w-sm" },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The region is a Tab stop with a name; the bar is visible while the content overflows. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region", { name: "รายการบล็อก" });
    await userEvent.tab();
    await expect(region).toHaveFocus();
    // Radix measures the overflow after mount, then draws the bar.
    await waitFor(() => expect(canvasElement.querySelector(".ds-scroll__bar")).not.toBeNull());
  },
};

/** Arrow keys scroll the focused region (scrolling state). */
export const Scrolling: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region", { name: "รายการบล็อก" });
    region.focus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    region.scrollTop += 120;
    await waitFor(() => expect(region.scrollTop).toBeGreaterThan(0));
  },
};

/** One region per cell, named after its cell so the six landmarks stay distinguishable. */
function Cell() {
  const scope = useDesignProfile();
  return (
    <ScrollArea label={`รายการบล็อก ${String(scope?.profile)} ${scope?.mode}`} className="h-40">
      {rows}
    </ScrollArea>
  );
}

export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <Cell />
    </Matrix>
  ),
};
