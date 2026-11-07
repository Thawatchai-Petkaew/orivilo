---
id: K-0096
topic: design
claim: In the open Untitled UI React code, a title sits over its supporting text with a weight step (semibold or medium over regular) and a colour step (text-primary or text-secondary over text-tertiary), plus a size step in the empty state only, and a gap of 0 to 8 px (own arithmetic); its scale sets text-sm at 14 px on a 20 px line and text-md at 16 px on a 24 px line (own arithmetic); the alert, notification and card header code is not public.
source: "https://raw.githubusercontent.com/untitleduico/react/main/components/application/empty-state/empty-state.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/base/checkbox/checkbox.tsx; https://raw.githubusercontent.com/untitleduico/react/main/styles/theme.css; https://api.github.com/repos/untitleduico/react/contents/components/application; https://www.untitledui.com/react/components (read through https://r.jina.ai/); https://www.untitledui.com/react/components/notifications (read through https://r.jina.ai/); https://www.untitledui.com/react/components/alerts (read through https://r.jina.ai/); https://www.untitledui.com/react/components/alerts.md; https://www.untitledui.com/react/components/notifications.md; https://www.untitledui.com/react/components/card-headers.md; https://tailwindcss.com/docs/theme; https://tailwindcss.com/docs/gap"
retrieved: 2026-10-31
confidence: 0.8
applies_to: [ORV-192]
license: MIT
---

## Evidence

Read on the `main` branch of `untitleduico/react` on 2026-10-31 (no commit hash shown). Confidence 0.8: one publisher's code, quoted through a fetch tool; nothing was rendered, so sizes and colours are our reading of the classes.

### Type scale and text colours (`styles/theme.css`)

```text
--text-sm: calc(var(--spacing) * 3.5);
--text-sm--line-height: calc(var(--spacing) * 5);
--text-md: calc(var(--spacing) * 4);
--text-md--line-height: calc(var(--spacing) * 6);
--color-text-primary: var(--color-neutral-900);
--color-text-tertiary: var(--color-neutral-600);
```

The file also sets `--color-text-secondary: var(--color-neutral-700);`, and under `.dark-mode` `--color-text-primary: var(--color-neutral-50);` and `--color-text-tertiary: var(--color-neutral-400);`. It does not define `--spacing`; Tailwind's default theme sets `--spacing: 0.25rem;`. So, by our arithmetic at a 16 px root: text-xs 12 on 18, text-sm 14 on 20, text-md 16 on 24, text-lg 18 on 28, text-xl 20 on 30 (px).

### Empty state (`empty-state.tsx`)

- Title: base `"text-md font-semibold text-primary"`; size md `"text-lg font-semibold"`; size lg `"text-xl font-semibold"`.
- Description: base `"text-center text-sm text-tertiary"`; size lg `"text-md"`.
- `Content`, the element the fetch tool named as the nearest wrapper of title and description: base `"... flex w-full max-w-88 flex-col items-center justify-center gap-1"`; sizes md and lg `"mb-8 gap-2"`.

By our reading: sm is 16 semibold primary over 14 regular tertiary with a 4 px gap; md is 18 over 14 with 8 px; lg is 20 over 16 with 8 px (Tailwind `gap-<number>` is `gap: calc(var(--spacing) * <value>);`).

### Checkbox label and hint (`checkbox.tsx`)

```text
{label && <p className={cx("text-secondary select-none", sizes[size].label)}>{label}</p>}
<span className={cx("text-tertiary", sizes[size].hint)} onClick={(event) => event.stopPropagation()}>
```

Label: sm `"text-sm font-medium"`, md `"text-md font-medium"`. Hint: sm `"text-sm"`, md `"text-md"`. Wrapper `"inline-flex flex-col"` plus sm `""`, md `"gap-0.5"`. So label and hint share a size; the step is weight (500 over 400) and colour (secondary over tertiary); the gap is 0 (sm) or 2 px (md), by our arithmetic.

### What is not public

- The GitHub API lists 12 folders under `components/application` (app-navigation, carousel, charts, date-picker, empty-state, file-upload, loading-indicator, modals, pagination, slideout-menus, table, tabs): no alerts, notifications or cards. `modals/modal.tsx` defines no title or description.
- The components page lists "Alerts", "Notifications" and "Card headers". The alerts and notifications pages show no class strings, only the install command (`npx untitledui@latest add alerts`, `npx untitledui add notifications`); the `.md` versions of the alerts, notifications and card headers pages reference demo components whose source they do not include.
- The notifications API reference describes `title` as the "Bold heading shown at the top of the toast" and `description` as "Body text shown under the notification title." The alerts API gives "The title of the alert." and "The description of the alert."
- The card headers page says the components "are static compositions with the copy inlined in the JSX."

## Why it matters for ORIVILO

ORV-192 sets the title and supporting-text pair inside compact components. This is Untitled UI's pattern where its code is public; its toast, alert and card classes stay unread and should not be quoted from memory.
