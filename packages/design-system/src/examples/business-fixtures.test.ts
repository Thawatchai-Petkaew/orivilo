import { BUSINESS_READ_MODEL, type BusinessAnswer, readBusiness } from "@orivilo/intent-engine";
import { describe, expect, it } from "vitest";
import {
  ENGLISH_READ_INTAKE,
  ENGLISH_READ_RECORD,
  ENGLISH_READ_SPECS,
  FIXTURE_HASH,
  INTAKE_ID,
  type ReadingSpec,
  SAVED_AT,
  THAI_READ_INTAKE,
  THAI_READ_RECORD,
  THAI_READ_SPECS,
} from "./business-fixtures";

/**
 * ORV-287 row 9. `readingOf` builds the records the reading stories show by hand, in the way
 * `readBusiness` builds one from a model's answer. Nothing else holds the two together, so a change
 * to the adapter that the fixtures do not follow would leave the stories showing a record the app
 * can no longer save. Each fixture's readings are written as the typed model answer they stand for
 * and run through `readBusiness` with a fake completion (no model is reached), the intake id and
 * saved time of the fixtures and a hash function that returns the fixtures' hash. When the two
 * differ, the fixture is corrected to match the adapter, never the reverse.
 */

const answerOf = (specs: readonly ReadingSpec[]): BusinessAnswer => ({
  readings: specs.map((spec) => ({
    field: spec.field,
    value: spec.value,
    quotes: spec.quotes.map(([answer, text]) => ({ answer, text })),
  })),
});

describe("story fixtures match the adapter", () => {
  it.each([
    ["Thai", THAI_READ_INTAKE, THAI_READ_SPECS, THAI_READ_RECORD],
    ["English", ENGLISH_READ_INTAKE, ENGLISH_READ_SPECS, ENGLISH_READ_RECORD],
  ])(
    "%s: readBusiness gives the items of the fixture record, in the same order",
    async (_name, intake, specs, record) => {
      const answer = answerOf(specs);
      const { items } = await readBusiness(
        { intake, intakeId: INTAKE_ID, savedAt: SAVED_AT },
        {
          complete: () => Promise.resolve(JSON.stringify(answer)),
          sha256Text: () => FIXTURE_HASH,
          model: BUSINESS_READ_MODEL,
        },
      );
      expect(record.items.length).toBeGreaterThan(0);
      expect(items).toEqual(record.items);
    },
  );
});
