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
| [[K-0144-untitled-ui-radio-buttons-two-sizes-label-hint-no-invalid]]           | Untitled UI Radio buttons: sizes, props, states, keyboard              |
| [[K-0145-untitled-ui-radio-groups-card-forms-and-no-group-label]]              | Untitled UI Radio groups: card forms, item shape, group label          |
| [[K-0146-untitled-ui-toggle-base-and-slim-two-sizes-no-invalid]]               | Untitled UI Toggles: base, slim, sizes, states, label                  |
| [[K-0147-shadcn-ui-radio-group-two-parts-item-invalid-no-size]]                | shadcn/ui Radio Group: parts, examples, invalid, registry classes      |
| [[K-0148-shadcn-ui-switch-sizes-sm-default-and-invalid-classes]]               | shadcn/ui Switch: sizes, examples, invalid, registry classes           |
| [[K-0149-shadcn-ui-field-around-radio-and-switch-is-manual-wiring]]            | shadcn/ui Field around a radio or switch: how it is wired              |
| [[K-0150-radix-radio-group-parts-props-and-keyboard-docs]]                     | Radix Radio Group docs: parts, props, data attributes, keyboard        |
| [[K-0151-radix-radio-group-1-5-1-aria-wiring-arrows-check-enter-blocked]]      | Radix Radio Group 1.5.1 build: roles, arrows, Enter, hidden input      |
| [[K-0152-radix-switch-parts-keyboard-and-1-4-1-aria-wiring]]                   | Radix Switch: parts, keyboard, 1.4.1 build wiring                      |
| [[K-0153-wai-aria-apg-radio-group-roles-keyboard-labelling]]                   | WAI-ARIA APG Radio Group: roles, keyboard, labelling, toolbar          |
| [[K-0154-wai-aria-apg-switch-roles-keyboard-fixed-label]]                      | WAI-ARIA APG Switch: roles, keyboard, labelling, groups                |
| [[K-0155-wai-aria-1-2-invalid-on-radiogroup-and-switch-deprecated-on-radio]]   | WAI-ARIA 1.2: where aria-invalid and aria-required are allowed         |
| [[K-0156-html-label-for-names-labelable-elements-only]]                        | HTML: what a label's for attribute may point at                        |
| [[K-0157-synthesis-radio-group-and-switch-benchmark]]                          | Synthesis of K-0144 to K-0156: RadioGroup and Switch benchmark table   |
| [[K-0158-untitled-ui-alerts-floating-full-width-no-size-no-role]]              | Untitled UI Alerts: forms, colours, slots, what the page leaves out    |
| [[K-0159-untitled-ui-featured-icon-themes-colors-sizes-no-aria]]               | Untitled UI FeaturedIcon: themes, colours, sizes, page and source      |
| [[K-0160-shadcn-ui-alert-two-variants-role-alert-in-source-only]]              | shadcn/ui Alert: parts, variants, role, classes by style               |
| [[K-0161-shadcn-ui-no-featured-icon-empty-and-item-media-nearest]]             | Does shadcn/ui have a featured icon; what comes nearest                |
| [[K-0162-wai-aria-1-2-alert-role-assertive-focus-not-required]]                | WAI-ARIA 1.2 role alert and role alertdialog                           |
| [[K-0163-wai-aria-apg-alert-no-focus-no-auto-dismiss-load-silent]]             | WAI-ARIA APG Alert pattern: focus, timing, alerts at page load         |
| [[K-0164-wcag-2-2-status-messages-alert-for-errors-status-for-results]]        | WCAG 2.2 SC 4.1.3: role alert, role status, errors, dialogs            |
| [[K-0165-wcag-aria19-empty-alert-container-before-the-error]]                  | WCAG technique ARIA19: role alert for errors, container at load        |
| [[K-0166-wcag-aria22-status-role-before-the-message]]                          | WCAG technique ARIA22: role status, container test                     |
| [[K-0167-wcag-2-2-use-of-color-visible-alternative]]                           | WCAG 2.2 SC 1.4.1 Use of Color: text, note and techniques              |
| [[K-0168-wcag-f81-error-fields-by-color-alone]]                                | WCAG failure F81: required or error fields by colour only              |
| [[K-0169-wcag-2-2-non-text-contrast-graphics-for-understanding]]               | WCAG 2.2 SC 1.4.11: which graphics need 3:1                            |
| [[K-0170-synthesis-alert-and-featured-icon-benchmark]]                         | Synthesis of K-0158 to K-0169: Alert and FeaturedIcon table            |
| [[K-0171-untitled-ui-empty-state-sizes-parts-and-header-visuals]]              | Untitled UI EmptyState: sizes, parts, header visuals, demos            |
| [[K-0172-untitled-ui-empty-state-h1-main-and-no-live-region]]                  | Untitled UI EmptyState: elements, overrides, announcing, motion        |
| [[K-0173-untitled-ui-has-no-page-loading-pattern]]                             | Does Untitled UI React have a page-loading pattern                     |
| [[K-0174-shadcn-ui-empty-parts-one-media-variant-no-size]]                     | shadcn/ui Empty page: parts, variant, examples, accessibility          |
| [[K-0175-shadcn-ui-empty-source-div-title-and-two-style-sets]]                 | shadcn/ui Empty source: elements, ARIA, values in two style sets       |
| [[K-0176-shadcn-ui-spinner-inside-empty-as-the-loading-example]]               | shadcn/ui loading state: the Spinner page's Empty example              |
| [[K-0177-shadcn-ui-no-results-text-in-data-table-and-command]]                 | shadcn/ui and cmdk: no-results text in Data Table and Command          |
| [[K-0178-wcag-2-2-no-results-text-is-a-status-message]]                        | WCAG 2.2 SC 4.1.3 and ARIA22: search and no-results messages           |
| [[K-0179-wai-aria-1-2-progressbar-for-a-loading-region]]                       | WAI-ARIA 1.2 progressbar and aria-busy on a loading region             |
| [[K-0180-wai-aria-apg-feed-aria-busy-back-to-false]]                           | WAI-ARIA APG Feed: aria-busy during an update                          |
| [[K-0181-wai-aria-1-2-one-main-role-and-required-heading-level]]               | WAI-ARIA 1.2 role main and role heading                                |
| [[K-0182-whatwg-html-one-visible-main-element]]                                | WHATWG HTML: how many main elements, and where                         |
| [[K-0183-aria-in-html-main-takes-no-other-role]]                               | ARIA in HTML: allowed roles on main, h1 to h6, header, footer          |
| [[K-0184-synthesis-empty-state-and-loading-state-benchmark]]                   | Synthesis of K-0171 to K-0183: empty and loading benchmark table       |
| [[K-0185-untitled-ui-avatar-sizes-props-and-slots]]                            | Untitled UI Avatar: sizes, props, slots, related components            |
| [[K-0186-untitled-ui-avatar-fallback-chain-and-sticky-load-failure]]           | Untitled UI Avatar: fallback order and what a load failure does        |
| [[K-0187-untitled-ui-avatar-one-indicator-and-unnamed-status-dot]]             | Untitled UI Avatar: indicators and what the status dot is              |
| [[K-0188-untitled-ui-avatar-alt-repeats-visible-name-no-aria]]                 | Untitled UI Avatar: alt, aria, focus ring                              |
| [[K-0189-shadcn-ui-avatar-parts-sizes-and-classes]]                            | shadcn/ui Avatar: parts, sizes, registry classes                       |
| [[K-0190-shadcn-ui-avatar-fallback-text-children-no-icon-example]]             | shadcn/ui Avatar: what the fallback holds, alt in the samples          |
| [[K-0191-shadcn-ui-avatar-badge-empty-span-no-status-meaning]]                 | shadcn/ui AvatarBadge: what it is and what it means                    |
| [[K-0192-radix-avatar-three-parts-no-accessibility-text]]                      | Radix Avatar page: parts, props, what it does not state                |
| [[K-0193-radix-avatar-source-preload-fallback-and-lost-alt]]                   | Radix Avatar source: load statuses, fallback timing, where alt goes    |
| [[K-0194-base-ui-avatar-keep-mounted-and-broken-image-note]]                   | Base UI Avatar: fallback, keepMounted, accessible name note            |
| [[K-0195-wcag-2-2-non-text-content-decoration-and-null-alt]]                   | WCAG 2.2 SC 1.1.1 and H67: text alternative or ignored                 |
| [[K-0196-wai-images-tutorial-image-described-by-adjacent-text]]                | WAI tutorial: image described by adjacent text                         |
| [[K-0197-wcag-2-2-h2-image-and-text-in-one-link]]                              | H2 and the WAI tutorial: image with text in a link, image alone        |
| [[K-0198-whatwg-html-alt-for-a-face-beside-text]]                              | WHATWG HTML: alt for a face beside text, in a caption, in a control    |
| [[K-0199-wai-aria-1-2-img-name-presentation-and-aria-label]]                   | WAI-ARIA 1.2: role img, role presentation, aria-hidden, aria-label     |
| [[K-0200-aria-in-html-img-rows]]                                               | ARIA in HTML: which roles and attributes an img may take               |
| [[K-0201-wcag-2-2-use-of-color-and-non-text-contrast-for-a-dot]]               | WCAG 2.2 SC 1.4.1 and 1.4.11 as they bear on a status dot              |
| [[K-0202-initials-for-thai-silence-and-charat]]                                | Do the sources say how to make Thai initials; what getInitials does    |
| [[K-0203-synthesis-avatar-benchmark]]                                          | Synthesis of K-0185 to K-0202: Avatar benchmark table                  |
| [[K-0204-untitled-ui-sidebar-five-variants-and-item-shape]]                    | Untitled sidebars: 5 variants; widths 280, 280, 68, 276, 276 px        |
| [[K-0205-untitled-ui-sidebar-nested-details-and-aria-current]]                 | Untitled NavList: details nesting, aria-current, aside with no nav     |
| [[K-0206-untitled-ui-slim-rail-nav-button-and-hover-panel]]                    | Untitled Slim: NavButton has no aria-current, panel on hover only      |
| [[K-0207-untitled-ui-mobile-navigation-header-below-lg]]                       | Untitled below lg: header bar and modal; Slim list has no activeUrl    |
| [[K-0208-untitled-ui-header-navigation-variants-and-active-match]]             | Untitled header: Simple, Dual-tier; active by exact or prefix match    |
| [[K-0209-untitled-ui-header-navigation-landmarks-and-drawer]]                  | Untitled header: unnamed nav, no aria-current, drawer below lg         |
| [[K-0210-untitled-ui-page-header-six-variants-no-props-h1]]                    | Untitled Page headers: 6 compositions, no props, real h1               |
| [[K-0211-untitled-ui-section-header-parts-h2-and-section-label]]               | Untitled SectionHeader: 5 parts, 6 examples (own count), h2            |
| [[K-0212-untitled-ui-breadcrumbs-types-collapse-and-current]]                  | Untitled Breadcrumbs: maxVisibleItems 4, last item aria-current        |
| [[K-0213-shadcn-ui-sidebar-parts-variants-and-collapsible-modes]]              | shadcn Sidebar: sidebar, floating, inset; offcanvas, icon or none      |
| [[K-0214-shadcn-ui-sidebar-state-cookie-shortcut-and-widths]]                  | shadcn Sidebar: 16, 18, 3rem; cookie 7 days; Cmd/Ctrl+b; 768 px        |
| [[K-0215-shadcn-ui-sidebar-menu-button-sizes-and-data-active]]                 | shadcn MenuButton: sm, default, lg; data-active, no aria-current       |
| [[K-0216-shadcn-ui-sidebar-source-landmarks-and-collapse-mechanism]]           | shadcn sidebar.tsx: no nav, no aside; offcanvas moves off screen       |
| [[K-0217-shadcn-ui-sidebar-mobile-sheet-on-radix-dialog]]                      | shadcn mobile sidebar: Sheet on Radix Dialog, sr-only English title    |
| [[K-0218-shadcn-ui-sidebar-nested-collapsible-and-icon-mode]]                  | shadcn nesting: Collapsible, defaultOpen from isActive, icon hides     |
| [[K-0219-shadcn-ui-navigation-menu-parts-and-viewport]]                        | shadcn Navigation Menu: viewport prop, data-active, md classes         |
| [[K-0220-radix-navigation-menu-api-keyboard-and-not-a-menu-role]]              | Radix Navigation Menu: delays 200 and 300, not the menu role           |
| [[K-0221-radix-navigation-menu-source-aria-and-mouse-only-hover]]              | Radix source: nav named Main, Link sets aria-current, mouse hover      |
| [[K-0222-shadcn-ui-breadcrumb-current-page-span-role-link]]                    | shadcn Breadcrumb: nav, ol; current page a span with role link         |
| [[K-0223-shadcn-ui-no-page-header-and-radix-no-sidebar]]                       | shadcn: no page header entry; Radix: no Sidebar primitive found        |
| [[K-0224-wai-aria-apg-landmark-regions-and-labels]]                            | APG landmarks: unique labels, one main, seven or fewer as a guide      |
| [[K-0225-html-aria-header-nav-aside-roles-and-h97]]                            | ARIA in HTML: header is banner at top level, aside complementary       |
| [[K-0226-wai-aria-1-2-aria-current-values-and-one-per-set]]                    | WAI-ARIA 1.2: aria-current values, one element per set                 |
| [[K-0227-wcag-2-2-location-aria26-and-g128]]                                   | WCAG SC 2.4.8 Location (AAA): G65, G63, G128, ARIA26                   |
| [[K-0228-wai-aria-apg-breadcrumb-current-page]]                                | APG Breadcrumb: named nav, aria-current optional on a non-link         |
| [[K-0229-wai-aria-apg-disclosure-navigation-not-menu-role]]                    | APG disclosure navigation: buttons with aria-expanded, no menu role    |
| [[K-0230-wcag-2-2-heading-order-advisory-not-required]]                        | WCAG 2.2 pages read: heading order is guidance, not a criterion        |
| [[K-0231-whatwg-heading-levels-and-wai-tutorial-fixed-sections]]               | WHATWG: heading one level deeper at most; WAI: fixed sections          |
| [[K-0232-wcag-2-2-bypass-blocks-techniques]]                                   | WCAG SC 2.4.1 Bypass Blocks (A): skip link, landmarks, headings        |
| [[K-0233-wcag-2-2-reflow-and-consistent-navigation]]                           | WCAG Reflow at 320 px (AA); Consistent Navigation (AA)                 |
| [[K-0234-wcag-2-2-focus-order-and-focus-not-obscured]]                         | WCAG Focus Order (A), Focus Not Obscured (AA): modal, sticky header    |
| [[K-0235-wcag-2-2-target-size-minimum-for-nav-items]]                          | WCAG SC 2.5.8 (AA): 24 by 24 CSS px targets, with exceptions           |
| [[K-0236-synthesis-app-navigation-and-headers-benchmark]]                      | Synthesis of K-0204 to K-0235: app navigation and headers, four tables |
| [[K-0260-untitled-ui-file-uploaders-examples-and-props]]                       | Untitled UI file uploaders: examples, parts, props, sizes, variants    |
| [[K-0261-untitled-ui-list-progress-bar-and-fill-items]]                        | Untitled UI upload list: progress, complete, item forms                |
| [[K-0262-untitled-ui-failed-item-try-again-and-delete]]                        | Untitled UI failed item: text, retry, delete                           |
| [[K-0263-untitled-ui-size-and-type-limits-and-silent-drop]]                    | Untitled UI size and type limits: checks, callbacks, rejection         |
| [[K-0264-untitled-ui-drop-zone-keyboard-and-screen-reader]]                    | Untitled UI drop zone for keyboard and screen reader users             |
| [[K-0265-untitled-ui-progress-indicators-no-accessible-name]]                  | Untitled UI progress indicators: role, value, accessible name          |
| [[K-0266-untitled-ui-file-trigger-and-inputs-file-upload-example]]             | Untitled UI FileTrigger and the Inputs file upload example             |
| [[K-0267-shadcn-ui-no-dropzone-input-type-file-example]]                       | Does shadcn/ui have a dropzone; its Input type file example            |
| [[K-0268-shadcn-ui-attachment-parts-sizes-and-props]]                          | shadcn/ui Attachment: parts, props, sizes, orientation                 |
| [[K-0269-shadcn-ui-attachment-states-retry-and-cancel-samples]]                | shadcn/ui Attachment: states, retry, cancel, progress text             |
| [[K-0270-shadcn-ui-attachment-accessibility-and-no-aria-in-source]]            | shadcn/ui Attachment: accessibility guidance and ARIA in the source    |
| [[K-0271-shadcn-ui-progress-upload-label-and-field-error-alert]]               | shadcn/ui Progress upload label, FieldError and invalid styling        |
| [[K-0272-radix-has-no-file-or-dropzone-primitive]]                             | Does Radix have a file input, upload or dropzone primitive             |
| [[K-0273-radix-progress-api-and-source-no-accessible-name]]                    | Radix Progress: props, data states, ARIA in the source                 |
| [[K-0274-radix-form-message-and-focus-first-invalid]]                          | Radix Form: validation message, focus on an invalid submit             |
| [[K-0275-wcag-2-2-dragging-movements-single-pointer-alternative]]              | WCAG 2.2 SC 2.5.7 Dragging Movements and its scope                     |
| [[K-0276-wcag-2-2-keyboard-and-the-drag-and-drop-example]]                     | WCAG 2.2 SC 2.1.1 Keyboard and its drag and drop example               |
| [[K-0277-wcag-2-2-status-messages-progress-and-error-techniques]]              | WCAG 2.2 SC 4.1.3 techniques for errors and for progress               |
| [[K-0278-wcag-2-2-aria25-aria27-file-upload-progress-announcing]]              | WCAG techniques ARIA25 and ARIA27: file upload progress                |
| [[K-0279-wcag-2-2-error-identification-in-text]]                               | WCAG 2.2 SC 3.3.1 Error Identification                                 |
| [[K-0280-wcag-2-2-error-suggestion-for-allowed-values]]                        | WCAG 2.2 SC 3.3.3 Error Suggestion                                     |
| [[K-0281-wcag-2-2-labels-or-instructions-expected-format]]                     | WCAG 2.2 SC 3.3.2 Labels or Instructions                               |
| [[K-0282-wai-aria-apg-no-file-or-drag-pattern-meter-note]]                     | WAI-ARIA APG: file or drag pattern, meter against progress             |
| [[K-0283-wai-aria-1-2-progressbar-role-and-region-loading]]                    | WAI-ARIA 1.2 role progressbar                                          |
| [[K-0284-wai-aria-1-2-grabbed-and-dropeffect-deprecated]]                      | WAI-ARIA 1.2 aria-grabbed and aria-dropeffect                          |
| [[K-0285-aria-in-html-input-file-takes-no-role]]                               | ARIA in HTML: input type file and the progress element                 |
| [[K-0286-html-accept-is-a-hint-back-it-on-the-server]]                         | HTML and MDN: accept, multiple, hiding a file input                    |
| [[K-0287-react-aria-dropzone-takes-a-file-trigger-child]]                      | React Aria DropZone: file picking, labels, keyboard text               |
| [[K-0288-synthesis-file-upload-benchmark]]                                     | Synthesis of K-0260 to K-0287: file upload benchmark table             |
| [[K-0290-untitled-ui-select-sizes-states-and-item-slots]]                      | Untitled UI Select: examples, sizes, states, item slots                |
| [[K-0291-untitled-ui-select-combobox-opens-on-focus-visual-hint]]              | Untitled UI Select.ComboBox: when it opens, key hint, empty, loading   |
| [[K-0292-untitled-ui-multi-select-count-trigger-footer-and-search-dialog]]     | Untitled UI MultiSelect: trigger, footer, search, empty, removal       |
| [[K-0293-untitled-ui-tag-select-removal-keys-and-focus]]                       | Untitled UI TagSelect: tag keys, removal, focus after removal          |
| [[K-0294-untitled-ui-tag-close-x-size-and-one-fixed-name]]                     | Untitled UI TagCloseX: size, name, keys on the Tags page               |
| [[K-0295-untitled-ui-input-tags-silent-rejection-and-focus]]                   | Untitled UI InputTags: adding, refusal, focus, Backspace               |
| [[K-0296-untitled-ui-command-menu-filter-false-and-empty-state]]               | Untitled UI Command menu: async search and the empty state             |
| [[K-0297-react-aria-combobox-menu-trigger-empty-and-count-announcement]]       | React Aria ComboBox: menuTrigger, empty list, count announcement       |
| [[K-0298-shadcn-ui-combobox-is-built-on-base-ui-on-the-radix-tab]]             | Which primitive does shadcn/ui Combobox use on the Radix URL           |
| [[K-0299-shadcn-ui-combobox-parts-props-and-examples]]                         | shadcn/ui Combobox: parts, props, examples, what the page omits        |
| [[K-0300-shadcn-ui-combobox-chips-remove-button-has-no-name]]                  | shadcn/ui Combobox chips: markup, remove button size and name          |
| [[K-0301-shadcn-ui-command-on-cmdk-and-the-popover-combobox-sample]]           | shadcn/ui Command, components list, the Popover combobox sample        |
| [[K-0302-cmdk-roles-keys-empty-and-loading]]                                   | cmdk: roles, keys, Empty, Loading, IME                                 |
| [[K-0303-base-ui-combobox-status-and-empty-are-live-regions]]                  | Base UI Combobox: Status, Empty, list roles, root props                |
| [[K-0304-base-ui-combobox-async-search-sample]]                                | Base UI Async search: status text, stale requests, chosen items        |
| [[K-0305-base-ui-combobox-chip-keys-and-focus-after-removal]]                  | Base UI chips: tab order, keys, focus after removal, IME               |
| [[K-0306-base-ui-combobox-multiple-mode-strings-left-to-the-author]]           | Base UI multiple mode: strings, filter reset, limiting chips           |
| [[K-0307-radix-has-no-combobox-and-select-is-one-value-without-search]]        | Does Radix have a combobox; Radix Select's value and search            |
| [[K-0308-wai-aria-apg-combobox-kinds-and-autocomplete-forms]]                  | WAI-ARIA APG Combobox: kinds, popups, autocomplete forms               |
| [[K-0309-wai-aria-apg-combobox-keyboard-and-listbox-popup-keys]]               | WAI-ARIA APG Combobox: keyboard, listbox popup keys, no match          |
| [[K-0310-wai-aria-apg-combobox-roles-states-and-aria-busy]]                    | WAI-ARIA APG and 1.2: combobox roles, states, aria-busy                |
| [[K-0311-wai-aria-apg-listbox-multi-select-keys-and-state]]                    | WAI-ARIA APG Listbox: multi-select keys and state                      |
| [[K-0312-wai-aria-apg-listbox-cautions-select-all-and-delete-example]]         | WAI-ARIA APG Listbox: cautions, Select All, Delete in an example       |
| [[K-0313-wai-aria-apg-has-no-tag-or-multi-value-combobox-pattern]]             | Does the APG have a tag or multi-value combobox pattern                |
| [[K-0314-wcag-2-2-status-message-result-count]]                                | WCAG 2.2 SC 4.1.3 and a result count                                   |
| [[K-0315-wcag-2-2-target-size-minimum-and-spacing]]                            | WCAG 2.2 SC 2.5.8: size, spacing, a combobox's list                    |
| [[K-0316-wcag-2-2-popup-opened-by-focus]]                                      | WCAG 2.2 SC 3.2.1, 1.4.13 and 2.4.11 for a list opened on focus        |
| [[K-0317-wcag-2-2-on-input-and-name-role-value-for-a-custom-list]]             | WCAG 2.2 SC 3.2.2 and 4.1.2 for a custom list                          |
| [[K-0318-wcag-2-2-keyboard-and-focus-order-no-rule-after-removal]]             | WCAG 2.2 SC 2.1.1 and 2.4.3 and focus after a removal                  |
| [[K-0319-synthesis-combobox-and-multi-select-benchmark]]                       | Synthesis of K-0290 to K-0318: Combobox and Multi-select tables        |
