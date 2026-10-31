import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { DEFAULT_LOCALE, isLocale } from "../../i18n/locale";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import { messagesFor } from "../../i18n/messages/index";
import { fixtureJobs, fixtureManyJobs, fixtureTaskJobs, fixtureTaskJobsEn } from "../fixtures";
import { BOARD } from "../canvas-board/fixtures";
import { Stateful } from "../canvas-board/story-shell";
import { Matrix, Narrow as NarrowFrame } from "../matrix";
import { TaskBar, type TaskJob } from "./TaskBar";

const meta = {
  title: "Application/Task bar",
  component: TaskBar,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The jobs strip at the foot of the board (E4-5 part 2): a one-line summary, a toggle and a list of job rows with progress, the reason a job failed and a retry. Every job says where its result comes from, by rules or mock data; nothing here claims AI. Every story's jobs are mock data or worked out by rules, not live generation. Inside a board, a job whose node is on the board has a Go to node button.",
      },
    },
  },
  args: { jobs: fixtureTaskJobs, defaultExpanded: true },
  decorators: [(Story) => <div className="max-w-2xl">{Story()}</div>],
} satisfies Meta<typeof TaskBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const intersects = (a: DOMRect, b: DOMRect) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
const bar = (root: HTMLElement) => root.querySelector<HTMLElement>(".ds-taskbar") as HTMLElement;
/** The bar's own announcer; Progress and Button keep status regions of their own. */
const announcer = (root: HTMLElement) =>
  bar(root).querySelector<HTMLElement>(":scope > [role='status']") as HTMLElement;
/** The board's zoom, read from the viewport transform. */
const viewportScale = (root: HTMLElement) => {
  const el = root.querySelector<HTMLElement>(".react-flow__viewport") as HTMLElement;
  return new DOMMatrixReadOnly(getComputedStyle(el).transform).a;
};
const viewportTransform = (root: HTMLElement) =>
  getComputedStyle(root.querySelector(".react-flow__viewport") as HTMLElement).transform;
const rowOf = (root: HTMLElement, id: string) =>
  root.querySelector<HTMLElement>(`[data-job-id="${id}"]`) as HTMLElement;

/** Collapsed with no jobs: the summary says so; opening shows the empty text. Mock: no jobs. */
export const Empty: Story = {
  args: { jobs: [], defaultExpanded: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("region", { name: "งาน" })).toBeVisible();
    await expect(canvas.getByText("ยังไม่มีงาน")).toBeVisible();
    const toggle = canvas.getByRole("button", { name: "แสดงงาน" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    await expect(canvas.getByRole("button", { name: "ซ่อนงาน" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    // The list fades in over a short time after a press.
    await waitFor(() =>
      expect(canvas.getByText("ยังไม่มีงาน งานที่เริ่มบนบอร์ดจะแสดงที่นี่")).toBeVisible(),
    );
  },
};

/** One line: only non-zero counts, in the order queued, running, failed, done. Mock jobs. */
export const Collapsed: Story = {
  args: {
    jobs: [fixtureJobs.failed, fixtureJobs.running, fixtureJobs.done, fixtureJobs.longName],
    defaultExpanded: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("กำลังทำ 1 งาน, ไม่สำเร็จ 1 งาน, เสร็จแล้ว 2 งาน")).toBeVisible();
    const toggle = canvas.getByRole("button", { name: "แสดงงาน" });
    const panel = canvasElement.querySelector(
      `[id="${toggle.getAttribute("aria-controls") ?? ""}"]`,
    );
    await expect(panel).not.toBeVisible();
  },
};

/** Queued rows from rules and from mock data: a mark, the word, the basis, no progress bar. */
export const Queued: Story = {
  args: {
    jobs: [fixtureJobs.queued, { ...fixtureJobs.queued, id: "job-queued-2", basis: "mock" }],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText("รอคิว").length).toBeGreaterThan(0);
    await expect(canvas.getByText("ตามกฎ")).toBeVisible();
    await expect(canvas.getByText("ข้อมูลจำลอง")).toBeVisible();
    await expect(canvas.queryByRole("progressbar")).toBeNull();
  },
};

/** Known length, a value past the maximum (clamped) and an unknown length. Mock jobs. */
export const Running: Story = {
  args: {
    jobs: [
      fixtureJobs.running,
      { ...fixtureJobs.running, id: "job-over", name: "เกินช่วง", value: 140 },
      fixtureJobs.runningUnknown,
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const known = canvas.getByRole("progressbar", { name: fixtureJobs.running.name });
    await expect(known).toHaveAttribute("aria-valuenow", "40");
    await expect(canvas.getByText("40%")).toBeVisible();
    await expect(canvas.getByRole("progressbar", { name: "เกินช่วง" })).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    const unknown = canvas.getByRole("progressbar", { name: fixtureJobs.runningUnknown.name });
    await expect(unknown).not.toHaveAttribute("aria-valuenow");
    await expect(canvas.getByText("กำลังทำงาน")).toBeVisible();
  },
};

/** Under reduced motion the sweep and the retry spinner are switched off by the recipe. Mock jobs. */
export const RunningReducedMotion: Story = {
  args: { jobs: [fixtureJobs.runningUnknown] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("กำลังทำงาน")).toBeVisible();
    const fillEl = canvasElement.querySelector<HTMLElement>(".ds-progress__fill");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    await expect(getComputedStyle(fillEl as HTMLElement).animationName === "none").toBe(reduce);
    const noneFor = (part: string) => {
      for (const sheet of Array.from(document.styleSheets)) {
        for (const rule of Array.from(sheet.cssRules)) {
          if (
            rule instanceof CSSMediaRule &&
            rule.conditionText.includes("prefers-reduced-motion")
          ) {
            for (const inner of Array.from(rule.cssRules)) {
              if (
                inner instanceof CSSStyleRule &&
                inner.selectorText.includes(part) &&
                inner.style.animationName === "none"
              ) {
                return true;
              }
            }
          }
        }
      }
      return false;
    };
    await expect(noneFor(".ds-progress")).toBe(true);
    // The retry spinner is essential motion: no reduced-motion rule stops it.
    await expect(noneFor(".ds-spin")).toBe(false);
  },
};

/** A done job shows a check and the word; no jump appears off the board. Mock job. */
export const Done: Story = {
  args: { jobs: [fixtureJobs.done] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("เสร็จแล้ว")).toBeVisible();
    await expect(canvasElement.querySelector(".ds-taskbar__row svg")).not.toBeNull();
    await expect(canvas.queryByRole("button", { name: /ไปที่โหนด/ })).toBeNull();
  },
};

/** A failed job gives the reason in full and a retry that names the job. Mock job. */
export const Failed: Story = {
  args: { jobs: [fixtureJobs.longReason], onRetry: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("ไม่สำเร็จ")).toBeVisible();
    const reason = canvas.getByText(fixtureJobs.longReason.reason);
    await expect(reason).toBeVisible();
    // Wrapped in full: no ellipsis, no sideways overflow.
    await expect(getComputedStyle(reason).textOverflow).not.toBe("ellipsis");
    await expect(reason.scrollWidth <= reason.clientWidth).toBe(true);
    const retry = canvas.getByRole("button", {
      name: `ลองอีกครั้ง ${fixtureJobs.longReason.name}`,
    });
    await expect(retry).toHaveTextContent("ลองอีกครั้ง");
    await userEvent.click(retry);
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
    await expect(args.onRetry).toHaveBeenCalledWith(fixtureJobs.longReason.id);
  },
};

/** Without `onRetry` a failed job gives the reason and no button. Mock job. */
export const FailedWithoutRetry: Story = {
  args: { jobs: [fixtureJobs.failed] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(fixtureJobs.failed.reason)).toBeVisible();
    await expect(canvas.queryByRole("button", { name: /ลองอีกครั้ง/ })).toBeNull();
  },
};

function SlowHost({ onRetry }: { onRetry: (id: string) => void }) {
  const [jobs, setJobs] = useState<readonly TaskJob[]>([fixtureJobs.failed]);
  return (
    <TaskBar
      jobs={jobs}
      defaultExpanded
      onRetry={(id) => {
        onRetry(id);
        // The host is slow: it moves the job to the queue a moment later.
        setTimeout(() => setJobs([{ ...fixtureJobs.failed, state: "queued" }]), 300);
      }}
    />
  );
}

/** Retry waits for the host: a second press does nothing, then focus lands on the row. Mock job. */
export const RetryPending: Story = {
  args: { onRetry: fn() },
  render: (args) => <SlowHost onRetry={args.onRetry as (id: string) => void} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const retry = canvas.getByRole("button", { name: `ลองอีกครั้ง ${fixtureJobs.failed.name}` });
    await userEvent.click(retry);
    await userEvent.click(retry);
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
    await expect(retry).toHaveAttribute("aria-disabled", "true");
    await waitFor(() => expect(canvas.queryByRole("button", { name: /ลองอีกครั้ง/ })).toBeNull());
    await waitFor(() => expect(rowOf(canvasElement, fixtureJobs.failed.id)).toHaveFocus());
  },
};

function AgainHost({ onRetry }: { onRetry: (id: string) => void }) {
  const [state, setState] = useState<"failed" | "queued">("failed");
  const job = { ...fixtureJobs.failed, state } as TaskJob;
  return (
    <div className="flex flex-col gap-3">
      <TaskBar jobs={[job]} defaultExpanded onRetry={onRetry} />
      <button type="button" onClick={() => setState((s) => (s === "failed" ? "queued" : "failed"))}>
        สลับสถานะ
      </button>
    </div>
  );
}

/** The job fails again with the same reason after a retry: Retry is enabled and works again. Mock job. */
export const RetryAgain: Story = {
  args: { onRetry: fn() },
  render: (args) => <AgainHost onRetry={args.onRetry as (id: string) => void} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const name = `ลองอีกครั้ง ${fixtureJobs.failed.name}`;
    await userEvent.click(canvas.getByRole("button", { name }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole("button", { name: "สลับสถานะ" }));
    await waitFor(() => expect(canvas.queryByRole("button", { name })).toBeNull());
    await userEvent.click(canvas.getByRole("button", { name: "สลับสถานะ" }));
    const again = await canvas.findByRole("button", { name });
    await expect(again).not.toHaveAttribute("aria-disabled", "true");
    await userEvent.click(again);
    await expect(args.onRetry).toHaveBeenCalledTimes(2);
  },
};

function AnnounceHost() {
  const [step, setStep] = useState(0);
  const jobs: TaskJob[] = [
    { ...fixtureJobs.queued, state: step > 0 ? "running" : "queued" } as TaskJob,
    { ...fixtureJobs.running, value: 40 + step * 10 },
  ];
  return (
    <div className="flex flex-col gap-3">
      <TaskBar jobs={jobs} />
      <button type="button" onClick={() => setStep((s) => s + 1)}>
        ขั้นต่อไป
      </button>
    </div>
  );
}

/** The live region is empty at first; a state change is announced, a percent change is not. Mock jobs. */
export const Announce: Story = {
  render: () => <AnnounceHost />,
  play: async ({ canvasElement }) => {
    const live = announcer(canvasElement);
    await expect(live).toHaveTextContent("");
    await userEvent.click(within(canvasElement).getByRole("button", { name: "ขั้นต่อไป" }));
    await waitFor(() => expect(live).toHaveTextContent(`${fixtureJobs.queued.name}: กำลังทำงาน`));
    await expect(live).not.toHaveTextContent(fixtureJobs.running.name);
    await userEvent.click(within(canvasElement).getByRole("button", { name: "ขั้นต่อไป" }));
    await waitFor(() => expect(live).toHaveTextContent(""));
  },
};

/** A controlled `expanded` wins over a press; the change is reported. Mock jobs. */
export const Controlled: Story = {
  args: { expanded: false, onExpandedChange: fn() },
  play: async ({ canvasElement, args }) => {
    const toggle = within(canvasElement).getByRole("button", { name: "แสดงงาน" });
    await userEvent.click(toggle);
    await expect(args.onExpandedChange).toHaveBeenCalledWith(true);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveFocus();
  },
};

/** Tab reaches the toggle, then the list region, then each row's buttons in order. Mock jobs. */
export const Keyboard: Story = {
  args: {
    jobs: [fixtureJobs.failed, fixtureJobs.done, fixtureJobs.longReason],
    onRetry: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    const toggle = canvas.getByRole("button", { name: "ซ่อนงาน" });
    await expect(toggle).toHaveFocus();
    await expect(getComputedStyle(toggle).outlineStyle).not.toBe("none");
    await userEvent.tab();
    await expect(canvas.getByRole("region", { name: "รายการงาน" })).toHaveFocus();
    await userEvent.tab();
    await expect(
      canvas.getByRole("button", { name: `ลองอีกครั้ง ${fixtureJobs.failed.name}` }),
    ).toHaveFocus();
    await userEvent.tab();
    await expect(
      canvas.getByRole("button", { name: `ลองอีกครั้ง ${fixtureJobs.longReason.name}` }),
    ).toHaveFocus();
    await userEvent.tab({ shift: true });
    await userEvent.tab({ shift: true });
    await userEvent.tab({ shift: true });
    await expect(toggle).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveFocus();
  },
};

/** Twelve jobs: the list scrolls inside the bar and the bar stays at its cap. Mock jobs. */
export const Overflow: Story = {
  args: { jobs: fixtureManyJobs },
  play: async ({ canvasElement }) => {
    const viewport = within(canvasElement).getByRole("region", { name: "รายการงาน" });
    await expect(viewport.scrollHeight > viewport.clientHeight).toBe(true);
    await expect(viewport.clientHeight <= 320).toBe(true);
  },
};

const mixedJobs: readonly TaskJob[] = [
  fixtureJobs.longReason,
  fixtureJobs.failed,
  fixtureJobs.running,
  fixtureJobs.runningUnknown,
  fixtureJobs.queued,
  fixtureJobs.done,
  fixtureJobs.longName,
];

/** Every state at once with a long Thai name and a long reason. Mock jobs. */
export const Mixed: Story = {
  args: { jobs: mixedJobs, onRetry: fn() },
  play: async ({ canvasElement, globals }) => {
    // The words come from the catalog of the locale the toolbar set, not from Thai literals.
    const m = messagesFor(isLocale(globals["locale"]) ? globals["locale"] : DEFAULT_LOCALE);
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText(m.progress.failed).length).toBeGreaterThan(0);
    await expect(
      canvas.getByText(m.taskBar.queued, { selector: ".ds-taskbar__word" }),
    ).toBeVisible();
    await expect(canvas.getAllByRole("progressbar")).toHaveLength(2);
  },
};

/** The mixed list at 360 px: names truncate with a title, nothing overflows sideways. Mock jobs. */
export const Narrow: Story = {
  args: { jobs: mixedJobs, onRetry: fn() },
  decorators: [(Story) => <NarrowFrame>{Story()}</NarrowFrame>],
  play: async ({ canvasElement }) => {
    const root = bar(canvasElement);
    await expect(root.scrollWidth <= root.clientWidth).toBe(true);
    const viewport = within(canvasElement).getByRole("region", { name: "รายการงาน" });
    await expect(viewport.scrollWidth <= viewport.clientWidth).toBe(true);
    const name = within(canvasElement).getByText(fixtureJobs.longName.name, {
      selector: ".ds-taskbar__name",
    });
    await expect(name).toHaveAttribute("title", fixtureJobs.longName.name);
    await expect(name.scrollWidth > name.clientWidth).toBe(true);
  },
};

/** The same list in English, every string from the English catalog. Mock jobs. */
export const English: Story = {
  args: { jobs: fixtureTaskJobsEn, onRetry: fn() },
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("region", { name: "Jobs" })).toBeVisible();
    await expect(canvas.getByText("1 queued, 1 running, 1 failed, 1 done")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Hide jobs" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Retry Build the home page" })).toBeVisible();
    await expect(canvas.getAllByText("Mock data").length).toBeGreaterThan(0);
    await expect(
      canvas.getAllByText("By rules", { selector: ".ds-taskbar__basis" }).length,
    ).toBeGreaterThan(0);
  },
};

/**
 * Six bars in one document: the region names come from the catalog ("งาน", "รายการงาน") and the
 * public API has no label prop, so axe's landmark-unique rule is off for this story only. Each
 * bar sits inside a matrix cell that is named by its profile and mode. Mock jobs.
 */
export const RecipesAndModes: Story = {
  parameters: { a11y: { config: { rules: [{ id: "landmark-unique", enabled: false }] } } },
  args: { onRetry: fn() },
  render: (args) => (
    <Matrix>
      <TaskBar {...args} />
    </Matrix>
  ),
  decorators: [],
};

/** Three done jobs: one with a node on the board, one with no node, one whose node is not there. */
const boardJobs: readonly TaskJob[] = [
  { ...fixtureJobs.done, id: "job-on-board", nodeId: "logo" },
  { ...fixtureJobs.done, id: "job-no-node", name: "สรุปแนวทางสี", nodeId: undefined },
  { ...fixtureJobs.done, id: "job-missing", name: "ร่างหน้าแรก", nodeId: "ghost" },
];

/**
 * The bar as a child of the board with its controls and shelf: Go to node shows only on the row
 * whose node is on the board, selects that node alone, pans and zooms to it, focuses it and the
 * board announces it. The node is not under the open list. Mock jobs on the fixture board.
 */
export const OnBoard: Story = {
  args: { jobs: boardJobs },
  render: (args) => (
    <Stateful initial={BOARD} height={560} label="กระดานแบรนด์ (ข้อมูลตัวอย่าง)" minimap={false}>
      <TaskBar {...args} />
    </Stateful>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvasElement.querySelectorAll(".react-flow__node").length).toBeGreaterThan(0),
    );
    const jumps = canvas.getAllByRole("button", { name: /^ไปที่โหนดของ/ });
    await expect(jumps).toHaveLength(1);
    await expect(jumps[0]).toHaveAccessibleName(`ไปที่โหนดของ ${boardJobs[0]?.name}`);
    await expect(within(rowOf(canvasElement, "job-no-node")).queryByRole("button")).toBeNull();
    await expect(within(rowOf(canvasElement, "job-missing")).queryByRole("button")).toBeNull();
    await userEvent.click(jumps[0] as HTMLElement);
    const logo = canvasElement.querySelector<HTMLElement>('.react-flow__node[data-id="logo"]');
    await waitFor(() => expect(logo).toHaveClass("selected"));
    await expect(canvasElement.querySelectorAll(".react-flow__node.selected")).toHaveLength(1);
    await waitFor(() => expect(logo).toHaveFocus());
    await expect(canvasElement.querySelector(".ds-board__status")).toHaveTextContent("ไปที่ โลโก้");
    // The bar's own live region says nothing about the jump.
    await expect(announcer(canvasElement)).toHaveTextContent("");
    // The node settles inside the board, above the open list, at a zoom above the minimum.
    const boardEl = canvasElement.querySelector<HTMLElement>(".ds-board") as HTMLElement;
    await waitFor(() => {
      const node = logo?.getBoundingClientRect() as DOMRect;
      expect(node.top).toBeGreaterThanOrEqual(boardEl.getBoundingClientRect().top);
      expect(node.bottom).toBeLessThanOrEqual(bar(canvasElement).getBoundingClientRect().top + 1);
      expect(viewportScale(canvasElement)).toBeGreaterThan(0.25);
    });
    // The status line sits clear of the open bar.
    const pill = canvasElement.querySelector(".ds-board__status") as HTMLElement;
    const pillBox = pill.getBoundingClientRect();
    await expect(pillBox.bottom).toBeLessThanOrEqual(
      bar(canvasElement).getBoundingClientRect().top + 1,
    );
    // The node is clear of the toolbar, the status line and the bar.
    const nodeBox = logo?.getBoundingClientRect() as DOMRect;
    const controls = canvasElement.querySelector(".react-flow__panel.ds-controls") as HTMLElement;
    await expect(intersects(nodeBox, controls.getBoundingClientRect())).toBe(false);
    await expect(intersects(nodeBox, pillBox)).toBe(false);
    await expect(intersects(nodeBox, bar(canvasElement).getBoundingClientRect())).toBe(false);
  },
};

/**
 * The jump on a 420 px board with the list open: the status line and the toolbar stay inside the
 * board and the node is visible in it. Mock jobs. The board keeps 420 px (`fill={false}`): the
 * story proves a bound on the board's height (spec ORV-189, `exempt-1`).
 */
export const OnShortBoard: Story = {
  args: { jobs: boardJobs },
  render: (args) => (
    <Stateful
      initial={BOARD}
      height={420}
      fill={false}
      label="กระดานแบรนด์ (ข้อมูลตัวอย่าง)"
      minimap={false}
    >
      <TaskBar {...args} />
    </Stateful>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelectorAll(".react-flow__node").length).toBeGreaterThan(0),
    );
    await userEvent.click(within(canvasElement).getByRole("button", { name: /^ไปที่โหนดของ/ }));
    const logo = canvasElement.querySelector<HTMLElement>('.react-flow__node[data-id="logo"]');
    await waitFor(() => expect(logo).toHaveClass("selected"));
    const boardBox = (
      canvasElement.querySelector(".ds-board") as HTMLElement
    ).getBoundingClientRect();
    const inside = (box: DOMRect) => box.top >= boardBox.top && box.bottom <= boardBox.bottom;
    await waitFor(() => {
      const node = logo?.getBoundingClientRect() as DOMRect;
      expect(inside(node)).toBe(true);
    });
    const pill = canvasElement.querySelector(".ds-board__status") as HTMLElement;
    const controls = canvasElement.querySelector(".react-flow__panel.ds-controls") as HTMLElement;
    await expect(inside(pill.getBoundingClientRect())).toBe(true);
    await expect(inside(controls.getBoundingClientRect())).toBe(true);
  },
};

/**
 * Under reduced motion the jump lands at once: the viewport is final on the next frame, where the
 * 200 ms glide would still be on its way. The preference is stubbed for this story. Mock jobs.
 */
export const OnBoardReducedMotion: Story = {
  args: { jobs: boardJobs },
  render: (args) => (
    <Stateful initial={BOARD} height={560} label="กระดานแบรนด์ (ข้อมูลตัวอย่าง)" minimap={false}>
      <TaskBar {...args} />
    </Stateful>
  ),
  play: async ({ canvasElement }) => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = (query: string) =>
      query.includes("prefers-reduced-motion")
        ? ({ ...original(query), matches: true } as MediaQueryList)
        : original(query);
    try {
      await waitFor(() =>
        expect(canvasElement.querySelectorAll(".react-flow__node").length).toBeGreaterThan(0),
      );
      const before = viewportTransform(canvasElement);
      const jump = within(canvasElement).getByRole("button", { name: /^ไปที่โหนดของ/ });
      await userEvent.click(jump);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const next = viewportTransform(canvasElement);
      await expect(next).not.toBe(before);
      await new Promise((resolve) => setTimeout(resolve, 400));
      await expect(viewportTransform(canvasElement)).toBe(next);
    } finally {
      window.matchMedia = original;
    }
  },
};
