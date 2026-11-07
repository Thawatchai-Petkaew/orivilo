import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import {
  expectEdgeInk,
  expectFocusBorderForm,
  expectLinesClear,
  inVitest,
  resolvedColor,
} from "../../testing/visual-asserts";
import { Field } from "../field/Field";
import { fixtures, switchFixtures } from "../fixtures";
import { Matrix, Narrow } from "../matrix";
import { Switch, type SwitchProps } from "./Switch";

const meta = {
  title: "Base/Switch",
  component: Switch,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

type Lang = "th" | "en";

/** The Thai and English columns of the spec's "Copy" table (the `En` keys of `switchFixtures`). */
function words(lang: Lang) {
  const f = switchFixtures;
  return lang === "en"
    ? {
        setLabel: f.setLabelEn,
        setHelp: f.setHelpEn,
        comments: f.commentsEn,
        commentsHelp: f.commentsHelpEn,
        jobs: f.jobsEn,
        jobsHelp: f.jobsHelpEn,
        saveError: f.saveErrorEn,
        saving: "Saving",
      }
    : {
        setLabel: f.setLabel,
        setHelp: f.setHelp,
        comments: f.comments,
        commentsHelp: f.commentsHelp,
        jobs: f.jobs,
        jobsHelp: f.jobsHelp,
        saveError: f.saveError,
        saving: "กำลังบันทึก",
      };
}

const w = words("th");

/** A horizontal Field belongs in a form column: with no width the switch sits at the far end of the line. */
function Column({ children }: { children: ReactNode }) {
  return <div className="w-[480px] max-w-full">{children}</div>;
}

interface RowProps extends Pick<
  SwitchProps,
  "checked" | "defaultChecked" | "onCheckedChange" | "size" | "saving" | "name" | "id"
> {
  lang?: Lang;
  item?: "comments" | "jobs";
  /** Adds the save error under the row. */
  error?: boolean;
  disabled?: boolean;
  /** A disabled row drops the description: its disabled ink is a label the a11y addon skips. */
  description?: boolean;
}

/** The notification setting of the spec: a horizontal `Field` around one Switch. */
function Row({
  lang = "th",
  item = "comments",
  error = false,
  disabled = false,
  description = true,
  ...control
}: RowProps) {
  const t = words(lang);
  return (
    <Field
      orientation="horizontal"
      label={item === "comments" ? t.comments : t.jobs}
      description={description ? (item === "comments" ? t.commentsHelp : t.jobsHelp) : undefined}
      error={error ? t.saveError : undefined}
      disabled={disabled}
    >
      <Switch {...control} />
    </Field>
  );
}

function pick(el: HTMLElement | null, what: string): HTMLElement {
  if (!el) throw new Error(`no ${what}`);
  return el;
}
const trackOf = (root: HTMLElement, id: string) =>
  pick(root.querySelector<HTMLElement>(`#${id}`), `switch #${id}`);
const thumbOf = (track: Element) =>
  pick(track.querySelector<HTMLElement>(".ds-switch__thumb"), "thumb");

/** Waits for the thumb's slide and the colour easing to end, so a box is read where it rests. */
async function settled(el: Element) {
  await Promise.all(
    el
      .getAnimations({ subtree: true })
      .filter((a) => a instanceof CSSTransition)
      .map((a) => a.finished),
  );
}

/** One ring-free switch per state, off and on: the rows `parameters.pseudo` holds. */
function InteractionRows({ lang = "th" }: { lang?: Lang }) {
  const t = words(lang);
  return (
    <div className="flex flex-col gap-4">
      {[false, true].map((on) => (
        <div key={String(on)} className="flex gap-8">
          {["sw-rest", "sw-hover", "sw-press", "sw-focus"].map((id) => (
            <Switch
              key={id}
              id={on ? `${id}-on` : id}
              aria-label={t.comments}
              defaultChecked={on}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * A synthetic pointer sets no `:hover` and no `:active`, so `parameters.pseudo` forces them, and
 * the two focus rows are held at rest by `focusVisible`. A story that forces `focusVisible` names
 * `hover` in the same object, which makes the addon rewrite the sheet (design D25).
 */
const PSEUDO = {
  rootSelector: "body",
  hover: ["#sw-hover", "#sw-hover-on"],
  active: ["#sw-press", "#sw-press-on"],
  focusVisible: ["#sw-focus", "#sw-focus-on"],
};

/** Reads the held focus rows: the halo, no DOM focus, the focus line, and the fill form when on. */
async function expectHeldFocus(root: HTMLElement) {
  for (const id of ["sw-focus", "sw-focus-on"]) {
    const track = trackOf(root, id);
    await waitFor(() =>
      expect(getComputedStyle(track).boxShadow, `${id} holds the halo`).toMatch(
        / 0px 0px 0px 3px$/,
      ),
    );
    await expect(track).not.toHaveFocus();
    // The colour is resolved outside the wait: resolvedColor adds a node, and waitFor re-runs on every added node.
    const ring = resolvedColor(track, "--ds-focus-ring");
    await waitFor(() =>
      expect(getComputedStyle(track).borderTopColor, `${id} holds the focus line`).toBe(ring),
    );
  }
  // An on track draws the fill form: its border equals its fill, so an inner line shows the focus too.
  await expect(getComputedStyle(trackOf(root, "sw-focus-on")).boxShadow).toContain("inset");
  await expect(getComputedStyle(trackOf(root, "sw-focus")).boxShadow).not.toContain("inset");
}

/**
 * A missing value reads as off. A click on the label turns the switch on; a click on the description
 * does nothing (switch-keys-1, field-row-1).
 */
export const Default: Story = {
  render: () => (
    <Column>
      <Row />
    </Column>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole("switch", { name: w.comments });
    await expect(sw).toHaveAccessibleDescription(w.commentsHelp);
    await expect(sw).toHaveAttribute("aria-checked", "false");
    const off = thumbOf(sw).getBoundingClientRect().left;
    await userEvent.click(canvas.getByText(w.comments));
    await expect(sw).toHaveAttribute("aria-checked", "true");
    await settled(sw);
    await expect(thumbOf(sw).getBoundingClientRect().left).toBeGreaterThan(off + 10);
    await userEvent.click(canvas.getByText(w.commentsHelp));
    await expect(sw).toHaveAttribute("aria-checked", "true");
  },
};

/** Tab lands on the switch, and Space and Enter each flip it. */
export const Keyboard: Story = {
  render: () => (
    <Column>
      <Row />
    </Column>
  ),
  play: async ({ canvasElement }) => {
    const sw = within(canvasElement).getByRole("switch", { name: w.comments });
    await userEvent.tab();
    await expect(sw).toHaveFocus();
    await expect(sw.matches(":focus-visible")).toBe(true);
    await expect(sw).toHaveAttribute("aria-checked", "false");
    await userEvent.keyboard(" ");
    await expect(sw).toHaveAttribute("aria-checked", "true");
    await userEvent.keyboard("{Enter}");
    await expect(sw).toHaveAttribute("aria-checked", "false");
  },
};

/** The label names the setting and never changes with the state (switch-label-1). */
export const FixedLabel: Story = {
  render: () => (
    <Column>
      <Row />
    </Column>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole("switch", { name: w.comments });
    const label = canvasElement.querySelector(".ds-field__label") as HTMLElement;
    const before = label.textContent;
    await userEvent.click(sw);
    await expect(sw).toHaveAttribute("aria-checked", "true");
    await expect(canvas.getByRole("switch", { name: w.comments })).toBe(sw);
    await expect(label.textContent).toBe(before);
    await expect(label.textContent).toBe(w.comments);
  },
};

/** W1 of the parent spec: track, thumb and travel at each size. */
const GEOMETRY = {
  md: { track: [44, 24], thumb: 20, travel: 20 },
  sm: { track: [36, 20], thumb: 16, travel: 16 },
} as const;

/** `sm` is a 36 by 20 track and `md` a 44 by 24 one; both keep a 24 px target (switch-size-1). */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-6 p-4">
      {(["sm", "md"] as const).flatMap((size) =>
        [false, true].map((on) => (
          <Switch
            key={`${size}${on}`}
            id={`sz-${size}-${on ? "on" : "off"}`}
            size={size}
            aria-label={w.comments}
            defaultChecked={on}
          />
        )),
      )}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const near = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThanOrEqual(0.5);
    for (const size of ["sm", "md"] as const) {
      const g = GEOMETRY[size];
      const off = trackOf(canvasElement, `sz-${size}-off`);
      const on = trackOf(canvasElement, `sz-${size}-on`);
      await settled(canvasElement);
      for (const track of [off, on]) {
        const box = track.getBoundingClientRect();
        await near(box.width, g.track[0]);
        await near(box.height, g.track[1]);
        const thumb = thumbOf(track).getBoundingClientRect();
        await near(thumb.width, g.thumb);
        await near(thumb.height, g.thumb);
      }
      // The thumb's place in its track: at the start when off, at the end when on.
      const place = (track: HTMLElement) =>
        thumbOf(track).getBoundingClientRect().left - track.getBoundingClientRect().left;
      await near(place(on) - place(off), g.travel);
      await near(place(off), (g.track[1] - g.thumb) / 2);
      await near(place(on) + g.thumb, g.track[0] - (g.track[1] - g.thumb) / 2);
      // The target is the token: a point just inside it hits the switch, a point just outside does not.
      const target = parseFloat(getComputedStyle(off).getPropertyValue("--cmp-switch-target-min"));
      await expect(target).toBe(24);
      if (size === "sm") {
        await expect(off.getBoundingClientRect().height).toBeLessThan(target);
      }
      const box = off.getBoundingClientRect();
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      for (const sign of [-1, 1]) {
        const inside = document.elementFromPoint(cx, cy + sign * (target / 2 - 0.5));
        await expect(inside === off || off.contains(inside)).toBe(true);
        const outside = document.elementFromPoint(cx, cy + sign * (target / 2 + 1));
        await expect(outside === off || off.contains(outside)).toBe(false);
      }
    }
  },
};

/** Rest, hover, pressed and focus, off and on. Hover and pressed change the ink or the track; focus shows the brand line. */
export const InteractionStates: Story = {
  parameters: { pseudo: PSEUDO },
  render: () => <InteractionRows />,
  play: async ({ canvasElement }) => {
    const bg = (id: string) => getComputedStyle(trackOf(canvasElement, id)).backgroundColor;
    const edge = (id: string) => getComputedStyle(trackOf(canvasElement, id)).borderTopColor;
    // Off: hover changes the track. On: hover changes the edge and keeps the selection fill.
    await waitFor(() => expect(bg("sw-hover")).not.toBe(bg("sw-rest")));
    await waitFor(() => expect(edge("sw-hover-on")).not.toBe(edge("sw-rest-on")));
    await expect(bg("sw-hover-on")).toBe(bg("sw-rest-on"));
    // Pressed changes the track, off and on.
    await waitFor(() => expect(bg("sw-press")).not.toBe(bg("sw-rest")));
    await waitFor(() => expect(bg("sw-press-on")).not.toBe(bg("sw-rest-on")));
    await expectFocusBorderForm(trackOf(canvasElement, "sw-focus"));
    await expectFocusBorderForm(trackOf(canvasElement, "sw-focus-on"));
    // expectFocusBorderForm focuses and blurs, so the rows held by `focusVisible` are read here, at rest.
    await expectHeldFocus(canvasElement);
  },
};

/** Disabled reads tokens, not opacity; nothing moves on a click (control-disabled-1). */
export const Disabled: Story = {
  render: () => (
    <Column>
      <div className="flex flex-col gap-6">
        <Row item="jobs" disabled description={false} />
        <Row item="comments" disabled defaultChecked description={false} />
      </div>
    </Column>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const off = canvas.getByRole("switch", { name: w.jobs });
    const on = canvas.getByRole("switch", { name: w.comments });
    for (const sw of [off, on]) await expect(sw).toBeDisabled();
    await userEvent.click(off);
    await userEvent.click(canvas.getByText(w.jobs));
    await userEvent.click(on);
    await userEvent.click(canvas.getByText(w.comments));
    await expect(off).toHaveAttribute("aria-checked", "false");
    await expect(on).toHaveAttribute("aria-checked", "true");
    for (const wrapper of canvasElement.querySelectorAll(".ds-switch")) {
      await expect(getComputedStyle(wrapper).opacity).toBe("1");
    }
    await expect(getComputedStyle(off).backgroundColor).toBe(
      resolvedColor(off, "--cmp-switch-track-disabled"),
    );
    await expect(getComputedStyle(thumbOf(on)).backgroundColor).toBe(
      resolvedColor(on, "--cmp-switch-thumb-disabled"),
    );
    // The thumb sits at the start when off and at the end when on, though nothing moved.
    const place = (track: HTMLElement) =>
      thumbOf(track).getBoundingClientRect().left - track.getBoundingClientRect().left;
    await expect(place(on)).toBeGreaterThan(place(off) + 10);
  },
};

/** The save error sits under the row; the track takes the error edge, the fill stays honest about off. */
export const Invalid: Story = {
  render: () => (
    <Column>
      <Row error />
    </Column>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole("switch", { name: w.comments });
    await expect(sw).toHaveAttribute("aria-invalid", "true");
    await expect(sw).toHaveAccessibleDescription(`${w.saveError} ${w.commentsHelp}`);
    await expect(canvas.getAllByRole("alert")).toHaveLength(1);
    await expect(canvas.getByRole("alert")).toHaveTextContent(w.saveError);
    await expect(getComputedStyle(sw).borderTopColor).toBe(
      resolvedColor(sw, "--cmp-switch-edge-error"),
    );
    // The side away from the thumb: on the thumb's side the fill beside the edge would count as ink.
    if (inVitest) await expectEdgeInk(sw, "right", 1);
  },
};

const savingSpy = fn();

/** A save is in flight: a ring turns in the thumb and nothing moves (switch-save-1). */
export const Saving: Story = {
  render: () => (
    <Column>
      <div className="flex flex-col gap-6">
        <Row checked saving onCheckedChange={savingSpy} />
        <Row item="jobs" checked saving disabled description={false} />
      </div>
    </Column>
  ),
  play: async ({ canvasElement }) => {
    savingSpy.mockClear();
    const canvas = within(canvasElement);
    const sw = canvas.getByRole("switch", { name: w.comments });
    await userEvent.click(sw);
    await expect(sw).toHaveFocus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{Enter}");
    await userEvent.click(canvas.getByText(w.comments));
    await expect(savingSpy).not.toHaveBeenCalled();
    await expect(sw).toHaveAttribute("aria-checked", "true");
    await expect(sw).toHaveAttribute("aria-busy", "true");
    await expect(sw).toHaveAttribute("aria-disabled", "true");
    await expect(sw).not.toBeDisabled();
    await expect(sw).toHaveFocus();
    const statuses = canvas.getAllByRole("status");
    await expect(statuses).toHaveLength(1);
    await expect(statuses[0]).toHaveTextContent(w.saving);
    await expect(thumbOf(sw).querySelector(".ds-spin")).not.toBeNull();
    // `disabled` wins over `saving`: the second switch shows no ring, no busy state and no status.
    const off = canvas.getByRole("switch", { name: w.jobs });
    await expect(off).toBeDisabled();
    await expect(off).not.toHaveAttribute("aria-busy");
    await expect(off).not.toHaveAttribute("aria-disabled");
    await expect(thumbOf(off).querySelector(".ds-spin")).toBeNull();
  },
};

interface Latch {
  wait: () => Promise<boolean>;
  release: (ok: boolean) => void;
}

/** A save the play holds open and then answers: `release(false)` fails it, `release(true)` ends it well. */
function createLatch(): Latch {
  let resolve: ((ok: boolean) => void) | null = null;
  return {
    wait: () =>
      new Promise<boolean>((r) => {
        resolve = r;
      }),
    release: (ok) => {
      resolve?.(ok);
      resolve = null;
    },
  };
}

const latches = { th: createLatch(), en: createLatch() };

/**
 * The caller's side of switch-save-1, with a fixture in place of a request: the thumb moves at
 * once, a failure puts it back and gives the Field an error, and the next toggle is the retry.
 */
function SaveHost({ lang = "th" }: { lang?: Lang }) {
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const save = async (next: boolean) => {
    setFailed(false);
    setChecked(next);
    setSaving(true);
    const ok = await latches[lang].wait();
    setSaving(false);
    if (!ok) {
      setChecked(!next);
      setFailed(true);
    }
  };
  return (
    <Row
      lang={lang}
      checked={checked}
      saving={saving}
      error={failed}
      onCheckedChange={(next) => void save(next)}
    />
  );
}

/** A simulated save: the failure brings the old value back with the message, and the retry clears it. */
export const SaveFails: Story = {
  render: () => (
    <Column>
      <SaveHost />
    </Column>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole("switch", { name: w.comments });
    await userEvent.click(sw);
    await expect(sw).toHaveAttribute("aria-checked", "true");
    await expect(await canvas.findByRole("status")).toHaveTextContent(w.saving);
    latches.th.release(false);
    await waitFor(() => expect(sw).toHaveAttribute("aria-checked", "false"));
    await expect(await canvas.findByRole("alert")).toHaveTextContent(w.saveError);
    await expect(sw).toHaveAttribute("aria-invalid", "true");
    await expect(sw).toHaveFocus();
    await expect(canvas.queryByRole("status")).toBeNull();
    // The retry: the message goes at once and the thumb stays where the person put it.
    await userEvent.click(sw);
    await expect(canvas.queryByRole("alert")).toBeNull();
    await expect(sw).toHaveAttribute("aria-checked", "true");
    await expect(await canvas.findByRole("status")).toHaveTextContent(w.saving);
    latches.th.release(true);
    await waitFor(() => expect(canvas.queryByRole("status")).toBeNull());
    await expect(sw).toHaveAttribute("aria-checked", "true");
    await expect(sw).not.toHaveAttribute("aria-invalid");
    await expect(canvas.queryByRole("alert")).toBeNull();
    // No tick and no saved word: the component has no backing data for either.
    await expect(canvasElement.querySelector(".ds-switch__thumb svg")).toBeNull();
    await expect(canvas.queryByText(/บันทึกแล้ว/)).toBeNull();
  },
};

/** A switch outside a Field names itself with `aria-label` or `aria-labelledby` (switch-api-1). */
export const Bare: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Switch aria-label={switchFixtures.jobs} defaultChecked />
      <div className="flex items-center gap-4">
        <span id="bare-title" className="text-body-sm text-text-primary">
          {switchFixtures.comments}
        </span>
        <Switch aria-labelledby="bare-title" size="sm" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("switch", { name: switchFixtures.jobs })).toBeInTheDocument();
    await expect(canvas.getByRole("switch", { name: switchFixtures.comments })).toBeInTheDocument();
  },
};

/** A form submits `on` under the switch's name while it is on, and nothing while it is off. */
export const InForm: Story = {
  render: () => (
    <form data-testid="form">
      <Column>
        <Row name="comments" />
      </Column>
    </form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const form = canvas.getByTestId("form") as HTMLFormElement;
    await expect(new FormData(form).get("comments")).toBeNull();
    await userEvent.click(canvas.getByRole("switch", { name: w.comments }));
    await expect(new FormData(form).get("comments")).toBe("on");
  },
};

/**
 * Under reduced motion the thumb stops sliding and the ring keeps turning (switch-size-1, ORV-201
 * `spin-motion-1`). The stylesheet walk reads the rules, since a play cannot switch the setting.
 */
export const ReducedMotion: Story = {
  render: () => (
    <Column>
      <div className="flex flex-col gap-6">
        <Row />
        <Row item="jobs" checked saving />
      </div>
    </Column>
  ),
  play: async ({ canvasElement }) => {
    const slides: string[] = [];
    const stopped: string[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
      for (const rule of Array.from(sheet.cssRules)) {
        if (rule instanceof CSSMediaRule && rule.conditionText.includes("prefers-reduced-motion")) {
          for (const inner of Array.from(rule.cssRules)) {
            if (!(inner instanceof CSSStyleRule)) continue;
            if (
              /\.ds-switch__thumb\b/.test(inner.selectorText) &&
              inner.style.transitionProperty === "none"
            ) {
              slides.push(inner.selectorText);
            }
            if (/\.ds-spin(ner)?\b/.test(inner.selectorText) && inner.style.animationName !== "") {
              stopped.push(inner.selectorText);
            }
          }
        }
      }
    }
    await expect(slides).toHaveLength(1);
    await expect(stopped).toEqual([]);
    const ring = canvasElement.querySelector(".ds-switch__thumb .ds-spin") as SVGElement;
    await expect(getComputedStyle(ring).animationName).toBe("ds-spin");
  },
};

/** At 360 px the text wraps in its column and the switch stays at the end of the first line. */
export const LongContentAt360: Story = {
  render: () => (
    <Narrow>
      <div data-testid="narrow" className="flex flex-col gap-6">
        <Field
          orientation="horizontal"
          label={fixtures.longThai}
          description={fixtures.longLatin}
          error={fixtures.longThai}
        >
          <Switch defaultChecked />
        </Field>
        <Field orientation="horizontal" label={fixtures.thaiMarks}>
          <Switch />
        </Field>
      </div>
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    // The 360 px column, not the story surface around it, which is 1200 px and cannot overflow.
    const narrow = within(canvasElement).getByTestId("narrow");
    await expect(narrow.clientWidth).toBe(360);
    await expect(narrow.scrollWidth).toBe(narrow.clientWidth);
    const frame = narrow.getBoundingClientRect();
    for (const sw of within(narrow).getAllByRole("switch")) {
      await expect(sw.getBoundingClientRect().right).toBeLessThanOrEqual(frame.right);
    }
    // Nothing clips a label up to the column, so no mark can be cut.
    const labels = narrow.querySelectorAll<HTMLElement>("label.ds-field__label");
    for (const label of labels) {
      for (
        let up: HTMLElement | null = label;
        up && up !== narrow.parentElement;
        up = up.parentElement
      ) {
        await expect(getComputedStyle(up).overflow, "an ancestor clips the label").toBe("visible");
      }
    }
    // The switch is centred on the label's first line, however many lines the label wraps to.
    const long = labels[0] as HTMLElement;
    const lineHeight = parseFloat(getComputedStyle(long).lineHeight);
    const track = within(narrow).getAllByRole("switch")[0] as HTMLElement;
    const trackBox = track.getBoundingClientRect();
    await expect(
      Math.abs(
        trackBox.top + trackBox.height / 2 - (long.getBoundingClientRect().top + lineHeight / 2),
      ),
    ).toBeLessThanOrEqual(1);
    await expect(long.getBoundingClientRect().height).toBeGreaterThan(lineHeight * 1.5);
    if (inVitest) await expectLinesClear(long);
  },
};

/** Every state with the English column of the spec's "Copy" table. */
export const InEnglish: Story = {
  parameters: { pseudo: PSEUDO },
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  render: () => (
    <Column>
      <div className="flex flex-col gap-8">
        <div data-testid="default">
          <Row lang="en" />
        </div>
        <div data-testid="states">
          <InteractionRows lang="en" />
        </div>
        <div data-testid="sizes" className="flex gap-6">
          {(["sm", "md"] as const).flatMap((size) =>
            [false, true].map((on) => (
              <Switch
                key={`${size}${on}`}
                size={size}
                aria-label={words("en").comments}
                defaultChecked={on}
              />
            )),
          )}
        </div>
        <div data-testid="disabled">
          <Row lang="en" item="jobs" disabled description={false} />
        </div>
        <div data-testid="invalid">
          <Row lang="en" error />
        </div>
        <div data-testid="saving">
          <Row lang="en" checked saving />
        </div>
        <div data-testid="save-fails">
          <SaveHost lang="en" />
        </div>
      </div>
    </Column>
  ),
  play: async ({ canvasElement }) => {
    const t = words("en");
    const canvas = within(canvasElement);
    const scope = (id: string) => within(canvas.getByTestId(id));
    const named = (id: string, name: string) => scope(id).getByRole("switch", { name });
    await expect(named("default", t.comments)).toHaveAccessibleDescription(t.commentsHelp);
    await expect(canvas.getByTestId("states").querySelectorAll("[role=switch]")).toHaveLength(8);
    await expect(canvas.getByTestId("sizes").querySelectorAll("[role=switch]")).toHaveLength(4);
    await expect(named("disabled", t.jobs)).toBeDisabled();
    await expect(named("invalid", t.comments)).toHaveAccessibleDescription(
      `${t.saveError} ${t.commentsHelp}`,
    );
    await expect(scope("invalid").getByRole("alert")).toHaveTextContent(t.saveError);
    await expect(scope("saving").getByRole("status")).toHaveTextContent(t.saving);
    await expectHeldFocus(canvasElement);
    // The failure path, in English: the word while it saves, then the message.
    const sw = named("save-fails", t.comments);
    await userEvent.click(sw);
    await expect(await scope("save-fails").findByRole("status")).toHaveTextContent(t.saving);
    latches.en.release(false);
    await expect(await scope("save-fails").findByRole("alert")).toHaveTextContent(t.saveError);
    await expect(sw).toHaveAttribute("aria-checked", "false");
  },
};

/** Off, on, invalid, disabled, saving and `sm` in the three profiles and both modes. */
export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <div className="flex flex-col gap-4">
        <Row />
        <Row item="jobs" defaultChecked />
        <Row error />
        <Row item="jobs" disabled description={false} />
        <Row checked saving description={false} />
        <Row size="sm" description={false} />
      </div>
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll<HTMLElement>("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    for (const cell of cells) {
      const switches = within(cell).getAllByRole("switch");
      await expect(switches.map((s) => s.getAttribute("aria-checked"))).toEqual([
        "false",
        "true",
        "false",
        "false",
        "true",
        "false",
      ]);
      const on = switches[1] as HTMLElement;
      await expect(getComputedStyle(on).backgroundColor).toBe(
        resolvedColor(on, "--cmp-switch-track-on"),
      );
      await expect(switches[2]).toHaveAttribute("aria-invalid", "true");
      await expect(switches[3]).toBeDisabled();
      await expect(switches[4]).toHaveAttribute("aria-busy", "true");
    }
  },
};
