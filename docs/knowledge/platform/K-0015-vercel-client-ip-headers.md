---
id: K-0015
topic: platform
claim: Vercel's docs say its edge overwrites x-forwarded-for with the client's public IP to prevent spoofing (a custom value passes only through an Enterprise trusted proxy), and call x-vercel-forwarded-for and x-real-ip identical to it, with x-vercel-forwarded-for the one a proxy placed on top of Vercel cannot overwrite; the docs never say in so many words that a client-sent x-vercel-forwarded-for or x-real-ip is replaced.
source: "https://vercel.com/docs/headers/request-headers; https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package; https://raw.githubusercontent.com/vercel/vercel/main/packages/functions/src/headers.ts; https://vercel.com/docs/environment-variables/system-environment-variables; https://nextjs.org/docs/app/api-reference/functions/headers; https://nextjs.org/docs/app/guides/server-actions"
retrieved: 2026-10-26
confidence: 0.8
applies_to: [ORV-112]
license: own-words
---

## Evidence

Vercel's docs and the `@vercel/functions` source are Vercel's copyright with no reuse license on the page (the source repo is Apache-2.0, not on the README list), so this file is in our words with short quotes only. Confidence is 0.8 for what the docs state: every Vercel fact comes from one publisher, read on its docs site and in its source repo, so it counts as one source read and quoted. **The step from "documented" to "a client cannot forge it" is an inference, below 0.7 on its own until checked on a deployment** (see "What the docs do not say").

### 1. The three IP headers (request headers page, `last_updated: 2025-12-13`)

Under `x-forwarded-for`:

> The public IP address of the client that made the request.
>
> If you are trying to use Vercel behind a proxy, we currently overwrite the [`X-Forwarded-For`] header and **do not forward external IPs**. This restriction is in place to prevent IP spoofing.

Under "Custom `X-Forwarded-For` IP":

> Trusted Proxy is available on Enterprise plans

Under `x-vercel-forwarded-for` and `x-real-ip`:

> This header is identical to the `x-forwarded-for` header. However, `x-forwarded-for` could be overwritten if you're using a proxy on top of Vercel.

> This header is identical to the `x-forwarded-for` header.

What this states, in our words:

- `x-forwarded-for` is overwritten by Vercel. A value the caller sends is not passed on; the stated reason is to prevent IP spoofing. The only documented way to keep a custom value is the Enterprise trusted proxy, so on Hobby no plan setting lets a client value through.
- `x-real-ip` holds the same value as `x-forwarded-for`.
- `x-vercel-forwarded-for` holds the same value, and is the one to read if a proxy (for example another CDN) sits in front of Vercel and rewrites `x-forwarded-for`. The page names the risk as a proxy overwriting `x-forwarded-for`, not a client.

### 2. Vercel's own helper reads `x-real-ip`

The `@vercel/functions` reference (`last_updated: 2026-09-03`) says `ipAddress(request)` "Returns the IP address of the request from the headers." It does not name the header. The source (`packages/functions/src/headers.ts`, branch `main`) does:

```ts
export const IP_HEADER_NAME = "x-real-ip";
```

`ipAddress` accepts a `Request` or a `Headers` object and returns `string | undefined`; when the header is absent it returns `undefined` (`headers.get` gives `null`, turned into `undefined`). The package is not a dependency of this repo today (`apps/web/package.json`, `packages/auth/package.json`).

### 3. Reading a header in a server action (Next.js docs)

`headers()` from `next/headers` (page `lastUpdated: 2026-06-09`) is async and returns a "**read-only** [Web Headers]" object; since `v15.0.0-RC` it must be awaited. The repo runs Next.js 16.4.1. The page's examples are Server Components; the server actions guide (`lastUpdated: 2026-10-15`) tells actions to "Treat `FormData`, query parameters, and headers as untrusted", and the `use server` page says to "Read authentication from cookies or headers". Neither page shows `headers()` inside an action in code, though the call is the same: `const ip = (await headers()).get('x-vercel-forwarded-for')`. In a route handler the same value is `request.headers.get(...)`, which is what the Vercel page's own examples use. Because a `Headers` object is what `headers()` returns, `ipAddress(await headers())` from `@vercel/functions` also type-checks against the signature in section 2.

### 4. Knowing whether the code runs on Vercel (system environment variables page, `last_updated: 2026-07-15`)

> An indicator to show that system environment variables have been exposed to your project's Deployments.

That is `VERCEL=1`, "Available at: Both build and runtime". `VERCEL_ENV` is "production, preview, or development". The page says these are exposed when "Enable access to System Environment Variables" is checked in project settings.

### What the docs do not say

- **That a client-sent `x-vercel-forwarded-for` or `x-real-ip` is stripped or replaced.** Only `x-forwarded-for` carries the "overwrite ... to prevent IP spoofing" sentence. The other two are "identical" to it, which implies Vercel sets them from the same source, but the docs do not describe what happens when a request arrives already carrying them. Check before relying on it: send a request to a staging deployment with forged values in all three headers and confirm that all three come back equal to each other and to the caller's real IP.
- **Whether the value can be a comma-separated list.** The docs describe a single "public IP address". They do not show a list. Taking the first comma-separated item, trimmed, behaves the same on a single value and on a list.
- **Any Hobby-specific behavior.** The only plan statement is the Enterprise trusted proxy; nothing says Hobby, Pro or preview deployments set these headers differently.
- **Local development.** No page read here says what `next dev` or `vercel dev` puts in these headers, or whether `VERCEL` is set locally (for example in a `.env.local` written by `vercel env pull`). The `VERCEL` description ties it to Deployments only. A rule of "off Vercel means `VERCEL` is unset" is therefore not documented; if a pulled env file sets it locally, a check on `VERCEL` alone would think it runs on Vercel while the trusted header is absent.

### Options this evidence supports (not a decision)

| Option | Header read on Vercel    | What the docs back                                                          | Gap                                                                       |
| ------ | ------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| A      | `x-vercel-forwarded-for` | Same value as `x-forwarded-for`; survives a proxy placed in front of Vercel | Client-forgery behavior not stated                                        |
| B      | `x-real-ip`              | Same value; it is the header Vercel's own `ipAddress` helper reads          | Client-forgery behavior not stated; a front proxy is not discussed for it |
| C      | `x-forwarded-for`        | The only header the docs say is overwritten to prevent spoofing             | The docs warn a front proxy can overwrite it                              |

For local development and CI, where the header may be absent: a fixed subject (such as `local`), a fallback to whatever `x-forwarded-for` the dev server sees (spoofable, local only), or detecting Vercel by the presence of an edge-set header such as `x-vercel-id` rather than by `VERCEL` alone. The docs back none of these over the others.

## Why it matters for ORIVILO

ORV-112 keys signed-out rate limits on the client IP, so the header must be one the caller cannot choose. The docs back the spec's default (`x-vercel-forwarded-for`) as carrying the real IP and surviving a front proxy, but the claim that a client cannot forge it rests on an inference until a staging request with forged headers confirms it. Which header to pick, and how to detect local runs, is for the architect.
