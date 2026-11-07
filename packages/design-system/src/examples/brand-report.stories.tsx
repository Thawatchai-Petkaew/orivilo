import type { PersonalityAxis, QualityKey, ReportView, ViewReading } from "@orivilo/intent-engine";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { fixtures } from "../components/fixtures";
import { Matrix, Narrow, Under } from "../components/matrix";
import { LocaleProvider, useLocale, useMessages } from "../i18n/LocaleProvider";
import { pick } from "../i18n/locale";
import { messagesFor } from "../i18n/messages/index";
import { BrandReportScreen } from "./brand-report";

const meta = {
  title: "Examples/Application: Brand report",
  component: BrandReportScreen,
  args: { access: "form" },
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
          "The brand evidence report screen (ORV-267): a form for one website address and the report of the last read, composed from the public components only. Every report in these stories is a labelled fixture, built by hand, and no page was read. The readings are rule-based, not AI, and the screen says so. The page that renders it owns the one `main`; the screen has no landmark.",
      },
    },
  },
} satisfies Meta<typeof BrandReportScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The label every story carries: the reports below are made by hand, not read from a page. */
function FixtureNote() {
  const locale = useLocale();
  return (
    <p className="p-4 text-body-sm text-text-secondary">
      {pick(
        {
          th: "ข้อมูลตัวอย่าง: รายงานในเรื่องนี้ทำขึ้นเอง ไม่ได้อ่านจากหน้าเว็บจริง",
          en: "Fixture: the reports in this story are made by hand, no page was read.",
        },
        locale,
      )}
    </p>
  );
}

const th = messagesFor("th");
const en = messagesFor("en");
const onRead = fn();

/** `HTML_A` and `CSS_A` of the ORV-20 band: an orange and a blue that falls in the violet band, and one font. */
const PAGE = "https://clinic.example/";
const SHEET = "https://clinic.example/a.css";
const READ_AT = "2026-11-07T03:15:00.000Z";

const AXES: readonly PersonalityAxis[] = ["playful", "expressive", "structured", "warm", "premium"];

function reading(
  id: string,
  level: "high" | "low",
  quote: string,
  path: string,
  extra: Partial<ViewReading> = {},
): ViewReading {
  return {
    evidenceId: id,
    level,
    quote,
    path,
    rules: ["lexicon-1"],
    confidence: 0.7,
    hypothesis: false,
    reasons: [],
    ...extra,
  };
}

type Analysed = Extract<ReportView, { status: "analysed" }>;
type AxisEntry = Analysed["personality"][number];

function personalityOf(by: Partial<Record<PersonalityAxis, Partial<AxisEntry>>>): AxisEntry[] {
  return AXES.map((axis) => {
    const given = by[axis] ?? {};
    const leans = given.leans ?? [];
    const belowFloor = given.belowFloor ?? [];
    return {
      axis,
      leans,
      leansTotal: given.leansTotal ?? leans.length,
      belowFloor,
      belowFloorTotal: given.belowFloorTotal ?? belowFloor.length,
    };
  });
}

const NOT_MEASURED: Analysed["notMeasured"] = [
  {
    line: "read.notMeasured",
    what: "read.notMeasured.what.colourArea",
    reason: "read.notRendered.none",
  },
  {
    line: "read.notMeasured",
    what: "read.notMeasured.what.contrast",
    reason: "read.notRendered.none",
  },
  {
    line: "read.notMeasured",
    what: "read.notMeasured.what.density",
    reason: "read.notRendered.none",
  },
  {
    line: "read.notMeasured",
    what: "read.notMeasured.what.textVisibility",
    reason: "read.notRendered.none",
  },
];

/** One quote holding `premium`, one holding `not too premium`, and a heading below the floor. */
const PREMIUM_BODY = reading(
  "ev-body-1",
  "high",
  "A premium finish for every visit",
  "body > section > p:nth-of-type(1)",
  { confidence: 0.8 },
);
const PREMIUM_NOT_TOO = reading(
  "ev-body-2",
  "low",
  "Not too premium, just honest care",
  "body > section > p:nth-of-type(2)",
  { rules: ["value-to-lean-1"], confidence: 0.4, hypothesis: true },
);
const PREMIUM_HEADING = reading("ev-h-1", "high", "Quiet premium care", "body > section > h1", {
  confidence: 0.3,
  reasons: ["quality.fewWords"],
});

const ANALYSED: Analysed = {
  status: "analysed",
  url: PAGE,
  readAt: READ_AT,
  role: "own",
  incomplete: false,
  thin: false,
  sheets: [SHEET],
  colours: [
    { hex: "#FF7A00", band: "orange", at: [{ sheet: 0, offset: 41 }] },
    { hex: "#0000FF", band: "violet", at: [{ sheet: 0, offset: 88 }] },
  ],
  coloursTotal: 2,
  fonts: [{ name: "inter", at: [{ sheet: 0, offset: 120 }] }],
  fontsTotal: 1,
  text: [
    { kind: "title", blocks: 1, words: 3 },
    { kind: "meta", blocks: 1, words: 12 },
    { kind: "heading", blocks: 3, words: 9 },
    { kind: "body", blocks: 2, words: 44 },
  ],
  personality: personalityOf({
    premium: {
      leans: [PREMIUM_BODY, PREMIUM_NOT_TOO],
      belowFloor: [PREMIUM_HEADING],
    },
    warm: {
      leans: [
        reading(
          "ev-body-3",
          "high",
          "We welcome every family",
          "body > section > p:nth-of-type(3)",
        ),
      ],
    },
  }),
  notMeasured: NOT_MEASURED,
  lines: ["report.conflictsNotChecked"],
};

/** Part of the page did not load: the premium reading falls below the floor, and no lean is left. */
const INCOMPLETE: Analysed = {
  ...ANALYSED,
  incomplete: true,
  personality: personalityOf({
    premium: {
      belowFloor: [
        { ...PREMIUM_BODY, confidence: 0.3, reasons: ["quality.pageIncomplete" as QualityKey] },
      ],
    },
  }),
};

/** A title and a description only: too little text to read much from. */
const THIN: Analysed = {
  ...ANALYSED,
  thin: true,
  colours: [],
  coloursTotal: 0,
  fonts: [],
  fontsTotal: 0,
  text: [
    { kind: "title", blocks: 1, words: 3 },
    { kind: "meta", blocks: 1, words: 12 },
  ],
  personality: personalityOf({}),
};

const refused = (line: Extract<ReportView, { status: "refused" }>["line"]): ReportView => ({
  status: "refused",
  url: PAGE,
  urlCut: false,
  line,
});

const textOf = (el: Element) => (el.textContent ?? "").replace(/\s+/g, " ");

/** No word that ranks a colour or a font, in either language (`report-view-1`, last paragraph). */
function expectNoRanking(root: Element) {
  expect(textOf(root)).not.toMatch(/\b(main|primary|dominant)\b/i);
  expect(textOf(root)).not.toMatch(/สีหลัก|ฟอนต์หลัก|ส่วนใหญ่|เด่นที่สุด/);
}

/** The words that must never appear: a business type, a mood, a colour area, a contrast or a density claimed as a fact. */
function expectOnlyNotMeasuredClaims(root: Element, m: typeof th) {
  const text = textOf(root);
  const claims = [
    m.brandReport.notReadIndustryMood,
    m.brandReport.notReadSources,
    ...NOT_MEASURED.map((n) =>
      m.brandReport.engine[n.line]
        .replace("{what}", m.brandReport.engine[n.what])
        .replace("{reason}", m.brandReport.engine["read.notRendered.none"]),
    ),
  ];
  for (const claim of claims) expect(text).toContain(claim);
}

/** Every `Notice` of the screen is an Alert, so a rule-based note is checked by its text. */
function alertWith(root: HTMLElement, text: string) {
  const found = [...root.querySelectorAll<HTMLElement>(".ds-alert")].find((el) =>
    textOf(el).includes(text),
  );
  if (!found) throw new Error(`no Alert says: ${text}`);
  return found;
}

// ----- access (rows 10, 11) -----

/** A person who is not signed in: the heading, the line, a link to /account, and no form (row 10). */
export const SignedOut: Story = {
  args: { access: "signed-out" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { level: 1, name: th.brandReport.heading }),
    ).toBeVisible();
    await expect(canvas.getByText(th.brandReport.signedOut)).toBeVisible();
    await expect(canvas.getByRole("link", { name: th.brandReport.signInLink })).toHaveAttribute(
      "href",
      "/account",
    );
    await expect(canvas.queryByRole("textbox")).toBeNull();
    await expect(canvasElement.querySelector("form")).toBeNull();
  },
};

/** An environment with no auth or database: the heading and the line, no form (row 11). */
export const NotConfigured: Story = {
  args: { access: "not-configured" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { level: 1, name: th.brandReport.heading }),
    ).toBeVisible();
    await expect(canvas.getByText(th.brandReport.notConfigured)).toBeVisible();
    await expect(canvas.queryByRole("textbox")).toBeNull();
    await expect(canvasElement.querySelector("form")).toBeNull();
  },
};

// ----- the form (rows 12, 14, 16) -----

/** The form as it opens: the field, the role choice with none chosen, one primary action. */
export const Form: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText(new RegExp(th.brandReport.urlLabel))).toHaveAttribute(
      "inputmode",
      "url",
    );
    await expect(canvas.getAllByRole("radio")).toHaveLength(3);
    await expect(canvas.queryByRole("radio", { checked: true })).toBeNull();
    await expect(canvasElement.querySelectorAll('.ds-button[data-variant="primary"]')).toHaveLength(
      1,
    );
  },
};

/** An empty field, then no role, then both given: the required lines on their fields and one call at the end (row 14, 15). */
export const Invalid: Story = {
  args: { onRead },
  play: async ({ canvasElement }) => {
    onRead.mockClear();
    const canvas = within(canvasElement);
    const field = canvas.getByLabelText(new RegExp(th.brandReport.urlLabel));
    const submit = canvas.getByRole("button", { name: th.brandReport.submit });
    await userEvent.click(submit);
    await expect(canvas.getByText(th.brandReport.urlRequired)).toBeVisible();
    await expect(canvas.getByText(th.brandReport.roleRequired)).toBeVisible();
    await expect(field).toHaveAttribute("aria-invalid", "true");
    await expect(canvas.getByRole("radiogroup")).toHaveAttribute("aria-invalid", "true");
    await expect(onRead).not.toHaveBeenCalled();

    // Spaces alone are no address.
    await userEvent.type(field, "   ");
    await userEvent.click(submit);
    await expect(canvas.getByText(th.brandReport.urlRequired)).toBeVisible();
    await expect(onRead).not.toHaveBeenCalled();

    await userEvent.clear(field);
    await userEvent.type(field, " example.com ");
    await expect(canvas.queryByText(th.brandReport.urlRequired)).toBeNull();
    await userEvent.click(submit);
    await expect(canvas.queryByText(th.brandReport.urlRequired)).toBeNull();
    await expect(canvas.getByText(th.brandReport.roleRequired)).toBeVisible();
    await expect(onRead).not.toHaveBeenCalled();

    await userEvent.click(canvas.getByRole("radio", { name: th.brandReport.roleOwn }));
    await expect(canvas.queryByText(th.brandReport.roleRequired)).toBeNull();
    await userEvent.click(submit);
    await expect(onRead).toHaveBeenCalledTimes(1);
    await expect(onRead).toHaveBeenCalledWith({ url: " example.com ", role: "own" });
    await expect(field).toHaveValue(" example.com ");
  },
};

/** A read is running: the button is disabled, the status line shows, and a press makes no call (row 16). */
export const Pending: Story = {
  args: { pending: true, onRead },
  play: async ({ canvasElement }) => {
    onRead.mockClear();
    const canvas = within(canvasElement);
    const button = canvasElement.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (button === null) throw new Error("no submit button");
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button).toHaveTextContent(th.brandReport.submit);
    const status = canvas
      .getAllByRole("status")
      .find((el) => textOf(el) === th.brandReport.pending);
    await expect(status).toBeDefined();
    await userEvent.click(button);
    await expect(onRead).not.toHaveBeenCalled();
    // A submit that bypasses the button (the form's own submit event) starts no second read.
    await userEvent.type(canvas.getByLabelText(new RegExp(th.brandReport.urlLabel)), "example.com");
    await userEvent.click(canvas.getByRole("radio", { name: th.brandReport.roleOwn }));
    canvasElement.querySelector("form")?.requestSubmit();
    await expect(onRead).not.toHaveBeenCalled();
  },
};

/** The session ended: the line from `saved.errors.signed-out` shows and the address stays in the field (row 12). */
export const SessionEnded: Story = {
  args: { onRead, failure: "Your session has ended. Sign in again and retry." },
  play: async ({ canvasElement }) => {
    onRead.mockClear();
    const canvas = within(canvasElement);
    const field = canvas.getByLabelText(new RegExp(th.brandReport.urlLabel));
    await userEvent.type(field, "example.com");
    await userEvent.click(canvas.getByRole("radio", { name: th.brandReport.roleReference }));
    await userEvent.click(canvas.getByRole("button", { name: th.brandReport.submit }));
    await expect(onRead).toHaveBeenCalledWith({ url: "example.com", role: "reference" });
    await expect(field).toHaveValue("example.com");
    const alert = canvas.getByRole("alert", { name: "" });
    await expect(alert).toHaveTextContent("Your session has ended. Sign in again and retry.");
  },
};

// ----- a report (rows 17 to 21) -----

/** An `analysed` report from `HTML_A` and `CSS_A` in Thai, the language the plays run in (rows 17, 18, 19, 21). */
export const Analysed: Story = {
  args: { view: ANALYSED },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const text = textOf(canvasElement);
    // Header: the label, not saved, the URL read, the time in Bangkok, the role (row 17).
    await expect(alertWith(canvasElement, th.brandReport.ruleBased)).toBeVisible();
    await expect(alertWith(canvasElement, th.brandReport.ruleBased)).toHaveAttribute(
      "data-variant",
      "info",
    );
    await expect(canvas.getByText(th.brandReport.notSaved)).toBeVisible();
    await expect(text).toContain(`หน้าที่อ่าน: ${PAGE}`);
    await expect(text).toMatch(/2569.*10:15.*เวลาไทย/);
    await expect(text).toContain("อ่านในฐานะ: แบรนด์ของฉัน");
    // Colours and fonts with their sources, and nothing that ranks them (row 18).
    await expect(text).toContain("#FF7A00, ส้ม");
    await expect(text).toContain("#0000FF, ม่วง");
    await expect(text).toContain(`ที่มา: ${SHEET} อักขระที่ 41`);
    await expect(text).toContain(`ที่มา: ${SHEET} อักขระที่ 88`);
    await expect(text).toContain("inter");
    await expect(text).toContain(`ที่มา: ${SHEET} อักขระที่ 120`);
    await expect(canvas.getAllByText(th.brandReport.declaredNote)).toHaveLength(2);
    expectNoRanking(canvasElement);
    // Text: one line per kind with counts, the note, one source line (row 19).
    await expect(text).toContain("ชื่อหน้า: 1 ส่วน 3 คำ");
    await expect(text).toContain("คำอธิบาย: 1 ส่วน 12 คำ");
    await expect(text).toContain("หัวข้อ: 3 ส่วน 9 คำ");
    await expect(text).toContain("เนื้อหา: 2 ส่วน 44 คำ");
    await expect(canvas.getByText(th.brandReport.textNote)).toBeVisible();
    const textBlock = canvas
      .getByRole("heading", { level: 2, name: th.brandReport.textHeading })
      .closest(".ds-section-header")?.parentElement as HTMLElement;
    await expect(textOf(textBlock)).toContain(`ที่มา: ${PAGE}`);
    // Not measured: the four lines then the two not-read lines (row 21).
    expectOnlyNotMeasuredClaims(canvasElement, th);
    await expect(text).toContain(
      "ไม่ได้วัด: สัดส่วนพื้นที่สี เพราะไม่ได้แสดงผลหน้าเว็บ (ยังไม่ได้ตั้งค่าตัวแสดงผล)",
    );
    // The sections, in report-view-1 order, under one level 1.
    const headings = canvas.getAllByRole("heading", { level: 2 }).map((h) => textOf(h));
    await expect(headings).toEqual([
      th.brandReport.coloursHeading,
      th.brandReport.fontsHeading,
      th.brandReport.textHeading,
      th.brandReport.personalityHeading,
      th.brandReport.notMeasuredHeading,
    ]);
    await expect(canvas.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    await expect(canvasElement.querySelector("main")).toBeNull();
  },
};

/** The same report in English: the headings, notices, hue labels and not-measured lines change, the page's values do not (rows 17, 33). */
export const AnalysedEnglish: Story = {
  args: { view: ANALYSED },
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  play: async ({ canvasElement }) => {
    const text = textOf(canvasElement);
    await expect(
      alertWith(
        canvasElement,
        "Read by fixed rules, not by AI. Confidence numbers come from the same rules, not from a test of accuracy.",
      ),
    ).toBeVisible();
    await expect(text).toContain(`Page read: ${PAGE}`);
    await expect(text).toMatch(/Nov 7, 2026.*10:15.*Bangkok time/);
    await expect(text).toContain("Read as: My own brand");
    await expect(text).toContain("#FF7A00, orange");
    await expect(text).toContain("#0000FF, violet");
    await expect(text).toContain(`Source: ${SHEET}, at character 41`);
    await expect(text).toContain("inter");
    await expect(text).toContain("Title: blocks 1, words 3");
    await expect(text).toContain(
      "Not measured: colour areas. The page was not rendered (no renderer is set up).",
    );
    await expect(text).toContain(
      "Not measured: which text is visible. The page was not rendered (no renderer is set up).",
    );
    expectOnlyNotMeasuredClaims(canvasElement, en);
    expectNoRanking(canvasElement);
  },
};

/** Two opposite body leans side by side under premium, the hypothesis note, the heading below the floor, no signal elsewhere (row 20). */
export const Personality: Story = {
  args: { view: ANALYSED },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const text = textOf(canvasElement);
    await expect(text).toContain(th.brandReport.engine["report.conflictsNotChecked"]);
    const axes = canvas.getAllByRole("heading", { level: 3 }).map((h) => textOf(h));
    await expect(axes).toEqual(AXES.map((axis) => th.direction.axes[axis]));
    const premium = canvas.getByRole("heading", { level: 3, name: th.direction.axes.premium })
      .parentElement as HTMLElement;
    const cards = [...premium.querySelectorAll("li")];
    await expect(cards).toHaveLength(3);
    const [high, low, below] = cards as unknown as [HTMLElement, HTMLElement, HTMLElement];
    // The two leans sit side by side: the same top edge, one left of the other.
    const a = high.getBoundingClientRect();
    const b = low.getBoundingClientRect();
    await expect(Math.abs(a.top - b.top)).toBeLessThanOrEqual(0.5);
    await expect(a.right).toBeLessThanOrEqual(b.left + 0.5);
    for (const [card, quote, level, path, rule, confidence] of [
      [high, "A premium finish for every visit", "มาก", "p:nth-of-type(1)", "lexicon-1", "0.8"],
      [
        low,
        "Not too premium, just honest care",
        "น้อย",
        "p:nth-of-type(2)",
        "value-to-lean-1",
        "0.4",
      ],
    ] as const) {
      const t = textOf(card);
      await expect(t).toContain(quote);
      await expect(t).toContain(level);
      await expect(t).toContain(`ที่มา: ${PAGE} ส่วน body > section > ${path}`);
      await expect(t).toContain(`กฎ: ${rule}`);
      await expect(t).toContain(`ความมั่นใจ ${confidence}`);
    }
    // The hypothesis line on the "not too" lean only.
    await expect(textOf(low)).toContain(th.brandReport.hypothesis);
    await expect(textOf(high)).not.toContain(th.brandReport.hypothesis);
    // The heading reading is below the floor, with its reason, and is not a lean.
    await expect(textOf(below)).toContain("ยังไม่แน่ชัดพอจะนำไปใช้: ข้อความมีไม่ถึง 20 คำ");
    await expect(textOf(below)).toContain("Quiet premium care");
    // Four axes show no signal besides the lean of warm.
    await expect(canvas.getAllByText(th.brandReport.noSignal)).toHaveLength(3);
    // No English engine note reaches the page.
    await expect(text).not.toMatch(/working assumption|hypothesisNote/i);
  },
};

/** Part of the page did not load: the notice above the sections, the sections still shown, the premium reading below the floor (row 26). */
export const Incomplete: Story = {
  args: { view: INCOMPLETE },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const notice = alertWith(canvasElement, th.brandReport.incomplete);
    await expect(notice).toHaveAttribute("data-variant", "warning");
    const firstSection = canvas.getAllByRole("heading", { level: 2 })[0] as HTMLElement;
    await expect(
      notice.compareDocumentPosition(firstSection) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    await expect(canvas.getAllByRole("heading", { level: 2 })).toHaveLength(5);
    const premium = canvas.getByRole("heading", { level: 3, name: th.direction.axes.premium })
      .parentElement as HTMLElement;
    await expect(textOf(premium)).toContain(
      "ยังไม่แน่ชัดพอจะนำไปใช้: บางส่วนของหน้าเว็บโหลดไม่สำเร็จ",
    );
    await expect(textOf(premium)).toContain(th.brandReport.noSignal);
    await expect(textOf(canvasElement)).toContain(
      "ไม่ได้วัด: สัดส่วนพื้นที่สี เพราะไม่ได้แสดงผลหน้าเว็บ",
    );
  },
};

export const IncompleteEnglish: Story = {
  args: { view: INCOMPLETE },
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  play: async ({ canvasElement }) => {
    const text = textOf(canvasElement);
    await expect(
      alertWith(
        canvasElement,
        "Part of this page could not be read, so this report is incomplete and readings count for less.",
      ),
    ).toBeVisible();
    await expect(text).toContain("Too uncertain to use: part of the page did not load");
    await expect(text).toContain("No signal");
  },
};

/** Too little text: the thin notice, the sections still shown, and the empty line where a section has nothing (row 27). */
export const ThinPage: Story = {
  args: { view: THIN },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(alertWith(canvasElement, th.brandReport.thin)).toHaveAttribute(
      "data-variant",
      "warning",
    );
    await expect(canvas.getByText(th.brandReport.coloursEmpty)).toBeVisible();
    await expect(canvas.getByText(th.brandReport.fontsEmpty)).toBeVisible();
    await expect(canvas.getAllByRole("heading", { level: 2 })).toHaveLength(5);
    await expect(textOf(canvasElement)).toContain("ชื่อหน้า: 1 ส่วน 3 คำ");
    expectOnlyNotMeasuredClaims(canvasElement, th);
  },
};

/** A report with no text at all: the empty line replaces the counts. */
export const TextEmpty: Story = {
  args: { view: { ...THIN, text: [] } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(th.brandReport.textEmpty)).toBeVisible();
  },
};

// ----- reads that gave no report (rows 22 to 25, 30) -----

async function expectNoSections(canvasElement: HTMLElement) {
  await expect(within(canvasElement).queryAllByRole("heading", { level: 2 })).toHaveLength(0);
  await expect(canvasElement.querySelector("[data-report]")).toBeNull();
}

/** A refused address: a warning with the line, no sections, the address stays in the field (row 22). */
export const RefusedAddress: Story = {
  args: { view: refused("read.refused.address") },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByLabelText(new RegExp(th.brandReport.urlLabel)),
      "http://10.0.0.1/",
    );
    const alert = alertWith(canvasElement, th.brandReport.engine["read.refused.address"]);
    await expect(alert).toHaveAttribute("data-variant", "warning");
    await expectNoSections(canvasElement);
    await expect(canvas.getByLabelText(new RegExp(th.brandReport.urlLabel))).toHaveValue(
      "http://10.0.0.1/",
    );
  },
};

/** robots.txt asks not to be read: a warning with the line, no sections (row 23). */
export const RefusedRobots: Story = {
  args: { view: refused("read.refused.robots") },
  play: async ({ canvasElement }) => {
    const alert = alertWith(canvasElement, th.brandReport.engine["read.refused.robots"]);
    await expect(alert).toHaveAttribute("data-variant", "warning");
    await expectNoSections(canvasElement);
  },
};

/** The page took too long: a danger alert with the line, no sections, the address stays (row 24). */
export const FailedTimeout: Story = {
  args: { view: refused("read.failed.timeout") },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByLabelText(new RegExp(th.brandReport.urlLabel)),
      "slow.example",
    );
    const alert = alertWith(canvasElement, th.brandReport.engine["read.failed.timeout"]);
    await expect(alert).toHaveAttribute("data-variant", "danger");
    await expectNoSections(canvasElement);
    await expect(canvas.getByLabelText(new RegExp(th.brandReport.urlLabel))).toHaveValue(
      "slow.example",
    );
  },
};

/** One screen for each of the other three failed reads: a danger alert each, no sections (row 25). */
export const FailedOther: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {(["read.failed.network", "read.failed.redirects", "read.failed.notHtml"] as const).map(
        (line) => (
          <div key={line} data-case={line}>
            <BrandReportScreen access="form" view={refused(line)} />
          </div>
        ),
      )}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const line of [
      "read.failed.network",
      "read.failed.redirects",
      "read.failed.notHtml",
    ] as const) {
      const one = canvasElement.querySelector<HTMLElement>(`[data-case="${line}"]`) as HTMLElement;
      const alert = alertWith(one, th.brandReport.engine[line]);
      await expect(alert).toHaveAttribute("data-variant", "danger");
      await expect(one.querySelector("[data-report]")).toBeNull();
      await expect(within(one).queryAllByRole("heading", { level: 2 })).toHaveLength(0);
    }
  },
};

/** A competitor's page: the address as text and the line, no sections (row 30). */
export const NotRead: Story = {
  args: {
    view: {
      status: "not-read",
      url: "https://rival.example/shop",
      line: "read.notRead.competitor",
    },
  },
  play: async ({ canvasElement }) => {
    const text = textOf(canvasElement);
    await expect(text).toContain("ที่อยู่: https://rival.example/shop");
    await expect(text).toContain(th.brandReport.engine["read.notRead.competitor"]);
    await expectNoSections(canvasElement);
  },
};

// ----- limits and failures the caller resolves (rows 28, 29) -----

/** The hourly window is used up: the caller's line says when to try again (row 28). */
export const RateLimited: Story = {
  args: {
    failure: "Too many requests in a short time, so this was not done. Try again in 20 minutes.",
  },
  play: async ({ canvasElement }) => {
    const alert = within(canvasElement).getByRole("alert", { name: "" });
    await expect(alert).toHaveTextContent("Try again in 20 minutes.");
    await expect(alertWith(canvasElement, "Try again in 20 minutes.")).toHaveAttribute(
      "data-variant",
      "danger",
    );
  },
};

function UnavailableScreen() {
  const m = useMessages();
  return <BrandReportScreen access="form" failure={m.brandReport.unavailable} />;
}

/** The limit store failed: `brandReport.unavailable` (row 29). */
export const Unavailable: Story = {
  render: () => <UnavailableScreen />,
  play: async ({ canvasElement }) => {
    await expect(alertWith(canvasElement, th.brandReport.unavailable)).toHaveAttribute(
      "data-variant",
      "danger",
    );
  },
};

/** The call gave no report or was rejected: `saved.errors.failed`, and the form works again (row 29). */
export const Failed: Story = {
  args: { failure: "That did not work. Try again.", onRead },
  play: async ({ canvasElement }) => {
    onRead.mockClear();
    const canvas = within(canvasElement);
    await expect(alertWith(canvasElement, "That did not work. Try again.")).toHaveAttribute(
      "data-variant",
      "danger",
    );
    await userEvent.type(canvas.getByLabelText(new RegExp(th.brandReport.urlLabel)), "example.com");
    await userEvent.click(canvas.getByRole("radio", { name: th.brandReport.roleOwn }));
    await userEvent.click(canvas.getByRole("button", { name: th.brandReport.submit }));
    await expect(onRead).toHaveBeenCalledTimes(1);
  },
};

// ----- long lists, untrusted text, narrow (rows 31, 32, 34) -----

const hex = (i: number) => `#${(0x100000 + i * 4099).toString(16).toUpperCase().padStart(6, "0")}`;
const MANY_COLOURS = Array.from({ length: 64 }, (_, i) => ({
  hex: hex(i),
  band: "teal" as const,
  at: [{ sheet: 0, offset: i * 10 }],
}));
const MANY_FONTS = Array.from({ length: 16 }, (_, i) => ({
  name: `family-${i}`,
  at: [{ sheet: 0, offset: i * 10 }],
}));
const MANY_LEANS = Array.from({ length: 6 }, (_, i) =>
  reading(
    `ev-many-${i}`,
    i % 2 === 0 ? "high" : "low",
    `Lean number ${i}`,
    `body > p:nth-of-type(${i})`,
  ),
);

/** 300 distinct colours reach the page as the 64 the cap allows and a line for the 236 left out (row 31). */
export const LongLists: Story = {
  args: {
    view: {
      ...ANALYSED,
      colours: MANY_COLOURS,
      coloursTotal: 300,
      fonts: MANY_FONTS,
      fontsTotal: 20,
      personality: personalityOf({ premium: { leans: MANY_LEANS, leansTotal: 9 } }),
    },
  },
  play: async ({ canvasElement }) => {
    const entries = [...canvasElement.querySelectorAll("li")].filter((li) =>
      /^#[0-9A-F]{6},/.test(textOf(li)),
    );
    await expect(entries).toHaveLength(64);
    const text = textOf(canvasElement);
    await expect(text).toContain("ยังมีอีก 236 รายการที่ไม่ได้แสดง");
    await expect(text).toContain("ยังมีอีก 4 รายการที่ไม่ได้แสดง");
    await expect(text).toContain("ยังมีอีก 3 รายการที่ไม่ได้แสดง");
    await expect(text).not.toContain(hex(64));
  },
};

const HOSTILE_QUOTE = "<img src=x onerror=alert(1)>";
const HOSTILE_URL = 'https://evil.example/path"><script>';

/** A quote of markup and a URL ending in a tag: both literal text, no image, no script, no link (row 32). */
export const UntrustedText: Story = {
  args: {
    view: {
      ...ANALYSED,
      url: HOSTILE_URL,
      personality: personalityOf({
        premium: {
          leans: [reading("ev-evil", "high", HOSTILE_QUOTE, "body > <b>p</b>")],
        },
      }),
    },
  },
  play: async ({ canvasElement }) => {
    const text = textOf(canvasElement);
    await expect(text).toContain(HOSTILE_QUOTE);
    await expect(text).toContain(`หน้าที่อ่าน: ${HOSTILE_URL}`);
    await expect(text).toContain("body > <b>p</b>");
    await expect(canvasElement.querySelector("img")).toBeNull();
    await expect(canvasElement.querySelector("script")).toBeNull();
    await expect(canvasElement.querySelector("b")).toBeNull();
    await expect(canvasElement.querySelector("[data-report] a")).toBeNull();
    await expect(canvasElement.querySelectorAll("[data-report] bdi").length).toBeGreaterThan(0);
  },
};

const LONG_URL = `https://long.example/${"a".repeat(2048 - "https://long.example/".length)}`;
const LONG_PATH = `body > ${"div:nth-of-type(1) > ".repeat(24)}p`.slice(0, 500);
const NARROW_VIEW: Analysed = {
  ...ANALYSED,
  url: LONG_URL,
  sheets: [LONG_URL],
  fonts: [{ name: fixtures.longThai, at: [{ sheet: 0, offset: 9 }] }],
  personality: personalityOf({
    premium: {
      leans: [reading("ev-narrow", "high", fixtures.longThai, LONG_PATH)],
      belowFloor: [
        reading("ev-narrow-below", "low", fixtures.longLatin, LONG_PATH, {
          reasons: ["quality.fewWords"],
        }),
      ],
    },
  }),
};

/** At 360 px every line wraps inside the page and nothing scrolls sideways (row 34). */
async function expectFitsAt360(canvasElement: HTMLElement) {
  const frame = canvasElement.querySelector<HTMLElement>("[data-narrow]") as HTMLElement;
  const edge = frame.getBoundingClientRect().right;
  await expect(frame.getBoundingClientRect().width).toBeLessThanOrEqual(360);
  await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
    Math.max(360, window.innerWidth),
  );
  for (const el of frame.querySelectorAll<HTMLElement>("*")) {
    if (el.closest(".sr-only") !== null) continue;
    await expect(el.getBoundingClientRect().right).toBeLessThanOrEqual(edge + 0.5);
  }
}

const narrow = (view: ReportView) => (
  <div data-narrow="" className="w-[360px] max-w-full">
    <BrandReportScreen access="form" view={view} />
  </div>
);

export const NarrowLight: Story = {
  render: () => (
    <Under profile="neutral" mode="light">
      {narrow(NARROW_VIEW)}
    </Under>
  ),
  play: async ({ canvasElement }) => {
    await expectFitsAt360(canvasElement);
    await expect(textOf(canvasElement)).toContain(LONG_URL);
  },
};

export const NarrowDark: Story = {
  render: () => (
    <Under profile="neutral" mode="dark">
      {narrow(NARROW_VIEW)}
    </Under>
  ),
  play: async ({ canvasElement }) => {
    await expectFitsAt360(canvasElement);
  },
};

export const NarrowEnglish: Story = {
  render: () => (
    <LocaleProvider locale="en">
      <Under profile="neutral" mode="light">
        {narrow(NARROW_VIEW)}
      </Under>
    </LocaleProvider>
  ),
  play: async ({ canvasElement }) => {
    await expectFitsAt360(canvasElement);
    await expect(textOf(canvasElement)).toContain(`Page read: ${LONG_URL}`);
  },
};

/** The form and a refused read at 360 px. */
export const NarrowForm: Story = {
  render: () => (
    <Narrow>
      <BrandReportScreen access="form" view={refused("read.failed.redirects")} />
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.firstElementChild as HTMLElement;
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  },
};

// ----- recipes and modes -----

function Cell({ children }: { children: ReactNode }) {
  return <div className="min-w-0">{children}</div>;
}

/** The same report under every profile in both modes, checked by the a11y addon. */
export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <Cell>
        <BrandReportScreen
          access="form"
          view={INCOMPLETE}
          failure="That did not work. Try again."
        />
      </Cell>
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
