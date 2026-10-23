import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { commandById, isApplePlatform, shortcutsOf } from "../../commands/index";
import { Button } from "../button/Button";
import { fixtures } from "../fixtures";
import { Matrix } from "../matrix";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
}: {
  onSelect?: (id: string) => void;
  open?: boolean | undefined;
  modal?: boolean | undefined;
}) {
  return (
    <DropdownMenu open={open} modal={modal}>
      <DropdownMenuTrigger>
        <Button variant="secondary" size="sm">
          เพิ่มเติม
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent aria-label="เมนูของ node">
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
    layout: "padded",
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
  render: (args) => (
    <Matrix>
      <div className="min-h-64">
        <NodeMenu {...args} open modal={false} />
      </div>
    </Matrix>
  ),
  play: async () => {
    await waitFor(() => expect(body().getAllByRole("menu")).toHaveLength(6));
  },
};
