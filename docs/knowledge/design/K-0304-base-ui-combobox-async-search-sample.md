---
id: K-0304
topic: design
claim: Base UI's Async search samples set filter to null, show a prompt, "Searching…" or an error string in Combobox.Status, abort the previous request on each input change with no debounce, keep chosen items merged into the list in the multiple sample, and show Empty only for a non-empty query with no pending state, no result and no error.
source: "https://base-ui.com/react/components/combobox; docs/specs/ORV-64/audit.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-228]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters. These are docs samples, not library behaviour: the library supplies the parts, and the sample code supplies the request, the states and the text. Its error is a simulation (a 1% chance or the query `'will_error'`). The page has the examples "Async search (single)" and "Async search (multiple)"; the code read is the multiple one. Nothing here was run in a browser or with a screen reader.

```ts
merged.push(user);
```

```ts
setSearchResults(selectedValuesRef.current);
```

```ts
if (controller.signal.aborted) return;
```

- Root: `filter` set to `null` disables filtering, which the async samples use.
- Status text: "Start typing to search people…", "Searching…" with an `aria-hidden` spinner, "No matches for" and the query.
- Error: "Failed to fetch people. Please try again." is returned from the search function, stored with `setError(result.error)` and shown as the status.
- Requests: each input change makes a new `AbortController` and calls `abortControllerRef.current?.abort();`. There is no debounce; `item-press` changes return early.
- Chosen items: the `items` memo appends chosen users missing from the results. On `onOpenChangeComplete`, and when the input is cleared, results reset to the chosen values.
- Layout: `<Combobox.Empty>` sits after `<Combobox.Status>` and before `<Combobox.List>` in the popup. Its text is "Try a different search term."

## Why it matters for ORIVILO

Row 25 of the ORV-64 build order asks for an async story, and this is the fullest async sample read: pending, error, no result and stale requests each have a place. The merge line answers what happens to a chosen item that a new query no longer returns.
