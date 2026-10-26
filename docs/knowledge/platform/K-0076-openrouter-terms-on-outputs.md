---
id: K-0076
topic: platform
claim: OpenRouter's Terms of Service (last updated 2026-08-31) do not assign ownership of outputs to the user or to OpenRouter but defer it to each model's Model Terms, which the user agrees to follow, and they license User Content including outputs to OpenRouter to operate the service and disclaim any warranty on outputs.
source: "https://openrouter.ai/terms"
retrieved: 2026-10-26
confidence: 0.8
applies_to: [ORV-126, ADR-0018, ADR-0009]
license: own-words
---

## Evidence

The page header says "Last Updated: August 31, 2026". Read on 2026-10-26 through a fetch tool that returns page text to a reading model, treated as untrusted data; it returned only short quotes, so the full clauses were not seen word for word. The terms carry no reuse license.

Section 6.1 (User Content Generally; Training Data):

> Your ownership rights in the Output are set forth in the Model Terms for each Model you use.

> You retain copyright and any other proprietary rights that you may hold in the Input.

Section 16.2, in capitals in the original:

> OPENROUTER IS NOT RESPONSIBLE FOR THE ACCURACY OR QUALITY OF ANY OUTPUT

## What the page states (fact)

- **Model Terms apply (5.1, 5.8).** Using a model through OpenRouter means agreeing to that model's terms ("Model Terms"); the user alone must review them and decide whether they allow the intended use of inputs and outputs. Where a model provider requires it, the Model Terms govern. 5.1 says a list of Model Terms is given through a link in the provider routing docs; that list did not come through when read (see [[K-0073-openrouter-image-api-has-no-data-policy-fields]]).
- **Ownership of outputs (6.1).** Deferred to the Model Terms. The user keeps rights in inputs. Inputs and outputs together are User Content, which the user licenses to OpenRouter (non-exclusive, worldwide, royalty-free, sublicensable) to operate and provide the service.
- **Training (6.1).** Some models may store or train on inputs; OpenRouter says it has opted out of training where possible for the models it uses.
- **Logging (6.2).** If prompt logging is turned on, the user grants OpenRouter a worldwide, perpetual, irrevocable licence to log and store User Content.
- **No warranty (16.1, 16.2).** No warranty that output fits the intended use; the user bears the risk and must evaluate outputs; no representation about any model provider's data handling.
- **Third-party beneficiaries (20).** Model providers can enforce sections 5, 6.1, 15, 17 and 20.

## What the page does not state

- Any clause specific to images or to the Image API. The terms speak of Input and Output in general.
- That the user owns outputs. Ownership is whatever the model's terms say (for the Gemini API, see [[K-0075-gemini-api-terms-on-generated-output]]).

ADR 0018 (Facts, row 8) records OpenRouter's terms on outputs as not verified because the text it fetched had no matching clause; this read found the clause in section 6.1.

## Why it matters for ORIVILO

The ownership of a logo draft drawn through OpenRouter comes from Google's terms, not OpenRouter's, and OpenRouter disclaims output quality and provider data handling. That supports ADR 0018's rule that no screen calls an image owned, unique or cleared. The prompt logging licence in 6.2 bears on the account settings ADR 0018 relies on; what to set is for the architect and the owner.
