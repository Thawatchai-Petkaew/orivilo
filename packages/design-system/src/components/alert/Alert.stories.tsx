import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import {
  expectFrameCutsNoInk,
  expectLabelInkWhole,
  expectLinesClear,
  expectTitleOverText,
  inVitest,
} from "../../testing/visual-asserts";
import { Button } from "../button/Button";
import { alertFixtures, fixtureJobs, fixtures } from "../fixtures";
import { Matrix } from "../matrix";
import { Alert } from "./Alert";

const meta = {
  title: "Base/Alert",
  component: Alert,
  args: {
    variant: "danger",
    title: alertFixtures.th.danger.title,
    description: alertFixtures.th.danger.description,
  },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          'An inline message for one feedback kind (ORV-222): a tile, a title that says what happened and a description that says the fix, with an optional action and close. It sits where the job lives and stays until the caller takes it out; it never takes focus and has no animation. Danger announces itself as an alert and the other three kinds as a status; `live` can raise warning and info to an alert or switch any kind off. A message already on the page at first render takes `live="off"`; a message that arrives later goes into the screen\'s own live container with `live="off"`. The jobs in these stories are mock data: no job ran, and no screen reader test has been run.',
      },
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

const VARIANTS = ["success", "warning", "danger", "info"] as const;
type Variant = (typeof VARIANTS)[number];
type Copy = Record<Variant, { title: string; description: string; action: string }>;

/** Spies the plays read; each play clears its own before it presses anything. */
const onAction = fn();
const onDismiss = fn();

/** The four variants in a column, each with the optional parts a story asks for. */
function Stack({
  copy = alertFixtures.th,
  live,
  withAction = false,
  dismissible,
}: {
  copy?: Copy;
  live?: "off";
  withAction?: boolean;
  dismissible?: (variant: Variant) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {VARIANTS.map((variant) => (
        <Alert
          key={variant}
          variant={variant}
          title={copy[variant].title}
          description={copy[variant].description}
          live={live}
          action={
            withAction ? (
              <Button size="sm" variant="secondary" onClick={onAction}>
                {copy[variant].action}
              </Button>
            ) : undefined
          }
          onDismiss={dismissible ? () => dismissible(variant) : undefined}
        />
      ))}
    </div>
  );
}

const alertsOf = (root: Element) => Array.from(root.querySelectorAll<HTMLElement>(".ds-alert"));

function part(alert: HTMLElement, selector: string) {
  const el = alert.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`no ${selector} in the ${alert.dataset["variant"]} alert`);
  return el;
}

/** The vertical centre of the title's first line, from its box and its computed line height. */
function firstLineCentre(title: HTMLElement) {
  return title.getBoundingClientRect().top + parseFloat(getComputedStyle(title).lineHeight) / 2;
}

const centreOf = (el: Element) => {
  const box = el.getBoundingClientRect();
  return box.top + box.height / 2;
};

/** The title's first line centres on the tile (`alert-look-1`), within 0.5 px. */
async function expectTitleOnTile(alert: HTMLElement) {
  const off =
    firstLineCentre(part(alert, ".ds-alert__title")) - centreOf(part(alert, ".ds-featured-icon"));
  await expect(
    Math.abs(off),
    `the ${alert.dataset["variant"]} title's first line is ${off} px off the tile's centre`,
  ).toBeLessThanOrEqual(0.5);
}

/** Four blocks with the fixture copy: a tile, a title over a description, no close, no action. */
export const Variants: Story = {
  render: () => <Stack />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alerts = alertsOf(canvasElement);
    await expect(alerts).toHaveLength(4);
    for (const [i, alert] of alerts.entries()) {
      const variant = VARIANTS[i] as Variant;
      const copy = alertFixtures.th[variant];
      await expect(alert).toHaveAttribute("data-variant", variant);
      await expect(canvas.getByText(copy.title)).toBeVisible();
      await expect(canvas.getByText(copy.description)).toBeVisible();
      expectTitleOverText(part(alert, ".ds-alert__title"), part(alert, ".ds-alert__description"), {
        gap: 4,
      });
      await expectTitleOnTile(alert);
      // The tile is the block's own kind and is hidden from assistive technology (`fi-a11y-1`).
      await expect(part(alert, ".ds-featured-icon")).toHaveAttribute("data-variant", variant);
      await expect(part(alert, ".ds-featured-icon")).toHaveAttribute("aria-hidden", "true");
      // No animation and no transition (`alert-look-1`).
      await expect(getComputedStyle(alert).animationName).toBe("none");
      await expect(getComputedStyle(alert).transitionDuration).toBe("0s");
    }
    await expect(canvas.queryAllByRole("button")).toHaveLength(0);
  },
};

/** No `live` prop: each kind announces what `alert-live-1` gives it (worked example W2). */
export const LiveRoles: Story = {
  render: () => <Stack />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const status = canvas.getAllByRole("status");
    const alert = canvas.getAllByRole("alert");
    await expect(status).toHaveLength(3);
    await expect(alert).toHaveLength(1);
    const holds = (nodes: HTMLElement[], variant: Variant) =>
      expect(nodes.some((n) => n.textContent?.includes(alertFixtures.th[variant].title))).toBe(
        true,
      );
    await holds(alert, "danger");
    for (const variant of ["success", "warning", "info"] as const) await holds(status, variant);
    // Each role sits on its own block, and the title is inside it.
    for (const node of [...status, ...alert]) await expect(node).toHaveClass("ds-alert");
  },
};

/** Warning and info raised to an alert with `live="alert"`; they look as in `Variants`. */
export const LiveRaised: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {(["warning", "info"] as const).map((variant) => (
        <Alert
          key={variant}
          variant={variant}
          title={alertFixtures.th[variant].title}
          description={alertFixtures.th[variant].description}
          live="alert"
        />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole("alert")).toHaveLength(2);
    await expect(within(canvasElement).queryAllByRole("status")).toHaveLength(0);
  },
};

/** A message in a screen's first render takes `live="off"`: read in page order, no role (`alert-load-1`). */
export const AtLoad: Story = {
  render: () => <Stack live="off" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryAllByRole("alert")).toHaveLength(0);
    await expect(canvas.queryAllByRole("status")).toHaveLength(0);
    for (const alert of alertsOf(canvasElement)) await expect(alert).not.toHaveAttribute("role");
    for (const variant of VARIANTS) {
      await expect(canvas.getByText(alertFixtures.th[variant].title)).toBeVisible();
    }
  },
};

/**
 * The technique's order (`alert-mount-1`): the screen's own live containers are in the page from
 * its first render, empty, and the Alert goes inside with `live="off"` when the message arrives.
 */
function ContainerFirstHost() {
  const [shown, setShown] = useState(false);
  const copy = alertFixtures.th;
  return (
    <div className="flex flex-col gap-3">
      <div>
        <Button onClick={() => setShown(true)}>{copy.trigger}</Button>
      </div>
      <div role="alert" data-testid="alert-container">
        {shown ? (
          <Alert
            variant="danger"
            title={copy.danger.title}
            description={copy.danger.description}
            live="off"
          />
        ) : null}
      </div>
      <div role="status" data-testid="status-container">
        {shown ? (
          <Alert
            variant="success"
            title={copy.success.title}
            description={copy.success.description}
            live="off"
          />
        ) : null}
      </div>
    </div>
  );
}

export const ContainerFirst: Story = {
  render: () => <ContainerFirstHost />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alertBox = canvas.getByTestId("alert-container");
    const statusBox = canvas.getByTestId("status-container");
    await expect(alertBox.textContent).toBe("");
    await expect(statusBox.textContent).toBe("");
    await userEvent.click(canvas.getByRole("button", { name: alertFixtures.th.trigger }));
    await waitFor(() => expect(alertBox.textContent).toContain(alertFixtures.th.danger.title));
    // The same DOM nodes now hold the message: the role existed before its text.
    await expect(canvas.getByTestId("alert-container")).toBe(alertBox);
    await expect(canvas.getByTestId("status-container")).toBe(statusBox);
    await expect(statusBox.textContent).toContain(alertFixtures.th.success.title);
    await expect(canvas.getAllByRole("alert")).toHaveLength(1);
    await expect(canvas.getAllByRole("status")).toHaveLength(1);
    for (const box of [alertBox, statusBox]) {
      await expect(within(box).getByText(/./, { selector: ".ds-alert__title" })).toBeVisible();
      await expect(
        part(box.querySelector(".ds-alert") as HTMLElement, ".ds-alert__title"),
      ).toBeVisible();
      await expect(box.querySelector(".ds-alert")).not.toHaveAttribute("role");
    }
  },
};

/** An Alert that mounts with its role while the person works: the keyboard stays where it was (`alert-focus-1`). */
function ArrivesLaterHost() {
  const [shown, setShown] = useState(false);
  const copy = alertFixtures.th;
  return (
    <div className="flex flex-col gap-3">
      <div>
        <Button onClick={() => setShown(true)}>{copy.trigger}</Button>
      </div>
      {shown ? (
        <Alert variant="danger" title={copy.danger.title} description={copy.danger.description} />
      ) : null}
    </div>
  );
}

export const ArrivesLater: Story = {
  render: () => <ArrivesLaterHost />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: alertFixtures.th.trigger });
    trigger.focus();
    await expect(document.activeElement).toBe(trigger);
    await userEvent.keyboard("{Enter}");
    const alert = await canvas.findByRole("alert");
    await waitFor(() => expect(canvas.getByText(alertFixtures.th.danger.title)).toBeVisible());
    await expect(document.activeElement).toBe(trigger);
    await expect(alert).not.toHaveAttribute("tabindex");
    await expect(alert.matches(":focus-within")).toBe(false);
  },
};

/** Each kind with its action under the text; the caller's own Button, small and secondary. */
export const WithAction: Story = {
  render: () => <Stack withAction />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const variant of VARIANTS) {
      await expect(
        canvas.getByRole("button", { name: alertFixtures.th[variant].action }),
      ).toBeVisible();
    }
    // The action sits 8 px under the description (the content gap plus the wrapper's margin).
    for (const alert of alertsOf(canvasElement)) {
      const under =
        part(alert, ".ds-alert__action").getBoundingClientRect().top -
        part(alert, ".ds-alert__description").getBoundingClientRect().bottom;
      await expect(
        Math.abs(under - 8),
        `the ${alert.dataset["variant"]} action is ${under} px under the text`,
      ).toBeLessThanOrEqual(0.5);
    }
    onAction.mockClear();
    await userEvent.click(canvas.getByRole("button", { name: alertFixtures.th.danger.action }));
    await expect(onAction).toHaveBeenCalledTimes(1);
  },
};

/**
 * Four closable blocks and the control that comes next. The caller removes the block and moves
 * focus on (`alert-stay-1`); Alert does neither.
 */
function DismissibleHost({ copy = alertFixtures.th }: { copy?: typeof alertFixtures.th }) {
  const [open, setOpen] = useState<readonly Variant[]>(VARIANTS);
  const next = useRef<HTMLDivElement>(null);
  const dismiss = (variant: Variant) => {
    onDismiss(variant);
    flushSync(() => setOpen((all) => all.filter((v) => v !== variant)));
    next.current?.querySelector("button")?.focus();
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        {VARIANTS.filter((v) => open.includes(v)).map((variant) => (
          <Alert
            key={variant}
            variant={variant}
            title={copy[variant].title}
            description={copy[variant].description}
            onDismiss={() => dismiss(variant)}
          />
        ))}
      </div>
      <div ref={next}>
        <Button>{copy.next}</Button>
      </div>
    </div>
  );
}

export const Dismissible: Story = {
  render: () => <DismissibleHost />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const closes = canvas.getAllByRole("button", { name: "ปิดข้อความนี้" });
    await expect(closes).toHaveLength(4);
    for (const alert of alertsOf(canvasElement)) {
      const close = part(alert, ".ds-alert__close");
      // The close centres on the title's first line and sits at the top end corner: the 1 px
      // edge and the 16 px padding from the block's end edge.
      const off = firstLineCentre(part(alert, ".ds-alert__title")) - centreOf(close);
      await expect(
        Math.abs(off),
        `the ${alert.dataset["variant"]} title's first line is ${off} px off the close`,
      ).toBeLessThanOrEqual(0.5);
      const fromEnd = alert.getBoundingClientRect().right - close.getBoundingClientRect().right;
      await expect(Math.abs(fromEnd - 17)).toBeLessThanOrEqual(0.5);
    }
    onDismiss.mockClear();
    // Escape does nothing: the APG lists no keyboard interaction for an alert.
    await userEvent.keyboard("{Escape}");
    await expect(alertsOf(canvasElement)).toHaveLength(4);
    await expect(onDismiss).toHaveBeenCalledTimes(0);
    const danger = part(
      alertsOf(canvasElement).find((a) => a.dataset["variant"] === "danger") as HTMLElement,
      ".ds-alert__close",
    );
    for (let i = 0; i < 8 && document.activeElement !== danger; i += 1) await userEvent.tab();
    await expect(document.activeElement).toBe(danger);
    await userEvent.keyboard("{Enter}");
    await expect(onDismiss).toHaveBeenCalledTimes(1);
    await expect(onDismiss).toHaveBeenCalledWith("danger");
    await expect(canvas.queryByText(alertFixtures.th.danger.title)).toBeNull();
    await expect(alertsOf(canvasElement)).toHaveLength(3);
    await expect(document.activeElement).toBe(
      canvas.getByRole("button", { name: alertFixtures.th.next }),
    );
  },
};

/** The states of `Variants`, `AtLoad`, `WithAction` and `Dismissible` with the English copy. */
export const InEnglish: Story = {
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  render: () => (
    <div className="flex flex-col gap-6">
      <Stack copy={alertFixtures.en} />
      <Stack copy={alertFixtures.en} live="off" />
      <Stack copy={alertFixtures.en} withAction />
      <Stack copy={alertFixtures.en} dismissible={() => undefined} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const variant of VARIANTS) {
      await expect(canvas.getAllByText(alertFixtures.en[variant].title)).toHaveLength(4);
      await expect(
        canvas.getByRole("button", { name: alertFixtures.en[variant].action }),
      ).toBeVisible();
    }
    await expect(canvas.getAllByRole("button", { name: "Dismiss this message" })).toHaveLength(4);
    await expect(canvas.getAllByText(alertFixtures.en.danger.description)).toHaveLength(4);
  },
};

/** The frame of the 360 px stories: it clips nothing, so a clipped title shows as a failed play. */
function Frame({ children }: { children: ReactNode }) {
  return (
    <div data-testid="frame" className="w-[360px] max-w-full">
      {children}
    </div>
  );
}

/**
 * The longest Thai title and the longest reason wrap inside a 360 px block, with an action and a
 * close, and nothing is cut (`alert-copy-1`). The frame, the block and the content clip nothing
 * (spec ORV-222 v1.3, row 18): the overflow loop reads their computed style, and
 * `expectFrameCutsNoInk` reads the pixels from the title up to the frame, so a clip on any of them
 * goes red by ink as well.
 */
export const LongAt360: Story = {
  render: () => (
    <Frame>
      <Alert
        variant="danger"
        title={fixtures.longThai}
        description={fixtureJobs.longReason.reason}
        action={
          <Button size="sm" variant="secondary" onClick={onAction}>
            {alertFixtures.th.danger.action}
          </Button>
        }
        onDismiss={onDismiss}
      />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(360);
    const [alert] = alertsOf(frame);
    const title = part(alert as HTMLElement, ".ds-alert__title");
    const description = part(alert as HTMLElement, ".ds-alert__description");
    // Neither element is clamped: each is as tall as its text.
    for (const el of [title, description]) {
      await expect(el.scrollHeight).toBeLessThanOrEqual(el.clientHeight);
    }
    // The title wraps (more than one 23.8 px line) and the close stays in the corner.
    await expect(title.getBoundingClientRect().height).toBeGreaterThan(24);
    const close = part(alert as HTMLElement, ".ds-alert__close");
    await expect(
      (alert as HTMLElement).getBoundingClientRect().right - close.getBoundingClientRect().right,
    ).toBeLessThanOrEqual(17.5);
    await expect(close.getBoundingClientRect().top).toBeLessThan(
      (alert as HTMLElement).getBoundingClientRect().top + 24,
    );
    // The title and every ancestor of it up to and including the frame clip nothing.
    for (let el: HTMLElement | null = title; el; el = el === frame ? null : el.parentElement) {
      const style = getComputedStyle(el);
      await expect(style.overflowX, `${el.localName} clips on x`).toBe("visible");
      await expect(style.overflowY, `${el.localName} clips on y`).toBe("visible");
    }
    if (inVitest) {
      // The title's own box cuts none of the Thai stack: this reads the title's clone only.
      await expectLabelInkWhole(title);
      // Nothing from the title up to the frame clips ink. Last among the title checks, so the
      // overflow loop above is not what stops the play (spec row 18).
      await expectFrameCutsNoInk(title, frame);
      await expectLinesClear(description);
    }
  },
};

export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <Stack />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cells = canvasElement.querySelectorAll("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    for (const cell of cells) await expect(alertsOf(cell)).toHaveLength(4);
    await expect(alertsOf(canvasElement)).toHaveLength(24);
    // Worked example W4: one alert and three status per cell.
    await expect(canvas.getAllByRole("alert")).toHaveLength(6);
    await expect(canvas.getAllByRole("status")).toHaveLength(18);
  },
};

/**
 * Type contract (`alert-api-1`, `alert-live-1`), checked by `pnpm typecheck`. The rejected
 * elements are created and dropped, never mounted: a missing title or description, a variant
 * outside the four kinds, a live role the kind refuses and a timer prop are each a type error.
 * The story draws the one valid block.
 */
export const TypeContract: Story = {
  render: () => {
    const base = { title: "t", description: "d" };
    const rejected = [
      // @ts-expect-error a title is required
      <Alert variant="success" description="d" />,
      // @ts-expect-error a description is required
      <Alert variant="success" title="t" />,
      // @ts-expect-error brand is not a feedback kind
      <Alert variant="brand" {...base} />,
      // @ts-expect-error success cannot be raised to an alert (SC 4.1.3 lists it as a failure)
      <Alert variant="success" live="alert" {...base} />,
      // @ts-expect-error danger cannot drop to a status
      <Alert variant="danger" live="status" {...base} />,
      // @ts-expect-error an alert has no timer: it stays until the caller takes it out
      <Alert variant="danger" duration={1000} {...base} />,
    ];
    return (
      <div data-rejected={rejected.length}>
        <Alert variant="danger" {...base} live="off" />
      </div>
    );
  },
};
