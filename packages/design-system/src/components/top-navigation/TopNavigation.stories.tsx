import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { DesignProfileBoundary, useDesignProfile } from "../../boundary/DesignProfileBoundary";
import { contrastRatio } from "../../foundations/contrast";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import {
  cssColorToHex,
  expectFrameCutsNoInk,
  expectLabelInkWhole,
  expectLinesClear,
  expectSameHeight,
  inVitest,
  measureInkCentre,
  resolvedColor,
} from "../../testing/visual-asserts";
import { Button } from "../button/Button";
import { fixtures, navFixtures } from "../fixtures";
import { ArtifactIcon, DirectionIcon, PersonIcon } from "../icons";
import { Logo } from "../logo/Logo";
import { Matrix } from "../matrix";
import { TopNavigation, type TopNavigationProps } from "./TopNavigation";

const meta = {
  title: "Application/Top navigation",
  component: TopNavigation,
  args: { name: navFixtures.th.name },
  parameters: {
    layout: "padded",
    // Matches nothing: it asks the addon to rewrite `:hover`, and the plays force the class (see `forceHover`).
    pseudo: { rootSelector: "body", hover: ["[data-force-hover]"] },
    docs: {
      description: {
        component:
          "The header of a screen (ORV-225): a row with the brand, the section links and the actions, an optional second row, and a skip link that shows when it has focus. The current link is filled and carries a bead, set by the component from the current path. Under 768 px of its own width the links give way to an icon button that opens a drawer with the same links in the same order. The links go nowhere: the routes in these stories are mock, and no route in the app uses this part yet.",
      },
    },
  },
} satisfies Meta<typeof TopNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

type Copy = typeof navFixtures.th | typeof navFixtures.en;
/** A language of the stories: its fixture copy and the name the opener takes from `nav.open`. */
interface Setup {
  copy: Copy;
  open: string;
}
const TH: Setup = { copy: navFixtures.th, open: "เปิดเมนูหลัก" };
const EN: Setup = { copy: navFixtures.en, open: "Open Main menu" };

const inEnglish: NonNullable<Story["decorators"]> = [
  (Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>,
];

const body = () => within(document.body);

/** The presses the story's link component recorded, in order; each play clears it first. */
const presses: string[] = [];

/** A router's link in a story: it records the press and goes nowhere, so no click leaves the page. */
function PressLink({ href, onClick, ...rest }: ComponentPropsWithoutRef<"a"> & { href: string }) {
  return (
    <a
      href={href}
      {...rest}
      onClick={(event) => {
        event.preventDefault();
        presses.push(href);
        onClick?.(event);
      }}
    />
  );
}

/** The fixture items with no badge: only `WithBadge` and `WithIcons` show one. */
const plain = (copy: Copy) => copy.items.map(({ label, href }) => ({ label, href }));

type NavProps = Partial<Omit<TopNavigationProps, "subItems" | "subName">> & {
  /** Adds the second row of the fixtures. */
  sub?: boolean;
};

/** Top navigation with the logo, the actions and the press-recording link component. */
function Nav({ setup, sub = false, ...props }: { setup: Setup } & NavProps) {
  const { copy } = setup;
  const rows = sub ? { subItems: copy.subItems, subName: copy.subName } : {};
  return (
    <TopNavigation
      name={copy.name}
      brand={<Logo />}
      items={plain(copy)}
      actions={
        <Button size="sm" variant="secondary">
          {copy.action}
        </Button>
      }
      linkComponent={PressLink}
      {...rows}
      {...props}
    />
  );
}

// Literal class names, so Tailwind's scanner sees every width. A frame is an `article`: a `header`
// inside one is no banner, so a story with two frames keeps the page's one banner rule (axe
// `landmark-no-duplicate-banner`) while each header still holds its own named `nav`.
const wide = (children: ReactNode) => (
  <article data-testid="frame" className="w-[1280px]">
    {children}
  </article>
);
const narrow = (children: ReactNode) => (
  <article data-testid="frame" className="w-[360px] max-w-full">
    {children}
  </article>
);

/** A CSS length token as the browser resolves it at `el`, in px. */
function tokenPx(el: Element, token: string): number {
  const probe = document.createElement("span");
  probe.style.cssText = `position:absolute;visibility:hidden;width:var(${token})`;
  el.append(probe);
  const px = probe.getBoundingClientRect().width;
  probe.remove();
  return px;
}

const near = (a: number, b: number, why: string) =>
  expect(Math.abs(a - b), `${why}: ${a} against ${b}`).toBeLessThanOrEqual(0.5);

const rect = (el: Element) => el.getBoundingClientRect();
const part = (scope: ParentNode, name: string) =>
  scope.querySelector<HTMLElement>(`.ds-top-nav__${name}`) as HTMLElement;
const linkNamed = (scope: HTMLElement, label: string) =>
  within(scope).getByRole("link", { name: (name) => name.startsWith(label) });
const currentOf = (scope: ParentNode) =>
  Array.from(scope.querySelectorAll<HTMLElement>("[aria-current]"));
const labelOf = (link: HTMLElement) => link.querySelector<HTMLElement>(".ds-nav-item__label");

/** `forceHover` and `startFromTop` follow `Breadcrumb.stories.tsx`: a synthetic pointer sets no `:hover`. */
const forceHover = (el: Element) => el.classList.add("pseudo-hover");
function startFromTop() {
  (document.activeElement as HTMLElement | null)?.blur();
}

/** Each link is as tall as the item height of `nav-size-1` (`size.control.sm`). */
function expectItemHeight(links: readonly HTMLElement[]) {
  for (const link of links) {
    near(rect(link).height, tokenPx(link, "--ds-size-control-sm"), "the item height");
  }
}

/** Row 24: the order of the row, the actions outside the nav at the end, no opener. */
async function expectOneRow(canvasElement: HTMLElement, { copy, open }: Setup) {
  const canvas = within(canvasElement);
  const nav = canvas.getByRole("navigation", { name: copy.name });
  await expect(canvas.getAllByRole("navigation")).toHaveLength(1);
  const logo = within(nav).getByRole("img");
  const links = within(nav).getAllByRole("link");
  await expect(links.map((link) => link.textContent)).toEqual(copy.items.map((i) => i.label));
  const actions = part(canvasElement, "actions");
  await expect(nav.contains(actions)).toBe(false);
  await expect(
    nav.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  const row = rect(part(canvasElement, "row"));
  near(rect(actions).right, row.right, "the actions' end edge against the row's");
  // Logo, the three links and the actions: in order along one row, on one line.
  const flow = [logo, ...links, actions];
  flow.forEach((el, i) => {
    if (i > 0) {
      expect(rect(el).left, `${i} starts after the one before`).toBeGreaterThanOrEqual(
        rect(flow[i - 1] as Element).right - 0.5,
      );
    }
    near((rect(el).top + rect(el).bottom) / 2, (row.top + row.bottom) / 2, "the row's middle");
  });
  expectItemHeight(links);
  await expect(canvas.queryByRole("button", { name: open })).toBeNull();
  await expect(getComputedStyle(part(canvasElement, "opener")).display).toBe("none");
  await expect(rect(canvasElement.querySelector(".ds-top-nav") as HTMLElement).width).toBe(1280);
}

export const Default: Story = {
  render: () => wide(<Nav setup={TH} />),
  play: ({ canvasElement }) => expectOneRow(canvasElement, TH),
};

export const DefaultEn: Story = {
  decorators: inEnglish,
  render: () => wide(<Nav setup={EN} />),
  play: async ({ canvasElement }) => {
    await expectOneRow(canvasElement, EN);
    // Row 25: the name and the three links of the English copy.
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Main" });
    await expect(
      within(nav)
        .getAllByRole("link")
        .map((a) => a.textContent),
    ).toEqual(["Overview", "Projects", "Members"]);
  },
};

/** The bead has ink: it is the bead token, its box is the bead size, and it holds 3:1 on the fill. */
async function expectBead(link: HTMLElement) {
  const bead = link.querySelector<HTMLElement>(".ds-nav-item__bead") as HTMLElement;
  await expect(bead).not.toBeNull();
  const fill = getComputedStyle(link).backgroundColor;
  const ink = getComputedStyle(bead).backgroundColor;
  await expect(ink).toBe(resolvedColor(bead, "--cmp-nav-item-bead"));
  await expect(ink).not.toBe(fill);
  const [inkHex, fillHex] = [cssColorToHex(ink), cssColorToHex(fill)];
  await expect(inkHex, "the bead is opaque").not.toBeNull();
  await expect(fillHex, "the fill is opaque").not.toBeNull();
  await expect(contrastRatio(inkHex as string, fillHex as string) ?? 0).toBeGreaterThanOrEqual(3);
  // A cell may draw the row scaled: boxes and `tokenPx` read in screen px, a computed length in layout px.
  const k = rect(link).width / link.offsetWidth;
  const size = tokenPx(bead, "--cmp-nav-item-bead-size");
  near(rect(bead).width, size, "the bead's width");
  near(rect(bead).height, size, "the bead's height");
  // Inside the padding, off the content, on the middle of the row.
  const box = rect(link);
  // The label box pads its inline sides for Thai overhang and pulls them back with a margin: its
  // text starts one padding in from the box.
  const label = labelOf(link) as HTMLElement;
  const textStart = rect(label).left + parseFloat(getComputedStyle(label).paddingInlineStart) * k;
  await expect(rect(bead).left).toBeGreaterThanOrEqual(box.left - 0.5);
  near(
    textStart - rect(bead).right,
    tokenPx(bead, "--ds-space-inline-sm"),
    "the gap from the bead to the label",
  );
  near(
    (rect(bead).top + rect(bead).bottom) / 2,
    (box.top + box.bottom) / 2,
    "the bead against the row's middle",
  );
}

/** Row 26 (and the marks of row 27): the one marked link, its fill and bead, the others at rest. */
async function expectMarked(canvasElement: HTMLElement, label: string, mark: "page" | "true") {
  const nav = within(canvasElement).getByRole("navigation");
  const marked = currentOf(nav);
  await expect(marked).toHaveLength(1);
  const link = linkNamed(nav, label);
  await expect(marked[0]).toBe(link);
  await expect(link).toHaveAttribute("aria-current", mark);
  await expect(getComputedStyle(link).backgroundColor).toBe(
    resolvedColor(link, "--cmp-nav-item-bg-active"),
  );
  await expect(getComputedStyle(link).color).toBe(resolvedColor(link, "--cmp-nav-item-fg-active"));
  await expectBead(link);
  const rest = within(nav)
    .getAllByRole("link")
    .filter((a) => a !== link);
  await expect(rest).toHaveLength(2);
  const restInk = resolvedColor(link, "--cmp-nav-item-fg");
  for (const other of rest) {
    await expect(other).not.toHaveAttribute("aria-current");
    await expect(getComputedStyle(other).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await expect(getComputedStyle(other).color).toBe(restInk);
    await expect(other.querySelector(".ds-nav-item__bead")).toBeNull();
    // The bead sits in the padding: a marked label keeps the start edge its siblings have.
    near(
      rect(labelOf(link) as HTMLElement).left - rect(link).left,
      rect(labelOf(other) as HTMLElement).left - rect(other).left,
      "the label's start edge in a marked row and a resting one",
    );
  }
}

const withCurrent = ({ copy, open }: Setup) =>
  wide(<Nav setup={{ copy, open }} currentPath="/projects" />);

export const WithCurrent: Story = {
  render: () => withCurrent(TH),
  play: ({ canvasElement }) => expectMarked(canvasElement, TH.copy.items[1].label, "page"),
};

export const WithCurrentEn: Story = {
  decorators: inEnglish,
  render: () => withCurrent(EN),
  play: ({ canvasElement }) => expectMarked(canvasElement, EN.copy.items[1].label, "page"),
};

/** Row 27: a path under the link's, then the link's own `current`, give the same `true`. */
const parentCurrent = ({ copy, open }: Setup) => (
  <div className="flex flex-col gap-4">
    {wide(<Nav setup={{ copy, open }} name={`${copy.name} A`} currentPath="/projects/brand" />)}
    {wide(
      <Nav
        setup={{ copy, open }}
        name={`${copy.name} B`}
        currentPath="/elsewhere"
        items={copy.items.map(({ label, href }) => ({
          label,
          href,
          current: href === "/projects",
        }))}
      />,
    )}
  </div>
);

async function expectParentCurrent(canvasElement: HTMLElement, { copy }: Setup) {
  for (const suffix of ["A", "B"]) {
    const nav = within(canvasElement).getByRole("navigation", { name: `${copy.name} ${suffix}` });
    const marked = currentOf(nav);
    await expect(marked).toHaveLength(1);
    await expect(marked[0]).toHaveAttribute("aria-current", "true");
    await expect(marked[0]).toHaveTextContent(copy.items[1].label);
    await expect(marked[0]?.querySelector(".ds-nav-item__bead")).not.toBeNull();
  }
}

export const ParentCurrent: Story = {
  render: () => parentCurrent(TH),
  play: ({ canvasElement }) => expectParentCurrent(canvasElement, TH),
};

export const ParentCurrentEn: Story = {
  decorators: inEnglish,
  render: () => parentCurrent(EN),
  play: ({ canvasElement }) => expectParentCurrent(canvasElement, EN),
};

/** Row 28: the pointer takes a resting link to the hover colours, and a marked one keeps its own. */
async function expectHover(canvasElement: HTMLElement, { copy }: Setup) {
  const nav = within(canvasElement).getByRole("navigation");
  const rest = linkNamed(nav, copy.items[2].label);
  const marked = linkNamed(nav, copy.items[1].label);
  await expect(getComputedStyle(rest).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  // The expected colours are read once, outside `waitFor`: `resolvedColor` adds a probe node.
  const [fill, ink] = [
    resolvedColor(rest, "--cmp-nav-item-bg-hover"),
    resolvedColor(rest, "--cmp-nav-item-fg-hover"),
  ];
  const [activeFill, activeInk] = [
    getComputedStyle(marked).backgroundColor,
    getComputedStyle(marked).color,
  ];
  forceHover(rest);
  await waitFor(() => expect(getComputedStyle(rest).backgroundColor).toBe(fill));
  await expect(getComputedStyle(rest).color).toBe(ink);
  forceHover(marked);
  await expect(getComputedStyle(marked).backgroundColor).toBe(activeFill);
  await expect(getComputedStyle(marked).color).toBe(activeInk);
}

export const Hover: Story = {
  render: () => withCurrent(TH),
  play: ({ canvasElement }) => expectHover(canvasElement, TH),
};

export const HoverEn: Story = {
  decorators: inEnglish,
  render: () => withCurrent(EN),
  play: ({ canvasElement }) => expectHover(canvasElement, EN),
};

/** The inset focus form of `nav-focus-1`: a 1 px line in `focus.ring` inside the row, and the halo inside it. */
async function expectInsetFocus(link: HTMLElement) {
  const style = getComputedStyle(link);
  await expect(link.matches(":focus-visible")).toBe(true);
  await expect(style.outlineStyle).toBe("solid");
  await expect(style.outlineWidth).toBe("1px");
  await expect(style.outlineOffset).toBe("-1px");
  await expect(style.outlineColor).toBe(resolvedColor(link, "--ds-focus-ring"));
  await expect(style.boxShadow).toMatch(/0px 0px 0px 4px inset$/);
  // The line is no selection colour: it differs from the current fill.
  await expect(style.outlineColor).not.toBe(resolvedColor(link, "--cmp-nav-item-bg-active"));
}

/** Row 29: Tab reaches an unmarked and then a marked link, both with the focus form; Enter presses the first. */
async function expectFocus(canvasElement: HTMLElement, { copy }: Setup) {
  presses.length = 0;
  const nav = within(canvasElement).getByRole("navigation");
  const [first, second] = [
    linkNamed(nav, copy.items[0].label),
    linkNamed(nav, copy.items[1].label),
  ];
  await expect(first).not.toHaveAttribute("aria-current");
  await expect(second).toHaveAttribute("aria-current", "page");
  startFromTop();
  await userEvent.tab();
  await expect(first).toHaveFocus();
  await expectInsetFocus(first);
  await userEvent.keyboard("{Enter}");
  await expect(presses).toEqual([copy.items[0].href]);
  await userEvent.tab();
  await expect(second).toHaveFocus();
  await expectInsetFocus(second);
  // The marked row keeps its fill under focus.
  await expect(getComputedStyle(second).backgroundColor).toBe(
    resolvedColor(second, "--cmp-nav-item-bg-active"),
  );
}

export const FocusVisible: Story = {
  render: () => withCurrent(TH),
  play: ({ canvasElement }) => expectFocus(canvasElement, TH),
};

export const FocusVisibleEn: Story = {
  decorators: inEnglish,
  render: () => withCurrent(EN),
  play: ({ canvasElement }) => expectFocus(canvasElement, EN),
};

/** The nodes from the label's parent up to the frame clip nothing. */
async function expectAncestorsVisible(el: HTMLElement, frame: HTMLElement) {
  for (let node = el.parentElement; node; node = node === frame ? null : node.parentElement) {
    const style = getComputedStyle(node);
    await expect(style.overflowX, `${node.localName} clips on x`).toBe("visible");
    await expect(style.overflowY, `${node.localName} clips on y`).toBe("visible");
  }
}

const longLabels = ({ copy, open }: Setup) =>
  wide(
    <Nav
      setup={{ copy, open }}
      items={[
        { label: copy.longLabel, href: "/long" },
        { label: copy.marksLabel, href: "/marks" },
        { label: copy.items[0].label, href: "/overview" },
      ]}
    />,
  );

/**
 * Row 30: a long label truncates on one line, a label of stacked marks keeps its marks whole, and
 * no row changes height. The text proof (`frame-ink-1`) runs on the marks label, which fits: the
 * helper forces overflow visible on its first argument, so a cut label would read its own ellipsis
 * as a cut.
 */
async function expectLongLabels(canvasElement: HTMLElement, { copy }: Setup) {
  const nav = within(canvasElement).getByRole("navigation");
  const [long, marks, short] = [
    linkNamed(nav, copy.longLabel),
    linkNamed(nav, copy.marksLabel),
    linkNamed(nav, copy.items[0].label),
  ];
  const longLabel = labelOf(long) as HTMLElement;
  const marksLabel = labelOf(marks) as HTMLElement;
  await expectAncestorsVisible(longLabel, long);
  await expectAncestorsVisible(marksLabel, marks);
  await expect(longLabel.scrollWidth).toBeGreaterThan(longLabel.clientWidth);
  await expect(getComputedStyle(longLabel).textOverflow).toBe("ellipsis");
  await expect(marksLabel.scrollWidth).toBeLessThanOrEqual(marksLabel.clientWidth);
  await expect(long).toHaveTextContent(copy.longLabel);
  expectItemHeight([long, marks, short]);
  expectSameHeight(long, marks, short);
  // A capped item: the link is no wider than the list item's cap and the item leaves no gap.
  const cap = tokenPx(long, "--ds-size-panel-min");
  await expect(rect(long.closest("li") as HTMLElement).width).toBeLessThanOrEqual(cap + 0.5);
  near(rect(long).width, rect(long.closest("li") as HTMLElement).width, "the link in its item");
  if (inVitest) {
    await expectLabelInkWhole(longLabel);
    await expectLabelInkWhole(marksLabel);
    await expectFrameCutsNoInk(marksLabel, marks);
  }
}

export const LongLabels: Story = {
  render: () => longLabels(TH),
  play: ({ canvasElement }) => expectLongLabels(canvasElement, TH),
};

export const LongLabelsEn: Story = {
  decorators: inEnglish,
  render: () => longLabels(EN),
  play: ({ canvasElement }) => expectLongLabels(canvasElement, EN),
};

const icons = [<DirectionIcon key="d" />, <ArtifactIcon key="a" />, <PersonIcon key="p" />];

const withIcons = ({ copy, open }: Setup) =>
  wide(
    <Nav
      setup={{ copy, open }}
      items={copy.items.map((item, i) => ({ ...item, icon: icons[i] }))}
    />,
  );

/** Row 31: one badge in the row, after its label; icons before the labels; the name starts with the label. */
async function expectBadgeAndIcons(canvasElement: HTMLElement, { copy }: Setup, icons: boolean) {
  const nav = within(canvasElement).getByRole("navigation");
  await expect(nav.querySelectorAll(".ds-badge")).toHaveLength(1);
  const projects = linkNamed(nav, copy.items[1].label);
  const badge = projects.querySelector<HTMLElement>(".ds-badge") as HTMLElement;
  await expect(badge).toHaveTextContent("4");
  await expect(rect(badge).left).toBeGreaterThanOrEqual(
    rect(labelOf(projects) as HTMLElement).right - 0.5,
  );
  near(
    (rect(badge).top + rect(badge).bottom) / 2,
    (rect(projects).top + rect(projects).bottom) / 2,
    "the badge against the row's middle",
  );
  for (const other of within(nav)
    .getAllByRole("link")
    .filter((a) => a !== projects)) {
    await expect(other.querySelector(".ds-badge")).toBeNull();
  }
  for (const [i, item] of copy.items.entries()) {
    const link = linkNamed(nav, item.label);
    const icon = link.querySelector<HTMLElement>(".ds-nav-item__icon");
    if (!icons) {
      await expect(icon).toBeNull();
      continue;
    }
    await expect(icon).not.toBeNull();
    const glyph = rect(icon as HTMLElement);
    near(glyph.width, tokenPx(link, "--ds-size-icon-sm"), `icon ${i} width`);
    await expect(glyph.right).toBeLessThanOrEqual(rect(labelOf(link) as HTMLElement).left + 0.5);
    near(
      (glyph.top + glyph.bottom) / 2,
      (rect(link).top + rect(link).bottom) / 2,
      "the icon's middle",
    );
    await expect(icon).toHaveAttribute("aria-hidden", "true");
  }
}

const withBadge = ({ copy, open }: Setup) =>
  wide(<Nav setup={{ copy, open }} items={copy.items} />);

export const WithBadge: Story = {
  render: () => withBadge(TH),
  play: ({ canvasElement }) => expectBadgeAndIcons(canvasElement, TH, false),
};

export const WithBadgeEn: Story = {
  decorators: inEnglish,
  render: () => withBadge(EN),
  play: ({ canvasElement }) => expectBadgeAndIcons(canvasElement, EN, false),
};

export const WithIcons: Story = {
  render: () => withIcons(TH),
  play: ({ canvasElement }) => expectBadgeAndIcons(canvasElement, TH, true),
};

export const WithIconsEn: Story = {
  decorators: inEnglish,
  render: () => withIcons(EN),
  play: ({ canvasElement }) => expectBadgeAndIcons(canvasElement, EN, true),
};

const twoRows = ({ copy, open }: Setup) =>
  wide(<Nav setup={{ copy, open }} sub currentPath="/settings/general" />);

/** Row 32: two named landmarks, one marked link at most in each, the second row 4 under the first. */
async function expectTwoRows(canvasElement: HTMLElement, { copy }: Setup) {
  const canvas = within(canvasElement);
  await expect(canvas.getAllByRole("navigation")).toHaveLength(2);
  const main = canvas.getByRole("navigation", { name: copy.name });
  const sub = canvas.getByRole("navigation", { name: copy.subName });
  await expect(currentOf(main)).toHaveLength(0);
  await expect(currentOf(sub)).toHaveLength(1);
  await expect(
    within(sub)
      .getAllByRole("link")
      .map((a) => a.textContent),
  ).toEqual(copy.subItems.map((i) => i.label));
  const [first, second] = Array.from(
    canvasElement.querySelectorAll<HTMLElement>(".ds-top-nav__row"),
  );
  const link = within(sub).getAllByRole("link")[0] as HTMLElement;
  near(
    rect(link).top - rect(first as HTMLElement).bottom,
    tokenPx(link, "--ds-space-inline-sm"),
    "the second row's distance under the first",
  );
  // The fill starts on the logo's edge.
  near(rect(link).left, rect(within(main).getByRole("img")).left, "the second row's start edge");
  await expect(second).toHaveAttribute("data-row", "sub");
  expectItemHeight(within(sub).getAllByRole("link"));
}

export const TwoRows: Story = {
  render: () => twoRows(TH),
  play: ({ canvasElement }) => expectTwoRows(canvasElement, TH),
};

export const TwoRowsEn: Story = {
  decorators: inEnglish,
  render: () => twoRows(EN),
  play: ({ canvasElement }) => expectTwoRows(canvasElement, EN),
};

const noItems = ({ copy, open }: Setup) => (
  <div className="flex flex-col gap-4">
    <article data-testid="frame-wide" className="w-[1280px]">
      <Nav setup={{ copy, open }} items={[]} />
    </article>
    <article data-testid="frame-narrow" className="w-[360px] max-w-full">
      <Nav setup={{ copy, open }} items={[]} name={`${copy.name} 2`} />
    </article>
  </div>
);

/** Row 33: with no items the row keeps the brand and the actions, and has no list and no opener. */
async function expectNoItems(canvasElement: HTMLElement, { copy }: Setup) {
  const canvas = within(canvasElement);
  for (const id of ["frame-wide", "frame-narrow"]) {
    const frame = canvas.getByTestId(id);
    await expect(within(frame).queryByRole("button", { name: /^(เปิด|Open)/ })).toBeNull();
    await expect(within(frame).queryByRole("list")).toBeNull();
    await expect(within(frame).queryByRole("link")).toBeNull();
    await expect(within(frame).getByRole("img")).toBeVisible();
    await expect(within(frame).getByRole("button", { name: copy.action })).toBeVisible();
    await expect(frame.querySelector(".ds-top-nav__opener")).toBeNull();
    await expect(frame.querySelector(".ds-top-nav__list")).toBeNull();
    const root = frame.querySelector(".ds-top-nav") as HTMLElement;
    await expect(root.scrollWidth).toBe(root.clientWidth);
  }
}

export const NoItems: Story = {
  render: () => noItems(TH),
  play: ({ canvasElement }) => expectNoItems(canvasElement, TH),
};

export const NoItemsEn: Story = {
  decorators: inEnglish,
  render: () => noItems(EN),
  play: ({ canvasElement }) => expectNoItems(canvasElement, EN),
};

const narrowNav = ({ copy, open }: Setup) =>
  narrow(<Nav setup={{ copy, open }} currentPath="/projects" />);

/** Row 34 (W8): logo, the icon button and the actions on one row at 360, the links out of view. */
async function expectNarrow(canvasElement: HTMLElement, { open }: Setup) {
  const canvas = within(canvasElement);
  const opener = canvas.getByRole("button", { name: open });
  const root = canvasElement.querySelector(".ds-top-nav") as HTMLElement;
  await expect(root.scrollWidth).toBe(root.clientWidth);
  await expect(canvas.queryByRole("link")).toBeNull();
  const logo = within(canvasElement).getByRole("img");
  const actions = part(canvasElement, "actions");
  await expect(rect(logo).right).toBeLessThanOrEqual(rect(opener).left + 0.5);
  await expect(rect(opener).right).toBeLessThanOrEqual(rect(actions).left + 0.5);
  near(rect(actions).right, rect(root).right, "the actions' end edge against the row's");
  const row = rect(part(canvasElement, "row"));
  for (const el of [logo, opener, actions]) {
    near((rect(el).top + rect(el).bottom) / 2, (row.top + row.bottom) / 2, "the row's middle");
  }
  await expect(opener.querySelector("svg")).not.toBeNull();
  await expect(opener).toHaveAccessibleName(open);
}

export const Narrow: Story = {
  render: () => narrowNav(TH),
  play: ({ canvasElement }) => expectNarrow(canvasElement, TH),
};

export const NarrowEn: Story = {
  decorators: inEnglish,
  render: () => narrowNav(EN),
  play: ({ canvasElement }) => expectNarrow(canvasElement, EN),
};

/** The drawer's items: the fixture links, then a label of stacked marks and a long label, which wrap. */
const drawerItems = ({ copy }: Setup) => [
  ...copy.items,
  { label: copy.marksLabel, href: "/marks" },
  { label: copy.longLabel, href: "/long" },
];

const drawerNav = (setup: Setup) =>
  narrow(<Nav setup={setup} items={drawerItems(setup)} sub currentPath="/projects" />);

async function openDrawer(canvasElement: HTMLElement, { copy, open }: Setup) {
  const opener = within(canvasElement).getByRole("button", { name: open });
  await userEvent.click(opener);
  const dialog = await body().findByRole("dialog", { name: copy.name });
  await Promise.all(dialog.getAnimations().map((a) => a.finished));
  return { opener, dialog };
}

/** Rows 35 and 36: the drawer holds the same links in the same order, the current one marked; a press closes it. */
async function expectDrawer(canvasElement: HTMLElement, setup: Setup) {
  const { copy } = setup;
  presses.length = 0;
  const { opener, dialog } = await openDrawer(canvasElement, setup);
  const items = drawerItems(setup);
  const scope = within(dialog);
  await expect(scope.queryByRole("navigation")).toBeNull();
  const lists = scope.getAllByRole("list");
  await expect(lists).toHaveLength(2);
  const links = within(lists[0] as HTMLElement).getAllByRole("link");
  await expect(links.map((a) => labelOf(a)?.textContent)).toEqual(items.map((i) => i.label));
  const marked = currentOf(dialog);
  await expect(marked).toHaveLength(1);
  await expect(marked[0]).toHaveAttribute("aria-current", "page");
  await expect(marked[0]).toHaveTextContent(copy.items[1].label);
  await expect(getComputedStyle(marked[0] as HTMLElement).backgroundColor).toBe(
    resolvedColor(marked[0] as HTMLElement, "--cmp-nav-item-bg-active"),
  );
  await expectBead(marked[0] as HTMLElement);
  // The second row is a second list after the first, named by its title.
  await expect(scope.getByRole("list", { name: copy.subName })).toBe(lists[1]);
  await expect(
    within(lists[1] as HTMLElement)
      .getAllByRole("link")
      .map((a) => a.textContent),
  ).toEqual(copy.subItems.map((i) => i.label));
  // The drawer height of `nav-size-1`: the touch size, and the one-line items are exactly it.
  const touch = tokenPx(dialog, "--ds-size-touch");
  for (const link of links) await expect(rect(link).height).toBeGreaterThanOrEqual(touch - 0.5);
  for (const link of links.slice(0, 3)) near(rect(link).height, touch, "a one-line drawer item");
  const wrapping = links[links.length - 1] as HTMLElement;
  if (inVitest) {
    // The text proof for a drawer label (`frame-ink-1`): wrapped lines clear, and the frame cuts no ink.
    await expectLinesClear(labelOf(wrapping) as HTMLElement);
    const marks = links[3] as HTMLElement;
    await expectFrameCutsNoInk(labelOf(marks) as HTMLElement, marks);
  }
  // Row 36: a press on a link closes the drawer; Esc closes it and returns focus to the opener.
  await userEvent.click(linkNamed(dialog, copy.items[2].label));
  await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  await expect(presses).toEqual([copy.items[2].href]);
  await userEvent.click(opener);
  await body().findByRole("dialog", { name: copy.name });
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(opener));
}

export const DrawerOpen: Story = {
  render: () => drawerNav(TH),
  play: ({ canvasElement }) => expectDrawer(canvasElement, TH),
};

export const DrawerOpenEn: Story = {
  decorators: inEnglish,
  render: () => drawerNav(EN),
  play: ({ canvasElement }) => expectDrawer(canvasElement, EN),
};

const skipNav = ({ copy, open }: Setup) =>
  wide(
    <>
      <Nav setup={{ copy, open }} skipHref="#main" skipLabel={copy.skip} />
      <main id="main" tabIndex={-1} className="p-4">
        {fixtures.mixed}
      </main>
    </>,
  );

/** Row 38: the skip link is the header's first focusable, hidden until Tab, an opaque bar over the row with nothing showing beside it. That focus lands on the target after Enter is proved by a Playwright probe on the built story, not here: a real hash change reloads the test page. */
async function expectSkipLink(canvasElement: HTMLElement, { copy }: Setup) {
  const header = canvasElement.querySelector("header") as HTMLElement;
  const skip = within(header).getByRole("link", { name: copy.skip, hidden: true });
  await expect(header.querySelector("a, button, [tabindex]")).toBe(skip);
  await expect(rect(skip).width).toBeLessThanOrEqual(1);
  startFromTop();
  await userEvent.tab();
  await expect(skip).toHaveFocus();
  const [bar, box] = [rect(skip), rect(header)];
  near(bar.left, box.left, "the bar's start edge");
  near(bar.right, box.right, "the bar's end edge");
  near(bar.top, box.top, "the bar's top edge");
  near(bar.bottom, box.bottom, "the bar's bottom edge");
  const fill = getComputedStyle(skip).backgroundColor;
  await expect(fill).toBe(resolvedColor(skip, "--ds-surface-card"));
  await expect(cssColorToHex(fill), "the bar is opaque").not.toBeNull();
  await expect(getComputedStyle(skip).color).toBe(resolvedColor(skip, "--ds-text-primary"));
  await expectInsetFocus(skip);
  const row = part(header, "row");
  await expect(getComputedStyle(row).opacity, "the row paints nothing beside the bar").toBe("0");
  if (inVitest) {
    // Line and halo off for the read, so the first ink is the label's.
    skip.style.outline = "none";
    skip.style.boxShadow = "none";
    try {
      const [label] = await measureInkCentre(header, [skip]);
      await expect(label?.ink.inkTop, "the marks clear the focus line").toBeGreaterThanOrEqual(2);
    } finally {
      skip.style.outline = "";
      skip.style.boxShadow = "";
    }
  }
  // The link points at a target that can take focus; the move itself is the probe's.
  const target = canvasElement.querySelector<HTMLElement>(skip.getAttribute("href") ?? "");
  await expect(target).toHaveAttribute("id", "main");
  await expect(target?.tabIndex).toBe(-1);
  await userEvent.tab();
  await expect(skip).not.toHaveFocus();
  await expect(row.contains(document.activeElement), "the next Tab lands in the row").toBe(true);
  await expect(getComputedStyle(row).opacity, "the row is back").toBe("1");
}

export const SkipLink: Story = {
  render: () => skipNav(TH),
  play: ({ canvasElement }) => expectSkipLink(canvasElement, TH),
};

export const SkipLinkEn: Story = {
  decorators: inEnglish,
  render: () => skipNav(EN),
  play: ({ canvasElement }) => expectSkipLink(canvasElement, EN),
};

/** One nav per cell, named after its cell so the six landmarks stay distinguishable. */
function Cell() {
  const scope = useDesignProfile();
  const { copy } = TH;
  // The wide form needs a container of 768 or more, and a cell is narrower: lay it out at 768 and
  // draw it at three quarters, so the cell shows the links, the fill and the bead.
  return (
    <div className="w-full">
      <div style={{ inlineSize: 768, transform: "scale(0.75)", transformOrigin: "top left" }}>
        <Nav
          setup={TH}
          name={`${copy.name} ${String(scope?.profile)} ${scope?.mode}`}
          currentPath="/projects"
        />
      </div>
    </div>
  );
}

/** Row 40: in all six boundaries the current link keeps a fill and a bead that hold 3:1 on it. */
export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <Cell />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll<HTMLElement>("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    for (const cell of cells) {
      const marked = currentOf(cell);
      await expect(marked).toHaveLength(1);
      const link = marked[0] as HTMLElement;
      await expect(link).toBeVisible();
      await expect(getComputedStyle(link).backgroundColor).toBe(
        resolvedColor(link, "--cmp-nav-item-bg-active"),
      );
      await expect(cssColorToHex(getComputedStyle(link).backgroundColor)).not.toBeNull();
      await expectBead(link);
    }
  },
};

/** Row 37: the drawer opens inside the friendly boundary and keeps its profile. */
export const InsideProfile: Story = {
  render: () => (
    <DesignProfileBoundary profile="friendly" mode="dark">
      <div className="w-[360px] max-w-full rounded-container bg-surface-canvas p-4 font-body text-text-primary">
        <Nav setup={TH} currentPath="/projects" />
      </div>
    </DesignProfileBoundary>
  ),
  play: async ({ canvasElement }) => {
    const { opener, dialog } = await openDrawer(canvasElement, TH);
    const scope = dialog.closest<HTMLElement>("[data-design-profile]");
    await expect(scope?.dataset["designProfile"]).toBe("friendly");
    const read = (el: Element) =>
      getComputedStyle(el).getPropertyValue("--ds-surface-raised").trim();
    await expect(read(dialog)).toBe(read(opener));
  },
};
