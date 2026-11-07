---
id: K-0092
topic: platform
claim: In Better Auth 1.7.12 the organization plugin answers a signed-in caller 400 ORGANIZATION_NOT_FOUND for a missing organization and 403 for an existing one the caller is not in on get-organization and get-full-organization (and, by slug only, on set-active, list-members and get-active-member-role), while update, delete, remove-member, update-member-role, leave, invite-member and list-invitations give a missing and a foreign organization the same status and code; both errors carry the body keys message and code; the top-level disabledPaths option answers a matching path 404 with the string body Not Found (not JSON) before any route runs; and remove-member clears an active organization only when callers remove themselves, and only on the calling session.
source: "better-auth 1.7.12 installed package (MIT), paths inside it: better-auth/package.json (lines 3, 6); better-auth/dist/plugins/organization/routes/crud-org.mjs; better-auth/dist/plugins/organization/routes/crud-members.mjs; better-auth/dist/plugins/organization/routes/crud-invites.mjs; better-auth/dist/plugins/organization/routes/crud-team.mjs; better-auth/dist/plugins/organization/routes/crud-access-control.mjs; better-auth/dist/plugins/organization/error-codes.mjs; better-auth/dist/plugins/organization/organization.mjs (lines 419, 566 to 580); better-auth/dist/plugins/organization/adapter.mjs (lines 241 to 253, 305 to 351, 397 to 420, 474 to 485); better-auth/dist/plugins/organization/call.mjs (lines 11 to 13); better-auth/dist/api/index.mjs (lines 151 to 183); better-auth/dist/api/routes/session.mjs (lines 292 to 299, 316 to 323); better-auth/dist/plugins/open-api/generator.mjs (lines 441, 489); @better-auth/core 1.7.12 installed package, paths inside it: @better-auth/core/dist/types/init-options.d.mts (lines 450, 1532 to 1537, 1571); @better-auth/core/dist/error/index.mjs (lines 16 to 30); @better-auth/core/dist/utils/error-codes.mjs (lines 2 to 7); @better-auth/core/dist/utils/url.mjs (lines 18 to 30); better-call 1.4.4 installed package, paths inside it: better-call/dist/error.mjs (lines 56 to 60, 102 to 122); better-call/dist/to-response.mjs (lines 127 to 131, 154 to 161); better-call/dist/router.mjs (lines 28 to 51, 83 to 92, 101 to 108); packages/auth/package.json (line 19); packages/auth/src/config.ts (lines 42 to 43, 74 to 84); packages/auth/src/auth-route.ts (lines 38 to 47, 106); packages/auth/src/errors.ts (lines 11, 13, 14, 52 to 57); apps/web/app/api/auth/[...all]/route.ts (line 6); https://github.com/better-auth/better-auth/blob/v1.7.12/packages/better-auth/src/plugins/organization/routes/crud-org.ts; https://github.com/better-auth/better-auth/blob/v1.7.12/packages/better-auth/src/plugins/organization/routes/crud-members.ts; https://github.com/better-auth/better-auth/blob/v1.7.12/packages/better-auth/src/api/index.ts; https://www.better-auth.com/docs/reference/options; https://www.better-auth.com/docs/plugins/organization"
retrieved: 2026-10-30
confidence: 0.8
applies_to: [ORV-159, ORV-113, ADR 0015]
license: MIT
---

## Evidence

Better Auth, `@better-auth/core` and better-call are MIT (`better-auth/package.json` line 6: `"license": "MIT"`). This file states facts in our own words with short quotes of code. The repo pins `better-auth` and `@better-auth/core` at `1.7.12` (`packages/auth/package.json` lines 16 and 19; the installed `better-auth/package.json` line 3 reads `"version": "1.7.12"`). Both pnpm copies of better-call in the store are `1.4.4`.

Confidence is 0.8: every fact comes from one publisher's code, read line by line in the repo's installed copy and quoted once. Three spots (the `get-organization` throws, the `remove-member` condition and the `disabledPaths` response) were looked for again in the upstream source at tag `v1.7.12` through a fetch tool and found. No code was run: every status below is our reading of the code, not an observed answer. Paths are relative to each package root; line numbers are from the installed copy.

### 1. Which routes the app serves

- `packages/auth/src/config.ts` line 43 mounts `organizationPlugin()` with no options.
- `organization.mjs` adds the team routes only when `opts.teams?.enabled` (line 419, `const teamSupport = opts.teams?.enabled;`, and lines 566 to 569) and the role routes only when `opts.dynamicAccessControl?.enabled` (lines 577 to 580). With no options, neither group is served; they are recorded in section 3 for completeness.
- `addMember` is built with `createAuthEndpoint({ method: "POST", ... })` and no path (`crud-members.mjs` line 25), so it has no HTTP route; it is a server call only.
- Without a session the routes answer `401`, either through `orgSessionMiddleware` or `sessionMiddleware` (`call.mjs` lines 11 to 13), which throws `UNAUTHORIZED` with code `UNAUTHORIZED` (`session.mjs` lines 292 to 297), or through a check of their own, for example `update` (`crud-org.mjs` line 198), `delete` (line 260) and `get-invitation` (`crud-invites.mjs` line 500). `check-slug` uses `requestOnlySessionMiddleware`, which throws the same for a request without a session (`session.mjs` lines 316 to 321). Everything below is for a signed-in caller.

### 2. How a thrown error becomes the HTTP answer

`APIError.from(status, error)` copies only `code` and `message` into the body (`@better-auth/core/dist/error/index.mjs` lines 19 to 24):

```text
static from(status, error, options) {
    const { code, message } = error;
    if (options?.cause === void 0) return new APIError(status, {
        message,
        code
    });
```

`defineErrorCodes` turns each entry into `{ code: key, message: value }` (`@better-auth/core/dist/utils/error-codes.mjs` lines 2 to 7). The plugin's entries include `ORGANIZATION_NOT_FOUND: "Organization not found"` (`error-codes.mjs` line 8), `USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION: "User is not a member of the organization"` (line 9), `MEMBER_NOT_FOUND: "Member not found"` (line 14) and `YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION: "You are not a member of this organization"` (line 48).

better-call maps the status name to a number (`dist/error.mjs` lines 56, 57, 59 and 60: `BAD_REQUEST: 400`, `UNAUTHORIZED: 401`, `FORBIDDEN: 403`, `NOT_FOUND: 404`). The router turns a thrown `APIError` into an answer (`dist/router.mjs` line 92, `if (isAPIError(error)) return toResponse(error);`), and `toResponse` sends the error's body as JSON with the error's number as the status and its name as the status text (`dist/to-response.mjs` lines 127 to 131; the plain body object then takes lines 154 to 161, which serialise it with `safeStringify` and set `Content-Type` to `application/json`).

### 3. Each route: missing organization, existing organization the caller is not in, role too low

"Missing" means no organization row has that id or slug. "Not in" means the organization exists and the caller has no member row in it. Unless a line says otherwise, the body is `{ message, code }` as in section 2. A route "shows existence" when a missing and a foreign organization get a different status or code.

**`crud-org.mjs` (served)**

- `GET get-organization` (lines 298 to 330). Target: query `organizationSlug`, else `organizationId`, else the session's active organization (line 317); none gives `200` with `null` (line 318). Missing: `400 ORGANIZATION_NOT_FOUND` (line 321, after `findOrganizationById` or `findOrganizationBySlug`, line 320). Not in: first clears the caller's active organization (line 326, `await adapter.setActiveOrganization(session.session.token, null, ctx);`), then `403 USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION` (line 327). Role: no role check. Shows existence: yes, by id and by slug.
- `GET get-full-organization` (lines 336 to 373). Same order: target line 355, missing `400 ORGANIZATION_NOT_FOUND` (line 364), not in clears the active organization (line 369) then `403 USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION` (line 370). Shows existence: yes, by id and by slug.
- `POST set-active` (lines 378 to 435). By slug: missing `400 ORGANIZATION_NOT_FOUND` (line 416); found, the membership check follows. By id, or after the slug lookup: the membership check comes first (lines 420 to 426): no member row clears the active organization (line 424) and answers `403 USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION` (line 425), for a missing id and a foreign id alike. Line 428 (`400 ORGANIZATION_NOT_FOUND`) is reached only when a member row exists and the organization row does not. Shows existence: by slug only.
- `POST update` (lines 171 to 236). Target: body `organizationId`, else the active organization (line 199). Missing and not in: one lookup of the caller's member row (lines 202 to 205), then `400 USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION` (line 206) for both. Role too low: `403 YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_ORGANIZATION` (line 212). Shows existence: no.
- `POST delete` (lines 239 to 293). With `disableOrganizationDeletion` set, every call answers `404` with code `ORGANIZATION_DELETION_DISABLED` (lines 255 to 258). Otherwise missing and not in: `400 USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION` (line 268) for both. Role too low: `403 YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_ORGANIZATION` (line 274). Shows existence: no.
- `GET list` (lines 436 to 453) lists only the caller's own memberships (line 451; `listOrganizations` in `adapter.mjs` lines 474 to 485 reads `member` rows where `userId` is the caller). It takes no organization id.
- `POST check-slug` (lines 152 to 159) answers `200` with `{ status: true }` for a free slug (line 157) and `400 ORGANIZATION_SLUG_ALREADY_TAKEN` for a taken one (line 158), with no membership check. It shows whether a slug exists to any caller with a session.

**`crud-members.mjs` (served)**

- `POST remove-member` (lines 139 to 230). Target: body `organizationId`, else the active organization (line 171). Missing and not in: one lookup of the caller's member row (lines 174 to 177), then `400 MEMBER_NOT_FOUND` (line 178) for both. Role too low: `401 YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_MEMBER` (lines 202 to 207; the status is `UNAUTHORIZED`, not `FORBIDDEN`). Shows existence of the organization: no.
- `POST update-member-role` (lines 236 to 368). Missing and not in: `400 MEMBER_NOT_FOUND` (lines 278 to 282) for both. Role too low: `403 YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_MEMBER` (line 310; also line 292 for creator-role rules). On the member id: a missing id answers `400 MEMBER_NOT_FOUND` (line 284) and an id of a member of another organization answers `403 YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_MEMBER` (line 285), so a caller who is a member of any organization can tell whether a member id exists elsewhere.
- `GET get-active-member` (lines 369 to 404) reads only the active organization; no member row gives `400 MEMBER_NOT_FOUND` (line 402).
- `POST leave` (lines 406 to 436). Missing and not in: `400 MEMBER_NOT_FOUND` (lines 414 to 418) for both.
- `GET list-members` (lines 437 to 482). By slug: missing `400 ORGANIZATION_NOT_FOUND` (line 458). By id, or after the slug lookup: no member row gives `403 YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION` (lines 462 to 465), for a missing id and a foreign id alike. Shows existence: by slug only.
- `GET get-active-member-role` (lines 488 to 516). Same as `list-members`: missing slug `400 ORGANIZATION_NOT_FOUND` (line 499), no member row `403 YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION` (line 507); with a `userId` query naming a non-member, also `403` with that code (line 514). Shows existence: by slug only.

**`crud-invites.mjs` (served)**

- `POST invite-member` (from line 42). Missing and not in: `400 MEMBER_NOT_FOUND` (lines 90 to 94) for both. Role too low: `403 YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_ORGANIZATION` (lines 95 to 100). Shows existence: no.
- `GET list-invitations` (lines 525 to 542). Missing and not in: `403` with a body of `message` only, "You are not a member of this organization", and no `code` (line 539, `APIError.fromStatus("FORBIDDEN", { message: ... })`), for both. Shows existence: no.
- `POST cancel-invitation` (lines 409 to 458), keyed by invitation id. Missing invitation: `400 INVITATION_NOT_FOUND` (line 429). Invitation of an organization the caller is not in: `400 MEMBER_NOT_FOUND` (lines 430 to 434). Role too low: `403 YOU_ARE_NOT_ALLOWED_TO_CANCEL_THIS_INVITATION` (line 440). Same status, different code: it shows whether an invitation id exists.
- `POST accept-invitation`, `POST reject-invitation` and `GET get-invitation`, keyed by invitation id. Missing or not pending: `400` (lines 268, 377 to 380 and 503; the last two use the message "Invitation not found!", line 503 without a code). Not the invited email: `403 YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION` (lines 269, 381 and 504). So a caller who is not the recipient can tell whether an invitation id exists. The organization's name and slug are returned only after the recipient check (lines 517 to 521).

**`crud-team.mjs` (not served with the app's options)**

- `GET list-teams`: no member row gives `403 YOU_ARE_NOT_ALLOWED_TO_ACCESS_THIS_ORGANIZATION` (lines 388 to 391) for a missing and a foreign id alike.
- `GET list-team-members`: a missing team gives `400 TEAM_NOT_FOUND` (line 564) and a team of an organization the caller is not in gives `400 USER_IS_NOT_A_MEMBER_OF_THE_TEAM` (lines 565 to 568): same status, different code.
- `POST set-active-team` looks the team up within the active organization only (lines 431 to 435).
- Role too low answers `403` in `create-team` (line 90), `remove-team` (line 172), `update-team` (line 293), `add-team-member` (line 636) and `remove-team-member` (line 728).

**`crud-access-control.mjs` (not served with the app's options)**

Each role route looks up the caller's member row by `organizationId` and `userId` and, without one, answers `403 YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION` (`create-role` lines 58 to 77; the same throw at lines 184, 317, 383 and 482). A search of the file for `ORGANIZATION_NOT_FOUND` finds no line, so a missing and a foreign organization get the same answer there.

### 4. Do the FORBIDDEN and ORGANIZATION_NOT_FOUND answers differ in body shape?

From Better Auth's handler, no: both come from `APIError.from` (section 2), so both bodies have the same two keys, `message` and `code`. They differ in status (`403` against `400`), status text (`FORBIDDEN` against `BAD_REQUEST`) and the two values, for example `{"message":"Organization not found","code":"ORGANIZATION_NOT_FOUND"}` against `{"message":"User is not a member of the organization","code":"USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION"}` (our serialisation of the code read, key order as built in `error/index.mjs` lines 21 to 24). Among the throws listed in section 3, the ones without a `code` key are the two `fromStatus` throws with a `message` only (`crud-invites.mjs` lines 503 and 539).

Through this app's route the Better Auth body does not reach the caller. `apps/web/app/api/auth/[...all]/route.ts` line 6 wraps the handler in `authRoute`, which for any status of 400 or more drops the body and builds the ORV-144 body from the status alone (`packages/auth/src/auth-route.ts` lines 38 to 47 and 106). `codeOfStatus` gives `BAD_REQUEST` for `400`, `FORBIDDEN` for `403` and `NOT_FOUND` for `404` (`packages/auth/src/errors.ts` lines 11, 13, 14 and 52 to 57). By our reading, then, the `get-organization` pair reaches the caller as status `400` code `BAD_REQUEST` against status `403` code `FORBIDDEN`: the status and code still differ.

### 5. `disabledPaths`

**Option path.** `disabledPaths` is a top-level member of the options object passed to `betterAuth(...)`: it sits in `type BetterAuthOptions` (`@better-auth/core/dist/types/init-options.d.mts`, opened at line 450, closed at line 1571) at the same indent as `plugins` and `advanced`:

```text
/**
 * Disabled paths
 *
 * Paths you want to disable.
 */
disabledPaths?: string[] | undefined;
```

(lines 1532 to 1537). The docs give: "Disable specific auth paths." with the example `disabledPaths: ["/sign-up/email", "/sign-in/email"],`.

**What it does to a route.** In the router's `onRequest` (`better-auth/dist/api/index.mjs` lines 165 to 168):

```text
const disabledPaths = ctx.options.disabledPaths || [];
const normalizedPath = normalizePathname(req.url, basePath);
if (disabledPaths.includes(normalizedPath)) return new Response("Not Found", { status: 404 });
```

- Status `404`, body the plain string `Not Found`: not JSON, no `code`, no `message` key.
- The match is exact (`includes` on an array of strings) against the request's pathname with the auth base path and trailing slashes removed (`@better-auth/core/dist/utils/url.mjs` lines 18 to 30). The method and the query string play no part.
- It runs before the rate limit and the plugins' `onRequest` hooks (`api/index.mjs` lines 169 to 181), and better-call's handler returns a `Response` from `onRequest` before it looks up the route (`better-call/dist/router.mjs` lines 101 to 105). So the endpoint, its session check and its database reads do not run.
- A path with no route at all answers `404` too, but with a `null` body and status text `Not Found` (`router.mjs` lines 48 to 51). The two 404s differ in body. Through this app's `authRoute` both become the `NOT_FOUND` body (section 4), by our reading.
- A search of `better-auth/dist` for `disabledPaths` finds four lines in two files: `api/index.mjs` lines 166 and 168, and `plugins/open-api/generator.mjs` lines 441 and 489, where disabled paths are left out of the generated OpenAPI document. By our reading, a server-side `auth.api.*` call does not pass through the router's `onRequest` and so is not blocked by the option; this was not run.

### 6. Does removing a member clear that member's active organization?

Only for callers who remove themselves, and only on the session that made the call. `crud-members.mjs` line 223:

```text
if (session.user.id === toBeRemovedMember.userId && session.session.activeOrganizationId === toBeRemovedMember.organizationId) await adapter.setActiveOrganization(session.session.token, null, ctx);
```

- `setActiveOrganization(sessionToken, ...)` updates the one session with that token (`adapter.mjs` lines 397 to 398, `context.internalAdapter.updateSession(sessionToken, { activeOrganizationId: organizationId })`).
- `deleteMember` deletes the member row and, with teams on, the person's team rows; it does not touch any session (`adapter.mjs` lines 305 to 351).
- So when an admin removes another member, the removed person's sessions keep their `activeOrganizationId`. Their other sessions are not cleared even when they remove themselves.
- `leave` clears the leaver's calling session when it was on that organization (`crud-members.mjs` line 434). `delete` clears the caller's session when it deletes the caller's active organization (`crud-org.mjs` lines 275 to 279). `get-organization`, `get-full-organization` and `set-active` clear the caller's session before their `403` (lines 326, 369 and 424).
- The organization docs page describes neither this nor the status codes above. It says "By default when the user is signed in the active organization is set to `null`." This app sets it at session creation to the person's earliest membership instead (`packages/auth/src/config.ts` lines 74 to 84).

### What the sources do not say

- The Better Auth docs pages read (options, organization plugin) show no version label, so they are not tied to the 1.7 line. The organization page documents no status code for a non-member, a missing organization or a role that is too low. The statuses above come from the code only.
- No code was run. Which status a running app answers, through `authRoute`, was not observed.
- Whether a later version keeps these checks in the same order (for example membership before existence in `set-active`) is not stated anywhere read.

## Why it matters for ORIVILO

ADR 0015 decision 10 asks that a resource outside the caller's workspace answer like one that does not exist. Better Auth's own organization routes, served through `apps/web/app/api/auth/[...all]/route.ts`, answer a missing and a foreign organization differently on `get-organization`, `get-full-organization` and the slug paths, and `disabledPaths` is the library's switch that answers a path `404` before it runs. Whether the app keeps, disables or wraps those routes is for the architect and the owner.
