import { describe, expect, it } from "vitest";
import { type CuratedProfile } from "./directions";
import { type Interpretation } from "./interpreter";
import {
  DIRECTION_FILE_FORMAT,
  directionFileSchema,
  replaySnapshot,
  snapshotSchema,
  takeSnapshot,
} from "./saved";

// The two hand-made profiles of E2-2 (packages/design-system/src/profiles/source).
const profiles: CuratedProfile[] = [
  {
    id: "professional",
    decisions: {
      shape: "crisp",
      surfaceTreatment: "bordered",
      emphasis: "restrained",
      typeVoice: "single",
      motion: "quiet",
    },
  },
  {
    id: "friendly",
    decisions: {
      shape: "soft",
      surfaceTreatment: "flat",
      emphasis: "expressive",
      typeVoice: "paired",
      motion: "standard",
    },
  },
];

const input = {
  brief: "  เป็นระเบียบ หรูหรา  ",
  profileId: "friendly",
  locked: { surfaceTreatment: "bordered" as const },
  adjustments: [{ set: "shape" as const, to: "rounded" as const, reason: "chosen in Refine" }],
};

describe("snapshots (ORV-35)", () => {
  it("replays to the same fingerprint, directions and viewed profile (AC 1)", () => {
    const snapshot = takeSnapshot(input, profiles);
    expect(snapshot.brief).toBe("เป็นระเบียบ หรูหรา");
    const replay = replaySnapshot(snapshot, profiles);
    expect(replay.ok).toBe(true);
    if (!replay.ok) return;
    expect(replay.result.resolution.fingerprint).toBe(snapshot.fingerprint);
    expect(replay.profileId).toBe("friendly");
    expect(replay.result.resolution.decisions.shape).toEqual({
      value: "rounded",
      source: "adjustment",
      reason: "chosen in Refine",
    });
    expect(replay.result.directions.map((d) => d.profileId)).toEqual(["professional", "friendly"]);
  });

  it("changes the fingerprint when a refinement or its reason changes", () => {
    const a = takeSnapshot(input, profiles);
    const b = takeSnapshot(
      { ...input, adjustments: [{ set: "shape", to: "rounded", reason: "another" }] },
      profiles,
    );
    expect(b.fingerprint).not.toBe(a.fingerprint);
  });

  it("refuses a snapshot that no longer replays, with the reason (AC 2)", () => {
    const snapshot = takeSnapshot(input, profiles);
    expect(replaySnapshot({ ...snapshot, fingerprint: "00000000" }, profiles)).toEqual({
      ok: false,
      reason: "fingerprint-mismatch",
    });
    expect(replaySnapshot({ ...snapshot, resolverVersion: "rules-0" }, profiles)).toEqual({
      ok: false,
      reason: "resolver-changed",
    });
    expect(replaySnapshot({ ...snapshot, profileId: "gone" }, profiles)).toEqual({
      ok: false,
      reason: "profile-missing",
    });
    expect(replaySnapshot({ ...snapshot, brief: "เป็นกันเอง สนุก" }, profiles)).toEqual({
      ok: false,
      reason: "fingerprint-mismatch",
    });
  });

  it("round-trips through the file format and refuses a malformed file (AC 10)", () => {
    const file = {
      format: DIRECTION_FILE_FORMAT,
      schemaVersion: "1.0",
      name: "Clinic booking",
      version: { status: "approved", number: 2 },
      snapshot: takeSnapshot(input, profiles),
    };
    const parsed = directionFileSchema.parse(JSON.parse(JSON.stringify(file)));
    expect(replaySnapshot(parsed.snapshot, profiles).ok).toBe(true);

    expect(directionFileSchema.safeParse({ ...file, format: "other" }).success).toBe(false);
    expect(
      directionFileSchema.safeParse({ ...file, snapshot: { ...file.snapshot, extra: 1 } }).success,
    ).toBe(false);
    expect(
      snapshotSchema.safeParse({
        ...file.snapshot,
        adjustments: [{ set: "shape", to: "square", reason: "x" }],
      }).success,
    ).toBe(false);
  });
});

describe("a snapshot with a model's reading (ORV-62)", () => {
  // A reading as a model adapter returns it: the brief says "fun", the model read it as playful.
  const brief = "fun";
  const reading: Interpretation = {
    method: "llm",
    adapter: { id: "openrouter", version: "prompt-1+anthropic/claude-sonnet-5.5" },
    facts: { personality: { playful: 90 }, industry: null, audiences: [], avoid: [] },
    findings: [
      {
        field: "personality",
        axis: "playful",
        value: 90,
        polarity: "desired",
        evidence: { start: 0, end: 3, text: "fun" },
      },
    ],
    uncertain: [],
    missing: ["expressive", "structured", "warm", "premium"],
  };

  it("replays from the kept reading, not a new one, and says AI read it", () => {
    const snapshot = takeSnapshot({ brief, profileId: "friendly", reading }, profiles);
    expect(snapshot.reading).toEqual(reading);
    const replay = replaySnapshot(snapshot, profiles);
    if (!replay.ok) throw new Error(replay.reason);
    expect(replay.result.method).toBe("llm");
    expect(replay.result.interpretation).toEqual(reading);
    // The rules read "fun" as 75, the model as 90: the fingerprint is the reading's, not the rules'.
    const byRules = takeSnapshot({ brief, profileId: "friendly" }, profiles);
    expect(byRules.reading).toBeUndefined();
    expect(replaySnapshot(byRules, profiles)).toMatchObject({ ok: true });
  });

  it("refuses a reading that quotes words the brief does not have", () => {
    const snapshot = takeSnapshot({ brief, profileId: "friendly", reading }, profiles);
    expect(snapshotSchema.safeParse({ ...snapshot, brief: "fan" }).success).toBe(false);
    expect(snapshotSchema.safeParse(snapshot).success).toBe(true);
  });
});
