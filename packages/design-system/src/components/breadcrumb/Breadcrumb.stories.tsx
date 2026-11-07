import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentPropsWithoutRef } from "react";
import { useDesignProfile } from "../../boundary/DesignProfileBoundary";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import {
  expectFrameCutsNoInk,
  expectLabelInkWhole,
  expectSameHeight,
  inVitest,
  resolvedColor,
} from "../../testing/visual-asserts";
import { breadcrumbFixtures, fixtures } from "../fixtures";
import { Matrix } from "../matrix";
import { Breadcrumb, BreadcrumbLink, BreadcrumbPage } from "./Breadcrumb";

type Lang = "th" | "en";

const trail = breadcrumbFixtures.trail;

/** The first `count` fixture crumbs in one language: links, then the page last (or links only). */
function Trail({
  lang = "th",
  count = 3,
  maxVisible,
  label,
  page = true,
}: {
  lang?: Lang;
  count?: number;
  maxVisible?: number;
  label?: string;
  page?: boolean;
}) {
  const crumbs = trail.slice(0, count);
  return (
    <Breadcrumb maxVisible={maxVisible} aria-label={label}>
      {crumbs.map((crumb, i) =>
        page && i === crumbs.length - 1 ? (
          <BreadcrumbPage key={crumb.th}>{crumb[lang]}</BreadcrumbPage>
        ) : (
          <BreadcrumbLink key={crumb.th} href={crumb.href}>
            {crumb[lang]}
          </BreadcrumbLink>
        ),
      )}
    </Breadcrumb>
  );
}

const meta = {
  title: "Base/Breadcrumb",
  component: Breadcrumb,
  args: { children: null },
  render: () => <Trail />,
  parameters: {
    layout: "padded",
    // Matches nothing: it asks the addon to rewrite `:hover`, and the plays force the class (see `forceHover`).
    pseudo: { rootSelector: "body", hover: ["[data-force-hover]"] },
    docs: {
      description: {
        component:
          "A trail of places from the project down to the page the person is on (ORV-229): a native nav and an ordered list, links in quiet ink, slashes between them, and the current page in heavier ink, last, not a link and not a Tab stop. Over four crumbs the middle ones hide behind an ellipsis button that opens the trail in place. A long name is cut at the end of its line. No route uses it yet: the trails in these stories are mock.",
      },
    },
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

const NAV_TH = "เส้นทางถึงหน้านี้";
const NAV_EN = "Breadcrumb";
const SHOW_TH = "แสดงเส้นทางทั้งหมด";
const SHOW_EN = "Show the full path";

/**
 * A synthetic pointer sets no `:hover`. `parameters.pseudo` (on the meta) makes the addon rewrite
 * the `:hover` rules to `.pseudo-hover`; a play adds the class itself once it has read the rest
 * state, so one element shows both (spec ORV-84, `hover-force-1`).
 */
const forceHover = (el: Element) => el.classList.add("pseudo-hover");

const itemsOf = (nav: HTMLElement) => Array.from(nav.querySelectorAll<HTMLElement>("li"));
const currentOf = (root: HTMLElement) => root.querySelector<HTMLElement>("[aria-current]");

/** The game of row 4: the nav focus is not on a control, so a Tab starts at the first link. */
function startFromTop() {
  (document.activeElement as HTMLElement | null)?.blur();
}

/**
 * Row 78: the current crumb reads `text.primary`, and differs from `nav-item.fg-active`, which is
 * the selection ink since ORV-252. The expected inks are read once, outside any `waitFor`.
 */
async function expectNeutralInk(current: HTMLElement) {
  const ink = getComputedStyle(current).color;
  await expect(ink).toBe(resolvedColor(current, "--ds-text-primary"));
  await expect(ink).not.toBe(resolvedColor(current, "--cmp-nav-item-fg-active"));
}

/** The focus look of `crumb-look-1`: a 1 px line, a 4 px halo, a small corner; the padding cancelled by the margin. */
async function expectCrumbFocus(link: HTMLElement) {
  const style = getComputedStyle(link);
  await expect(link.matches(":focus-visible")).toBe(true);
  await expect(style.outlineColor).toBe(resolvedColor(link, "--ds-focus-ring"));
  await expect(style.outlineWidth).toBe("1px");
  await expect(style.boxShadow).toMatch(/0px 0px 0px 4px$/);
  await expect(style.borderTopLeftRadius).toBe(
    style.getPropertyValue("--ds-shape-check-radius").trim(),
  );
  await expect(style.paddingInlineStart).toBe("4px");
  await expect(style.marginInlineStart).toBe("-4px");
}

/** "หน้าแรก / โปรเจกต์ทั้งหมด / โปรเจกต์ Brand Canvas ของทีม": two links and the page. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Row 1: one nav, one list, three items, two links, in that order; every line is 32 px.
    const nav = canvas.getByRole("navigation", { name: NAV_TH });
    const list = within(nav).getByRole("list");
    const items = within(list).getAllByRole("listitem");
    await expect(items).toHaveLength(3);
    const links = within(nav).getAllByRole("link");
    await expect(links.map((a) => a.textContent)).toEqual([trail[0].th, trail[1].th]);
    await expect(getComputedStyle(list).minHeight).toBe("32px");
    for (const item of items) await expect(getComputedStyle(item).minHeight).toBe("32px");

    // Row 2: the page is the one current crumb, heavier, and not a link.
    const current = currentOf(canvasElement) as HTMLElement;
    await expect(canvasElement.querySelectorAll("[aria-current]")).toHaveLength(1);
    await expect(current).toHaveAttribute("aria-current", "page");
    await expect(current).toHaveTextContent(trail[2].th);
    await expect(canvas.queryByRole("link", { name: trail[2].th })).toBeNull();
    for (const name of ["role", "tabindex", "aria-disabled"]) {
      await expect(current).not.toHaveAttribute(name);
    }
    await expect(getComputedStyle(current).fontWeight).toBe("500");
    await expect(getComputedStyle(links[0] as HTMLElement).fontWeight).toBe("400");
    await expect(getComputedStyle(current).paddingInlineStart).toBe("4px");
    await expect(getComputedStyle(current).marginInlineStart).toBe("-4px");

    // Row 3: a slash between two crumbs, none after the last, never in a link's name.
    const separators = nav.querySelectorAll(".ds-breadcrumb__separator");
    await expect(separators).toHaveLength(2);
    for (const separator of separators)
      await expect(separator).toHaveAttribute("aria-hidden", "true");
    await expect(canvas.getByRole("link", { name: trail[0].th })).toBe(links[0]);

    // Row 5: a link darkens and gains an underline; the current crumb does not change.
    const home = links[0] as HTMLElement;
    await expect(getComputedStyle(home).textDecorationLine).toBe("none");
    await expect(getComputedStyle(home).color).toBe(resolvedColor(home, "--cmp-nav-item-fg"));
    // The expected ink is read once, outside `waitFor`: `resolvedColor` adds a probe node, which would re-run the callback for ever.
    const hoverInk = resolvedColor(home, "--cmp-nav-item-fg-hover");
    forceHover(home);
    await waitFor(() => expect(getComputedStyle(home).color).toBe(hoverInk));
    await expect(getComputedStyle(home).textDecorationLine).toBe("underline");
    const before = getComputedStyle(current);
    const [color, decoration] = [before.color, before.textDecorationLine];
    // Row 78: the current crumb keeps the neutral ink and takes no selection colour.
    await expectNeutralInk(current);
    forceHover(current);
    await expect(getComputedStyle(current).color).toBe(color);
    await expect(getComputedStyle(current).textDecorationLine).toBe(decoration);

    // Row 4: Tab reaches the two links in order, then leaves the trail.
    startFromTop();
    await userEvent.tab();
    await expect(links[0]).toHaveFocus();
    await expectCrumbFocus(links[0] as HTMLElement);
    await userEvent.tab();
    await expect(links[1]).toHaveFocus();
    await expectCrumbFocus(links[1] as HTMLElement);
    await userEvent.tab();
    await expect(nav.contains(document.activeElement)).toBe(false);
  },
};

/** English: "Home / All projects / The team's Brand Canvas project". */
export const DefaultInEnglish: Story = {
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  render: () => <Trail lang="en" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: NAV_EN });
    const links = within(nav).getAllByRole("link");
    await expect(links).toHaveLength(2);
    await expect(currentOf(canvasElement)).toHaveAttribute("aria-current", "page");
    startFromTop();
    await userEvent.tab();
    const home = canvas.getByRole("link", { name: trail[0].en });
    await expect(home).toHaveFocus();
    await expectCrumbFocus(home);
    forceHover(home);
    await waitFor(() => expect(getComputedStyle(home).textDecorationLine).toBe("underline"));
  },
};

/** Six crumbs at the default `maxVisible`: the first, an ellipsis button, then the last three. */
async function playCollapsed(
  canvasElement: HTMLElement,
  show: string,
  nav: string,
  second: string,
) {
  const canvas = within(canvasElement);
  const navEl = canvas.getByRole("navigation", { name: nav });
  await expect(itemsOf(navEl)).toHaveLength(5);
  await expect(within(navEl).getAllByRole("link")).toHaveLength(3);
  await expect(canvas.queryByRole("link", { name: second })).toBeNull();
  await expect(canvas.queryByRole("link", { name: trail[2].th })).toBeNull();
  await expect(canvas.queryByRole("link", { name: trail[2].en })).toBeNull();
  const button = canvas.getByRole("button", { name: show });
  await expect(getComputedStyle(button).color).toBe(resolvedColor(button, "--cmp-nav-item-fg"));
  await expect(getComputedStyle(button).marginInlineStart).toBe("-8px");
  await expect((button.querySelector("svg") as SVGSVGElement).getBoundingClientRect().width).toBe(
    16,
  );
  expectSameHeight(...(itemsOf(navEl) as [HTMLElement, ...HTMLElement[]]));
  // The expected ink is read once, outside `waitFor`: `resolvedColor` adds a probe node, which would re-run the callback for ever.
  const hoverInk = resolvedColor(button, "--cmp-nav-item-fg-hover");
  forceHover(button);
  await waitFor(() => expect(getComputedStyle(button).color).toBe(hoverInk));
  await userEvent.click(button);
  await expect(itemsOf(navEl)).toHaveLength(6);
  await expect(within(navEl).getAllByRole("link")).toHaveLength(5);
  await expect(canvas.queryByRole("button")).toBeNull();
  await waitFor(() => expect(canvas.getByRole("link", { name: second })).toHaveFocus());
}

/** "หน้าแรก / ... / บอร์ด / บันทึกการตัดสินใจ / ใช้ Orbit violet ...", then a press opens all six. */
export const Collapsed: Story = {
  render: () => <Trail count={6} />,
  play: async ({ canvasElement }) => {
    await playCollapsed(canvasElement, SHOW_TH, NAV_TH, trail[1].th);
  },
};

export const CollapsedInEnglish: Story = {
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  render: () => <Trail lang="en" count={6} />,
  play: async ({ canvasElement }) => {
    await playCollapsed(canvasElement, SHOW_EN, NAV_EN, trail[1].en);
  },
};

/** Tab, Tab, Enter: the keyboard reaches the ellipsis, opens the trail and lands on the first revealed link. */
export const CollapsedKeyboard: Story = {
  render: () => <Trail count={6} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: NAV_TH });
    startFromTop();
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: trail[0].th })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: SHOW_TH })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(itemsOf(nav)).toHaveLength(6);
    await waitFor(() => expect(canvas.getByRole("link", { name: trail[1].th })).toHaveFocus());
  },
};

/** `maxVisible={0}` keeps six crumbs whole; four crumbs at the default are not collapsed. */
export const NoCollapse: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Trail count={6} maxVisible={0} label="เส้นทาง ก" />
      <Trail count={4} label="เส้นทาง ข" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("navigation")).toHaveLength(2);
    await expect(canvas.queryByRole("button")).toBeNull();
    await expect(itemsOf(canvas.getByRole("navigation", { name: "เส้นทาง ก" }))).toHaveLength(6);
    await expect(itemsOf(canvas.getByRole("navigation", { name: "เส้นทาง ข" }))).toHaveLength(4);
  },
};

/** A router's own link: this one marks itself with `data-router`. */
function StoryLink(props: ComponentPropsWithoutRef<"a">) {
  return <a data-router="" {...props} />;
}

/** `BreadcrumbLink asChild` over a story link: one anchor, the crumb's recipe on it. */
export const RouterLink: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbLink asChild href="#home">
        <StoryLink>{trail[0].th}</StoryLink>
      </BreadcrumbLink>
      <BreadcrumbLink asChild href="#projects">
        <StoryLink>{trail[1].th}</StoryLink>
      </BreadcrumbLink>
      <BreadcrumbPage>{trail[2].th}</BreadcrumbPage>
    </Breadcrumb>
  ),
  play: async ({ canvasElement }) => {
    const links = Array.from(canvasElement.querySelectorAll<HTMLAnchorElement>("a[data-router]"));
    await expect(links).toHaveLength(2);
    await expect(links[0]).toHaveClass("ds-breadcrumb__link");
    await expect(links[0]).toHaveAttribute("href", "#home");
    await expect(links[1]).toHaveAttribute("href", "#projects");
    await expect(canvasElement.querySelectorAll("a a")).toHaveLength(0);
  },
};

/** A crumb with no name reads "ไม่มีชื่อ", never a blank; the link keeps its `href`. */
export const Missing: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbLink href="#projects">{fixtures.missing}</BreadcrumbLink>
      <BreadcrumbPage>{fixtures.missing}</BreadcrumbPage>
    </Breadcrumb>
  ),
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", { name: "ไม่มีชื่อ" });
    await expect(link).toHaveAttribute("href", "#projects");
    const current = currentOf(canvasElement) as HTMLElement;
    await expect(current).toHaveTextContent("ไม่มีชื่อ");
    await expect(current).toHaveAttribute("aria-current", "page");
    // Row 11: the current crumb's box clips its text, and the Thai flag of ไ at its start must not be sliced.
    if (inVitest) await expectFrameCutsNoInk(current, current.closest("nav") as HTMLElement);
  },
};

export const MissingInEnglish: Story = {
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  render: Missing.render as NonNullable<Story["render"]>,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("link", { name: "No name" })).toBeVisible();
    await expect(currentOf(canvasElement)).toHaveTextContent("No name");
  },
};

/** The nearest ancestors of `el` up to and including `frame` clip nothing. */
async function expectAncestorsVisible(el: HTMLElement, frame: HTMLElement) {
  for (let node = el.parentElement; node; node = node === frame ? null : node.parentElement) {
    const style = getComputedStyle(node);
    await expect(style.overflowX, `${node.localName} clips on x`).toBe("visible");
    await expect(style.overflowY, `${node.localName} clips on y`).toBe("visible");
  }
}

/** A cut crumb: it is wider than its box, its ink is whole, and nothing up to the frame clips ink. */
async function expectCutCrumb(crumb: HTMLElement, frame: HTMLElement) {
  await expectAncestorsVisible(crumb, frame);
  await expect(crumb.scrollWidth).toBeGreaterThan(crumb.clientWidth);
  if (inVitest) {
    await expectLabelInkWhole(crumb);
    // The helper forces overflow visible on its first argument, which on the crumb would draw the rest of a cut label: pass its item.
    await expectFrameCutsNoInk(crumb.closest("li") as HTMLElement, frame);
  }
}

function At360Frame({
  lang,
  long,
  first,
  second,
}: {
  lang: Lang;
  long: string;
  first: string;
  second: string;
}) {
  return (
    <div data-testid="frame" className="flex w-[360px] max-w-full flex-col gap-4">
      <Breadcrumb aria-label={lang === "th" ? NAV_TH : NAV_EN}>
        <BreadcrumbLink href="#home">{trail[0][lang]}</BreadcrumbLink>
        <BreadcrumbLink href="#long">{long}</BreadcrumbLink>
        <BreadcrumbLink href="#board">{trail[3][lang]}</BreadcrumbLink>
        <BreadcrumbPage>{long}</BreadcrumbPage>
      </Breadcrumb>
      <Breadcrumb aria-label={second}>
        <BreadcrumbLink href="#first">{first}</BreadcrumbLink>
        <BreadcrumbLink href="#last">{long}</BreadcrumbLink>
      </Breadcrumb>
    </div>
  );
}

async function playAt360(
  canvasElement: HTMLElement,
  lang: Lang,
  long: string,
  secondLabel: string,
) {
  const canvas = within(canvasElement);
  const frame = canvas.getByTestId("frame");
  await expect(frame.scrollWidth).toBeLessThanOrEqual(360);
  const navs = [
    canvas.getByRole("navigation", { name: lang === "th" ? NAV_TH : NAV_EN }),
    canvas.getByRole("navigation", { name: secondLabel }),
  ] as const;
  for (const nav of navs) expectSameHeight(...(itemsOf(nav) as [HTMLElement, ...HTMLElement[]]));
  // Every long crumb: the first trail's link and page, and the second trail's last link.
  const longLink = within(navs[0]).getByRole("link", { name: long });
  const page = currentOf(navs[0]) as HTMLElement;
  const lastLink = within(navs[1]).getByRole("link", { name: long });
  await expectCutCrumb(longLink, frame);
  await expectCutCrumb(page, frame);
  await expectCutCrumb(lastLink, frame);
  // The whole name stays in the DOM, so the accessible name is never cut.
  await expect(page).toHaveTextContent(long);
  await expect(getComputedStyle(lastLink).marginInlineEnd).toBe("0px");
  await expect(getComputedStyle(page).marginInlineEnd).toBe("0px");
  return { frame, navs };
}

/** In 360 px, two long Thai crumbs sit on their own lines, cut at the end of the line, no scroll. */
export const At360: Story = {
  render: () => (
    <At360Frame lang="th" long={fixtures.longThai} first="ฟื้ปั้ปี๊กี๊" second="เส้นทาง ก" />
  ),
  play: async ({ canvasElement }) => {
    const { frame, navs } = await playAt360(canvasElement, "th", fixtures.longThai, "เส้นทาง ก");
    // Tab reaches the first link of the second trail, which is not cut, with the focus look.
    const target = within(navs[1]).getAllByRole("link")[0] as HTMLElement;
    startFromTop();
    for (let i = 0; i < 4; i++) await userEvent.tab();
    await expect(target).toHaveFocus();
    await expectCrumbFocus(target);
    // Row 15: the focus corner rounds the box that clips the text, so no Thai mark is cut under focus.
    if (inVitest) await expectFrameCutsNoInk(target, frame);
  },
};

export const At360InEnglish: Story = {
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  render: () => (
    <At360Frame lang="en" long={fixtures.longLatin} first={trail[0].en} second="Trail A" />
  ),
  play: async ({ canvasElement }) => {
    await playAt360(canvasElement, "en", fixtures.longLatin, "Trail A");
  },
};

/** One collapsed trail per cell, named after its cell so the six landmarks stay distinguishable. */
function Cell() {
  const scope = useDesignProfile();
  return <Trail count={6} label={`เส้นทาง ${String(scope?.profile)} ${scope?.mode}`} />;
}

export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <Cell />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const navs = within(canvasElement).getAllByRole("navigation");
    await expect(navs).toHaveLength(6);
    await expect(new Set(navs.map((nav) => nav.getAttribute("aria-label"))).size).toBe(6);
    await expect(canvasElement.querySelectorAll('[aria-current="page"]')).toHaveLength(6);
  },
};

/** One trail per cell: a link and a current crumb reading `ไปให้`, a test string whose marks overhang both ends of its box. */
function InkCell() {
  const scope = useDesignProfile();
  return (
    <Breadcrumb aria-label={`เส้นทาง ${String(scope?.profile)} ${scope?.mode}`}>
      <BreadcrumbLink href={trail[0].href}>{trail[0].th}</BreadcrumbLink>
      <BreadcrumbPage>ไปให้</BreadcrumbPage>
    </Breadcrumb>
  );
}

/** Row 45: in all six boundaries no mark of the current crumb is cut at its start or its end. Row 78: and its ink is the neutral one. */
export const CurrentInk: Story = {
  render: () => (
    <Matrix>
      <InkCell />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const navs = within(canvasElement).getAllByRole("navigation");
    await expect(navs).toHaveLength(6);
    for (const nav of navs) {
      const current = currentOf(nav) as HTMLElement;
      await expectNeutralInk(current);
      await expect(current.scrollWidth).toBeLessThanOrEqual(current.clientWidth);
      if (inVitest) await expectFrameCutsNoInk(current, nav);
    }
  },
};
