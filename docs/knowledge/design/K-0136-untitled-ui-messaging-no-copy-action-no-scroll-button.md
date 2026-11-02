---
id: K-0136
topic: design
claim: Untitled UI React's Messaging page shows message items, a sent, read or failed send status, a typing indicator and three composer forms called "message action", but states no copy action on a message, no copied or copy-failed state and no scroll-to-latest or new-messages button; its API reference table could not be read.
source: "https://www.untitledui.com/react/components/messaging; https://www.untitledui.com/react/components"
retrieved: 2026-11-02
confidence: 0.75
applies_to: [ORV-217]
license: link-only
---

## Evidence

Read on 2026-11-02 through a fetch tool that returns a summary with short quotes. Confidence 0.75, not 0.8: the claim is mostly an absence, and the page's API reference renders only as a placeholder (`<ApiReference slug="messaging" />`) in the fetched text, so the props table, the demo code and the component source were not read.

### Components index

The Application UI list has one entry for this subject, "Messaging" (`https://www.untitledui.com/react/components/messaging`). No entry is named chat, message, conversation, copy, clipboard or scroll. "Code snippets" is listed and was not read.

### Messaging page

> Powerful and customizable React messaging components built for modern applications and websites

- Install: `npx untitledui@latest add messaging`. Built on React Aria and Tailwind CSS.
- Examples: Messaging example, Message status, Message action minimal, Message action textarea, Message action advanced, Message simple, Message reactions, Message reply, Message attachment, Message audio, Message image, Message link preview, Message link minimal, Message writing.
- The three "Message action" examples are composers (a form to type and send), not controls on a message. `MessageActionMinimal` takes `size` `"sm"`, `"md"` or `"lg"`, default `"lg"`; the other two are uncontrolled forms with `onSubmit`.
- `MessageStatus` takes `status` (`sent`, `read`, `failed`) and an optional `readAt`; the status is an icon beside the timestamp, and `readAt` is added to its tooltip, the only tooltip the page names.
- `MessageItem` takes `msg` (only `id` required) and `showUserLabel` (default `true`); `me: true` aligns the current user's messages to the right.
- Accessibility: `MessageItem` renders an `<li>`, and the page advises mapping items inside an `<ol>` or `<ul>` with an `aria-label` such as "Conversation". Nothing on sr-only text, keyboard or focus.

### Not stated on the page

A copy, reply, react or more control on a message; any copied or failed copy state; a scroll-to-latest, jump-to-bottom or new-messages button; keyboard and focus behaviour. The `failed` status is a send status, not a copy result.

## Why it matters for ORIVILO

ORV-217's benchmark cells for Untitled UI were open research needs. This entry fills them with what the page shows: nothing to read for either control, with the unread API table named as the limit.
