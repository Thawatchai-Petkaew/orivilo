"use client";

import { z } from "zod";

// The CSP has no 'unsafe-eval' in production, and zod's compiled parsers build a function with
// `new Function`, which the browser reports as a violation. Turning the compiler off is a
// config read when each schema is built, so it must run before the design system's schemas load
// (ORV-116); the layout renders this first.
z.config({ jitless: true });

export function ZodJitless() {
  return null;
}
