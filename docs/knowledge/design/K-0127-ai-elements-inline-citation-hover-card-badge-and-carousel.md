---
id: K-0127
topic: design
claim: Vercel AI Elements InlineCitation is fourteen parts on a HoverCard opened and closed with no delay; the trigger is a secondary rounded Badge showing the first source's hostname plus "+N" for the rest ("unknown" with none), the card holds a carousel with a current/count index and Previous and Next buttons, a source block (title, url, description) and an italic blockquote; the docs claim keyboard navigation and the source sets no aria attribute except on the two arrow buttons.
source: "https://elements.ai-sdk.dev/components/inline-citation; https://raw.githubusercontent.com/vercel/ai-elements/main/packages/elements/src/inline-citation.tsx"
retrieved: 2026-11-01
confidence: 0.8
applies_to: [ORV-211]
license: link-only
---

## Evidence

Read on 2026-11-01 through a fetch tool (`https://ai-sdk.dev/elements/components/inline-citation` answers 308 to the `elements.ai-sdk.dev` page). Confidence 0.8: one publisher, its docs page and its source file, which agree. The source was read on `main`, no commit hash shown.

### Docs page

> A hoverable citation component that displays source information and quotes inline with text

Parts: InlineCitation, InlineCitationText, InlineCitationCard, InlineCitationCardTrigger, InlineCitationCardBody, InlineCitationCarousel, InlineCitationCarouselContent, InlineCitationCarouselItem, InlineCitationCarouselHeader, InlineCitationCarouselIndex, InlineCitationCarouselPrev, InlineCitationCarouselNext, InlineCitationSource, InlineCitationQuote (14, counted from the page's prop tables). The prop tables have no default column. The only props beyond the spread are:

> `sources` ... Array of source URLs. The length determines the number displayed in the badge.
> `title` ... The title of the source.
> `url` ... The URL of the source.
> `description` ... A brief description of the source.

On InlineCitationCard: "Any other props are spread to the HoverCard component." Features include "Hover interaction to reveal detailed citation information", "Carousel navigation for multiple citations with prev/next controls", "Optional quote blocks for relevant excerpts", "Smart badge display showing source hostname and count". On accessibility the page says only "Accessible design with proper keyboard navigation."

### Source file

```tsx
<HoverCard closeDelay={0} openDelay={0} {...props} />
<HoverCardTrigger asChild>
className={cn("ml-1 rounded-full", className)}
variant="secondary"
new URL(sources[0]).hostname
sources.length > 1 && `+${sources.length - 1}`
```

The trigger's props type is `ComponentProps<typeof Badge> & { sources: string[] }`, with no `tabIndex` set; the empty case renders `"unknown"`. The card body is `"relative w-80 p-0"`. The quote is a `blockquote` with `"border-muted border-l-2 pl-3 text-muted-foreground text-sm italic"`. The index renders `${current}/${count}` from the carousel's scroll snaps, and children replace it. Previous and Next are `type="button"` with `aria-label="Previous"` and `aria-label="Next"`; the fetch tool reported no other aria attribute in the file. The text part is `"transition-colors group-hover:bg-accent"`, so the cited sentence tints on hover of the group.

## Why it matters for ORIVILO

This is the closest shipped model of a pill in text that opens a card with a source and a quote (ORV-211 EvidenceSpan). Its card rides on a hover card, whose keyboard and screen reader limits are in K-0129, and its trigger reads as a hostname, not as the claim's source.
