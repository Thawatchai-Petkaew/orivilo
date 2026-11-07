import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { fixtures } from "../fixtures";
import { Matrix, Narrow } from "../matrix";
import { expectLabelInkWhole, inVitest } from "../../testing/visual-asserts";
import { Tag } from "./Tag";

const meta = {
  title: "Base/Tag",
  component: Tag,
  parameters: {
    layout: "centered",
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
  /** Style A (ORV-192 row 13): regular-weight labels at 13 and 14 px, a round remove inside the pill. */
  play: async ({ canvasElement }) => {
    const [sm, md] = [...canvasElement.querySelectorAll<HTMLElement>(".ds-tag")] as [
      HTMLElement,
      HTMLElement,
    ];
    // Resolve the two tokens through the browser beside the tags, inside any profile boundary.
    const probe = document.createElement("span");
    probe.style.color = "var(--ds-border-subtle)";
    probe.style.borderRadius = "var(--ds-shape-control-radius)";
    (md.parentElement ?? canvasElement).append(probe);
    const expected = {
      color: getComputedStyle(probe).color,
      radius: getComputedStyle(probe).borderTopLeftRadius,
    };
    probe.remove();
    const smStyle = getComputedStyle(sm);
    const mdStyle = getComputedStyle(md);
    await expect([smStyle.fontSize, smStyle.fontWeight, smStyle.lineHeight]).toEqual([
      "13px",
      "400",
      "22.1px",
    ]);
    await expect([mdStyle.fontSize, mdStyle.fontWeight, mdStyle.lineHeight]).toEqual([
      "14px",
      "400",
      "23.8px",
    ]);
    await expect(smStyle.borderTopColor).toBe(expected.color);
    await expect(mdStyle.borderTopColor).toBe(expected.color);
    const mdRemove = md.querySelector<HTMLElement>(".ds-tag__remove") as HTMLElement;
    const mdBox = mdRemove.getBoundingClientRect();
    await expect([mdBox.width, mdBox.height]).toEqual([24, 24]);
    await expect(getComputedStyle(mdRemove).borderTopLeftRadius).toBe(expected.radius);
    // The md remove ends 4 px (the gap) inside the tag's inner end, past the 1 px edge.
    await expect(Math.abs(md.getBoundingClientRect().right - 1 - mdBox.right - 4) < 0.5).toBe(true);
    // The sm label stops at least 4 px before its remove.
    const smRm = sm.querySelector<HTMLElement>(".ds-tag__remove") as HTMLElement;
    const smLabel = sm.querySelector<HTMLElement>(".ds-tag__label") as HTMLElement;
    const gap = smRm.getBoundingClientRect().left - smLabel.getBoundingClientRect().right;
    await expect(gap >= 4 - 0.5).toBe(true);
    // ORV-194 row 7: the md one-line label shows the whole stack of ฟื้ ปั้ ปี๊.
    const mdLabel = md.querySelector<HTMLElement>(".ds-tag__label");
    if (!mdLabel) throw new Error("the md tag has no label");
    if (inVitest) await expectLabelInkWhole(mdLabel);
  },
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
  parameters: { layout: "padded" },
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
