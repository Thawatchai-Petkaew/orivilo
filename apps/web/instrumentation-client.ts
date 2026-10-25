import { z } from "zod";

// The CSP has no 'unsafe-eval' in production, and zod's compiled parsers build a function with
// `new Function`, which the browser reports as a violation. Turning the compiler off is a config
// read when each schema is built, so it must run before the design system's schemas load. Next runs
// this file before the app becomes interactive (ORV-116).
z.config({ jitless: true });
