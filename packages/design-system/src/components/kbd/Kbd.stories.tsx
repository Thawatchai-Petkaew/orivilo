import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { shortcutsOf } from "../../commands/index";
import { Matrix } from "../matrix";
import { Kbd, shortcutWords } from "./Kbd";

const meta = {
  title: "Base/Kbd",
  component: Kbd,
  args: { shortcut: shortcutsOf("board.command-menu")[0] ?? "Mod+K", apple: false },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A keyboard shortcut hint (E4-3): one key cap per key, the modifier by platform, arrows as glyphs with their names for screen readers. Every shortcut shown comes from the command registry.",
      },
    },
  },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Mod+K off Apple: two caps, Ctrl then K (AC 2). */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const caps = canvasElement.querySelectorAll("kbd");
    await expect(caps).toHaveLength(2);
    await expect(caps[0]).toHaveTextContent("Ctrl");
    await expect(caps[1]).toHaveTextContent("K");
    await expect(shortcutWords("Mod+K", false)).toBe("Ctrl K");
  },
};

/** The same shortcut on Apple reads Cmd; Alt reads Option. */
export const Apple: Story = {
  args: { shortcut: "Mod+Alt+ArrowLeft", apple: true },
  play: async ({ canvasElement }) => {
    const caps = canvasElement.querySelectorAll("kbd");
    await expect(caps).toHaveLength(3);
    await expect(caps[0]).toHaveTextContent("Cmd");
    await expect(caps[1]).toHaveTextContent("Option");
    await expect(shortcutWords("Mod+Alt+ArrowLeft", true)).toBe("Cmd Option ลูกศรซ้าย");
  },
};

/** Arrows draw as glyphs; a screen reader gets the Thai key name (AC 2). */
export const Arrows: Story = {
  render: () => (
    <div className="flex gap-3">
      {shortcutsOf("selection.nudge").map((s) => (
        <Kbd key={s} shortcut={s} apple={false} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("ลูกศรขึ้น")).toHaveClass("sr-only");
    await expect(canvas.getByText("↑")).toHaveAttribute("aria-hidden");
    await expect(canvasElement.querySelectorAll("kbd")).toHaveLength(4);
  },
};

/** Named keys and symbols from the registry: Escape reads Esc, Delete, F2, Shift+/ and Mod+=. */
export const NamedKeys: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {["Escape", "Delete", "F2", "Shift+/", "Mod+=", "Mod+Shift+Z"].map((s) => (
        <Kbd key={s} shortcut={s} apple={false} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Esc")).toBeVisible();
    await expect(canvas.getByText("/")).toBeVisible();
    await expect(canvas.getByText("=")).toBeVisible();
  },
};

/** Key caps under every profile in both modes, on the canvas and inside a menu-like ground. */
export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <div className="flex flex-wrap items-center gap-3">
        <Kbd shortcut="Mod+K" apple={false} />
        <Kbd shortcut="Mod+Shift+G" apple />
        <Kbd shortcut="Shift+ArrowUp" apple={false} />
        <Kbd shortcut="Escape" apple={false} />
      </div>
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll("[data-matrix-cell]")).toHaveLength(6);
    await expect(canvasElement.querySelectorAll("kbd")).toHaveLength(6 * 8);
  },
};
