---
id: K-0084
topic: market
claim: Wireflow sells monthly credit plans at about $0.0135 a credit on each of its three paid plans (our arithmetic), lets unused credits carry over on every plan, meters each model node that runs at its own credit cost shown before the run, refuses an API run with HTTP 402 when the balance is short, says in its terms that credits are refunded automatically when a job fails on a platform error and that payments go through Stripe, limits API requests per minute by plan and per key, and caps direct `/execute` calls at 120 executions per user per hour.
source: "https://www.wireflow.ai/pricing; https://www.wireflow.ai/docs/credits-and-billing.md; https://www.wireflow.ai/docs/credits-and-billing; https://www.wireflow.ai/docs/api/errors.md; https://www.wireflow.ai/docs/api/rate-limits.md; https://www.wireflow.ai/terms; https://www.wireflow.ai/docs/nodes/video--seedance_2_5.md"
retrieved: 2026-10-28
confidence: 0.8
applies_to: [ORV-131]
license: link-only
---

## Evidence

Every page was read on 2026-10-28 through a fetch tool that returns page text and quotes of at most about 125 characters; no page was opened in a browser. Confidence 0.8: every fact is from Wireflow's own pages (one source, several pages), and the prices per credit are our arithmetic on its listed prices. The credits page says: "If this page and the pricing page ever differ, the pricing page is right." Related entries: [[K-0045-wireflow-third-party-models-in-a-hosted-node-graph]] (what Wireflow resells) and [[K-0046-higgsfield-own-models-plus-resold-third-party-models]].

> Credits you don't use carry over to next month, on every plan.

(pricing)

> You pay for the nodes that run. If a run stops early, the nodes that already finished are still charged.

> Check the credit estimate before you run. The playground shows the exact cost.

(docs/credits-and-billing, last updated 2026-10-26)

> If an AI job fails due to a platform error, credits will be automatically refunded.

> Payments are processed through Stripe.

(terms, last updated February 18, 2026)

### Plans and price per credit

Price a month and credits a month are from the pricing page; the price per credit is our arithmetic.

- **Free:** $0, up to 60 credits; no price per credit.
- **Starter:** $36 for 2,660 credits; $36 / 2,660 = $0.01353 a credit.
- **Professional:** $59 for 4,370 credits; $59 / 4,370 = $0.01350 a credit.
- **Team:** $299 for 22,140 credits; $299 / 22,140 = $0.01350 a credit.
- **Flat price per credit:** the three paid plans come to $0.0135 a credit when rounded to four places (our arithmetic). The pricing page states no price per credit.
- **Free plan:** "Up to 60 starter credits, free video exports" (pricing).
- **Annual billing:** the pricing page offers an annual option described as "2 months free" and lists no annual prices or annual credit amounts.
- **Credit packs:** "On Professional and Team, standard credit packs come with 20% bonus credits" (docs/credits-and-billing). No pack price is listed on either page, so the price per credit of a pack is unknown. Purchases are made in Settings, Billing: "Choose a credit top-up or a subscription plan."
- **Team pool:** the credits page lists Team's 22,140 credits as a shared pool.

### Metering per node, cost before the run

- "Each AI model has its own credit cost. Resolution, length and quality change the cost." (docs/credits-and-billing)
- "As a guide, a typical mix uses about 30 credits an image and 17 credits a second of video." (docs/credits-and-billing; the pricing page gives the same two figures)
- The pricing page lists credits per run at default settings, among them Seedance 2.5, Kling Video and Kling Motion Control at 135, VEED Fabric at 240, Kling AI Avatar at 92, Seedance 2.0 at 90, Wan 2.5 at 80, and the Video Editor at 0 ("No credits used").
- Node reference pages state a cost per unit; for example the Seedance 2.5 node page states "~27 credits per second" and "The figure is the rate for a 5-second clip." Per-model figures and their USD equivalents are in [[K-0086-reseller-markup-over-model-list-prices]].
- **Who pays (docs/credits-and-billing, "Who pays for a run"):** a run in the editor is paid by "Your account, or your team's credit pool for a board in a team folder"; an API run by "The API key owner"; a published app used on its own page: "The app owner pays the model costs.", and the app can charge signed-in visitors a credit price per run; a community template run by reference is paid by "You. The template author is never charged"; an agent over MCP by "The connected account"; a scheduled run by "Your account. Scheduling runs needs an active paid subscription".
- **Balance:** "Your current credit balance is shown in the top navigation bar." From code, "`GET /api/v1/me` returns the plan and credits of the account your API key acts as"; agents over MCP use the `get_credit_balance` tool.

### At zero balance

- The errors page lists 402 as "Insufficient credits to run the workflow". Its example body carries `"error": "Insufficient credits. Required: 10, Available: 3"`, `"insufficientCredits": true`, `"requiredCredits": 10`, `"availableCredits": 3` and a per-node `breakdown` (`{ "nodeId": "node-1", "nodeLabel": "Text to Image", "credits": 10 }`).
- On the Apps API the call returns 402 with "Insufficient credits. Please top up your account." (docs/credits-and-billing).

### Failed runs and refunds

- **Terms:** "If an AI job fails due to a platform error, credits will be automatically refunded." and "All fees are non-refundable unless otherwise stated."
- **Docs:** a run that stops early still charges the nodes that finished (quoted above).
- **Errors page, on retries after a 500:** "A run can start even when the call errors," and "a retry of `/execute` (or of `/run` without the same `Idempotency-Key`) bills a second run."
- The pages read do not say how the terms' refund on platform error combines with the docs' charge for finished nodes, or whether a 500 that started a run counts as a platform error.

### Rate limits

API requests a minute, as the pricing page and the rate-limits page both list them: Free 10, Starter 20, Professional (Pro on the rate-limits page) 60, Team 60. The rate-limits page also lists Enterprise at 200 and Premium at 60; the pricing page lists neither.

The rate-limits page adds a limit on runs: "`POST /api/v1/workflows/{id}/execute` checks a rolling limit of 120 executions per user per hour, across plans." and "The 120/hour limit above applies to direct `/execute` calls, not `/run`." API-key calls "also pass a per-key minute limiter: 60 requests per minute by default", and "Minute counters are held in process memory, so they are a throttling measure, not a precise account-wide spending cap." (The page sets the figures in bold; the bold is left out here.)

The rate-limits page (last updated 2026-10-17) says: "These are request limits. They do not promise a daily number of executions." and "Do not automatically resubmit a paid run after a timeout or `5xx`." Neither page states a limit on concurrent runs.

### Payment and terms

- Stripe: "Payments are processed through Stripe." (terms). The pricing and credits pages name no payment provider.
- Credits: "Wireflow uses a credit-based system." and "Credits are consumed when you use AI features." (terms)
- Price changes: "We reserve the right to change pricing with 30 days notice to active subscribers." (terms)
- The terms say nothing about rollover or expiry beyond "Free tier credits refresh periodically."

### Conflicts between sources

- **Seedance 2.5 rate, same page:** the node page's Pricing section says "~27 credits per second", while its description says the model "costs about 26 credits per second". The pricing page's 135 credits per default 5 s run is 27 a second (our arithmetic).
- **Refund wording:** the terms (February 2026) promise an automatic refund on a platform error; the credits page (October 2026) says nothing of refunds and says finished nodes are charged when a run stops early. These may not contradict, but no page reconciles them.

### Claims that did not re-check

These carry no confidence and are not grounds for a decision.

- A search-engine summary said Wireflow's billing guide deducts credits "only after a model run finishes successfully" and that failed runs are not billed. Asked for the words "successfully", "fail", "failed", "not charged" and "refund", the fetch of docs/credits-and-billing.md found none of them on 2026-10-28.
- The same summary said checkout runs through Whop. The word "Whop" is not on the credits page fetched, and the terms name Stripe.

## Unknowns

- The price of a credit pack, so the price per credit of a top-up, and of the 20% bonus.
- Annual prices and whether annual plans change the price per credit.
- Whether a top-up needs a paid plan; the pages read say this only for scheduled runs.
- Whether credits lapse on cancellation; the pricing page says only that they carry over month to month.
- What Wireflow pays the model vendors (see K-0086).

## Why it matters for ORIVILO

ORV-131 asks how platforms that resell third-party models charge for them. Wireflow's answer is one flat credit price across plans, per-node metering with the cost shown before the run, carry-over credits, and a hard stop (402) at zero. This entry records the model; it makes no decision on ORIVILO's own pricing.
