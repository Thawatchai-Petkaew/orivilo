---
id: K-0087
topic: market
claim: In the apps of the two resellers read (Wireflow and Higgsfield), the user prepays for credits, a platform currency spent per generation on bought-in models that Google and OpenAI list in dollars per image or per token (Black Forest Labs lists in its own $0.01 credits); both sell monthly plans that grant credits, with top-ups beside them (Higgsfield's Credit Packs need an active plan, its API wallet needs none), and the two differ on expiry, which is where breakage (prepaid rights never used, ASC 606 and IFRS 15) can arise; Stripe presents prepaid credits as a fit for high-cost AI products because they bring cash up front and limit fraud.
source: "docs/knowledge/market/K-0084-wireflow-flat-credit-price-rollover-and-per-node-metering.md; docs/knowledge/market/K-0085-higgsfield-tiered-credits-no-rollover-and-separate-api-wallet.md; docs/knowledge/market/K-0086-reseller-markup-over-model-list-prices.md; docs/knowledge/architecture/K-0045-wireflow-third-party-models-in-a-hosted-node-graph.md; docs/knowledge/architecture/K-0046-higgsfield-own-models-plus-resold-third-party-models.md; https://stripe.com/blog/introducing-credits-for-usage-based-billing; https://docs.stripe.com/billing/subscriptions/usage-based/use-cases/credits-based-pricing-model; https://dart.deloitte.com/USDART/home/codification/revenue/asc606-10/roadmap-revenue-recognition/chapter-8-step-5-determine-when/8-8-customers-unexercised-rights-breakage"
retrieved: 2026-10-28
confidence: 0.7
applies_to: [ORV-131]
license: link-only
---

## Evidence

This is a synthesis of [[K-0084-wireflow-flat-credit-price-rollover-and-per-node-metering]], [[K-0085-higgsfield-tiered-credits-no-rollover-and-separate-api-wallet]] and [[K-0086-reseller-markup-over-model-list-prices]], with what the platforms resell from [[K-0045-wireflow-third-party-models-in-a-hosted-node-graph]] and [[K-0046-higgsfield-own-models-plus-resold-third-party-models]], plus general references from two publishers (Stripe, two pages, and Deloitte, one page) read on 2026-10-28 through a fetch tool (quotes of at most about 125 characters). Confidence 0.7: the pattern is drawn from two companies, so it describes those two, not a market. The sentences under "The pattern in the two resellers" and "Where the two differ" are scoped to them.

### General references

> Credit-based models are a strong fit for businesses with high costs of goods sold (COGS), such as AI companies

> Credits also help mitigate fraud risk, which is especially important for businesses building AI models.

(Stripe blog, "Introducing credits for usage-based billing", February 11, 2025. Stripe sells billing software, so this is a vendor's view.) The same post says credits "provide important up-front cash flow" because "each usage event carries a substantial fixed cost", and that businesses "can now set both start and end dates for credits".

Stripe's docs on a credit-based pricing model say: "With this version of usage-based billing, credits are burned down when the invoice is created at the end of the billing period." The same page says basic billing credits reconcile at invoice time, "but customers can exceed their balance during the cycle", and points to Metronome for "real-time credit burndown, where usage reduces the credit balance as it occurs."

Deloitte's roadmap on ASC 606 (US GAAP), section 8.8: "Those unexercised rights are often referred to as breakage." An entity that expects to be entitled to breakage should "recognize the expected breakage amount as revenue in proportion to the pattern of rights exercised by the customer"; if not, "when the likelihood of the customer exercising its remaining rights becomes remote." Amounts owed under unclaimed property laws are a liability, not revenue. The page says the US guidance parallels "paragraphs B44 through B47 of IFRS 15"; the IFRS text itself was not read.

### The pattern in the two resellers

1. **A platform currency over bought-in models.** Both price app generations in their own credits; Higgsfield's API is the exception and charges dollars (K-0085). Of the model vendors whose pricing pages were read, Google prices in dollars per image and OpenAI in dollars per million tokens; Black Forest Labs is the exception, pricing in its own credits at "1 credit = $0.01 USD" (K-0086). Higgsfield also runs models it calls its own (K-0046); Wireflow's pages show no model of its own (K-0045).
2. **Prepaid, through a plan plus top-ups.** Both sell monthly plans that grant credits (K-0084, K-0085). Both sell top-ups: Wireflow lets a user "Choose a credit top-up or a subscription plan" and does not say on the pages read whether a top-up needs a plan; Higgsfield's help center says "An active subscription is required to purchase a Credit Pack." Higgsfield's API is the exception to a plan floor: a prepaid dollar balance with no subscription (K-0085).
3. **Price per credit.** Wireflow keeps it at about $0.0135 on each paid plan; Higgsfield's falls with plan size, from $0.075 to $0.043 on individual plans, and its business plans cost more per credit (our arithmetic, K-0084 and K-0085).
4. **Expiry, and so breakage.** Higgsfield's subscription credits expire at renewal and its packs, Auto-Refill and Boost credits after 90 days (K-0085). Wireflow's pricing page says unused credits carry over "on every plan"; its pages read do not say whether credits ever lapse (K-0084). Under ASC 606 as Deloitte summarises it, prepaid rights that expire unused are breakage. Neither company's pages read state how many credits expire, so the size of breakage at either is unknown.
5. **Spend controls.** Both show the cost before a run (K-0084, K-0085). Wireflow's API refuses a run with 402 at a short balance; Higgsfield's API "stops automatically at zero". Higgsfield sells more parallel runs as paid Concurrency Boost packs; Wireflow's pages state request-per-minute limits per plan and do not state a concurrency limit.
6. **Failed work.** Wireflow's terms refund credits on a platform error; Higgsfield's app "Usually" refunds failed generations and its API does not charge failed requests (K-0084, K-0085).
7. **Markup over list.** On Nano Banana Pro and Nano Banana 2, our arithmetic gives resale from about 0.64 to about 4.0 times Google's list price, varying with platform, plan and resolution; wholesale prices are not public, so these are not margins (K-0086).
8. **Payments.** Wireflow's terms name Stripe; Stripe's own pages name Higgsfield as a Stripe Billing customer (K-0084, K-0085).

### Where the two differ

- Rollover: Wireflow carries over; Higgsfield's subscription credits expire at renewal.
- Price per credit: flat at Wireflow, tiered at Higgsfield.
- Unlimited: Higgsfield offers credit-free windows on selected models under fair use, on higgsfield.ai only; no such offer appears on Wireflow's pages read.
- API billing: a Wireflow API run is paid in credits by "The API key owner" (K-0084, "Who pays for a run"); Higgsfield's API has its own dollar balance, apart from app credits (K-0085).

### Inference (not fact; confidence 0.4)

- Expiring credits (Higgsfield) leave room for breakage revenue, and carry-over credits (Wireflow) leave less; no figure on the pages read shows this.
- A real-time burn-down ledger, rather than end-of-period invoicing, is what lets a platform refuse a run at zero balance, as both APIs do; Stripe's docs say basic billing credits allow customers to exceed their balance within a cycle.

These are leads to check, not grounds for a decision.

## Options for ORIVILO (not decisions)

These are options for the architect and the owner, recorded so a later pricing decision can cite the evidence. This entry decides nothing on ORIVILO's own pricing.

- A flat price per credit (Wireflow) or a falling one with plan size (Higgsfield).
- Credits that carry over, or credits that expire, with the breakage that follows and its accounting.
- A plan floor with top-ups, or a prepaid wallet with no plan, or both side by side as Higgsfield runs them.
- Cost shown before the run, a hard stop at zero, and automatic refund on platform failure: both platforms show the cost before a run, both APIs stop at zero balance (the Higgsfield app's behaviour at zero was not read), and both state a refund rule for failed work.

## Why it matters for ORIVILO

ORV-131 asked how platforms that resell third-party models price them. The two read share a prepaid credit currency over bought-in models, monthly plans that grant credits, top-ups, cost shown before a run and an API that stops at zero balance, and differ on rollover, price per credit and API billing. ORIVILO routes AI through OpenRouter (ADR 0009), so the same questions of credit price over model cost apply to it; which answer it takes is the owner's decision.
