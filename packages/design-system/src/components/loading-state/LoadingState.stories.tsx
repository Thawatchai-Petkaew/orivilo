import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import { expectFrameCutsNoInk, expectLinesClear, inVitest } from "../../testing/visual-asserts";
import { Button } from "../button/Button";
import { fixtures, loadingStateFixtures } from "../fixtures";
import { Matrix, Narrow } from "../matrix";
import { LoadingState } from "./LoadingState";

const th = loadingStateFixtures.th;
const en = loadingStateFixtures.en;

const meta = {
  title: "Application/Loading state",
  component: LoadingState,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A region that waits (ORV-223): the Spinner ring with its label under it and an optional stop action, centred and capped at the panel width. `status` speaks once through the Spinner's own status; `off` speaks nothing, for a region that owns its status (the loading CanvasBoard). It sets no `aria-busy`: the region that waits sets it on itself (the InRegion story). It has no pulse. The words and the stop action in these stories are mock: no press stops a job.",
      },
    },
  },
} satisfies Meta<typeof LoadingState>;

export default meta;
type Story = StoryObj<typeof meta>;

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

const rootsOf = (root: Element) =>
  Array.from(root.querySelectorAll<HTMLElement>(".ds-loading-state"));
const ringOf = (root: Element) =>
  root.querySelector<HTMLElement>(".ds-spinner__ring") as HTMLElement;
/** The label of either form: the Spinner's own span or the `off` form's `p`. */
const labelOf = (root: Element) =>
  root.querySelector<HTMLElement>(".ds-spinner__label, .ds-loading-state__label") as HTMLElement;
const near = (actual: number, expected: number, what: string) =>
  expect(
    Math.abs(actual - expected),
    `${what}: ${actual} px, expected ${expected} px`,
  ).toBeLessThanOrEqual(0.5);

/**
 * The ring turns even under reduced motion (`spin-motion-1`), so two shots of one frame differ by
 * the ring's angle. `expectFrameCutsNoInk` compares two shots, so the ring is held still (inline
 * `animation: none`, put back after) for the call; the label and the clips are what it checks.
 */
async function withRingsStill(scope: ParentNode, run: () => Promise<void>) {
  const rings = Array.from(scope.querySelectorAll<SVGElement>(".ds-spin"));
  const before = rings.map((ring) => ring.style.animation);
  for (const ring of rings) ring.style.animation = "none";
  try {
    await run();
  } finally {
    rings.forEach((ring, i) => {
      ring.style.animation = before[i] ?? "";
    });
  }
}

/** The mock stop action: it names its outcome and stops nothing. */
const stopAction = (copy: typeof th | typeof en, onClick?: () => void) => (
  <Button variant="secondary" size="md" onClick={onClick}>
    {copy.action}
  </Button>
);

/** The mock action of `WithAction`: counts its presses, runs nothing. */
const press = fn();

/** No props: the ring turns with "กำลังโหลด" under it, in one status, capped at the panel width. */
export const Default: Story = {
  render: () => <LoadingState />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [root] = rootsOf(canvasElement) as [HTMLElement];
    const statuses = canvas.getAllByRole("status");
    await expect(statuses).toHaveLength(1);
    await expect(statuses[0]).toHaveTextContent("กำลังโหลด");
    const ring = ringOf(root);
    await expect(ring).toHaveAttribute("aria-hidden", "true");
    near(ring.getBoundingClientRect().width, 24, "the ring's width");
    await expect(labelOf(root).getBoundingClientRect().top).toBeGreaterThanOrEqual(
      ring.getBoundingClientRect().bottom,
    );

    // The cap: the parent is a block box wider than the cap, and the root does not fill it.
    const parent = root.parentElement as HTMLElement;
    const parentStyle = getComputedStyle(parent);
    await expect(parentStyle.display).toBe("block");
    const content =
      parent.clientWidth -
      parseFloat(parentStyle.paddingLeft) -
      parseFloat(parentStyle.paddingRight);
    const cap = resolvedLength(root, "--cmp-loading-state-max-width");
    await expect(
      content,
      "the parent is not wider than the cap, so the cap proves nothing",
    ).toBeGreaterThan(cap);
    await expect(root.getBoundingClientRect().width).toBeLessThanOrEqual(cap + 0.01);
  },
};

/** The wait with the caller's label and a stop action 16 px under the status, outside it. */
export const WithAction: Story = {
  render: () => <LoadingState label={th.label} action={stopAction(th, press)} />,
  play: async ({ canvasElement }) => {
    press.mockClear();
    const canvas = within(canvasElement);
    const [root] = rootsOf(canvasElement) as [HTMLElement];
    const status = canvas.getByRole("status");
    await expect(status.textContent).toBe(th.label);
    const button = canvas.getByRole("button", { name: th.action });
    await expect(within(status).queryByRole("button")).toBeNull();
    await expect(status.contains(button)).toBe(false);
    near(
      (root.querySelector(".ds-loading-state__action") as HTMLElement).getBoundingClientRect().top -
        status.getBoundingClientRect().bottom,
      16,
      "status to action",
    );
    await userEvent.click(button);
    await expect(press).toHaveBeenCalledTimes(1);
  },
};

/** `status` and `live="off"` side by side: the same ring and words twice, one speaking. */
export const LiveOff: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-8">
      <LoadingState />
      <LoadingState live="off" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [on, off] = rootsOf(canvasElement) as [HTMLElement, HTMLElement];
    await expect(canvas.queryAllByRole("status")).toHaveLength(1);
    await expect(within(on).getAllByRole("status")).toHaveLength(1);
    await expect(off.querySelectorAll("[role]")).toHaveLength(0);
    const words = off.querySelector("p") as HTMLElement;
    await expect(words).toHaveTextContent("กำลังโหลด");
    await expect(words).toBe(labelOf(off));
    await expect(ringOf(off)).toHaveAttribute("aria-hidden", "true");
    const ringOn = ringOf(on).getBoundingClientRect();
    const ringOff = ringOf(off).getBoundingClientRect();
    const labelOn = labelOf(on).getBoundingClientRect();
    const labelOff = labelOf(off).getBoundingClientRect();
    near(ringOff.width, ringOn.width, "ring width");
    near(ringOff.height, ringOn.height, "ring height");
    near(labelOff.width, labelOn.width, "label width");
    near(labelOff.height, labelOn.height, "label height");
    near(labelOff.top - ringOff.bottom, labelOn.top - ringOn.bottom, "ring to label gap");
  },
};

/**
 * A host region owns `aria-busy` (`load-busy-1`): it is `true` while the region waits and gone when
 * the content arrives. LoadingState sets none. The trigger sits outside the region and is mock.
 */
function RegionHost({ copy = th }: { copy?: typeof th | typeof en }) {
  const [waiting, setWaiting] = useState(true);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="secondary" size="sm" onClick={() => setWaiting(false)}>
          {copy.done}
        </Button>
      </div>
      <div data-testid="region" aria-busy={waiting ? true : undefined}>
        {waiting ? <LoadingState label={copy.label} /> : <p className="m-0">{copy.loaded}</p>}
      </div>
    </div>
  );
}

/** The region that waits is busy, then free; the ring and words give way to the loaded content. */
export const InRegion: Story = {
  render: () => <RegionHost />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByTestId("region");
    await expect(region).toHaveAttribute("aria-busy", "true");
    await expect(canvas.getByText(th.label)).toBeVisible();
    const [root] = rootsOf(canvasElement) as [HTMLElement];
    await expect(root).not.toHaveAttribute("aria-busy");
    await expect(root.querySelector("[aria-busy]")).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: th.done }));
    await waitFor(() => expect(region).not.toHaveAttribute("aria-busy"));
    await expect(canvas.getByText(th.loaded)).toBeVisible();
    await expect(canvas.queryByText(th.label)).toBeNull();
    await expect(rootsOf(canvasElement)).toHaveLength(0);
  },
};

/** English: the default wait, the wait with its stop action, and the quiet form, all from the English words. */
export const InEnglish: Story = {
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  render: () => (
    <div className="flex flex-col gap-8">
      <LoadingState />
      <LoadingState label={en.label} action={stopAction(en)} />
      <LoadingState live="off" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [plain, withAction, quiet] = rootsOf(canvasElement) as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
    ];
    await expect(within(plain).getByRole("status")).toHaveTextContent("Loading");
    await expect(within(withAction).getByRole("status").textContent).toBe(en.label);
    await expect(within(withAction).getByRole("button", { name: en.action })).toBeVisible();
    await expect(canvas.getAllByRole("status")).toHaveLength(2);
    await expect(quiet.querySelectorAll("[role]")).toHaveLength(0);
    await expect(labelOf(quiet)).toHaveTextContent("Loading");
    await expect(labelOf(quiet)).toBeVisible();
  },
};

/** A frame 360 px wide: a long Thai label wraps under the ring, centred, with the action under it. */
export const LongAt360: Story = {
  render: () => (
    <Narrow>
      <div data-testid="frame" className="flex flex-col gap-8" style={{ paddingTop: 0.3 }}>
        <LoadingState label={fixtures.longThai} action={stopAction(th)} />
        <LoadingState live="off" label={fixtures.longThai} action={stopAction(th)} />
      </div>
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(360);
    const roots = rootsOf(frame);
    await expect(roots).toHaveLength(2);
    for (const root of roots) {
      const label = labelOf(root);
      // Nothing from the label up to the frame clips: every ancestor is visible on both axes.
      for (let el: HTMLElement | null = label; el; el = el === frame ? null : el.parentElement) {
        const style = getComputedStyle(el);
        await expect(style.overflowX, `${el.className || el.localName} clips on x`).toBe("visible");
        await expect(style.overflowY, `${el.className || el.localName} clips on y`).toBe("visible");
      }
      // The label wraps and is centred under the ring.
      await expect(label.getBoundingClientRect().height).toBeGreaterThan(30);
      await expect(getComputedStyle(label).textAlign).toBe("center");
      const box = label.getBoundingClientRect();
      await expect(box.left).toBeGreaterThanOrEqual(frame.getBoundingClientRect().left);
      await expect(box.right).toBeLessThanOrEqual(frame.getBoundingClientRect().right);
      if (inVitest) {
        await expectLinesClear(label);
        await withRingsStill(frame, () => expectFrameCutsNoInk(label, frame));
      }
    }
  },
};

/** The wait, with its stop action, under the three profiles in both modes. */
export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <LoadingState label={th.label} action={stopAction(th)} />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    await expect(within(canvasElement).getAllByRole("status")).toHaveLength(6);
    for (const cell of cells) {
      await expect(cell.querySelectorAll(".ds-loading-state")).toHaveLength(1);
      await expect(
        within(cell as HTMLElement).getByRole("button", { name: th.action }),
      ).toBeVisible();
    }
  },
};

/**
 * Type contract (`load-api-1`), checked by `pnpm typecheck`. The rejected elements are created and
 * dropped, never mounted: `live="alert"`, a `size` prop and `children` are each a type error. The
 * story draws the one valid form.
 */
export const TypeContract: Story = {
  render: () => {
    const rejected = [
      // @ts-expect-error live is `status` or `off`, never `alert`
      <LoadingState live="alert" />,
      // @ts-expect-error the ring is always the Spinner at lg: there is no size
      <LoadingState size="sm" />,
      // @ts-expect-error the label is a prop; there are no children
      <LoadingState>{th.label}</LoadingState>,
    ];
    return (
      <div data-rejected={rejected.length}>
        <LoadingState />
      </div>
    );
  },
};
