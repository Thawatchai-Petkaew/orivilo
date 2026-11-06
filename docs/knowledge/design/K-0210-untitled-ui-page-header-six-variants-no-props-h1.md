---
id: K-0210
topic: design
claim: Untitled UI's Page headers page shows six copy-and-paste compositions that take no props; the title is a real h1, breadcrumbs give way to a Back link button below lg (md in the centered variants), and the search field is rendered twice, labelled by aria-label "Search".
source: "https://www.untitledui.com/react/components/page-headers.md; https://github.com/untitleduico/react/tree/main/components/application"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. The page has no API reference section. No `page-headers` folder shows in the visible listing of `components/application` on GitHub, which the tool reports as truncated, so the source was not read.

> Six: `PageHeaderSimple`, `PageHeaderAvatar`, `PageHeaderBannerSimple`, `PageHeaderBannerAvatar`...

> Each page header is a copy-and-paste composition with the content written inline...

> The breadcrumb trail is hidden below the `lg` breakpoint (`md` in the centered variants)

> The search field is rendered twice: a full-width `size="md"` `Input` for mobile...

> In the non-centered variants, the title row also switches from a column to a row layout at `lg`.

> The page title is a real `<h1>`, so keep one page header per page or downgrade the heading level if you nest one.

> The search fields have no visible label and use `aria-label="Search"` instead,

- The other two variants are `PageHeaderBannerSimpleCentered` and `PageHeaderBannerAvatarCentered`.
- Parts it composes: `Breadcrumbs` (`type="button"`, `maxVisibleItems={3}`, first item an icon-only home link), a Back `Button` (`color="link-gray"`, `size="xs"`, `iconLeading={ArrowLeft}`, `href`, so an anchor), `Input` (`size="md"` on mobile, `size="sm"` with `shortcut` on desktop), `Avatar` (`border`, `size="xl"`), `AvatarProfilePhoto` (`verified`; `md` on small screens, `lg` from `lg` up).
- Banner: `h-40`, `lg:h-60`, `rounded-xl`, a fixed gradient `bg-linear-to-t from-[#FBC5EC] to-[#A5C0EE]`, replaceable by an `<img>`.
- No state is described. Actions and tabs are not mentioned on this page.

## Why it matters for ORIVILO

The page gives the anatomy of a page header but no contract: an ORIVILO Page header is a public component, so its props have no Untitled counterpart to read. The h1 rule and the breadcrumb to Back swap are the transferable facts.
