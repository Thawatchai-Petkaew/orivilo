import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { commandById, isApplePlatform, shortcutsOf } from "../../commands/index";
import { Button } from "../button/Button";
import { fixtures } from "../fixtures";
import { Matrix } from "../matrix";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./DropdownMenu";

const label = (id: Parameters<typeof commandById>[0]) => commandById(id).label.th;
const key = (id: Parameters<typeof commandById>[0]) => shortcutsOf(id)[0];

/** The node's more menu: registry commands with their shortcuts, the destructive item last. */
function NodeMenu({
  onSelect = () => undefined,
  open,
  modal = true,
  pinned = false,
}: {
  onSelect?: (id: string) => void;
  open?: boolean | undefined;
  modal?: boolean | undefined;
  /** Keep the menu under its trigger instead of flipping or shifting to fit the viewport (matrix cells). */
  pinned?: boolean | undefined;
}) {
  return (
    <DropdownMenu open={open} modal={modal}>
      <DropdownMenuTrigger>
        <Button variant="secondary" size="sm">
          เพิ่มเติม
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        aria-label="เมนูของ node"
        avoidCollisions={!pinned}
        style={pinned ? { maxHeight: "none" } : undefined}
      >
        <DropdownMenuLabel>{fixtures.mixed}</DropdownMenuLabel>
        <DropdownMenuItem
          shortcut={key("selection.duplicate")}
          onSelect={() => onSelect("selection.duplicate")}
        >
          {label("selection.duplicate")}
        </DropdownMenuItem>
        <DropdownMenuItem shortcut={key("node.rename")} onSelect={() => onSelect("node.rename")}>
          {label("node.rename")}
        </DropdownMenuItem>
        <DropdownMenuItem shortcut={key("selection.lock")} disabled>
          {label("selection.lock")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          destructive
          shortcut={key("selection.delete")}
          onSelect={() => onSelect("selection.delete")}
        >
          {label("selection.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const meta = {
  title: "Base/Dropdown menu",
  component: NodeMenu,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A list of actions behind one trigger (E4-3). Radix gives arrow keys, typeahead, Escape and focus return; items share the ds-menu recipe with Select; shortcuts render with Kbd from the command registry; the destructive item uses feedback.danger and sits last.",
      },
    },
  },
  args: { onSelect: fn() },
} satisfies Meta<typeof NodeMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = () => within(document.body);

/** Each open menu sits inside its own matrix cell, so no menu covers a neighbour (ORV-80). */
async function expectMenusInTheirCells() {
  await waitFor(() => expect(body().getAllByRole("menu")).toHaveLength(6));
  const cells = Array.from(document.querySelectorAll("[data-matrix-cell]"));
  const menus = body().getAllByRole("menu");
  for (const menu of menus) {
    const trigger = document.getElementById(menu.getAttribute("aria-labelledby") ?? "");
    const cell = trigger?.closest("[data-matrix-cell]");
    await expect(cell).toBeTruthy();
    const m = menu.getBoundingClientRect();
    const c = (cell as Element).getBoundingClientRect();
    await expect(m.top).toBeGreaterThanOrEqual(c.top);
    await expect(m.bottom).toBeLessThanOrEqual(c.bottom);
    await expect(m.left).toBeGreaterThanOrEqual(c.left);
    await expect(m.right).toBeLessThanOrEqual(c.right);
  }
  await expect(cells).toHaveLength(6);
}

/** Closed: only the trigger is in the page; nothing claims a menu (catalog state closed). */
export const Closed: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("button", { name: "เพิ่มเติม" })).toBeVisible();
    await expect(body().queryByRole("menu")).toBeNull();
  },
};

/** Open: four items in registry order with key caps, the disabled one keeps its shortcut, delete last and in the danger colour (AC 3). */
export const Open: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "เพิ่มเติม" }));
    // Radix names the menu by its trigger (aria-labelledby wins over the content's aria-label).
    const menu = await body().findByRole("menu", { name: "เพิ่มเติม" });
    const items = within(menu).getAllByRole("menuitem");
    await expect(
      items.map((i) => i.textContent?.replace(/Ctrl|Cmd|Shift|Delete/g, "").trim()),
    ).toEqual([
      `${label("selection.duplicate")}D`,
      `${label("node.rename")}F2`,
      `${label("selection.lock")}L`,
      `${label("selection.delete")}`,
    ]);
    await expect(items[2]).toHaveAttribute("data-disabled");
    await expect(
      Array.from((items[2] as HTMLElement).querySelectorAll(".ds-kbd"), (k) => k.textContent),
    ).toEqual([isApplePlatform() ? "Cmd" : "Ctrl", "Shift", "L"]);
    const last = items[3] as HTMLElement;
    await expect(last).toHaveAttribute("data-destructive");
    await expect(getComputedStyle(last).color).not.toBe(
      getComputedStyle(items[0] as HTMLElement).color,
    );
    await userEvent.click(items[0] as HTMLElement);
    await expect(args.onSelect).toHaveBeenCalledWith("selection.duplicate");
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
  },
};

/** Keyboard: arrows move, typeahead picks, Enter runs, Escape closes and returns focus to the trigger (AC 3). */
export const Keyboard: Story = {
  play: async ({ canvasElement, args }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "เพิ่มเติม" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const menu = await body().findByRole("menu");
    await userEvent.keyboard("{ArrowDown}");
    await expect(within(menu).getByRole("menuitem", { name: /เปลี่ยนชื่อ/ })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await body().findByRole("menu");
    await userEvent.keyboard("{End}");
    await userEvent.keyboard("{Enter}");
    await expect(args.onSelect).toHaveBeenCalledWith("selection.delete");
  },
};

/** The open menu under every profile in both modes; non-modal so six can stay open at once. */
export const RecipesAndModes: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <Matrix>
      <div className="min-h-80">
        <NodeMenu {...args} open modal={false} pinned />
      </div>
    </Matrix>
  ),
  play: expectMenusInTheirCells,
};

/** The board's view menu: on/off options that keep the menu open, and one sort order (ORV-78). */
function ViewMenu({
  open,
  modal = true,
  pinned = false,
}: {
  open?: boolean | undefined;
  modal?: boolean | undefined;
  /** Keep the menu under its trigger instead of flipping or shifting to fit the viewport (matrix cells). */
  pinned?: boolean | undefined;
}) {
  const [grid, setGrid] = useState(true);
  const [minimap, setMinimap] = useState(false);
  const [sort, setSort] = useState("updated");
  return (
    <DropdownMenu open={open} modal={modal}>
      <DropdownMenuTrigger>
        <Button variant="secondary" size="sm">
          มุมมอง
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        avoidCollisions={!pinned}
        style={pinned ? { maxHeight: "none" } : undefined}
      >
        <DropdownMenuLabel>แสดง</DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked={grid} onCheckedChange={setGrid}>
          เส้นตาราง
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={minimap} onCheckedChange={setMinimap}>
          แผนที่ย่อ
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={false} disabled>
          ไม้บรรทัด
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked disabled>
          จุดยึด
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>เรียงตาม</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
          <DropdownMenuRadioItem value="updated">แก้ไขล่าสุด</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="name">ชื่อ</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="created">วันที่สร้าง</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem shortcut={key("selection.duplicate")}>
          {label("selection.duplicate")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Checkbox items toggle and keep the menu open; a radio choice closes it; checked shows a glyph
 * and the selected fill; checked and unchecked labels line up; a disabled item does not toggle (AC 1 to 5).
 */
export const Checkable: Story = {
  render: () => <ViewMenu />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "มุมมอง" });
    await userEvent.click(trigger);
    const menu = await waitFor(() => body().getByRole("menu", { name: "มุมมอง" }));
    const grid = within(menu).getByRole("menuitemcheckbox", { name: "เส้นตาราง" });
    const minimap = within(menu).getByRole("menuitemcheckbox", { name: "แผนที่ย่อ" });
    const bg = (el: HTMLElement) => getComputedStyle(el).backgroundColor;
    const ink = (el: HTMLElement) => getComputedStyle(el).color;
    // AC 1: checked is a glyph plus the selected fill; unchecked has neither.
    await expect(grid).toHaveAttribute("aria-checked", "true");
    await expect(grid.querySelector("svg")).not.toBeNull();
    await expect(minimap).toHaveAttribute("aria-checked", "false");
    await expect(minimap.querySelector("svg")).toBeNull();
    // AC 3: the glyph column stays when unchecked, so checked and unchecked labels line up.
    const left = (el: HTMLElement) =>
      (
        el.querySelector(":scope > .ds-menu__indicator + span") as HTMLElement
      ).getBoundingClientRect().left;
    await expect(left(minimap)).toBe(left(grid));
    // AC 1: a click toggles and the menu stays open; the fill follows the state.
    await userEvent.click(minimap);
    await expect(minimap).toHaveAttribute("aria-checked", "true");
    await expect(body().getByRole("menu")).toBeInTheDocument();
    // Highlighted by the pointer and checked shows the focus ring, so it reads apart from checked.
    await userEvent.hover(minimap);
    await waitFor(() => expect(minimap).toHaveAttribute("data-highlighted"));
    // The ring sits inside the selected fill (offset -2px), not the global focus ring's outer gap,
    // so it shows for a pointer too, where :focus-visible does not apply.
    await expect(getComputedStyle(minimap).outlineStyle).toBe("solid");
    await expect(getComputedStyle(minimap).outlineOffset).toBe("-2px");
    await expect(getComputedStyle(grid).outlineOffset).not.toBe("-2px");
    // AC 4: arrows move, Enter and Space toggle.
    minimap.focus();
    await userEvent.keyboard("{ArrowUp}");
    await expect(grid).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(grid).toHaveAttribute("aria-checked", "false");
    await userEvent.keyboard(" ");
    await expect(grid).toHaveAttribute("aria-checked", "true");
    await userEvent.keyboard("{ArrowDown}");
    await expect(minimap).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(minimap).toHaveAttribute("aria-checked", "false");
    await expect(bg(minimap)).not.toBe(bg(grid));
    // AC 5: a disabled item does not toggle and keeps the disabled ink, checked or not.
    const ruler = within(menu).getByRole("menuitemcheckbox", { name: "ไม้บรรทัด" });
    const snap = within(menu).getByRole("menuitemcheckbox", { name: "จุดยึด" });
    await userEvent.click(ruler);
    await expect(ruler).toHaveAttribute("aria-checked", "false");
    await expect(snap).toHaveAttribute("aria-checked", "true");
    await expect(ink(snap)).toBe(ink(ruler));
    await expect(ink(ruler)).not.toBe(ink(minimap));
    // AC 2: one radio is chosen and shows the dot; a choice closes the menu.
    const latest = within(menu).getByRole("menuitemradio", { name: "แก้ไขล่าสุด" });
    await expect(latest).toHaveAttribute("aria-checked", "true");
    await expect(latest.querySelector("svg")).not.toBeNull();
    await userEvent.click(within(menu).getByRole("menuitemradio", { name: "ชื่อ" }));
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
    await userEvent.click(trigger);
    const again = await waitFor(() => body().getByRole("menu", { name: "มุมมอง" }));
    const chosen = within(again)
      .getAllByRole("menuitemradio")
      .filter((r) => r.getAttribute("aria-checked") === "true");
    await expect(chosen.map((r) => r.textContent)).toEqual(["ชื่อ"]);
    await expect(chosen[0]?.querySelector("svg")).not.toBeNull();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
  },
};

/** The view menu under every profile in both modes, with checked and unchecked items. */
export const CheckableRecipesAndModes: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <Matrix>
      <div className="min-h-136">
        <ViewMenu open modal={false} pinned />
      </div>
    </Matrix>
  ),
  play: expectMenusInTheirCells,
};
