import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import {
  expectEdgeInk,
  expectFrameCutsNoInk,
  expectLinesClear,
  expectSameHeight,
  expectTitleOverText,
  inVitest,
  resolvedColor,
} from "../../testing/visual-asserts";
import { Button } from "../button/Button";
import { pageHeaderFixtures, sectionHeaderFixtures } from "../fixtures";
import { Matrix } from "../matrix";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs/Tabs";
import { SectionHeader, type SectionHeaderProps } from "./SectionHeader";

const meta = {
  title: "Application/Section header",
  component: SectionHeader,
  args: { title: sectionHeaderFixtures.th.title },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The title of one block of a screen (ORV-251): a heading, one line of description, the block's actions and, when asked, a line under it. The root is a div, so the caller decides which region the block belongs to, and the level (2 to 6) sets the element and never the size. Tabs passed as children follow the title row, and the line under the block is not drawn then, because Tabs draws its own. Under 480 px the actions stack under the title on the same start edge, and from 480 they do the same when they would leave the title less than 240 px. The words in these stories are mock.",
      },
    },
  },
} satisfies Meta<typeof SectionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

type Copy = (typeof sectionHeaderFixtures)[keyof typeof sectionHeaderFixtures];
type ActionCopy = (typeof pageHeaderFixtures)[keyof typeof pageHeaderFixtures];
const { th, en } = sectionHeaderFixtures;
/** The action labels `docs/specs/ORV-225/design.md` measured, by language. */
const actionsOf = { th: pageHeaderFixtures.th, en: pageHeaderFixtures.en } as const;

/** A header with a title and a description, in the language of `copy`. */
function Sample({ copy, ...props }: { copy: Copy } & Partial<SectionHeaderProps>) {
  return <SectionHeader title={copy.title} description={copy.description} {...props} />;
}

const inEnglish: NonNullable<Story["decorators"]> = [
  (Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>,
];

const rootsOf = (scope: Element) =>
  Array.from(scope.querySelectorAll<HTMLElement>(".ds-section-header"));
const part = (root: HTMLElement, name: string) =>
  root.querySelector<HTMLElement>(`.ds-section-header__${name}`) as HTMLElement;

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

const lastChildOf = (el: HTMLElement) => el.lastElementChild as HTMLElement;

/** Row 13: one level 2 heading with the description 8 px under it, in the header type form. */
async function expectOpening(canvasElement: HTMLElement, copy: Copy) {
  const canvas = within(canvasElement);
  const headings = canvas.getAllByRole("heading", { level: 2 });
  await expect(headings).toHaveLength(1);
  const title = canvas.getByRole("heading", { level: 2, name: copy.title });
  const description = canvas.getByText(copy.description);
  await expect(description).toBeVisible();
  expectTitleOverText(title, description, { gap: 8, header: true });
  const root = title.closest<HTMLElement>(".ds-section-header") as HTMLElement;
  await expect(root.localName).toBe("div");
  await expect(canvasElement.querySelector("header")).toBeNull();
  await expect(root.hasAttribute("data-divider")).toBe(false);
  await expect(getComputedStyle(root).borderBottomWidth).toBe("0px");
}

/** A title with a description under it: the header form of title over text. */
export const Default: Story = {
  render: () => <Sample copy={th} />,
  play: ({ canvasElement }) => expectOpening(canvasElement, th),
};

export const DefaultEn: Story = {
  decorators: inEnglish,
  render: () => <Sample copy={en} />,
  play: ({ canvasElement }) => expectOpening(canvasElement, en),
};

/** Row 14: the title alone, no node for the description, the actions or the row's second child. */
async function expectTitleOnly(canvasElement: HTMLElement, copy: Copy) {
  const canvas = within(canvasElement);
  await expect(canvas.getByRole("heading", { level: 2, name: copy.title })).toBeVisible();
  const root = rootsOf(canvasElement)[0] as HTMLElement;
  await expect(part(root, "text").children).toHaveLength(1);
  await expect(root.querySelector("p")).toBeNull();
  await expect(root.querySelector(".ds-section-header__description")).toBeNull();
  await expect(root.querySelector(".ds-section-header__actions")).toBeNull();
  await expect(part(root, "row").children).toHaveLength(1);
}

export const TitleOnly: Story = {
  render: () => <SectionHeader title={th.title} />,
  play: ({ canvasElement }) => expectTitleOnly(canvasElement, th),
};

export const TitleOnlyEn: Story = {
  decorators: inEnglish,
  render: () => <SectionHeader title={en.title} />,
  play: ({ canvasElement }) => expectTitleOnly(canvasElement, en),
};

/**
 * Row 15, wide: at 1280 the action sits on the row's end edge and the title on its start edge, the
 * action on the bottom edge of the title block.
 */
async function expectActionsAtEnd(canvasElement: HTMLElement, copy: Copy) {
  const root = rootsOf(canvasElement)[0] as HTMLElement;
  const box = root.getBoundingClientRect();
  await expect(box.width).toBe(1280);
  const button = within(root).getByRole("button", { name: copy.action }).getBoundingClientRect();
  const title = part(root, "title").getBoundingClientRect();
  near(button.right, box.right, "the action's end edge against the header's");
  near(title.left, box.left, "the title's start edge against the header's");
  near(
    button.bottom,
    part(root, "text").getBoundingClientRect().bottom,
    "the action's bottom edge against the title block's",
  );
  await expect(root.scrollWidth).toBe(root.clientWidth);
}

const wide = (copy: Copy) => (
  <div className="w-[1280px]">
    <Sample copy={copy} actions={<Button variant="primary">{copy.action}</Button>} />
  </div>
);

export const WithActions: Story = {
  render: () => wide(th),
  play: ({ canvasElement }) => expectActionsAtEnd(canvasElement, th),
};

export const WithActionsEn: Story = {
  decorators: inEnglish,
  render: () => wide(en),
  play: ({ canvasElement }) => expectActionsAtEnd(canvasElement, en),
};

/** Row 15, narrow: at 360 the action sits under the title block on the same start edge. */
async function expectStacked(canvasElement: HTMLElement, copy: Copy) {
  const frame = within(canvasElement).getByTestId("frame");
  const root = rootsOf(frame)[0] as HTMLElement;
  await expect(frame.getBoundingClientRect().width).toBeLessThanOrEqual(360);
  const button = within(root).getByRole("button", { name: copy.action }).getBoundingClientRect();
  const title = part(root, "title").getBoundingClientRect();
  const text = part(root, "text").getBoundingClientRect();
  await expect(button.top, "the action starts under the title block").toBeGreaterThanOrEqual(
    text.bottom - 0.5,
  );
  near(button.left, title.left, "the action's start edge against the title's");
  near(
    button.top - lastChildOf(part(root, "text")).getBoundingClientRect().bottom,
    tokenPx(root, "--ds-space-inset-md"),
    "the gap between the title block's last line and the action",
  );
  await expect(root.scrollWidth).toBe(root.clientWidth);
  await expect(frame.scrollWidth).toBe(frame.clientWidth);
}

const narrow = (copy: Copy) => (
  <div data-testid="frame" className="w-[360px] max-w-full">
    <Sample copy={copy} actions={<Button variant="primary">{copy.action}</Button>} />
  </div>
);

export const Narrow: Story = {
  render: () => narrow(th),
  play: ({ canvasElement }) => expectStacked(canvasElement, th),
};

export const NarrowEn: Story = {
  decorators: inEnglish,
  render: () => narrow(en),
  play: ({ canvasElement }) => expectStacked(canvasElement, en),
};

/** Row 77: the floor of `header-stack-1` on Section header, `size.panel.min`, read off the token. */
const floorOf = (root: HTMLElement) => tokenPx(root, "--ds-size-panel-min");

/**
 * Row 77, under: the actions sit under the title block, the least start edge is the title's, the
 * gap to the last text line is `space.inset.md`, buttons of one line are as tall as each other,
 * and nothing scrolls sideways.
 */
async function expectActionsUnder(root: HTMLElement, copy: Copy) {
  const text = part(root, "text").getBoundingClientRect();
  const box = root.getBoundingClientRect();
  const buttons = within(root).getAllByRole("button");
  const rects = buttons.map((b) => b.getBoundingClientRect());
  await expect(text.width, "the title block keeps its floor").toBeGreaterThanOrEqual(
    floorOf(root) - 0.5,
  );
  for (const rect of rects) {
    await expect(rect.top, "every action starts under the title block").toBeGreaterThanOrEqual(
      text.bottom - 0.5,
    );
    await expect(rect.right, "no action passes the header's end edge").toBeLessThanOrEqual(
      box.right + 0.5,
    );
  }
  near(
    Math.min(...rects.map((r) => r.left)),
    part(root, "title").getBoundingClientRect().left,
    "the actions' start edge against the title's",
  );
  near(
    Math.min(...rects.map((r) => r.top)) -
      lastChildOf(part(root, "text")).getBoundingClientRect().bottom,
    tokenPx(root, "--ds-space-inset-md"),
    "the gap between the title block's last line and the actions",
  );
  await expect(root.scrollWidth).toBe(root.clientWidth);
  for (const top of new Set(rects.map((r) => Math.round(r.top)))) {
    const line = buttons.filter((_, i) => Math.round((rects[i] as DOMRect).top) === top);
    expectSameHeight(line[0] as Element, ...line.slice(1));
  }
  await expectTitleInk(root, copy);
}

/**
 * Row 77, beside: the last action sits on the header's end edge, on the title block's bottom edge,
 * the title on the start edge, and the title block keeps its floor.
 */
async function expectActionsBeside(root: HTMLElement, copy: Copy) {
  const box = root.getBoundingClientRect();
  const text = part(root, "text").getBoundingClientRect();
  const rects = within(root)
    .getAllByRole("button")
    .map((b) => b.getBoundingClientRect());
  near(
    Math.max(...rects.map((r) => r.right)),
    box.right,
    "the last action's end edge against the header's",
  );
  for (const rect of rects)
    near(rect.bottom, text.bottom, "the action's bottom edge against the title block's");
  near(part(root, "title").getBoundingClientRect().left, box.left, "the title's start edge");
  await expect(text.width, "the title block keeps its floor").toBeGreaterThanOrEqual(
    floorOf(root) - 0.5,
  );
  await expect(root.scrollWidth).toBe(root.clientWidth);
  await expectTitleInk(root, copy);
}

/**
 * The text proof of `frame-ink-1`, under Vitest: the title's lines clear and the header's frame
 * cuts no ink. The title is the element, and it is never truncated, so the helper's forced
 * `overflow: visible` hides nothing it should report.
 */
async function expectTitleInk(root: HTMLElement, copy: Copy) {
  await expect(within(root).getByRole("heading", { name: copy.title })).toBeVisible();
  if (inVitest) {
    const title = part(root, "title");
    await expectLinesClear(title);
    await expectFrameCutsNoInk(title, root);
  }
}

// Literal class names, so Tailwind's scanner sees every width.
const frameWidth = {
  479: "w-[479px]",
  480: "w-[480px]",
  520: "w-[520px]",
} as const;

interface ManyFrame {
  width: keyof typeof frameWidth;
  actions: (labels: ActionCopy) => string[];
  form: "under" | "beside";
}

/** Row 77: the six frames of design.md "Finding F1", each a header with a description. */
const manyFrames: readonly ManyFrame[] = [
  { width: 480, actions: (c) => [c.action, ...c.moreActions.slice(0, 2)], form: "under" },
  { width: 480, actions: (c) => [c.action, ...c.moreActions], form: "under" },
  { width: 480, actions: (c) => [c.action], form: "beside" },
  { width: 479, actions: (c) => [c.action], form: "under" },
  { width: 480, actions: (c) => [c.action, c.moreActions[0]], form: "under" },
  { width: 520, actions: (c) => [c.action, c.moreActions[0]], form: "beside" },
];

const many = (copy: Copy, labels: ActionCopy) => (
  <div className="flex flex-col gap-8">
    {manyFrames.map((frame, i) => (
      <div key={i} data-testid={`frame-${i + 1}`} className={frameWidth[frame.width]}>
        <Sample
          copy={copy}
          actions={frame.actions(labels).map((label, n) => (
            <Button key={label} variant={n === 0 ? "primary" : "secondary"}>
              {label}
            </Button>
          ))}
        />
      </div>
    ))}
  </div>
);

async function expectManyActions(canvasElement: HTMLElement, copy: Copy, labels: ActionCopy) {
  const canvas = within(canvasElement);
  for (const [i, frame] of manyFrames.entries()) {
    const slot = canvas.getByTestId(`frame-${i + 1}`);
    await expect(slot.getBoundingClientRect().width).toBe(frame.width);
    const root = rootsOf(slot)[0] as HTMLElement;
    await expect(within(root).getAllByRole("button")).toHaveLength(frame.actions(labels).length);
    if (frame.form === "under") await expectActionsUnder(root, copy);
    else await expectActionsBeside(root, copy);
  }
}

/** Row 77: from container 480, two, three and four actions go under the title block, one stays beside it. */
export const ManyActions: Story = {
  render: () => many(th, actionsOf.th),
  play: ({ canvasElement }) => expectManyActions(canvasElement, th, actionsOf.th),
};

export const ManyActionsEn: Story = {
  decorators: inEnglish,
  render: () => many(en, actionsOf.en),
  play: ({ canvasElement }) => expectManyActions(canvasElement, en, actionsOf.en),
};

/**
 * Row 16: a tab row follows the title row in the document, the second tab takes the selection on
 * a press, and the title row keeps its height. The line is not drawn though `divider` is asked
 * for, because Tabs draws its own (`section-header-1`).
 */
async function expectTabs(canvasElement: HTMLElement, copy: Copy) {
  const canvas = within(canvasElement);
  const root = rootsOf(canvasElement)[0] as HTMLElement;
  const row = part(root, "row");
  const list = canvas.getByRole("tablist", { name: copy.tabsLabel });
  await expect(row.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  await expect(row.nextElementSibling?.contains(list)).toBe(true);
  await expect(root.hasAttribute("data-divider")).toBe(false);
  await expect(getComputedStyle(root).borderBottomWidth).toBe("0px");
  const [first, second] = canvas.getAllByRole("tab") as [HTMLElement, HTMLElement];
  await expect(first).toHaveAttribute("aria-selected", "true");
  const height = row.getBoundingClientRect().height;
  await userEvent.click(second);
  await expect(second).toHaveAttribute("aria-selected", "true");
  await expect(first).toHaveAttribute("aria-selected", "false");
  near(row.getBoundingClientRect().height, height, "the title row's height after the press");
}

const withTabs = (copy: Copy) => (
  <Tabs defaultValue="0">
    <Sample copy={copy} divider>
      <TabsList aria-label={copy.tabsLabel}>
        {copy.tabs.map((label, i) => (
          <TabsTrigger key={label} value={String(i)}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Sample>
    {copy.tabs.map((label, i) => (
      <TabsContent key={label} value={String(i)} className="pt-4 text-body-md">
        {label}
      </TabsContent>
    ))}
  </Tabs>
);

export const WithTabs: Story = {
  render: () => withTabs(th),
  play: ({ canvasElement }) => expectTabs(canvasElement, th),
};

export const WithTabsEn: Story = {
  decorators: inEnglish,
  render: () => withTabs(en),
  play: ({ canvasElement }) => expectTabs(canvasElement, en),
};

/**
 * Row 17: the header with `divider` draws one 1 px edge under the block, and the header without
 * it draws none. Both are read from the rendered pixels; the frame is wide, so the pixel column
 * through the middle of the edge misses the description.
 */
async function expectDivider(canvasElement: HTMLElement) {
  const [with_, without] = rootsOf(canvasElement) as [HTMLElement, HTMLElement];
  await expect(with_.hasAttribute("data-divider")).toBe(true);
  await expect(without.hasAttribute("data-divider")).toBe(false);
  if (inVitest) {
    await expectEdgeInk(with_, "bottom", 1);
    await expectEdgeInk(without, "bottom", 0);
  }
}

const dividers = (copy: Copy) => (
  <div className="flex w-[800px] max-w-full flex-col gap-8">
    <Sample copy={copy} divider />
    <Sample copy={copy} />
  </div>
);

export const WithDivider: Story = {
  render: () => dividers(th),
  play: ({ canvasElement }) => expectDivider(canvasElement),
};

export const WithDividerEn: Story = {
  decorators: inEnglish,
  render: () => dividers(en),
  play: ({ canvasElement }) => expectDivider(canvasElement),
};

/**
 * Row 18: at 360 px a long title wraps inside the header. Every node from the title up to the
 * header computes to overflow visible, the lines clear each other, and under Vitest the pixels of
 * the header and its 8 px margin match with and without those ancestors forced visible.
 */
async function expectLongTitle(canvasElement: HTMLElement, copy: Copy) {
  const canvas = within(canvasElement);
  const frame = canvas.getByTestId("frame");
  await expect(frame.scrollWidth).toBeLessThanOrEqual(360);
  const roots = rootsOf(frame);
  await expect(roots).toHaveLength(2);
  for (const root of roots) {
    const title = part(root, "title");
    for (let el = title.parentElement; el; el = el === root ? null : el.parentElement) {
      const style = getComputedStyle(el);
      await expect(style.overflowX, `${el.localName} clips on x`).toBe("visible");
      await expect(style.overflowY, `${el.localName} clips on y`).toBe("visible");
    }
    await expect(root.scrollWidth).toBe(root.clientWidth);
    await expect(title.getBoundingClientRect().right).toBeLessThanOrEqual(
      root.getBoundingClientRect().right,
    );
  }
  const long = part(roots[0] as HTMLElement, "title");
  // A title that wraps is taller than its one line.
  await expect(long.getBoundingClientRect().height).toBeGreaterThan(
    parseFloat(getComputedStyle(long).lineHeight) + 1,
  );
  await expect(canvas.getByText(copy.longTitle)).toBeVisible();
  if (inVitest) {
    for (const root of roots) {
      const title = part(root, "title");
      await expectLinesClear(title);
      await expectFrameCutsNoInk(title, root);
    }
  }
}

const longTitles = (copy: Copy) => (
  <div data-testid="frame" className="flex w-[360px] max-w-full flex-col gap-8">
    <SectionHeader title={copy.longTitle} description={copy.description} />
    <SectionHeader title={copy.marksTitle} />
  </div>
);

export const LongTitle: Story = {
  render: () => longTitles(th),
  play: ({ canvasElement }) => expectLongTitle(canvasElement, th),
};

export const LongTitleEn: Story = {
  decorators: inEnglish,
  render: () => longTitles(en),
  play: ({ canvasElement }) => expectLongTitle(canvasElement, en),
};

/**
 * Row 19: level 5 with an `id` makes an `h5` the caller's region can name itself by, and the title
 * keeps the size of the level 2 header beside it.
 */
async function expectLevel(canvasElement: HTMLElement, copy: Copy) {
  const canvas = within(canvasElement);
  const heading = canvas.getByRole("heading", { level: 5, name: copy.title });
  await expect(heading.localName).toBe("h5");
  await expect(heading).toHaveAttribute("id", "s1");
  await expect(canvas.getByRole("region", { name: copy.title })).toBeVisible();
  const usual = canvas.getByRole("heading", { level: 2 });
  await expect(getComputedStyle(heading).fontSize).toBe(getComputedStyle(usual).fontSize);
  await expect(getComputedStyle(heading).lineHeight).toBe(getComputedStyle(usual).lineHeight);
}

const levels = (copy: Copy) => (
  <div className="flex flex-col gap-6">
    <section aria-labelledby="s1">
      <Sample copy={copy} level={5} id="s1" />
    </section>
    <SectionHeader title={copy.region} />
  </div>
);

export const HeadingLevel: Story = {
  render: () => levels(th),
  play: ({ canvasElement }) => expectLevel(canvasElement, th),
};

export const HeadingLevelEn: Story = {
  decorators: inEnglish,
  render: () => levels(en),
  play: ({ canvasElement }) => expectLevel(canvasElement, en),
};

/** Row 21: three profiles in both modes, the title and the description in their own inks. */
export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <Sample copy={th} actions={<Button variant="primary">{th.action}</Button>} />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll<HTMLElement>("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    for (const cell of cells) {
      const root = rootsOf(cell)[0] as HTMLElement;
      const title = part(root, "title");
      const description = part(root, "description");
      await expect(title).toBeVisible();
      await expect(getComputedStyle(title).color).toBe(resolvedColor(title, "--ds-text-primary"));
      await expect(getComputedStyle(description).color).toBe(
        resolvedColor(description, "--ds-text-secondary"),
      );
      await expect(getComputedStyle(title).color).not.toBe(getComputedStyle(description).color);
    }
  },
};
