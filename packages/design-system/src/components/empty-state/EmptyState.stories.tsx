import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import {
  expectFrameCutsNoInk,
  expectLinesClear,
  expectTitleOverText,
  inVitest,
} from "../../testing/visual-asserts";
import { Button } from "../button/Button";
import { emptyStateFixtures, fixtureJobs, fixtures } from "../fixtures";
import { KnowledgeIcon } from "../icons";
import { Matrix, Narrow } from "../matrix";
import { EmptyState } from "./EmptyState";

const th = emptyStateFixtures.th;
const en = emptyStateFixtures.en;

const meta = {
  title: "Application/Empty state",
  component: EmptyState,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A region with nothing in it (ORV-223): an optional tile, a title over a description and the caller's own action. `md` is a centred column for a board or a page; `sm` starts at the line's start, for a bar. It sets no role, never takes focus and never speaks: a region that turns empty by a search says so through a status container it owns and mounted earlier (the NoResults story). The words come from the caller. The words and the actions in these stories are mock: no press runs anything.",
      },
    },
  },
  args: {
    level: 2,
    title: th.firstUse.title,
    description: th.firstUse.description,
    icon: KnowledgeIcon,
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The length a token resolves to at `el`, in px, as the browser computes it. */
function resolvedLength(el: Element, token: string): number {
  const probe = document.createElement("span");
  probe.style.display = "block";
  probe.style.width = `var(${token})`;
  el.append(probe);
  const px = parseFloat(getComputedStyle(probe).width);
  probe.remove();
  return px;
}

const rootsOf = (root: Element) =>
  Array.from(root.querySelectorAll<HTMLElement>(".ds-empty-state"));
const part = (root: Element, name: string) =>
  root.querySelector<HTMLElement>(`.ds-empty-state__${name}`) as HTMLElement;
const near = (actual: number, expected: number, what: string) =>
  expect(
    Math.abs(actual - expected),
    `${what}: ${actual} px, expected ${expected} px`,
  ).toBeLessThanOrEqual(0.5);

/** The first use form in the language of the copy, with a mock action. */
function FirstUse({
  copy = th,
  size,
  onAction,
}: {
  copy?: typeof th | typeof en;
  size?: "sm" | "md";
  onAction?: () => void;
}) {
  return (
    <EmptyState
      level={2}
      size={size}
      icon={KnowledgeIcon}
      title={copy.firstUse.title}
      description={copy.firstUse.description}
      action={
        <Button variant="secondary" size={size === "sm" ? "sm" : "md"} onClick={onAction}>
          {copy.firstUse.action}
        </Button>
      }
    />
  );
}

/** The mock action of `Default`: counts its presses, runs nothing. */
const press = fn();

/** First use at md: a tile, a title over a description, one action, centred and capped at the panel width. */
export const Default: Story = {
  render: () => <FirstUse onAction={press} />,
  play: async ({ canvasElement }) => {
    press.mockClear();
    const canvas = within(canvasElement);
    const [root] = rootsOf(canvasElement) as [HTMLElement];
    const title = canvas.getByRole("heading", { level: 2 });
    await expect(title).toHaveTextContent(th.firstUse.title);
    await expect(title).toBe(part(root, "title"));
    for (const role of ["main", "banner", "contentinfo", "status", "alert"]) {
      await expect(within(root).queryAllByRole(role), `a ${role} inside`).toHaveLength(0);
    }
    const rootStyle = getComputedStyle(root);
    await expect(rootStyle.animationName).toBe("none");
    await expect(rootStyle.transitionDuration).toBe("0s");
    expectTitleOverText(title, part(root, "description"), { gap: 4 });

    // The cap: the parent is a block box wider than the cap, and the root does not fill it.
    const parent = root.parentElement as HTMLElement;
    const parentStyle = getComputedStyle(parent);
    await expect(parentStyle.display).toBe("block");
    const content =
      parent.clientWidth -
      parseFloat(parentStyle.paddingLeft) -
      parseFloat(parentStyle.paddingRight);
    const cap = resolvedLength(root, "--cmp-empty-state-max-width");
    await expect(
      content,
      "the parent is not wider than the cap, so the cap proves nothing",
    ).toBeGreaterThan(cap);
    await expect(root.getBoundingClientRect().width).toBeLessThanOrEqual(cap + 0.01);
    // md is centred in a block parent: equal space either side.
    const parentBox = parent.getBoundingClientRect();
    const box = root.getBoundingClientRect();
    near(
      box.left - (parentBox.left + parseFloat(parentStyle.paddingLeft)),
      parentBox.right - parseFloat(parentStyle.paddingRight) - box.right,
      "the md form's space either side",
    );

    const button = canvas.getByRole("button", { name: th.firstUse.action });
    await userEvent.click(button);
    await expect(press).toHaveBeenCalledTimes(1);
    await expect(document.activeElement).toBe(button);
  },
};

/** The same form at md (a centred column) and sm (the tile at the start, the words beside it). */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <FirstUse size="md" />
      <FirstUse size="sm" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [md, sm] = rootsOf(canvasElement) as [HTMLElement, HTMLElement];
    await expect(md).toHaveAttribute("data-size", "md");
    await expect(sm).toHaveAttribute("data-size", "sm");
    const tile = (root: HTMLElement) => root.querySelector(".ds-featured-icon") as HTMLElement;
    near(tile(md).getBoundingClientRect().width, 40, "the md tile");
    near(tile(sm).getBoundingClientRect().width, 32, "the sm tile");
    // md: tile, 16, text, 16, action.
    near(
      part(md, "title").getBoundingClientRect().top - tile(md).getBoundingClientRect().bottom,
      16,
      "md tile to title",
    );
    near(
      part(md, "action").getBoundingClientRect().top -
        part(md, "description").getBoundingClientRect().bottom,
      16,
      "md text to action",
    );
    // sm: tile, 12, text; 8 under the text, the action.
    near(
      part(sm, "title").getBoundingClientRect().left - tile(sm).getBoundingClientRect().right,
      12,
      "sm tile to title",
    );
    near(
      part(sm, "action").getBoundingClientRect().top -
        part(sm, "description").getBoundingClientRect().bottom,
      8,
      "sm text to action",
    );
  },
};

/** No tile, no description and no action: the title alone, with no gap left behind. */
export const TitleOnly: Story = {
  render: () => <EmptyState level={2} title={th.firstUse.title} />,
  play: async ({ canvasElement }) => {
    const [root] = rootsOf(canvasElement) as [HTMLElement];
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 2 })).toHaveTextContent(th.firstUse.title);
    await expect(root.querySelectorAll("svg")).toHaveLength(0);
    await expect(root.querySelectorAll("p")).toHaveLength(0);
    await expect(root.querySelectorAll("button")).toHaveLength(0);
    near(
      root.getBoundingClientRect().height,
      part(root, "title").getBoundingClientRect().height,
      "the root against its title",
    );
  },
};

/**
 * A host keeps an empty status container mounted and the form arrives inside it, so the words are
 * spoken (`empty-live-1`). EmptyState itself has no role. The jobs are mock.
 */
function SearchHost({ copy = th }: { copy?: typeof th | typeof en }) {
  const [searched, setSearched] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <Button variant="secondary" size="sm" onClick={() => setSearched(true)}>
        {copy.noResults.trigger}
      </Button>
      {searched ? null : (
        <ul className="m-0 list-none p-0">
          <li>{fixtureJobs.done.name}</li>
          <li>{fixtureJobs.queued.name}</li>
        </ul>
      )}
      <div role="status">
        {searched ? (
          <EmptyState
            level={2}
            icon={KnowledgeIcon}
            title={copy.noResults.title}
            description={copy.noResults.description}
            action={
              <Button variant="secondary" size="md" onClick={() => setSearched(false)}>
                {copy.noResults.action}
              </Button>
            }
          />
        ) : null}
      </div>
    </div>
  );
}

/** A search finds nothing: the list gives way to the no-results form, spoken through the host's status. */
export const NoResults: Story = {
  render: () => <SearchHost />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const container = canvas.getByRole("status");
    await expect(canvas.queryAllByRole("status")).toHaveLength(1);
    await expect(container.textContent).toBe("");
    await expect(canvas.getByText(fixtureJobs.done.name)).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: th.noResults.trigger }));
    const title = await canvas.findByRole("heading", { level: 2 });
    await expect(title).toHaveTextContent(th.noResults.title);
    await expect(canvas.getByRole("status")).toBe(container);
    await expect(container.textContent).toContain(th.noResults.title);
    await expect(canvas.queryAllByRole("status")).toHaveLength(1);
    await expect(container.querySelector(".ds-empty-state")).not.toHaveAttribute("role");
    await expect(canvas.queryByText(fixtureJobs.done.name)).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: th.noResults.action }));
    await waitFor(() => expect(container.textContent).toBe(""));
    await expect(canvas.getByText(fixtureJobs.done.name)).toBeVisible();
  },
};

/** English: the first use form, the title alone and the no-results form, all from the caller's English words. */
export const InEnglish: Story = {
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  render: () => (
    <div className="flex flex-col gap-8">
      <FirstUse copy={en} />
      <EmptyState level={2} title={en.firstUse.title} />
      <EmptyState
        level={2}
        icon={KnowledgeIcon}
        title={en.noResults.title}
        description={en.noResults.description}
        action={
          <Button variant="secondary" size="md">
            {en.noResults.action}
          </Button>
        }
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText(en.firstUse.title)).toHaveLength(2);
    await expect(canvas.getByText(en.firstUse.description)).toBeVisible();
    await expect(canvas.getByRole("button", { name: en.firstUse.action })).toBeVisible();
    await expect(canvas.getByText(en.noResults.title)).toBeVisible();
    await expect(canvas.getByText(en.noResults.description)).toBeVisible();
    await expect(canvas.getByRole("button", { name: en.noResults.action })).toBeVisible();
    await expect(canvas.getAllByRole("heading", { level: 2 })).toHaveLength(3);
  },
};

/**
 * In a 360 px frame a long Thai title and a long Latin description wrap inside it, with the action
 * under them. The frame starts 0.3 px down: `expectLinesClear` puts its clone right under the
 * title, and at a device pixel ratio of 1 the rounded gap between two Thai lines drops from 1 px to
 * 0 when the clone's top falls at about .6 or .7 of a pixel (the title's top plus two lines of
 * 23.8 px is 119.59 here). The offset moves both clones off that band; it changes nothing the
 * person sees.
 */
export const LongAt360: Story = {
  render: () => (
    <Narrow>
      <div data-testid="frame" className="flex flex-col gap-8" style={{ paddingTop: 0.3 }}>
        {(["md", "sm"] as const).map((size) => (
          <EmptyState
            key={size}
            level={2}
            size={size}
            icon={KnowledgeIcon}
            title={fixtures.longThai}
            description={fixtures.longLatin}
            action={
              <Button variant="secondary" size={size === "sm" ? "sm" : "md"}>
                {th.firstUse.action}
              </Button>
            }
          />
        ))}
      </div>
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(360);
    const roots = rootsOf(frame);
    await expect(roots).toHaveLength(2);
    for (const root of roots) {
      const title = part(root, "title");
      const description = part(root, "description");
      for (const el of [title, description]) {
        await expect(el.scrollHeight).toBeLessThanOrEqual(el.clientHeight);
      }
      // Nothing from the title up to the frame clips: every ancestor is visible on both axes.
      for (let el: HTMLElement | null = title; el; el = el === frame ? null : el.parentElement) {
        const style = getComputedStyle(el);
        await expect(style.overflowX, `${el.className || el.localName} clips on x`).toBe("visible");
        await expect(style.overflowY, `${el.className || el.localName} clips on y`).toBe("visible");
      }
      // The long title wraps in both sizes.
      await expect(title.getBoundingClientRect().height).toBeGreaterThan(30);
      if (inVitest) {
        await expectLinesClear(title);
        await expectFrameCutsNoInk(title, frame);
      }
    }
  },
};

/** The first use form under the three profiles in both modes. */
export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <FirstUse />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    await expect(within(canvasElement).getAllByRole("heading", { level: 2 })).toHaveLength(6);
    for (const cell of cells)
      await expect(cell.querySelectorAll(".ds-empty-state")).toHaveLength(1);
  },
};

/**
 * Type contract (`empty-api-1`, `empty-sem-1`), checked by `pnpm typecheck`. The rejected elements
 * are created and dropped, never mounted: a missing title, a missing level, `level={1}` (the page's
 * own), a `role` and a `live` prop are each a type error. The story draws the one valid form.
 */
export const TypeContract: Story = {
  render: () => {
    const rejected = [
      // @ts-expect-error a title is required
      <EmptyState level={2} />,
      // @ts-expect-error a level is required: only the caller knows how deep the region sits
      <EmptyState title="x" />,
      // @ts-expect-error level 1 is the page's own heading
      <EmptyState level={1} title="x" />,
      // @ts-expect-error the form sets no role
      <EmptyState level={2} title="x" role="status" />,
      // @ts-expect-error the form never speaks: the region owns the status
      <EmptyState level={2} title="x" live="polite" />,
    ];
    return (
      <div data-rejected={rejected.length}>
        <EmptyState level={2} title={th.firstUse.title} />
      </div>
    );
  },
};
