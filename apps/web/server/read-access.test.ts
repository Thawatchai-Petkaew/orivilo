import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { mayRead } = await import("./read-access");

// ORV-268 rows 1 to 6 (read-allow-list-1). Every address is a fixture under example.com or example.test.
const LIST = "reader@example.com,second@example.test";
const MESSY = " Reader@Example.COM ,second@example.test\n";

afterEach(() => {
  vi.unstubAllEnvs();
});

const withList = (value: string | undefined) => {
  if (value === undefined) delete process.env["READ_ALLOWED_EMAILS"];
  else vi.stubEnv("READ_ALLOWED_EMAILS", value);
};

describe("read-allow-list-1", () => {
  it("unset denies", () => {
    withList(undefined);
    expect(mayRead("reader@example.com")).toBe(false);
  });

  it("empty denies", () => {
    withList("");
    expect(mayRead("reader@example.com")).toBe(false);
    withList(" , ,  ");
    expect(mayRead("reader@example.com")).toBe(false);
  });

  it("listed allows", () => {
    withList(LIST);
    expect(mayRead("reader@example.com")).toBe(true);
    expect(mayRead("second@example.test")).toBe(true);
  });

  it("not listed denies", () => {
    withList(LIST);
    expect(mayRead("other@example.com")).toBe(false);
    expect(mayRead("reader@example.co")).toBe(false);
    expect(mayRead("eader@example.com")).toBe(false);
    withList("example.com,*@example.com");
    expect(mayRead("reader@example.com")).toBe(false);
  });

  describe("case and whitespace", () => {
    it.each([
      ["reader@example.com", true],
      ["READER@EXAMPLE.COM ", true],
      [" Second@Example.Test", true],
      ["re.ader@example.com", false],
      ["reader+x@example.com", false],
    ])("%j gives %s", (email, expected) => {
      withList(MESSY);
      expect(mayRead(email)).toBe(expected);
    });
  });

  it("no email denies", () => {
    withList(LIST);
    expect(mayRead("")).toBe(false);
    expect(mayRead(undefined)).toBe(false);
    expect(mayRead(null)).toBe(false);
    expect(mayRead("   ")).toBe(false);
    // A list with empty slots must not let an empty address match one of them.
    withList("reader@example.com,, ,");
    expect(mayRead("")).toBe(false);
    expect(mayRead("  ")).toBe(false);
  });

  it("reads the variable on each call, not once", () => {
    withList(LIST);
    expect(mayRead("reader@example.com")).toBe(true);
    withList("second@example.test");
    expect(mayRead("reader@example.com")).toBe(false);
  });
});
