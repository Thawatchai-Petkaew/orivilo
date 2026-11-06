import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import { expectNoGlyphClip, resolvedColor } from "../../testing/visual-asserts";
import { featuredIconFixtures, fixtures } from "../fixtures";
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
          "A glyph on a tinted tile for one feedback kind (ORV-222): success, warning, danger or info. The kind sets the tint and the drawing, so it never rests on colour alone, and the tile is hidden from assistive technology: it stands only beside words that say the same thing (use Badge for a status with no words). The words in these stories are mock.",
      },
    },
  },
} satisfies Meta<typeof FeaturedIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

const VARIANTS = [
  "success",
  "warning",
  "danger",
  "info",
] as const satisfies readonly FeaturedIconVariant[];
const SIZES = ["sm", "md", "lg"] as const satisfies readonly FeaturedIconSize[];

/** Tile then glyph, in px: `size.control.*` then `size.icon.*` (spec ORV-222, worked example W1). */
const BOXES = { sm: [32, 16], md: [40, 20], lg: [48, 24] } as const;

/** The four kinds beside their words, in the language of the copy. */
function Rows({
  copy,
  size,
}: {
  copy: Record<FeaturedIconVariant, string>;
  size?: FeaturedIconSize;
}) {
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {VARIANTS.map((variant) => (
        <li key={variant} className="flex items-center gap-3 text-label-md">
          <FeaturedIcon variant={variant} size={size} />
          <span>{copy[variant]}</span>
        </li>
      ))}
    </ul>
  );
}

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
    const drawings = tiles.map((tile) => (tile.querySelector("svg") as SVGSVGElement).innerHTML);
    await expect(new Set(drawings).size).toBe(4);
    for (const [i, tile] of tiles.entries()) {
      const variant = VARIANTS[i] as FeaturedIconVariant;
      await expect(tile).toHaveAttribute("data-variant", variant);
      await expectHiddenTile(tile);
      const glyph = tile.querySelector("svg") as SVGSVGElement;
      await expect(getComputedStyle(glyph).color).toBe(
        resolvedColor(tile, `--cmp-featured-icon-${variant}-fg`),
      );
      await expect(getComputedStyle(tile).backgroundColor).toBe(
        resolvedColor(tile, `--cmp-featured-icon-${variant}-bg`),
      );
    }
  },
};

/** Sm 32, md 40 and lg 48 px for each kind, the glyph half the tile and centred in it. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {SIZES.map((size) => (
        <div key={size} className="flex items-center gap-3">
          {VARIANTS.map((variant) => (
            <FeaturedIcon key={variant} variant={variant} size={size} />
          ))}
        </div>
      ))}
    </div>
  ),
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

/** English: the four kinds at every size, beside the English words. */
export const InEnglish: Story = {
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  render: () => (
    <div className="flex flex-col gap-6">
      <Rows copy={featuredIconFixtures.en} />
      <div className="flex items-center gap-3">
        {SIZES.map((size) => (
          <FeaturedIcon key={size} variant="danger" size={size} />
        ))}
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const variant of VARIANTS) {
      await expect(canvas.getByText(featuredIconFixtures.en[variant])).toBeVisible();
    }
    const tiles = tilesOf(canvasElement);
    await expect(tiles).toHaveLength(7);
    for (const tile of tiles) await expectHiddenTile(tile);
    const sized = tiles.slice(4).map((tile) => tile.getAttribute("data-size"));
    await expect(sized).toEqual(["sm", "md", "lg"]);
  },
};

/** In a 360 px frame each tile keeps its 48 px and a long name wraps beside it. */
export const At360: Story = {
  render: () => (
    <div data-testid="frame" className="w-[360px] max-w-full overflow-hidden">
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
    }
    expectNoGlyphClip(frame);
  },
};

export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <Rows copy={featuredIconFixtures.th} />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    for (const cell of cells) await expect(tilesOf(cell)).toHaveLength(4);
    await expect(tilesOf(canvasElement)).toHaveLength(24);
  },
};

/**
 * Type contract (`fi-api-1`), checked by `pnpm typecheck`. The rejected elements are created and
 * dropped, never mounted: a missing variant, a variant outside the four kinds, a caller's own
 * `icon` and a `children` are each a type error. The story draws the one valid tile.
 */
export const TypeContract: Story = {
  render: () => {
    const rejected = [
      // @ts-expect-error a variant is required: there is no default kind
      <FeaturedIcon />,
      // @ts-expect-error brand is not a feedback kind
      <FeaturedIcon variant="brand" />,
      // @ts-expect-error the variant sets the glyph; there is no icon prop
      <FeaturedIcon variant="success" icon={<span />} />,
      // @ts-expect-error there is no children prop
      <FeaturedIcon variant="success">x</FeaturedIcon>,
    ];
    return (
      <div data-rejected={rejected.length}>
        <FeaturedIcon variant="success" />
      </div>
    );
  },
};
