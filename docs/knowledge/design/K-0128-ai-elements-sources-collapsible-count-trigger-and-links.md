---
id: K-0128
topic: design
claim: Vercel AI Elements Sources is four parts on a Collapsible; the trigger takes a required count and renders "Used {count} sources" with no singular form, then a chevron that does not turn; the content fades and slides from the top on data-state; each Source is an anchor with target _blank and rel noreferrer showing a book icon and the title; the docs name no keyboard or accessibility behaviour and the file sets no aria attribute.
source: "https://elements.ai-sdk.dev/components/sources; https://raw.githubusercontent.com/vercel/ai-elements/main/packages/elements/src/sources.tsx"
retrieved: 2026-11-01
confidence: 0.8
applies_to: [ORV-211]
license: link-only
---

## Evidence

Read on 2026-11-01 through a fetch tool (`https://ai-sdk.dev/elements/components/sources` answers 308 to the `elements.ai-sdk.dev` page). Confidence 0.8: one publisher, docs page and source file agree. The source was read on `main`, no commit hash shown.

### Docs page

> A component that allows a user to view the sources or citations used to generate a response.

Parts: `Sources`, `SourcesTrigger`, `SourcesContent`, `Source`. Props, no defaults listed:

> `count` ... The number of sources to display in the trigger.
> `...props` ... Any other props are spread to the CollapsibleTrigger component.

`Sources` and `SourcesContent` spread `React.HTMLAttributes<HTMLDivElement>`; `Source` spreads `React.AnchorHTMLAttributes<HTMLAnchorElement>`. Features include "Collapsible component that allows a user to view the sources or citations used to generate a response" and "Responsive design with mobile-friendly controls". The page has no keyboard or accessibility notes.

### Source file

```tsx
<p className="font-medium">Used {count} sources</p>;
("h-4 w-4");
("data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2");
("data-[state=open]:slide-in-from-top-2 outline-none");
target = "_blank";
rel = "noreferrer";
```

The chevron is `ChevronDownIcon` with `"h-4 w-4"` only, so it does not turn on open. There is no singular or plural branch: a count of 1 reads "Used 1 sources". The root is `Collapsible` with `"not-prose mb-4 text-primary text-xs"`; the content is `"mt-3 flex w-fit flex-col gap-2"` plus the animation classes above and `animate-in` and `animate-out` on `data-[state]`. A source shows `BookIcon` and the title in a bold span. The fetch tool reported no aria attribute in the file; ARIA comes from the Collapsible primitive.

## Why it matters for ORIVILO

This is the closest shipped model of a collapsible sources list with a count (ORV-211 EvidenceList). The count string is a fixed English template and the motion has no reduced-motion rule in the file, both things a Thai and English catalog and our motion tokens handle differently.
