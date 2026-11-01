import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentType } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { DesignProfileBoundary } from "../../boundary/DesignProfileBoundary";
import { Field } from "../field/Field";
import { fixtureOptions, fixtures } from "../fixtures";
import { ArtifactIcon, DirectionIcon, KnowledgeIcon, NoteIcon, ReferenceIcon } from "../icons";
import {
  expectFocusBorderForm,
  expectInkCentred,
  expectLabelInkWhole,
  expectNoGlyphClip,
  inVitest,
  resolvedColor,
} from "../../testing/visual-asserts";
import { Matrix, Narrow } from "../matrix";
import { Select, type SelectGroup, type SelectOption, type SelectProps } from "./Select";

/** The flat form; the grouped form is told by its own stories. */
type FlatSelectProps = Extract<SelectProps, { options: readonly SelectOption[] }>;

/** Options that say more than one word: an icon, a second line, a long Thai line, a disabled one. */
const richOptions: readonly SelectOption[] = [
  {
    value: "canvas",
    label: "Brand Canvas",
    icon: <ArtifactIcon />,
    description: "พื้นที่รวมแหล่งข้อมูล การสังเคราะห์ และการตัดสินใจของแบรนด์",
  },
  {
    value: "design-system",
    label: "Design System",
    icon: <DirectionIcon />,
    description: "Tokens, recipes and components in one place",
  },
  { value: "product", label: "ผลิตภัณฑ์", icon: <KnowledgeIcon /> },
  {
    value: "long",
    label: fixtures.longThai,
    icon: <NoteIcon />,
    description: fixtures.longThai,
  },
  {
    value: "archived",
    label: "เก็บถาวรแล้ว",
    icon: <ReferenceIcon />,
    description: "ไม่รับการเปลี่ยนแปลงอีก",
    disabled: true,
  },
];

const groups: readonly SelectGroup[] = [
  {
    label: "ออกแบบ",
    options: [
      { value: "canvas", label: "Brand Canvas", icon: <ArtifactIcon /> },
      { value: "design-system", label: "Design System", description: "Tokens and recipes" },
    ],
  },
  { label: "ไม่มีรายการ", options: [] },
  {
    label: "ส่งมอบ",
    options: [
      { value: "review", label: "Review", icon: <ReferenceIcon /> },
      { value: "product", label: "ผลิตภัณฑ์", icon: <KnowledgeIcon /> },
      { value: "archived", label: "เก็บถาวรแล้ว", disabled: true },
    ],
  },
];

/** A Field around the story, for stories of one control. Storybook adds a meta decorator to every
 * story (a story's `decorators: []` does not drop it), so each story that wants it names it. */
const inField = (Story: ComponentType) => (
  <div className="max-w-md">
    <Field label="โมดูล">
      <Story />
    </Field>
  </div>
);

const meta = {
  title: "Base/Select",
  component: Select,
  args: { options: fixtureOptions },
  parameters: { layout: "padded" },
} satisfies Meta<FlatSelectProps>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = () => within(document.body);

/** Runs `check` with the browser at 360 by 640, the size the row 8 stories name, then puts the size
 * back. Vitest's browser iframe is 1200 by 900, wide enough to hide a listbox that runs off a phone. The
 * static Storybook has no `vitest/browser`; there the frame is the viewport the toolbar chose. */
async function atPhoneSize(check: () => Promise<void>) {
  if (!inVitest) return check();
  const { page } = await import("vitest/browser");
  const before = { width: window.innerWidth, height: window.innerHeight };
  // Radix closes an open Select on a window resize, so each resize settles before the next step.
  const resized = async (width: number, height: number) => {
    await page.viewport(width, height);
    await waitFor(() => expect([window.innerWidth, window.innerHeight]).toEqual([width, height]));
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  };
  // The screenshot lock of `visual-asserts.ts`: no other file's screenshot runs while the frame is resized.
  await navigator.locks.request("orivilo-screenshot", async () => {
    await resized(360, 640);
    try {
      await check();
    } finally {
      await resized(before.width, before.height);
    }
  });
}

/** The open listbox stays inside the viewport on all four sides, and when its options do not fit it
 * scrolls inside itself (ORV-194 row 8). Geometry and computed style only. */
async function expectListboxInViewport() {
  const listbox = await body().findByRole("listbox");
  await expect(listbox).toBeVisible();
  const box = listbox.getBoundingClientRect();
  await expect(box.left).toBeGreaterThanOrEqual(0);
  await expect(box.top).toBeGreaterThanOrEqual(0);
  await expect(box.right).toBeLessThanOrEqual(window.innerWidth);
  await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
  // A description wraps under its label inside the option, never past the option's edge or the listbox.
  for (const description of listbox.querySelectorAll(".ds-menu__option-description")) {
    const option = description.closest(".ds-menu__option");
    const edge = option ? option.getBoundingClientRect().right : box.right;
    await expect(description.getBoundingClientRect().right).toBeLessThanOrEqual(edge);
    await expect(description.scrollWidth).toBeLessThanOrEqual(description.clientWidth);
  }
  const viewport = listbox.querySelector("[data-radix-select-viewport]");
  if (viewport && viewport.scrollHeight > viewport.clientHeight) {
    await expect(getComputedStyle(viewport).overflowY).not.toBe("visible");
  }
}

export const Default: Story = { decorators: [inField] };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex max-w-md flex-col gap-4">
      <Field label="เล็ก">
        <Select {...args} size="sm" />
      </Field>
      <Field label="กลาง">
        <Select {...args} size="md" />
      </Field>
      <Field label="ใหญ่">
        <Select {...args} size="lg" />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // No Field nested in a Field: a meta decorator wrapping this story would break its labels.
    await expect(canvasElement.querySelectorAll(".ds-field .ds-field")).toHaveLength(0);
  },
};

const MODES = ["light", "dark"] as const;

/** The 16 positions of a box below a whole CSS pixel, 0, 1/16, ..., 15/16 (ORV-199 field-sm-sweep-1). */
const SWEEP = Array.from({ length: 16 }, (_, k) => k);

/** The Thai value with every stack of marks, for the clip box of the trigger's value (ORV-199 row 6). */
const markStack = "ฟื้ปี๊ปุ่มสั่งซื้อฟูปู่";

/**
 * Where the value of an sm trigger sits in its box (ORV-199 field-sm-sweep-1). A line box and a
 * whole-pixel glyph snap meet at a fraction of a pixel, so one y can pass by luck; each cell holds
 * 16 rows, every row a fixed 96 px holding an sm Select with the Thai value and, 44 px below it, one
 * with the English value, both `k/16` px below a whole pixel (the row height is fixed, so the offset
 * does not add up). The play
 * runs `expectInkCentred` with the body reading on the Thai trigger of each row, which fails with
 * the offset of every trigger that is off; the English trigger stays for the look and is not judged
 * (it reads 1.75 px off on the Linux CI runner, spec field-sm-sweep-1). Then `expectLabelInkWhole`
 * on one trigger's value with a stack of Thai marks. The static Storybook shows the story without
 * the checks.
 */
export const LabelCentre: Story = {
  render: () => (
    <>
      {MODES.map((mode) => (
        <DesignProfileBoundary key={mode} mode={mode} profile="neutral">
          <div
            data-testid={`label-centre-${mode}`}
            className="flex flex-col bg-surface-canvas px-4 py-4"
          >
            {SWEEP.map((k) => (
              <div
                key={k}
                className="box-border flex h-24 flex-col items-stretch gap-3"
                style={{ paddingTop: `${k / 16}px` }}
              >
                {[
                  { value: "th", label: fixtures.thai },
                  { value: "en", label: fixtures.latin },
                ].map(({ value, label }) => (
                  <Select
                    key={value}
                    size="sm"
                    options={[
                      { value: "th", label: fixtures.thai },
                      { value: "en", label: fixtures.latin },
                    ]}
                    defaultValue={value}
                    aria-label={label}
                  />
                ))}
              </div>
            ))}
          </div>
        </DesignProfileBoundary>
      ))}
    </>
  ),
  play: async ({ canvasElement }) => {
    if (!inVitest) return; // the screenshot needs Vitest browser mode
    const canvas = within(canvasElement);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    for (const mode of MODES) {
      const cell = canvas.getByTestId(`label-centre-${mode}`);
      const triggers = within(cell).getAllByRole("combobox");
      await expect(triggers).toHaveLength(SWEEP.length * 2);
      // The look (ORV-199 F-S1): every trigger lies inside its cell with 16 px of canvas above and below, so no border
      // touches the boundary edge and the frame does not scroll sideways.
      const box = cell.getBoundingClientRect();
      for (const trigger of triggers) {
        const t = trigger.getBoundingClientRect();
        await expect(t.left).toBeGreaterThanOrEqual(box.left);
        await expect(t.right).toBeLessThanOrEqual(box.right);
        await expect(t.top).toBeGreaterThanOrEqual(box.top + 16);
        await expect(t.bottom).toBeLessThanOrEqual(box.bottom - 16);
      }
      // The cell is 1568 px tall, past the viewport a screenshot clips to, so each 96 px row is read on its own.
      for (let row = 0; row < SWEEP.length; row++) {
        const thaiTrigger = triggers[row * 2];
        const rowEl = thaiTrigger?.parentElement;
        if (!thaiTrigger || !rowEl) throw new Error(`the sweep row ${row} holds no trigger`);
        await expectInkCentred(rowEl, [thaiTrigger], { measure: "body" });
      }
      // The English trigger of row 0 has 44 px of its row above it, so the 8 px reach of the check stays inside the row.
      const value = triggers[1]?.firstElementChild;
      if (!(value instanceof HTMLElement)) throw new Error("the sm trigger holds no value span");
      await expectLabelInkWhole(value, markStack);
    }
  },
};

export const WithValue: Story = { decorators: [inField], args: { defaultValue: "product" } };

/** Keyboard: Enter opens, arrows move, Enter chooses, Escape closes and returns focus. */
export const Open: Story = {
  decorators: [inField],
  args: { defaultValue: "canvas" },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("combobox", { name: "โมดูล" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const listbox = await body().findByRole("listbox");
    // Border form (ORV-192 row 9): the listbox panel's border turns focus.ring and its elevation stays.
    await expectFocusBorderForm(listbox);
    const selected = within(listbox).getByRole("option", { name: "Brand Canvas" });
    await expect(selected).toHaveAttribute("aria-selected", "true");
    await expect(within(listbox).getByRole("option", { name: "เก็บถาวรแล้ว" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(body().queryByRole("listbox")).toBeNull());
    await expect(trigger).toHaveTextContent("Design System");
    await expect(trigger).toHaveFocus();
  },
};

/** The listbox is rendered in a portal and still carries the trigger's profile (AC 7). */
export const InsideProfile: Story = {
  render: (args) => (
    <DesignProfileBoundary profile="professional" mode="dark">
      <div className="max-w-md rounded-container bg-surface-canvas p-4 font-body text-text-primary">
        <Field label="โมดูล">
          <Select {...args} defaultValue="review" />
        </Field>
      </div>
    </DesignProfileBoundary>
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("combobox", { name: "โมดูล" });
    await userEvent.click(trigger);
    const listbox = await body().findByRole("listbox");
    const scope = listbox.closest<HTMLElement>("[data-design-profile]");
    await expect(scope?.dataset["designProfile"]).toBe("professional");
    await expect(scope?.dataset["mode"]).toBe("dark");
    const read = (el: Element) =>
      getComputedStyle(el).getPropertyValue("--ds-action-primary").trim();
    await expect(read(listbox)).toBe(read(trigger));
    await userEvent.keyboard("{Escape}");
  },
};

/** AC 1 and 2: icon before the label, description as a second line, trigger keeps one line. */
export const IconsAndDescriptions: Story = {
  decorators: [inField],
  args: { options: richOptions },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("combobox", { name: "โมดูล" });
    await userEvent.click(trigger);
    const listbox = await body().findByRole("listbox");
    const option = within(listbox).getByRole("option", { name: "Brand Canvas" });
    // The accessible name is the label only; the description is the option's description.
    await expect(option).toHaveAccessibleName("Brand Canvas");
    await expect(option).toHaveAccessibleDescription(
      "พื้นที่รวมแหล่งข้อมูล การสังเคราะห์ และการตัดสินใจของแบรนด์",
    );
    const icon = option.querySelector("svg");
    await expect(icon).not.toBeNull();
    await expect(icon?.closest("[aria-hidden='true']")).not.toBeNull();
    const description = option.querySelector(".ds-menu__option-description");
    await expect(description).not.toBeNull();
    // The icon comes before the label in the DOM, the description after it.
    const text = option.textContent ?? "";
    await expect(text.indexOf("Brand Canvas")).toBeLessThan(text.indexOf("พื้นที่รวม"));
    // An option without a description carries no description and no empty line.
    const plain = within(listbox).getByRole("option", { name: "ผลิตภัณฑ์" });
    await expect(plain).not.toHaveAttribute("aria-describedby");
    await expect(plain.querySelector(".ds-menu__option-description")).toBeNull();
    await userEvent.click(option);
    await waitFor(() => expect(body().queryByRole("listbox")).toBeNull());
    // AC 2: the trigger shows the icon and the label, never the description.
    await expect(trigger).toHaveTextContent("Brand Canvas");
    await expect(trigger).not.toHaveTextContent("พื้นที่รวม");
    await expect(trigger.querySelector("svg")).not.toBeNull();
    await expect(trigger.querySelector(".ds-menu__option-description")).toBeNull();
  },
};

/** AC 3: groups with headings; arrow keys and type-ahead cross groups; an empty group is not rendered. */
export const Grouped: Story = {
  decorators: [inField],
  render: () => <Select groups={groups} />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("combobox", { name: "โมดูล" });
    await userEvent.click(trigger);
    const listbox = await body().findByRole("listbox");
    const found = within(listbox).getAllByRole("group");
    await expect(found).toHaveLength(2);
    await expect(within(listbox).getByRole("group", { name: "ออกแบบ" })).toBeVisible();
    await expect(within(listbox).getByRole("group", { name: "ส่งมอบ" })).toBeVisible();
    await expect(within(listbox).queryByText("ไม่มีรายการ")).toBeNull();
    const highlighted = () => listbox.querySelector("[data-highlighted]")?.textContent ?? "";
    // The first option is highlighted on open; ArrowDown walks into the next group.
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await waitFor(() => expect(highlighted()).toContain("Review"));
    // Type-ahead runs across groups: "B" goes back to Brand Canvas in the first group.
    await userEvent.keyboard("b");
    await waitFor(() => expect(highlighted()).toContain("Brand Canvas"));
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(body().queryByRole("listbox")).toBeNull());
    await expect(trigger).toHaveTextContent("Brand Canvas");
  },
};

/** The length a token resolves to at `el`, in px, as the browser computes it. */
function resolvedLength(el: Element, token: string): number {
  const probe = document.createElement("span");
  probe.style.display = "block";
  probe.style.width = `var(${token})`;
  el.append(probe);
  const px = parseFloat(getComputedStyle(probe).width);
  probe.remove();
  return px;
}

/** ORV-204 rows 1 to 3: the selected described option is one rounded card, the line sits evenly
 * between its groups, each heading sits on its own options, the disabled option reads in
 * `text.disabled`, and the panel takes the overlay radius. Every value is compared with the
 * resolved token, so the play holds under any profile the boundary sets. */
export const GroupedSelectedDescribed: Story = {
  decorators: [inField],
  render: () => <Select groups={groups} defaultValue="design-system" />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("combobox", { name: "โมดูล" }));
    const listbox = await body().findByRole("listbox");
    const checked = within(listbox).getByRole("option", { name: "Design System" });
    await expect(checked).toHaveAttribute("aria-selected", "true");
    // menu-option-radius-1: one radius whatever the line count.
    const mediaRadius = resolvedLength(listbox, "--ds-shape-media-radius");
    await expect(parseFloat(getComputedStyle(checked).borderTopLeftRadius)).toBe(mediaRadius);
    await expect(parseFloat(getComputedStyle(checked).borderBottomRightRadius)).toBe(mediaRadius);
    // menu-separator-1: the same gap above and below the line.
    const separator = listbox.querySelector(".ds-menu__separator");
    const labels = [...listbox.querySelectorAll<HTMLElement>(".ds-menu__label")];
    await expect(separator).not.toBeNull();
    await expect(labels).toHaveLength(2);
    const nextLabel = labels[1] as HTMLElement;
    const line = (separator as Element).getBoundingClientRect();
    const gap = resolvedLength(listbox, "--ds-space-inline-lg");
    await expect(Math.round(line.top - checked.getBoundingClientRect().bottom)).toBe(gap);
    await expect(Math.round(nextLabel.getBoundingClientRect().top - line.bottom)).toBe(gap);
    // menu-label-1: each heading sits on its own options.
    const labelPad = resolvedLength(listbox, "--ds-space-inline-sm");
    for (const label of labels) {
      const style = getComputedStyle(label);
      await expect(parseFloat(style.paddingTop)).toBe(labelPad);
      await expect(parseFloat(style.paddingBottom)).toBe(labelPad);
    }
    // text-disabled-1: the disabled option reads in text.disabled.
    const disabled = within(listbox).getByRole("option", { name: "เก็บถาวรแล้ว" });
    await expect(disabled).toHaveAttribute("aria-disabled", "true");
    await expect(getComputedStyle(disabled).color).toBe(
      resolvedColor(listbox, "--ds-text-disabled"),
    );
    // The listbox clips its viewport, so one call judges the headings and every option inside it.
    expectNoGlyphClip(listbox);
    // menu-radius-1: the panel takes the overlay radius.
    const overlayRadius = resolvedLength(listbox, "--ds-shape-overlay-radius");
    await expect(parseFloat(getComputedStyle(listbox).borderTopLeftRadius)).toBe(overlayRadius);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("listbox")).toBeNull());
  },
};

/** Groups with nothing in them show the empty line, not a blank listbox. */
export const GroupedEmpty: Story = {
  decorators: [inField],
  render: () => <Select groups={[{ label: "ออกแบบ", options: [] }]} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("combobox", { name: "โมดูล" }));
    await expect(await body().findByText("ไม่มีตัวเลือก")).toBeVisible();
    await userEvent.keyboard("{Escape}");
  },
};

export const RichAt360: Story = {
  args: { options: richOptions },
  render: (args) => (
    <Narrow>
      <Field label="โมดูล">
        <Select {...args} defaultValue="long" />
      </Field>
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    await atPhoneSize(async () => {
      await userEvent.click(within(canvasElement).getByRole("combobox", { name: "โมดูล" }));
      await expectListboxInViewport();
      await userEvent.keyboard("{Escape}");
    });
  },
};

export const Invalid: Story = {
  render: (args) => (
    <div className="max-w-md">
      <Field label="โมดูล" error="เลือกโมดูลที่งานนี้สังกัด">
        <Select {...args} />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // No Field nested in a Field: a meta decorator wrapping this story would break its labels.
    await expect(canvasElement.querySelectorAll(".ds-field .ds-field")).toHaveLength(0);
  },
};

export const Disabled: Story = {
  decorators: [inField],
  args: { disabled: true, defaultValue: "canvas" },
};

/** No options yet: the list says so instead of opening blank. */
export const Empty: Story = {
  decorators: [inField],
  args: { options: [], emptyText: "ยังไม่มีโมดูล สร้างโมดูลแรกจากหน้าโปรเจกต์" },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("combobox", { name: "โมดูล" }));
    await expect(await body().findByText(/ยังไม่มีโมดูล/)).toBeVisible();
    await userEvent.keyboard("{Escape}");
  },
};

export const LongOptionAt360: Story = {
  render: (args) => (
    <Narrow>
      <Field label="โมดูล">
        <Select {...args} defaultValue="long" />
      </Field>
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    await atPhoneSize(async () => {
      await userEvent.click(within(canvasElement).getByRole("combobox", { name: "โมดูล" }));
      await expectListboxInViewport();
      await userEvent.keyboard("{Escape}");
    });
  },
};

export const RecipesAndModes: Story = {
  render: (args) => (
    <Matrix>
      <Field label="โมดูล">
        <Select {...args} defaultValue="product" />
      </Field>
      <Field label="ผิดพลาด" error="เลือกโมดูลที่งานนี้สังกัด">
        <Select {...args} />
      </Field>
      <Field label="รายละเอียด">
        <Select options={richOptions} defaultValue="canvas" />
      </Field>
      <Field label="กลุ่ม">
        <Select groups={groups} defaultValue="review" />
      </Field>
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    // No Field nested in a Field: a meta decorator wrapping this story would break its labels.
    await expect(canvasElement.querySelectorAll(".ds-field .ds-field")).toHaveLength(0);
  },
};
