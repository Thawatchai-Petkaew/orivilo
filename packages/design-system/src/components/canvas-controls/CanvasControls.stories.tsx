import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { commandById, surfaceCommands } from "../../commands/index";
import { BOARD, BOARD_NODES } from "../canvas-board/fixtures";
import { MatrixBoard, Stateful } from "../canvas-board/story-shell";
import { Matrix, Narrow } from "../matrix";
import { expectPillsClear, inVitest, resolvedColor } from "../../testing/visual-asserts";
import { Button } from "../button/Button";
import { CanvasControls } from "./CanvasControls";

const meta = {
  title: "Application/Canvas controls",
  component: Stateful,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Zoom, fit, select or pan, minimap, undo, redo, add, find and the shortcut sheet (E4-3), bottom-left over the board on the glass toolbar. Every control is a registry command with its shortcut in the tooltip; undo and redo are offered only when the shell says it can. The present variant keeps what moves the viewport. Fixture board, labelled as such.",
      },
    },
  },
  args: { initial: BOARD, label: "กระดานแบรนด์ (ข้อมูลตัวอย่าง)", minimap: false },
} satisfies Meta<typeof Stateful>;

export default meta;
type Story = StoryObj<typeof meta>;

const nodeEls = (root: HTMLElement) => root.querySelectorAll<HTMLElement>(".react-flow__node");
const viewportZoom = (root: Element) =>
  parseFloat(
    /scale\(([\d.]+)\)/.exec(
      root.querySelector<HTMLElement>(".react-flow__viewport")?.style.transform ?? "",
    )?.[1] ?? "NaN",
  );
const controls = (root: HTMLElement) =>
  within(root).getByRole("toolbar", { name: "เครื่องมือกระดาน" });

/** Every canvas-controls command of this story has a button; undo and redo are disabled without a history (AC 6). */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    const bar = controls(region);
    const ids = surfaceCommands("canvas-controls").map((c) => c.id);
    for (const id of ids) {
      const control =
        bar.querySelector(`[data-command="${id}"]`) ??
        within(bar).queryByRole("radio", {
          name: (name: string) => name.includes(commandById(id).label.th),
        });
      await expect(control, id).not.toBeNull();
    }
    await expect(within(bar).getByRole("button", { name: /ซูม 100/ })).toHaveTextContent("%");
    await expect(
      within(bar).getByRole("button", { name: commandById("board.undo").label.th }),
    ).toBeDisabled();
    await expect(
      within(bar).getByRole("button", { name: commandById("board.redo").label.th }),
    ).toBeDisabled();
    await expect(within(bar).getByRole("radio", { name: /โหมดเลือก/ })).toHaveAttribute(
      "data-state",
      "on",
    );
    const zoomIn = within(bar).getByRole("button", { name: commandById("board.zoom-in").label.th });
    await userEvent.hover(zoomIn);
    const tip = await within(document.body).findByRole("tooltip");
    await expect(tip).toHaveTextContent(commandById("board.zoom-in").label.th);
    await expect(tip.querySelectorAll("kbd")).toHaveLength(2);
  },
};

/** With a shell history: undo and redo are enabled and go to onCommand (AC 6). */
export const WithHistory: Story = {
  args: { canUndo: true, canRedo: true, onCommand: fn() },
  play: async ({ canvasElement, args }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    const bar = controls(region);
    const undo = within(bar).getByRole("button", { name: commandById("board.undo").label.th });
    await expect(undo).toBeEnabled();
    await userEvent.click(undo);
    await expect(args.onCommand).toHaveBeenCalledWith("board.undo", {});
    await userEvent.click(
      within(bar).getByRole("button", { name: commandById("board.redo").label.th }),
    );
    await expect(args.onCommand).toHaveBeenCalledWith("board.redo", {});
  },
};

/** The pan or select toggle changes the board's tool; the add button asks the shell for a node. */
export const ModesAndAdd: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    const bar = controls(region);
    await userEvent.click(within(bar).getByRole("radio", { name: /โหมดเลื่อนกระดาน/ }));
    await expect(region.querySelector(".ds-board__flow")).toHaveAttribute("data-tool", "pan");
    await expect(within(region).getByRole("status")).toHaveTextContent("โหมดเลื่อนกระดาน");
    await userEvent.click(
      within(bar).getByRole("button", { name: commandById("board.add-node").label.th }),
    );
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length + 1));
  },
};

/** Present: only the viewport, search and sheet controls remain; no add, no undo (AC 17). */
export const Present: Story = {
  args: { variant: "present" },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    const bar = controls(region);
    await expect(bar.querySelector('[data-command="board.add-node"]')).toBeNull();
    await expect(bar.querySelector('[data-command="board.undo"]')).toBeNull();
    await expect(bar.querySelector('[data-command="board.zoom-in"]')).not.toBeNull();
    await expect(bar.querySelector('[data-command="board.shortcut-sheet"]')).not.toBeNull();
  },
};

/** The controls under every profile in both modes. */
export const RecipesAndModes: Story = {
  render: (args) => (
    <Matrix>
      <MatrixBoard {...args} height={300} />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll<HTMLElement>("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    for (const cell of cells) await expect(controls(cell)).toBeVisible();
  },
};

/* The centre dock with a chapter strip (ORV-274). ------------------------------------------------ */

type Lang = "th" | "en";

const DOCK = {
  th: {
    readOnly: "ดูอย่างเดียว",
    bar: "เครื่องมือกระดาน",
    chapters: ["แนวคิด", "โลโก้", "สี", "ตัวอักษร", "มู้ดบอร์ด", "โปรไฟล์"],
    current: "โลโก้",
  },
  en: {
    readOnly: "View only",
    bar: "Board tools",
    chapters: ["Concept", "Logo", "Colour", "Type", "Mood board", "Profile"],
    current: "Logo",
  },
} as const;

/** The page's chapter strip: ghost `sm` buttons, the current one marked `aria-current`. */
function ChapterStrip({ lang }: { lang: Lang }) {
  const words = DOCK[lang];
  return (
    <>
      {words.chapters.map((name) => (
        <Button
          key={name}
          variant="ghost"
          size="sm"
          {...(name === words.current ? { "aria-current": "true" as const } : {})}
        >
          {name}
        </Button>
      ))}
    </>
  );
}

function DockBoard({ lang, matrix = false }: { lang: Lang; matrix?: boolean }) {
  const Board = matrix ? MatrixBoard : Stateful;
  return (
    <Board
      initial={BOARD}
      label={DOCK[lang].readOnly}
      variant="present"
      chrome={false}
      minimap={false}
      height={matrix ? 300 : 420}
      fill={!matrix}
    >
      <CanvasControls position="center">
        <ChapterStrip lang={lang} />
      </CanvasControls>
    </Board>
  );
}

const box = (el: Element) => el.getBoundingClientRect();
const centreX = (el: Element) => (box(el).left + box(el).right) / 2;

/** What is in the bar, in order: its class, or the command a control runs. */
const barOrder = (bar: HTMLElement) =>
  [...bar.children].map(
    (c) =>
      c.getAttribute("data-command") ??
      c.querySelector("[data-command]")?.getAttribute("data-command") ??
      c.className.split(" ").find((n) => n.startsWith("ds-controls__")) ??
      c.tagName,
  );

/**
 * A hover widens a present edge to the chain width and keeps its hue (ORV-274, S2). The drawn
 * width is the computed `stroke-width` times the path's screen scale. The pointer is a real one
 * (Vitest browser mode), as the `Calendar` hover is, so the static Storybook skips this part.
 */
async function expectEdgeHoverWidth(
  region: HTMLElement,
  id: string,
  rest: number,
  hovered: number,
) {
  const edge = region.querySelector(`.react-flow__edge[data-id="${id}"]`) as Element;
  const path = edge.querySelector(".ds-edge__path") as SVGPathElement;
  const target = edge.querySelector(".react-flow__edge-interaction") as SVGPathElement;
  const drawnWidth = () =>
    parseFloat(getComputedStyle(path).strokeWidth) * (path.getScreenCTM()?.a ?? NaN);
  await expect(drawnWidth()).toBeCloseTo(rest, 1);
  const stroke = getComputedStyle(path).stroke;
  // The point 30% along the path, on screen, relative to the interaction path's rect.
  const at = path
    .getPointAtLength(0.3 * path.getTotalLength())
    .matrixTransform(path.getScreenCTM() ?? undefined);
  const rect = target.getBoundingClientRect();
  const { userEvent: real } = await import("vitest/browser");
  await real.hover(target, { position: { x: at.x - rect.left, y: at.y - rect.top } });
  await waitFor(() => expect(edge.matches(":hover")).toBe(true));
  await waitFor(() => expect(drawnWidth()).toBeCloseTo(hovered, 1));
  await expect(getComputedStyle(path).stroke).toBe(stroke);
  await real.unhover(target);
  await waitFor(() => expect(edge.matches(":hover")).toBe(false));
}

async function playDock(root: HTMLElement, lang: Lang) {
  const words = DOCK[lang];
  const region = within(root).getByRole("region", { name: words.readOnly });
  await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
  // The edges mount after the nodes are measured; the hover check below needs them.
  await waitFor(() =>
    expect(region.querySelectorAll(".react-flow__edge")).toHaveLength(BOARD.edges.length),
  );
  const bar = within(region).getByRole("toolbar", { name: words.bar });
  // The dock is centred on the board, inside it and above its bottom edge.
  const board = box(region);
  await expect(Math.abs(centreX(bar) - centreX(region))).toBeLessThanOrEqual(1);
  await expect(box(bar).left).toBeGreaterThanOrEqual(board.left);
  await expect(box(bar).right).toBeLessThanOrEqual(board.right);
  await expect(box(bar).bottom).toBeLessThanOrEqual(board.bottom);
  await expect(bar).toHaveAttribute("data-position", "center");
  // The read-only word first, then the children, a divider, and the four zoom commands. No minimap,
  // undo, add or find: a dock keeps what moves the viewport.
  await expect(barOrder(bar)).toEqual([
    "ds-controls__mode",
    "ds-controls__divider",
    "ds-controls__children",
    "ds-controls__divider",
    "board.zoom-out",
    "board.zoom-100",
    "board.zoom-in",
    "board.zoom-to-fit",
  ]);
  await expect(bar.querySelector(".ds-controls__mode")).toHaveTextContent(words.readOnly);
  // The word moved into the dock: the board's own corner badge is hidden, so it is said once.
  const badge = region.querySelector(".ds-board__mode");
  await expect(getComputedStyle(badge as Element).display).toBe("none");
  // Parts read left to right.
  const at = (selector: string) => box(bar.querySelector(selector) as Element);
  await expect(at(".ds-controls__mode").right).toBeLessThanOrEqual(
    at(".ds-controls__children").left,
  );
  await expect(at(".ds-controls__children").right).toBeLessThanOrEqual(
    at('[data-command="board.zoom-out"]').left,
  );
  // One chapter is current; the others are plain ghost buttons.
  const strip = bar.querySelector(".ds-controls__children") as HTMLElement;
  const buttons = within(strip).getAllByRole("button");
  await expect(buttons).toHaveLength(words.chapters.length);
  await expect(strip.querySelectorAll('[aria-current="true"]')).toHaveLength(1);
  await expect(within(strip).getByRole("button", { name: words.current })).toHaveAttribute(
    "aria-current",
    "true",
  );
  // Hover widens a present edge: a type edge from 1.5 to 2.5 px, a derived edge from 2.5 to 3.5.
  if (inVitest) {
    await expectEdgeHoverWidth(region, "e-type-profile", 1.5, 2.5);
    await expectEdgeHoverWidth(region, "e-logo-palette", 2.5, 3.5);
  }
  // At zoom 1 no card or port dot covers an edge pill (sign-off 2 R1). The window decides the fit
  // zoom (0.88 in Vitest's 1200 px frame, where a full-size pill is the accepted residual below zoom
  // 1), so the check is made at the dock's own 100 percent. The count keeps it from passing before
  // the pills are drawn.
  await userEvent.click(bar.querySelector('[data-command="board.zoom-100"]') as HTMLElement);
  await waitFor(() => {
    expect(viewportZoom(region)).toBeCloseTo(1, 3);
    expect(expectPillsClear(region)).toBeGreaterThan(0);
  });
}

/**
 * The centre dock (spec row 12): "View only", the page's chapter strip, a divider, then zoom out,
 * the percent, zoom in and fit. Centred on the board; the board's own corner badge steps aside.
 */
export const WithChapters: Story = {
  render: () => <DockBoard lang="th" />,
  play: async ({ canvasElement }) => playDock(canvasElement, "th"),
};

/** The dock with English words ("View only"), in dark mode. */
export const WithChaptersInEnglish: Story = {
  globals: { locale: "en", mode: "dark" },
  render: () => <DockBoard lang="en" />,
  play: async ({ canvasElement }) => playDock(canvasElement, "en"),
};

/**
 * Runs `check` with the browser at 360 by 640, then puts the size back. The dock's narrow rules
 * are a viewport media query, and Vitest's browser iframe is 1200 by 900, so a 360 px frame alone
 * would not match it. The static Storybook has no `vitest/browser`; there the frame is the
 * viewport the toolbar chose.
 */
async function atPhoneSize(check: () => Promise<void>) {
  if (!inVitest) return check();
  const { page } = await import("vitest/browser");
  const before = { width: window.innerWidth, height: window.innerHeight };
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

async function playDockAt360(root: HTMLElement, lang: Lang) {
  await atPhoneSize(() => checkDockAt360(root, lang));
}

async function checkDockAt360(root: HTMLElement, lang: Lang) {
  const words = DOCK[lang];
  const region = within(root).getByRole("region", { name: words.readOnly });
  await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
  const bar = within(region).getByRole("toolbar", { name: words.bar });
  const flow = region.querySelector(".ds-board__flow") as HTMLElement;
  // The bar is as wide as the board's flow area less one inset (8 px) on each side.
  await waitFor(() => expect(box(bar).width).toBeCloseTo(box(flow).width - 16, 0));
  await expect(box(bar).left).toBeGreaterThanOrEqual(box(region).left);
  await expect(box(bar).right).toBeLessThanOrEqual(box(region).right);
  // The zoom steps give way; fit stays, and so does the percent's absence from the tab order.
  for (const id of ["board.zoom-out", "board.zoom-in"]) {
    await expect(
      getComputedStyle(bar.querySelector(`[data-command="${id}"]`) as Element).display,
    ).toBe("none");
  }
  await expect(getComputedStyle(bar.querySelector(".ds-controls__zoom") as Element).display).toBe(
    "none",
  );
  await expect(bar.querySelector('[data-command="board.zoom-to-fit"]')).toBeVisible();
  // The chapters stay in one row and scroll sideways.
  const strip = bar.querySelector(".ds-controls__children") as HTMLElement;
  await expect(getComputedStyle(strip).overflowX).toBe("auto");
  await expect(strip.scrollWidth).toBeGreaterThan(strip.clientWidth);
  const first = box(within(strip).getAllByRole("button")[0] as Element);
  await expect(box(strip).height).toBeLessThan(first.height * 1.5);
  // The read-only word is hidden from sight but still in the accessible tree.
  const word = within(bar).getByText(words.readOnly);
  await expect(word).toBeInTheDocument();
  await expect(box(word).width).toBeLessThanOrEqual(1);
  await expect(getComputedStyle(word).clipPath).toContain("inset");
  // Its divider goes with it: no empty gap opens at the start of the bar.
  const gap = bar.querySelector(".ds-controls__mode + .ds-controls__divider") as Element;
  await expect(box(gap).width).toBe(0);
  // One row: the chapter strip and the fit button share a middle line.
  const fit = bar.querySelector('[data-command="board.zoom-to-fit"]') as Element;
  await expect(
    Math.abs((box(strip).top + box(strip).bottom) / 2 - (box(fit).top + box(fit).bottom) / 2),
  ).toBeLessThanOrEqual(1);
  await expect(getComputedStyle(word).display).not.toBe("none");
  await expect(getComputedStyle(word).visibility).toBe("visible");
}

/** The dock at 360 px: one row, the zoom steps hidden, fit kept, the word still read aloud. */
export const WithChaptersAt360: Story = {
  render: () => (
    <Narrow>
      <DockBoard lang="th" />
    </Narrow>
  ),
  play: async ({ canvasElement }) => playDockAt360(canvasElement, "th"),
};

/** The 360 px dock with English words, in dark mode. */
export const WithChaptersAt360InEnglish: Story = {
  globals: { locale: "en", mode: "dark" },
  render: () => (
    <Narrow>
      <DockBoard lang="en" />
    </Narrow>
  ),
  play: async ({ canvasElement }) => playDockAt360(canvasElement, "en"),
};

/** The dock under three profiles in both modes: one current chapter, the selection pair, all six. */
export const PresentRecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <DockBoard lang="th" matrix />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll<HTMLElement>("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    for (const cell of cells) {
      await waitFor(() => expect(nodeEls(cell)).toHaveLength(BOARD_NODES.length));
      const bar = controls(cell);
      await expect(bar).toBeVisible();
      await expect(bar).toHaveAttribute("data-position", "center");
      const current = bar.querySelector('[aria-current="true"]') as HTMLElement;
      await expect(current).toHaveTextContent(DOCK.th.current);
      const bg = resolvedColor(cell, "--ds-selection-bg");
      const fg = resolvedColor(cell, "--ds-selection-fg");
      await expect(getComputedStyle(current).backgroundColor).toBe(bg);
      await expect(getComputedStyle(current).color).toBe(fg);
    }
  },
};
