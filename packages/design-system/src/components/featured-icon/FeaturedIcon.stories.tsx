import type { Meta, StoryObj } from "@storybook/react-vite";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { expect, within } from "storybook/test";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import {
  expectFrameCutsNoInk,
  expectLabelInkWhole,
  inVitest,
  resolvedColor,
} from "../../testing/visual-asserts";
import { featuredIconFixtures, fixtures } from "../fixtures";
import { CheckIcon, DangerIcon, InfoIcon, JobsIcon, QueuedIcon, WarningIcon } from "../icons";
import { Matrix } from "../matrix";
import { FeaturedIcon, type FeaturedIconSize, type FeaturedIconVariant } from "./FeaturedIcon";

const meta = {
  title: "Base/Featured icon",
  component: FeaturedIcon,
  args: { variant: "success" },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A glyph on a tile. A feedback kind (ORV-222: success, warning, danger or info) sets the tint and the drawing, so it never rests on colour alone. The neutral kind (ORV-223) is a quiet grey tile that takes the caller's own glyph, for an empty form. The tile is hidden from assistive technology: it stands only beside words that say the same thing (use Badge for a status with no words). The words in these stories are mock.",
      },
    },
  },
} satisfies Meta<typeof FeaturedIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

type FeedbackKind = Exclude<FeaturedIconVariant, "neutral">;
const VARIANTS = [
  "success",
  "warning",
  "danger",
  "info",
] as const satisfies readonly FeedbackKind[];
const SIZES = ["sm", "md", "lg"] as const satisfies readonly FeaturedIconSize[];

/** Tile then glyph, in px: `size.control.*` then `size.icon.*` (spec ORV-222, worked example W1). */
const BOXES = { sm: [32, 16], md: [40, 20], lg: [48, 24] } as const;

/** One tile of a kind; the neutral kind draws the jobs glyph, as the empty task bar does. */
function Tile({
  variant,
  size,
}: {
  variant: FeaturedIconVariant;
  size?: FeaturedIconSize | undefined;
}) {
  return variant === "neutral" ? (
    <FeaturedIcon variant="neutral" icon={JobsIcon} size={size} />
  ) : (
    <FeaturedIcon variant={variant} size={size} />
  );
}

/** The four feedback kinds (and the neutral one with `withNeutral`) beside their words. */
function Rows({
  copy,
  size,
  withNeutral = false,
}: {
  copy: Record<FeaturedIconVariant, string>;
  size?: FeaturedIconSize;
  withNeutral?: boolean;
}) {
  const kinds: readonly FeaturedIconVariant[] = withNeutral ? [...VARIANTS, "neutral"] : VARIANTS;
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {kinds.map((variant) => (
        <li key={variant} className="flex items-center gap-3 text-label-md">
          <Tile variant={variant} size={size} />
          <span>{copy[variant]}</span>
        </li>
      ))}
    </ul>
  );
}

/** The neutral tile at sm, md and lg, each beside the words. */
function NeutralRows({ text }: { text: string }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {SIZES.map((size) => (
        <li key={size} className="flex items-center gap-3 text-label-md">
          <FeaturedIcon variant="neutral" icon={JobsIcon} size={size} />
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The glyph `fi-glyph-1` names for each kind, taken from `icons.tsx` and not through
 * `FeaturedIcon.tsx`, so a swapped map in the component goes red.
 */
const GLYPH_OF = {
  success: CheckIcon,
  warning: WarningIcon,
  danger: DangerIcon,
  info: InfoIcon,
} as const satisfies Record<FeedbackKind, unknown>;

/** The drawing inside an svg, as markup; the svg's own attributes (class, size) are left out. */
const drawingOf = (svg: SVGSVGElement) => svg.innerHTML;

/** The glyph alone, mounted in a detached node (not in the story), then read and unmounted. */
const drawingOfGlyph = (variant: FeedbackKind) => {
  const Glyph = GLYPH_OF[variant];
  const holder = document.createElement("div");
  const root = createRoot(holder);
  flushSync(() => root.render(<Glyph />));
  const drawing = drawingOf(holder.querySelector("svg") as SVGSVGElement);
  root.unmount();
  return drawing;
};

const tilesOf = (root: Element) =>
  Array.from(root.querySelectorAll<HTMLElement>(".ds-featured-icon"));

/** A tile is hidden, has no role, no name and no tab stop; the glyph is hidden too. */
async function expectHiddenTile(tile: HTMLElement) {
  await expect(tile).toHaveAttribute("aria-hidden", "true");
  await expect(tile).not.toHaveAttribute("role");
  await expect(tile).not.toHaveAttribute("aria-label");
  await expect(tile).not.toHaveAttribute("aria-labelledby");
  await expect(tile).not.toHaveAttribute("tabindex");
  await expect(tile.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
}

/** The neutral tile as `fi-neutral-colour-1` reads it: the quiet ground and ink, the size and the glyph's size. */
async function expectNeutralTile(tile: HTMLElement, size: FeaturedIconSize) {
  const [tileSize, glyphSize] = BOXES[size];
  const glyph = tile.querySelector("svg") as SVGSVGElement;
  const tileStyle = getComputedStyle(tile);
  const glyphStyle = getComputedStyle(glyph);
  await expect(tile).toHaveAttribute("data-variant", "neutral");
  await expect(tile).toHaveAttribute("data-size", size);
  await expect(Math.abs(parseFloat(tileStyle.width) - tileSize)).toBeLessThanOrEqual(0.5);
  await expect(Math.abs(parseFloat(tileStyle.height) - tileSize)).toBeLessThanOrEqual(0.5);
  await expect(Math.abs(parseFloat(glyphStyle.width) - glyphSize)).toBeLessThanOrEqual(0.5);
  await expect(Math.abs(parseFloat(glyphStyle.height) - glyphSize)).toBeLessThanOrEqual(0.5);
  await expect(glyphStyle.color).toBe(resolvedColor(tile, "--cmp-featured-icon-neutral-fg"));
  await expect(tileStyle.backgroundColor).toBe(
    resolvedColor(tile, "--cmp-featured-icon-neutral-bg"),
  );
}

/** Four tinted tiles with four different glyphs, each beside its words. */
export const Variants: Story = {
  render: () => <Rows copy={featuredIconFixtures.th} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const variant of VARIANTS) {
      await expect(canvas.getByText(featuredIconFixtures.th[variant])).toBeVisible();
    }
    const tiles = tilesOf(canvasElement);
    await expect(tiles).toHaveLength(4);
    const drawings = tiles.map((tile) => drawingOf(tile.querySelector("svg") as SVGSVGElement));
    await expect(new Set(drawings).size).toBe(4);
    for (const [i, tile] of tiles.entries()) {
      const variant = VARIANTS[i] as FeedbackKind;
      await expect(tile).toHaveAttribute("data-variant", variant);
      await expectHiddenTile(tile);
      const glyph = tile.querySelector("svg") as SVGSVGElement;
      // Each kind draws its own glyph (fi-glyph-1), not only a different one from the others.
      await expect(drawingOf(glyph), `the ${variant} tile draws the wrong glyph`).toBe(
        drawingOfGlyph(variant),
      );
      await expect(getComputedStyle(glyph).color).toBe(
        resolvedColor(tile, `--cmp-featured-icon-${variant}-fg`),
      );
      await expect(getComputedStyle(tile).backgroundColor).toBe(
        resolvedColor(tile, `--cmp-featured-icon-${variant}-bg`),
      );
    }
  },
};

/** The four kinds at sm, md and lg: one row per size, the kinds in order. */
function SizeRows() {
  return (
    <div className="flex flex-col gap-4">
      {SIZES.map((size) => (
        <div key={size} className="flex items-center gap-3">
          {VARIANTS.map((variant) => (
            <FeaturedIcon key={variant} variant={variant} size={size} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Sm 32, md 40 and lg 48 px for each kind, the glyph half the tile and centred in it. */
export const Sizes: Story = {
  render: () => <SizeRows />,
  play: async ({ canvasElement }) => {
    const tiles = tilesOf(canvasElement);
    await expect(tiles).toHaveLength(12);
    for (const [i, tile] of tiles.entries()) {
      const size = SIZES[Math.floor(i / VARIANTS.length)] as FeaturedIconSize;
      const [tileSize, glyphSize] = BOXES[size];
      const glyph = tile.querySelector("svg") as SVGSVGElement;
      const tileStyle = getComputedStyle(tile);
      const glyphStyle = getComputedStyle(glyph);
      await expect(tile).toHaveAttribute("data-size", size);
      await expect(Math.abs(parseFloat(tileStyle.width) - tileSize)).toBeLessThanOrEqual(0.5);
      await expect(Math.abs(parseFloat(tileStyle.height) - tileSize)).toBeLessThanOrEqual(0.5);
      await expect(Math.abs(parseFloat(glyphStyle.width) - glyphSize)).toBeLessThanOrEqual(0.5);
      await expect(Math.abs(parseFloat(glyphStyle.height) - glyphSize)).toBeLessThanOrEqual(0.5);
    }
    // One glyph per size: the svg's centre sits on the tile's centre on both axes. The tile holds
    // no text, so the check reads boxes, not ink.
    for (const size of SIZES) {
      const tile = tiles[SIZES.indexOf(size) * VARIANTS.length] as HTMLElement;
      const tileBox = tile.getBoundingClientRect();
      const glyphBox = (tile.querySelector("svg") as SVGSVGElement).getBoundingClientRect();
      const dx = glyphBox.left + glyphBox.width / 2 - (tileBox.left + tileBox.width / 2);
      const dy = glyphBox.top + glyphBox.height / 2 - (tileBox.top + tileBox.height / 2);
      await expect(
        Math.abs(dx),
        `the ${size} glyph is ${dx} px off the tile's centre`,
      ).toBeLessThanOrEqual(0.5);
      await expect(
        Math.abs(dy),
        `the ${size} glyph is ${dy} px off the tile's centre`,
      ).toBeLessThanOrEqual(0.5);
    }
  },
};

/**
 * The neutral tile (ORV-223): a quiet grey ground with the caller's glyph, at sm, md and lg beside
 * the words. The tile is the same as a feedback tile in size, radius and hidden state; only the
 * ground, the ink and the caller's own glyph differ.
 */
export const Neutral: Story = {
  render: () => <NeutralRows text={featuredIconFixtures.th.neutral} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByText(featuredIconFixtures.th.neutral)).toHaveLength(
      3,
    );
    const tiles = tilesOf(canvasElement);
    await expect(tiles).toHaveLength(3);
    for (const [i, tile] of tiles.entries()) {
      const size = SIZES[i] as FeaturedIconSize;
      await expectHiddenTile(tile);
      await expectNeutralTile(tile, size);
      // The tile holds no text, so the glyph is centred by boxes, not by ink.
      const tileBox = tile.getBoundingClientRect();
      const glyphBox = (tile.querySelector("svg") as SVGSVGElement).getBoundingClientRect();
      const dx = glyphBox.left + glyphBox.width / 2 - (tileBox.left + tileBox.width / 2);
      const dy = glyphBox.top + glyphBox.height / 2 - (tileBox.top + tileBox.height / 2);
      await expect(Math.abs(dx), `the ${size} glyph is ${dx} px off`).toBeLessThanOrEqual(0.5);
      await expect(Math.abs(dy), `the ${size} glyph is ${dy} px off`).toBeLessThanOrEqual(0.5);
    }
  },
};

/** English: the four kinds beside the English words (as `Variants`), then at sm, md and lg (as `Sizes`). */
export const InEnglish: Story = {
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  render: () => (
    <div className="flex flex-col gap-6">
      <Rows copy={featuredIconFixtures.en} />
      <SizeRows />
      <NeutralRows text={featuredIconFixtures.en.neutral} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const variant of VARIANTS) {
      await expect(canvas.getByText(featuredIconFixtures.en[variant])).toBeVisible();
    }
    await expect(canvas.getAllByText(featuredIconFixtures.en.neutral)).toHaveLength(3);
    const tiles = tilesOf(canvasElement);
    // Four tiles beside the words, twelve (the four kinds at each of the three sizes), then the
    // three neutral tiles beside their words.
    await expect(tiles).toHaveLength(19);
    for (const [i, tile] of tiles.entries()) {
      await expectHiddenTile(tile);
      if (i >= 16) {
        await expectNeutralTile(tile, SIZES[i - 16] as FeaturedIconSize);
        continue;
      }
      const variant = VARIANTS[i % VARIANTS.length] as FeedbackKind;
      await expect(tile).toHaveAttribute("data-variant", variant);
      if (i >= VARIANTS.length) {
        const size = SIZES[Math.floor((i - VARIANTS.length) / VARIANTS.length)] as FeaturedIconSize;
        await expect(tile).toHaveAttribute("data-size", size);
      }
    }
  },
};

/**
 * In a 360 px frame each tile keeps its 48 px and a long name wraps beside it. The frame clips
 * nothing (spec ORV-222 v1.3, row 4): the overflow loop reads the computed style of the name and
 * every ancestor up to the frame, and `expectFrameCutsNoInk` reads the pixels, so a clip from the
 * frame or any ancestor goes red by ink as well.
 */
export const At360: Story = {
  render: () => (
    <div data-testid="frame" className="w-[360px] max-w-full">
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {VARIANTS.map((variant) => (
          <li key={variant} className="flex items-start gap-3">
            <FeaturedIcon variant={variant} size="lg" />
            <span data-name="" className="min-w-0 text-label-md [overflow-wrap:anywhere]">
              {fixtures.longThai}
            </span>
          </li>
        ))}
      </ul>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(360);
    const tiles = tilesOf(frame);
    await expect(tiles).toHaveLength(4);
    for (const tile of tiles) {
      await expect(getComputedStyle(tile).width).toBe("48px");
      await expect(getComputedStyle(tile).height).toBe("48px");
      await expect(tile.getBoundingClientRect().width).toBe(48);
    }
    const names = Array.from(frame.querySelectorAll<HTMLElement>("[data-name]"));
    await expect(names).toHaveLength(4);
    for (const name of names) {
      // 48 px is the tile; a name that wraps is taller than one 24 px line.
      await expect(name.getBoundingClientRect().height).toBeGreaterThan(24);
      // Every ancestor of a name up to and including the frame clips nothing.
      for (let el: HTMLElement | null = name; el; el = el === frame ? null : el.parentElement) {
        const style = getComputedStyle(el);
        await expect(style.overflowX, `${el.localName} clips on x`).toBe("visible");
        await expect(style.overflowY, `${el.localName} clips on y`).toBe("visible");
      }
    }
    if (inVitest) {
      // The name's own box cuts none of the Thai stack: this reads the name's clone only.
      await expectLabelInkWhole(names[0] as HTMLElement);
      // Nothing from the name up to the frame clips ink: the frame shipped against the same frame
      // with every one of those ancestors forced to overflow visible. Last, so the overflow loop
      // above is not what stops the play (spec row 4).
      await expectFrameCutsNoInk(names[0] as HTMLElement, frame);
    }
  },
};

export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <Rows copy={featuredIconFixtures.th} withNeutral />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    for (const cell of cells) await expect(tilesOf(cell)).toHaveLength(5);
    await expect(tilesOf(canvasElement)).toHaveLength(30);
  },
};

/**
 * Type contract (`fi-api-1`), checked by `pnpm typecheck`. The rejected elements are created and
 * dropped, never mounted: a missing variant, a variant outside the five kinds, an `icon` on a
 * feedback kind, a neutral tile without an `icon`, an `icon` given as an element and a `children`
 * are each a type error. The story draws the one valid tile.
 */
export const TypeContract: Story = {
  render: () => {
    const rejected = [
      // @ts-expect-error a variant is required: there is no default kind
      <FeaturedIcon />,
      // @ts-expect-error brand is not a feedback kind
      <FeaturedIcon variant="brand" />,
      // @ts-expect-error a feedback kind sets its own glyph and refuses an icon
      <FeaturedIcon variant="success" icon={<span />} />,
      // @ts-expect-error there is no children prop
      <FeaturedIcon variant="success">x</FeaturedIcon>,
      // @ts-expect-error the neutral kind needs the caller's glyph
      <FeaturedIcon variant="neutral" />,
      // @ts-expect-error a feedback kind keeps its own glyph and refuses an icon
      <FeaturedIcon variant="danger" icon={JobsIcon} />,
      // @ts-expect-error the icon is a component, never an element
      <FeaturedIcon variant="neutral" icon={<QueuedIcon />} />,
    ];
    return (
      <div data-rejected={rejected.length}>
        <FeaturedIcon variant="success" />
      </div>
    );
  },
};
