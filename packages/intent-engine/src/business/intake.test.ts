import { describe, expect, it } from "vitest";
import {
  checkIntake,
  INTAKE_FIELDS,
  intakeInputSchema,
  storedIntakeSchema,
  websiteOf,
  type Intake,
  type IntakeProblem,
} from "./intake";

// ORV-281 tech notes section 13, T1 to T3; spec rows 1 and 2, worked example W6.

const ok = (input: unknown): Intake => {
  const r = checkIntake(input);
  if (!r.ok) throw new Error(`refused: ${JSON.stringify(r.problems)}`);
  return r.intake;
};
const problems = (input: unknown): IntakeProblem[] => {
  const r = checkIntake(input);
  if (r.ok) throw new Error("accepted");
  return r.problems;
};

const BASE = { projectName: "Clinic", idea: "We run a dental clinic." };
const OPTIONAL = ["industry", "customers", "problem", "competitors", "value"] as const;

describe("bounds", () => {
  it("takes a name of 120 and an idea of 2,000 with the optional answers empty", () => {
    const intake = ok({ projectName: "n".repeat(120), idea: "i".repeat(2000) });
    expect(intake.projectName).toHaveLength(120);
    expect(intake.idea).toHaveLength(2000);
    expect(Object.keys(intake).sort()).toEqual(["idea", "projectName"]);
  });

  it.each(OPTIONAL)("takes %s at 1 and at 2,000 characters", (key) => {
    expect(ok({ ...BASE, [key]: "a" })[key]).toBe("a");
    expect(ok({ ...BASE, [key]: "a".repeat(2000) })[key]).toHaveLength(2000);
  });

  it("empty optional answers are left out, not kept as empty strings", () => {
    const intake = ok({ ...BASE, industry: "", customers: "   ", website: " " });
    expect("industry" in intake).toBe(false);
    expect("customers" in intake).toBe(false);
    expect("website" in intake).toBe(false);
  });

  it("trims each answer", () => {
    expect(ok({ projectName: "  Clinic ", idea: "\n Dentist \t" })).toStrictEqual({
      projectName: "Clinic",
      idea: "Dentist",
    });
  });

  // Postgres refuses U+0000 in a text column, and no form sends it by intent, so the check drops it
  // from each value before the trim (ORV-281 task A4).
  it("drops U+0000 from each value before the trim, so none is kept or saved", () => {
    const intake = ok({
      projectName: "\u0000Cli\u0000nic ",
      idea: "a\u0000b",
      industry: "\u0000",
      customers: " \u0000 \u0000 ",
      website: "exam\u0000ple.com",
    });
    expect(intake).toStrictEqual({
      projectName: "Clinic",
      idea: "ab",
      website: "https://example.com/",
    });
    expect(JSON.stringify(intake)).not.toContain("\\u0000");
  });

  it("a required answer that holds only U+0000 is not given", () => {
    expect(problems({ projectName: "\u0000", idea: " \u0000 " })).toStrictEqual([
      { field: "projectName", kind: "required" },
      { field: "idea", kind: "required" },
    ]);
  });

  it("keeps example.com as https://example.com/", () => {
    expect(ok({ ...BASE, website: "example.com" }).website).toBe("https://example.com/");
  });

  it("a full intake survives a JSON round trip, deep-equal", () => {
    const intake = ok({
      ...BASE,
      industry: "ทันตกรรม",
      customers: "c",
      problem: "p",
      competitors: "x",
      value: "v",
      website: "example.com",
    });
    expect(JSON.parse(JSON.stringify(intake))).toStrictEqual(intake);
  });

  it("each field names its catalog question", () => {
    expect(INTAKE_FIELDS.map((f) => f.question)).toEqual([
      "business.intake.projectName",
      "business.question.offer",
      "business.intake.industry",
      "business.question.bestCustomer",
      "business.question.problem",
      "business.question.instead",
      "business.question.only",
      "business.intake.website",
    ]);
  });

  it("the table holds the eight fields in order, with the project name and idea required", () => {
    expect(INTAKE_FIELDS.map((f) => f.key)).toEqual([
      "projectName",
      "idea",
      "industry",
      "customers",
      "problem",
      "competitors",
      "value",
      "website",
    ]);
    expect(INTAKE_FIELDS.filter((f) => f.required).map((f) => f.key)).toEqual([
      "projectName",
      "idea",
    ]);
  });
});

describe("refused", () => {
  const cases: Array<[string, unknown, IntakeProblem]> = [
    ["an empty idea", { ...BASE, idea: "" }, { field: "idea", kind: "required" }],
    [
      "an idea of white space only",
      { ...BASE, idea: " \n\t " },
      { field: "idea", kind: "required" },
    ],
    ["an idea missing", { projectName: "Clinic" }, { field: "idea", kind: "required" }],
    ["an idea of 2,001", { ...BASE, idea: "i".repeat(2001) }, { field: "idea", kind: "too-long" }],
    [
      "a project name of 121",
      { ...BASE, projectName: "n".repeat(121) },
      { field: "projectName", kind: "too-long" },
    ],
    [
      "a project name empty",
      { ...BASE, projectName: "" },
      { field: "projectName", kind: "required" },
    ],
    [
      "an industry of 2,001",
      { ...BASE, industry: "a".repeat(2001) },
      { field: "industry", kind: "too-long" },
    ],
    [
      "a value of 2,001",
      { ...BASE, value: "a".repeat(2001) },
      { field: "value", kind: "too-long" },
    ],
    ["an unknown key role", { ...BASE, role: "admin" }, { field: null, kind: "unknown-key" }],
    [
      "a website with credentials",
      { ...BASE, website: "https://user:secret@example.com/" },
      { field: "website", kind: "website" },
    ],
    [
      "an ftp website",
      { ...BASE, website: "ftp://example.com/" },
      { field: "website", kind: "website" },
    ],
    [
      "a javascript website",
      { ...BASE, website: "javascript:alert(1)" },
      { field: "website", kind: "website" },
    ],
    [
      "a website of 3,000 characters",
      { ...BASE, website: `https://example.com/${"a".repeat(3000)}` },
      { field: "website", kind: "website" },
    ],
    ["a number as the idea", { ...BASE, idea: 5 }, { field: "idea", kind: "required" }],
    [
      "an answer past the raw cap",
      { ...BASE, problem: "a".repeat(8001) },
      { field: "problem", kind: "too-long" },
    ],
  ];

  it.each(cases)("%s fails at its field with its kind", (_name, input, expected) => {
    expect(problems(input)).toContainEqual(expected);
  });

  it.each([null, undefined, "text", 5, [], [BASE]])(
    "an input that is not an object (%j) is refused for the name and the idea",
    (input) => {
      expect(problems(input)).toEqual([
        { field: "projectName", kind: "required" },
        { field: "idea", kind: "required" },
      ]);
    },
  );

  it("reports every problem at once, in field order", () => {
    expect(
      problems({
        projectName: "",
        idea: "",
        industry: "a".repeat(2001),
        website: "ftp://x.example/",
      }),
    ).toEqual([
      { field: "projectName", kind: "required" },
      { field: "idea", kind: "required" },
      { field: "industry", kind: "too-long" },
      { field: "website", kind: "website" },
    ]);
  });

  it("an unknown key fails the whole input, whatever else it holds", () => {
    const r = checkIntake({ ...BASE, extra: "x", __proto__: { admin: true } });
    expect(r.ok).toBe(false);
  });

  it("no problem carries a value, and the website with credentials is kept nowhere", () => {
    const secrets = ["user:secret", "TOPSECRETIDEA", "SECRETNAME", "KEYNAME"];
    const results = [
      checkIntake({ projectName: "SECRETNAME", idea: "TOPSECRETIDEA".repeat(300) }),
      checkIntake({ ...BASE, website: "https://user:secret@example.com/" }),
      checkIntake({ ...BASE, KEYNAME: "TOPSECRETIDEA" }),
    ];
    for (const r of results) {
      expect(r.ok).toBe(false);
      const text = JSON.stringify(r);
      for (const s of secrets) expect(text).not.toContain(s);
      if (!r.ok) {
        for (const p of r.problems) expect(Object.keys(p).sort()).toEqual(["field", "kind"]);
      }
    }
  });

  it("the input schema is strict and caps the raw length at 8,000 before the trim", () => {
    expect(intakeInputSchema.safeParse({ idea: "a".repeat(8000) }).success).toBe(true);
    expect(intakeInputSchema.safeParse({ idea: "a".repeat(8001) }).success).toBe(false);
    expect(intakeInputSchema.safeParse({ nope: "x" }).success).toBe(false);
  });
});

describe("website forms", () => {
  // Worked example W6, one input per line, in its order.
  const W6: Array<[string, string]> = [
    ["example.com", "https://example.com/"],
    ["  https://clinic.example/  ", "https://clinic.example/"],
    ["https://user:secret@example.com/", "refused"],
    ["ftp://example.com/", "refused"],
    ["javascript:alert(1)", "refused"],
    ["", "empty"],
  ];
  const show = (text: string): string => {
    const r = websiteOf(text);
    if (!r.ok) return "refused";
    return r.href ?? "empty";
  };

  it.each(W6)("%j gives %s", (input, expected) => {
    expect(show(input)).toBe(expected);
  });

  it("refuses a password alone and a username alone", () => {
    expect(show("https://:pw@example.com/")).toBe("refused");
    expect(show("https://user@example.com/")).toBe("refused");
  });

  it("takes http, and a scheme in capitals", () => {
    expect(show("http://example.com/a")).toBe("http://example.com/a");
    expect(show("HTTPS://Example.com/")).toBe("https://example.com/");
  });

  it("takes 2,048 characters and refuses 2,049, counted after https:// is put in front", () => {
    const at = (n: number) =>
      `https://example.com/${"a".repeat(n - "https://example.com/".length)}`;
    expect(websiteOf(at(2048)).ok).toBe(true);
    expect(websiteOf(at(2049)).ok).toBe(false);
    const bare = (n: number) => `example.com/${"a".repeat(n - "https://example.com/".length)}`;
    expect(websiteOf(bare(2048)).ok).toBe(true);
    expect(websiteOf(bare(2049)).ok).toBe(false);
  });

  it("counts the parser's href, not the raw text: percent-encoding can make it longer", () => {
    // 300 Thai letters are 2,720 characters of href, from 320 characters of raw text.
    const raw = `example.com/${"ก".repeat(300)}`;
    expect(raw.length).toBeLessThan(2048);
    expect(websiteOf(raw).ok).toBe(false);
    expect(problems({ ...BASE, website: raw })).toEqual([{ field: "website", kind: "website" }]);
    // A space in the path is %20 in the href: three characters for one.
    const spaced = `example.com/${"a ".repeat(700)}`;
    expect(websiteOf(spaced).ok).toBe(false);
    // At the bound: 225 Thai letters (9 characters each) and 3 more make a 2,048 character href.
    const edge = (extra: number) => `example.com/${"ก".repeat(225)}${"a".repeat(extra)}`;
    const kept = websiteOf(edge(3));
    expect(kept.ok && kept.href?.length).toBe(2048);
    expect(websiteOf(edge(4)).ok).toBe(false);
  });

  it("still refuses text over 2,048 characters whose href is shorter (the default port is dropped)", () => {
    const text = `https://example.com:443/${"a".repeat(2049 - "https://example.com:443/".length)}`;
    expect(text.length).toBe(2049);
    expect(new URL(text).href.length).toBeLessThanOrEqual(2048);
    expect(websiteOf(text).ok).toBe(false);
  });

  it("keeps only a website the stored form parses", () => {
    const inputs = [
      "example.com",
      "  https://clinic.example/  ",
      "http://example.com/a",
      "example.com/ร้านกาแฟ",
      "example.com/a b",
      `example.com/${"ก".repeat(225)}aaa`,
      `example.com/${"ก".repeat(225)}aaaa`,
      `example.com/${"ก".repeat(300)}`,
      `example.com/${"a ".repeat(700)}`,
      `https://example.com/${"a".repeat(2028)}`,
      `https://example.com/${"a".repeat(2029)}`,
    ];
    let kept = 0;
    for (const website of inputs) {
      const r = checkIntake({ ...BASE, website });
      if (!r.ok) continue;
      kept += 1;
      const stored: Record<string, unknown> = { version: "intake-1", ...r.intake };
      delete stored.projectName;
      expect(storedIntakeSchema.safeParse(stored).success).toBe(true);
    }
    expect(kept).toBe(7);
  });

  it("refuses text the URL parser cannot read", () => {
    expect(show("http://")).toBe("refused");
    expect(show("exa mple.com")).toBe("refused");
  });
});

describe("the stored form", () => {
  const stored = { version: "intake-1", idea: "We run a dental clinic." };

  it("parses what the service writes, and the key omitted", () => {
    expect(storedIntakeSchema.safeParse(stored).success).toBe(true);
    expect(
      storedIntakeSchema.safeParse({ ...stored, website: "https://example.com/", value: "v" })
        .success,
    ).toBe(true);
  });

  it("refuses a row changed outside the app", () => {
    const bad: unknown[] = [
      { ...stored, version: "intake-2" },
      { idea: stored.idea },
      { version: "intake-1" },
      { ...stored, idea: "" },
      { ...stored, idea: "i".repeat(2001) },
      { ...stored, industry: "" },
      { ...stored, problem: "p".repeat(2001) },
      { ...stored, website: "javascript:alert(1)" },
      { ...stored, website: "https://user:secret@example.com/" },
      { ...stored, website: "example.com" },
      { ...stored, website: "" },
      { ...stored, website: `https://example.com/${"a".repeat(2048)}` },
      { ...stored, projectName: "x" },
    ];
    for (const row of bad) expect(storedIntakeSchema.safeParse(row).success).toBe(false);
  });
});
