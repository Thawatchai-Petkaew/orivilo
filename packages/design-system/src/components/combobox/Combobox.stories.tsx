import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentType, ReactNode } from "react";
import { expect, fireEvent, fn, userEvent, waitFor, within } from "storybook/test";
import { DesignProfileBoundary } from "../../boundary/DesignProfileBoundary";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import {
  expectEdgeInk,
  expectFrameCutsNoInk,
  expectLinesClear,
  expectSameHeight,
  inVitest,
  resolvedColor,
} from "../../testing/visual-asserts";
import { Button } from "../button/Button";
import { Dialog, DialogContent } from "../dialog/Dialog";
import { Field } from "../field/Field";
import { comboboxFixtures, fixtureOptions, fixtures } from "../fixtures";
import { ArtifactIcon, DirectionIcon } from "../icons";
import { Input } from "../input/Input";
import { Matrix, Narrow } from "../matrix";
import { Select } from "../select/Select";
import { Combobox, type ComboboxGroup, type ComboboxOption, type ComboboxProps } from "./Combobox";

/** The flat form; the grouped form is told by its own story. */
type FlatComboboxProps = Extract<ComboboxProps, { options: readonly ComboboxOption[] }>;

const meta = {
  title: "Base/Combobox",
  // The flat form; the grouped form is told by its own story.
  component: Combobox as ComponentType<FlatComboboxProps>,
  args: { options: comboboxFixtures.options },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "One value from a long list, with search (ORV-228). The editable combobox with list autocomplete and manual selection: focus stays in the input, no option is active until a key or the pointer says so, and the typed text is never the value. The filter is a rule-based substring match over the label and description, not a semantic search. The sample options are fixtures.",
      },
    },
  },
} satisfies Meta<FlatComboboxProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The strings and sample content a story and its play share, one set per locale (cbx-stories-1). */
interface Copy {
  locale: "th" | "en";
  label: string;
  error: string;
  options: readonly ComboboxOption[];
  prompt: string;
  open: string;
  close: string;
  clear: string;
  listName: string;
  one: string;
  many: (count: number) => string;
  noMatch: (query: string) => string;
  none: string;
  custom: string;
  /** Text that matches exactly one option, and that option's label. */
  query: string;
  queryLabel: string;
  /** Text that matches no option. */
  miss: string;
  description: string;
  headings: readonly [string, string];
  /** Text that leaves only the second group. */
  groupQuery: string;
  sizes: readonly [string, string, string];
}

const TH: Copy = {
  locale: "th",
  label: comboboxFixtures.label,
  error: comboboxFixtures.error,
  options: comboboxFixtures.options,
  prompt: "พิมพ์เพื่อค้นหา",
  open: "เปิดรายการ",
  close: "ปิดรายการ",
  clear: "ล้างค่าที่เลือก",
  listName: "ตัวเลือก",
  one: "พบ 1 รายการ",
  many: (count) => `พบ ${count} รายการ`,
  noMatch: (query) => `ไม่พบ "${query}" ลองคำอื่น`,
  none: "ไม่มีตัวเลือก",
  custom: "ยังไม่มีหัวข้อ เพิ่มหัวข้อก่อน",
  query: "แบรนด์",
  queryLabel: fixtures.longThai,
  miss: "ปิน",
  description: "พื้นที่รวมแหล่งข้อมูล การสังเคราะห์ และการตัดสินใจของแบรนด์",
  headings: ["งานทั่วไป", "งานอัตลักษณ์"],
  groupQuery: "ปิ่น",
  sizes: ["เล็ก", "กลาง", "ใหญ่"],
};

const EN: Copy = {
  locale: "en",
  label: comboboxFixtures.labelEn,
  error: comboboxFixtures.errorEn,
  options: comboboxFixtures.optionsEn,
  prompt: "Type to search",
  open: "Show options",
  close: "Hide options",
  clear: "Clear the choice",
  listName: "Options",
  one: "1 result",
  many: (count) => `${count} results`,
  noMatch: (query) => `No match for "${query}". Try another word.`,
  none: "No options",
  custom: "No topics yet. Add a topic first.",
  query: "canvas",
  queryLabel: "The team's Brand Canvas project",
  miss: "zzz",
  description: "One place for the sources, synthesis and decisions of a brand",
  headings: ["General work", "Identity work"],
  groupQuery: "pin",
  sizes: ["Small", "Medium", "Large"],
};

const opt = (c: Copy, value: string): ComboboxOption => {
  const found = c.options.find((option) => option.value === value);
  if (!found) throw new Error(`the fixture has no option ${value}`);
  return found;
};

const body = () => within(document.body);
const inEnglish = (Story: ComponentType) => (
  <LocaleProvider locale="en">
    <Story />
  </LocaleProvider>
);

/** One build for both locales: the Thai story, and `InEnglish`, the same render and play on the English copy. */
function twin(build: (c: Copy) => Story): { th: Story; en: Story } {
  return { th: build(TH), en: { ...build(EN), decorators: [inEnglish] } };
}

const inField = (c: Copy, node: ReactNode, error?: string) => (
  <div className="max-w-md">
    <Field label={c.label} error={error}>
      {node}
    </Field>
  </div>
);

const inputOf = (root: HTMLElement, c: Copy) =>
  within(root).getByRole("combobox", { name: c.label });
const groupOf = (input: HTMLElement) =>
  input.closest<HTMLElement>(".ds-input-group") as HTMLElement;
const statusOf = (root: HTMLElement) => within(root).getByRole("status");
const popupOf = (listbox: HTMLElement) =>
  listbox.closest<HTMLElement>(".ds-combobox__popup") as HTMLElement;
const closed = () => waitFor(() => expect(body().queryByRole("listbox")).toBeNull());

/** The label of the option the input names through `aria-activedescendant`, or null with none. */
function activeLabel(input: HTMLElement): string | null {
  const id = input.getAttribute("aria-activedescendant");
  const option = id ? document.getElementById(id) : null;
  const labelId = option?.getAttribute("aria-labelledby");
  return labelId ? (document.getElementById(labelId)?.textContent ?? null) : null;
}

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

const near = (a: number, b: number, within_ = 1) => Math.abs(a - b) <= within_;

/** Runs `check` with the browser at 360 by 640, then puts the size back; the static Storybook uses the toolbar's frame. */
async function atPhoneSize(check: () => Promise<void>) {
  if (!inVitest) return check();
  const { page } = await import("vitest/browser");
  const before = { width: window.innerWidth, height: window.innerHeight };
  const resized = async (width: number, height: number) => {
    await page.viewport(width, height);
    await waitFor(() => expect([window.innerWidth, window.innerHeight]).toEqual([width, height]));
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  };
  // The screenshot lock of `visual-asserts.ts` is held for each resize only: the helpers inside
  // `check` take the same lock for their own shots, and a Web Lock is not re-entrant.
  const resizedLocked = (width: number, height: number) =>
    navigator.locks.request("orivilo-screenshot", () => resized(width, height));
  await resizedLocked(360, 640);
  try {
    await check();
  } finally {
    await resizedLocked(before.width, before.height);
  }
}

/** cbx-ink-1: every ancestor of `el` below `frame` leaves its overflow visible, so the frame is the one clip. */
function expectNoClipBetween(el: HTMLElement, frame: HTMLElement) {
  for (let node = el.parentElement; node && node !== frame; node = node.parentElement) {
    const style = getComputedStyle(node);
    expect([style.overflowX, style.overflowY], `${node.className} clips`).toEqual([
      "visible",
      "visible",
    ]);
  }
}

// --- Default (rows 1, 2, 3 and the focus step of 28) -------------------------------------------

const defaults = twin((c) => ({
  render: (args) => inField(c, <Combobox {...args} options={c.options} />),
  play: async ({ canvasElement }) => {
    const input = inputOf(canvasElement, c);
    await expect(input).toHaveAttribute("aria-expanded", "false");
    await expect(input).toHaveAttribute("aria-autocomplete", "list");
    await expect(input).not.toHaveAttribute("aria-controls");
    await expect(input).not.toHaveAttribute("aria-activedescendant");
    await expect(input).not.toHaveAttribute("aria-haspopup");
    await expect(input).toHaveAttribute("placeholder", c.prompt);
    await expect(within(canvasElement).getByRole("button", { name: c.open })).toBeVisible();
    // Interaction state: Tab puts focus in the input and opens nothing.
    await userEvent.tab();
    await expect(input).toHaveFocus();
    await expect(body().queryByRole("listbox")).toBeNull();
    // Row 2: a typed word opens a list of one option, none of them marked.
    await userEvent.type(input, c.query);
    const listbox = await body().findByRole("listbox", { name: c.listName });
    await expect(within(listbox).getAllByRole("option")).toHaveLength(1);
    await expect(input).toHaveAttribute("aria-expanded", "true");
    await expect(input).toHaveAttribute("aria-controls", listbox.id);
    await expect(input).not.toHaveAttribute("aria-activedescendant");
    await expect(statusOf(canvasElement)).toHaveTextContent(c.one);
    await userEvent.keyboard("{Escape}");
    await closed();
  },
}));
export const Default: Story = defaults.th;
export const DefaultInEnglish: Story = defaults.en;

// --- Sizes (row 17) ----------------------------------------------------------------------------

const SIZES = ["sm", "md", "lg"] as const;

const sizes = twin((c) => ({
  render: (args) => (
    <div className="flex max-w-3xl flex-col gap-4">
      {SIZES.map((size, i) => (
        <div key={size} data-testid={size} className="grid grid-cols-3 items-start gap-4">
          <Combobox
            {...args}
            options={c.options}
            size={size}
            defaultValue={opt(c, "latin")}
            clearable
            aria-label={`${c.label} ${c.sizes[i]}`}
          />
          <Select
            size={size}
            options={fixtureOptions}
            defaultValue="canvas"
            aria-label={`Select ${c.sizes[i]}`}
          />
          <Input size={size} aria-label={`Input ${c.sizes[i]}`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // No Field nested in a Field: a meta decorator wrapping this story would break its labels.
    await expect(canvasElement.querySelectorAll(".ds-field .ds-field")).toHaveLength(0);
    for (const [i, size] of SIZES.entries()) {
      const row = canvas.getByTestId(size);
      const input = within(row).getByRole("combobox", { name: `${c.label} ${c.sizes[i]}` });
      const group = groupOf(input);
      const select = within(row).getByRole("combobox", { name: `Select ${c.sizes[i]}` });
      const plain = within(row).getByRole("textbox", { name: `Input ${c.sizes[i]}` });
      expectSameHeight(group, plain);
      const control = resolvedLength(row, `--ds-size-control-${size}`);
      expect(
        near(group.getBoundingClientRect().height, control, 0.5),
        `${size} field is ${group.getBoundingClientRect().height} tall, expected ${control}`,
      ).toBe(true);
      // The slot buttons are square: 24, 30 and 38 px (W6), and do not overlap.
      const inset = resolvedLength(row, "--cmp-input-group-inset");
      const side =
        size === "sm" ? resolvedLength(row, "--ds-size-icon-lg") : control - 2 - 2 * inset;
      const clear = within(row).getByRole("button", { name: c.clear });
      const chevron = within(row).getByRole("button", { name: c.open });
      for (const button of [clear, chevron]) {
        const box = button.getBoundingClientRect();
        expect(
          near(box.width, side, 0.5),
          `${size} slot button is ${box.width} wide, expected ${side}`,
        ).toBe(true);
        expect(
          near(box.height, side, 0.5),
          `${size} slot button is ${box.height} tall, expected ${side}`,
        ).toBe(true);
        await expect(box.width).toBeGreaterThanOrEqual(24);
      }
      await expect(clear.getBoundingClientRect().right).toBeLessThanOrEqual(
        chevron.getBoundingClientRect().left,
      );
      // One control with Select: the chevron glyph sits as far from the end, in the same ink.
      const glyph = chevron.querySelector("svg") as SVGElement;
      const selectGlyph = select.querySelector("svg") as SVGElement;
      const fromEnd = (outer: Element, inner: Element) => {
        const box = inner.getBoundingClientRect();
        return outer.getBoundingClientRect().right - (box.left + box.right) / 2;
      };
      expect(
        near(fromEnd(group, glyph), fromEnd(select, selectGlyph), 1),
        `${size} chevron centre is ${fromEnd(group, glyph)} from the end, Select's is ${fromEnd(select, selectGlyph)}`,
      ).toBe(true);
      await expect(getComputedStyle(chevron).color).toBe(getComputedStyle(selectGlyph).color);
      // An open option row meets SC 2.5.8.
      await userEvent.click(chevron);
      const listbox = await body().findByRole("listbox");
      await expect(
        within(listbox).getAllByRole("option")[0]?.getBoundingClientRect().height,
      ).toBeGreaterThanOrEqual(24);
      await userEvent.keyboard("{Escape}");
      await closed();
    }
  },
}));
export const Sizes: Story = sizes.th;
export const SizesInEnglish: Story = sizes.en;

// --- WithValue and Missing (row 20) ------------------------------------------------------------

const withValue = twin((c) => ({
  render: (args) =>
    inField(
      c,
      <Combobox {...args} options={c.options} defaultValue={opt(c, "canvas")} name="topic" />,
    ),
  play: async ({ canvasElement }) => {
    await expect(inputOf(canvasElement, c)).toHaveValue(opt(c, "canvas").label);
    const hidden = canvasElement.querySelector<HTMLInputElement>("input[type=hidden][name=topic]");
    await expect(hidden?.value).toBe("canvas");
  },
}));
export const WithValue: Story = withValue.th;
export const WithValueInEnglish: Story = withValue.en;

const missing = twin((c) => ({
  render: (args) =>
    inField(c, <Combobox {...args} options={c.options} defaultValue={null} name="topic" />),
  play: async ({ canvasElement }) => {
    const input = inputOf(canvasElement, c);
    await expect(input).toHaveValue("");
    await expect(input).toHaveAttribute("placeholder", c.prompt);
    await expect(canvasElement.querySelector("input[type=hidden]")).toBeNull();
  },
}));
export const Missing: Story = missing.th;
export const MissingInEnglish: Story = missing.en;

// --- Open (rows 4 and the hover step of 28) ----------------------------------------------------

const openList = twin((c) => ({
  render: (args) => inField(c, <Combobox {...args} options={c.options} />),
  play: async ({ canvasElement }) => {
    const input = inputOf(canvasElement, c);
    await userEvent.click(within(canvasElement).getByRole("button", { name: c.open }));
    const listbox = await body().findByRole("listbox", { name: c.listName });
    await expect(within(listbox).getAllByRole("option")).toHaveLength(7);
    await within(canvasElement).findByRole("button", { name: c.close });
    await expect(statusOf(canvasElement)).toHaveTextContent(c.many(7));
    await expect(input).toHaveFocus();
    // The real popup: the field's width and start edge, 4 px under the field (A1).
    const group = groupOf(input);
    const popup = popupOf(listbox);
    await waitFor(() => {
      const field = group.getBoundingClientRect();
      const box = popup.getBoundingClientRect();
      expect(near(box.width, field.width), `popup width ${box.width} of ${field.width}`).toBe(true);
      expect(near(box.left, field.left), `popup left ${box.left} of ${field.left}`).toBe(true);
      expect(near(box.top, field.bottom + 4), `popup top ${box.top} of ${field.bottom}`).toBe(true);
    });
    // Hover is an interaction state: the pointer marks an option.
    const logo = within(listbox).getByRole("option", { name: opt(c, "logo").label });
    await userEvent.hover(logo);
    await waitFor(() => expect(logo).toHaveAttribute("data-highlighted"));
    await userEvent.click(within(canvasElement).getByRole("button", { name: c.close }));
    await closed();
    await expect(within(canvasElement).getByRole("button", { name: c.open })).toBeVisible();
    await expect(input).toHaveFocus();
  },
}));
export const Open: Story = openList.th;
export const OpenInEnglish: Story = openList.en;

// --- ActiveOnChosen (row 11) -------------------------------------------------------------------

const activeOnChosen = twin((c) => ({
  render: (args) =>
    inField(c, <Combobox {...args} options={c.options} defaultValue={opt(c, "latin")} />),
  play: async ({ canvasElement }) => {
    const input = inputOf(canvasElement, c);
    await userEvent.click(within(canvasElement).getByRole("button", { name: c.open }));
    const listbox = await body().findByRole("listbox");
    const chosen = within(listbox).getByRole("option", { name: opt(c, "latin").label });
    await expect(chosen).toHaveAttribute("data-state", "checked");
    await expect(chosen).not.toHaveAttribute("data-highlighted");
    if (inVitest) await expectEdgeInk(chosen, ["top", "right", "bottom", "left"], 0, 8);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await waitFor(() => expect(activeLabel(input)).toBe(opt(c, "latin").label));
    await expect(chosen).toHaveAttribute("data-highlighted");
    // Chosen and active: the focus colour as a 1 px line on the option's edge, besides the fill.
    await expect(getComputedStyle(chosen).outlineWidth).toBe("1px");
    await expect(getComputedStyle(chosen).outlineColor).toBe(
      resolvedColor(chosen.parentElement as HTMLElement, "--ds-focus-ring"),
    );
    // Ink on the edge: the 1 px line plus the 3 px inner halo of the focus form, 4 px in all.
    if (inVitest) await expectEdgeInk(chosen, ["top", "right", "bottom", "left"], 4, 8);
    await userEvent.keyboard("{ArrowUp}");
    await waitFor(() => expect(chosen).not.toHaveAttribute("data-highlighted"));
    await userEvent.keyboard("{Escape}");
    await closed();
  },
}));
export const ActiveOnChosen: Story = activeOnChosen.th;
export const ActiveOnChosenInEnglish: Story = activeOnChosen.en;

// --- NoMatch and NoOptions (rows 14, 15) -------------------------------------------------------

const noMatch = twin((c) => ({
  render: (args) => inField(c, <Combobox {...args} options={c.options} />),
  play: async ({ canvasElement }) => {
    const input = inputOf(canvasElement, c);
    const status = statusOf(canvasElement);
    await userEvent.type(input, c.miss);
    const text = c.noMatch(c.miss);
    const line = await body().findByText(text, { selector: ".ds-menu__empty > span" });
    await expect(line.closest(".ds-menu__empty")).not.toHaveAttribute("role");
    await expect(body().queryByRole("listbox")).toBeNull();
    await expect(input).toHaveAttribute("aria-expanded", "false");
    await expect(input).not.toHaveAttribute("aria-controls");
    // The one live region stays the same node and says the same thing.
    await expect(statusOf(canvasElement)).toBe(status);
    await expect(status).toHaveTextContent(text);
    await userEvent.keyboard("{Escape}");
  },
}));
export const NoMatch: Story = noMatch.th;
export const NoMatchInEnglish: Story = noMatch.en;

const noOptions = twin((c) => ({
  render: () => (
    <div className="flex max-w-md flex-col gap-4">
      <Field label={c.label}>
        <Combobox options={[]} />
      </Field>
      <Field label={`${c.label} 2`}>
        <Combobox options={[]} emptyText={c.custom} />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const [name, text] of [
      [c.label, c.none],
      [`${c.label} 2`, c.custom],
    ] as const) {
      const input = canvas.getByRole("combobox", { name });
      const root = input.closest<HTMLElement>(".ds-combobox") as HTMLElement;
      await userEvent.click(within(root).getByRole("button", { name: c.open }));
      await expect(
        await body().findByText(text, { selector: ".ds-menu__empty > span" }),
      ).toBeVisible();
      await expect(within(root).getByRole("status")).toHaveTextContent(text);
      await expect(body().queryByRole("listbox")).toBeNull();
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(body().queryByText(text)).toBeNull());
    }
  },
}));
export const NoOptions: Story = noOptions.th;
export const NoOptionsInEnglish: Story = noOptions.en;

// --- Grouped and IconsAndDescriptions (row 16) -------------------------------------------------

const grouped = twin((c) => {
  const groups: readonly ComboboxGroup[] = [
    { label: c.headings[0], options: [{ ...opt(c, "save"), icon: <ArtifactIcon /> }] },
    { label: c.headings[1], options: [{ ...opt(c, "pinto"), icon: <DirectionIcon /> }] },
  ];
  return {
    render: () => inField(c, <Combobox groups={groups} />),
    play: async ({ canvasElement }) => {
      const input = inputOf(canvasElement, c);
      await userEvent.click(within(canvasElement).getByRole("button", { name: c.open }));
      let listbox = await body().findByRole("listbox");
      await expect(within(listbox).getAllByRole("group")).toHaveLength(2);
      await userEvent.type(input, c.groupQuery);
      await waitFor(() => expect(within(listbox).getAllByRole("group")).toHaveLength(1));
      listbox = body().getByRole("listbox");
      const group = within(listbox).getByRole("group", { name: c.headings[1] });
      await expect(
        within(group).getByRole("option", { name: opt(c, "pinto").label }),
      ).toBeVisible();
      await expect(within(listbox).queryByRole("group", { name: c.headings[0] })).toBeNull();
      await userEvent.keyboard("{Escape}");
      await closed();
    },
  };
});
export const Grouped: Story = grouped.th;
export const GroupedInEnglish: Story = grouped.en;

const iconsAndDescriptions = twin((c) => {
  const options: readonly ComboboxOption[] = [
    { ...opt(c, "canvas"), icon: <ArtifactIcon />, description: c.description },
    { ...opt(c, "pinto"), icon: <DirectionIcon /> },
  ];
  return {
    render: () => inField(c, <Combobox options={options} />),
    play: async ({ canvasElement }) => {
      const input = inputOf(canvasElement, c);
      await userEvent.click(within(canvasElement).getByRole("button", { name: c.open }));
      const listbox = await body().findByRole("listbox");
      const described = within(listbox).getByRole("option", { name: opt(c, "canvas").label });
      // The name stays the label; the second line is the description.
      await expect(described).toHaveAccessibleName(opt(c, "canvas").label);
      await expect(described).toHaveAccessibleDescription(c.description);
      const icon = described.querySelector("svg");
      await expect(icon?.closest("[aria-hidden='true']")).not.toBeNull();
      const plain = within(listbox).getByRole("option", { name: opt(c, "pinto").label });
      await expect(plain).not.toHaveAttribute("aria-describedby");
      await expect(plain.querySelector(".ds-menu__option-description")).toBeNull();
      await userEvent.click(described);
      await closed();
      await expect(input).toHaveValue(opt(c, "canvas").label);
      await expect(input).not.toHaveValue(expect.stringContaining(c.description));
    },
  };
});
export const IconsAndDescriptions: Story = iconsAndDescriptions.th;
export const IconsAndDescriptionsInEnglish: Story = iconsAndDescriptions.en;

// --- Clearable (row 18) ------------------------------------------------------------------------

const clearable = twin((c) => ({
  args: { onValueChange: fn() },
  render: (args) =>
    inField(c, <Combobox {...args} options={c.options} defaultValue={opt(c, "latin")} clearable />),
  play: async ({ canvasElement, args }) => {
    const input = inputOf(canvasElement, c);
    await expect(input).toHaveValue(opt(c, "latin").label);
    await userEvent.tab();
    await expect(input).toHaveFocus();
    await userEvent.tab();
    const clear = within(canvasElement).getByRole("button", { name: c.clear });
    await expect(clear).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(input).toHaveValue("");
    await expect(within(canvasElement).queryByRole("button", { name: c.clear })).toBeNull();
    await expect(input).toHaveFocus();
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenCalledWith(null);
  },
}));
export const Clearable: Story = clearable.th;
export const ClearableInEnglish: Story = clearable.en;

// --- Invalid, Disabled, DisabledOption (row 19) ------------------------------------------------

const invalid = twin((c) => ({
  render: (args) => inField(c, <Combobox {...args} options={c.options} />, c.error),
  play: async ({ canvasElement }) => {
    // No Field nested in a Field: a meta decorator wrapping this story would break its labels.
    await expect(canvasElement.querySelectorAll(".ds-field .ds-field")).toHaveLength(0);
    const input = inputOf(canvasElement, c);
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleDescription(c.error);
    await expect(within(canvasElement).getByText(c.error)).toBeVisible();
  },
}));
export const Invalid: Story = invalid.th;
export const InvalidInEnglish: Story = invalid.en;

const disabled = twin((c) => ({
  render: (args) =>
    inField(c, <Combobox {...args} options={c.options} defaultValue={opt(c, "latin")} disabled />),
  play: async ({ canvasElement }) => {
    const input = inputOf(canvasElement, c);
    await expect(input).toBeDisabled();
    await expect(within(canvasElement).getByRole("button", { name: c.open })).toBeDisabled();
    await userEvent.click(input);
    await userEvent.keyboard("{ArrowDown}");
    await expect(body().queryByRole("listbox")).toBeNull();
  },
}));
export const Disabled: Story = disabled.th;
export const DisabledInEnglish: Story = disabled.en;

const disabledOption = twin((c) => ({
  args: { onValueChange: fn() },
  render: (args) => inField(c, <Combobox {...args} options={c.options} />),
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: c.open }));
    const listbox = await body().findByRole("listbox");
    const closedOption = within(listbox).getByRole("option", { name: opt(c, "closed").label });
    await expect(closedOption).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(closedOption);
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await expect(body().getByRole("listbox")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await closed();
  },
}));
export const DisabledOption: Story = disabledOption.th;
export const DisabledOptionInEnglish: Story = disabledOption.en;

// --- Stories with no English twin --------------------------------------------------------------

/** Rows 3, 5, 6, 7, 8 and 9: the keys of the editable pattern, with the list opening and closing as the table says. */
export const Keyboard: Story = {
  args: { onValueChange: fn() },
  render: (args) => (
    <div className="max-w-md">
      <Field label={TH.label}>
        <Combobox {...args} options={TH.options} />
      </Field>
      <Button variant="secondary">ถัดไป</Button>
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const c = TH;
    const input = inputOf(canvasElement, c);
    const names = (...values: string[]) => values.map((value) => opt(c, value).label);
    // Row 3: Tab and a click put focus in the input and open nothing.
    await userEvent.tab();
    await expect(input).toHaveFocus();
    const edge = getComputedStyle(groupOf(input));
    // The border colour transitions; read it once it has settled.
    // The ring is read once: a probe added inside waitFor would re-trigger its own observer.
    const ring = resolvedColor(canvasElement, "--ds-focus-ring");
    await waitFor(() => expect(edge.borderTopColor).toBe(ring));
    await expect(edge.boxShadow).toMatch(/ 0px 0px 0px 3px$/);
    await userEvent.click(input);
    await expect(input).toHaveAttribute("aria-expanded", "false");
    await expect(body().queryByRole("listbox")).toBeNull();
    // Row 5: the mark moves down, skips the disabled option, comes back and wraps.
    const walked: (string | null)[] = [];
    for (const key of ["Down", "Down", "Down", "Up", "Up", "Up"]) {
      await userEvent.keyboard(`{Arrow${key}}`);
      walked.push(activeLabel(input));
    }
    await expect(walked).toEqual(names("save", "latin", "canvas", "latin", "save", "long"));
    const listbox = await body().findByRole("listbox");
    await expect(listbox.querySelectorAll("[data-highlighted]")).toHaveLength(1);
    for (const option of within(listbox).getAllByRole("option")) {
      await expect(option).toHaveAttribute("aria-selected", "false");
    }
    await userEvent.keyboard("{Escape}");
    await closed();
    // Row 7: Escape keeps the text; Alt + Down opens with no option marked; Alt + Up closes.
    await userEvent.type(input, "ปิ่");
    await body().findByRole("listbox");
    await userEvent.keyboard("{Escape}");
    await closed();
    await expect(input).toHaveValue("ปิ่");
    await expect(input).toHaveAttribute("aria-expanded", "false");
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await body().findByRole("listbox");
    await expect(input).toHaveAttribute("aria-expanded", "true");
    await expect(input).not.toHaveAttribute("aria-activedescendant");
    await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");
    await closed();
    await expect(input).toHaveAttribute("aria-expanded", "false");
    await expect(args.onValueChange).not.toHaveBeenCalled();
    // Row 8: Home and End, and Left Arrow takes the mark away; a letter does too.
    await userEvent.clear(input);
    await expect(await body().findAllByRole("option")).toHaveLength(7);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    await expect(activeLabel(input)).toBe(opt(c, "canvas").label);
    const moved: (string | null)[] = [];
    for (const key of ["End", "Home", "ArrowLeft"]) {
      await userEvent.keyboard(`{${key}}`);
      moved.push(activeLabel(input));
    }
    await userEvent.keyboard("{ArrowDown}");
    moved.push(activeLabel(input));
    await userEvent.keyboard("ก");
    moved.push(activeLabel(input));
    await expect(moved).toEqual([
      opt(c, "long").label,
      opt(c, "save").label,
      null,
      opt(c, "save").label,
      null,
    ]);
    await expect(input).toHaveValue("ก");
    // Row 6: Enter chooses the marked option and closes the list; the next Down reopens the whole list.
    await userEvent.clear(input);
    await body().findByRole("listbox");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    await closed();
    await expect(input).toHaveValue(opt(c, "latin").label);
    await expect(input).toHaveFocus();
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenLastCalledWith(opt(c, "latin"));
    await userEvent.keyboard("{ArrowDown}");
    const reopened = await body().findByRole("listbox");
    const options = within(reopened).getAllByRole("option");
    await expect(options).toHaveLength(7);
    for (const option of options) {
      const isLatin = option.textContent === opt(c, "latin").label;
      await expect(option).toHaveAttribute("aria-selected", isLatin ? "true" : "false");
      await expect(option.querySelector("svg") !== null).toBe(isLatin);
    }
    // Row 9: edited text reverts on Tab, the list closes, nothing is chosen.
    await userEvent.keyboard("{Escape}");
    await closed();
    await userEvent.type(input, "abc");
    await expect(input).toHaveValue(`${opt(c, "latin").label}abc`);
    await userEvent.tab();
    await expect(within(canvasElement).getByRole("button", { name: "ถัดไป" })).toHaveFocus();
    await expect(input).toHaveValue(opt(c, "latin").label);
    await expect(body().queryByRole("listbox")).toBeNull();
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
  },
};

/** Row 10: the pointer marks an option and a press chooses it; a press outside closes the list. */
export const Pointer: Story = {
  args: { onValueChange: fn() },
  render: (args) => (
    <div className="max-w-md">
      <Field label={TH.label}>
        <Combobox {...args} options={TH.options} />
      </Field>
      <p data-testid="outside" className="mt-8">
        {fixtures.mixed}
      </p>
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const c = TH;
    const input = inputOf(canvasElement, c);
    const open = () => userEvent.click(within(canvasElement).getByRole("button", { name: c.open }));
    await open();
    const listbox = await body().findByRole("listbox");
    const logo = within(listbox).getByRole("option", { name: opt(c, "logo").label });
    await userEvent.hover(logo);
    await waitFor(() => expect(activeLabel(input)).toBe(opt(c, "logo").label));
    await expect(logo).toHaveAttribute("data-highlighted");
    await userEvent.click(logo);
    await closed();
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenCalledWith(opt(c, "logo"));
    await expect(input).toHaveFocus();
    await expect(input).toHaveValue(opt(c, "logo").label);
    await open();
    await body().findByRole("listbox");
    // The press lands outside the field; Radix attaches its listener a tick after mount, so wait for the result.
    await waitFor(async () => {
      await userEvent.click(within(canvasElement).getByTestId("outside"));
      await expect(body().queryByRole("listbox")).toBeNull();
    });
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
  },
};

/** Row 12: 40 options. The popup stops at the cap and the marked option stays in view. */
export const LongList: Story = {
  render: (args) => (
    <div className="max-w-md">
      <Field label={TH.label}>
        <Combobox {...args} options={comboboxFixtures.long} />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const input = inputOf(canvasElement, TH);
    await userEvent.click(within(canvasElement).getByRole("button", { name: TH.open }));
    const listbox = await body().findByRole("listbox");
    await userEvent.keyboard("{ArrowDown}".repeat(30));
    await waitFor(() => expect(activeLabel(input)).toBe("ตัวเลือกที่ 30"));
    const active = document.getElementById(
      input.getAttribute("aria-activedescendant") ?? "",
    ) as HTMLElement;
    await waitFor(() => {
      const inside = listbox.getBoundingClientRect();
      const row = active.getBoundingClientRect();
      expect(row.top).toBeGreaterThanOrEqual(inside.top - 1);
      expect(row.bottom).toBeLessThanOrEqual(inside.bottom + 1);
    });
    await expect(listbox.scrollTop).toBeGreaterThan(0);
    // The cap of A1 on real Radix values: the field is near the top, so the cap decides.
    const cap = resolvedLength(listbox, "--ds-size-panel-default");
    await expect(near(popupOf(listbox).getBoundingClientRect().height, cap)).toBe(true);
    await userEvent.keyboard("{Escape}");
    await closed();
  },
};

/** Row 13: Enter that commits an IME composition chooses nothing. */
export const Composition: Story = {
  args: { onValueChange: fn() },
  render: (args) => inField(TH, <Combobox {...args} options={TH.options} />),
  play: async ({ canvasElement, args }) => {
    const input = inputOf(canvasElement, TH);
    input.focus();
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(activeLabel(input)).toBe(opt(TH, "save").label));
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    await expect(args.onValueChange).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input);
    // The flag clears a tick after compositionend, so Enter lands once that has passed.
    await waitFor(() => {
      fireEvent.keyDown(input, { key: "Enter" });
      expect(args.onValueChange).toHaveBeenCalledTimes(1);
    });
    await expect(args.onValueChange).toHaveBeenCalledWith(opt(TH, "save"));
  },
};

/** Row 21: the popup is rendered in a portal and still carries the field's profile. */
export const InsideProfile: Story = {
  render: (args) => (
    <DesignProfileBoundary profile="friendly" mode="dark">
      <div className="max-w-md rounded-container bg-surface-canvas p-4 font-body text-text-primary">
        <Field label={TH.label}>
          <Combobox {...args} options={TH.options} />
        </Field>
      </div>
    </DesignProfileBoundary>
  ),
  play: async ({ canvasElement }) => {
    const input = inputOf(canvasElement, TH);
    await userEvent.click(within(canvasElement).getByRole("button", { name: TH.open }));
    const listbox = await body().findByRole("listbox");
    const scope = listbox.closest<HTMLElement>("[data-design-profile]");
    await expect(scope?.dataset["designProfile"]).toBe("friendly");
    await expect(scope?.dataset["mode"]).toBe("dark");
    const read = (el: Element) =>
      getComputedStyle(el).getPropertyValue("--ds-action-primary").trim();
    await expect(read(listbox)).toBe(read(input));
    await userEvent.keyboard("{Escape}");
    await closed();
  },
};

/** Row 21: inside a Dialog the first Escape closes the list only, the second the dialog. */
export const InsideDialog: Story = {
  render: (args) => (
    <Dialog defaultOpen>
      <DialogContent title={TH.label}>
        <Field label={TH.label}>
          <Combobox {...args} options={TH.options} />
        </Field>
      </DialogContent>
    </Dialog>
  ),
  play: async () => {
    const dialog = await body().findByRole("dialog");
    const input = within(dialog).getByRole("combobox", { name: TH.label });
    const open = async () => {
      await userEvent.click(within(dialog).getByRole("button", { name: TH.open }));
      return body().findByRole("listbox");
    };
    let listbox = await open();
    await userEvent.click(within(listbox).getByRole("option", { name: opt(TH, "pinto").label }));
    await closed();
    await expect(input).toHaveValue(opt(TH, "pinto").label);
    listbox = await open();
    await expect(listbox).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await closed();
    await expect(body().getByRole("dialog")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  },
};

/** Row 22: at 360 px the field and its list stay inside the frame, and Thai ink stays whole. */
export const At360: Story = {
  render: () => (
    <Narrow>
      <div data-testid="frame" className="relative h-[340px] w-[360px] max-w-full">
        <Field label={TH.label}>
          <Combobox options={TH.options} />
        </Field>
        <div className="absolute inset-x-0 top-[240px]">
          <Field label={`${TH.label} 2`}>
            <Combobox options={comboboxFixtures.long} />
          </Field>
        </div>
      </div>
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    await atPhoneSize(async () => {
      const frame = within(canvasElement).getByTestId("frame");
      const input = inputOf(canvasElement, TH);
      await userEvent.click(
        within(canvasElement).getAllByRole("button", { name: TH.open })[0] as HTMLElement,
      );
      let listbox = await body().findByRole("listbox");
      const inside = (el: Element) => {
        const box = el.getBoundingClientRect();
        expect(box.left).toBeGreaterThanOrEqual(0);
        expect(box.right).toBeLessThanOrEqual(window.innerWidth);
      };
      inside(popupOf(listbox));
      await expect(frame.scrollWidth).toBeLessThanOrEqual(360);
      const label = within(listbox)
        .getByRole("option", { name: opt(TH, "pinto").label })
        .querySelector<HTMLElement>(":scope > span:first-child") as HTMLElement;
      expectNoClipBetween(label, listbox);
      if (inVitest) await expectFrameCutsNoInk(label, listbox);
      const long = within(listbox).getByRole("option", { name: fixtures.longThai });
      const longLabel = long.querySelector<HTMLElement>(":scope > span:first-child") as HTMLElement;
      await expect(longLabel.scrollWidth).toBeGreaterThan(longLabel.clientWidth);
      // The query wraps on the panel's line instead of leaving the panel.
      await userEvent.type(input, `${fixtures.longThai}x`);
      const line = await body().findByText(TH.noMatch(`${fixtures.longThai}x`), {
        selector: ".ds-menu__empty > span",
      });
      const popup = popupOf(line);
      inside(popup);
      await expect(line.getBoundingClientRect().right).toBeLessThanOrEqual(
        popup.getBoundingClientRect().right,
      );
      expectNoClipBetween(line, popup);
      if (inVitest) {
        await expectLinesClear(line);
        await expectFrameCutsNoInk(line, popup);
      }
      // A word without a break point wraps too: `overflow-wrap` on the line, not the Thai line breaker.
      const unbroken = "w".repeat(80);
      await userEvent.clear(input);
      await userEvent.type(input, unbroken);
      const wide = await body().findByText(TH.noMatch(unbroken), {
        selector: ".ds-menu__empty > span",
      });
      inside(popupOf(wide));
      await expect(wide.getBoundingClientRect().right).toBeLessThanOrEqual(
        popupOf(wide).getBoundingClientRect().right,
      );
      // A second field low in the frame: Radix's available height decides, not the cap.
      await userEvent.keyboard("{Escape}");
      await closed();
      await userEvent.click(
        within(canvasElement).getAllByRole("button", { name: TH.open })[1] as HTMLElement,
      );
      await waitFor(() => expect(body().getAllByRole("listbox")).toHaveLength(1));
      listbox = body().getByRole("listbox");
      // Read once: a probe added inside waitFor would re-trigger its own observer.
      const cap = resolvedLength(listbox, "--ds-size-panel-default");
      await waitFor(() => {
        const box = popupOf(listbox).getBoundingClientRect();
        expect(box.top).toBeGreaterThanOrEqual(0);
        expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
        expect(box.height).toBeLessThan(cap);
      });
      await userEvent.keyboard("{Escape}");
      await closed();
    });
  },
};

/** Row 23: the same field under every profile in both modes; each popup carries its cell's boundary. */
export const RecipesAndModes: Story = {
  render: (args) => (
    <Matrix>
      <Field label={TH.label}>
        <Combobox {...args} options={TH.options} defaultValue={opt(TH, "pinto")} />
      </Field>
      <Field label={`${TH.label} ผิดพลาด`} error={TH.error}>
        <Combobox {...args} options={TH.options} />
      </Field>
      <Field label={`${TH.label} ปิดใช้`} disabled>
        <Combobox {...args} options={TH.options} defaultValue={opt(TH, "latin")} />
      </Field>
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    // No Field nested in a Field: a meta decorator wrapping this story would break its labels.
    await expect(canvasElement.querySelectorAll(".ds-field .ds-field")).toHaveLength(0);
    const cells = canvasElement.querySelectorAll<HTMLElement>("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    for (const cell of cells) {
      await userEvent.click(
        within(cell).getAllByRole("button", { name: TH.open })[0] as HTMLElement,
      );
      const listbox = await body().findByRole("listbox");
      const scope = listbox.closest<HTMLElement>("[data-design-profile]");
      await expect(scope?.dataset["designProfile"]).toBe(cell.dataset["matrixProfile"]);
      await expect(scope?.dataset["mode"]).toBe(cell.dataset["matrixMode"]);
      await userEvent.keyboard("{Escape}");
      await closed();
    }
  },
};
