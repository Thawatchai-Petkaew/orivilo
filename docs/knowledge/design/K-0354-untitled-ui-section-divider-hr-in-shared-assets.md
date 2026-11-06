---
id: K-0354
topic: design
claim: Untitled UI's open-source repo has a SectionDivider in components/shared-assets, a div holding one hr styled h-px w-full border-none bg-border-secondary, with no role or aria attribute of its own and no orientation prop; it is not listed on the components index.
source: "https://api.github.com/repos/untitleduico/react/contents/components/shared-assets; https://raw.githubusercontent.com/untitleduico/react/main/components/shared-assets/section-divider.tsx; https://www.untitledui.com/react/components"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool, `main` branch (no commit hash shown). Confidence 0.8: the whole file was returned; not run.

```tsx
export const SectionDivider = (props: HTMLAttributes<HTMLDivElement>) => {
    return (
        <div {...props} className={cx("mx-auto max-w-container px-4 md:px-8", props.className)}>
            <hr className="h-px w-full border-none bg-border-secondary" />
        </div>
    );
};
```

`components/shared-assets` lists six entries: `background-patterns`, `credit-card`, `illustrations`, `iphone-mockup.tsx`, `qr-code.tsx`, `section-divider.tsx`. The list of index names returned on the same day has no Section divider entry.

## Why it matters for ORIVILO

This is the only Untitled divider code read. It shows a bare line built on a native `hr`, which WAI-ARIA 1.2 lists as a related concept of `separator` (K-0357), beside the Content divider's `div` (K-0353).
