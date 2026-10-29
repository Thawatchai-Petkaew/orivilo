---
issue: ORV-83 (https://tpetkaew.atlassian.net/browse/ORV-83)
lane: S (story harness only: seven story files; no component, recipe, token or catalog contract)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.0
---

# ORV-83: no nested Field in seven form-control story files

## Acceptance criteria

The three criteria of Jira ORV-83, copied; this spec adds no requirement.

| #   | Criterion (Jira ORV-83)                                                                                                                                                                                                                                                         | Done when                                                                                                                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | No story in the Input, Select, PasswordInput, RangeSlider, Progress, Slider and InputGroup story files renders a nested Field. A play asserts `canvasElement.querySelectorAll('.ds-field .ds-field').length === 0` on at least one story per file, seen to fail before the fix. | Each of the seven files in Scope holds at least one play with that assertion; the Storybook test project passes on the fix head; the PR reports the red run of each play before the fix (see Open question 1). |
| 2   | Light and dark screenshots of each changed story are checked by eye.                                                                                                                                                                                                            | The PR lists each changed story with a light and a dark screenshot and the reviewer's note on each.                                                                                                            |
| 3   | No change to components or recipes.                                                                                                                                                                                                                                             | `git diff --name-only origin/develop...HEAD` lists no file under `packages/design-system/src/components/*/` other than a `*.stories.tsx`, and none under `packages/design-system/src/recipes/`.                |

## Why

A story's own `decorators: []` does not remove its meta decorator: Storybook applies the meta decorator to every story (comment at `packages/design-system/src/components/textarea/Textarea.stories.tsx` lines 9 and 10). So a file whose meta decorator wraps the story in a `Field`, and whose story renders its own `Field` elements, shows a Field inside a Field. Example: `Input.stories.tsx` meta (lines 14 to 22) wraps every story in `<Field label="ชื่อโปรเจกต์">`, and its `Sizes` story (lines 30 to 45) renders three more Fields inside it. ORV-80 fixed the same defect in Textarea by dropping the meta decorator and naming a per-story `inField` decorator on each story that wants one. ORV-83 does the same for the seven files below.

Nothing here is simulated or mocked. The change shows no new UI copy, so no Thai or English string is named; any label a story already has keeps its locale text.

Frame: not a guard. The play is a test in the Storybook test project, not a hook on a tool call.

## Scope

The seven story files the issue names, all under `packages/design-system/src/components/`:

1. `input/Input.stories.tsx`
2. `select/Select.stories.tsx`
3. `password-input/PasswordInput.stories.tsx`
4. `slider/RangeSlider.stories.tsx`
5. `progress/Progress.stories.tsx`
6. `slider/Slider.stories.tsx`
7. `input-group/InputGroup.stories.tsx`

## Worked examples

Not run here (no shell in this role). The play's selector `.ds-field .ds-field` counts each element with class `ds-field` that has an ancestor with class `ds-field` (`Field.tsx` line 94 sets the class). Node has no DOM, so the line below models the same count on a tree copied from `Input.stories.tsx` `Sizes`: before the fix, the meta Field wraps the story's `div` with three Fields; after the fix, the story renders its `div` and three Fields with no meta Field. Integer counts, no rounding. Expected output: `3 0`.

```bash
node -e 'const F=k=>({c:"ds-field",k}),D=k=>({c:"div",k});const story=D([F([]),F([]),F([])]);const n=(x,inF)=>(inF&&x.c==="ds-field"?1:0)+x.k.reduce((s,y)=>s+n(y,inF||x.c==="ds-field"),0);console.log(n(F([story]),false),n(story,false))'
```

## Out of scope

- Any change to a component under `packages/design-system/src/components/` (its `.tsx` other than the story) or to `packages/design-system/src/recipes/`; row 3 of the table above holds the bound.
- Story files other than the seven in Scope; `Textarea.stories.tsx` was fixed in ORV-80.

## Open questions (with defaults)

1. `Progress.stories.tsx`, `Slider.stories.tsx` and `RangeSlider.stories.tsx` contain no `Field` on the current tree: their meta decorator is a `max-w-sm` div (lines 20, 20 and 21), and neither `progress/` nor `slider/` holds the string `Field` or `ds-field`. A play with the row 1 assertion there passes before any fix, so "seen to fail before the fix" cannot be shown for those three files. Option A: add the play to each and report in the PR that it was green before the fix, with the grep as the reason. Option B: the owner amends ORV-83 to drop those three files or to name the defect they carry. Impact: A ships the guard play for all seven files and leaves row 1's red-run clause met for four; B changes the issue. Default: A, recorded in the PR as a deviation from row 1 for those three files.

## Depends on

- ORV-80 (the per-story `inField` decorator pattern in `Textarea.stories.tsx`).
- `.claude/rules/design-system.md`, section "Storybook" (stories are the fixtures for the interaction tests) and `.claude/rules/testing.md` (a test must fail on the real defect).

## Changelog

- v1.0: first version, the three criteria of Jira ORV-83 copied. Downstream to review: none yet (no build exists).
