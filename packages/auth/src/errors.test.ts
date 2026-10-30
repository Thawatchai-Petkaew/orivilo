import { describe, expect, it } from "vitest";
import { codeOfStatus, ERROR_CODES, errorBody, errorResponse, failureFields } from "./errors.ts";

const ID = "5f0c6f7e-2b1d-4c3a-9e8f-0a1b2c3d4e5f";

/** The spec's orv144-codes table, written out here and not read from the module. */
const TABLE = [
  ["BAD_REQUEST", 400, false, "The request is not valid."],
  ["UNAUTHENTICATED", 401, false, "Sign in to continue."],
  ["FORBIDDEN", 403, false, "This action is not allowed."],
  ["NOT_FOUND", 404, false, "Not found."],
  ["TIMEOUT", 408, true, "The request took too long. Try again."],
  ["CONFLICT", 409, false, "The request conflicts with the current state."],
  ["PAYLOAD_TOO_LARGE", 413, false, "The request is too large."],
  ["INVALID_INPUT", 422, false, "The input is not valid."],
  ["RATE_LIMITED", 429, true, "Too many requests. Try again later."],
  ["INTERNAL_ERROR", 500, false, "Something went wrong on our side."],
  ["UPSTREAM_FAILED", 502, true, "A service we depend on failed. Try again later."],
  ["SERVICE_UNAVAILABLE", 503, true, "Service unavailable. Try again later."],
  [
    "UPSTREAM_TIMEOUT",
    504,
    true,
    "A service we depend on did not answer in time. Try again later.",
  ],
] as const;

describe("the error code list", () => {
  it("the code list is the matrix's statuses, one code each", () => {
    expect(Object.keys(ERROR_CODES)).toStrictEqual(TABLE.map(([code]) => code));
    for (const [code, status, retryable, message] of TABLE) {
      expect(ERROR_CODES[code]).toStrictEqual({ status, retryable, message });
    }
    const statuses = Object.values(ERROR_CODES).map((entry) => entry.status);
    expect(new Set(statuses).size).toBe(13);
    expect(statuses).toStrictEqual(TABLE.map(([, status]) => status));

    for (const [code, status] of TABLE) expect(codeOfStatus(status)).toBe(code);
    expect(codeOfStatus(401)).toBe("UNAUTHENTICATED");
    expect(codeOfStatus(418)).toBe("BAD_REQUEST");
    expect(codeOfStatus(500)).toBe("INTERNAL_ERROR");
    expect(codeOfStatus(501)).toBe("INTERNAL_ERROR");
    expect(codeOfStatus(503)).toBe("SERVICE_UNAVAILABLE");
    // The class fallback has two edges: below 500 is BAD_REQUEST, 500 and above INTERNAL_ERROR.
    expect(codeOfStatus(499)).toBe("BAD_REQUEST");
    expect(codeOfStatus(599)).toBe("INTERNAL_ERROR");
  });

  it("builds the body of the worked example byte for byte, with the keys in order", () => {
    const text = JSON.stringify(errorBody("INTERNAL_ERROR", ID));
    expect(text).toBe(
      '{"error":{"code":"INTERNAL_ERROR","message":"Something went wrong on our side.","requestId":"5f0c6f7e-2b1d-4c3a-9e8f-0a1b2c3d4e5f","retryable":false}}',
    );
    const body = errorBody("RATE_LIMITED", ID);
    expect(Object.keys(body)).toStrictEqual(["error"]);
    expect(Object.keys(body.error)).toStrictEqual(["code", "message", "requestId", "retryable"]);
    expect(body.error.retryable).toBe(true);
  });

  it("errorResponse defaults the status to the code's and takes an override", async () => {
    const response = errorResponse("NOT_FOUND", ID);
    expect(response.status).toBe(404);
    expect(await response.json()).toStrictEqual(errorBody("NOT_FOUND", ID));
    expect(errorResponse("BAD_REQUEST", ID, { status: 418 }).status).toBe(418);
    expect(errorResponse("INTERNAL_ERROR", ID, { status: 501 }).status).toBe(501);
  });

  it("errorResponse sets content-type and x-request-id over copied values and keeps each Set-Cookie", () => {
    const source = new Headers({
      "content-type": "text/html",
      "x-request-id": "not-ours",
      location: "/elsewhere",
    });
    source.append("set-cookie", "a=1; Path=/");
    source.append("set-cookie", "b=2; Path=/");
    const response = errorResponse("UNAUTHENTICATED", ID, { status: 401, headers: source });
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(response.headers.get("x-request-id")).toBe(ID);
    expect(response.headers.get("location")).toBe("/elsewhere");
    expect(response.headers.getSetCookie()).toStrictEqual(["a=1; Path=/", "b=2; Path=/"]);

    const plain = errorResponse("FORBIDDEN", ID);
    expect(plain.headers.get("content-type")).toBe("application/json");
    expect(plain.headers.get("x-request-id")).toBe(ID);
    const fromObject = errorResponse("TIMEOUT", ID, { headers: { "retry-after": "3" } });
    expect(fromObject.headers.get("retry-after")).toBe("3");
  });

  it("failureFields gives the code, the id and the code's retryable", () => {
    expect(failureFields("RATE_LIMITED", ID)).toStrictEqual({
      code: "RATE_LIMITED",
      requestId: ID,
      retryable: true,
    });
    expect(failureFields("INTERNAL_ERROR", ID)).toStrictEqual({
      code: "INTERNAL_ERROR",
      requestId: ID,
      retryable: false,
    });
    const limited: true = failureFields("RATE_LIMITED", ID).retryable;
    expect(limited).toBe(true);
  });
});
