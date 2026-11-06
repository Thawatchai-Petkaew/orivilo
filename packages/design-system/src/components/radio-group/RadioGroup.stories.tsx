import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import {
  expectEdgeInk,
  expectFocusBorderForm,
  expectLinesClear,
  inVitest,
  resolvedColor,
} from "../../testing/visual-asserts";
import { Field } from "../field/Field";
import { fixtures, radioFixtures } from "../fixtures";
import { Input } from "../input/Input";
import { Matrix, Narrow, Under } from "../matrix";
import { RadioGroup, RadioGroupItem, type RadioGroupProps } from "./RadioGroup";

const meta = {
  title: "Base/Radio group",
  component: RadioGroup,
  args: { children: null },
  parameters: { layout: "padded" },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

type Lang = "th" | "en";

/** The Thai and English columns of the spec's "Copy" table (the `En` keys of `radioFixtures`). */
function words(lang: Lang) {
  const f = radioFixtures;
  return lang === "en"
    ? {
        label: f.labelEn,
        help: f.helpEn,
        error: f.errorEn,
        members: f.membersEn,
        membersHelp: f.membersHelpEn,
        organization: f.organizationEn,
        organizationHelp: f.organizationHelpEn,
        link: f.linkEn,
        linkHelp: f.linkHelpEn,
      }
    : {
        label: f.label,
        help: f.help,
        error: f.error,
        members: f.members,
        membersHelp: f.membersHelp,
        organization: f.organization,
        organizationHelp: f.organizationHelp,
        link: f.link,
        linkHelp: f.linkHelp,
      };
}

interface AccessProps extends Pick<
  RadioGroupProps,
  "defaultValue" | "name" | "size" | "orientation" | "value" | "onValueChange"
> {
  lang?: Lang;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  linkDisabled?: boolean;
}

/** The workspace access question of the spec: a `Field group` around three options. */
function Access({
  lang = "th",
  error = false,
  required = false,
  disabled = false,
  linkDisabled = false,
  ...group
}: AccessProps) {
  const w = words(lang);
  return (
    <Field
      group
      label={w.label}
      description={w.help}
      error={error ? w.error : undefined}
      required={required}
    >
      <RadioGroup disabled={disabled} {...group}>
        <RadioGroupItem value="members" label={w.members} description={w.membersHelp} />
        <RadioGroupItem
          value="organization"
          label={w.organization}
          description={w.organizationHelp}
        />
        <RadioGroupItem
          value="link"
          label={w.link}
          description={w.linkHelp}
          disabled={linkDisabled}
        />
      </RadioGroup>
    </Field>
  );
}

const w = words("th");

type Arrow = "ArrowDown" | "ArrowUp" | "ArrowLeft" | "ArrowRight";

/**
 * Radix moves focus in a timeout after the keydown and checks the radio only while the arrow key is
 * still held, so the key is held until the focus has arrived, as a finger would.
 */
async function pressArrow(key: Arrow, reached: HTMLElement) {
  await userEvent.keyboard(`{${key}>}`);
  await waitFor(() => expect(reached, `${key} moves focus`).toHaveFocus());
  await userEvent.keyboard(`{/${key}}`);
}

/**
 * Every arrow key moves and checks, wraps at the ends, and Enter does nothing (radio-keys-1). It
 * runs in both orientations because the prop is layout only.
 */
async function walkArrows(canvasElement: HTMLElement, name: string, lang: Lang = "th") {
  const canvas = within(canvasElement);
  const t = words(lang);
  const radio = (label: string) => canvas.getByRole("radio", { name: label });
  await userEvent.tab();
  await expect(radio(t.members)).toHaveFocus();
  const steps: [Arrow, string][] = [
    ["ArrowDown", t.organization],
    ["ArrowDown", t.link],
    ["ArrowDown", t.members],
    ["ArrowUp", t.link],
    ["ArrowRight", t.members],
    ["ArrowLeft", t.link],
    ["ArrowUp", t.organization],
    ["ArrowRight", t.link],
  ];
  for (const [key, label] of steps) {
    await pressArrow(key, radio(label));
    await waitFor(() => expect(radio(label), `${key} checks ${label}`).toBeChecked());
  }
  await userEvent.keyboard("{Enter}");
  await expect(radio(t.link)).toBeChecked();
  await userEvent.tab();
  await expect(canvas.getByRole("radiogroup", { name })).not.toContainElement(
    document.activeElement as HTMLElement,
  );
}

/** One group named by the Field's label, described by its help; each radio by its own label and line. */
export const Default: Story = {
  render: () => <Access defaultValue="members" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("radiogroup", { name: w.label });
    await expect(group).toHaveAccessibleDescription(w.help);
    await expect(canvas.getAllByRole("radio")).toHaveLength(3);
    await expect(canvas.getByRole("radio", { name: w.members })).toHaveAccessibleDescription(
      w.membersHelp,
    );
    await expect(canvas.getByRole("radio", { name: w.organization })).toHaveAccessibleDescription(
      w.organizationHelp,
    );
    await expect(canvas.getByRole("radio", { name: w.link })).toHaveAccessibleDescription(
      w.linkHelp,
    );
    await expect(canvas.getByRole("radio", { name: w.members })).toBeChecked();
    const label = canvasElement.querySelector(".ds-field__label");
    await expect(label?.tagName).toBe("SPAN");
    await expect(label?.hasAttribute("for")).toBe(false);
  },
};

/** The missing value: no dot, Tab lands on the first radio, Space checks it. */
export const NoValue: Story = {
  render: () => <Access />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const radio of canvas.getAllByRole("radio")) await expect(radio).not.toBeChecked();
    await userEvent.tab();
    const first = canvas.getByRole("radio", { name: w.members });
    await expect(first).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(first).toBeChecked();
  },
};

export const Keyboard: Story = {
  render: () => <Access defaultValue="members" />,
  play: ({ canvasElement }) => walkArrows(canvasElement, w.label),
};

export const KeyboardHorizontal: Story = {
  render: () => (
    <div className="w-[900px] max-w-full">
      <Access defaultValue="members" orientation="horizontal" />
    </div>
  ),
  play: ({ canvasElement }) => walkArrows(canvasElement, w.label),
};

/** Disabled reads tokens, not opacity (control-disabled-1). */
export const Disabled: Story = {
  render: () => <Access defaultValue="organization" disabled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const radio of canvas.getAllByRole("radio")) await expect(radio).toBeDisabled();
    await userEvent.click(canvas.getByText(w.members));
    await expect(canvas.getByRole("radio", { name: w.organization })).toBeChecked();
    await expect(canvas.getByRole("radio", { name: w.members })).not.toBeChecked();
    for (const row of canvasElement.querySelectorAll(".ds-radio")) {
      await expect(getComputedStyle(row).opacity).toBe("1");
    }
    const control = canvas.getByRole("radio", { name: w.members });
    await expect(getComputedStyle(control).backgroundColor).toBe(
      resolvedColor(control, "--cmp-radio-bg-disabled"),
    );
  },
};

/** One item disabled alone: a click on its label does nothing and an arrow key skips it. */
export const DisabledItem: Story = {
  render: () => <Access defaultValue="organization" linkDisabled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("radio", { name: w.link });
    await expect(link).toBeDisabled();
    await userEvent.tab();
    await expect(canvas.getByRole("radio", { name: w.organization })).toHaveFocus();
    await pressArrow("ArrowDown", canvas.getByRole("radio", { name: w.members }));
    await waitFor(() => expect(canvas.getByRole("radio", { name: w.members })).toBeChecked());
    await userEvent.click(canvas.getByText(w.link));
    await expect(link).not.toBeChecked();
    await expect(canvas.getByRole("radio", { name: w.members })).toBeChecked();
  },
};

/** The error is on the group, never on an item; every circle takes the error edge (radio-invalid-1). */
export const Invalid: Story = {
  // The first row is forced to :hover: the error edge must survive it (design D6).
  parameters: {
    pseudo: { rootSelector: "body", hover: [".ds-radio-group > .ds-radio:first-child"] },
  },
  render: () => <Access error />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("radiogroup", { name: w.label });
    await expect(group).toHaveAttribute("aria-invalid", "true");
    await expect(group).toHaveAccessibleDescription(`${w.error} ${w.help}`);
    for (const radio of canvas.getAllByRole("radio")) {
      await expect(radio).not.toHaveAttribute("aria-invalid");
    }
    await expect(canvas.getAllByRole("alert")).toHaveLength(1);
    await expect(canvas.getByRole("alert")).toHaveTextContent(w.error);
    const circle = canvas.getByRole("radio", { name: w.members });
    await userEvent.hover(canvas.getByText(w.members));
    await expect(getComputedStyle(circle).borderColor).toBe(
      resolvedColor(circle, "--cmp-radio-border-error"),
    );
    if (inVitest) await expectEdgeInk(circle, "left", 1);
  },
};

export const Required: Story = {
  render: () => <Access required />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("radiogroup", { name: w.label });
    await expect(group).toHaveAttribute("aria-required", "true");
    for (const radio of canvas.getAllByRole("radio")) {
      await expect(radio).not.toHaveAttribute("aria-required");
    }
    await expect(canvasElement.querySelector(".ds-field__required")).toBeInTheDocument();
  },
};

/** The checked circle holds a dot on the selected ground with the selection edge. */
export const Checked: Story = {
  render: () => (
    <RadioGroup aria-label={w.label} defaultValue="members">
      <RadioGroupItem value="members" label={w.members} />
      <RadioGroupItem value="organization" label={w.organization} />
    </RadioGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const on = canvas.getByRole("radio", { name: w.members });
    const off = canvas.getByRole("radio", { name: w.organization });
    await expect(on).toBeChecked();
    await expect(getComputedStyle(on).backgroundColor).toBe(
      resolvedColor(on, "--cmp-radio-bg-checked"),
    );
    await expect(getComputedStyle(on).borderColor).toBe(
      resolvedColor(on, "--cmp-radio-border-checked"),
    );
    await expect(on.querySelector("svg")).not.toBeNull();
    await expect(off.querySelector("svg")).toBeNull();
    await expect(getComputedStyle(off).backgroundColor).toBe(resolvedColor(off, "--cmp-radio-bg"));
  },
};

const SIZE_LABELS = ["เล็ก", "Small", "กลาง", fixtures.longThai] as const;

/**
 * `sm` is a 16 px circle in small type, `md` a 20 px one (W1); both keep a 24 px target and sit on
 * the centre of the label's first line, Thai or Latin, one line or many.
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-6">
      {(["sm", "md"] as const).map((size) => (
        <RadioGroup key={size} size={size} aria-label={`size ${size}`} defaultValue="a">
          {SIZE_LABELS.map((label, i) => (
            <RadioGroupItem key={label} value={String.fromCharCode(97 + i)} label={label} />
          ))}
        </RadioGroup>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bodySm = getComputedStyle(document.documentElement)
      .getPropertyValue("--ds-type-body-sm-font-size")
      .trim();
    for (const [size, px] of [
      ["sm", 16],
      ["md", 20],
    ] as const) {
      const group = within(canvas.getByRole("radiogroup", { name: `size ${size}` }));
      for (const name of SIZE_LABELS) {
        const radio = group.getByRole("radio", { name });
        const box = radio.getBoundingClientRect();
        await expect(Math.abs(box.width - px)).toBeLessThanOrEqual(0.5);
        await expect(Math.abs(box.height - px)).toBeLessThanOrEqual(0.5);
        const label = canvasElement.querySelector(`label[for="${radio.id}"]`) as HTMLElement;
        const line = parseFloat(getComputedStyle(label).lineHeight);
        const lineCentre = label.getBoundingClientRect().top + line / 2;
        await expect(Math.abs(box.top + box.height / 2 - lineCentre)).toBeLessThanOrEqual(1);
        if (size === "sm") await expect(getComputedStyle(label).fontSize).toBe(bodySm);
      }
      // A point 3.5 px outside the circle still hits it: the target is 24 px (radio.target-min).
      const radio = group.getByRole("radio", { name: "เล็ก" });
      const box = radio.getBoundingClientRect();
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      const margin = (24 - px) / 2 - 0.5;
      const probes: [number, number][] = [
        [box.left - margin, cy],
        [box.right + margin, cy],
        [cx, box.top - margin],
        [cx, box.bottom + margin],
      ];
      for (const [x, y] of probes) {
        const hit = document.elementFromPoint(x, y);
        await expect(hit === radio || radio.contains(hit)).toBe(true);
      }
    }
  },
};

/** One row of options in a wide frame: the circles share one top. */
export const Horizontal: Story = {
  render: () => (
    <div className="w-[900px] max-w-full">
      <Access defaultValue="members" orientation="horizontal" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [first, second] = canvas.getAllByRole("radio");
    await expect(first?.getBoundingClientRect().top).toBe(second?.getBoundingClientRect().top);
  },
};

/** At 360 px the row wraps and nothing scrolls sideways. */
export const HorizontalAt360: Story = {
  render: () => (
    <Narrow>
      <Access defaultValue="members" orientation="horizontal" />
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.firstElementChild as HTMLElement;
    await expect(frame.scrollWidth).toBe(frame.clientWidth);
    const tops = within(canvasElement)
      .getAllByRole("radio")
      .map((radio) => radio.getBoundingClientRect().top);
    await expect(new Set(tops).size).toBeGreaterThan(1);
  },
};

/** A long Thai label with no spaces and a long Latin line wrap beside the circle; Thai marks stay whole. */
export const LongContentAt360: Story = {
  render: () => (
    <Narrow>
      <RadioGroup aria-label={w.label} defaultValue="long">
        <RadioGroupItem value="long" label={fixtures.longThai} description={fixtures.longLatin} />
        <RadioGroupItem value="marks" label={fixtures.thaiMarks} description={fixtures.thaiMarks} />
      </RadioGroup>
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.firstElementChild as HTMLElement;
    await expect(frame.scrollWidth).toBe(frame.clientWidth);
    // Nothing clips a label, so no mark can be cut; the wrapped Thai lines keep clear of each other.
    for (const label of canvasElement.querySelectorAll<HTMLElement>(".ds-radio__label")) {
      for (let up: HTMLElement | null = label; up && up !== frame; up = up.parentElement) {
        await expect(getComputedStyle(up).overflow, "an ancestor clips the label").toBe("visible");
      }
    }
    const long = within(canvasElement).getByText(fixtures.longThai);
    if (inVitest) await expectLinesClear(long);
  },
};

/** Round under Professional, whose control radius is 6 px: a rounded square would read as a checkbox. */
export const RoundUnderProfessional: Story = {
  render: () => (
    <Under profile="professional" mode="light">
      <div className="flex max-w-md flex-col gap-6 p-6">
        <Field label="ชื่อโปรเจกต์">
          <Input defaultValue={fixtures.latin} />
        </Field>
        <Access defaultValue="members" />
      </div>
    </Under>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const circle = canvas.getByRole("radio", { name: w.members });
    const box = circle.getBoundingClientRect();
    await expect(box.width).toBe(box.height);
    const probe = document.createElement("span");
    probe.style.borderTopLeftRadius = "var(--ds-shape-round-radius)";
    circle.append(probe);
    const round = getComputedStyle(probe).borderTopLeftRadius;
    probe.remove();
    await expect(getComputedStyle(circle).borderTopLeftRadius).toBe(round);
    await expect(
      getComputedStyle(canvas.getByLabelText("ชื่อโปรเจกต์")).borderTopLeftRadius,
    ).not.toBe(round);
  },
};

/** The checked value is submitted under `name` and a form reset puts the default back. */
export const InForm: Story = {
  render: () => (
    <form data-testid="form">
      <Access defaultValue="members" name="access" />
    </form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const form = canvas.getByTestId("form") as HTMLFormElement;
    await userEvent.click(canvas.getByText(w.organization));
    await expect(new FormData(form).get("access")).toBe("organization");
    form.reset();
    await waitFor(() => expect(canvas.getByRole("radio", { name: w.members })).toBeChecked());
    await expect(new FormData(form).get("access")).toBe("members");
  },
};

/** A group outside a Field names itself with `aria-label` or `aria-labelledby`. */
export const Bare: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <RadioGroup aria-label={w.label} defaultValue="members" disabled>
        <RadioGroupItem value="members" label={w.members} />
        <RadioGroupItem value="organization" label={w.organization} />
      </RadioGroup>
      <div>
        <p id="bare-title" className="text-label-md text-text-primary">
          {w.help}
        </p>
        <RadioGroup aria-labelledby="bare-title" size="sm">
          <RadioGroupItem value="members" label={w.members} />
          <RadioGroupItem value="organization" label={w.organization} />
        </RadioGroup>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const disabled = canvas.getByRole("radiogroup", { name: w.label });
    for (const radio of within(disabled).getAllByRole("radio")) await expect(radio).toBeDisabled();
    await expect(canvas.getByRole("radiogroup", { name: w.help })).toBeInTheDocument();
  },
};

interface RowsProps {
  lang?: Lang;
}

/** Rest, hover and focus, unchecked and checked, one single-option group each. */
function InteractionRows({ lang = "th" }: RowsProps) {
  const t = words(lang);
  const rows: [string, string, boolean][] = [
    ["rg-rest", t.members, false],
    ["rg-hover", t.organization, false],
    ["rg-focus", t.link, false],
    ["rg-rest-on", t.members, true],
    ["rg-hover-on", t.organization, true],
    ["rg-focus-on", t.link, true],
  ];
  return (
    <div className="flex flex-col gap-3">
      {rows.map(([id, label, on]) => (
        <RadioGroup key={id} aria-label={`${id} ${label}`} defaultValue={on ? "v" : undefined}>
          <RadioGroupItem id={id} value="v" label={label} />
        </RadioGroup>
      ))}
    </div>
  );
}

/**
 * A synthetic pointer sets no `:hover`, so `parameters.pseudo` forces it; the hover rule keys on
 * the `.ds-radio` row. Focus shows the brand line with its halo and the checked one keeps its dot.
 */
export const InteractionStates: Story = {
  parameters: {
    pseudo: {
      rootSelector: "body",
      hover: [".ds-radio:has(#rg-hover)", ".ds-radio:has(#rg-hover-on)"],
    },
  },
  render: () => <InteractionRows />,
  play: async ({ canvasElement }) => {
    const circle = (id: string) => canvasElement.querySelector(`#${id}`) as HTMLElement;
    await userEvent.hover(canvasElement.querySelector('label[for="rg-hover"]') as HTMLElement);
    await waitFor(() =>
      expect(getComputedStyle(circle("rg-hover")).borderColor).not.toBe(
        getComputedStyle(circle("rg-rest")).borderColor,
      ),
    );
    await waitFor(() =>
      expect(getComputedStyle(circle("rg-hover-on")).borderColor).not.toBe(
        getComputedStyle(circle("rg-rest-on")).borderColor,
      ),
    );
    await expectFocusBorderForm(circle("rg-focus"));
    await expectFocusBorderForm(circle("rg-focus-on"));
    await expect(circle("rg-focus-on").querySelector("svg")).not.toBeNull();
  },
};

/** Every state with the English column of the spec's "Copy" table. */
export const InEnglish: Story = {
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  render: () => {
    const cases: [string, AccessProps][] = [
      ["default", { defaultValue: "members" }],
      ["no-value", {}],
      ["sm", { defaultValue: "members", size: "sm" }],
      ["md", { defaultValue: "members", size: "md" }],
      ["horizontal", { defaultValue: "members", orientation: "horizontal" }],
      ["disabled", { defaultValue: "organization", disabled: true }],
      ["disabled-item", { defaultValue: "organization", linkDisabled: true }],
      ["invalid", { error: true }],
      ["required", { required: true }],
    ];
    return (
      <div className="flex max-w-3xl flex-col gap-8">
        {cases.map(([id, props]) => (
          <div key={id} data-testid={id}>
            <Access lang="en" {...props} />
          </div>
        ))}
        <div data-testid="states">
          <InteractionRows lang="en" />
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const t = words("en");
    const canvas = within(canvasElement);
    for (const id of [
      "default",
      "no-value",
      "sm",
      "md",
      "horizontal",
      "disabled",
      "disabled-item",
      "invalid",
      "required",
    ]) {
      const scope = within(canvas.getByTestId(id));
      await expect(scope.getByRole("radiogroup", { name: t.label })).toHaveAccessibleDescription(
        id === "invalid" ? `${t.error} ${t.help}` : t.help,
      );
      await expect(scope.getByRole("radio", { name: t.members })).toHaveAccessibleDescription(
        t.membersHelp,
      );
    }
    await expect(within(canvas.getByTestId("invalid")).getByRole("alert")).toHaveTextContent(
      t.error,
    );
    await expect(
      within(canvas.getByTestId("disabled-item")).getByRole("radio", { name: t.link }),
    ).toBeDisabled();
    await expect(canvas.getByTestId("states").querySelectorAll("[role=radio]")).toHaveLength(6);
  },
};

/** Unchecked, checked, invalid, disabled and `sm` in the three profiles and both modes. */
export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <RadioGroup aria-label="plain" defaultValue="members">
        <RadioGroupItem value="members" label={w.members} />
        <RadioGroupItem value="organization" label={w.organization} />
      </RadioGroup>
      <Field group label={w.label} error={w.error}>
        <RadioGroup>
          <RadioGroupItem value="members" label={w.members} />
          <RadioGroupItem value="organization" label={w.organization} />
        </RadioGroup>
      </Field>
      <RadioGroup aria-label="disabled" defaultValue="members" disabled>
        <RadioGroupItem value="members" label={w.members} />
        <RadioGroupItem value="organization" label={w.organization} />
      </RadioGroup>
      <RadioGroup aria-label="small" size="sm" defaultValue="members">
        <RadioGroupItem value="members" label={w.members} />
        <RadioGroupItem value="organization" label={w.organization} />
      </RadioGroup>
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll<HTMLElement>("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    for (const cell of cells) {
      const on = within(cell).getAllByRole("radio", { name: w.members })[0] as HTMLElement;
      await expect(getComputedStyle(on).backgroundColor).toBe(
        resolvedColor(on, "--cmp-radio-bg-checked"),
      );
    }
  },
};
