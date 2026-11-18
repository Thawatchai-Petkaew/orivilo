import { BUSINESS_FIELDS, BUSINESS_NODES, type BusinessView } from "@orivilo/intent-engine";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Matrix, Under } from "../components/matrix";
import { LocaleProvider } from "../i18n/LocaleProvider";
import type { Messages } from "../i18n/messages/index";
import { BusinessBoardScreen } from "./business-board";
import {
  ENGLISH_VIEW,
  LONG_NAME,
  LONG_WEBSITE,
  NARROW_VIEW,
  SKIPPED_VIEW,
  THAI_VIEW,
  UNTRUSTED,
  UNTRUSTED_VIEW,
} from "./business-fixtures";
import {
  en,
  expectAccessScreen,
  expectFitsAt360,
  FixtureNote,
  inEnglish,
  textOf,
  th,
} from "./business-story-helpers";
import { nodeTitle, questionText } from "./business-text";

const meta = {
  title: "Examples/Application: Business board",
  component: BusinessBoardScreen,
  args: { access: "ready", view: THAI_VIEW, signInHref: "/account", listHref: "/business" },
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
          "The project board screen, slice 1 (ORV-281): the project name, what the page holds, when it was saved and the five business nodes stacked in fill order, each with its state, its fields with the person's words and how they got there, and the questions still to ask. Every project here is a labelled fixture; nobody gave these answers. Nothing is read by AI in this slice and the screen says nothing of it. The page that renders it owns the one `main`.",
      },
    },
  },
} satisfies Meta<typeof BusinessBoardScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

const nodesOf = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>("[data-node]")];
const fieldOf = (node: HTMLElement, field: string) =>
  node.querySelector<HTMLElement>(`[data-field="${field}"]`) as HTMLElement;
const answersOf = (view: BusinessView) =>
  view.nodes.flatMap((n) => n.fields.flatMap((f) => (f.answer === null ? [] : [f])));

/** The five views in fill order, each field of the engine's table in its node, in order (spec row 14). */
async function expectFiveViews(canvasElement: HTMLElement, m: Messages) {
  const canvas = within(canvasElement);
  const nodes = nodesOf(canvasElement);
  await expect(nodes.map((n) => n.dataset["node"])).toEqual([...BUSINESS_NODES]);
  await expect(canvas.getAllByRole("heading", { level: 2 }).map(textOf)).toEqual(
    BUSINESS_NODES.map((id) => nodeTitle(m, id)),
  );
  for (const node of nodes) {
    const want = BUSINESS_FIELDS.filter((f) => f.node === node.dataset["node"]).map((f) => f.id);
    await expect(
      [...node.querySelectorAll("[data-field]")].map((f) => f.getAttribute("data-field")),
    ).toEqual(want);
  }
  await expect(canvas.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  await expect(canvasElement.querySelector("main")).toBeNull();
}

/** Each answer is a text node in a `bdi` of its field, exactly as typed, with `yourWords` under it (row 14). */
async function expectAnswers(canvasElement: HTMLElement, m: Messages, view: BusinessView) {
  const given = answersOf(view);
  for (const f of given) {
    const el = fieldOf(canvasElement, f.field);
    await expect(el.querySelector("bdi")?.textContent).toBe(f.answer?.text);
    await expect(textOf(el)).toContain(m.business.label.yourWords);
  }
  await expect(within(canvasElement).getAllByText(m.business.label.yourWords)).toHaveLength(
    given.length,
  );
}

// ----- access (row 7) -----

/** No database set up: the heading and the line, no board (spec row 7). */
export const NotConfigured: Story = {
  args: { access: "not-configured", view: undefined },
  play: async ({ canvasElement }) => {
    await expectAccessScreen(canvasElement, th, th.business.list.heading, "not-configured");
  },
};

export const NotConfiguredEnglish: Story = {
  args: { access: "not-configured", view: undefined },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await expectAccessScreen(canvasElement, en, en.business.list.heading, "not-configured");
  },
};

// ----- saved (rows 14, 15, 19) -----

async function savedPlay(
  canvasElement: HTMLElement,
  m: Messages,
  view: BusinessView,
  saved: RegExp,
) {
  const canvas = within(canvasElement);
  // Header: the name as the one h1, the lede, the date in the page's language, the way back.
  await expect(canvas.getByRole("heading", { level: 1, name: view.projectName })).toBeVisible();
  const lede = canvas.getByText(m.business.board.lede);
  await expect(lede).toBeVisible();
  await expect(textOf(canvasElement)).toMatch(saved);
  await expect(canvas.getByRole("link", { name: m.business.list.heading })).toHaveAttribute(
    "href",
    "/business",
  );
  await expectFiveViews(canvasElement, m);
  await expectAnswers(canvasElement, m, view);

  const [situation, core, audience, frame, positioning] = nodesOf(canvasElement) as [
    HTMLElement,
    HTMLElement,
    HTMLElement,
    HTMLElement,
    HTMLElement,
  ];
  // Every node holds the neutral state word, and a full intake leaves every node not confirmed.
  for (const node of nodesOf(canvasElement)) {
    const badge = node.querySelector<HTMLElement>(".ds-badge");
    await expect(badge?.getAttribute("data-variant")).toBe("neutral");
    await expect(textOf(badge as HTMLElement)).toBe(m.business.state.proposed);
  }
  // Row 15: Situation, Competitive frame and Positioning carry their labels, and no address is a link.
  await expect(textOf(fieldOf(situation, "situation.industry"))).toContain(
    m.business.industry.awaitingTaxonomy,
  );
  await expect(textOf(fieldOf(situation, "situation.website"))).toContain(
    m.business.website.notRead,
  );
  await expect(canvasElement.querySelectorAll("a")).toHaveLength(1);
  await expect(textOf(fieldOf(frame, "competitive-frame.alternatives"))).toContain(
    m.business.competitors.coloursNotRead,
  );
  await expect(fieldOf(frame, "competitive-frame.alternatives").lastElementChild?.textContent).toBe(
    m.business.competitors.coloursNotRead,
  );
  await expect(canvas.getAllByText(m.business.state.gate)).toHaveLength(1);
  await expect(textOf(positioning)).toContain(m.business.state.gate);
  await expect(positioning.querySelector(".ds-section-header")?.textContent).toContain(
    m.business.state.gate,
  );
  // A field with nothing yet says so in words, not a blank.
  await expect(textOf(fieldOf(situation, "situation.name"))).toContain(m.business.state.empty);
  await expect(textOf(fieldOf(core, "business-core.why"))).toContain(m.business.state.empty);
  // The category is read by a model only, so no answer can fill it: it says nothing given, never
  // skipped, even though the person answered this node (competitors are given).
  const category = textOf(fieldOf(frame, "competitive-frame.category"));
  await expect(category).toContain(m.business.state.empty);
  await expect(category).not.toContain(m.business.state.skipped);
  // Still to ask: only Business core has an open question, and it is the `why` copy of the spec.
  const asks = canvas.getAllByRole("heading", { level: 3, name: m.business.stillToAsk });
  await expect(asks).toHaveLength(1);
  await expect(core.contains(asks[0] ?? null)).toBe(true);
  await expect([...core.querySelectorAll("ul li")].map(textOf)).toEqual([m.business.question.why]);
  await expect(audience.querySelector("ul")).toBeNull();
  // Notes read in the secondary ink, the person's words in the primary.
  const note = canvas.getAllByText(m.business.label.yourWords)[0] as HTMLElement;
  const words = note.previousElementSibling as HTMLElement;
  await expect(getComputedStyle(note).color).toBe(getComputedStyle(lede).color);
  await expect(getComputedStyle(words).color).not.toBe(getComputedStyle(note).color);
}

/** Fields 24 px apart inside a node and nodes 48 px apart, measured from the rendered boxes (design 5, 6.2). */
async function expectRhythm(canvasElement: HTMLElement) {
  const nodes = nodesOf(canvasElement);
  for (const node of nodes) {
    const fields = [...node.querySelectorAll<HTMLElement>("[data-field]")];
    for (let i = 1; i < fields.length; i++) {
      const gap =
        (fields[i] as HTMLElement).getBoundingClientRect().top -
        (fields[i - 1] as HTMLElement).getBoundingClientRect().bottom;
      await expect(Math.abs(gap - 24)).toBeLessThanOrEqual(0.5);
    }
  }
  for (let i = 1; i < nodes.length; i++) {
    const gap =
      (nodes[i] as HTMLElement).getBoundingClientRect().top -
      (nodes[i - 1] as HTMLElement).getBoundingClientRect().bottom;
    await expect(Math.abs(gap - 48)).toBeLessThanOrEqual(0.5);
  }
}

/** A saved Thai project: the five views, the person's words and their labels (rows 14, 15). */
export const Saved: Story = {
  play: async ({ canvasElement }) => {
    await savedPlay(canvasElement, th, THAI_VIEW, /บันทึกเมื่อ .*2569.*10:15/);
    await expectRhythm(canvasElement);
  },
};

/** The same screen in English with an English project: labels, states and questions change, the answers do not (row 19). */
export const SavedEnglish: Story = {
  args: { view: ENGLISH_VIEW },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await savedPlay(canvasElement, en, ENGLISH_VIEW, /Saved .*Nov 18, 2026.*10:15/);
    await expectRhythm(canvasElement);
  },
};

/** The Thai project read in English: the page's words change, the person's Thai answers stay as typed (row 19). */
export const SavedOtherLanguage: Story = {
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await savedPlay(canvasElement, en, THAI_VIEW, /Saved .*Nov 18, 2026.*10:15/);
    await expect(textOf(canvasElement)).toContain("ร้านกาแฟคั่วเองและขนมอบ");
    await expect(textOf(canvasElement)).not.toContain(th.business.state.proposed);
  },
};

// ----- skipped (row 24) -----

async function skippedPlay(canvasElement: HTMLElement, m: Messages) {
  const canvas = within(canvasElement);
  const [situation, core, audience, frame, positioning] = nodesOf(canvasElement) as [
    HTMLElement,
    HTMLElement,
    HTMLElement,
    HTMLElement,
    HTMLElement,
  ];
  const state = (node: HTMLElement) => textOf(node.querySelector(".ds-badge") as HTMLElement);
  await expect([situation, core, audience, frame, positioning].map(state)).toEqual([
    m.business.state.empty,
    m.business.state.proposed,
    m.business.state.skipped,
    m.business.state.skipped,
    m.business.state.skipped,
  ]);
  // Their fields say skipped, and Positioning keeps its gate line.
  for (const node of [audience, frame, positioning]) {
    for (const field of node.querySelectorAll("[data-field]")) {
      await expect(textOf(field)).toContain(m.business.state.skipped);
    }
  }
  await expect(positioning.querySelector(".ds-section-header")?.textContent).toContain(
    m.business.state.gate,
  );
  // The notes that always hold still hold.
  await expect(textOf(fieldOf(frame, "competitive-frame.alternatives"))).toContain(
    m.business.competitors.coloursNotRead,
  );
  // No industry and no website given: no label for them, and no address.
  await expect(canvas.queryByText(m.business.industry.awaitingTaxonomy)).toBeNull();
  await expect(canvas.queryByText(m.business.website.notRead)).toBeNull();
  // Still to ask, per node, in the order of the engine's questions.
  const asked = (node: HTMLElement) => [...node.querySelectorAll("ul li")].map(textOf);
  await expect(asked(situation)).toEqual([]);
  await expect(asked(core)).toEqual([m.business.question.why]);
  await expect(asked(audience)).toEqual([
    m.business.question.bestCustomer,
    m.business.question.problem,
  ]);
  await expect(asked(frame)).toEqual([m.business.question.instead]);
  await expect(asked(positioning)).toEqual([m.business.question.only]);
  await expect(questionText(m, "positioning.proxy.only")).toBe(m.business.question.only);
}

/** A project that gave only a name and an idea: Audience, Competitive frame and Positioning skipped (row 24). */
export const Skipped: Story = {
  args: { view: SKIPPED_VIEW },
  play: async ({ canvasElement }) => {
    await skippedPlay(canvasElement, th);
  },
};

export const SkippedEnglish: Story = {
  args: { view: SKIPPED_VIEW },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await skippedPlay(canvasElement, en);
  },
};

// ----- untrusted text (row 16) -----

async function untrustedPlay(canvasElement: HTMLElement) {
  const bdis = [...canvasElement.querySelectorAll("bdi")].map((b) => b.textContent);
  // Markup is literal text, each value inside its own bdi.
  await expect(bdis).toContain(UNTRUSTED.idea);
  await expect(bdis).toContain(UNTRUSTED.website);
  await expect(bdis).toContain("<b>Project</b>");
  await expect(bdis).toContain("<a href=https://evil.example>click</a>");
  await expect(textOf(canvasElement)).toContain(UNTRUSTED.idea);
  // No image, script, bold or anchor was made from it, and the website is not a link.
  await expect(canvasElement.querySelector("img")).toBeNull();
  await expect(canvasElement.querySelector("script")).toBeNull();
  await expect(canvasElement.querySelector("b")).toBeNull();
  await expect([...canvasElement.querySelectorAll("a")].map((a) => a.getAttribute("href"))).toEqual(
    ["/business"],
  );
  await expect(canvasElement.querySelector("[data-node] a")).toBeNull();
  await expect(canvasElement.querySelector("h1 b")).toBeNull();
}

/** An idea of `<img ... onerror>`, a website ending in `"><script>`, a name of `<b>` tags: all literal text. */
export const UntrustedText: Story = {
  args: { view: UNTRUSTED_VIEW },
  play: async ({ canvasElement }) => {
    await untrustedPlay(canvasElement);
  },
};

export const UntrustedTextEnglish: Story = {
  args: { view: UNTRUSTED_VIEW },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await untrustedPlay(canvasElement);
  },
};

// ----- narrow (row 20) -----

const narrow = (view: BusinessView) => (
  <div data-narrow="" className="w-[360px] max-w-full">
    <BusinessBoardScreen access="ready" view={view} signInHref="/account" listHref="/business" />
  </div>
);

async function narrowPlay(canvasElement: HTMLElement) {
  await expectFitsAt360(canvasElement);
  // The 2,048-character website and the 120-character Thai name are on the page whole.
  await expect(textOf(canvasElement)).toContain(LONG_WEBSITE);
  await expect(textOf(canvasElement.querySelector("h1") as HTMLElement)).toBe(LONG_NAME);
  await expect(LONG_NAME).toHaveLength(120);
  await expect(LONG_WEBSITE).toHaveLength(2048);
  // One column: every node view starts at the same edge as the header.
  const left = canvasElement.querySelector("h1")?.getBoundingClientRect().left;
  for (const node of nodesOf(canvasElement)) {
    await expect(Math.abs(node.getBoundingClientRect().left - (left ?? 0))).toBeLessThanOrEqual(
      0.5,
    );
  }
}

export const NarrowLight: Story = {
  render: () => (
    <Under profile="neutral" mode="light">
      {narrow(NARROW_VIEW)}
    </Under>
  ),
  play: async ({ canvasElement }) => {
    await narrowPlay(canvasElement);
  },
};

export const NarrowDark: Story = {
  render: () => (
    <Under profile="neutral" mode="dark">
      {narrow(NARROW_VIEW)}
    </Under>
  ),
  play: async ({ canvasElement }) => {
    await narrowPlay(canvasElement);
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
    await narrowPlay(canvasElement);
  },
};

/** The skipped project at 360 px: three skipped nodes still fit one column. */
export const NarrowSkipped: Story = {
  render: () => narrow(SKIPPED_VIEW),
  play: async ({ canvasElement }) => {
    await expectFitsAt360(canvasElement);
    await skippedPlay(canvasElement, th);
  },
};

// ----- recipes and modes -----

/** The same board under every profile in both modes, checked by the a11y addon. */
export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <div className="min-w-0">
        <BusinessBoardScreen
          access="ready"
          view={THAI_VIEW}
          signInHref="/account"
          listHref="/business"
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
