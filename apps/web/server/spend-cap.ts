import "server-only";
import { createSpendCap, type SpendCap } from "@orivilo/auth";
import { accessDeps } from "./auth";

let shared: SpendCap | undefined;

/** The app's one spend cap helper (ORV-121), on the same access deps as every workspace query. */
export function spendCap(): SpendCap {
  shared ??= createSpendCap({ access: accessDeps() });
  return shared;
}
