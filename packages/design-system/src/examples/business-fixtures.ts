import {
  BUSINESS_READ_MODEL,
  type BusinessAnswerKey,
  type BusinessReadReason,
  type BusinessReading,
  type BusinessReadField,
  type BusinessView,
  compareEvidence,
  EVIDENCE_SCHEMA_VERSION,
  evidenceId,
  type FactorId,
  type InputEvidence,
  inputEvidenceSchema,
  INTAKE_VERSION,
  modelReading,
  ruleBasedReading,
  scoreConfidence,
  type StoredIntake,
  toBusinessView,
  wordCount,
} from "@orivilo/intent-engine";
import { fixtures } from "../components/fixtures";

/**
 * Fixture data for the business stories (ORV-281 tech notes section 9). Every project here is made
 * by hand to show a state: no person gave these answers and nothing was saved. Each view goes
 * through the engine's `toBusinessView`, so a story shows what the screen gets from a saved project.
 */

const SAVED_AT = "2026-11-18T03:15:00.000Z";

const view = (
  name: string,
  intake: Omit<StoredIntake, "version">,
  reading?: BusinessReading,
): BusinessView =>
  toBusinessView({
    project: { id: "fixture", name, createdAt: SAVED_AT },
    intake: { version: INTAKE_VERSION, ...intake },
    ...(reading === undefined ? {} : { reading }),
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

// ----- readings (ORV-283, slice 3) -----

const INTAKE_ID = "fixture";
/** Not the hash of any answer: no one read these answers, the fixture only needs a well-formed value. */
const FIXTURE_HASH = "0".repeat(64);
/** The number of words below which a reading has `few-words` (`word-count-1`). */
const FEW_WORDS = 20;

type ReadingSpec = {
  field: BusinessReadField;
  value: string;
  quotes: ReadonlyArray<readonly [BusinessAnswerKey, string]>;
};

const NAME_FIELDS: readonly BusinessReadField[] = [
  "situation.name",
  "competitive-frame.alternatives",
];

/**
 * A saved model reading made by hand from a list of readings, the way `readBusiness` builds one from
 * a model's answer: a span item for each quote, a reading item resting on its spans, the confidence
 * by ORV-128 (base `model-reading`; `few-words` under 20 words in the answers the spans sit in;
 * `single-signal` for one span). No model ran: the readings are fixture data, and the record is
 * checked by the engine's own schema in `toBusinessView`'s tests and here by `inputEvidenceSchema`.
 */
function readingOf(intake: Omit<StoredIntake, "version">, specs: ReadingSpec[]): BusinessReading {
  const answers = intake as Partial<Record<BusinessAnswerKey, string>>;
  const draft = (
    key: BusinessAnswerKey,
    start: number,
    end: number,
    over: Pick<
      InputEvidence,
      | "observation"
      | "reading"
      | "fromModel"
      | "model"
      | "basedOn"
      | "confidence"
      | "belowFloor"
      | "flags"
    >,
  ): InputEvidence => {
    const item: Omit<InputEvidence, "id"> = {
      schemaVersion: EVIDENCE_SCHEMA_VERSION,
      analyser: { id: "brief-text", version: INTAKE_VERSION },
      inputKind: "brief-text",
      role: "own",
      source: {
        ref: `intake:${INTAKE_ID}`,
        locator: { kind: "text", path: `answer.${key}`, start, end },
        contentHash: FIXTURE_HASH,
        retrievedAt: SAVED_AT,
        renderer: null,
      },
      measure: null,
      ownedBy: "self",
      origin: "input",
      hypothesis: false,
      hypothesisNote: null,
      ...over,
    };
    return inputEvidenceSchema.parse({ ...item, id: evidenceId(item) });
  };
  const spans = new Map<string, InputEvidence>();
  const spanOf = (key: BusinessAnswerKey, text: string) => {
    const start = (answers[key] ?? "").indexOf(text);
    if (start < 0) throw new Error(`fixture: "${text}" is not in the ${key} answer`);
    const at = `${key}:${start}`;
    let item = spans.get(at);
    if (item === undefined) {
      const scored = scoreConfidence("measure", []);
      item = draft(key, start, start + text.length, {
        observation: { kind: "text-span", subject: `answer.${key}`, quote: text },
        reading: null,
        fromModel: false,
        model: null,
        basedOn: [],
        confidence: scored.confidence,
        belowFloor: scored.belowFloor,
        flags: [],
      });
      spans.set(at, item);
    }
    return { key, item };
  };
  const readings = specs.map((spec) => {
    const rests = spec.quotes.map(([key, text]) => spanOf(key, text));
    const basedOn = [...new Set(rests.map((r) => r.item.id))].sort();
    let words = 0;
    for (const key of new Set(rests.map((r) => r.key))) words += wordCount(answers[key] ?? "");
    const factors: FactorId[] = [];
    if (words < FEW_WORDS) factors.push("few-words");
    if (basedOn.length === 1) factors.push("single-signal");
    const scored = scoreConfidence("model-reading", factors);
    const [key, text] = spec.quotes[0] as readonly [BusinessAnswerKey, string];
    const first = spanOf(key, text).item;
    const locator = first.source.locator;
    if (locator.kind !== "text") throw new Error("fixture: a span is a text locator");
    return draft(key, locator.start, locator.end, {
      observation: {
        kind:
          spec.field === "situation.name"
            ? "brand-name"
            : spec.field === "competitive-frame.alternatives"
              ? "competitor-name"
              : "text-span",
        subject: spec.field,
        quote: text,
      },
      reading: {
        target: spec.field,
        value: NAME_FIELDS.includes(spec.field) ? { name: spec.value } : { text: spec.value },
        by: "model",
      },
      fromModel: true,
      model: {
        job: "business-read",
        modelId: BUSINESS_READ_MODEL,
        adapter: { id: "business-read", version: "1" },
      },
      basedOn,
      confidence: scored.confidence,
      belowFloor: scored.belowFloor,
      flags: factors.includes("few-words") ? [{ key: "quality.fewWords" }] : [],
    });
  });
  return modelReading(
    INTAKE_ID,
    BUSINESS_READ_MODEL,
    [...readings, ...spans.values()].sort(compareEvidence),
  );
}

/** Thai, every field given. The idea holds 22 words, the customers 11 and the problem 12 (`word-count-1`). */
const THAI_READ_INTAKE = {
  idea: "บ้านสวนคอฟฟี่ ร้านกาแฟคั่วเองที่ขายเมล็ดกาแฟให้พนักงานออฟฟิศที่อยากดื่มกาแฟดีๆ ที่บ้าน",
  industry: "ร้านกาแฟ",
  customers: "พนักงานออฟฟิศอายุ 25 ถึง 40 ปีที่ทำงานในเมือง",
  problem: "กาแฟสำเร็จรูปรสไม่ดีและร้านกาแฟอยู่ไกลจากบ้าน",
  competitors: "สตาร์บัคส์ <img src=x onerror=alert(1)> และร้านกาแฟหน้าปากซอย",
} as const;

/**
 * Thai, with readings: an offer above the floor, a customer read from the idea and the customers
 * answer (two spans), a problem below the floor (one span in 12 words), and an alternative whose
 * model value is markup, which must show as text.
 */
export const THAI_READ_VIEW = view(
  "บ้านสวนคอฟฟี่",
  THAI_READ_INTAKE,
  readingOf(THAI_READ_INTAKE, [
    {
      field: "situation.name",
      value: "บ้านสวนคอฟฟี่",
      quotes: [["idea", "บ้านสวนคอฟฟี่"]],
    },
    {
      field: "business-core.offer",
      value: "ร้านกาแฟคั่วเองที่ขายเมล็ดกาแฟ",
      quotes: [["idea", "ร้านกาแฟคั่วเองที่ขายเมล็ดกาแฟ"]],
    },
    {
      field: "audience.customers",
      value: "พนักงานออฟฟิศ",
      quotes: [
        ["idea", "พนักงานออฟฟิศ"],
        ["customers", "พนักงานออฟฟิศอายุ 25 ถึง 40 ปี"],
      ],
    },
    {
      field: "audience.problem",
      value: "กาแฟสำเร็จรูปรสไม่ดี",
      quotes: [["problem", "กาแฟสำเร็จรูปรสไม่ดี"]],
    },
    {
      field: "competitive-frame.category",
      value: "ร้านกาแฟ",
      quotes: [["industry", "ร้านกาแฟ"]],
    },
    {
      field: "competitive-frame.alternatives",
      value: "<img src=x onerror=alert(1)>",
      quotes: [["competitors", "<img src=x onerror=alert(1)>"]],
    },
    {
      field: "competitive-frame.alternatives",
      value: "ร้านกาแฟหน้าปากซอย",
      quotes: [["competitors", "ร้านกาแฟหน้าปากซอย"]],
    },
  ]),
);

/**
 * English, with no customers answer, so a reading on the customers stands with no words of the
 * person's beside it. The idea holds 29 words, the problem 10 and the industry 4.
 */
const ENGLISH_READ_INTAKE = {
  idea: "Canalside Cafe is a small roastery and bakery that sells freshly roasted beans and warm pastries to people who work in the old town and want a quiet seat.",
  industry: "Coffee shop and bakery",
  problem: "She wants a quiet seat, good coffee and no wait.",
  competitors:
    "The chain cafe at the end of the lane, and <b>canned</b> coffee from the corner shop.",
} as const;

export const ENGLISH_READ_VIEW = view(
  "Canalside Cafe",
  ENGLISH_READ_INTAKE,
  readingOf(ENGLISH_READ_INTAKE, [
    { field: "situation.name", value: "Canalside Cafe", quotes: [["idea", "Canalside Cafe"]] },
    {
      field: "business-core.offer",
      value: "A small roastery and bakery",
      quotes: [["idea", "a small roastery and bakery"]],
    },
    {
      field: "audience.customers",
      value: "People who work in the old town",
      quotes: [["idea", "people who work in the old town"]],
    },
    {
      field: "audience.problem",
      value: "A quiet seat",
      quotes: [
        ["idea", "a quiet seat"],
        ["problem", "She wants a quiet seat"],
      ],
    },
    {
      field: "competitive-frame.category",
      value: "Coffee shop",
      quotes: [["industry", "Coffee shop"]],
    },
    {
      field: "competitive-frame.alternatives",
      value: "<b>canned</b> coffee",
      quotes: [["competitors", "<b>canned</b> coffee"]],
    },
    {
      field: "competitive-frame.alternatives",
      value: "The chain cafe at the end of the lane",
      quotes: [["competitors", "The chain cafe at the end of the lane"]],
    },
  ]),
);

/** The model values of the two fixtures that hold markup, which a story must prove render as text. */
export const MARKUP_READINGS = {
  th: "<img src=x onerror=alert(1)>",
  en: "<b>canned</b> coffee",
} as const;

/** A project saved with no model reading: the person's words stand alone, and the record says why. */
export const aiUnavailableView = (
  locale: "th" | "en",
  reason: BusinessReadReason,
): BusinessView => {
  const intake = locale === "th" ? THAI_READ_INTAKE : ENGLISH_READ_INTAKE;
  return view(
    locale === "th" ? "บ้านสวนคอฟฟี่" : "Canalside Cafe",
    intake,
    ruleBasedReading(INTAKE_ID, reason),
  );
};
