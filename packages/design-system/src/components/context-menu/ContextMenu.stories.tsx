import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { commandById, shortcutsOf } from "../../commands/index";
import { fixtures } from "../fixtures";
import { Matrix } from "../matrix";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  openContextMenuAt,
} from "./ContextMenu";

const label = (id: Parameters<typeof commandById>[0]) => commandById(id).label.th;
const key = (id: Parameters<typeof commandById>[0]) => shortcutsOf(id)[0];

/** A surface with a context menu of board commands from the registry. */
function Surface({ onSelect = () => undefined }: { onSelect?: (id: string) => void }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          tabIndex={0}
          role="group"
          aria-label="พื้นที่ตัวอย่าง"
          className="flex min-h-40 items-center justify-center rounded-container border border-dashed border-border-control p-6 text-text-secondary outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          คลิกขวา กดค้าง หรือ Shift+F10 ที่นี่ ({fixtures.latin})
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent aria-label="เมนูของพื้นที่">
        <ContextMenuItem
          shortcut={key("board.add-node")}
          onSelect={() => onSelect("board.add-node")}
        >
          {label("board.add-node")}
        </ContextMenuItem>
        <ContextMenuItem
          shortcut={key("board.select-all")}
          onSelect={() => onSelect("board.select-all")}
        >
          {label("board.select-all")}
        </ContextMenuItem>
        <ContextMenuItem shortcut={key("board.paste")} disabled>
          {label("board.paste")}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          destructive
          shortcut={key("selection.delete")}
          onSelect={() => onSelect("selection.delete")}
        >
          {label("selection.delete")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

const meta = {
  title: "Base/Context menu",
  component: Surface,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Right-click or long-press on a surface (E4-3): the same item recipe and keyboard model as DropdownMenu, opened at the pointer; Shift+F10 is the registry's app.open-context-menu, which the caller turns into the same event at the focused element with openContextMenuAt. Never the only way to reach an action.",
      },
    },
  },
  args: { onSelect: fn() },
} satisfies Meta<typeof Surface>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = () => within(document.body);

/** Closed: the surface alone; nothing claims a menu. */
export const Closed: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("group", { name: "พื้นที่ตัวอย่าง" }),
    ).toBeVisible();
    await expect(body().queryByRole("menu")).toBeNull();
  },
};

/** Right-click opens at the pointer: items with key caps, the disabled one keeps its shortcut, delete last (AC 3). */
export const Open: Story = {
  play: async ({ canvasElement, args }) => {
    const region = within(canvasElement).getByRole("group", { name: "พื้นที่ตัวอย่าง" });
    await userEvent.pointer({ keys: "[MouseRight]", target: region });
    const menu = await body().findByRole("menu", { name: "เมนูของพื้นที่" });
    const items = within(menu).getAllByRole("menuitem");
    await expect(items).toHaveLength(4);
    await expect(items[2]).toHaveAttribute("data-disabled");
    await expect(items[2]?.querySelectorAll("kbd")).toHaveLength(2);
    await expect(items[3]).toHaveAttribute("data-destructive");
    await userEvent.click(items[0] as HTMLElement);
    await expect(args.onSelect).toHaveBeenCalledWith("board.add-node");
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
  },
};

/** Shift+F10 through openContextMenuAt opens at the focused element; Escape closes and focus returns (AC 8). */
export const FromKeyboard: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("group", { name: "พื้นที่ตัวอย่าง" });
    region.focus();
    openContextMenuAt(region);
    const menu = await body().findByRole("menu");
    await userEvent.keyboard("{ArrowDown}");
    await expect(within(menu).getByRole("menuitem", { name: /เพิ่ม node/ })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
    await expect(region).toHaveFocus();
  },
};

/** The surface under every profile in both modes; a context menu cannot be held open, so the play opens and closes each cell's. */
export const RecipesAndModes: Story = {
  render: (args) => (
    <Matrix>
      <Surface {...args} />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const regions = within(canvasElement).getAllByRole("group", { name: "พื้นที่ตัวอย่าง" });
    await expect(regions).toHaveLength(6);
    for (const region of regions) {
      await userEvent.pointer({ keys: "[MouseRight]", target: region });
      const menu = await body().findByRole("menu");
      await expect(within(menu).getAllByRole("menuitem")).toHaveLength(4);
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
    }
  },
};
