import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import {
  expectInkCentred,
  expectLinesClear,
  expectNoGlyphClip,
  inVitest,
} from "../../testing/visual-asserts";
import { Button } from "../button/Button";
import { cx } from "../cx";
import { avatarFixtures as a, fixtures } from "../fixtures";
import { Matrix, Narrow } from "../matrix";
import { Avatar, type AvatarSize } from "./Avatar";

const meta = {
  title: "Base/Avatar",
  component: Avatar,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A person's disc (ORV-224): the picture once it has loaded, else the initials of the name, else a person glyph. Initials are rule-based, not read by a model, and every person and picture in these stories is a mock. The named form (default) gives a screen reader the name once; the decorative form hides the disc beside a visible name or inside a control that names itself. There is no status dot, tick or count: the repo holds no data for them.",
      },
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The disc roots under `scope`. */
const discs = (scope: HTMLElement) => Array.from(scope.querySelectorAll<HTMLElement>(".ds-avatar"));

/** The initials boxes under `scope`: what the ink-centre check measures, never the whole fallback. */
const initialBoxes = (scope: HTMLElement) =>
  Array.from(scope.querySelectorAll<HTMLElement>(".ds-avatar__initials"));

/** A visible name beside a decorative disc: one start edge, so a wrapped name keeps its first line centred. */
function PersonRow({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | undefined;
  size?: AvatarSize | undefined;
}) {
  return (
    <div className="flex items-start gap-3">
      <Avatar decorative name={name} src={src} size={size} />
      <p className={cx("min-w-0 text-body-sm wrap-anywhere", size === "sm" ? "pt-1" : "pt-2")}>
        {name}
      </p>
    </div>
  );
}

/** Step 1: the mock picture in a round disc, named. */
export const Picture: Story = {
  render: () => <Avatar name={a.name} src={a.picture} />,
  play: async ({ canvasElement }) => {
    const root = await within(canvasElement).findByRole("img", { name: a.name });
    await waitFor(() => expect(canvasElement.querySelector("img")).not.toBeNull());
    const img = canvasElement.querySelector("img");
    await expect(img).toHaveAttribute("alt", "");
    await expect(img).not.toHaveAttribute("title");
    await expect(img).toHaveAttribute("src", a.picture);
    await expect(root.querySelector(".ds-avatar__fallback")).toBeNull();
    await expect(root.textContent).toBe("");
  },
};

const INITIALS_NAMES = [a.name, a.namePreBase, fixtures.thaiMarks, fixtures.longThai, a.nameEn];
const INITIALS_WANT = ["ส", "พ", "ป", "บ", "AS"];

/** Step 2: Thai and Latin names with no picture. One Thai consonant, or two Latin capitals. */
export const Initials: Story = {
  render: () => (
    <div className="flex gap-3">
      {INITIALS_NAMES.map((name) => (
        <Avatar key={name} name={name} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const roots = discs(canvasElement);
    await expect(roots).toHaveLength(INITIALS_NAMES.length);
    INITIALS_NAMES.forEach((name, i) => {
      const root = canvas.getByRole("img", { name });
      expect(root).toBe(roots[i]);
      expect(root).toHaveTextContent(INITIALS_WANT[i] ?? "");
      // The root's overflow is the clip this reads; the box is square, so the fit inside the
      // circle is the designer's screenshots.
      expectNoGlyphClip(root);
    });
    if (!inVitest) return; // the screenshot needs Vitest browser mode
    const boxes = initialBoxes(canvasElement);
    await expectInkCentred(canvasElement, boxes.slice(0, 4), { measure: "body" });
    await expectInkCentred(canvasElement, boxes.slice(4), { measure: "ink" });
  },
};

/** Step 3: a missing name and a name with no letter show the glyph and no text. */
export const NoName: Story = {
  render: () => (
    <div className="flex gap-3">
      <Avatar name={fixtures.missing} />
      <Avatar name="2026" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ["ไม่แสดงชื่อ", "2026"]) {
      const root = canvas.getByRole("img", { name });
      await expect(root.textContent).toBe("");
      await expect(root.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    }
  },
};

/** A picture that cannot decode falls back to the initials, and the name stays. */
export const FailedPicture: Story = {
  render: () => <Avatar name={a.name} src={a.brokenPicture} />,
  play: async ({ canvasElement }) => {
    // Wait for the failure itself, so "no img" below is read after the load has ended.
    await new Promise<void>((resolve) => {
      const probe = new Image();
      probe.onload = () => resolve();
      probe.onerror = () => resolve();
      probe.src = a.brokenPicture;
    });
    const canvas = within(canvasElement);
    await canvas.findByText("ส");
    await expect(canvasElement.querySelector("img")).toBeNull();
    await expect(canvas.getByRole("img", { name: a.name })).toBeInTheDocument();
  },
};

/** The images a slow story holds back until its play releases them. */
class SlowImage {
  static held: SlowImage[] = [];
  complete = false;
  naturalWidth = 0;
  crossOrigin: string | null = null;
  referrerPolicy = "";
  src = "";
  private listeners = new Map<string, Set<(event: { currentTarget: SlowImage }) => void>>();
  constructor() {
    SlowImage.held.push(this);
  }
  addEventListener(type: string, listener: (event: { currentTarget: SlowImage }) => void) {
    this.listeners.set(type, (this.listeners.get(type) ?? new Set()).add(listener));
  }
  removeEventListener(type: string, listener: (event: { currentTarget: SlowImage }) => void) {
    this.listeners.get(type)?.delete(listener);
  }
  /** The load ends: Radix reads `complete` and `naturalWidth` from the event's target. */
  release() {
    this.complete = true;
    this.naturalWidth = 96;
    for (const listener of this.listeners.get("load") ?? []) listener({ currentTarget: this });
  }
}

/** The loading state: the fallback shows at once, and the picture takes its place on release. */
export const SlowPicture: Story = {
  beforeEach: () => {
    const real = window.Image;
    SlowImage.held = [];
    // The stub covers what Radix reads of an Image; the cast is the only way to install it.
    window.Image = SlowImage as unknown as typeof Image;
    return () => {
      window.Image = real;
    };
  },
  render: () => (
    <div className="flex gap-3">
      <Avatar name={a.name} src={a.picture} />
      <Avatar name={a.nameEn} src={a.picture} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const thai = canvas.getByRole("img", { name: a.name });
    const english = canvas.getByRole("img", { name: a.nameEn });
    await expect(thai).toHaveTextContent("ส");
    await expect(english).toHaveTextContent("AS");
    await expect(canvasElement.querySelector("img")).toBeNull();
    for (const image of SlowImage.held) image.release();
    await waitFor(() => expect(canvasElement.querySelectorAll("img")).toHaveLength(2));
    await expect(thai.textContent).toBe("");
    await expect(english.textContent).toBe("");
    await expect(canvas.getByRole("img", { name: a.name })).toBe(thai);
    await expect(canvas.getByRole("img", { name: a.nameEn })).toBe(english);
  },
};

function Reload({ name, label }: { name: string; label: string }) {
  const [src, setSrc] = useState<string>(a.brokenPicture);
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} src={src} />
      <Button onClick={() => setSrc(a.picture)}>{label}</Button>
    </div>
  );
}

/** A failed `src` replaced by a good one shows the picture: a failed flag would not clear. */
export const NewPicture: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Reload name={a.name} label={a.newPicture} />
      <Reload name={a.nameEn} label={a.newPictureEn} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const [name, initials, label] of [
      [a.name, "ส", a.newPicture],
      [a.nameEn, "AS", a.newPictureEn],
    ] as const) {
      const root = canvas.getByRole("img", { name });
      await canvas.findByText(initials);
      await userEvent.click(canvas.getByRole("button", { name: label }));
      await waitFor(() => expect(root.querySelector("img")).not.toBeNull());
      await expect(root.querySelector("img")).toHaveAttribute("src", a.picture);
    }
  },
};

const SIZE_CASES: readonly (AvatarSize | undefined)[] = ["sm", "md", undefined];
const SIZE_WANT = [
  { disc: 32, glyph: 16 },
  { disc: 40, glyph: 20 },
  { disc: 40, glyph: 20 },
];

function SizesGrid() {
  return (
    <div className="flex flex-col gap-4">
      <div data-testid="row-picture" className="flex items-center gap-3">
        {SIZE_CASES.map((size, i) => (
          <Avatar key={i} name={a.name} src={a.picture} size={size} />
        ))}
      </div>
      <div data-testid="row-initials" className="flex items-center gap-3">
        {SIZE_CASES.map((size, i) => (
          <Avatar key={i} name={a.name} size={size} />
        ))}
      </div>
      <div data-testid="row-glyph" className="flex items-center gap-3">
        {SIZE_CASES.map((size, i) => (
          <Avatar key={i} size={size} />
        ))}
      </div>
    </div>
  );
}

/** `sm`, `md` and no `size` at the picture, initials and glyph steps. */
export const Sizes: Story = {
  render: () => <SizesGrid />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvasElement.querySelectorAll("img")).toHaveLength(3));
    for (const row of ["picture", "initials", "glyph"]) {
      const roots = discs(canvas.getByTestId(`row-${row}`));
      await expect(roots).toHaveLength(3);
      roots.forEach((root, i) => {
        const box = root.getBoundingClientRect();
        expect(box.width, `${row} ${i} width`).toBe(SIZE_WANT[i]?.disc);
        expect(box.height, `${row} ${i} height`).toBe(SIZE_WANT[i]?.disc);
        expect(getComputedStyle(root).clipPath).toBe("circle(50%)");
      });
    }
    discs(canvas.getByTestId("row-glyph")).forEach((root, i) => {
      const glyph = root.querySelector("svg")?.getBoundingClientRect();
      expect(glyph?.width).toBe(SIZE_WANT[i]?.glyph);
      expect(glyph?.height).toBe(SIZE_WANT[i]?.glyph);
    });
    if (!inVitest) return; // the screenshot needs Vitest browser mode
    await expectInkCentred(canvasElement, initialBoxes(canvas.getByTestId("row-initials")), {
      measure: "body",
    });
  },
};

/** Decorative beside a visible name, with a picture and without, and inside one link. */
export const BesideName: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <PersonRow name={a.name} src={a.picture} />
      <PersonRow name={a.name} />
      <a href="#member" className="flex items-start gap-3 text-text-primary underline">
        <Avatar decorative name={a.name} />
        <span className="min-w-0 pt-2 text-body-sm">{a.name}</span>
      </a>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const roots = discs(canvasElement);
    await expect(roots).toHaveLength(3);
    for (const root of roots) {
      await expect(root).toHaveAttribute("aria-hidden", "true");
      await expect(root).not.toHaveAttribute("role");
      await expect(root).not.toHaveAttribute("aria-label");
    }
    await expect(canvas.queryByRole("img")).toBeNull();
    await expect(canvas.getAllByText(a.name)).toHaveLength(3);
    await expect(canvas.getByRole("link", { name: a.name })).toBeInTheDocument();
  },
};

/** Decorative inside a `Button` with `iconOnly`: the button names the action and the person. */
export const AsControl: Story = {
  render: () => (
    <div className="flex gap-3">
      <Button variant="ghost" size="md" iconOnly aria-label={a.menuLabel}>
        <Avatar decorative size="sm" name={a.name} src={a.picture} />
      </Button>
      <Button variant="ghost" size="md" iconOnly aria-label={a.menuLabel}>
        <Avatar decorative size="sm" name={a.name} src={a.brokenPicture} />
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole("button", { name: a.menuLabel });
    await expect(buttons).toHaveLength(2);
    for (const root of discs(canvasElement)) await expect(root).not.toHaveAttribute("tabindex");
    for (const button of buttons) {
      await userEvent.tab();
      await expect(button).toHaveFocus();
    }
    // The failed load keeps the control's name.
    await expect(canvas.getAllByRole("button", { name: a.menuLabel })).toHaveLength(2);
  },
};

/** English: the same steps, sizes and forms with the English fixtures. */
export const InEnglish: Story = {
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <Avatar name={a.nameEn} src={a.picture} />
        <Avatar name={a.nameEn} />
        <Avatar />
        <Avatar name={a.nameEn} src={a.brokenPicture} />
        <Avatar name={a.nameEn} size="sm" />
      </div>
      <PersonRow name={a.nameEn} />
      <Button variant="ghost" size="md" iconOnly aria-label={a.menuLabelEn}>
        <Avatar decorative size="sm" name={a.nameEn} src={a.picture} />
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvasElement.querySelectorAll("img")).toHaveLength(2));
    const named = canvas.getAllByRole("img", { name: a.nameEn });
    await expect(named).toHaveLength(4);
    await expect(canvas.getByRole("img", { name: "Name not shown" })).toBeInTheDocument();
    await expect(canvas.getAllByText("AS").length).toBeGreaterThanOrEqual(3);
    await expect(
      canvas.getByRole("button", { name: "Open the account menu for Anong Srisuk" }),
    ).toBeInTheDocument();
    await expect(canvas.getAllByText(a.nameEn)).toHaveLength(1);
  },
};

/** A 360 px frame: a long Thai name wraps beside a disc that keeps its width, and nothing clips it. */
export const At360: Story = {
  render: () => (
    <Narrow>
      <div data-testid="frame">
        <PersonRow name={fixtures.longThai} />
      </div>
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvas.getByTestId("frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(360);
    await expect(discs(canvasElement)[0]?.getBoundingClientRect().width).toBe(40);
    const name = canvas.getByText(fixtures.longThai);
    // Nothing between the name and the frame, the frame included, clips its ink.
    for (let up: HTMLElement | null = name; up; up = up === frame ? null : up.parentElement) {
      const style = getComputedStyle(up);
      expect(style.overflowX).toBe("visible");
      expect(style.overflowY).toBe("visible");
    }
    if (!inVitest) return; // the screenshot needs Vitest browser mode
    await expectLinesClear(name);
  },
};

function Steps() {
  return (
    <div className="flex gap-3">
      <Avatar name={a.name} src={a.picture} />
      <Avatar name={a.name} />
      <Avatar />
    </div>
  );
}

export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <Steps />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll<HTMLElement>("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    await waitFor(() => expect(canvasElement.querySelectorAll("img")).toHaveLength(6));
    await expect(canvasElement.querySelectorAll(".ds-avatar")).toHaveLength(18);
    for (const cell of cells) {
      await expect(discs(cell)).toHaveLength(3);
      for (const root of discs(cell)) {
        await expect(getComputedStyle(root).clipPath).toBe("circle(50%)");
      }
    }
  },
};
