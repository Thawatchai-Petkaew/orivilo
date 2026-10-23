import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { fixtures } from "../fixtures";
import { Matrix, Narrow } from "../matrix";
import { Tag } from "./Tag";

const meta = {
  title: "Base/Tag",
  component: Tag,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A label the user chose: a reference, a filter, a mention (E4-5). Remove is a real button beside the label; a selectable tag is a toggle button that adds a check and a heavier edge when selected.",
      },
    },
  },
  args: { label: "โลโก้รอบที่ 2", onRemove: fn() },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Remove is a real button named "ลบ {label}", reached by keyboard, and calls `onRemove` once. */
export const Removable: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const remove = canvas.getByRole("button", { name: "ลบ โลโก้รอบที่ 2" });
    await userEvent.tab();
    await expect(remove).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onRemove).toHaveBeenCalledTimes(1);
    await userEvent.click(remove);
    await expect(args.onRemove).toHaveBeenCalledTimes(2);
  },
};

function Pickable({ label }: { label: string }) {
  const [on, setOn] = useState(false);
  return <Tag label={label} selected={on} onSelectedChange={setOn} onRemove={fn()} />;
}

/** Click or Space toggles `aria-pressed`; selected adds a check and a heavier edge. */
export const Selectable: Story = {
  render: () => <Pickable label="แบรนด์ A" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tag = canvas.getByRole("button", { name: "แบรนด์ A", pressed: false });
    await userEvent.click(tag);
    await expect(tag).toHaveAttribute("aria-pressed", "true");
    // The tag carries a selected mark besides colour: the edge is heavier than at rest.
    const root = tag.closest<HTMLElement>(".ds-tag");
    await expect(root).toHaveAttribute("data-selected");
    await expect(getComputedStyle(root as HTMLElement).borderTopWidth).toBe("2px");
    tag.focus();
    await userEvent.keyboard(" ");
    await expect(tag).toHaveAttribute("aria-pressed", "false");
    await expect(getComputedStyle(root as HTMLElement).borderTopWidth).toBe("1px");
  },
};

/** A selected tag keeps its remove button, a separate control with its own name. */
export const SelectedAndRemovable: Story = {
  args: { selected: true, onSelectedChange: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "โลโก้รอบที่ 2" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(canvas.getByRole("button", { name: "ลบ โลโก้รอบที่ 2" })).toBeVisible();
  },
};

/** Read-only: no remove button, and no toggle role. */
export const Plain: Story = {
  render: (args) => <Tag label={args.label} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole("button")).toBeNull();
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Tag {...args} size="sm" />
      <Tag {...args} size="md" />
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, selected: false, onSelectedChange: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "โลโก้รอบที่ 2" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "ลบ โลโก้รอบที่ 2" })).toBeDisabled();
  },
};

/** A long label truncates inside the tag; the full text stays in `title`. */
export const LongLabelAt360: Story = {
  args: { label: fixtures.longThai },
  render: (args) => (
    <Narrow>
      <div className="flex flex-col items-start gap-3">
        <Tag {...args} />
        <Tag {...args} label={fixtures.longLatin} size="sm" />
      </div>
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(".ds-tag");
    await expect(root).toHaveAttribute("title", fixtures.longThai);
    const label = root?.querySelector<HTMLElement>(".ds-tag__label");
    await expect((label?.scrollWidth ?? 0) > (label?.clientWidth ?? 0)).toBe(true);
    await expect((root?.getBoundingClientRect().width ?? 0) <= 360).toBe(true);
  },
};

export const RecipesAndModes: Story = {
  render: (args) => (
    <Matrix>
      <div className="flex flex-wrap items-center gap-3">
        <Tag {...args} />
        <Tag {...args} label="แบรนด์ A" selected onSelectedChange={fn()} />
        <Tag {...args} label="ปิดอยู่" disabled selected={false} onSelectedChange={fn()} />
        <Tag {...args} label="Brand B" size="sm" />
      </div>
    </Matrix>
  ),
  decorators: [],
};
