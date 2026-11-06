import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { formatDate } from "../../i18n/date";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import {
  expectFocusBorderForm,
  expectLabelInkWhole,
  expectSameHeight,
  inVitest,
  resolvedColor,
} from "../../testing/visual-asserts";
import { calendarFixtures as c } from "../fixtures";
import { Matrix, Narrow } from "../matrix";
import { Calendar } from "./Calendar";

const meta = {
  title: "Base/Calendar",
  component: Calendar,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A month grid for one date (ORV-231). Every date in and out is a `YYYY-MM-DD` Gregorian string; Thai shows the Buddhist Era year only in the text it draws, and the stored value never carries it. Every date in these stories is mock data from the fixtures, fixed around 6 November 2026 so no story reads the clock. The keys and the grid come from React DayPicker (ADR 0020); the look, the words and the buttons are ours. Pass `months={1}` below the `md` breakpoint: two months need a viewport of about 690 px and stack under it. A range comes with its own story.",
      },
    },
  },
  args: { today: c.today },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The calendars under `scope`, in document order. */
const calendars = (scope: HTMLElement) =>
  Array.from(scope.querySelectorAll<HTMLElement>(".ds-calendar"));

/** The button of one day by its `YYYY-MM-DD` date. */
function dayButton(scope: HTMLElement, iso: string): HTMLButtonElement {
  const found = scope.querySelector<HTMLButtonElement>(`[data-day="${iso}"] > button`);
  if (!found) throw new Error(`no day button for ${iso}`);
  return found;
}

/** The date of the day button that has focus. */
function focusedDay(): string | undefined {
  return document.activeElement?.closest<HTMLElement>("[data-day]")?.dataset["day"];
}

/** The day buttons of the November 2026 grid that are disabled, as day numbers. */
function disabledDays(scope: HTMLElement): number[] {
  return Array.from(scope.querySelectorAll<HTMLButtonElement>("td[data-day] > button"))
    .filter((b) => b.disabled)
    .map((b) => Number(b.textContent));
}

/** The CSS length a dimension token resolves to at `el`, in px. */
function dimension(el: Element, token: string): number {
  const probe = document.createElement("span");
  probe.style.display = "block";
  probe.style.inlineSize = `var(${token})`;
  el.append(probe);
  const width = probe.getBoundingClientRect().width;
  probe.remove();
  return width;
}

/**
 * The frame rule (ORV-222): the element and every ancestor up to and including the frame compute
 * `overflow` visible on both axes, so nothing of the element is clipped on the way up.
 */
function expectFrameRule(el: HTMLElement, frame: HTMLElement) {
  for (let node: HTMLElement | null = el; node; node = node === frame ? null : node.parentElement) {
    const style = getComputedStyle(node);
    expect([style.overflowX, style.overflowY], `${node.className || node.localName}`).toEqual([
      "visible",
      "visible",
    ]);
  }
}

/** Runs `check` with the browser at `width` by `height`, then puts the size back. The static
 * Storybook has no `vitest/browser`; there the frame is the viewport the toolbar chose. */
async function atViewport(width: number, height: number, check: () => Promise<void>) {
  if (!inVitest) return check();
  const { page } = await import("vitest/browser");
  const before = { width: window.innerWidth, height: window.innerHeight };
  const resized = async (w: number, h: number) => {
    await page.viewport(w, h);
    await waitFor(() => expect([window.innerWidth, window.innerHeight]).toEqual([w, h]));
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  };
  // The screenshot lock of `visual-asserts.ts`: no other file's screenshot runs while the frame is resized.
  await navigator.locks.request("orivilo-screenshot", async () => {
    await resized(width, height);
    try {
      await check();
    } finally {
      await resized(before.width, before.height);
    }
  });
}

/** Cal-engine-1: November 2026 in Thai, from the engine's grid and our words, with no Latin letter. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const [root] = calendars(canvasElement);
    if (!root) throw new Error("no calendar");
    await expect(root.querySelector(".ds-calendar__heading")?.textContent).toBe(
      formatDate("2026-11-01", "monthYear", "th"),
    );
    await expect(root.querySelector(".ds-calendar__heading")?.textContent).toBe("พฤศจิกายน 2569");
    await expect(
      within(root)
        .getAllByRole("columnheader")
        .map((h) => h.textContent),
    ).toEqual(["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."]);
    await expect(root.querySelectorAll("td[data-day] > button")).toHaveLength(30);
    await expect(root.querySelectorAll(".ds-calendar__week")).toHaveLength(5);
    // Nothing from October or December: the days around the month are empty cells.
    await expect(
      Array.from(root.querySelectorAll<HTMLElement>("td[data-day]")).every((td) =>
        td.dataset["day"]?.startsWith("2026-11-") ? true : td.querySelector("button") === null,
      ),
    ).toBe(true);
    const latin = /[A-Za-z]/;
    const texts = Array.from(root.querySelectorAll("*")).flatMap((el) => [
      ...Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent ?? ""),
      el.getAttribute("aria-label") ?? "",
    ]);
    await expect(texts.filter((t) => latin.test(t))).toEqual([]);
  },
};

/** Row 4: the same states in English, with the Common Era year and no era word. */
export const InEnglish: Story = {
  render: (args) => (
    <LocaleProvider locale="en">
      <Calendar
        {...args}
        defaultValue={c.selected}
        min={c.min}
        max={c.max}
        isDateDisabled={(d) => d === c.blocked}
      />
    </LocaleProvider>
  ),
  play: async ({ canvasElement }) => {
    const root = within(canvasElement);
    await expect(canvasElement.querySelector(".ds-calendar__heading")?.textContent).toBe(
      "November 2026",
    );
    await expect(root.getAllByRole("columnheader").map((h) => h.textContent)).toEqual([
      "Su",
      "Mo",
      "Tu",
      "We",
      "Th",
      "Fr",
      "Sa",
    ]);
    await expect(
      root.getAllByRole("columnheader").map((h) => h.getAttribute("aria-label")),
    ).toEqual(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);
    await expect(
      root.getByRole("button", { name: "Today, Friday, November 6, 2026" }),
    ).toBeVisible();
    await expect(
      root.getByRole("button", { name: "Thursday, November 12, 2026, selected" }),
    ).toBeVisible();
    await expect(root.getByRole("button", { name: "Previous month" })).toBeDisabled();
    await expect(root.getByRole("button", { name: "Next month" })).toBeDisabled();
  },
};

/** Row 5: February (four rows), November (five) and August (six) at one height, Next in one place. */
export const MonthShapes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-start gap-4">
      <Calendar {...args} defaultMonth="2026-02-10" />
      <Calendar {...args} defaultMonth="2026-11-10" />
      <Calendar {...args} defaultMonth="2026-08-10" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const roots = calendars(canvasElement);
    await expect(roots).toHaveLength(3);
    const [feb, nov, aug] = roots as [HTMLElement, HTMLElement, HTMLElement];
    // W3: [leading empty cells, days, rows] for each month, week from Sunday.
    const shape = (root: HTMLElement) => {
      const first = root.querySelector(".ds-calendar__week");
      return [
        first?.querySelectorAll("td:not([data-day]), td[data-hidden]").length ?? -1,
        root.querySelectorAll("td[data-day] > button").length,
        root.querySelectorAll(".ds-calendar__week").length,
      ];
    };
    await expect(shape(feb)).toEqual([0, 28, 4]);
    await expect(shape(nov)).toEqual([0, 30, 5]);
    await expect(shape(aug)).toEqual([6, 31, 6]);
    expectSameHeight(feb, nov, aug);
    // W10: two header rows, one gap and six day rows, plus the padding on both sides.
    await expect(feb.getBoundingClientRect().height).toBeCloseTo(376, 0);
    const nextOffset = (root: HTMLElement) => {
      const next = within(root).getByRole("button", { name: "เดือนถัดไป" }).getBoundingClientRect();
      const box = root.getBoundingClientRect();
      return [next.top - box.top, box.right - next.right];
    };
    await expect(nextOffset(nov)).toEqual(nextOffset(feb));
    await expect(nextOffset(aug)).toEqual(nextOffset(feb));
    const rowGap = dimension(aug, "--cmp-calendar-row-gap");
    const weeks = Array.from(aug.querySelectorAll(".ds-calendar__week"));
    for (let i = 1; i < weeks.length; i++) {
      const gap =
        (weeks[i] as Element).getBoundingClientRect().top -
        (weeks[i - 1] as Element).getBoundingClientRect().bottom;
      await expect(gap).toBeCloseTo(rowGap, 1);
    }
  },
};

/** Row 6: pressing a day selects it; pressing it again changes nothing and calls nothing. */
export const Selected: Story = {
  args: { onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const day12 = dayButton(canvasElement, c.selected);
    await userEvent.click(day12);
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onChange).toHaveBeenCalledWith("2026-11-12");
    await userEvent.click(day12);
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(
      within(canvasElement).getByRole("button", {
        name: "วันพฤหัสบดีที่ 12 พฤศจิกายน พ.ศ. 2569 เลือกแล้ว",
      }),
    ).toBeVisible();
    await expect(canvasElement.querySelectorAll('[aria-selected="true"]')).toHaveLength(1);
  },
};

/** Row 7: today is the underlined number, named as today. */
export const Today: Story = {
  play: async ({ canvasElement }) => {
    const underlined = Array.from(
      canvasElement.querySelectorAll<HTMLButtonElement>("td[data-day] > button"),
    ).filter((b) => getComputedStyle(b).textDecorationLine.includes("underline"));
    await expect(underlined.map((b) => b.textContent)).toEqual(["6"]);
    await expect(
      within(canvasElement).getByRole("button", {
        name: "วันนี้ วันศุกร์ที่ 6 พฤศจิกายน พ.ศ. 2569",
      }),
    ).toBeVisible();
  },
};

/** Row 8: a day outside `min` and `max`, or one the caller blocks, cannot be pressed. */
export const Bounds: Story = {
  args: { min: c.min, max: c.max, isDateDisabled: (d) => d === c.blocked, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    await expect(disabledDays(canvasElement)).toEqual([1, 2, 18, 25, 26, 27, 28, 29, 30]);
    const nav = within(canvasElement);
    await expect(nav.getByRole("button", { name: "เดือนก่อนหน้า" })).toBeDisabled();
    await expect(nav.getByRole("button", { name: "เดือนถัดไป" })).toBeDisabled();
    await userEvent.click(dayButton(canvasElement, c.blocked));
    await userEvent.click(dayButton(canvasElement, "2026-11-02"));
    await expect(args.onChange).not.toHaveBeenCalled();
    // A disabled day is passed over: from day 17 the Right Arrow lands on day 19.
    dayButton(canvasElement, "2026-11-17").focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(focusedDay()).toBe("2026-11-19"));
  },
};

/** Row 9: the keys of the grid land on the dates W5 prints, and Enter selects the focused day. */
export const Keyboard: Story = {
  args: { defaultValue: c.selected, onChange: fn() },
  render: (args) => (
    <div className="flex flex-wrap items-start gap-4">
      <Calendar {...args} />
      <Calendar today={c.today} defaultValue="2026-01-31" />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const [first, second] = calendars(canvasElement) as [HTMLElement, HTMLElement];
    dayButton(first, c.selected).focus();
    // Each key is read from 12 November; the opposite key goes back to it.
    const steps: [string, string, string][] = [
      ["{ArrowRight}", "2026-11-13", "{ArrowLeft}"],
      ["{ArrowUp}", "2026-11-05", "{ArrowDown}"],
      ["{Home}", "2026-11-08", "{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}"],
      ["{End}", "2026-11-14", "{ArrowLeft}{ArrowLeft}"],
      ["{PageDown}", "2026-12-12", "{PageUp}"],
      ["{Shift>}{PageDown}{/Shift}", "2027-11-12", "{Shift>}{PageUp}{/Shift}"],
    ];
    for (const [key, lands, back] of steps) {
      await userEvent.keyboard(key);
      await waitFor(() => expect(focusedDay()).toBe(lands));
      await userEvent.keyboard(back);
      await waitFor(() => expect(focusedDay()).toBe(c.selected));
    }
    // Nothing is selected by moving; Enter selects the focused day and calls once.
    await expect(args.onChange).not.toHaveBeenCalled();
    await userEvent.keyboard("{ArrowRight}{Enter}");
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onChange).toHaveBeenCalledWith("2026-11-13");
    // The month's last day when the number does not exist: 31 January, a month on, is 28 February.
    dayButton(second, "2026-01-31").focus();
    await userEvent.keyboard("{PageDown}");
    await waitFor(() => expect(focusedDay()).toBe("2026-02-28"));
  },
};

/** Row 10: roles and names of the grid, the heading, the weekdays and the two month buttons. */
export const Names: Story = {
  args: { defaultValue: c.selected },
  play: async ({ canvasElement }) => {
    const root = within(canvasElement);
    await expect(root.getByRole("grid", { name: "พฤศจิกายน 2569" })).toBeVisible();
    const heading = canvasElement.querySelector(".ds-calendar__heading");
    await expect(heading?.getAttribute("role")).toBe("status");
    await expect(heading?.getAttribute("aria-live")).toBe("polite");
    await expect(canvasElement.querySelectorAll('button[tabindex="0"]')).toHaveLength(1);
    await expect(dayButton(canvasElement, c.selected).tabIndex).toBe(0);
    await expect(
      root.getAllByRole("columnheader").map((h) => h.getAttribute("aria-label")),
    ).toEqual([
      "วันอาทิตย์",
      "วันจันทร์",
      "วันอังคาร",
      "วันพุธ",
      "วันพฤหัสบดี",
      "วันศุกร์",
      "วันเสาร์",
    ]);
    await expect(root.getByRole("group", { name: "เปลี่ยนเดือน" })).toBeVisible();
    const previous = root.getByRole("button", { name: "เดือนก่อนหน้า" });
    const next = root.getByRole("button", { name: "เดือนถัดไป" });
    // The press area reaches size.touch while the look stays sm: a press 5 px outside the look lands.
    for (const [button, dx] of [
      [next, 5],
      [previous, -5],
    ] as const) {
      const look = button.getBoundingClientRect();
      const x = dx > 0 ? look.right + dx : look.left + dx;
      await expect(document.elementFromPoint(x, look.top + look.height / 2)).toBe(button);
    }
  },
};

/**
 * Row 11: hover, selected, disabled, focus and a blocked today, each told by more than colour. A
 * synthetic pointer sets no `:hover`, so `parameters.pseudo` forces it on days 10 (plain), 18
 * (blocked) and 20 (selected, in the second calendar); the play reads what each one draws.
 */
export const States: Story = {
  args: { defaultValue: c.selected, isDateDisabled: (d) => d === c.blocked },
  parameters: {
    pseudo: {
      rootSelector: "body",
      hover: [
        '[data-day="2026-11-10"] > button',
        '[data-day="2026-11-18"] > button',
        '[data-day="2026-11-20"] > button',
      ],
    },
  },
  render: (args) => (
    <div className="flex flex-wrap items-start gap-4">
      <Calendar {...args} />
      <Calendar today={c.today} defaultValue="2026-11-20" isDateDisabled={(d) => d === c.today} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [first, second] = calendars(canvasElement) as [HTMLElement, HTMLElement];
    // The expected colours are read once, outside `waitFor`: the probe in `tone` changes the DOM,
    // and a `waitFor` callback that changes the DOM re-runs itself on every change.
    const tone = (el: HTMLElement, token: string) => resolvedColor(el, `--cmp-calendar-${token}`);
    const day12 = dayButton(first, c.selected);
    const day10 = dayButton(first, "2026-11-10");
    const day20 = dayButton(second, "2026-11-20");
    const blocked = dayButton(first, c.blocked);
    const expected = {
      selectedBg: tone(day12, "day-selected-bg"),
      selectedFg: tone(day12, "day-selected-fg"),
      selectedEdge: tone(day12, "day-selected-edge"),
      hoverBg: tone(day10, "day-hover-bg"),
      hoverEdge: tone(day10, "day-hover-edge"),
      disabledFg: tone(blocked, "day-disabled-fg"),
    };

    // Hover on a plain day: the ground and the edge both change.
    await waitFor(() => expect(getComputedStyle(day10).backgroundColor).toBe(expected.hoverBg));
    await expect(getComputedStyle(day10).borderColor).toBe(expected.hoverEdge);

    // The selected day, not hovered: the selection ground, ink and edge.
    const selected = getComputedStyle(day12);
    await expect(selected.backgroundColor).toBe(expected.selectedBg);
    await expect(selected.color).toBe(expected.selectedFg);
    await expect(selected.borderColor).toBe(expected.selectedEdge);

    // Hover on a selected day keeps the selected ground and takes the hover edge.
    await waitFor(() => expect(getComputedStyle(day20).borderColor).toBe(expected.hoverEdge));
    await expect(getComputedStyle(day20).backgroundColor).toBe(expected.selectedBg);

    // Hover never reaches a blocked day: no ground, struck through, full opacity.
    const struck = getComputedStyle(blocked);
    await expect(struck.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await expect(struck.textDecorationLine).toBe("line-through");
    await expect(struck.opacity).toBe("1");
    await expect(struck.color).toBe(expected.disabledFg);

    // Focus on a day with no pointer over it: the border turns focus.ring.
    await expectFocusBorderForm(dayButton(first, "2026-11-14"));
    // And with the pointer over it. The forced hover above cannot show this (the addon's rewrite of
    // the hover rule drops its `:not(:focus-visible)`), so the test project moves a real pointer.
    if (inVitest) {
      const { userEvent: real } = await import("vitest/browser");
      await real.hover(day12);
      await waitFor(() => expect(day12.matches(":hover")).toBe(true));
      await expectFocusBorderForm(day12);
      await real.unhover(day12);
    }

    // A blocked today keeps both lines, so it stays findable.
    const blockedToday = dayButton(second, c.today);
    const lines = getComputedStyle(blockedToday).textDecorationLine;
    await expect(lines).toContain("underline");
    await expect(lines).toContain("line-through");
  },
};

/** Row 12: at 360 px seven cells of size.touch fit; in a 280 px column the days narrow and keep their height. */
export const At360: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Narrow>
        <Calendar {...args} />
      </Narrow>
      <div className="w-[280px]">
        <Calendar {...args} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [framed, column] = calendars(canvasElement) as [HTMLElement, HTMLElement];
    const frame = framed.parentElement as HTMLElement;
    await expect(frame.scrollWidth).toBeLessThanOrEqual(360);
    const cell = dimension(framed, "--cmp-calendar-cell-size");
    await expect(cell).toBe(44);
    const day = dayButton(framed, c.selected).getBoundingClientRect();
    await expect(day.width).toBe(cell);
    expectFrameRule(
      framed.querySelector<HTMLElement>(".ds-calendar__heading") as HTMLElement,
      frame,
    );
    if (inVitest) {
      await expectLabelInkWhole(
        framed.querySelector<HTMLElement>(".ds-calendar__heading") as HTMLElement,
      );
    }

    // In the column the days narrow, keep their height and do not touch.
    const buttons = Array.from(column.querySelectorAll<HTMLButtonElement>("td[data-day] > button"));
    await expect(column.getBoundingClientRect().width).toBeLessThanOrEqual(280);
    for (const [i, button] of buttons.entries()) {
      const box = button.getBoundingClientRect();
      await expect(box.height).toBe(cell);
      await expect(box.width).toBeLessThan(cell);
      const nextBox = buttons[i + 1]?.getBoundingClientRect();
      if (nextBox && nextBox.top === box.top)
        await expect(nextBox.left).toBeGreaterThanOrEqual(box.right);
    }

    // W10: at a 320 px viewport the cell shrinks to (320 - 2 gutters - 2 paddings - 2 borders) / 7.
    await atViewport(320, 640, async () => {
      await waitFor(() =>
        expect(dayButton(framed, c.selected).getBoundingClientRect().width).toBeCloseTo(38.57, 0),
      );
      // The day stays square: the cell sets the height as well as the width.
      await expect(dayButton(framed, c.selected).getBoundingClientRect().height).toBeCloseTo(
        38.57,
        0,
      );
      await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
    });
  },
};

/** Row 13: the selected, today and disabled days under every profile in both modes. */
export const RecipesAndModes: Story = {
  render: (args) => (
    <Matrix>
      <Calendar {...args} defaultValue={c.selected} isDateDisabled={(d) => d === c.blocked} />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = Array.from(canvasElement.querySelectorAll<HTMLElement>("[data-matrix-cell]"));
    await expect(cells).toHaveLength(6);
    for (const cell of cells) {
      await expect(calendars(cell)).toHaveLength(1);
      await expect(cell.querySelectorAll("td[data-selected] > button")).toHaveLength(1);
      await expect(cell.querySelectorAll("td[data-today] > button")).toHaveLength(1);
      await expect(disabledDays(cell)).toEqual([18]);
    }
  },
};

/** Two months side by side from `md` up; the months wrapper is two grids and a gap wide. */
export const TwoMonths: Story = {
  args: { months: 2 },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll("[role=grid]")).toHaveLength(2);
    await expect(
      Array.from(canvasElement.querySelectorAll(".ds-calendar__heading")).map((h) => h.textContent),
    ).toEqual(["พฤศจิกายน 2569", "ธันวาคม 2569"]);
    const months = canvasElement.querySelector(".ds-calendar__months") as HTMLElement;
    // W4: two grids of seven 44 px cells and the 24 px between them.
    await expect(months.getBoundingClientRect().width).toBe(640);
  },
};

/**
 * Type contract (`cal-api-1`), checked by `pnpm typecheck`. The rejected elements are created and
 * dropped, never mounted: a `Date` value, a range value, a range mode and three months are each a
 * type error. The story draws the one valid calendar.
 */
export const TypeContract: Story = {
  render: () => {
    const rejected = [
      // @ts-expect-error a Date never crosses the API: dates are YYYY-MM-DD strings
      <Calendar value={new Date()} />,
      // @ts-expect-error a range value needs mode="range", which this story does not offer
      <Calendar value={{ start: "2026-11-09", end: "2026-11-13" }} />,
      // @ts-expect-error a single date is not a range value
      <Calendar mode="range" value="2026-11-12" />,
      // @ts-expect-error one month or two, nothing else
      <Calendar months={3} />,
    ];
    return (
      <div data-rejected={rejected.length}>
        <Calendar today={c.today} />
      </div>
    );
  },
};
