---
id: K-0202
topic: design
claim: None of the Untitled UI, shadcn/ui, Radix or Base UI pages read says how to make initials for a script with combining marks such as Thai, and W3C's Thai resource does not mention initials; the one derivation found, Untitled UI's getInitials, which Avatar does not call, takes charAt(0) of the first two space-split words, one UTF-16 code unit each.
source: "https://raw.githubusercontent.com/untitleduico/react/main/components/base/avatar/utils.ts; https://www.untitledui.com/react/components/avatars.md; https://ui.shadcn.com/docs/components/radix/avatar.md; https://www.radix-ui.com/primitives/docs/components/avatar; https://base-ui.com/react/components/avatar; https://www.w3.org/TR/thai-lreq/; https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charAt; https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter; https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter/Segmenter"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-224]
license: link-only
---

## Evidence

Confidence 0.75, not 0.8: the claim is mostly an absence, each from a word check on a fetched page.

### Silence, page by page

- Untitled UI: "Thai" and "unicode" do not occur on `avatars.md`.
- shadcn/ui: "Thai", "Unicode", "grapheme" and "script" do not occur on the Radix page; the RTL example keeps Latin `CN`, `ER`, `LR`.
- Radix: "Thai", "Unicode", "grapheme", "script" and "initials" do not occur.
- Base UI: "Thai", "Unicode" and "grapheme" do not occur; "initials" occurs in the Root description only.
- W3C Thai Script Resources: the fetch reports initials and abbreviations of names not mentioned; section 7.4 asks how abbreviations are indicated and gives no answer. Spaces between first and last names are not mentioned.

### The one derivation (Untitled UI `utils.ts`)

```text
export const getInitials = (name: string) => {
    const [firstName = "", lastName] = name.split(" ");
    return firstName.charAt(0) + (lastName ? lastName.charAt(0) : "");
};
```

`avatar.tsx` does not call it; `Avatar` shows the `initials` prop as given (K-0186). The caller writes the initials in shadcn/ui and Radix too (K-0190, K-0192).

### What it meets in Thai

> W3C: "There are pre-base vowel glyphs, but Thai uses visual placement."
> W3C: "only the vowel sign components that appear above or below the consonant are combining marks."
> W3C: "Spaces separate phrases, rather than words."
> MDN: "returns a new string consisting of the single UTF-16 code unit at the given index."
> MDN: "Split the input into segments at grapheme cluster (user-perceived character) boundaries, as determined by the locale."

The last line is the `"grapheme"` value of the `Intl.Segmenter` option `granularity`, which is the default. MDN's Segmenter page lists Thai among languages that do not use spaces between words and has no note on combining characters.

Own reading: `charAt(0)` on a Thai name that begins with a pre-base vowel returns that vowel, and on a consonant carrying a combining mark it returns the consonant without the mark; a grapheme segment would keep the mark. No source read says which of these is right for Thai initials, or whether Thai initials are used at all.

## Why it matters for ORIVILO

The repo's fixture rule includes a long Thai name without spaces (`.claude/rules/design-system.md`), and the fallback chain's second step is initials. The sources give no rule, so the rule has to come from the designer or the owner.
