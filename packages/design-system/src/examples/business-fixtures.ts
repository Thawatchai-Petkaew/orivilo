import {
  type BusinessView,
  INTAKE_VERSION,
  type StoredIntake,
  toBusinessView,
} from "@orivilo/intent-engine";
import { fixtures } from "../components/fixtures";

/**
 * Fixture data for the business stories (ORV-281 tech notes section 9). Every project here is made
 * by hand to show a state: no person gave these answers and nothing was saved. Each view goes
 * through the engine's `toBusinessView`, so a story shows what the screen gets from a saved project.
 */

const SAVED_AT = "2026-11-18T03:15:00.000Z";

const view = (name: string, intake: Omit<StoredIntake, "version">): BusinessView =>
  toBusinessView({
    project: { id: "fixture", name, createdAt: SAVED_AT },
    intake: { version: INTAKE_VERSION, ...intake },
  });

/** Thai, every field given, a line break inside one answer. */
export const THAI_VIEW = view("คาเฟ่ริมคลอง", {
  idea: "ร้านกาแฟคั่วเองและขนมอบ สำหรับคนทำงานในย่านเมืองเก่า",
  industry: "ร้านกาแฟและเบเกอรี่",
  customers: "พี่ใหม่ ทำงานออกแบบอยู่แถวนี้ แวะมาทุกเช้า\nและพาเพื่อนร่วมงานมาด้วยทุกวันศุกร์",
  problem: "อยากได้ที่นั่งเงียบ ๆ ที่กาแฟอร่อย และไม่ต้องรอนาน",
  competitors: "ร้านกาแฟแฟรนไชส์หน้าปากซอย และกาแฟกระป๋องจากร้านสะดวกซื้อ",
  value: "เมล็ดกาแฟที่คั่วสดทุกเช้าในร้าน และที่นั่งริมคลองที่เงียบ",
  website: "https://cafe-rim-khlong.example/",
});

/** English, every field given. */
export const ENGLISH_VIEW = view("Canalside Cafe", {
  idea: "A roastery and bakery for people who work in the old town.",
  industry: "Coffee shop and bakery",
  customers: "Mai designs for a living nearby and stops in every morning.",
  problem: "She wants a quiet seat, good coffee and no wait.",
  competitors: "The chain cafe at the end of the lane, and canned coffee from the corner shop.",
  value: "Beans roasted fresh in the shop each morning, and a quiet seat by the canal.",
  website: "https://canalside-cafe.example/",
});

/** The name and the idea only: audience, competitors and value are skipped, the website is not given. */
export const SKIPPED_VIEW = view("โปรเจกต์ที่ข้ามไว้", {
  idea: "แอปจองคิวสำหรับร้านตัดผม",
});

const HOSTILE_IDEA = "<img src=x onerror=alert(1)>";
/**
 * `website-input-1` would keep this as a percent-encoded address. The fixture holds the raw text on
 * purpose: the screen is proven safe even if a stored value carried markup.
 */
const HOSTILE_WEBSITE = 'https://example.com/"><script>';

/** Markup in an answer, the name and the website: all of it must show as literal text. */
export const UNTRUSTED_VIEW = view("<b>Project</b>", {
  idea: HOSTILE_IDEA,
  customers: "<a href=https://evil.example>click</a>",
  website: HOSTILE_WEBSITE,
});
export const UNTRUSTED = { idea: HOSTILE_IDEA, website: HOSTILE_WEBSITE } as const;

/** A 120-character Thai project name with no space. */
export const LONG_NAME = fixtures.longThai.repeat(3).slice(0, 120);
/** A Latin project name of 76 characters with no hyphen, space or other place to break. */
export const UNBROKEN_NAME = "BrandCanvasWorkspace".repeat(4);
/** A Thai answer with no space, long enough to wrap many times at 360 px. */
export const LONG_ANSWER = fixtures.longThai.repeat(6);
/** A website of exactly 2,048 characters, the longest `website-input-1` keeps. */
export const LONG_WEBSITE = `https://long.example/${"a".repeat(2048 - "https://long.example/".length)}`;

/** The narrow case: the 120-character name, long answers, the 2,048-character website. */
export const NARROW_VIEW = view(LONG_NAME, {
  idea: LONG_ANSWER,
  industry: fixtures.longLatin,
  customers: LONG_ANSWER,
  website: LONG_WEBSITE,
});

export type FixtureProject = { id: string; name: string; href: string; createdAt: string };

/** Newest first, as the loader sends them. The third has the 120-character Thai name, the last a long Latin name with no break. */
export const PROJECTS: readonly FixtureProject[] = [
  {
    id: "p3",
    name: "คาเฟ่ริมคลอง",
    href: "/business/p3",
    createdAt: "2026-11-18T03:15:00.000Z",
  },
  { id: "p2", name: "Canalside Cafe", href: "/business/p2", createdAt: "2026-11-17T09:40:00.000Z" },
  { id: "p1", name: LONG_NAME, href: "/business/p1", createdAt: "2026-11-16T01:05:00.000Z" },
  {
    id: "p0",
    name: UNBROKEN_NAME,
    href: "/business/p0",
    createdAt: "2026-11-15T12:00:00.000Z",
  },
];
