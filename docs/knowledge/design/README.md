# Design knowledge

Facts from outside design systems and standards that inform ORIVILO's own design-system choices (type, spacing, component anatomy). Entries follow the format and confidence rule in `docs/knowledge/README.md`; this folder adds no rules of its own. An entry records what a source says; the choice of an ORIVILO value belongs to the designer and the owner.

## Entries

| Entry                                                                          | Question it answers                                                    |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| [[K-0096-untitled-ui-title-and-supporting-text-pair]]                          | Untitled UI title over supporting text: weight, colour, size, gap      |
| [[K-0097-shadcn-ui-title-and-description-pair]]                                | shadcn/ui Alert, Card, Dialog and Sonner title and description         |
| [[K-0098-material-3-dialog-headline-and-supporting-text]]                      | Material 3 dialog headline and supporting text, body scale             |
| [[K-0099-apple-hig-headline-equals-body-size-weight-step]]                     | Apple HIG: Headline and Body at one size, leading guidance             |
| [[K-0100-carbon-notification-title-subtitle-and-body-sets]]                    | Carbon notification title and subtitle; body vs body-compact           |
| [[K-0101-atlassian-heading-body-pairing-and-paragraph-spacing]]                | Atlassian heading and body pairing, body line height and paragraph gap |
| [[K-0102-wcag-2-2-text-spacing-and-line-spacing]]                              | WCAG 2.2 SC 1.4.12 and 1.4.8 line and paragraph spacing                |
| [[K-0103-ibm-type-scale-thai-at-95-percent-same-line-height]]                  | IBM: Thai at 95 percent size on the Latin line height                  |
| [[K-0104-thai-is-a-tall-script-with-stacked-marks]]                            | Thai as a tall script with stacked marks (Material, W3C)               |
| [[K-0105-thai-and-uk-readers-prefer-1-5-or-double-line-spacing]]               | Thai and UK readers' preferred line spacing (York thesis abstract)     |
| [[K-0106-informal-test-tall-scripts-clip-at-1-1-line-height]]                  | Lead: tall scripts clip at 1.1, fixed at 1.6 (informal test)           |
| [[K-0107-synthesis-title-supporting-text-and-paragraph-line-height]]           | Synthesis of K-0096 to K-0106                                          |
| [[K-0108-untitled-ui-loading-indicator-types-sizes-and-no-announcement]]       | Untitled UI loading indicator: types, sizes, label, announcing         |
| [[K-0109-untitled-ui-react-lists-no-skeleton-component]]                       | Does Untitled UI React have a skeleton component                       |
| [[K-0110-shadcn-ui-spinner-status-role-on-the-icon]]                           | shadcn/ui Spinner: classes, role, name, use in Button and Badge        |
| [[K-0111-shadcn-ui-skeleton-pulse-div-without-aria]]                           | shadcn/ui Skeleton: classes, shapes, accessibility                     |
| [[K-0112-tailwind-spin-and-pulse-ignore-reduced-motion-by-default]]            | Tailwind animate-spin and animate-pulse under reduced motion           |
| [[K-0113-wai-aria-1-2-aria-busy-defers-announcements]]                         | WAI-ARIA 1.2 aria-busy                                                 |
| [[K-0114-wai-aria-1-2-role-status-is-a-polite-live-region]]                    | WAI-ARIA 1.2 role status, aria-live, progressbar                       |
| [[K-0115-wcag-2-2-status-messages-cover-the-waiting-state]]                    | WCAG 2.2 SC 4.1.3 Status Messages and the waiting state                |
| [[K-0116-wcag-2-2-animation-from-interactions-and-c39]]                        | WCAG 2.2 SC 2.3.3 and technique C39 (prefers-reduced-motion)           |
| [[K-0117-wcag-2-2-pause-stop-hide-and-loading-animations]]                     | WCAG 2.2 SC 2.2.2 and loading animations                               |
| [[K-0118-synthesis-spinner-and-skeleton-benchmark]]                            | Synthesis of K-0108 to K-0117: spinner and skeleton benchmark table    |
| [[K-0119-untitled-ui-react-has-no-collapsible-component]]                      | Does Untitled UI React have a collapsible or disclosure component      |
| [[K-0120-shadcn-ui-collapsible-three-parts-no-styles]]                         | shadcn/ui Collapsible: parts, control props, versions, registry file   |
| [[K-0121-radix-collapsible-api-data-state-and-height-variable]]                | Radix UI Collapsible: props, data attributes, CSS variables, keyboard  |
| [[K-0122-radix-collapsible-source-aria-wiring-and-mount-animation]]            | Radix Collapsible source: ARIA wiring, mounting, size measurement      |
| [[K-0123-wai-aria-apg-disclosure-button-expanded-enter-space]]                 | WAI-ARIA APG Disclosure pattern: roles, states, keyboard               |
| [[K-0124-wcag-2-2-motion-animation-excludes-opacity]]                          | WCAG 2.2 SC 2.3.3: what counts as motion animation                     |
| [[K-0125-wcag-2-2-pause-stop-hide-starts-automatically-includes-hover]]        | WCAG 2.2 SC 2.2.2: what "starts automatically" means                   |
| [[K-0126-synthesis-collapsible-benchmark]]                                     | Synthesis of K-0119 to K-0125: Collapsible benchmark table             |
| [[K-0127-ai-elements-inline-citation-hover-card-badge-and-carousel]]           | Vercel AI Elements InlineCitation: parts, trigger, card, ARIA          |
| [[K-0128-ai-elements-sources-collapsible-count-trigger-and-links]]             | Vercel AI Elements Sources: parts, count trigger, links, ARIA          |
| [[K-0129-radix-hover-card-sighted-users-only-no-keyboard-content]]             | shadcn/ui and Radix Hover Card: who it serves, keyboard, touch, delays |
| [[K-0130-radix-popover-dialog-pattern-trigger-wiring-and-focus]]               | shadcn/ui and Radix Popover: parts, keyboard, ARIA wiring, focus       |
| [[K-0131-untitled-ui-react-has-no-citation-or-source-list-component]]          | Does Untitled UI React have a citation, quote or source list component |
| [[K-0132-wai-aria-apg-disclosure-and-button-for-a-popover-trigger]]            | WAI-ARIA APG Disclosure and Button for a panel-opening button          |
| [[K-0133-wai-aria-apg-no-non-modal-dialog-pattern-tooltip-note]]               | WAI-ARIA APG: popover and non-modal dialog guidance, Tooltip note      |
| [[K-0134-wcag-2-2-content-on-hover-or-focus-dismissible-hoverable-persistent]] | WCAG 2.2 SC 1.4.13 Content on Hover or Focus                           |
| [[K-0135-synthesis-evidence-span-and-evidence-list-benchmark]]                 | Synthesis of K-0127 to K-0134: EvidenceSpan and EvidenceList table     |
