import { z } from "zod";

/**
 * Category audit for the color node (ORV-20, ADR 0017, knowledge entry `color.hue-families`).
 * Each competitor's dominant color is sorted into one of ten hue families or an achromatic
 * family, and a family with two or more entries is crowded. Pure functions: the same lineup in
 * any order gives the same audit.
 */

/** Hue bands in HSL degrees: a band starts at `from` (inclusive) and ends at the next one. */
const HUE_BANDS = [
  { family: "red", from: 345 },
  { family: "orange", from: 10 },
  { family: "yellow", from: 45 },
  { family: "lime", from: 65 },
  { family: "green", from: 95 },
  { family: "teal", from: 150 },
  { family: "cyan", from: 185 },
  { family: "blue", from: 205 },
  { family: "violet", from: 240 },
  { family: "magenta", from: 290 },
] as const;

export const CHROMATIC_FAMILIES = [
  "red",
  "orange",
  "yellow",
  "lime",
  "green",
  "teal",
  "cyan",
  "blue",
  "violet",
  "magenta",
] as const;
export type ChromaticFamily = (typeof CHROMATIC_FAMILIES)[number];
export type HueFamily = ChromaticFamily | "ink" | "paper";

/** Under this chroma a color has no hue worth naming. */
const ACHROMATIC_CHROMA = 0.12;
/** Achromatic values below this lightness are ink, the rest paper. */
const INK_LIGHTNESS = 0.5;

export const hexSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Use #RRGGBB.")
  .transform((hex) => hex.toUpperCase());

export const lineupEntrySchema = z
  .object({ name: z.string().trim().min(1).max(60), hex: hexSchema })
  .strict();
export type LineupEntry = z.infer<typeof lineupEntrySchema>;

/** One to twenty competitors. The name is a label for the trace and is never read as an instruction. */
export const lineupSchema = z
  .array(lineupEntrySchema)
  .min(1)
  .max(20)
  .superRefine((lineup, ctx) => {
    const seen = new Set<string>();
    lineup.forEach((entry, index) => {
      const key = entry.name.toLowerCase();
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: [index, "name"],
          message: "Each name appears once, ignoring case.",
        });
      }
      seen.add(key);
    });
  });
export type Lineup = z.infer<typeof lineupSchema>;

/** `null` means the lineup was not given, which is a question and not an empty category. */
export const lineupInputSchema = z.object({ lineup: lineupSchema.nullable() }).strict();

export function classifyHex(hex: string): HueFamily {
  const value = hexSchema.parse(hex);
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta / 255 < ACHROMATIC_CHROMA) {
    return (max + min) / 510 < INK_LIGHTNESS ? "ink" : "paper";
  }
  let hue =
    max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  hue *= 60;
  if (hue < 0) hue += 360;
  // Rounding keeps a hue that is exactly on a band edge from slipping under it in floating point.
  hue = Math.round(hue * 1e6) / 1e6;
  if (hue >= 345 || hue < 10) return "red";
  let family: ChromaticFamily = "orange";
  for (const band of HUE_BANDS) if (band.family !== "red" && hue >= band.from) family = band.family;
  return family;
}

export type LineupAudit = {
  entries: { name: string; hex: string; family: HueFamily }[];
  /** Families with two or more entries, achromatic ones included, sorted. */
  crowded: HueFamily[];
  /** Chromatic families that are not crowded, sorted. */
  gaps: ChromaticFamily[];
};

const byText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export function auditLineup(lineup: readonly LineupEntry[]): LineupAudit {
  const entries = lineup
    .map((entry) => ({
      name: entry.name,
      hex: entry.hex.toUpperCase(),
      family: classifyHex(entry.hex),
    }))
    .sort((a, b) => byText(a.name, b.name) || byText(a.hex, b.hex));
  const counts = new Map<HueFamily, number>();
  for (const entry of entries) counts.set(entry.family, (counts.get(entry.family) ?? 0) + 1);
  const crowded = [...counts].filter(([, n]) => n >= 2).map(([family]) => family);
  crowded.sort(byText);
  const gaps = CHROMATIC_FAMILIES.filter((family) => !crowded.includes(family)).sort(byText);
  return { entries, crowded, gaps };
}
