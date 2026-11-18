import { INTAKE_FIELDS, type IntakeField, type IntakeProblem } from "@orivilo/intent-engine";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Matrix, Under } from "../components/matrix";
import { LocaleProvider } from "../i18n/LocaleProvider";
import type { Messages } from "../i18n/messages/index";
import { BusinessIntakeScreen } from "./business-intake";
import { LONG_ANSWER, LONG_NAME, LONG_WEBSITE } from "./business-fixtures";
import {
  en,
  expectAccessScreen,
  expectFitsAt360,
  FixtureNote,
  inEnglish,
  textOf,
  th,
} from "./business-story-helpers";
import { intakeLabel } from "./business-text";

const onSubmit = fn();

const meta = {
  title: "Examples/Application: Business intake",
  component: BusinessIntakeScreen,
  args: { access: "ready", signInHref: "/account", listHref: "/business" },
  decorators: [
    (Story) => (
      <>
        <FixtureNote />
        <Story />
      </>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "The intake screen (ORV-281): eight fields, the project name and the idea required, checked before anything is sent. It holds the values itself, so a failure or a pending save never clears them. Nothing is saved in these stories and no AI reads the answers. The page that renders it owns the one `main`.",
      },
    },
  },
} satisfies Meta<typeof BusinessIntakeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

const control = (canvas: ReturnType<typeof within>, m: Messages, key: IntakeField) =>
  canvas.getByLabelText(intakeLabel(m, key), { exact: false }) as
    HTMLInputElement | HTMLTextAreaElement;

/** The line under a field: its error text, found through `aria-describedby`. */
function errorOf(el: HTMLElement): string {
  return (el.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .map((id) => document.getElementById(id))
    .filter((node): node is HTMLElement => node !== null)
    .map(textOf)
    .join(" ");
}

const submitButton = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLButtonElement>('button[type="submit"]') as HTMLButtonElement;

// ----- access (rows 5, 7) -----

/** A person who is not signed in: the heading, the line, the sign-in link, no form (row 5). */
export const SignedOut: Story = {
  args: { access: "signed-out" },
  play: async ({ canvasElement }) => {
    await expectAccessScreen(canvasElement, th, th.business.intake.heading, "signed-out");
    await expect(th.business.signedOut).toBe("ลงชื่อเข้าใช้ก่อน แล้วจึงเล่าเรื่องธุรกิจของคุณได้");
  },
};

export const SignedOutEnglish: Story = {
  args: { access: "signed-out" },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await expectAccessScreen(canvasElement, en, en.business.intake.heading, "signed-out");
    await expect(en.business.signedOut).toBe("Sign in to tell us about your business.");
  },
};

/** A signed-in person who is not on the approved list: the line, no form, no link. */
export const NotAllowed: Story = {
  args: { access: "not-allowed" },
  play: async ({ canvasElement }) => {
    await expectAccessScreen(canvasElement, th, th.business.intake.heading, "not-allowed");
  },
};

/** No database set up: the line, no form (row 7). */
export const NotConfigured: Story = {
  args: { access: "not-configured" },
  play: async ({ canvasElement }) => {
    await expectAccessScreen(canvasElement, th, th.business.intake.heading, "not-configured");
  },
};

export const NotConfiguredEnglish: Story = {
  args: { access: "not-configured" },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await expectAccessScreen(canvasElement, en, en.business.intake.heading, "not-configured");
    await expect(en.business.notConfigured).toBe(
      "Businesses cannot be saved in this environment yet: the database is not set up.",
    );
  },
};

// ----- the form -----

/** The form as it opens, in `intake-fields-1` order: eight empty fields, two required, one primary action. */
async function formPlay(canvasElement: HTMLElement, m: Messages) {
  const canvas = within(canvasElement);
  await expect(
    canvas.getByRole("heading", { level: 1, name: m.business.intake.heading }),
  ).toBeVisible();
  await expect(canvas.getByText(m.business.intake.lede)).toBeVisible();
  const keys = INTAKE_FIELDS.map((f) => f.key);
  const els = keys.map((key) => control(canvas, m, key));
  // Form order is document order, and every value is empty.
  for (let i = 1; i < els.length; i++) {
    await expect(
      (els[i - 1] as HTMLElement).compareDocumentPosition(els[i] as HTMLElement) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  }
  for (const el of els) await expect(el.value).toBe("");
  // Two textareas rows count by the design: 4, 2, 3, 3, 3, 3; the name and the website are inputs.
  await expect(els.map((el) => el.localName)).toEqual([
    "input",
    "textarea",
    "textarea",
    "textarea",
    "textarea",
    "textarea",
    "textarea",
    "input",
  ]);
  await expect(els.map((el) => (el as HTMLTextAreaElement).rows || null)).toEqual([
    null,
    4,
    2,
    3,
    3,
    3,
    3,
    null,
  ]);
  // Required on the name and the idea only; the other six say optional.
  await expect(els.map((el) => el.getAttribute("aria-required"))).toEqual([
    "true",
    "true",
    null,
    null,
    null,
    null,
    null,
    null,
  ]);
  await expect(canvas.getAllByText(m.business.intake.optional)).toHaveLength(6);
  // The website is a text input that asks for a URL keyboard; no field has a length attribute or a counter.
  const website = control(canvas, m, "website");
  await expect(website).toHaveAttribute("type", "text");
  await expect(website).toHaveAttribute("inputmode", "url");
  await expect(canvasElement.querySelector("[maxlength]")).toBeNull();
  await expect(textOf(canvasElement)).not.toMatch(/\d\s*\/\s*\d/);
  // One primary action, the alert container is already on the page and empty.
  await expect(canvasElement.querySelectorAll('.ds-button[data-variant="primary"]')).toHaveLength(
    1,
  );
  await expect(canvasElement.querySelector('[role="alert"]')?.textContent).toBe("");
  await expect(canvas.getByRole("link", { name: m.business.list.heading })).toHaveAttribute(
    "href",
    "/business",
  );
  await expect(submitButton(canvasElement)).toHaveTextContent(m.business.intake.submit);
}

export const Form: Story = {
  play: async ({ canvasElement }) => {
    await formPlay(canvasElement, th);
  },
};

export const FormEnglish: Story = {
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await formPlay(canvasElement, en);
  },
};

// ----- invalid (row 8) -----

type Lines = { name: string; idea: string; long2000: string; long120: string };

const TH_LINES: Lines = {
  name: "ตั้งชื่อโปรเจกต์",
  idea: "บอกเราว่าคุณขายหรือให้บริการอะไร",
  long2000: "ใช้ไม่เกิน 2000 ตัวอักษร",
  long120: "ใช้ไม่เกิน 120 ตัวอักษร",
};
const EN_LINES: Lines = {
  name: "Give the project a name.",
  idea: "Tell us what you sell or offer.",
  long2000: "Use 2000 characters or fewer.",
  long120: "Use 120 characters or fewer.",
};

/**
 * An empty name and idea: the two required lines on their fields, focus on the name, no call; a
 * field's error clears when its own value changes and no other field's does (row 8).
 */
async function invalidPlay(canvasElement: HTMLElement, m: Messages, lines: Lines) {
  onSubmit.mockClear();
  const canvas = within(canvasElement);
  const name = control(canvas, m, "projectName");
  const idea = control(canvas, m, "idea");
  await userEvent.click(canvas.getByRole("button", { name: m.business.intake.submit }));
  await expect(errorOf(name)).toContain(lines.name);
  await expect(errorOf(idea)).toContain(lines.idea);
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(idea).toHaveAttribute("aria-invalid", "true");
  await waitFor(() => expect(document.activeElement).toBe(name));
  await expect(onSubmit).not.toHaveBeenCalled();
  await expect(canvasElement.querySelectorAll('[aria-invalid="true"]')).toHaveLength(2);
  await userEvent.type(name, "x");
  await expect(name).not.toHaveAttribute("aria-invalid");
  await expect(errorOf(name)).not.toContain(lines.name);
  await expect(idea).toHaveAttribute("aria-invalid", "true");
}

/**
 * A name of 121 characters and an idea of 2,001: each line carries its own bound, the text stays,
 * focus goes to the first invalid field in form order, then to the next once the first is mended.
 */
async function tooLongPlay(canvasElement: HTMLElement, m: Messages, lines: Lines) {
  onSubmit.mockClear();
  const canvas = within(canvasElement);
  const name = control(canvas, m, "projectName");
  const idea = control(canvas, m, "idea");
  const submit = canvas.getByRole("button", { name: m.business.intake.submit });
  await userEvent.click(name);
  await userEvent.paste("y".repeat(121));
  await userEvent.click(idea);
  await userEvent.paste("ก".repeat(2001));
  await userEvent.click(submit);
  await expect(errorOf(name)).toContain(lines.long120);
  await expect(errorOf(idea)).toContain(lines.long2000);
  await expect(name.value).toHaveLength(121);
  await expect(idea.value).toHaveLength(2001);
  await waitFor(() => expect(document.activeElement).toBe(name));
  await userEvent.clear(name);
  await userEvent.type(name, "x");
  await userEvent.click(submit);
  await expect(name).not.toHaveAttribute("aria-invalid");
  await expect(errorOf(idea)).toContain(lines.long2000);
  await waitFor(() => expect(document.activeElement).toBe(idea));
  await expect(idea.value).toHaveLength(2001);
  await expect(onSubmit).not.toHaveBeenCalled();
}

/**
 * A website of `ftp://`: its line on the field, focus there, every value kept, no call; a valid
 * address then ends it with one call holding the checked intake and the website as kept.
 */
async function websitePlay(canvasElement: HTMLElement, m: Messages) {
  onSubmit.mockClear();
  const canvas = within(canvasElement);
  const name = control(canvas, m, "projectName");
  const idea = control(canvas, m, "idea");
  const website = control(canvas, m, "website");
  const submit = canvas.getByRole("button", { name: m.business.intake.submit });
  await userEvent.type(name, "x");
  await userEvent.type(idea, "ok");
  await userEvent.click(website);
  await userEvent.paste("ftp://example.com/");
  await userEvent.click(submit);
  await expect(errorOf(website)).toContain(m.business.intake.websiteInvalid);
  await waitFor(() => expect(document.activeElement).toBe(website));
  await expect([name.value, idea.value, website.value]).toEqual(["x", "ok", "ftp://example.com/"]);
  await expect(onSubmit).not.toHaveBeenCalled();
  await userEvent.clear(website);
  await userEvent.click(website);
  await userEvent.paste("example.com");
  await expect(website).not.toHaveAttribute("aria-invalid");
  await userEvent.click(submit);
  await expect(onSubmit).toHaveBeenCalledTimes(1);
  await expect(onSubmit).toHaveBeenCalledWith({
    projectName: "x",
    idea: "ok",
    website: "https://example.com/",
  });
  await expect(canvasElement.querySelector('[aria-invalid="true"]')).toBeNull();
}

export const Invalid: Story = {
  args: { onSubmit },
  play: async ({ canvasElement }) => {
    await invalidPlay(canvasElement, th, TH_LINES);
  },
};

export const InvalidEnglish: Story = {
  args: { onSubmit },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await invalidPlay(canvasElement, en, EN_LINES);
  },
};

export const TooLong: Story = {
  args: { onSubmit },
  play: async ({ canvasElement }) => {
    await tooLongPlay(canvasElement, th, TH_LINES);
  },
};

export const TooLongEnglish: Story = {
  args: { onSubmit },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await tooLongPlay(canvasElement, en, EN_LINES);
  },
};

export const InvalidWebsite: Story = {
  args: { onSubmit },
  play: async ({ canvasElement }) => {
    await websitePlay(canvasElement, th);
  },
};

export const InvalidWebsiteEnglish: Story = {
  args: { onSubmit },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await websitePlay(canvasElement, en);
  },
};

/** The server refused the website at step 4: its line shows on the field, focus goes there, the text stays (row 8). */
async function refusedPlay(canvasElement: HTMLElement, m: Messages) {
  const canvas = within(canvasElement);
  const website = control(canvas, m, "website");
  await expect(errorOf(website)).toContain(m.business.intake.websiteInvalid);
  await expect(website).toHaveAttribute("aria-invalid", "true");
  await waitFor(() => expect(document.activeElement).toBe(website));
  await userEvent.type(website, "ftp");
  await expect(website).not.toHaveAttribute("aria-invalid");
  await expect(website.value).toBe("ftp");
}

export const RefusedByServer: Story = {
  args: { problems: [{ field: "website", kind: "website" }] },
  play: async ({ canvasElement }) => {
    await refusedPlay(canvasElement, th);
  },
};

export const RefusedByServerEnglish: Story = {
  args: { problems: [{ field: "website", kind: "website" }] },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await refusedPlay(canvasElement, en);
  },
};

/** A caller that answers every save with the server's refusal of the website, a new array each time. */
function ServerRefusesScreen() {
  const [problems, setProblems] = useState<readonly IntakeProblem[] | undefined>(undefined);
  return (
    <BusinessIntakeScreen
      access="ready"
      signInHref="/account"
      listHref="/business"
      problems={problems}
      onSubmit={() => setProblems([{ field: "website", kind: "website" }])}
    />
  );
}

/**
 * A valid form is sent and the server refuses the website after the page has rendered: the new
 * problems replace what was shown, focus goes to the field, the typed values stay, and a second
 * refusal, a new array again, shows and focuses once more (row 8, step 4 of `business-door-1`).
 */
async function serverRefusesPlay(canvasElement: HTMLElement, m: Messages) {
  const canvas = within(canvasElement);
  const name = control(canvas, m, "projectName");
  const idea = control(canvas, m, "idea");
  const website = control(canvas, m, "website");
  await userEvent.type(name, "x");
  await userEvent.type(idea, "ok");
  await userEvent.type(website, "example.com");
  await expect(canvasElement.querySelector('[aria-invalid="true"]')).toBeNull();
  const submit = canvas.getByRole("button", { name: m.business.intake.submit });
  await userEvent.click(submit);
  await expect(errorOf(website)).toContain(m.business.intake.websiteInvalid);
  await waitFor(() => expect(document.activeElement).toBe(website));
  await expect([name.value, idea.value, website.value]).toEqual(["x", "ok", "example.com"]);
  await userEvent.type(website, "s");
  await expect(website).not.toHaveAttribute("aria-invalid");
  await userEvent.click(submit);
  await expect(errorOf(website)).toContain(m.business.intake.websiteInvalid);
  await waitFor(() => expect(document.activeElement).toBe(website));
}

export const ServerRefuses: Story = {
  render: () => <ServerRefusesScreen />,
  play: async ({ canvasElement }) => {
    await serverRefusesPlay(canvasElement, th);
  },
};

export const ServerRefusesEnglish: Story = {
  render: () => <ServerRefusesScreen />,
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await serverRefusesPlay(canvasElement, en);
  },
};

// ----- pending (row 10) -----

/** A save is running: the button is disabled and busy, the line shows, a press or a bypass makes no call, fields stay editable. */
async function pendingPlay(canvasElement: HTMLElement, m: Messages) {
  onSubmit.mockClear();
  const canvas = within(canvasElement);
  const button = submitButton(canvasElement);
  await expect(button).toBeDisabled();
  await expect(button).toHaveAttribute("aria-busy", "true");
  await expect(button).toHaveTextContent(m.business.intake.submit);
  const status = canvas
    .getAllByRole("status")
    .find((el) => textOf(el) === m.business.intake.pending);
  await expect(status).toBeDefined();
  await userEvent.click(button);
  await expect(onSubmit).not.toHaveBeenCalled();
  // The fields keep their values and stay editable.
  const name = control(canvas, m, "projectName");
  const idea = control(canvas, m, "idea");
  await expect(name).toBeEnabled();
  await userEvent.type(name, "x");
  await userEvent.type(idea, "ok");
  await expect(name.value).toBe("x");
  await expect(idea.value).toBe("ok");
  // A submit that bypasses the button starts no second save.
  canvasElement.querySelector("form")?.requestSubmit();
  await expect(onSubmit).not.toHaveBeenCalled();
  await expect(name.value).toBe("x");
}

export const Pending: Story = {
  args: { pending: true, onSubmit },
  play: async ({ canvasElement }) => {
    await pendingPlay(canvasElement, th);
  },
};

export const PendingEnglish: Story = {
  args: { pending: true, onSubmit },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await pendingPlay(canvasElement, en);
  },
};

// ----- failure -----

const SESSION_ENDED = "Your session has ended. Sign in again and retry.";

/** The caller's line shows in a danger Alert under the button and every typed value stays; the form works again. */
async function failurePlay(canvasElement: HTMLElement, m: Messages) {
  onSubmit.mockClear();
  const canvas = within(canvasElement);
  const name = control(canvas, m, "projectName");
  const idea = control(canvas, m, "idea");
  await userEvent.type(name, "คาเฟ่");
  await userEvent.type(idea, "ร้านกาแฟ");
  await userEvent.click(canvas.getByRole("button", { name: m.business.intake.submit }));
  await expect(onSubmit).toHaveBeenCalledTimes(1);
  await expect(onSubmit).toHaveBeenCalledWith({ projectName: "คาเฟ่", idea: "ร้านกาแฟ" });
  await expect(name.value).toBe("คาเฟ่");
  await expect(idea.value).toBe("ร้านกาแฟ");
  const alert = canvasElement.querySelector<HTMLElement>('[role="alert"]') as HTMLElement;
  await expect(textOf(alert)).toContain(SESSION_ENDED);
  await expect(alert.querySelector(".ds-alert")?.getAttribute("data-variant")).toBe("danger");
  const button = submitButton(canvasElement);
  await expect(
    button.compareDocumentPosition(alert) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
}

export const Failure: Story = {
  args: { failure: SESSION_ENDED, onSubmit },
  play: async ({ canvasElement }) => {
    await failurePlay(canvasElement, th);
  },
};

export const FailureEnglish: Story = {
  args: { failure: SESSION_ENDED, onSubmit },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await failurePlay(canvasElement, en);
  },
};

// ----- narrow (row 20) -----

const narrow = (node: ReactNode) => (
  <div data-narrow="" className="w-[360px] max-w-full">
    {node}
  </div>
);

/** The 120-character Thai name, a long answer with no space and the 2,048-character website, with errors on view. */
async function narrowPlay(canvasElement: HTMLElement, m: Messages) {
  const canvas = within(canvasElement);
  const name = control(canvas, m, "projectName");
  await userEvent.click(name);
  await userEvent.paste(LONG_NAME + "ก");
  await userEvent.click(control(canvas, m, "idea"));
  await userEvent.paste(LONG_ANSWER);
  await userEvent.click(control(canvas, m, "website"));
  await userEvent.paste(LONG_WEBSITE + "b");
  await userEvent.click(canvas.getByRole("button", { name: m.business.intake.submit }));
  await waitFor(() =>
    expect(canvasElement.querySelectorAll('[aria-invalid="true"]')).toHaveLength(2),
  );
  await expectFitsAt360(canvasElement);
  // The fields fill the column, one edge for the header and every control.
  const left = canvasElement.querySelector("h1")?.getBoundingClientRect().left ?? 0;
  for (const key of ["projectName", "idea", "website"] as const) {
    await expect(
      Math.abs(control(canvas, m, key).getBoundingClientRect().left - left),
    ).toBeLessThanOrEqual(0.5);
  }
}

const narrowScreen = (
  <BusinessIntakeScreen access="ready" signInHref="/account" listHref="/business" />
);

export const NarrowLight: Story = {
  render: () => (
    <Under profile="neutral" mode="light">
      {narrow(narrowScreen)}
    </Under>
  ),
  play: async ({ canvasElement }) => {
    await narrowPlay(canvasElement, th);
  },
};

export const NarrowDark: Story = {
  render: () => (
    <Under profile="neutral" mode="dark">
      {narrow(narrowScreen)}
    </Under>
  ),
  play: async ({ canvasElement }) => {
    await narrowPlay(canvasElement, th);
  },
};

export const NarrowEnglish: Story = {
  render: () => (
    <LocaleProvider locale="en">
      <Under profile="neutral" mode="light">
        {narrow(narrowScreen)}
      </Under>
    </LocaleProvider>
  ),
  play: async ({ canvasElement }) => {
    await narrowPlay(canvasElement, en);
  },
};

// ----- recipes and modes -----

/** The same form under every profile in both modes, with errors on view, checked by the a11y addon. */
export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <div className="min-w-0">
        <BusinessIntakeScreen
          access="ready"
          signInHref="/account"
          listHref="/business"
          problems={[
            { field: "projectName", kind: "required" },
            { field: "website", kind: "website" },
          ]}
          failure={SESSION_ENDED}
        />
      </div>
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    for (const cell of cells) {
      await expect(within(cell as HTMLElement).getAllByRole("heading", { level: 1 })).toHaveLength(
        1,
      );
    }
  },
};
