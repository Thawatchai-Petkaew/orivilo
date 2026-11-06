import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import {
  expectFrameCutsNoInk,
  expectLinesClear,
  expectSameHeight,
  inVitest,
  resolvedColor,
} from "../../testing/visual-asserts";
import { Badge } from "../badge/Badge";
import { Button } from "../button/Button";
import { pageHeaderFixtures } from "../fixtures";
import { Matrix } from "../matrix";
import { PageHeader, type PageHeaderProps } from "./PageHeader";

const meta = {
  title: "Application/Page header",
  component: PageHeader,
  args: { title: pageHeaderFixtures.th.title },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The opening of a screen (ORV-225): a title, one line of description, a row of labels and the screen's actions. The root is a div, never a header element, so the part adds no banner landmark wherever it is placed. The level (1 to 6) sets the element and never the size, so a screen that embeds it passes the level after its own headings. Under 480 px the actions stack under the title on the same start edge, and from 480 they do the same when they would leave the title less than nine title sizes. The words in these stories are mock.",
      },
    },
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

type Copy = (typeof pageHeaderFixtures)[keyof typeof pageHeaderFixtures];
const { th, en } = pageHeaderFixtures;

/** A header with every slot filled, in the language of `copy`. */
function Sample({ copy, ...props }: { copy: Copy } & Partial<PageHeaderProps>) {
  return (
    <PageHeader
      title={copy.title}
      description={copy.description}
      actions={<Button variant="primary">{copy.action}</Button>}
      meta={
        <>
          <Badge size="sm">{copy.meta}</Badge>
          {copy.metaNote}
        </>
      }
      {...props}
    />
  );
}

const inEnglish: NonNullable<Story["decorators"]> = [
  (Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>,
];

const rootsOf = (scope: Element) =>
  Array.from(scope.querySelectorAll<HTMLElement>(".ds-page-header"));
const part = (root: HTMLElement, name: string) =>
  root.querySelector<HTMLElement>(`.ds-page-header__${name}`) as HTMLElement;

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

/** Rows 1 and 2: one h1, a div root and no banner, the title in the form of `header-type-1`. */
async function expectOpening(canvasElement: HTMLElement, copy: Copy) {
  const canvas = within(canvasElement);
  const title = canvas.getByRole("heading", { level: 1, name: copy.title });
  await expect(canvas.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  await expect(canvasElement.querySelector("header")).toBeNull();
  await expect(canvas.queryByRole("banner")).toBeNull();
  const root = title.closest<HTMLElement>(".ds-page-header") as HTMLElement;
  await expect(root.localName).toBe("div");
  await expect(canvas.getByText(copy.description)).toBeVisible();
  const style = getComputedStyle(title);
  const size = tokenPx(title, "--ds-type-display-md-font-size");
  near(parseFloat(style.fontSize), size, "title size");
  // The 1.7 line of type.heading.sm and the 8 px of top padding (header-type-1), not the 1.25
  // and 16 px of text-display-md.
  near(parseFloat(style.lineHeight), size * 1.7, "title line height");
  near(parseFloat(style.paddingTop), tokenPx(title, "--ds-space-stack-sm"), "title top padding");
}

/** Title, description, meta and the action in place: the sample header with every slot. */
export const Default: Story = {
  render: () => <Sample copy={th} />,
  play: ({ canvasElement }) => expectOpening(canvasElement, th),
};

export const DefaultEn: Story = {
  decorators: inEnglish,
  render: () => <Sample copy={en} />,
  play: ({ canvasElement }) => expectOpening(canvasElement, en),
};

/** Row 3: no empty node for a slot that is missing, the title block holds the heading alone. */
async function expectTitleOnly(canvasElement: HTMLElement, copy: Copy) {
  const canvas = within(canvasElement);
  await expect(canvas.getByRole("heading", { level: 1, name: copy.title })).toBeVisible();
  const root = rootsOf(canvasElement)[0] as HTMLElement;
  await expect(part(root, "text").children).toHaveLength(1);
  await expect(root.querySelector("p")).toBeNull();
  await expect(root.querySelector(".ds-page-header__meta")).toBeNull();
  await expect(root.querySelector(".ds-page-header__actions")).toBeNull();
}

export const TitleOnly: Story = {
  render: () => <PageHeader title={th.title} />,
  play: ({ canvasElement }) => expectTitleOnly(canvasElement, th),
};

export const TitleOnlyEn: Story = {
  decorators: inEnglish,
  render: () => <PageHeader title={en.title} />,
  play: ({ canvasElement }) => expectTitleOnly(canvasElement, en),
};

/**
 * Row 4: at 1280 the action sits on the row's end edge and the title on its start edge, the
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
    <PageHeader
      title={copy.title}
      description={copy.description}
      actions={<Button variant="primary">{copy.action}</Button>}
    />
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

/** Row 6: the meta row follows the description in the document. */
async function expectMetaAfterDescription(canvasElement: HTMLElement, copy: Copy) {
  const canvas = within(canvasElement);
  const description = canvas.getByText(copy.description);
  const meta = canvas.getByText(copy.meta).closest<HTMLElement>(".ds-page-header__meta");
  await expect(meta).not.toBeNull();
  await expect(meta).toBeVisible();
  await expect(
    description.compareDocumentPosition(meta as HTMLElement) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  await expect(canvas.getByText(copy.metaNote, { exact: false })).toBeVisible();
}

const withMeta = (copy: Copy) => (
  <PageHeader
    title={copy.title}
    description={copy.description}
    meta={
      <>
        <Badge size="sm">{copy.meta}</Badge>
        {copy.metaNote}
      </>
    }
  />
);

export const WithMeta: Story = {
  render: () => withMeta(th),
  play: ({ canvasElement }) => expectMetaAfterDescription(canvasElement, th),
};

export const WithMetaEn: Story = {
  decorators: inEnglish,
  render: () => withMeta(en),
  play: ({ canvasElement }) => expectMetaAfterDescription(canvasElement, en),
};

/**
 * Row 7: at 360 px a long title wraps inside the header. Every node from the title up to the
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
  const longStyle = getComputedStyle(long);
  // A title that wraps is taller than its one line and the padding above it.
  await expect(long.getBoundingClientRect().height).toBeGreaterThan(
    parseFloat(longStyle.lineHeight) + parseFloat(longStyle.paddingTop) + 1,
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
    <PageHeader title={copy.longTitle} description={copy.description} />
    <PageHeader title={copy.marksTitle} />
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

/** Row 8: level 4 beside level 1 changes the element and nothing else. */
async function expectLevels(canvasElement: HTMLElement) {
  const headings = within(canvasElement).getAllByRole("heading");
  await expect(headings).toHaveLength(2);
  const [first, second] = headings as [HTMLElement, HTMLElement];
  await expect(first.localName).toBe("h4");
  await expect(second.localName).toBe("h1");
  await expect(getComputedStyle(first).fontSize).toBe(getComputedStyle(second).fontSize);
  await expect(getComputedStyle(first).lineHeight).toBe(getComputedStyle(second).lineHeight);
}

const levels = (copy: Copy) => (
  <div className="flex flex-col gap-6">
    <PageHeader level={4} title={copy.title} description={copy.description} />
    <PageHeader title={copy.description} />
  </div>
);

export const HeadingLevel: Story = {
  render: () => levels(th),
  play: ({ canvasElement }) => expectLevels(canvasElement),
};

export const HeadingLevelEn: Story = {
  decorators: inEnglish,
  render: () => levels(en),
  play: ({ canvasElement }) => expectLevels(canvasElement),
};

/**
 * Row 5: at 360 px the action sits under the title block on the same start edge, and nothing
 * scrolls sideways.
 */
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
    <Sample copy={copy} />
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

/** The floor of `header-stack-1`: nine title sizes, read off the token, never a neutral number. */
const floorOf = (root: HTMLElement) => 9 * tokenPx(root, "--ds-type-display-md-font-size");

/**
 * Row 76, under: the actions sit under the title block, the least start edge is the title's, the
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
 * Row 76, beside: the last action sits on the header's end edge, on the title block's bottom edge,
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

/** Under Vitest, as `expectLongTitle` does: the lines clear and the header's frame cuts no ink. */
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
  640: "w-[640px]",
} as const;

interface ManyFrame {
  width: keyof typeof frameWidth;
  actions: (copy: Copy) => string[];
  form: "under" | "beside";
  oneLine?: boolean;
}

/** Row 76: the seven frames of design.md "Finding F1", each a header with every slot filled. */
const manyFrames: readonly ManyFrame[] = [
  {
    width: 480,
    actions: (c) => [c.action, ...c.moreActions.slice(0, 2)],
    form: "under",
    oneLine: true,
  },
  { width: 480, actions: (c) => [c.action, ...c.moreActions], form: "under", oneLine: true },
  { width: 480, actions: (c) => [c.action], form: "beside" },
  { width: 480, actions: (c) => [c.longAction], form: "beside" },
  { width: 479, actions: (c) => [c.action], form: "under" },
  { width: 520, actions: (c) => [c.action, c.moreActions[0]], form: "under" },
  { width: 640, actions: (c) => [c.action, c.moreActions[0]], form: "beside" },
];

const many = (copy: Copy) => (
  <div className="flex flex-col gap-8">
    {manyFrames.map((frame, i) => (
      <div key={i} data-testid={`frame-${i + 1}`} className={frameWidth[frame.width]}>
        <Sample
          copy={copy}
          actions={frame.actions(copy).map((label, n) => (
            <Button key={label} variant={n === 0 ? "primary" : "secondary"}>
              {label}
            </Button>
          ))}
        />
      </div>
    ))}
  </div>
);

async function expectManyActions(canvasElement: HTMLElement, copy: Copy) {
  const canvas = within(canvasElement);
  for (const [i, frame] of manyFrames.entries()) {
    const slot = canvas.getByTestId(`frame-${i + 1}`);
    await expect(slot.getBoundingClientRect().width).toBe(frame.width);
    const root = rootsOf(slot)[0] as HTMLElement;
    await expect(within(root).getAllByRole("button")).toHaveLength(frame.actions(copy).length);
    if (frame.form === "under") await expectActionsUnder(root, copy);
    else await expectActionsBeside(root, copy);
    if (frame.oneLine) {
      const title = part(root, "title");
      const style = getComputedStyle(title);
      near(
        title.getBoundingClientRect().height,
        parseFloat(style.lineHeight) + parseFloat(style.paddingTop),
        "the title is one line",
      );
    }
  }
}

/** Row 76: from container 480, three and four actions go under the title block, one stays beside it. */
export const ManyActions: Story = {
  render: () => many(th),
  play: ({ canvasElement }) => expectManyActions(canvasElement, th),
};

export const ManyActionsEn: Story = {
  decorators: inEnglish,
  render: () => many(en),
  play: ({ canvasElement }) => expectManyActions(canvasElement, en),
};

/** Row 11: three profiles in both modes, the title and the description in their own inks. */
export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <Sample copy={th} />
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
