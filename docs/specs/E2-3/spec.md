---
issue: E2-3 (placeholder; folder is renamed to the ORV key when the Jira issue is created)
lane: M
version: 1
---

## Why

DESIGN.md §1: the Studio shell runs the neutral profile, and nothing of the shell leaks into a customer preview (§9 item 10). After E2-2 the profiles exist, but the app in `apps/web` still carries placeholder colours, the shell has no colour mode, a profile cannot follow the OS, a profile resolved at runtime cannot render without a build, and nothing stops a customer profile from inheriting the shell's violet and lime or carrying the Studio's intent action. This story closes those gaps so that E2-4 components and the E2-11 preview land on a shell that already behaves.

## Story

As a person opening the Studio, I want the shell to render from the real token contract in my system's colour mode, and as an agent composing a customer preview, I want a profile boundary that can never show ORIVILO's own colours, so that the shell and the previews are two namespaces on one component set.

## Acceptance criteria

| #   | Given                                                                                         | When                                                         | User sees                                                                                                                                                           | Data effect                                                                   |
| --- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | `apps/web` built and started                                                                  | Opening `/` with the OS in light, then in dark               | The page painted from semantic tokens (canvas, ink, one lime bead, one violet link), self-hosted Anuphan and Plex, dark values under a dark OS, no flash, no script | `data-design-profile="neutral"` and `data-mode="system"` on the root boundary |
| 2   | `DesignProfileBoundary` with `mode="system"`                                                  | The OS preference changes                                    | The subtree follows it through `prefers-color-scheme` in the generated CSS                                                                                          | None                                                                          |
| 3   | A `Profile` object that is not registered and not in `generated.css`                          | Rendered through `DesignProfileBoundary profile={object}`    | Its values apply inside the boundary (Foundations › Profiles, "A profile object at runtime"); the play function reads the computed properties                       | The boundary renders the profile's CSS inline                                 |
| 4   | A profile overrides `action.intent` or any other Studio-scoped token                          | `pnpm test`                                                  | `profiles.test.ts` fails naming the token as Studio-only                                                                                                            | None                                                                          |
| 5   | A profile leaves an identity token (`text.link`, `brand.signature`, ...) at the shell's value | `pnpm test`                                                  | One failing line per identity token                                                                                                                                 | None                                                                          |
| 6   | Any profile boundary other than neutral                                                       | Something inside it uses `action.intent` or `text.on-intent` | It renders as the profile's own `action.primary` and `text.on-action`; the Profiles story asserts this on every sample                                              | Remap lines in every profile block                                            |
| 7   | `semantic.json`                                                                               | Reading `$extensions.orivilo.scope`                          | `studio` on the four intent tokens, `identity` on the eight violet and lime carriers; `tokens.test.ts` pins both lists                                              | None                                                                          |
| 8   | `DESIGN.md`                                                                                   | Reading §12                                                  | Neutral profile for the shell and the boundary's runtime internals are marked real with this story                                                                  | None                                                                          |

## Rules and bounds

- `BoundaryMode` is `light`, `dark`, or `system`; token values exist for the first two. The generated CSS declares the light set on `:root, [data-mode="light"], [data-mode="system"]`, the dark set on `[data-mode="dark"]`, and the dark set again under `@media (prefers-color-scheme: dark)` for `[data-mode="system"]`. Each profile adds the same media block for its own overrides. No script sets the mode; a user override later is an explicit `light` or `dark` on the boundary.
- The boundary's default mode is `system`. Storybook always passes the toolbar's explicit mode.
- Token scope lives in `semantic.json` as `$extensions.orivilo.scope`. `studio`: `action.intent`, `action.intent-hover`, `action.intent-press`, `text.on-intent`. `identity`: `text.link`, `text.link-hover`, `text.brand`, `surface.selected`, `selection.bg`, `selection.fg`, `brand.signature`, `brand.ink`. Only semantic tokens carry a scope.
- A profile never overrides a Studio-scoped token; `STUDIO_REMAP` in `src/profiles/model.ts` names what each one renders as inside a profile boundary, and every Studio-scoped token must have an entry. A profile must override every identity token.
- `DesignProfileBoundary` accepts a registered id or a `Profile` object. For an object it renders a `<style>` with `profile.emitCss()` inside the boundary; selectors are scoped by the profile id, so two boundaries with the same object share the same CSS.
- `apps/web` imports fonts and tokens from the package, transpiles it, and allows `.ts` import extensions so the package's Node-runnable sources type-check inside Next. The root layout wraps every page in the neutral boundary; pages use layout utilities and semantic utilities only (the lint rule from E2-0 runs in the app).
- The home page states what is real and what is not (AGENTS.md rule 4). It is Studio chrome, not a shared component: no catalog entry.

## Out of scope

Components and recipes (E2-4), portal scope (E2-5), a user-facing mode switch, a Studio-specific profile file (the base set is the neutral profile by definition), the preview frame and live profile editing (E2-11), the resolver that builds profile objects (E2-9), deployment of the shell or Storybook to a URL (E0-3).

## Depends on

E2-2 (profile model), E2-1, E2-0, DESIGN.md v1.3. Unblocks E2-4, E2-5, E2-11.

## Changelog

- v1 (2026-10-21): written and delivered in the same PR at the owner's request. Decisions taken while building: `system` mode in CSS rather than a script, so the shell never flashes and previews need no JS; Studio-only tokens are remapped rather than unset, so a leak degrades to the profile's own action instead of an invisible control; identity tokens are required overrides rather than lint, because the leak is a value, not a class name; the runtime profile renders through a scoped `<style>` rather than inline custom properties, so it follows `system` mode and nests like a registered profile. Browser evidence: computed `--ds-surface-canvas` is gray.50 under a light OS and gray.900 under a dark OS on the built app, fonts report loaded, no horizontal overflow at 360 px.
