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
| [[K-0380-untitled-ui-date-picker-forms-and-react-aria]]                        | Untitled UI date pickers: examples, React Aria base, props             |
| [[K-0381-untitled-ui-date-picker-trigger-apply-and-cancel]]                    | Untitled UI DatePicker trigger, Apply and Cancel                       |
| [[K-0382-untitled-ui-date-range-presets-and-breakpoints]]                      | Untitled UI DateRangePicker presets and breakpoints                    |
| [[K-0383-untitled-ui-calendar-props-header-and-today-button]]                  | Untitled UI Calendar props, header and Today button                    |
| [[K-0384-untitled-ui-calendar-cell-states]]                                    | Untitled UI calendar cell states and looks                             |
| [[K-0385-untitled-ui-calendars-page-is-an-event-calendar]]                     | Is Untitled UI's Calendars page a date picker                          |
| [[K-0386-untitled-ui-libraries-versions-and-licenses]]                         | Untitled UI libraries: versions and licenses                           |
| [[K-0387-react-aria-calendar-grid-keys-and-names]]                             | React Aria calendar: grid roles, keys and names                        |
| [[K-0388-react-aria-calendar-system-and-week-start-from-locale]]               | React Aria calendar system and week start from the locale              |
| [[K-0389-shadcn-ui-calendar-page-props-and-versions]]                          | shadcn/ui Calendar page: props, sections and versions                  |
| [[K-0390-shadcn-ui-calendar-source-defaults-and-day-button]]                   | shadcn/ui calendar.tsx defaults and day button                         |
| [[K-0391-shadcn-ui-date-picker-is-popover-plus-calendar]]                      | shadcn/ui Date Picker: Popover plus Calendar                           |
| [[K-0392-shadcn-ui-date-picker-examples-range-input-and-presets]]              | shadcn/ui date picker samples: range, input and presets                |
| [[K-0393-shadcn-ui-registry-dependency-and-persian-path]]                      | shadcn/ui registry dependency and the Persian path                     |
| [[K-0394-react-day-picker-package-version-and-license]]                        | React DayPicker package: version, license and dependencies             |
| [[K-0395-react-day-picker-props-modes-and-day-states]]                         | React DayPicker props, modes and day states                            |
| [[K-0396-react-day-picker-range-mode-props]]                                   | React DayPicker range mode props                                       |
| [[K-0397-react-day-picker-keys-grid-and-names]]                                | React DayPicker keys, grid roles and names                             |
| [[K-0398-react-day-picker-buddhist-build]]                                     | React DayPicker Buddhist build                                         |
| [[K-0399-react-day-picker-week-start-locale-and-thai-labels]]                  | React DayPicker week start, locale and Thai labels                     |
| [[K-0400-wai-aria-apg-date-picker-dialog-keys]]                                | WAI-ARIA APG Date Picker Dialog: keys                                  |
| [[K-0401-wai-aria-apg-date-picker-dialog-names-and-roles]]                     | WAI-ARIA APG Date Picker Dialog: names and roles                       |
| [[K-0402-wai-aria-apg-grid-pattern-keys-and-roles]]                            | WAI-ARIA APG Grid pattern: keys and roles                              |
| [[K-0403-wai-aria-apg-modal-dialog-keys-and-roles]]                            | WAI-ARIA APG Modal Dialog pattern: keys and roles                      |
| [[K-0404-intl-datetimeformat-calendar-option-and-ca-key]]                      | Intl.DateTimeFormat calendar option and ca key                         |
| [[K-0405-cldr-thailand-prefers-buddhist-and-thai-formats]]                     | CLDR: Thailand's calendar preference and Thai date formats             |
| [[K-0406-runtime-default-calendar-for-thai-can-differ]]                        | Does a runtime's default calendar for Thai differ                      |
| [[K-0407-cldr-thailand-week-starts-sunday-and-getweekinfo]]                    | CLDR Thailand week start and Intl getWeekInfo                          |
| [[K-0408-date-fns-thai-locale-sunday-gregorian-year]]                          | date-fns Thai locale: week start and year                              |
| [[K-0409-synthesis-calendar-and-date-picker-benchmark]]                        | Synthesis of K-0380 to K-0408: Calendar and Date picker tables         |
