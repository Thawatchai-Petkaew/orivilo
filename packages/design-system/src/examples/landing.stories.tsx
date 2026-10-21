import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Narrow, Under } from "../components/matrix";
import { Landing } from "./landing";

const meta = {
  title: "Examples/Marketing: Landing page",
  component: Landing,
  parameters: {
    docs: {
      description: {
        component:
          "Marketing tier page example (E2-7), composed from Base and Application components only because no marketing section component exists yet (coverage.md). No testimonial, logo, rating, count or price, since none has data; the interpreter step is labelled rule-based. Read `src/examples/landing.tsx` before composing a generated page.",
      },
    },
  },
} satisfies Meta<typeof Landing>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One h1, one primary action, a navigation landmark, the rule-based label (AC 4). */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    await expect(canvasElement.querySelectorAll('.ds-button[data-variant="primary"]')).toHaveLength(
      1,
    );
    await expect(canvas.getByRole("navigation", { name: "หลัก" })).toBeInTheDocument();
    await expect(canvas.getByText("แบบกฎก่อน")).toBeInTheDocument();
    await expect(canvas.getAllByRole("listitem")).toHaveLength(2 + 6 + 3);
  },
};

/** 360 px: the modules stack, the actions wrap, nothing scrolls sideways (AC 5). */
export const LongContentAt360: Story = {
  render: () => (
    <Narrow>
      <Landing />
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.firstElementChild as HTMLElement;
    await expect(frame.scrollWidth).toBe(frame.clientWidth);
    // The modules stack: the second card sits under the first.
    const cards = within(canvasElement).getAllByRole("listitem").slice(2, 4);
    await expect(cards[1]?.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      cards[0]?.getBoundingClientRect().bottom ?? Infinity,
    );
  },
};

/** The same page under a second recipe (DESIGN.md §11). The toolbar covers every other pair. */
export const Professional: Story = {
  render: () => (
    <Under profile="professional" mode="light">
      <Landing />
    </Under>
  ),
};

export const FriendlyDark: Story = {
  render: () => (
    <Under profile="friendly" mode="dark">
      <Landing />
    </Under>
  ),
};

export const Dark: Story = {
  render: () => (
    <Under profile="neutral" mode="dark">
      <Landing />
    </Under>
  ),
};
