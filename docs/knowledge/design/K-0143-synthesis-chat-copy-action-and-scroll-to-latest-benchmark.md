---
id: K-0143
topic: design
claim: Across K-0136 to K-0142, Untitled UI's Messaging page shows neither a copy action nor a scroll-to-latest button; shadcn/ui puts actions in MessageFooter as aria-labelled ghost icon buttons and ships a MessageScrollerButton that stays mounted, turns inert with tabIndex -1 when caught up, scrolls smoothly by default, blurs itself on press and is named by sr-only "Scroll to end"; AI Elements ships a ghost icon-sm MessageAction named by an sr-only label and a ConversationScrollButton that unmounts at the bottom and has no accessible name; none of the pages read shows a copied or copy-failed state.
source: "docs/knowledge/design/K-0136-untitled-ui-messaging-no-copy-action-no-scroll-button.md; docs/knowledge/design/K-0137-shadcn-ui-message-footer-holds-actions-icon-buttons-need-aria-label.md; docs/knowledge/design/K-0138-shadcn-ui-bubble-variants-and-no-action-slot.md; docs/knowledge/design/K-0139-shadcn-ui-message-scroller-button-docs-and-styled-registry.md; docs/knowledge/design/K-0140-shadcn-react-message-scroller-primitive-smooth-default-8px-edge-blur.md; docs/knowledge/design/K-0141-ai-elements-message-action-label-tooltip-and-copy-without-result-state.md; docs/knowledge/design/K-0142-ai-elements-conversation-scroll-button-unmounts-at-bottom-no-accessible-name.md"
retrieved: 2026-11-02
confidence: 0.75
applies_to: [ORV-217]
license: own-words
---

## Evidence

A synthesis of the entries in `source:`, each at 0.8 except K-0136 (0.75, mostly an absence, API table unread). It fills the cells ORV-217's spec v1.0 marks "open research need" and the AI Elements gaps it names; it lists what the sources show, not what ORV-217 should do.

### Copy action on a reply

| Item      | Untitled UI (K-0136)                                          | shadcn/ui (K-0137, K-0138)                                                                                              | AI Elements (K-0141)                                                                                                               |
| --------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Component | None found; the "Message action" examples are composers       | No copy component; the Message docs place copy, retry or feedback buttons in `MessageFooter`. Bubble has no action slot | `MessageAction` inside `MessageActions` (or `MessageToolbar`); copy is an example, not a built-in                                  |
| Variants  | Not stated                                                    | Sample: `Button` `variant="ghost"`. Bubble has seven variants (own count, K-0138) for the surface                       | `variant` default `"ghost"` (any Button variant through props)                                                                     |
| Sizes     | Composer `size` sm, md, lg (default lg), not a message action | Sample: `size="icon"`                                                                                                   | `size` default `"icon-sm"`; example icon `size-3`                                                                                  |
| Slots     | Not stated                                                    | `MessageFooter`, "below the message, such as status or actions"                                                         | `MessageActions` (flex row, `gap-1`); `MessageToolbar` (row, space-between, `mt-4`)                                                |
| States    | Not stated (the `failed` status is a send status)             | Not stated: no copied, failed, hidden or shown state                                                                    | Not stated: the example calls `navigator.clipboard.writeText` with no success feedback and no error handling; the file has neither |
| Name      | Not stated                                                    | "give each one an aria-label"; sample `aria-label="Copy"`                                                               | `label` (or `tooltip`) rendered in `span.sr-only`; optional Tooltip on hover; example `label="Copy"`                               |
| Focus     | Not stated                                                    | Not stated                                                                                                              | Not stated; docs claim "Keyboard accessible with proper ARIA labels"                                                               |

### Scroll-to-latest button

| Item       | Untitled UI (K-0136)                                               | shadcn/ui (K-0139, K-0140)                                                                                                                                                       | AI Elements (K-0142)                                                         |
| ---------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Component  | None found                                                         | `MessageScrollerButton`, `direction` end (default) or start                                                                                                                      | `ConversationScrollButton`                                                   |
| Variants   | Not stated                                                         | Registry default `variant="secondary"`                                                                                                                                           | `variant="outline"`, `rounded-full`                                          |
| Sizes      | Not stated                                                         | Registry default `size="icon-sm"`                                                                                                                                                | `size="icon"`, icon `size-4`                                                 |
| Slots      | Not stated                                                         | Children replace the default `ArrowDownIcon` plus sr-only text; `render` replaces the Button                                                                                     | Spread Button props only                                                     |
| Shown      | Not stated                                                         | Active when content bottom minus `scrollTop` minus `clientHeight` is over 8 px and the view is not following                                                                     | While `isAtBottom` is false; the threshold is not stated                     |
| Hidden     | Not stated                                                         | Stays mounted: `inert`, `tabIndex` -1, `data-active="false"`, opacity 0, scale 95, slid out, `pointer-events-none`; no `motion-reduce` class                                     | Unmounts (`!isAtBottom && ...`)                                              |
| Press      | Not stated                                                         | `blur()`, then `scrollToEnd({ behavior })`, `behavior` default `"smooth"`; re-engages following when `autoScroll` is on                                                          | `scrollToBottom()`, a spring smooth scroll; the README names no instant mode |
| Name       | Not stated                                                         | sr-only "Scroll to end" or "Scroll to start"; no `aria-label`                                                                                                                    | None: no `aria-label`, `title` or sr-only text                               |
| Focus      | Not stated                                                         | Inactive: out of the tab order. After a press: blurred, no `focus()` call                                                                                                        | No focus handling in the file; where focus goes on unmount is not stated     |
| Transcript | `<li>` items in a list with an `aria-label` such as "Conversation" | Viewport `role="region"`, `aria-label` "Messages", `tabIndex` 0; Content `role="log"`, `aria-relevant="additions"`, no `aria-live`; docs advise `aria-busy` while a turn streams | `role="log"` on the root                                                     |
| New text   | Not stated                                                         | No unread count or new-messages indicator; docs say to make new messages clear                                                                                                   | Not stated                                                                   |

### Statements scoped to the pages read

- No page or file read for K-0136 to K-0142 shows a copied or copy-failed state: K-0136, K-0137 and K-0138 state none, and the K-0141 docs example and `message.tsx` have neither.
- Of the two scroll buttons read, only shadcn's has an accessible name, and it is sr-only text, not visible (K-0139); AI Elements' has none (K-0142).
- Both scroll buttons read scroll smoothly by default (K-0140, K-0142); neither file sets a reduced-motion rule (K-0139 states it for the registry classes; K-0142 lists reduced motion as not stated).
- Neither scroll button read moves focus to a chosen target after a press: shadcn blurs (K-0140), AI Elements unmounts with no focus code (K-0142).
- Untitled UI is read from its docs text only; its API table, demos and source were not (K-0136).

### Not read

- shadcn's AI Elements "Chat" page (`/docs/ai-elements/base/chat`, named in the components sidebar, K-0137 source) was not read.
- shadcn's Base UI style registry item for Message Scroller, and the `@shadcn/react` tests (K-0139, K-0140).
- The AI Elements Tooltip delay and the `use-stick-to-bottom` `isAtBottom` rule (K-0141, K-0142).
- Untitled UI Code snippets, which may hold a copy button (K-0136).

## Why it matters for ORIVILO

ORV-217 open question 5 asks for these cells before the design. This entry is that reading, with each cell tied to an entry; the choices stay with the designer and the owner.
