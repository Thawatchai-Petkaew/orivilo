import { describe, expect, it } from "vitest";
import {
  CONFIDENCE_CAP,
  checkCorpus,
  freshness,
  knowledgeEntrySchema,
  type KnowledgeEntry,
} from "./knowledge";

const method = {
  kind: "owner",
  title: "brand-ci-method.md",
  license: "own-words",
} as const;

// Three entries written from docs/context/brand/brand-ci-method.md §5 and §6.
const semanticsSeparate: KnowledgeEntry = {
  schemaVersion: "1.0",
  id: "color.semantics-separate",
  version: 1,
  kind: "guideline",
  status: "verified",
  statement: {
    th: "สีสถานะและสีโฟกัสต้องไม่ใช้สีแบรนด์",
    en: "Status, selection and focus colors are never the brand accent.",
  },
  do: [{ en: "Give focus a ring that differs from selection." }],
  avoid: [{ en: "Use the signature color for an error or a warning." }],
  severity: "must",
  appliesTo: { topics: ["color"], industries: [], audiences: [], personality: {} },
  keywords: ["semantic", "focus", "accent"],
  sources: [
    method,
    {
      kind: "article",
      title: "How to choose brand colors",
      url: "https://madegooddesigns.com/how-to-choose-brand-colors",
      license: "link-only",
    },
  ],
  confidence: 0.9,
  confidenceBasis: "multiple-sources",
  verifiedAt: "2026-10-21",
  verifiedBy: "golf",
  relations: [{ type: "supports", to: "color.roles-before-values" }],
};

const rolesBeforeValues: KnowledgeEntry = {
  ...semanticsSeparate,
  id: "color.roles-before-values",
  kind: "principle",
  statement: {
    en: "Decide canvas, ink, signature, action, neutrals and feedback roles before values.",
  },
  do: [],
  avoid: [{ en: "More than seven brand colors." }],
  severity: "should",
  keywords: ["roles", "palette"],
  sources: [method],
  confidence: 0.8,
  confidenceBasis: "single-source",
  relations: [],
};

const thaiLineHeight: KnowledgeEntry = {
  ...semanticsSeparate,
  id: "typography.thai-line-height",
  status: "draft",
  statement: { th: "เนื้อความภาษาไทยใช้ระยะบรรทัดราว 1.6 ถึง 1.7" },
  do: [],
  avoid: [{ en: "Latin tracking or all-caps rules on Thai." }],
  severity: "should",
  appliesTo: {
    topics: ["typography"],
    industries: [],
    audiences: ["thai-readers"],
    personality: { structured: { min: 40, max: 100 } },
  },
  keywords: ["thai", "line-height"],
  sources: [method],
  confidence: 0.4,
  confidenceBasis: "hypothesis",
  verifiedAt: null,
  verifiedBy: null,
  relations: [{ type: "refines", to: "color.roles-before-values" }],
};

const corpus = [semanticsSeparate, rolesBeforeValues, thaiLineHeight];

const fails = (patch: Record<string, unknown>, base: KnowledgeEntry = semanticsSeparate) => {
  const result = knowledgeEntrySchema.safeParse({ ...base, ...patch });
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
};

describe("knowledgeEntrySchema", () => {
  it("accepts the three method entries", () => {
    for (const entry of corpus) expect(knowledgeEntrySchema.parse(entry)).toEqual(entry);
  });

  it("round-trips through JSON unchanged", () => {
    const parsed = corpus.map((entry) =>
      knowledgeEntrySchema.parse(JSON.parse(JSON.stringify(entry))),
    );
    expect(parsed).toEqual(corpus);
  });

  it("rejects an unknown field instead of dropping it", () => {
    expect(fails({ note: "free text" })).toEqual([""]);
    expect(fails({ appliesTo: { ...semanticsSeparate.appliesTo, mood: "calm" } })).toEqual([
      "appliesTo",
    ]);
  });

  it("rejects ids that are not slugs and an unknown topic", () => {
    expect(fails({ id: "Color Semantics" })).toEqual(["id"]);
    expect(fails({ appliesTo: { ...semanticsSeparate.appliesTo, topics: ["vibes"] } })).toEqual([
      "appliesTo.topics.0",
    ]);
    expect(fails({ appliesTo: { ...semanticsSeparate.appliesTo, topics: [] } })).toEqual([
      "appliesTo.topics",
    ]);
  });

  it("needs Thai, English or both, never empty text", () => {
    expect(fails({ statement: {} })).toEqual(["statement"]);
    expect(fails({ statement: { en: "  " } })).toEqual(["statement.en"]);
  });

  it("keeps personality ranges inside 0 to 100 and in order", () => {
    const at = (personality: unknown) =>
      fails({ appliesTo: { ...semanticsSeparate.appliesTo, personality } });
    expect(at({ warm: { min: 70, max: 30 } })).toEqual(["appliesTo.personality.warm"]);
    expect(at({ warm: { min: 0, max: 101 } })).toEqual(["appliesTo.personality.warm.max"]);
    expect(at({ grumpy: { min: 0, max: 10 } })).toEqual(["appliesTo.personality"]);
  });

  it("needs at least one source, and a url for a link-only one", () => {
    expect(fails({ sources: [] })).toEqual(["sources"]);
    expect(
      fails({ sources: [{ kind: "product", title: "Mobbin flow", license: "link-only" }] }),
    ).toEqual(["sources.0.url"]);
    expect(fails({ sources: [{ ...method, url: "http://example.com/page" }] })).toEqual([
      "sources.0.url",
    ]);
  });

  it("keeps a reference as a link only", () => {
    const reference = {
      kind: "reference",
      sources: [
        {
          kind: "product",
          title: "Mobbin flow",
          url: "https://mobbin.com/x",
          license: "link-only",
        },
      ],
    };
    expect(fails(reference)).toEqual([]);
    expect(fails({ ...reference, sources: [...reference.sources, method] })).toEqual(["sources"]);
  });

  it("caps confidence by its basis", () => {
    for (const [basis, cap] of Object.entries(CONFIDENCE_CAP)) {
      expect(fails({ confidenceBasis: basis, confidence: cap })).toEqual([]);
      if (cap < 1) {
        expect(fails({ confidenceBasis: basis, confidence: cap + 0.01 })).toEqual(["confidence"]);
      }
    }
    expect(fails({ confidenceBasis: "imported", confidence: 0.71 })).toEqual(["confidence"]);
  });

  it("records who checked a verified entry and when", () => {
    expect(fails({ verifiedAt: null })).toEqual(["verifiedAt"]);
    expect(fails({ verifiedBy: null })).toEqual(["verifiedAt"]);
    expect(fails({ verifiedAt: "21/10/2026" })).toEqual(["verifiedAt"]);
  });

  it("rejects a relation to itself", () => {
    expect(fails({ relations: [{ type: "refines", to: semanticsSeparate.id }] })).toEqual([
      "relations",
    ]);
  });
});

describe("freshness", () => {
  it("is fresh up to 90 days after the check, then stale", () => {
    expect(freshness(semanticsSeparate, "2026-10-21")).toBe("fresh");
    expect(freshness(semanticsSeparate, "2027-01-19")).toBe("fresh");
    expect(freshness(semanticsSeparate, "2027-01-20")).toBe("stale");
  });

  it("calls a never-checked entry unverified and refuses a bad date", () => {
    expect(freshness(thaiLineHeight, "2026-10-21")).toBe("unverified");
    expect(() => freshness(semanticsSeparate, "soon")).toThrow("not an ISO date: soon");
  });
});

describe("checkCorpus", () => {
  it("passes a corpus that holds together", () => {
    expect(checkCorpus(corpus)).toEqual([]);
  });

  it("reports a duplicate id and a relation to an entry that is not there", () => {
    const issues = checkCorpus([
      ...corpus,
      { ...rolesBeforeValues },
      {
        ...rolesBeforeValues,
        id: "color.extra",
        relations: [{ type: "supports", to: "color.gone" }],
      },
    ]);
    expect(issues.map(({ id, problem }) => [id, problem])).toEqual([
      ["color.extra", "unknown-relation"],
      ["color.roles-before-values", "duplicate-id"],
    ]);
  });

  it("flags a live entry leaning on a retired one, but allows superseding it", () => {
    const retired = { ...rolesBeforeValues, status: "retired" as const };
    expect(checkCorpus([semanticsSeparate, retired]).map((issue) => issue.problem)).toEqual([
      "relation-to-retired",
    ]);
    const successor: KnowledgeEntry = {
      ...rolesBeforeValues,
      id: "color.roles-v2",
      relations: [{ type: "supersedes", to: rolesBeforeValues.id }],
    };
    expect(checkCorpus([successor, retired])).toEqual([]);
  });

  it("finds a supersede loop through any branch", () => {
    const a: KnowledgeEntry = {
      ...rolesBeforeValues,
      id: "a",
      relations: [
        { type: "supersedes", to: "b" },
        { type: "supersedes", to: "c" },
      ],
    };
    const b: KnowledgeEntry = { ...rolesBeforeValues, id: "b", relations: [] };
    const c: KnowledgeEntry = {
      ...rolesBeforeValues,
      id: "c",
      relations: [{ type: "supersedes", to: "a" }],
    };
    expect(checkCorpus([a, b, c]).map(({ id, problem }) => [id, problem])).toEqual([
      ["a", "supersede-cycle"],
      ["c", "supersede-cycle"],
    ]);
  });
});
