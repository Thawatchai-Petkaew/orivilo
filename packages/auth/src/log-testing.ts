import { expect, vi } from "vitest";

/** Test helpers for the request-time log lines (ORV-141 row 15). Import as `@orivilo/auth/log-testing`. */

type Stream = "log" | "warn" | "error";
const STREAMS: readonly Stream[] = ["log", "warn", "error"];
const LEVEL_OF: Record<Stream, string> = { log: "info", warn: "warn", error: "error" };
const KEYS = [
  "level",
  "requestId",
  "route",
  "durationMs",
  "outcome",
  "step",
  "limit",
  "reason",
  "status",
  "errorName",
];

/** One call to `console.log`, `console.warn` or `console.error`. */
export interface CapturedLine {
  stream: Stream;
  args: unknown[];
}

/**
 * Spies on the three console methods, silences them and records each call in order. Call
 * `restore()` in `afterEach`.
 */
export function captureLines(): { lines: CapturedLine[]; restore(): void } {
  const lines: CapturedLine[] = [];
  const spies = STREAMS.map((stream) =>
    vi.spyOn(console, stream).mockImplementation((...args: unknown[]) => {
      lines.push({ stream, args });
    }),
  );
  return {
    lines,
    restore() {
      for (const spy of spies) spy.mockRestore();
    },
  };
}

/**
 * Checks one captured line against `orv141-line-shape` and `orv141-allow-list`: one string
 * argument without a newline, valid JSON, the five required keys with their types, no key outside
 * the allow-list, and the stream matches the level. Returns the parsed line.
 */
export function expectLineShape(line: CapturedLine): Record<string, unknown> {
  expect(line.args).toHaveLength(1);
  // A non-string, non-JSON or non-object argument fails in the next lines.
  const text = line.args[0] as string;
  expect(text).not.toMatch(/[\r\n]/);
  const fields = JSON.parse(text) as Record<string, unknown>;
  expect(typeof fields["requestId"]).toBe("string");
  expect(typeof fields["route"]).toBe("string");
  expect(Number.isInteger(fields["durationMs"]) && (fields["durationMs"] as number) >= 0).toBe(
    true,
  );
  expect(typeof fields["outcome"]).toBe("string");
  for (const key of Object.keys(fields)) expect(KEYS).toContain(key);
  expect(fields["level"]).toBe(LEVEL_OF[line.stream]);
  return fields;
}
