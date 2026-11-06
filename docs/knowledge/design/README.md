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
| [[K-0320-untitled-ui-breadcrumbs-types-dividers-and-item-slots]]               | Untitled UI Breadcrumbs: types, dividers, slots, what the page omits   |
| [[K-0321-untitled-ui-breadcrumbs-collapse-max-visible-items]]                  | Untitled UI Breadcrumbs: how a long trail collapses                    |
| [[K-0322-untitled-ui-breadcrumbs-accessibility-and-no-open-source]]            | Untitled UI Breadcrumbs: current crumb, nav label, unread source       |
| [[K-0323-shadcn-ui-breadcrumb-parts-classes-and-link-routing]]                 | shadcn/ui Breadcrumb: parts, classes, router link                      |
| [[K-0324-shadcn-ui-breadcrumb-current-page-span-and-hidden-separator]]         | shadcn/ui Breadcrumb: current crumb, separator, nav label              |
| [[K-0325-shadcn-ui-breadcrumb-collapse-is-composed-by-hand]]                   | shadcn/ui Breadcrumb: how a long trail collapses                       |
| [[K-0326-untitled-ui-pagination-forms-props-and-controls]]                     | Untitled UI Pagination: forms, props, small screens, page controls     |
| [[K-0327-untitled-ui-pagination-sibling-count-range]]                          | Untitled UI Pagination: how a long page range shortens                 |
| [[K-0328-untitled-ui-pagination-names-and-button-items]]                       | Untitled UI Pagination: names, current page, item markup               |
| [[K-0329-untitled-ui-pagination-dot-and-line]]                                 | Untitled UI PaginationDot and PaginationLine                           |
| [[K-0330-shadcn-ui-pagination-parts-active-link-and-text-prop]]                | shadcn/ui Pagination: parts, active link, sizes, text prop             |
| [[K-0331-shadcn-ui-pagination-has-no-range-logic]]                             | shadcn/ui Pagination: does it shorten a long page range                |
| [[K-0332-shadcn-ui-pagination-names-and-hidden-ellipsis]]                      | shadcn/ui Pagination: names, current page, ellipsis                    |
| [[K-0333-wai-aria-apg-breadcrumb-pattern]]                                     | WAI-ARIA APG Breadcrumb pattern: landmark, aria-current, keyboard      |
| [[K-0334-wai-aria-apg-breadcrumb-example]]                                     | WAI-ARIA APG Breadcrumb example: list, label, separators               |
| [[K-0335-wai-aria-apg-landmark-labels-and-no-pagination-pattern]]              | WAI-ARIA APG: nav labels, and whether a Pagination pattern exists      |
| [[K-0336-wai-aria-1-2-aria-current-values]]                                    | WAI-ARIA 1.2 aria-current: values and limits                           |
| [[K-0337-wcag-2-2-location-and-g65-breadcrumb-trail]]                          | WCAG 2.2 SC 2.4.8 and technique G65: the current location              |
| [[K-0338-wcag-2-2-aria26-aria11-and-h97]]                                      | WCAG 2.2 techniques ARIA26, ARIA11 and H97: current item, nav labels   |
| [[K-0339-synthesis-breadcrumb-and-pagination-benchmark]]                       | Synthesis of K-0320 to K-0338: Breadcrumb and Pagination tables        |
