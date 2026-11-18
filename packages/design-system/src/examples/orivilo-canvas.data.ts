/**
 * The data of the ORIVILO canvas prototype page (ORV-274 tech notes, "The prototype page"; slice
 * ORV-278). Every node, edge, preview page, board piece, book page and image of the page is a
 * typed record here, and the words are message keys under `orvCanvas`, so rewording or reordering
 * is a data and copy edit. Quotes, the brand's own lines, type samples, hex values, version keys,
 * paths and image ids are literal data, as the design's "Copy" section rules.
 *
 * No JSX and no colour in the art: a flood or an ink is a `Paint`, a token name and a mode. The
 * hex values live in `PALETTE`, `NODES` (history, contrast and the demo's read back) and the image
 * prompts only. These types are page-local and are not exported from the package.
 */
import type {
  BoardEdge,
  BoardNode,
  Graph,
  NodeContent,
  PortSpec,
} from "../components/canvas-board/graph";
import { type FillParams, fill, type Messages } from "../i18n/messages/index";
import type { EdgeMeaning, PortKind } from "../tokens/canvas";

type Copy = Messages["orvCanvas"];
/** A dotted path to a string leaf of `orvCanvas`, such as "direction.people". */
type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];
export type CopyKey = Leaves<Copy>;

export type ChapterId =
  "brief" | "direction" | "logo" | "colour" | "inUse" | "brandbook" | "system" | "product";
export type SequenceId = "direction" | "logo" | "type" | "palette" | "inUse" | "book" | "pages";
export type ImageId =
  | "brand-hero"
  | "direction-team"
  | "colour-reference"
  | "direction-making"
  | "direction-place"
  | "scene-card"
  | "scene-sign";
export type LiveId = "landing" | "form" | "report";
export type BoardId = "direction" | "inUse";
export type PieceId =
  | "people"
  | "line"
  | "place"
  | "making"
  | "type" // direction board, 5
  | "hero"
  | "icon"
  | "lockup"
  | "phone"
  | "ink"
  | "card"
  | "sign"; // brand in use board, 7
export type PaletteId = "violet" | "violetDark" | "ink" | "canvas" | "lime";
/** The personality axes of the shared catalog group `direction.axes`. */
export type AxisId = "playful" | "expressive" | "structured" | "warm" | "premium";

// Geometry: design px of the 1280 x 800 art unless a comment says otherwise.
export interface Size {
  w: number;
  h: number;
}
export interface Box extends Size {
  x: number;
  y: number;
}
export type Pt = readonly [x: number, y: number];
/** Top start, top end, bottom end, bottom start: percent of the image in a record, px of a tile after quadInTile. */
export type Quad = readonly [Pt, Pt, Pt, Pt];

/**
 * A line of words: a catalog key (with the values of its placeholders) or literal data. Data may
 * hold "\n" for a line break the brand's own line sets by hand.
 */
export type Text = { copy: CopyKey; params?: FillParams } | { data: string };

// Colour in the art: token names only, never a colour value (spec row 41).
// A Paint resolves inside a nested DesignProfileBoundary profile="neutral" of its mode.
export type ArtToken =
  | "brand.signature"
  | "surface.canvas"
  | "surface.card"
  | "text.primary"
  | "text.secondary"
  | "text.brand"
  | "border.subtle"
  | "border.strong"
  | "border.control";
export interface Paint {
  token: ArtToken;
  mode: "light" | "dark";
}
export const VIOLET: Paint = { token: "brand.signature", mode: "light" }; // #7A22C7
export const VIOLET_ON_INK: Paint = { token: "brand.signature", mode: "dark" }; // #B07FEE
export const INK: Paint = { token: "surface.canvas", mode: "dark" }; // #16151D
export const PAPER: Paint = { token: "surface.canvas", mode: "light" }; // #F4F4F0
/** Text inks: the first colour of text on a light flood, and on a dark flood (a dark boundary). */
const TEXT_ON_LIGHT: Paint = { token: "text.primary", mode: "light" };
const TEXT_ON_LIGHT_2: Paint = { token: "text.secondary", mode: "light" };
const TEXT_ON_DARK: Paint = { token: "text.primary", mode: "dark" };
const TEXT_ON_DARK_2: Paint = { token: "text.secondary", mode: "dark" };

// Art type, gap 20. A line is set at display-lg's size times k, or at a scale style.
export type TypeStyle =
  | "display-md"
  | "heading-lg"
  | "heading-md"
  | "heading-sm"
  | "body-lg"
  | "body-md"
  | "body-sm"
  | "body-xs"
  | "code-md"
  | "label-sm"
  | "label-md";
export interface ArtText {
  text: Text; // brand lines, samples and numerals are data (copy-1)
  size: { k: number } | { style: TypeStyle }; // k from 0.8 to 5, no token
  leading?: "display" | "numeral" | 1.05; // with k only; Thai text always renders "display"
  family?: "display" | "thai-body"; // default: display-lg's family; "thai-body" is Sarabun
  ink: Paint;
  maxWidth?: number;
  /** A part of the line set in another ink, such as the Thai half of "Aa กข" in violet on ink. */
  accent?: { match: string; ink: Paint };
}

export type PieceContent =
  | { kind: "photo"; image: ImageId; focus?: Pt } // the treatment comes from the image record
  | {
      kind: "scene";
      image: ImageId;
      face: Size; // the flat face the lockup is laid on, in face units
      surface: Paint; // the polygon of the missing state
      lockup: { width: number; tone: "full" | "one-colour"; mode: "light" | "dark" };
    }
  | { kind: "type"; lines: readonly ArtText[] }
  | { kind: "icon"; side: number; radius: number; mark: number; ground: Paint }
  | { kind: "lockup"; width: number; guides: { dash: number; stroke: number } }
  | {
      kind: "phone";
      width: number;
      ratio: number;
      top: number;
      radius: number;
      bezel: number;
      screenRadius: number;
      screenWidth: number;
    }
  | {
      kind: "ink";
      mark: { size: number; endInset: number; top: number; ring: Paint; dot: Paint };
      lockupSize: number;
      lines: readonly ArtText[];
      action: { label: CopyKey; size: "lg" | "md" };
    }
  | { kind: "lines"; lines: readonly ArtText[] }; // the direction board's `line` piece: words on a flood
export interface PieceRecord {
  id: PieceId;
  board: BoardId;
  box: Box; // in-use boxes come from cellBox()
  flood: Paint; // the tile's ground, and the ground of its missing state
  content: PieceContent;
  caption: CopyKey; // the preview footer's title; the art itself carries no caption
  second: CopyKey; // the preview footer's second line
}
export interface BoardRecord {
  id: BoardId;
  pieces: readonly PieceId[]; // 5 and 7, in the preview's order
  badge: CopyKey; // the node card's meta line: `Badge size="sm"`
  line: CopyKey; // and its body-xs line
  note: CopyKey; // the second caption line of preview page 1
}

export type BookPart = "cover" | "logo" | "colour" | "use";
export type BookLayout =
  | "cover"
  | "contents"
  | "opener"
  | "construction"
  | "grounds"
  | "palette"
  | "type"
  | "voice"
  | "applications"
  | "checks";
export type BookArt =
  | {
      kind: "giant-mark";
      size: number;
      x: number; // the mark's left, px of the page, or of the art panel when `ground` is set
      y: number;
      ring: Paint;
      dot: Paint;
      ground?: Paint; // an opener's art panel, filling the page to the right of the ink half
    }
  | { kind: "fields"; ratio: readonly number[]; paints: readonly Paint[] }
  | { kind: "photo"; image: ImageId; focus: Pt }
  | {
      kind: "pieces";
      pieces: readonly { piece: PieceId; box: Box; variant?: "violet" | "small" }[];
    };
export interface BookPageRecord {
  n: number; // 1 to 12
  part: BookPart;
  section: CopyKey; // the end of the top furniture row
  layout: BookLayout;
  ground: Paint | readonly Paint[]; // one flood, or the thirds of page 5
  split?: true; // an opener: the ink half (704) carries the furniture, the art fills the rest
  lines: readonly ArtText[]; // every line on the page, in reading order
  art?: BookArt;
  swatches?: readonly PaletteId[]; // page 7 reads PALETTE: data colour inline (gap 3)
}

export type Show =
  | { board: BoardId }
  | { piece: PieceId }
  | { book: number }
  | { live: LiveId }
  | { logo: "mark" | "horizontal" | "onInk" }
  | { type: "latin" | "thai" }
  | { palette: "all" | PaletteId };
export interface PreviewPageRecord {
  show: Show;
  caption: CopyKey;
  second?: CopyKey;
}
export interface SequenceRecord {
  id: SequenceId;
  title: CopyKey;
  description?: CopyKey; // DialogContent description; the direction board's is image.label
  pages: readonly PreviewPageRecord[];
}

export type Treatment = "violet" | "paper" | "photo";
export interface ImageCheck {
  subject: string; // what the checker saw, one sentence
  noText: true;
  noMarks: true | { exactlyOne: true; matchesReference: true }; // the object form on brand-hero only
  licence: string;
  checkedBy: string;
  checkedOn: string; // YYYY-MM-DD
}
export interface ImageRecord {
  id: ImageId;
  file: `/orv-274/${ImageId}.webp`;
  promptFile: `${ImageId}.prompt.md`; // beside the WebP: a byte copy of the v1.prompt.md it was made from
  prompt: string; // the text sent to Codex, word for word
  width: number; // of the WebP
  height: number;
  treatment: Treatment;
  quad?: Quad; // the two scenes only: measured corners, percent of the image
  reference?: string; // brand-hero only: the mark image passed to Codex
  generatedWith: string;
  generatedOn: string;
  termsUrl: string;
  check: ImageCheck;
}

/** One row of a list or a sheet. Which fields a row uses depends on the body's `look`. */
export interface RowRecord {
  id: string;
  name: Text | { axis: AxisId };
  value?: Text;
  key?: string; // a version, an origin or a numeral, set in code or numeral style
  number?: number; // a bar's value, a segment's share, a contrast ratio
  palette?: PaletteId; // a segment's colour, from PALETTE
  colours?: readonly string[]; // a version's swatches, data colour
  pair?: { fg: string; bg: string }; // a contrast pair, data colour
  badge?: CopyKey;
  story?: string; // a sheet row: the catalog story that names it
}

export interface PortRecord {
  id: string; // the handle id; unique within its node
  kind: PortKind;
  name: Text;
  row?: string; // a sheet row's id: the port sits at that row's middle
}
export interface ChapterRecord {
  id: ChapterId | "overview";
  number: string | null; // "00" to "07", data
  title: CopyKey;
  anchor: string | null; // the node whose top start corner carries the chapter title at far zoom
  nodes: readonly string[]; // what the chapter button frames; the overview frames the whole board
}
export interface EdgeRecord {
  n: number;
  from: { node: string; port: string };
  to: { node: string; port: string };
  meaning: EdgeMeaning;
  label?: false;
}
export interface FrameRecord {
  id: LiveId;
  story: string; // the catalog story the live page comes from
  width: number; // the page's design width
  height: number; // the frame's height on the node card
  start: number | "report"; // design px down from the top, or at `[data-report]` less `space.inset-md`
}
export interface DemoPoint {
  n: number;
  x: number; // percent of the image
  y: number;
  hex: string; // read back from the made image
}
export type RowsLook =
  | "plain"
  | "pairs"
  | "bars"
  | "chips"
  | "attributes"
  | "named"
  | "reasons"
  | "versions"
  | "segments";
export type BodyRecord =
  | {
      kind: "rows";
      look: RowsLook;
      head?: { text: Text; style: TypeStyle; sub?: Text };
      rows: readonly RowRecord[];
      note?: CopyKey;
    }
  | {
      kind: "quote";
      quote: string;
      lang: "th" | "en";
      gloss?: CopyKey;
      size?: "md"; // body-lg unless set
      note?: CopyKey;
      badges?: readonly CopyKey[];
    }
  | { kind: "board"; board: BoardId } // the board as media, then its meta line
  | { kind: "logo"; part: "build" | "history" | "mark"; note?: CopyKey }
  | { kind: "type" }
  | { kind: "palette" }
  | { kind: "contrast"; rows: readonly RowRecord[] }
  | { kind: "demo"; image: ImageId; points: readonly DemoPoint[] }
  | { kind: "book"; part: BookPart } // the stack: the part's first page and two sheet edges
  | { kind: "sheet"; sheet: "base" | "composed" }
  | { kind: "page"; page: LiveId };
export interface NodeRecord {
  id: string;
  chapter: ChapterId;
  kind: BoardNode["data"]["kind"];
  title: CopyKey;
  width: number;
  x: number;
  y: number;
  pad: "text" | "media";
  open?: { sequence: SequenceId; page: number; count?: number }; // count: the sequence's length unless set
  inputs: readonly PortRecord[];
  outputs: readonly PortRecord[];
  source?: string;
  body: BodyRecord;
}

// ---- helpers

function at<T>(items: readonly T[], i: number): T {
  const item = items[i];
  if (item === undefined) throw new RangeError(`orivilo-canvas: no item at ${i}`);
  return item;
}
const c = (key: CopyKey, params?: FillParams): Text =>
  params ? { copy: key, params } : { copy: key };
const d = (s: string): Text => ({ data: s });
function art(
  text: Text,
  size: ArtText["size"],
  ink: Paint,
  rest: Partial<Pick<ArtText, "leading" | "family" | "maxWidth" | "accent">> = {},
): ArtText {
  return { text, size, ink, ...rest };
}
const port = (id: string, kind: PortKind, name: Text, row?: string): PortRecord =>
  row === undefined ? { id, kind, name } : { id, kind, name, row };

// ---- the brand's own lines (data, never copy)

const TAGLINE = "Give your ideas a world.";
const TAGLINE_TH = "ให้ไอเดีย\nมีตัวตน";
const VOICE_TH = "ให้ไอเดียมีตัวตน\nและไปต่อได้จริง";
const TYPE_SAMPLE = "Aa กข";
const TYPE_FACES = "Inter, Anuphan, Sarabun";

// ---- palette

export const PALETTE: readonly { id: PaletteId; hex: string; name: CopyKey; role: CopyKey }[] = [
  { id: "violet", hex: "#7A22C7", name: "palette.violet", role: "role.violet" },
  { id: "violetDark", hex: "#B07FEE", name: "palette.violetDark", role: "role.violetDark" },
  { id: "ink", hex: "#16151D", name: "palette.ink", role: "role.ink" },
  { id: "canvas", hex: "#F4F4F0", name: "palette.canvas", role: "role.canvas" },
  { id: "lime", hex: "#D9F66F", name: "palette.lime", role: "role.lime" },
];

// ---- images

const MADE_WITH = "Codex CLI, built-in image generation";
const MADE_ON = "2026-11-17";
const TERMS = "https://openai.com/policies/terms-of-use/";
const LICENCE = "AI image made with Codex from the prompt beside it; for this demo only";
const CHECKED_BY = "main session, ORV-274 comment 10653";
const HERO_REFERENCE = "orivilo-mark-on-ink.svg.png, the real mark rendered from its SVG";

function check(subject: string, noMarks: ImageCheck["noMarks"] = true): ImageCheck {
  return {
    subject,
    noText: true,
    noMarks,
    licence: LICENCE,
    checkedBy: CHECKED_BY,
    checkedOn: MADE_ON,
  };
}

export const IMAGES: readonly ImageRecord[] = [
  {
    id: "brand-hero",
    file: "/orv-274/brand-hero.webp",
    promptFile: "brand-hero.prompt.md",
    prompt: `Use case: Hero photograph for a brand identity presentation page of ORIVILO, a platform that helps founders turn what they want their brand to be into real things. The whole picture is flooded with the brand's violet, the way a brand guideline page stages one colour across wall, floor and furniture.
Asset type: Art-directed studio brand photograph, 3:4 portrait.
Primary request: One Thai woman founder in her early thirties in a studio set that is entirely saturated violet (close to #7A22C7): seamless violet wall, violet floor, and a simple violet block table beside her. She wears a plain near-black (#16151D) crewneck sweatshirt with the brand mark from the reference image printed small and flat on the left chest, and off-white trousers. She is caught mid-work, leaning one hip on the table, holding up one large blank off-white paper card and looking at it with a relaxed, genuinely pleased face. A few more blank off-white cards lie on the violet table.
The mark: reproduce it exactly as in the reference image and nothing else: one thick open ring, open at the upper right, with one round dot sitting in that gap. The ring is white, the dot is light violet. About 5 cm wide on the chest, flat print, crisp edges, not distorted, not redrawn, no extra shapes, no letters.
Scene/backdrop: Seamless violet studio cyclorama, no props other than the violet block table and the paper cards. Clean, bold, graphic.
Style/medium: Contemporary editorial brand photography, real person, natural skin, 50 mm lens, sharp focus on the person, full colour, high saturation in the violet set, true near-black and off-white.
Composition/framing: Portrait frame. She stands slightly right of centre, seen from mid-thigh up, with clear violet space above her head and on the left. The chest mark is fully visible and faces the camera.
Lighting/mood: Soft large studio light from the upper left, gentle shadow on the violet wall. Confident, warm, playful but orderly; the thrill of starting something new.
Color palette: Violet #7A22C7 across the whole set; near-black #16151D sweatshirt; off-white #F2F1EC cards and trousers; natural skin tones. No other colours.
Text (verbatim): none.
Constraints: No readable text, letters or numbers anywhere. Exactly one brand mark in the picture, on the chest. No other logos. No screens, phones or laptops. Hands have five natural fingers. She does not look at the camera and does not point.
Avoid: stock-photo grin, thumbs up, pointing, business suit, headphones, gradients, neon glow, lens flare, lime or green, purple that drifts to blue or pink, heavy vignette, CGI or plastic skin, watermark, border, frame, transparent areas. The image is fully opaque and fills every pixel to all four edges.`,
    width: 1086,
    height: 1448,
    treatment: "photo",
    reference: HERO_REFERENCE,
    generatedWith: MADE_WITH,
    generatedOn: MADE_ON,
    termsUrl: TERMS,
    check: check(
      "A Thai woman founder in a violet studio holding a blank card, with the real mark printed small on her dark sweatshirt",
      { exactlyOne: true, matchesReference: true },
    ),
  },
  {
    id: "direction-team",
    file: "/orv-274/direction-team.webp",
    promptFile: "direction-team.prompt.md",
    prompt: `Use case: Direction board (mood board made before any logo exists) for a brand whose intent is "make intent tangible": it helps founders and small teams turn what they want their brand to be into things they can build. Intent lines this image shows: "a small team trying things out, real materials, the making process, details of the work" and "the thrill of starting something new, with space and structure that help decide".
Asset type: Documentary photograph, 4:3 landscape, 1448x1086.
Primary request: A small founding team of three in their late twenties and thirties, Thai, deciding the direction of their brand together at one large table, working with real printed material, caught in the middle of the work.
Scene/backdrop: A bright, uncluttered studio with a pale plaster wall and a large window out of frame on the left. One wide pale wooden table. Plenty of empty wall and empty table.
Subject: On the table, an ordered spread of printed colour swatches, blank paper cards and a few sheets with soft unreadable grey blocks where type would be, laid in loose rows. One person leans in and places a single violet swatch into a row of off-white, grey and near-black swatches. A second person holds two cards side by side, comparing. A third stands a little back, watching, relaxed. Everyday clothes in plain muted colours. Natural, unposed, quietly glad faces; nobody looks at the camera.
Style/medium: Candid editorial documentary photography, natural colour, 35 mm lens, shallow but not extreme depth of field, focus on the hands and the swatches.
Composition/framing: Shot from standing height at a slight downward angle across the table. The hands and the swatch rows sit in the lower right two thirds; the upper left third is quiet wall and light. People are partly cropped by the frame.
Lighting/mood: Soft late-morning daylight from the left, gentle shadows. Calm, focused, hopeful; the start of something.
Color palette: Warm off-white, pale wood, soft grey, near-black, and one clear violet close to #7A22C7 only on the swatch being placed and one more swatch on the table.
Materials/textures: Matte paper, pale wood grain, cotton and linen clothing.
Text (verbatim): none.
Constraints: No readable text, letters, numbers or symbols anywhere. No logos or brand marks of any kind. No screens showing content: no laptop, phone or monitor in view. No pointing at a screen. Hands have five natural fingers.
Avoid: stock-photo poses, staged laughing, business suits, whiteboards with writing, sticky-note walls, sparkles, robots, neon glow, rainbow gradients, lime or green accents, heavy vignette, CGI look, watermark, border, frame, transparent areas. The image is fully opaque and fills every pixel to all four edges.`,
    width: 1448,
    height: 1086,
    treatment: "violet",
    generatedWith: MADE_WITH,
    generatedOn: MADE_ON,
    termsUrl: TERMS,
    check: check(
      "Three people at a wide pale table placing colour swatches and cards in rows, with no screens in view",
    ),
  },
  {
    id: "colour-reference",
    file: "/orv-274/colour-reference.webp",
    promptFile: "colour-reference.prompt.md",
    prompt: `Use case: Demo of reading colours from an image, for the ORIVILO concept canvas. The image is made from the ORIVILO palette.
Asset type: Photographic still life, 4:3 landscape, 1448x1086.
Primary request: An arranged still life whose five large colour areas are exactly the ORIVILO palette, each area flat and evenly lit so a colour can be sampled.
Scene/backdrop: Matte paper, colour #F4F4F0, covering the left half.
Subject: A violet #7A22C7 ceramic bowl, a lime #D9F66F clay block, an ink #16151D paper sheet covering the lower right quarter, a white #FFFFFF card, all apart from each other.
Style/medium: Editorial still-life photograph, real materials, colour-accurate, no grading.
Composition/framing: Top-down, the four objects spread so each has a flat area of at least one tenth of the frame.
Lighting/mood: Even, soft, colour-neutral daylight (5000 K), minimal shadows.
Color palette: #F4F4F0, #7A22C7, #D9F66F, #16151D, #FFFFFF.
Materials/textures: Matte paper, matte glazed ceramic, unglazed clay, matte card.
Text (verbatim): none.
Constraints: No text, letters, numbers or symbols anywhere. No logos, brand marks or recognisable products. No people or hands. No ring with a dot, no open circle with a dot, nothing that reads as a logo. No gloss or reflections on the colour areas.
Avoid: sparkles, robots, brains, infinity signs, rainbow gradients, coral or peach tones, neon glow, glossy 3D render look, heavy vignette, watermark, border, frame, transparent areas. The image is fully opaque and fills every pixel to all four edges.`,
    width: 1448,
    height: 1086,
    treatment: "photo",
    generatedWith: MADE_WITH,
    generatedOn: MADE_ON,
    termsUrl: TERMS,
    check: check(
      "A top-down still life of a violet bowl, a lime clay block, an ink sheet and a white card on cream paper",
    ),
  },
  {
    id: "direction-making",
    file: "/orv-274/direction-making.webp",
    promptFile: "direction-making.prompt.md",
    prompt: `Use case: Mood board photograph for the ORIVILO brand direction, a platform that turns what a founder wants their brand to be into real things. The picture is turned to one violet tone in the layout, so it must read in light and dark shapes alone. Intent line: Make intent tangible; real materials, the making process.
Asset type: Art-directed close-up photograph, 4:3 landscape, 1448x1086.
Primary request: Two hands building a small open paper model, caught in the moment one hand presses a fold into place.
Scene/backdrop: A dark matte worktable, near-black, filling the frame, so the pale paper and the hands stand out as light shapes.
Subject: Two hands with plain sleeves rolled to the forearm; one holds a curved off-white paper form steady, the other presses its edge. A few clean paper offcuts and a bone folder lie on the table. Nothing else.
Style/medium: Contemporary editorial brand photography, real materials, 50 mm macro, sharp focus on the fingertips and the paper edge, full colour.
Composition/framing: Seen from above at about 60 degrees. The model and the hands sit in the left two thirds, large in frame; the right third is empty dark table. Strong diagonal from lower left to upper right.
Lighting/mood: One soft key light from the upper left, deep shadow on the table, bright paper edges. Careful, concrete, unhurried.
Color palette: Near-black #16151D table, off-white #F2F1EC paper, natural skin tones. No other colours.
Text (verbatim): none.
Constraints: No readable text, letters, numbers or symbols anywhere. No logos or brand marks of any kind. No screens. No ring with a dot, no open circle with a dot, nothing that reads as a logo. Hands have five natural fingers. Strong separation of light and dark so the picture reads when turned to one colour: a light subject against a darker ground, large simple shapes. Plain sleeves, no jewellery, no rings, no watch.
Avoid: stock-photo poses, staged laughing, business suits, whiteboards with writing, sticky-note walls, sparkles, robots, brains, infinity signs, neon glow, rainbow gradients, lime or green accents, busy patterns, heavy vignette, CGI look, watermark, border, frame, transparent areas. Pale or mid-grey table, scattered tools, coloured paper. The image is fully opaque and fills every pixel to all four edges.`,
    width: 1448,
    height: 1086,
    treatment: "violet",
    generatedWith: MADE_WITH,
    generatedOn: MADE_ON,
    termsUrl: TERMS,
    check: check("Two hands pressing a fold into a small curved paper model on a dark table"),
  },
  {
    id: "direction-place",
    file: "/orv-274/direction-place.webp",
    promptFile: "direction-place.prompt.md",
    prompt: `Use case: Mood board photograph for the ORIVILO brand direction. The picture is turned to a soft paper tone in the layout, so it must read in light and dark shapes alone. Intent line: the thrill of starting something new, with space and structure that help decide.
Asset type: Art-directed interior photograph, 4:3 landscape, 1448x1086.
Primary request: A bright, nearly empty studio in the morning, ready for work to begin, with long shadows that draw a clear structure across the floor.
Scene/backdrop: A large room with pale plaster walls and a pale concrete floor; a tall window out of frame on the left throws a grid of light and window-bar shadows across the floor and the far wall.
Subject: One long pale table, empty but for a short stack of blank off-white paper, and one simple chair pushed in. Open floor and wall around it.
Style/medium: Contemporary editorial architecture photography, natural colour, 35 mm lens, level camera.
Composition/framing: Camera at standing height, level. The table in the lower third, off centre to the left; the shadow grid fills the right half. Large calm areas of wall.
Lighting/mood: Low morning sun, crisp long shadows, high contrast between lit and shaded areas. Calm, open, expectant.
Color palette: Off-white #F2F1EC walls, pale concrete, pale wood, near-black #16151D chair. No other colours.
Text (verbatim): none.
Constraints: No readable text, letters, numbers or symbols anywhere. No logos or brand marks of any kind. No screens. No ring with a dot, no open circle with a dot, nothing that reads as a logo. Strong separation of light and dark so the picture reads when turned to one colour: large simple shapes. No people.
Avoid: stock-photo poses, business suits, whiteboards with writing, sticky-note walls, sparkles, robots, brains, infinity signs, neon glow, rainbow gradients, lime or green accents, busy patterns, heavy vignette, CGI look, watermark, border, frame, transparent areas. Plants, furniture clutter, coloured objects. The image is fully opaque and fills every pixel to all four edges.`,
    width: 1448,
    height: 1086,
    treatment: "paper",
    generatedWith: MADE_WITH,
    generatedOn: MADE_ON,
    termsUrl: TERMS,
    check: check(
      "A bright, nearly empty studio with a long table, one chair and window shadows across the floor",
    ),
  },
  {
    id: "scene-card",
    file: "/orv-274/scene-card.webp",
    promptFile: "scene-card.prompt.md",
    prompt: `Use case: Brand scene for the ORIVILO brand identity presentation. A blank business card on a violet desk; the real logo is placed on the card face later in the layout, so the card must stay completely blank.
Asset type: Art-directed still-life photograph, 1:1 square, 1254x1254.
Primary request: One blank white business card lying on a desk whose whole surface is saturated violet (close to #7A22C7), seen from about 45 degrees above.
Scene/backdrop: The violet desk fills the frame edge to edge; at the top a violet wall meets it in a soft curve, the same violet.
Subject: One blank white card, standard business card proportions, lying flat. Its four corners sit near these points of the frame, from the top left corner of the card clockwise: 24% across and 38% down; 72% across and 30% down; 78% across and 58% down; 30% across and 67% down. A second card lies half under it, also blank. A pencil in near-black lies at the lower edge.
Style/medium: Contemporary editorial brand photography, real paper, sharp focus on the card, full colour, high saturation in the violet set.
Composition/framing: Square. The card large and slightly right of centre, its long side rising gently to the right. Clear violet space around it.
Lighting/mood: Soft large light from the upper left, a short soft shadow under the card's lower edge. Bold, graphic, calm.
Color palette: Violet #7A22C7 across the set; white #FFFFFF cards; near-black #16151D pencil. No other colours.
Text (verbatim): none.
Constraints: Exactly one flat blank surface for the mark (the top card's face), its four corners near the targets above, evenly lit, with no glare, curl or text on it. That surface is one even white with nothing on it: no texture, print, emboss or edge colour. No text, letters, numbers, logos, marks, icons or interface anywhere in the image. No people and no hands.
Avoid: mockup-template look, glossy reflections, clutter, sparkles, neon glow, gradients, purple that drifts to blue or pink, lime or green, heavy vignette, CGI look, watermark, border, frame, transparent areas. Wood, marble, plants, a laptop, a coffee cup. The image is fully opaque and fills every pixel to all four edges.`,
    width: 1254,
    height: 1254,
    treatment: "photo",
    // Measured on the made image, percent of the image (design revision 5.1, "04 Brand in use").
    quad: [
      [21.7, 39.7],
      [72.7, 31.8],
      [78.7, 61.5],
      [27.4, 68.2],
    ],
    generatedWith: MADE_WITH,
    generatedOn: MADE_ON,
    termsUrl: TERMS,
    check: check(
      "A blank white business card on a violet desk, a second card half under it and a pencil",
    ),
  },
  {
    id: "scene-sign",
    file: "/orv-274/scene-sign.webp",
    promptFile: "scene-sign.prompt.md",
    prompt: `Use case: Brand scene for the ORIVILO brand identity presentation. A blank violet wall panel in a dark entrance; the real logo is placed on the panel later in the layout, so the panel must stay completely blank.
Asset type: Art-directed architectural photograph, 1:1 square, 1254x1254.
Primary request: One flat rectangular violet panel (close to #7A22C7) mounted on a near-black wall, seen from the left at about 25 degrees.
Scene/backdrop: A near-black matte wall (#16151D) and a dark floor; nothing else in the room.
Subject: One flat matte violet panel, about twice as wide as it is tall, with square corners, lit evenly. Its four corners sit near these points of the frame, from the top left corner of the panel clockwise: 18% across and 30% down; 82% across and 23% down; 82% across and 69% down; 18% across and 61% down.
Style/medium: Contemporary architectural photography, real materials, sharp focus, full colour.
Composition/framing: Square. The panel fills the middle of the frame, its right edge nearer the camera than its left.
Lighting/mood: One soft wash light from above evenly lighting the panel, the wall falling off to near-black at the edges. Confident, quiet.
Color palette: Violet #7A22C7 panel; near-black #16151D wall and floor. No other colours.
Text (verbatim): none.
Constraints: Exactly one flat blank surface for the mark (the panel), its four corners near the targets above, evenly lit, with no glare, curl or text on it. The panel face is one even violet with no seams, screws, letters or reflections. No text, letters, numbers, logos, marks, icons or interface anywhere in the image. No people and no hands.
Avoid: mockup-template look, glossy reflections, a second blank surface, clutter, sparkles, neon glow, gradients, purple that drifts to blue or pink, lime or green, heavy vignette, CGI look, watermark, border, frame, transparent areas. Neon tubes, backlit glow, plants, a reception desk, a person. The image is fully opaque and fills every pixel to all four edges.`,
    width: 1254,
    height: 1254,
    treatment: "photo",
    quad: [
      [16.7, 32.3],
      [82.8, 24.1],
      [82.8, 71.2],
      [16.7, 64.8],
    ],
    generatedWith: MADE_WITH,
    generatedOn: MADE_ON,
    termsUrl: TERMS,
    check: check("A blank violet panel on a near-black wall in a dark entrance"),
  },
];

// ---- the scene quad helper (gap 22)

/** The cover crop of an image in a tile: scale s and offset (dx, dy) in tile px. */
export function coverCrop(tile: Size, image: Size): { s: number; dx: number; dy: number } {
  const s = Math.max(tile.w / image.w, tile.h / image.h);
  return { s, dx: (tile.w - image.w * s) / 2, dy: (tile.h - image.h * s) / 2 };
}

/** A record's quad, percent of the image, in tile px through the cover crop. */
export function quadInTile(quad: Quad, tile: Size, image: Size): Quad {
  const { s, dx, dy } = coverCrop(tile, image);
  const map = ([x, y]: Pt): Pt => [dx + (x / 100) * image.w * s, dy + (y / 100) * image.h * s];
  return [map(at(quad, 0)), map(at(quad, 1)), map(at(quad, 2)), map(at(quad, 3))];
}

/**
 * The homography H = [[a, b, c], [d, e, f], [g, h, 1]] (row major, 9 values) that takes the face
 * rectangle (0, 0) to (w, h) onto `to`, corners in Quad order. Solved as an 8 x 8 system.
 */
export function homography(face: Size, to: Quad): readonly number[] {
  const from: readonly Pt[] = [
    [0, 0],
    [face.w, 0],
    [face.w, face.h],
    [0, face.h],
  ];
  // Each corner gives two rows of: a x + b y + c - g x u - h y u = u, and the same for d, e, f, v.
  const m: number[][] = [];
  from.forEach(([x, y], i) => {
    const [u, v] = at(to, i);
    m.push([x, y, 1, 0, 0, 0, -x * u, -y * u, u], [0, 0, 0, x, y, 1, -x * v, -y * v, v]);
  });
  // Gauss-Jordan with partial pivoting.
  for (let col = 0; col < 8; col++) {
    let best = col;
    for (let r = col + 1; r < 8; r++) {
      if (Math.abs(at(at(m, r), col)) > Math.abs(at(at(m, best), col))) best = r;
    }
    const swap = at(m, col);
    m[col] = at(m, best);
    m[best] = swap;
    const pivotRow = at(m, col);
    const pivot = at(pivotRow, col);
    for (let k = col; k < 9; k++) pivotRow[k] = at(pivotRow, k) / pivot;
    for (let r = 0; r < 8; r++) {
      if (r === col) continue;
      const row = at(m, r);
      const factor = at(row, col);
      if (factor === 0) continue;
      for (let k = col; k < 9; k++) row[k] = at(row, k) - factor * at(pivotRow, k);
    }
  }
  return [...m.map((row) => at(row, 8)), 1];
}

/**
 * The CSS transform of a face-sized box with transform-origin 0 0 in the tile:
 * `matrix3d(a, d, 0, g, b, e, 0, h, 0, 0, 1, 0, c, f, 0, 1)` (CSS lists columns).
 */
export function placeOnQuad(quad: Quad, face: Size, tile: Size, image: Size): string {
  const [a, b, cc, dd, e, f, g, h] = homography(face, quadInTile(quad, tile, image));
  return `matrix3d(${[a, dd, 0, g, b, e, 0, h, 0, 0, 1, 0, cc, f, 0, 1].join(", ")})`;
}

// ---- the two boards (12 pieces)

/**
 * The brand in use grid: 5 columns of 246.4 and 3 rows of 776 / 3 (258.67), gutter 12, so
 * `x = col * 258.4`, `y = row * (776 / 3 + 12)`, columns and rows from 0.
 */
export function cellBox(cell: { col: number; row: number; cols: number; rows: number }): Box {
  return {
    x: cell.col * 258.4,
    y: cell.row * (776 / 3 + 12),
    w: cell.cols * 246.4 + (cell.cols - 1) * 12,
    h: (cell.rows * 776) / 3 + (cell.rows - 1) * 12,
  };
}

export const PIECES: readonly PieceRecord[] = [
  {
    id: "people",
    board: "direction",
    box: { x: 0, y: 0, w: 788, h: 494 },
    flood: VIOLET,
    content: { kind: "photo", image: "direction-team", focus: [50, 45] },
    caption: "direction.people",
    second: "direction.violetSub",
  },
  {
    id: "line",
    board: "direction",
    box: { x: 800, y: 0, w: 480, h: 494 },
    flood: PAPER,
    content: {
      kind: "lines",
      lines: [
        art(d(TAGLINE_TH), { k: 1.55 }, TEXT_ON_LIGHT, { leading: "display" }),
        art(d(TAGLINE), { style: "display-md" }, TEXT_ON_LIGHT_2),
      ],
    },
    caption: "direction.feeling",
    second: "direction.lineSub",
  },
  {
    id: "place",
    board: "direction",
    box: { x: 0, y: 506, w: 388, h: 294 },
    flood: PAPER,
    content: { kind: "photo", image: "direction-place" },
    caption: "direction.place",
    second: "direction.paperSub",
  },
  {
    id: "making",
    board: "direction",
    box: { x: 400, y: 506, w: 388, h: 294 },
    flood: VIOLET,
    content: { kind: "photo", image: "direction-making" },
    caption: "direction.making",
    second: "direction.violetSub",
  },
  {
    id: "type",
    board: "direction",
    box: { x: 800, y: 506, w: 480, h: 294 },
    flood: INK,
    content: {
      kind: "type",
      lines: [
        art(d(TYPE_SAMPLE), { k: 2.5 }, TEXT_ON_DARK, {
          accent: { match: "กข", ink: VIOLET_ON_INK },
        }),
        art(d(TYPE_FACES), { style: "body-sm" }, TEXT_ON_DARK_2),
      ],
    },
    caption: "direction.type",
    second: "direction.typeSub",
  },
  {
    id: "hero",
    board: "inUse",
    box: cellBox({ col: 0, row: 0, cols: 2, rows: 2 }),
    flood: VIOLET,
    content: { kind: "photo", image: "brand-hero", focus: [50, 34] },
    caption: "use.hero",
    second: "use.heroSub",
  },
  {
    id: "icon",
    board: "inUse",
    box: cellBox({ col: 2, row: 0, cols: 1, rows: 1 }),
    flood: VIOLET,
    content: { kind: "icon", side: 0.52, radius: 0.225, mark: 0.62, ground: INK },
    caption: "use.icon",
    second: "use.drawn",
  },
  {
    id: "lockup",
    board: "inUse",
    box: cellBox({ col: 3, row: 0, cols: 2, rows: 1 }),
    flood: VIOLET,
    content: { kind: "lockup", width: 0.86, guides: { dash: 7, stroke: 1.6 } },
    caption: "use.lockup",
    second: "use.drawn",
  },
  {
    id: "phone",
    board: "inUse",
    box: cellBox({ col: 2, row: 1, cols: 1, rows: 2 }),
    flood: VIOLET,
    content: {
      kind: "phone",
      width: 0.84,
      ratio: 2.06,
      top: 0.16,
      radius: 0.15,
      bezel: 0.035,
      screenRadius: 0.12,
      screenWidth: 390,
    },
    caption: "use.phone",
    second: "use.phoneSub",
  },
  {
    id: "ink",
    board: "inUse",
    box: cellBox({ col: 3, row: 1, cols: 2, rows: 2 }),
    flood: INK,
    content: {
      kind: "ink",
      mark: { size: 1.12, endInset: 0.62, top: -0.2, ring: VIOLET, dot: VIOLET_ON_INK },
      lockupSize: 30,
      lines: [art(d(TAGLINE), { k: 1.2 }, TEXT_ON_DARK, { maxWidth: 330 })],
      action: { label: "use.start", size: "lg" },
    },
    caption: "use.ink",
    second: "use.inkSub",
  },
  {
    id: "card",
    board: "inUse",
    box: cellBox({ col: 0, row: 2, cols: 1, rows: 1 }),
    flood: VIOLET,
    content: {
      kind: "scene",
      image: "scene-card",
      face: { w: 350, h: 200 },
      surface: { token: "surface.card", mode: "light" },
      lockup: { width: 0.56, tone: "full", mode: "light" },
    },
    caption: "use.card",
    second: "use.sceneSub",
  },
  {
    id: "sign",
    board: "inUse",
    box: cellBox({ col: 1, row: 2, cols: 1, rows: 1 }),
    flood: INK,
    content: {
      kind: "scene",
      image: "scene-sign",
      face: { w: 600, h: 300 },
      surface: VIOLET,
      lockup: { width: 0.65, tone: "one-colour", mode: "dark" },
    },
    caption: "use.sign",
    second: "use.sceneSub",
  },
];

export const BOARDS: Readonly<Record<BoardId, BoardRecord>> = {
  direction: {
    id: "direction",
    pieces: ["people", "line", "place", "making", "type"],
    badge: "direction.badge",
    line: "direction.noLogo",
    note: "direction.note",
  },
  inUse: {
    id: "inUse",
    pieces: ["hero", "icon", "lockup", "phone", "ink", "card", "sign"],
    badge: "use.badge",
    line: "use.noteShort",
    note: "use.note",
  },
};

// ---- the brandbook (12 pages)

export const BOOK_FRAME = {
  size: { w: 1280, h: 800 } satisfies Size,
  pad: { top: 36, side: 48, bottom: 30 } as const,
  mark: 20,
  gap: 24,
  inkHalf: 704,
} as const;

/** The three section names of the contents page and the opener pages, with their first pages. */
const SECTIONS: readonly { numeral: string; name: CopyKey; page: string }[] = [
  { numeral: "01", name: "wall.logo", page: "03" },
  { numeral: "02", name: "wall.colourAndType", page: "06" },
  { numeral: "03", name: "wall.inUse", page: "10" },
];

/** An opener's ink half: the numeral, the section name, then its two or three pages in code and words. */
function openerLines(
  numeral: string,
  name: CopyKey,
  pages: readonly { n: string; name: CopyKey }[],
): ArtText[] {
  return [
    art(d(numeral), { k: 5 }, VIOLET_ON_INK, { leading: "numeral" }),
    art(c(name), { k: 1.3 }, TEXT_ON_DARK),
    ...pages.flatMap((p) => [
      art(d(p.n), { style: "code-md" }, TEXT_ON_DARK_2),
      art(c(p.name), { style: "body-md" }, TEXT_ON_DARK),
    ]),
  ];
}

/** One column of the type page: the face, its weights, its role, its glyphs, its alphabet and a sample. */
function typeColumn(
  face: string,
  role: CopyKey,
  glyphs: string,
  alphabet: string,
  sample: ArtText["text"],
  sampleStyle: TypeStyle,
  family: ArtText["family"],
): ArtText[] {
  const own = family === undefined ? {} : { family };
  return [
    art(d(face), { style: "heading-md" }, TEXT_ON_LIGHT, own),
    art(d("400 500 600"), { style: "code-md" }, TEXT_ON_LIGHT_2),
    art(c(role), { style: "body-sm" }, TEXT_ON_LIGHT_2),
    art(d(glyphs), { k: 3.4 }, TEXT_ON_LIGHT, own),
    art(d(alphabet), { style: "body-md" }, TEXT_ON_LIGHT_2, own),
    art(sample, { style: sampleStyle }, TEXT_ON_LIGHT, own),
  ];
}

const ALPHABET_LATIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz";
const ALPHABET_THAI = "กขคงจฉชซญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ";
const PITCH_TH =
  "Orivilo ช่วยคุณค้นหาตัวตนของแบรนด์ แล้วเชื่อมไปสู่โลโก้ สี ระบบออกแบบ และผลิตภัณฑ์ดิจิทัล ผ่าน AI และพื้นที่ทำงานที่ทีมร่วมเลือก ทดลอง และพัฒนาต่อได้";

export const BOOK: readonly BookPageRecord[] = [
  {
    n: 1,
    part: "cover",
    section: "wall.cover",
    layout: "cover",
    ground: VIOLET,
    lines: [art(c("wall.coverTitle"), { k: 1.9 }, TEXT_ON_DARK, { leading: 1.05 })],
    art: { kind: "giant-mark", size: 980, x: 560, y: -40, ring: INK, dot: PAPER },
  },
  {
    n: 2,
    part: "cover",
    section: "wall.contents",
    layout: "contents",
    ground: PAPER,
    lines: [
      art(c("wall.contents"), { k: 1.15 }, TEXT_ON_LIGHT),
      ...SECTIONS.flatMap((s) => [
        art(d(s.numeral), { k: 3.2 }, VIOLET, { leading: "numeral" }),
        art(c(s.name), { style: "display-md" }, TEXT_ON_LIGHT),
        art(c("wall.page", { page: s.page }), { style: "body-md" }, TEXT_ON_LIGHT_2),
      ]),
    ],
  },
  {
    n: 3,
    part: "logo",
    section: "wall.s1",
    layout: "opener",
    ground: INK,
    split: true,
    lines: openerLines("01", "wall.logo", [
      { n: "04", name: "wall.constructionPage" },
      { n: "05", name: "wall.onGroundsPage" },
    ]),
    art: { kind: "giant-mark", size: 820, x: 68, y: -10, ring: PAPER, dot: PAPER, ground: VIOLET },
  },
  {
    n: 4,
    part: "logo",
    section: "wall.s1",
    layout: "construction",
    ground: PAPER,
    lines: [
      art(c("wall.constructionPage"), { style: "heading-lg" }, TEXT_ON_LIGHT),
      art(c("wall.ringRadius"), { style: "body-sm" }, TEXT_ON_LIGHT_2),
      art(d("52.5"), { style: "body-md" }, TEXT_ON_LIGHT),
      art(c("wall.stroke"), { style: "body-sm" }, TEXT_ON_LIGHT_2),
      art(d("30"), { style: "body-md" }, TEXT_ON_LIGHT),
      art(c("wall.opening"), { style: "body-sm" }, TEXT_ON_LIGHT_2),
      art(d("110°"), { style: "body-md" }, TEXT_ON_LIGHT),
      art(c("wall.dotRadius"), { style: "body-sm" }, TEXT_ON_LIGHT_2),
      art(d("19"), { style: "body-md" }, TEXT_ON_LIGHT),
      art(c("wall.clearSpace"), { style: "body-sm" }, TEXT_ON_LIGHT_2),
      art(c("wall.oneStroke"), { style: "body-md" }, TEXT_ON_LIGHT),
      art(d("96"), { style: "code-md" }, TEXT_ON_LIGHT_2),
      art(d("48"), { style: "code-md" }, TEXT_ON_LIGHT_2),
      art(d("24"), { style: "code-md" }, TEXT_ON_LIGHT_2),
      art(d("16"), { style: "code-md" }, TEXT_ON_LIGHT_2),
      art(c("wall.smallest", { value: 16 }), { style: "body-sm" }, TEXT_ON_LIGHT_2),
    ],
  },
  {
    n: 5,
    part: "logo",
    section: "wall.s1",
    layout: "grounds",
    ground: [VIOLET, INK, PAPER],
    lines: [
      art(c("wall.onViolet"), { style: "body-md" }, TEXT_ON_DARK),
      art(c("wall.onInk"), { style: "body-md" }, TEXT_ON_DARK_2),
      art(c("wall.onPaper"), { style: "body-md" }, TEXT_ON_LIGHT_2),
    ],
  },
  {
    n: 6,
    part: "colour",
    section: "wall.s2",
    layout: "opener",
    ground: INK,
    split: true,
    lines: openerLines("02", "wall.colourAndType", [
      { n: "07", name: "wall.palettePage" },
      { n: "08", name: "wall.typePage" },
      { n: "09", name: "wall.voicePage" },
    ]),
    art: { kind: "fields", ratio: [2.2, 1.4, 5], paints: [PAPER, VIOLET_ON_INK, VIOLET] },
  },
  {
    n: 7,
    part: "colour",
    section: "wall.s2",
    layout: "palette",
    ground: PAPER,
    // The names and the hex of the fields come from PALETTE; the lines are the numerals and roles.
    lines: [
      art(d("60"), { k: 1.6 }, TEXT_ON_LIGHT, { leading: "numeral" }),
      art(c("wall.canvasRole"), { style: "body-sm" }, TEXT_ON_LIGHT_2),
      art(d("30"), { k: 1.6 }, TEXT_ON_DARK, { leading: "numeral" }),
      art(c("wall.inkRole"), { style: "body-sm" }, TEXT_ON_DARK_2),
      art(d("10"), { k: 1.6 }, TEXT_ON_DARK, { leading: "numeral" }),
      art(c("wall.violetRole"), { style: "body-sm" }, TEXT_ON_DARK),
      art(c("role.violetDark"), { style: "body-sm" }, TEXT_ON_LIGHT_2),
      art(c("wall.limeRole"), { style: "body-sm" }, TEXT_ON_LIGHT_2),
    ],
    swatches: ["canvas", "ink", "violet", "violetDark", "lime"],
  },
  {
    n: 8,
    part: "colour",
    section: "wall.s2",
    layout: "type",
    ground: PAPER,
    lines: [
      art(c("wall.typePage"), { k: 1.15 }, TEXT_ON_LIGHT),
      ...typeColumn(
        "Inter",
        "wall.latinRole",
        "Aa",
        ALPHABET_LATIN,
        d(TAGLINE),
        "heading-md",
        undefined,
      ),
      ...typeColumn(
        "Anuphan",
        "wall.thaiHeadRole",
        "กข",
        ALPHABET_THAI,
        d("ให้ไอเดียมีตัวตน"),
        "heading-md",
        undefined,
      ),
      ...typeColumn(
        "Sarabun",
        "wall.thaiBodyRole",
        "กข",
        ALPHABET_THAI,
        d(PITCH_TH),
        "body-md",
        "thai-body",
      ),
    ],
  },
  {
    n: 9,
    part: "colour",
    section: "wall.s2",
    layout: "voice",
    ground: VIOLET,
    lines: [
      art(d(VOICE_TH), { k: 1.9 }, TEXT_ON_DARK, { leading: "display" }),
      art(d(TAGLINE), { k: 0.8 }, TEXT_ON_DARK),
      art(c("wall.voiceLabel"), { style: "body-sm" }, TEXT_ON_DARK),
      art(c("wall.thoughtful"), { style: "display-md" }, TEXT_ON_DARK),
      art(c("wall.voiceLabel"), { style: "body-sm" }, TEXT_ON_DARK),
      art(c("wall.clear"), { style: "display-md" }, TEXT_ON_DARK),
      art(c("wall.voiceLabel"), { style: "body-sm" }, TEXT_ON_DARK),
      art(c("wall.reasoned"), { style: "display-md" }, TEXT_ON_DARK),
    ],
  },
  {
    n: 10,
    part: "use",
    section: "wall.s3",
    layout: "opener",
    ground: INK,
    split: true,
    lines: openerLines("03", "wall.inUse", [
      { n: "11", name: "wall.applications" },
      { n: "12", name: "wall.open" },
    ]),
    art: { kind: "photo", image: "brand-hero", focus: [50, 30] },
  },
  {
    n: 11,
    part: "use",
    section: "wall.s3",
    layout: "applications",
    ground: PAPER,
    lines: [],
    // Boxes in page px; gutter 12 and the page's side padding 48 (1184 wide, 646 high from y 82).
    art: {
      kind: "pieces",
      pieces: [
        { piece: "phone", box: { x: 48, y: 82, w: 300, h: 638 } },
        { piece: "sign", box: { x: 360, y: 82, w: 430, h: 313 } },
        { piece: "card", box: { x: 802, y: 82, w: 430, h: 313 } },
        { piece: "icon", box: { x: 360, y: 407, w: 150, h: 150 }, variant: "violet" },
        { piece: "icon", box: { x: 522, y: 407, w: 150, h: 150 } },
        { piece: "ink", box: { x: 802, y: 407, w: 430, h: 313 }, variant: "small" },
      ],
    },
  },
  {
    n: 12,
    part: "use",
    section: "wall.s3",
    layout: "checks",
    ground: PAPER,
    lines: [
      art(c("wall.open"), { k: 1.15 }, TEXT_ON_LIGHT),
      art(c("wall.openLead"), { style: "body-lg" }, TEXT_ON_LIGHT_2),
      ...(
        [
          ["01", "wall.openSimilarity"],
          ["02", "wall.openLineup"],
          ["03", "wall.openPrint"],
          ["04", "wall.openName"],
        ] as const
      ).flatMap(([n, name]) => [
        art(d(n), { k: 2.6 }, VIOLET, { leading: "numeral" }),
        art(c(name), { style: "display-md" }, TEXT_ON_LIGHT),
      ]),
    ],
  },
];

// ---- the seven preview sequences (6, 3, 2, 6, 8, 12 and 3 pages: 40)

function piecePage(id: PieceId): PreviewPageRecord {
  const piece = PIECES.find((p) => p.id === id);
  if (!piece) throw new RangeError(`orivilo-canvas: no piece ${id}`);
  return { show: { piece: id }, caption: piece.caption, second: piece.second };
}

/** The footer title of each brandbook page in the preview. */
const BOOK_CAPTIONS: readonly CopyKey[] = [
  "wall.cover",
  "wall.contents",
  "wall.s1",
  "wall.constructionPage",
  "wall.onGroundsPage",
  "wall.s2",
  "wall.palettePage",
  "wall.typePage",
  "wall.voicePage",
  "wall.s3",
  "wall.applications",
  "wall.open",
];

export const SEQUENCES: readonly SequenceRecord[] = [
  {
    id: "direction",
    title: "node.directionBoard",
    description: "image.label",
    pages: [
      {
        show: { board: "direction" },
        caption: "preview.directionWhole",
        second: BOARDS.direction.note,
      },
      ...BOARDS.direction.pieces.map(piecePage),
    ],
  },
  {
    id: "logo",
    title: "preview.logo",
    pages: [
      { show: { logo: "mark" }, caption: "preview.mark" },
      { show: { logo: "horizontal" }, caption: "preview.horizontal" },
      { show: { logo: "onInk" }, caption: "preview.onInk" },
    ],
  },
  {
    id: "type",
    title: "node.type",
    pages: [
      { show: { type: "latin" }, caption: "preview.latin" },
      { show: { type: "thai" }, caption: "preview.thai", second: "preview.thaiNote" },
    ],
  },
  {
    id: "palette",
    title: "preview.palette",
    pages: [
      { show: { palette: "all" }, caption: "preview.palette" },
      { show: { palette: "violet" }, caption: "role.violet" },
      { show: { palette: "violetDark" }, caption: "role.violetDark" },
      { show: { palette: "ink" }, caption: "role.ink" },
      { show: { palette: "canvas" }, caption: "role.canvas" },
      { show: { palette: "lime" }, caption: "role.lime" },
    ],
  },
  {
    id: "inUse",
    title: "node.inUseBoard",
    pages: [
      { show: { board: "inUse" }, caption: "preview.inUseWhole", second: BOARDS.inUse.note },
      ...BOARDS.inUse.pieces.map(piecePage),
    ],
  },
  {
    id: "book",
    title: "preview.book",
    pages: BOOK_CAPTIONS.map((caption, i) => ({
      show: { book: i + 1 },
      caption,
      second: "preview.bookSub",
    })),
  },
  {
    id: "pages",
    title: "preview.pages",
    pages: [
      { show: { live: "landing" }, caption: "node.landing", second: "product.landingNote" },
      { show: { live: "form" }, caption: "node.form", second: "product.formNote" },
      { show: { live: "report" }, caption: "node.report", second: "product.reportNote" },
    ],
  },
];

// ---- the product stage: the sheets and the live frames

export const SHEETS: { base: readonly RowRecord[]; composed: readonly RowRecord[] } = {
  base: [
    { id: "button", name: d("Button"), story: "base-button" },
    { id: "badge", name: d("Badge"), story: "base-badge" },
    { id: "field", name: d("Field, Input"), story: "base-field" },
    { id: "radio", name: d("RadioGroup"), story: "base-radio-group" },
    { id: "alert", name: d("Alert"), story: "base-alert" },
  ],
  composed: [
    { id: "card", name: d("Card"), story: "application-card" },
    { id: "header", name: d("PageHeader"), story: "application-page-header" },
    {
      id: "form",
      name: c("node.composedForm"),
      story: "examples-application-brand-report--form",
    },
    { id: "section", name: d("SectionHeader"), story: "application-section-header" },
    { id: "notice", name: d("Notice, ReadingCard") }, // page-local, no catalog entry
  ],
};

export const FRAMES: readonly FrameRecord[] = [
  {
    id: "landing",
    story: "examples-marketing-landing-page--default",
    width: 1280,
    height: 290,
    start: 0,
  },
  {
    id: "form",
    story: "examples-application-brand-report--form",
    width: 800,
    height: 270,
    start: 48,
  },
  {
    id: "report",
    story: "examples-application-brand-report--analysed",
    width: 800,
    height: 420,
    start: "report",
  },
];

// ---- chapters, nodes and edges

export const CHAPTERS: readonly ChapterRecord[] = [
  { id: "overview", number: null, title: "chapter.overview", anchor: null, nodes: [] },
  {
    id: "brief",
    number: "00",
    title: "chapter.brief",
    anchor: "b-ess",
    nodes: ["b-ess", "b-aud", "b-pers", "b-feel", "b-cat", "b-avoid", "b-pos", "b-name"],
  },
  {
    id: "direction",
    number: "01",
    title: "chapter.direction",
    anchor: "d-attr",
    nodes: ["d-attr", "d-board"],
  },
  {
    id: "logo",
    number: "02",
    title: "chapter.logo",
    anchor: "l-idea",
    nodes: ["l-idea", "l-build", "l-hist", "l-logo"],
  },
  {
    id: "colour",
    number: "03",
    title: "chapter.colour",
    anchor: "c-why",
    nodes: ["c-why", "c-hist", "c-prop", "c-pal", "c-con", "c-demo"],
  },
  {
    id: "inUse",
    number: "04",
    title: "chapter.inUse",
    anchor: "u-board",
    nodes: ["t-type", "u-board"],
  },
  {
    id: "brandbook",
    number: "05",
    title: "chapter.brandbook",
    anchor: "bb-cover",
    nodes: ["bb-cover", "bb-logo", "bb-colour", "bb-use"],
  },
  {
    id: "system",
    number: "06",
    title: "chapter.system",
    anchor: "p-base",
    nodes: ["p-base", "p-pat"],
  },
  {
    // The 07 view frames all three levels, so the pages are seen with the parts that make them.
    id: "product",
    number: "07",
    title: "chapter.product",
    anchor: "p-landing",
    nodes: ["p-base", "p-pat", "p-landing", "p-form", "p-report"],
  },
];

const BRIEF = "orivilo-brand-identity-v1.md";
const METHOD = "brand-ci-method.md";
const SPEC = "orivilo-brand-spec-v1.1.md";

const DEMO_POINTS: readonly DemoPoint[] = [
  { n: 1, x: 25, y: 33, hex: "#7A2FA7" },
  { n: 2, x: 74, y: 25, hex: "#D3EF46" },
  { n: 3, x: 80, y: 75, hex: "#19181E" },
  { n: 4, x: 27, y: 78, hex: "#F4F3FC" },
  { n: 5, x: 54, y: 45, hex: "#E3E2E0" },
];

/** A brief card that gives one text output. */
function briefNode(
  id: string,
  title: CopyKey,
  y: number,
  out: { id: string; name: CopyKey },
  source: string,
  body: BodyRecord,
  x = 0,
): NodeRecord {
  return {
    id,
    chapter: "brief",
    kind: "knowledge",
    title,
    width: 280,
    x,
    y,
    pad: "text",
    inputs: [],
    outputs: [port(out.id, "text", c(out.name))],
    source,
    body,
  };
}

export const NODES: readonly NodeRecord[] = [
  // 00 Brief, stage 1
  briefNode("b-ess", "node.essence", 28, { id: "essence", name: "port.essence" }, `${BRIEF} §1`, {
    kind: "rows",
    look: "plain",
    head: {
      text: d("Make intent tangible"),
      style: "heading-md",
      sub: d("ทำให้ความตั้งใจมีรูปร่างและนำไปใช้งานได้"),
    },
    rows: [],
  }),
  briefNode(
    "b-aud",
    "node.audience",
    193,
    { id: "audience", name: "port.audience" },
    `${BRIEF} §2`,
    {
      kind: "rows",
      look: "pairs",
      rows: [
        { id: "founder", name: c("audience.founder"), value: c("audience.founderNeed") },
        { id: "designer", name: c("audience.designer"), value: c("audience.designerNeed") },
        { id: "product", name: c("audience.product"), value: c("audience.productNeed") },
      ],
    },
  ),
  briefNode(
    "b-pers",
    "node.personality",
    458,
    { id: "personality", name: "port.personality" },
    `${BRIEF} §3`,
    {
      kind: "rows",
      look: "bars",
      rows: [
        { id: "playful", name: { axis: "playful" }, number: 65 },
        { id: "expressive", name: { axis: "expressive" }, number: 70 },
        { id: "structured", name: { axis: "structured" }, number: 80 },
        { id: "warm", name: { axis: "warm" }, number: 70 },
        { id: "premium", name: { axis: "premium" }, number: 65 },
      ],
      note: "personality.note",
    },
  ),
  briefNode("b-feel", "node.feeling", 741, { id: "feeling", name: "port.feeling" }, `${BRIEF} §5`, {
    kind: "quote",
    quote: "การเริ่มงานใหม่ที่น่าตื่นเต้น แต่มีพื้นที่และโครงสร้างช่วยให้ตัดสินใจได้",
    lang: "th",
    gloss: "feeling.gloss",
  }),
  briefNode(
    "b-cat",
    "node.category",
    1019,
    { id: "category", name: "port.category" },
    `${METHOD} §5.1`,
    {
      kind: "quote",
      quote: "AI design and brand tools",
      lang: "en",
      gloss: "category.gloss",
      note: "category.crowd",
      badges: ["category.violet", "category.black", "category.cream"],
    },
  ),
  briefNode("b-avoid", "node.avoid", 1287, { id: "avoid", name: "port.avoid" }, `${BRIEF} §5, §9`, {
    kind: "rows",
    look: "chips",
    rows: [
      { id: "sparkles", name: c("avoid.sparkles") },
      { id: "robots", name: c("avoid.robots") },
      { id: "brains", name: c("avoid.brains") },
      { id: "infinity", name: c("avoid.infinity") },
      { id: "rainbow", name: c("avoid.rainbow") },
      { id: "pointing", name: c("avoid.pointing") },
    ],
  }),
  // 00 Brief, stage 2: they feed only the idea of the mark, so they sit above the attributes
  briefNode(
    "b-pos",
    "node.positioning",
    85,
    { id: "onliness", name: "port.onliness" },
    `${METHOD} §2`,
    {
      kind: "quote",
      quote:
        "The only brand platform that keeps every artifact traceable to the business reason behind it.",
      lang: "en",
      size: "md",
      gloss: "positioning.gloss",
    },
    352,
  ),
  briefNode(
    "b-name",
    "node.name",
    321,
    { id: "name", name: "port.name" },
    `${BRIEF} §1`,
    {
      kind: "rows",
      look: "named",
      head: { text: d("Orivilo"), style: "display-md", sub: d("ออริวิโล") },
      rows: [
        { id: "ori", name: c("name.origin"), key: "Ori" },
        { id: "vi", name: c("name.vision"), key: "Vi" },
        { id: "lo", name: c("name.loop"), key: "Lo" },
      ],
    },
    352,
  ),
  // 01 Direction board
  {
    id: "d-attr",
    chapter: "direction",
    kind: "direction",
    title: "node.attributes",
    width: 300,
    x: 352,
    y: 598,
    pad: "text",
    inputs: [
      port("essence", "text", c("port.essence")),
      port("audience", "text", c("port.audience")),
      port("personality", "text", c("port.personality")),
      port("feeling", "text", c("port.feeling")),
      port("category", "text", c("port.category")),
      port("avoid", "text", c("port.avoid")),
    ],
    outputs: [port("attributes", "text", c("port.attributes"))],
    source: `${METHOD} §3; ${BRIEF} §5, §9`,
    body: {
      kind: "rows",
      look: "attributes",
      rows: [
        { id: "composition", name: c("attr.composition"), value: c("attr.compositionValue") },
        { id: "material", name: c("attr.material"), value: c("attr.materialValue") },
        { id: "colourMood", name: c("attr.colourMood"), value: c("attr.colourMoodValue") },
        { id: "type", name: c("attr.type"), value: c("attr.typeValue") },
        { id: "shape", name: c("attr.shape"), value: c("attr.shapeValue") },
      ],
    },
  },
  {
    id: "d-board",
    chapter: "direction",
    kind: "artifact",
    title: "node.directionBoard",
    width: 560,
    x: 724,
    y: 572,
    pad: "media",
    open: { sequence: "direction", page: 1 },
    inputs: [port("attributes", "text", c("port.attributes"))],
    outputs: [port("direction", "image", c("port.direction"))],
    source: `${METHOD} §3`,
    body: { kind: "board", board: "direction" },
  },
  // 02 Logo, top tier
  {
    id: "l-idea",
    chapter: "logo",
    kind: "direction",
    title: "node.idea",
    width: 300,
    x: 1356,
    y: 104,
    pad: "text",
    inputs: [
      port("onliness", "text", c("port.onliness")),
      port("name", "text", c("port.name")),
      port("direction", "image", c("port.direction")),
    ],
    outputs: [port("idea", "text", c("port.idea"))],
    source: `${BRIEF} §9`,
    body: {
      kind: "quote",
      quote: "A loop that does not close, and the dot it stays connected to.",
      lang: "en",
      gloss: "idea.gloss",
    },
  },
  {
    id: "l-build",
    chapter: "logo",
    kind: "artifact",
    title: "node.construction",
    width: 300,
    x: 1356,
    y: 338,
    pad: "text",
    inputs: [],
    outputs: [port("construction", "image", c("port.construction"))],
    source: `${SPEC} §2`,
    body: { kind: "logo", part: "build" },
  },
  {
    id: "l-hist",
    chapter: "logo",
    kind: "artifact",
    title: "node.markHistory",
    width: 300,
    x: 1356,
    y: 514,
    pad: "text",
    inputs: [],
    outputs: [port("earlier", "image", c("port.earlier"))],
    source: `${SPEC} §9 to §13`,
    body: { kind: "logo", part: "history", note: "markHistory.limeNote" },
  },
  {
    id: "l-logo",
    chapter: "logo",
    kind: "artifact",
    title: "node.logo",
    width: 360,
    x: 1704,
    y: 104,
    pad: "media",
    open: { sequence: "logo", page: 1 },
    inputs: [
      port("idea", "text", c("port.idea")),
      port("construction", "image", c("port.construction")),
      port("earlier", "image", c("port.earlier")),
    ],
    outputs: [port("logo", "image", c("port.logo"))],
    source: `${SPEC} §2 to §4`,
    body: { kind: "logo", part: "mark" },
  },
  // 04 Brand in use: the type sits under the logo and feeds the board
  {
    id: "t-type",
    chapter: "inUse",
    kind: "knowledge",
    title: "node.type",
    width: 360,
    x: 1704,
    y: 502,
    pad: "text",
    open: { sequence: "type", page: 1 },
    inputs: [],
    outputs: [port("type", "type", c("port.type"))],
    source: "DESIGN.md §4",
    body: { kind: "type" },
  },
  {
    id: "u-board",
    chapter: "inUse",
    kind: "artifact",
    title: "node.inUseBoard",
    width: 560,
    x: 2136,
    y: 174,
    pad: "media",
    open: { sequence: "inUse", page: 1 },
    inputs: [
      port("logo", "image", c("port.logo")),
      port("palette", "palette", c("port.palette")),
      port("type", "type", c("port.type")),
    ],
    outputs: [port("inUse", "image", c("port.inUse"))],
    source: `${METHOD} §8; ${BRIEF} §8`,
    body: { kind: "board", board: "inUse" },
  },
  // 03 Colour, bottom tier
  {
    id: "c-why",
    chapter: "colour",
    kind: "knowledge",
    title: "node.why",
    width: 300,
    x: 1356,
    y: 785,
    pad: "text",
    inputs: [port("direction", "image", c("port.direction"))],
    outputs: [port("reasons", "text", c("port.reasons"))],
    source: `${METHOD} §3, §5.1; ${SPEC} §10`,
    body: {
      kind: "rows",
      look: "reasons",
      rows: [
        { id: "r1", name: c("why.r1"), key: "1" },
        { id: "r2", name: c("why.r2"), key: "2" },
        { id: "r3", name: c("why.r3"), key: "3" },
      ],
    },
  },
  {
    id: "c-hist",
    chapter: "colour",
    kind: "artifact",
    title: "node.paletteHistory",
    width: 300,
    x: 1356,
    y: 1026,
    pad: "text",
    inputs: [],
    outputs: [port("earlier", "palette", c("port.earlier"))],
    source: `${SPEC} §9, §10`,
    body: {
      kind: "rows",
      look: "versions",
      rows: [
        {
          id: "v1",
          key: "v1",
          name: c("paletteHistory.v1"),
          colours: ["#6D3DF5", "#D9F66F", "#FFB39E", "#20232B", "#F7F6F2"],
        },
        {
          id: "v11",
          key: "v1.1",
          name: c("paletteHistory.v11"),
          colours: ["#7A22C7", "#D9F66F", "#16151D", "#F4F4F0"],
        },
        {
          id: "v12",
          key: "v1.2",
          name: c("paletteHistory.v12"),
          colours: ["#7A22C7", "#16151D", "#F4F4F0", "#D9F66F"],
          badge: "inUse",
        },
      ],
    },
  },
  {
    id: "c-prop",
    chapter: "colour",
    kind: "knowledge",
    title: "node.proportion",
    width: 300,
    x: 1356,
    y: 1216,
    pad: "text",
    inputs: [],
    outputs: [port("proportion", "text", c("port.proportion"))],
    source: `${SPEC} §5`,
    body: {
      kind: "rows",
      look: "segments",
      rows: [
        { id: "canvas", name: c("palette.canvas"), number: 60, palette: "canvas" },
        { id: "ink", name: c("palette.ink"), number: 30, palette: "ink" },
        { id: "violet", name: c("palette.violet"), number: 8.5, palette: "violet" },
        { id: "lime", name: c("palette.lime"), number: 1.5, palette: "lime" },
      ],
      note: "proportion.note",
    },
  },
  {
    id: "c-pal",
    chapter: "colour",
    kind: "artifact",
    title: "node.palette",
    width: 360,
    x: 1704,
    y: 801,
    pad: "media",
    open: { sequence: "palette", page: 1 },
    inputs: [
      port("reasons", "text", c("port.reasons")),
      port("earlier", "palette", c("port.earlier")),
      port("proportion", "text", c("port.proportion")),
    ],
    outputs: [port("palette", "palette", c("port.palette"))],
    source: `${SPEC} §5, §10`,
    body: { kind: "palette" },
  },
  {
    id: "c-con",
    chapter: "colour",
    kind: "knowledge",
    title: "node.contrast",
    width: 360,
    x: 1704,
    y: 1157,
    pad: "text",
    inputs: [],
    outputs: [],
    source: `${SPEC} §5`,
    body: {
      kind: "contrast",
      rows: [
        {
          id: "whiteOnViolet",
          name: c("contrast.whiteOnViolet"),
          number: 7.3,
          pair: { fg: "#FFFFFF", bg: "#7A22C7" },
        },
        {
          id: "inkOnCanvas",
          name: c("contrast.inkOnCanvas"),
          number: 16.4,
          pair: { fg: "#16151D", bg: "#F4F4F0" },
        },
        {
          id: "violetOnCanvas",
          name: c("contrast.violetOnCanvas"),
          number: 6.6,
          pair: { fg: "#7A22C7", bg: "#F4F4F0" },
        },
      ],
    },
  },
  {
    // The one node with no source line: it is a mechanism demo made from the palette, not a
    // finding read from the brief (spec row 19; the design's table names a source, the spec wins).
    id: "c-demo",
    chapter: "colour",
    kind: "reference",
    title: "node.demo",
    width: 360,
    x: 2236,
    y: 861,
    pad: "media",
    inputs: [port("palette", "palette", c("port.palette"))],
    outputs: [],
    body: { kind: "demo", image: "colour-reference", points: DEMO_POINTS },
  },
  // 05 Brandbook: four parts, one book
  {
    id: "bb-cover",
    chapter: "brandbook",
    kind: "artifact",
    title: "node.book",
    width: 360,
    x: 2768,
    y: 113,
    pad: "media",
    open: { sequence: "book", page: 1, count: 12 },
    inputs: [],
    outputs: [port("profile", "profile", c("port.profileOut"))],
    source: SPEC,
    body: { kind: "book", part: "cover" },
  },
  {
    id: "bb-logo",
    chapter: "brandbook",
    kind: "artifact",
    title: "wall.s1",
    width: 360,
    x: 2768,
    y: 429,
    pad: "media",
    open: { sequence: "book", page: 3, count: 3 },
    inputs: [port("logo", "image", c("port.logo"))],
    outputs: [],
    source: `${SPEC} §1, §2`,
    body: { kind: "book", part: "logo" },
  },
  {
    id: "bb-colour",
    chapter: "brandbook",
    kind: "artifact",
    title: "wall.s2",
    width: 360,
    x: 2768,
    y: 745,
    pad: "media",
    open: { sequence: "book", page: 6, count: 4 },
    inputs: [port("palette", "palette", c("port.palette")), port("type", "type", c("port.type"))],
    outputs: [],
    source: `${SPEC} §5; DESIGN.md §4`,
    body: { kind: "book", part: "colour" },
  },
  {
    id: "bb-use",
    chapter: "brandbook",
    kind: "artifact",
    title: "wall.s3",
    width: 360,
    x: 2768,
    y: 1061,
    pad: "media",
    open: { sequence: "book", page: 10, count: 3 },
    inputs: [port("inUse", "image", c("port.inUse"))],
    outputs: [],
    source: `${METHOD} §8; ${BRIEF} §8`,
    body: { kind: "book", part: "use" },
  },
  // 06 Design system
  {
    id: "p-base",
    chapter: "system",
    kind: "artifact",
    title: "node.base",
    width: 300,
    x: 3200,
    y: 28,
    pad: "text",
    inputs: [port("profile", "profile", c("port.profileIn"))],
    outputs: SHEETS.base.map((row) => port(row.id, "profile", row.name as Text, row.id)),
    source: "packages/design-system/src/profiles/source/orivilo.json",
    body: { kind: "sheet", sheet: "base" },
  },
  {
    id: "p-pat",
    chapter: "system",
    kind: "artifact",
    title: "node.composed",
    width: 360,
    x: 3572,
    y: 28,
    pad: "text",
    // Inputs sit on the rows built from the base rows; one output per row.
    inputs: [
      port("fromButton", "profile", d("Button"), "form"),
      port("fromField", "profile", d("Field, Input"), "form"),
      port("fromRadio", "profile", d("RadioGroup"), "form"),
      port("fromBadge", "profile", d("Badge"), "notice"),
      port("fromAlert", "profile", d("Alert"), "notice"),
    ],
    outputs: SHEETS.composed.map((row) => port(row.id, "profile", row.name as Text, row.id)),
    source: "packages/design-system/catalog/",
    body: { kind: "sheet", sheet: "composed" },
  },
  // 07 Product
  {
    id: "p-landing",
    chapter: "product",
    kind: "artifact",
    title: "node.landing",
    width: 480,
    x: 4004,
    y: 28,
    pad: "media",
    open: { sequence: "pages", page: 1 },
    inputs: [port("parts", "profile", c("port.parts"))],
    outputs: [],
    source: "packages/design-system/src/examples/landing.tsx",
    body: { kind: "page", page: "landing" },
  },
  {
    id: "p-form",
    chapter: "product",
    kind: "artifact",
    title: "node.form",
    width: 480,
    x: 4004,
    y: 404,
    pad: "media",
    open: { sequence: "pages", page: 2 },
    inputs: [port("parts", "profile", c("port.parts"))],
    outputs: [],
    source: "packages/design-system/src/examples/brand-report.tsx",
    body: { kind: "page", page: "form" },
  },
  {
    id: "p-report",
    chapter: "product",
    kind: "artifact",
    title: "node.report",
    width: 480,
    x: 4004,
    y: 760,
    pad: "media",
    open: { sequence: "pages", page: 3 },
    inputs: [port("parts", "profile", c("port.parts"))],
    outputs: [],
    source: "packages/design-system/src/examples/brand-report.tsx",
    body: { kind: "page", page: "report" },
  },
];

function edge(
  n: number,
  from: readonly [node: string, port: string],
  to: readonly [node: string, port: string],
  meaning: EdgeMeaning,
  showLabel = false,
): EdgeRecord {
  const base = {
    n,
    from: { node: from[0], port: from[1] },
    to: { node: to[0], port: to[1] },
    meaning,
  };
  return showLabel ? base : { ...base, label: false };
}

// 29 input (9 to 13, 15, 17, 19 to 40), 8 reference (1 to 8), 3 derived (14, 16, 18). Edge 18 alone
// shows its label pill: the palette was not read from the image.
export const EDGES: readonly EdgeRecord[] = [
  edge(1, ["b-pos", "onliness"], ["l-idea", "onliness"], "reference"),
  edge(2, ["b-name", "name"], ["l-idea", "name"], "reference"),
  edge(3, ["b-ess", "essence"], ["d-attr", "essence"], "reference"),
  edge(4, ["b-aud", "audience"], ["d-attr", "audience"], "reference"),
  edge(5, ["b-pers", "personality"], ["d-attr", "personality"], "reference"),
  edge(6, ["b-feel", "feeling"], ["d-attr", "feeling"], "reference"),
  edge(7, ["b-cat", "category"], ["d-attr", "category"], "reference"),
  edge(8, ["b-avoid", "avoid"], ["d-attr", "avoid"], "reference"),
  edge(9, ["d-attr", "attributes"], ["d-board", "attributes"], "input"),
  edge(10, ["d-board", "direction"], ["l-idea", "direction"], "input"),
  edge(11, ["d-board", "direction"], ["c-why", "direction"], "input"),
  edge(12, ["l-idea", "idea"], ["l-logo", "idea"], "input"),
  edge(13, ["l-build", "construction"], ["l-logo", "construction"], "input"),
  edge(14, ["l-hist", "earlier"], ["l-logo", "earlier"], "derived"),
  edge(15, ["c-why", "reasons"], ["c-pal", "reasons"], "input"),
  edge(16, ["c-hist", "earlier"], ["c-pal", "earlier"], "derived"),
  edge(17, ["c-prop", "proportion"], ["c-pal", "proportion"], "input"),
  edge(18, ["c-pal", "palette"], ["c-demo", "palette"], "derived", true),
  edge(19, ["l-logo", "logo"], ["u-board", "logo"], "input"),
  edge(20, ["c-pal", "palette"], ["u-board", "palette"], "input"),
  edge(21, ["t-type", "type"], ["u-board", "type"], "input"),
  edge(22, ["l-logo", "logo"], ["bb-logo", "logo"], "input"),
  edge(23, ["c-pal", "palette"], ["bb-colour", "palette"], "input"),
  edge(24, ["t-type", "type"], ["bb-colour", "type"], "input"),
  edge(25, ["u-board", "inUse"], ["bb-use", "inUse"], "input"),
  edge(26, ["bb-cover", "profile"], ["p-base", "profile"], "input"),
  edge(27, ["p-base", "button"], ["p-pat", "fromButton"], "input"),
  edge(28, ["p-base", "field"], ["p-pat", "fromField"], "input"),
  edge(29, ["p-base", "radio"], ["p-pat", "fromRadio"], "input"),
  edge(30, ["p-base", "badge"], ["p-pat", "fromBadge"], "input"),
  edge(31, ["p-base", "alert"], ["p-pat", "fromAlert"], "input"),
  edge(32, ["p-base", "button"], ["p-landing", "parts"], "input"),
  edge(33, ["p-base", "badge"], ["p-landing", "parts"], "input"),
  edge(34, ["p-pat", "card"], ["p-landing", "parts"], "input"),
  edge(35, ["p-pat", "header"], ["p-form", "parts"], "input"),
  edge(36, ["p-pat", "header"], ["p-report", "parts"], "input"),
  edge(37, ["p-pat", "form"], ["p-form", "parts"], "input"),
  edge(38, ["p-pat", "form"], ["p-report", "parts"], "input"),
  edge(39, ["p-pat", "section"], ["p-report", "parts"], "input"),
  edge(40, ["p-pat", "notice"], ["p-report", "parts"], "input"),
];

// ---- from records to the board's graph

/** The string at a dotted key of the `orvCanvas` group, with its placeholders filled. */
export function copyOf(m: Messages, key: CopyKey, params?: FillParams): string {
  let node: unknown = m.orvCanvas;
  for (const part of key.split(".")) {
    node =
      typeof node === "object" && node !== null ? (node as Record<string, unknown>)[part] : null;
  }
  if (typeof node !== "string") throw new RangeError(`orvCanvas: no string at "${key}"`);
  return fill(node, params);
}

/** A line of words, or a row's name, as a string in the catalog's locale. */
export function textOf(m: Messages, text: Text | { axis: AxisId }): string {
  if ("axis" in text) return m.direction.axes[text.axis];
  return "copy" in text ? copyOf(m, text.copy, text.params) : text.data;
}

function portSpec(m: Messages, p: PortRecord): PortSpec {
  const base = { id: p.id, kind: p.kind, label: textOf(m, p.name) };
  return p.row === undefined ? base : { ...base, row: p.row };
}

/**
 * The board's nodes and edges from the records, in the language of `m`. A node's page count is its
 * record's `count`, or the length of its sequence. Edge ids are `e<n>` and handles are port ids.
 */
export function graphOf(m: Messages): Graph {
  const nodes = NODES.map((n): BoardNode => {
    const sequence = n.open ? SEQUENCES.find((s) => s.id === n.open?.sequence) : undefined;
    const content: NodeContent = {
      title: copyOf(m, n.title),
      kind: n.kind,
      size: "custom",
      pad: n.pad,
      inputs: n.inputs.map((p) => portSpec(m, p)),
      outputs: n.outputs.map((p) => portSpec(m, p)),
      ...(n.open ? { open: { count: n.open.count ?? sequence?.pages.length ?? 0 } } : {}),
      ...(n.source === undefined ? {} : { source: n.source }),
    };
    return {
      id: n.id,
      type: "orivilo",
      position: { x: n.x, y: n.y },
      width: n.width,
      data: content,
    };
  });
  const edges = EDGES.map((e): BoardEdge => ({
    id: `e${e.n}`,
    type: "orivilo",
    source: e.from.node,
    target: e.to.node,
    sourceHandle: e.from.port,
    targetHandle: e.to.port,
    data: { meaning: e.meaning, ...(e.label === false ? { label: false as const } : {}) },
  }));
  return { nodes, edges } satisfies Graph;
}
