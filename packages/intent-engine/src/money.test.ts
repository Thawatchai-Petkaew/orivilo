import { describe, expect, it } from "vitest";
import { toMicroUsd } from "./money";

describe("toMicroUsd (ADR 0015 decision 12: millionths of a US dollar, half to even)", () => {
  it("gives the spec's worked example 2", () => {
    expect([0.014, 0.0000125, 0.0000135, 0.00001251, 5].map(toMicroUsd)).toEqual([
      14000, 12, 14, 13, 5000000,
    ]);
  });

  it("rounds the halves 0.5, 1.5 and 2.5 millionths to 0, 2 and 2", () => {
    expect([0.0000005, 0.0000015, 0.0000025].map(toMicroUsd)).toEqual([0, 2, 2]);
  });

  it("rounds a value just past a half up and just under a half down", () => {
    expect(toMicroUsd(0.00000051)).toBe(1);
    expect(toMicroUsd(0.00000049)).toBe(0);
  });

  it("reads an exponent form (5e-7 is half a millionth, 1.5e-6 is 1.5)", () => {
    expect(String(5e-7)).toBe("5e-7");
    expect(toMicroUsd(5e-7)).toBe(0);
    expect(toMicroUsd(1.5e-6)).toBe(2);
    expect(toMicroUsd(1e-7)).toBe(0);
  });

  it("does not multiply the float: 1.005 and 0.29 keep their printed digits", () => {
    expect(toMicroUsd(1.005)).toBe(1005000);
    expect(toMicroUsd(0.29)).toBe(290000);
  });

  it("gives 0 for 0 and for negative zero", () => {
    expect(toMicroUsd(0)).toBe(0);
    expect(toMicroUsd(-0)).toBe(0);
  });

  it("gives null for a negative", () => {
    expect(toMicroUsd(-0.000001)).toBeNull();
    expect(toMicroUsd(-5)).toBeNull();
  });

  it("gives null for NaN and the infinities", () => {
    expect(toMicroUsd(Number.NaN)).toBeNull();
    expect(toMicroUsd(Number.POSITIVE_INFINITY)).toBeNull();
    expect(toMicroUsd(Number.NEGATIVE_INFINITY)).toBeNull();
  });

  it("gives null for a result that is not a safe integer", () => {
    expect(toMicroUsd(1e21)).toBeNull();
    expect(toMicroUsd(9_007_199_254)).toBe(9_007_199_254_000_000);
    expect(toMicroUsd(9_007_199_255)).toBeNull();
  });
});
