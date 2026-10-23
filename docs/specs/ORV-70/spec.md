---
issue: ORV-70 (https://tpetkaew.atlassian.net/browse/ORV-70)
lane: L (risk flag: component public API)
version: 1
---

## Why

Audit D.2 story 14 (`docs/specs/ORV-64/audit.md`, B.7). Studio tooltips on toolbar and inspector controls need a name plus one line on what the control does, and a tooltip at a panel edge needs to line up with its trigger instead of centring past the edge.

## Decisions this spec relies on

- ADR 0003: Radix gives the behaviour, the visual layer is ours.
- Catalog rule for Tooltip: nothing interactive inside; the trigger carries its own name.
- DESIGN.md §8: the inverse ground keeps `text.on-inverse`; there is no muted step on it that holds 4.5, so the description differs by type, not colour.

## Story

As a Studio user, I want a tooltip that names a control and says what it does, placed beside the control even at a panel edge, so that I learn the board without opening help.

## Acceptance criteria

| #   | Given                        | When              | Result                                                                                                 | Evidence                         |
| --- | ---------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------- |
| 1   | `content` and `description`  | The tooltip opens | Two lines, the description under the content in body type; the trigger's description reads both, apart | `WithDescription` play test      |
| 2   | `align="start"` or `"end"`   | The tooltip opens | Its left or right edge lines up with the trigger's                                                     | `Align` play test                |
| 3   | The two-line story           | Play test         | Nothing focusable inside the tooltip                                                                   | `WithDescription` play test      |
| 4   | No `description`, no `align` | Rendering         | Unchanged: one line, centred                                                                           | Existing stories                 |
| 5   | Every changed part           | Catalog, contrast | Catalog entry, tokens, recipe and contrast pair; DESIGN.md bump                                        | `check-catalog`, `pnpm contrast` |

## Impact (public API, AGENTS.md rule 2)

- `TooltipProps` gains optional `description` and `align`. Existing calls do not change.
- New component tokens `tooltip.description-fg`, `tooltip.description-type`, `tooltip.line-gap`; recipe `ds-tooltip__description`; one contrast pair. No semantic token changes.

## Out of scope

`closeDelay` and the arrow (audit B.7 lists both; no Studio screen needs them yet).

## Changelog

- v1 (2026-10-23): spec.
