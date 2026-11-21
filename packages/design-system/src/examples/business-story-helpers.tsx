import { expect, waitFor, within } from "storybook/test";
import { inVitest } from "../testing/visual-asserts";
import { LocaleProvider, useLocale } from "../i18n/LocaleProvider";
import { pick } from "../i18n/locale";
import { type Messages, messagesFor } from "../i18n/messages/index";
import type { ReactNode } from "react";

/**
 * Shared by the stories of the three business screens (ORV-281). Not a component of the library:
 * the labels, the language switch and the checks every story of these screens repeats.
 */

export const th = messagesFor("th");
export const en = messagesFor("en");

export const textOf = (el: Element) => (el.textContent ?? "").replace(/\s+/g, " ");

/**
 * The fixture notes (story-only copy, not UI catalog copy). `answers` is the note every business
 * story carries; `readings` replaces it on the four readings stories (ORV-283, row D8); `drafts`
 * replaces it where a draft written by hand for a fixture is stored (ORV-292).
 */
export const FIXTURE_NOTES = {
  answers: {
    th: "ข้อมูลตัวอย่าง: โปรเจกต์และคำตอบในเรื่องนี้ทำขึ้นเอง ไม่มีใครกรอกจริง",
    en: "Fixture: the projects and answers in this story are made by hand, nobody gave them.",
  },
  readings: {
    th: "ข้อมูลตัวอย่าง: โปรเจกต์ คำตอบ และผลการอ่านของ AI ในเรื่องนี้เขียนขึ้นเองทั้งหมด ไม่มีโมเดล AI อ่านคำตอบเหล่านี้จริง",
    en: "Fixture: the projects, answers and AI readings in this story are written by hand, and no AI model read these answers.",
  },
  drafts: {
    th: "ข้อมูลตัวอย่าง: โปรเจกต์ คำตอบ และตัวเลือกที่ AI ร่างในเรื่องนี้เขียนขึ้นเองทั้งหมด ไม่มีโมเดล AI ร่างข้อความเหล่านี้จริง",
    en: "Fixture: the projects, answers and AI drafted options in this story are written by hand, and no AI model drafted this text.",
  },
} as const;

/** The label every story carries: the projects and answers are made by hand, nobody gave them. */
export function FixtureNote({
  readings = false,
  drafts = false,
}: {
  readings?: boolean;
  drafts?: boolean;
}) {
  const locale = useLocale();
  const kind = drafts ? "drafts" : readings ? "readings" : "answers";
  return (
    <p className="p-4 text-body-sm text-text-secondary" data-fixture-note={kind}>
      {pick(FIXTURE_NOTES[kind], locale)}
    </p>
  );
}

/** A story's decorator that puts it in English; the other stories run in Thai, as the test run does. */
export const inEnglish = (Story: () => ReactNode) => (
  <LocaleProvider locale="en">{Story()}</LocaleProvider>
);

/** Signed out, not allowed or not configured: the heading, one paragraph, no form, no list, no board (spec rows 5, 7). */
export async function expectAccessScreen(
  canvasElement: HTMLElement,
  m: Messages,
  heading: string,
  access: "signed-out" | "not-allowed" | "not-configured",
) {
  const canvas = within(canvasElement);
  await expect(canvas.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  const line = {
    "signed-out": m.business.signedOut,
    "not-allowed": m.business.notAllowed,
    "not-configured": m.business.notConfigured,
  }[access];
  await expect(canvas.getByText(line)).toBeVisible();
  await expect(canvasElement.querySelector("form")).toBeNull();
  await expect(canvasElement.querySelector("ul")).toBeNull();
  await expect(canvasElement.querySelector("[data-node]")).toBeNull();
  await expect(canvas.queryByRole("textbox")).toBeNull();
  const links = [...canvasElement.querySelectorAll("a")];
  if (access === "signed-out") {
    await expect(links.map((a) => [textOf(a), a.getAttribute("href")])).toEqual([
      [m.business.signInLink, "/account"],
    ]);
  } else {
    await expect(links).toHaveLength(0);
  }
  // No header actions on an access screen (design section 2).
  await expect(canvasElement.querySelectorAll(".ds-page-header__actions")).toHaveLength(0);
}

/** At 360 px every line wraps inside the frame and nothing scrolls sideways (spec row 20). */
export async function expectFitsAt360(canvasElement: HTMLElement) {
  const frame = canvasElement.querySelector<HTMLElement>("[data-narrow]");
  if (frame === null) throw new Error("no [data-narrow] frame");
  const edge = frame.getBoundingClientRect().right;
  await expect(frame.getBoundingClientRect().width).toBeLessThanOrEqual(360);
  await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
    Math.max(360, window.innerWidth),
  );
  for (const el of frame.querySelectorAll<HTMLElement>("*")) {
    if (el.closest(".sr-only") !== null) continue;
    // The board's world is clipped by the board's own frame, which is checked above and below
    // (ORV-291 B3: from PR 1 the map is wider than the frame at 360 and the person pans).
    if (el.closest(".react-flow__viewport") !== null) continue;
    await expect(el.getBoundingClientRect().right).toBeLessThanOrEqual(edge + 0.5);
  }
}

/**
 * Runs `check` with the browser at `width` by `height`, then puts the size back. The viewer is as
 * large as the window and Vitest's browser iframe is 1200 by 900, so the size is set, not assumed.
 * The static Storybook has no `vitest/browser`; there the window is the size the toolbar chose.
 */
export async function atWindow(width: number, height: number, check: () => Promise<void>) {
  if (!inVitest) return check();
  const { page } = await import("vitest/browser");
  const before = { width: window.innerWidth, height: window.innerHeight };
  const resized = async (w: number, h: number) => {
    await page.viewport(w, h);
    await waitFor(() => expect([window.innerWidth, window.innerHeight]).toEqual([w, h]));
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  };
  // The screenshot lock of `visual-asserts.ts`: no other file's screenshot runs while the frame is resized.
  await navigator.locks.request("orivilo-screenshot", async () => {
    await resized(width, height);
    try {
      await check();
    } finally {
      await resized(before.width, before.height);
    }
  });
}
