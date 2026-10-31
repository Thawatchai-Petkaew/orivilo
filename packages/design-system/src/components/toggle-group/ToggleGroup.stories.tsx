import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { CursorIcon, HandIcon } from "../icons";
import { inVitest } from "../../testing/visual-asserts";
import { Matrix } from "../matrix";
import { ToggleGroup, ToggleGroupItem } from "./ToggleGroup";

interface ModesProps {
  type?: "single" | "multiple" | undefined;
  size?: "sm" | "md" | undefined;
  disabled?: boolean | undefined;
  onValueChange?: ((value: string) => void) | undefined;
}

function Modes({ type = "single", size, disabled, onValueChange }: ModesProps) {
  if (type === "multiple") {
    return (
      <ToggleGroup
        type="multiple"
        aria-label="ตัวเลือกกระดาน"
        defaultValue={["grid"]}
        size={size}
        disabled={disabled}
      >
        <ToggleGroupItem value="grid">กริด</ToggleGroupItem>
        <ToggleGroupItem value="snap">ดูดเข้ากริด</ToggleGroupItem>
        <ToggleGroupItem value="minimap">แผนที่ย่อ</ToggleGroupItem>
      </ToggleGroup>
    );
  }
  return (
    <ToggleGroup
      type="single"
      aria-label="โหมดชี้"
      defaultValue="select"
      size={size}
      disabled={disabled}
      onValueChange={onValueChange}
    >
      <ToggleGroupItem value="select" aria-label="โหมดเลือก">
        <CursorIcon className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="pan" aria-label="โหมดเลื่อนกระดาน">
        <HandIcon className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

const meta = {
  title: "Base/Toggle group",
  component: Modes,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "One of a few modes (single) or any of a few switches (multiple), E4-3. Radix gives roving tabindex and the pressed semantics. Segmented (ORV-65): a sunken track, and the pressed item is a raised card chip with a ring and text.primary ink, the same under every profile; never a tint alone.",
      },
    },
  },
  args: { type: "single" },
} satisfies Meta<typeof Modes>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Single: radio semantics, one pressed; clicking the other moves the chip (AC 4). */
export const Single: Story = {
  args: { onValueChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole("radio", { name: "โหมดเลือก" });
    const pan = canvas.getByRole("radio", { name: "โหมดเลื่อนกระดาน" });
    await expect(select).toHaveAttribute("data-state", "on");
    // More than colour: the pressed chip has a ring and a raised ground (ORV-65 AC 2). Both items
    // keep one weight, so a text item does not change width when it is pressed (ORV-192).
    await expect(getComputedStyle(select).boxShadow).not.toBe(getComputedStyle(pan).boxShadow);
    await expect(getComputedStyle(select).backgroundColor).not.toBe(
      getComputedStyle(pan).backgroundColor,
    );
    await expect(getComputedStyle(select).fontWeight).toBe(getComputedStyle(pan).fontWeight);
    await userEvent.click(pan);
    await expect(pan).toHaveAttribute("data-state", "on");
    await expect(select).toHaveAttribute("data-state", "off");
    await expect(args.onValueChange).toHaveBeenCalledWith("pan");
    // ORV-192 row 12: with focus gone, the pressed chip is lifted by a 0 1px 3px shadow of black at
    // 24 percent (half of opacity.scrim) and has no 1 px ring (a `0px 0px 0px 1px` spread).
    pan.blur();
    await waitFor(() => expect(getComputedStyle(pan).boxShadow).toMatch(/ 0px 1px 3px 0px$/));
    await expect(getComputedStyle(pan).boxShadow).toMatch(/^color\(srgb 0 0 0 \/ 0\.24\) /);
    await expect(getComputedStyle(pan).boxShadow).not.toContain("0px 0px 0px 1px");
    // Under a real pointer the chip keeps its ground: no hover wash on a pressed item. Only
    // Vitest browser mode has a real pointer; the synthetic one of `storybook/test` sets no :hover.
    if (inVitest) {
      const { userEvent: pointer } = await import("vitest/browser");
      const ground = getComputedStyle(pan).backgroundColor;
      await pointer.hover(pan);
      await expect(pan.matches(":hover")).toBe(true);
      await Promise.all(pan.getAnimations().map((a) => a.finished));
      await expect(getComputedStyle(pan).backgroundColor).toBe(ground);
      await pointer.unhover(pan);
    }
  },
};

/** Multiple: each item is a pressed button; any number can be on (AC 4). */
export const Multiple: Story = {
  args: { type: "multiple" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole("button", { name: "กริด" });
    const snap = canvas.getByRole("button", { name: "ดูดเข้ากริด" });
    await expect(grid).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(snap);
    await expect(snap).toHaveAttribute("aria-pressed", "true");
    await expect(grid).toHaveAttribute("aria-pressed", "true");
  },
};

/** Thai labels sit on the centre line: no bottom edge and even block padding (ORV-65 AC 4). */
export const ThaiCentred: Story = {
  args: { type: "multiple" },
  play: async ({ canvasElement }) => {
    const item = within(canvasElement).getByRole("button", { name: "กริด" });
    const style = getComputedStyle(item);
    await expect(style.borderBottomWidth).toBe("0px");
    await expect(style.paddingTop).toBe(style.paddingBottom);
    await expect(style.alignItems).toBe("center");
  },
};

/** Small and medium: the control heights from the button tokens. */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Modes size="sm" />
      <Modes size="md" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const groups = canvasElement.querySelectorAll<HTMLElement>(".ds-toggle");
    const [sm, md] = [groups[0], groups[1]] as [HTMLElement, HTMLElement];
    await expect(sm.getBoundingClientRect().height).toBeLessThan(md.getBoundingClientRect().height);
  },
};

/** Roving tabindex: one Tab stop, arrows move between items, Space presses (catalog a11y). */
export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole("radio", { name: "โหมดเลือก" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    const pan = canvas.getByRole("radio", { name: "โหมดเลื่อนกระดาน" });
    await expect(pan).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(pan).toHaveAttribute("data-state", "on");
    // ORV-192 row 12 and row 9: a keyboard-focused pressed chip keeps its lift first and ends with
    // the 4 px brand halo, so focus never takes the pressed cue away.
    await expect(pan.matches(":focus-visible")).toBe(true);
    await waitFor(() => expect(getComputedStyle(pan).boxShadow).toMatch(/ 0px 0px 0px 4px$/));
    await expect(getComputedStyle(pan).boxShadow).toMatch(
      /^color\(srgb 0 0 0 \/ 0\.24\) 0px 1px 3px 0px, /,
    );
    await userEvent.tab();
    await expect(pan).not.toHaveFocus();
  },
};

/** Disabled: no item can be pressed and the text takes the disabled colour. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const pan = within(canvasElement).getByRole("radio", { name: "โหมดเลื่อนกระดาน" });
    await expect(pan).toBeDisabled();
    await userEvent.click(pan);
    await expect(pan).toHaveAttribute("data-state", "off");
  },
};

/** Both types under every profile in both modes. */
export const RecipesAndModes: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <Matrix>
      <div className="flex flex-wrap items-center gap-4">
        <Modes />
        <Modes type="multiple" />
      </div>
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll(".ds-toggle")).toHaveLength(12);
  },
};
