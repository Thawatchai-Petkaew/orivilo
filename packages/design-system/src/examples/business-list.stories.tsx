import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Matrix, Under } from "../components/matrix";
import { LocaleProvider } from "../i18n/LocaleProvider";
import type { Messages } from "../i18n/messages/index";
import { expectSameHeight } from "../testing/visual-asserts";
import { LONG_NAME, PROJECTS, UNBROKEN_NAME } from "./business-fixtures";
import { BusinessListScreen } from "./business-list";
import {
  en,
  expectAccessScreen,
  expectFitsAt360,
  FixtureNote,
  inEnglish,
  textOf,
  th,
} from "./business-story-helpers";

const meta = {
  title: "Examples/Application: Business list",
  component: BusinessListScreen,
  args: {
    access: "ready",
    signInHref: "/account",
    newHref: "/business/new",
    projects: PROJECTS,
  },
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
          "The project list screen (ORV-281): the workspace's projects by name, newest first, each a link to its board, and the link to the intake. Every project here is a labelled fixture. It knows no route: the links arrive as props. The page that renders it owns the one `main`.",
      },
    },
  },
} satisfies Meta<typeof BusinessListScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

const cardsOf = (root: HTMLElement) => [
  ...root.querySelectorAll<HTMLElement>("ul > li > a.ds-card"),
];

// ----- access (rows 5, 7) -----

export const SignedOut: Story = {
  args: { access: "signed-out", projects: [] },
  play: async ({ canvasElement }) => {
    await expectAccessScreen(canvasElement, th, th.business.list.heading, "signed-out");
  },
};

export const NotAllowed: Story = {
  args: { access: "not-allowed", projects: [] },
  play: async ({ canvasElement }) => {
    await expectAccessScreen(canvasElement, th, th.business.list.heading, "not-allowed");
  },
};

/** No database set up: the line, no list, no link to the intake (row 7). */
export const NotConfigured: Story = {
  args: { access: "not-configured", projects: [] },
  play: async ({ canvasElement }) => {
    await expectAccessScreen(canvasElement, th, th.business.list.heading, "not-configured");
  },
};

export const NotConfiguredEnglish: Story = {
  args: { access: "not-configured", projects: [] },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await expectAccessScreen(canvasElement, en, en.business.list.heading, "not-configured");
  },
};

// ----- the list (row 17) -----

/**
 * Four projects, newest first: each a link to its board with its name and its date, the header
 * holding the one primary link, one start edge, cards of a row at one height, the long name wrapping whole.
 */
async function listPlay(canvasElement: HTMLElement, m: Messages, saved: RegExp) {
  const canvas = within(canvasElement);
  await expect(
    canvas.getByRole("heading", { level: 1, name: m.business.list.heading }),
  ).toBeVisible();
  const cards = cardsOf(canvasElement);
  await expect(cards.map((c) => c.getAttribute("href"))).toEqual(PROJECTS.map((p) => p.href));
  await expect(cards.map((c) => c.querySelector("bdi")?.textContent)).toEqual(
    PROJECTS.map((p) => p.name),
  );
  // Each card is one link and carries its saved date in the page's language.
  for (const card of cards) await expect(textOf(card)).toMatch(saved);
  await expect(canvasElement.querySelectorAll("li")).toHaveLength(PROJECTS.length);
  // The header's primary link goes to the intake, and it is the only primary action.
  const header = canvasElement.querySelector(".ds-page-header") as HTMLElement;
  await expect(within(header).getByRole("link", { name: m.business.list.new })).toHaveAttribute(
    "href",
    "/business/new",
  );
  await expect(canvasElement.querySelectorAll('.ds-button[data-variant="primary"]')).toHaveLength(
    1,
  );
  await expect(canvasElement.querySelector(".ds-empty-state")).toBeNull();
  // One start edge: the title and the first card begin at the same x; two columns in the wide column.
  const title = canvasElement.querySelector("h1") as HTMLElement;
  const grid = canvasElement.querySelector("ul") as HTMLElement;
  await expect(
    Math.abs(title.getBoundingClientRect().left - grid.getBoundingClientRect().left),
  ).toBeLessThanOrEqual(0.5);
  const [a, b, c, d] = cards as [HTMLElement, HTMLElement, HTMLElement, HTMLElement];
  await expect(
    Math.abs(a.getBoundingClientRect().top - b.getBoundingClientRect().top),
  ).toBeLessThanOrEqual(0.5);
  await expect(a.getBoundingClientRect().right).toBeLessThanOrEqual(b.getBoundingClientRect().left);
  // Cards of a row stretch to one height; the 120-character name is whole inside its card.
  expectSameHeight(a, b);
  expectSameHeight(c, d);
  await expect(textOf(c)).toContain(LONG_NAME);
  await expect(c.scrollWidth).toBeLessThanOrEqual(c.clientWidth);
  await expect(c.scrollHeight).toBeLessThanOrEqual(c.clientHeight);
  await expect(c.getBoundingClientRect().height).toBeGreaterThan(a.getBoundingClientRect().height);
  // A long Latin name with no break wraps inside its card too.
  await expect(textOf(d)).toContain(UNBROKEN_NAME);
  await expect(d.scrollWidth).toBeLessThanOrEqual(d.clientWidth);
}

export const List: Story = {
  play: async ({ canvasElement }) => {
    await listPlay(canvasElement, th, /บันทึกเมื่อ .*256[0-9]/);
  },
};

export const ListEnglish: Story = {
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await listPlay(canvasElement, en, /Saved .*2026/);
  },
};

// ----- empty (row 17) -----

/** No project: the header holds no action, the empty state holds the one primary link. */
async function emptyPlay(canvasElement: HTMLElement, m: Messages) {
  const canvas = within(canvasElement);
  await expect(
    canvas.getByRole("heading", { level: 2, name: m.business.list.empty }),
  ).toBeVisible();
  await expect(canvasElement.querySelector("ul")).toBeNull();
  await expect(canvasElement.querySelectorAll(".ds-page-header__actions")).toHaveLength(0);
  const link = canvas.getByRole("link", { name: m.business.list.new });
  await expect(link).toHaveAttribute("href", "/business/new");
  await expect(canvasElement.querySelector(".ds-empty-state")?.contains(link)).toBe(true);
  await expect(canvasElement.querySelectorAll("a")).toHaveLength(1);
  await expect(canvasElement.querySelectorAll('.ds-button[data-variant="primary"]')).toHaveLength(
    1,
  );
}

export const ListEmpty: Story = {
  args: { projects: [] },
  play: async ({ canvasElement }) => {
    await emptyPlay(canvasElement, th);
    await expect(th.business.list.empty).toBe(
      "ยังไม่มีธุรกิจ เล่าเรื่องธุรกิจหนึ่งเพื่อเริ่มกระดานของคุณ",
    );
  },
};

export const ListEmptyEnglish: Story = {
  args: { projects: [] },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await emptyPlay(canvasElement, en);
  },
};

// ----- narrow (row 20) -----

const narrow = (access: "ready" = "ready") => (
  <div data-narrow="" className="w-[360px] max-w-full">
    <BusinessListScreen
      access={access}
      signInHref="/account"
      newHref="/business/new"
      projects={PROJECTS}
    />
  </div>
);

/** One card per row at 360 px, the long name wrapping inside its card, nothing scrolling sideways. */
async function narrowPlay(canvasElement: HTMLElement) {
  await expectFitsAt360(canvasElement);
  const cards = cardsOf(canvasElement);
  await expect(cards).toHaveLength(PROJECTS.length);
  const [first, ...rest] = cards as [HTMLElement, ...HTMLElement[]];
  for (const card of rest) {
    await expect(
      Math.abs(card.getBoundingClientRect().left - first.getBoundingClientRect().left),
    ).toBeLessThanOrEqual(0.5);
    await expect(
      Math.abs(card.getBoundingClientRect().width - first.getBoundingClientRect().width),
    ).toBeLessThanOrEqual(0.5);
  }
  const grid = canvasElement.querySelector("ul") as HTMLElement;
  await expect(first.getBoundingClientRect().width).toBeGreaterThan(
    grid.getBoundingClientRect().width - 1,
  );
  const latin = cards[3] as HTMLElement;
  await expect(textOf(latin)).toContain(UNBROKEN_NAME);
  await expect(latin.scrollWidth).toBeLessThanOrEqual(latin.clientWidth);
  const long = cards[2] as HTMLElement;
  await expect(textOf(long)).toContain(LONG_NAME);
  await expect(long.scrollWidth).toBeLessThanOrEqual(long.clientWidth);
  await expect(long.scrollHeight).toBeLessThanOrEqual(long.clientHeight);
  // The header's action stacks under the title on the same start edge.
  const title = canvasElement.querySelector("h1") as HTMLElement;
  const action = canvasElement.querySelector(".ds-page-header__actions") as HTMLElement;
  await expect(action.getBoundingClientRect().top).toBeGreaterThanOrEqual(
    title.getBoundingClientRect().bottom - 0.5,
  );
  await expect(
    Math.abs(action.getBoundingClientRect().left - title.getBoundingClientRect().left),
  ).toBeLessThanOrEqual(0.5);
}

export const NarrowLight: Story = {
  render: () => (
    <Under profile="neutral" mode="light">
      {narrow()}
    </Under>
  ),
  play: async ({ canvasElement }) => {
    await narrowPlay(canvasElement);
  },
};

export const NarrowDark: Story = {
  render: () => (
    <Under profile="neutral" mode="dark">
      {narrow()}
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
        {narrow()}
      </Under>
    </LocaleProvider>
  ),
  play: async ({ canvasElement }) => {
    await narrowPlay(canvasElement);
  },
};

// ----- recipes and modes -----

/** The same list under every profile in both modes, checked by the a11y addon. */
export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <div className="min-w-0">
        <BusinessListScreen
          access="ready"
          signInHref="/account"
          newHref="/business/new"
          projects={PROJECTS}
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
