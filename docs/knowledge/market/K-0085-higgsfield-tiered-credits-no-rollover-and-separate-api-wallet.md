---
id: K-0085
topic: market
claim: Higgsfield's app sells subscription credits whose price falls with plan size (from $0.075 a credit on Starter to $0.043 on Ultra, our arithmetic on the company's blog of 2026-10-24), expire at renewal, and are spent before any other credits; Credit Packs (subscription required) and Auto-Refill ($1 = 18 credits) last 90 days and are spent soonest-expiring first; concurrency rises with the plan and can be bought as one-time Concurrency Boost packs; "Unlimited" lets selected models run without credits for a window, on higgsfield.ai only and for personal use; its API is a separate prepaid dollar balance with per-model discounts; Stripe's own pages say Higgsfield bills through Stripe.
source: "https://higgsfield.ai/blog/higgsfield-pricing-explained; https://higgsfield.ai/creator-hub/help-center/credits-and-usage/how-credits-work; https://higgsfield.ai/creator-hub/help-center/credits/how-credits-work; https://higgsfield.ai/creator-hub/help-center/credits-and-usage/how-credit-packs-work; https://higgsfield.ai/creator-hub/help-center/credits-and-usage/how-does-auto-refill-work; https://higgsfield.ai/creator-hub/help-center/credits/top-up-credits-expire; https://higgsfield.ai/creator-hub/help-center/credits-and-usage/how-does-concurrency-boost-work; https://higgsfield.ai/creator-hub/help-center/credits/what-are-unlimited-models-and-which-plans-include-them; https://higgsfield.ai/blog/higgsfield-all-unlimited-explained; https://higgsfield.ai/creator-hub/help-center/plans/how-do-higgsfield-plans-work; https://higgsfield.ai/creator-hub/help-center/refunds/how-do-i-request-a-refund; https://higgsfield.ai/enterprise-help-center/manage-account/buy-credits; https://higgsfield.ai/blog/higgsfield-api; https://higgsfield.ai/higgsfield-api; https://stripe.com/newsroom/news/higgsfield-and-stripe; https://stripe.com/customers/higgsfield; https://thenextweb.com/news/higgsfield-series-b-400m-5-4bn-valuation-700m-revenue; https://www.unite.ai/higgsfield-secures-fresh-series-b-capital-from-tcv-and-nvidia/"
retrieved: 2026-10-28
confidence: 0.8
applies_to: [ORV-131]
license: link-only
---

## Evidence

Every page was read on 2026-10-28 through a fetch tool that returns page text and quotes of at most about 125 characters; no page was opened in a browser. The pricing page itself (higgsfield.ai/pricing) returned only its metadata to the fetch tool, so plan prices come from the company's blog post "Higgsfield pricing explained" (datePublished 2026-10-24). Confidence 0.8: the credit rules come from Higgsfield's help center and blog (one source, several pages that agree with each other), and the prices per credit are our arithmetic. The Stripe facts come from Stripe's own marketing pages. The revenue figures are company-reported and do not carry the 0.8. Related entries: [[K-0046-higgsfield-own-models-plus-resold-third-party-models]] (what Higgsfield sells) and [[K-0045-wireflow-third-party-models-in-a-hosted-node-graph]].

> Subscription credits reset regularly and don't roll over.

> Subscription credits are always spent first.

(help center, how credits work)

> Credit Pack credits are valid for 90 days from purchase and stay available even if you cancel your subscription.

(help center, how credit packs work)

> The API is a standalone product with its own dollar balance.

(blog, Higgsfield API, 2026-09-16)

### Plans and price per credit (tiered)

Price and credits are from the blog of 2026-10-24, which states monthly prices only ("You can pay monthly or annually" with no annual prices). The price per credit is our arithmetic unless marked.

- **Free:** $0, 0 credits.
- **Starter:** $15 a month, 200 credits; $15 / 200 = $0.075 a credit.
- **Plus:** $49 a month, 1,000 credits; $49 / 1,000 = $0.049 a credit. The blog itself states "≈$0.049 per credit" for Plus.
- **Ultra:** $129 a month, 3,000 credits; $129 / 3,000 = $0.043 a credit.
- **Team:** $79 a seat a month, 1,000 credits a seat (2 to 9 members); $0.079 a credit.
- **Scale:** $215 a seat a month, 2,500 credits a seat (5 to 15 members); $0.086 a credit.
- **Enterprise:** contact sales; the plans help page says Enterprise includes "volume rollover credits".
- **Auto-Refill:** "at a rate of $1 = 18 credits", so $0.0556 a credit (our arithmetic).
- **Reference rate in a company blog:** "approximately $0.10 at the reference rate of 20 credits per $1" (blog, unlimited Nano Banana 2 plans, 2026-09-21), which is $0.05 a credit.
- **Credit Packs:** fixed sizes "100, 200, 500, 1,000, 2,000, 4,000 credits" and adjustable packs "5,000 to 25,000 credits, in 1,000-credit increments"; "Current prices and any active discounts are shown at checkout." No pack price is on the page.

So for individual plans the price per credit falls as the plan grows (Starter $0.075, Plus $0.049, Ultra $0.043), and the per-seat business plans cost more per credit than Plus or Ultra (our arithmetic).

### Rollover, expiry and spending order

- **Subscription credits:** "No. Subscription credits expire at the end of each billing cycle." (how credits work). The enterprise help center: "Unused subscription credits do not roll over; renewal replaces them with a fresh allocation."
- **Credit Pack and Auto-Refill:** "Yes, 90 days from purchase" (how credits work, both paths). Promo credits: "Yes, on the date shown when issued".
- **Packs need a plan:** "No. An active subscription is required to purchase a Credit Pack." (how credit packs work)
- **Order:** "Subscription credits are always spent first." Then "the balance expiring soonest is used first." The packs page adds "whichever balance expires soonest (Credit Pack, promo, or Auto-Refill) is spent first."
- **On cancellation:** "Subscription credits remain usable until the end of the paid period, then expire permanently." and "Credit Pack, Auto-Refill, promo, and Boost credits are not lost when you cancel:" they stay on the free plan, and "Their validity periods keep running as usual:" (top-up credits expire).

### Auto-Refill

- "Auto-Refill is an optional top-up that's off by default: you enable it yourself and can turn it off at any time."
- It tops up "whenever your credits drop below your plan's refill threshold"; the threshold figure is shown in the set-up window.
- "If the automatic charge fails, for example because the card was declined, credits simply aren't added."

### Cost shown, failed generations, refunds

- The cost of a generation "usually shows on **Generate** before you click." (enterprise help center)
- Failed generations: "Usually yes: the refund is automatic and lands within a few minutes." and "Specific models might not refund credits for failed generations." (how credits work)
- Money refunds (refund help page): only within "7 days or as permitted by the law in your jurisdiction", with zero credits used, on the initial purchase; Credit Packs and Auto-Refill charges qualify on the same 7-day, zero-use terms; subscription renewals do not. "A service fee of up to 6% may be deducted from the refund amount."

### Concurrency per plan and paid boosts

- Jobs at once, video and image, from the blog of 2026-10-24: Free 1 and 1, Starter 2 and 4, Plus 6 and 8, Ultra 8 and 8. The blog lists none for Team or Scale. The plans help page gives no numbers: "Higher plans let you run several generations at the same time."
- "Concurrency Boost is a one-time purchase that raises how many generations you can run at the same time", in steps of "+4, +8, +12, or +16 on top of your base limit", with "The maximum additional concurrency is +16 above your base limit." Each pack carries Boost Credits: "Boost Credits are valid for 90 days from purchase". No price is on the page.

### Unlimited and fair use

- "Unlimited model access means generations on specific models don't deduct credits while the access is active." "Mid and top plans include Unlimited models." "Most included models come with 365-day Unlimited access," but "the newest flagship models may have shorter windows (for example, 7 days)." (help center, unlimited models)
- "Unlimited access applies only on higgsfield.ai." A generation made "outside it, including through MCP, CLI, Canvas," always deducts credits.
- "Unlimited generations run in the standard queue," while credit generations use the priority queue, and "During peak traffic hours, generation speed and concurrency on Unlimited may temporarily vary."
- "Unlimited is designed for personal, human use only." "Automation tools, scripting, credential sharing, and reselling access are strictly prohibited." Access may be paused for manual review when use looks unusual.
- The blog of 2026-07-22 says the offer "lasts 1 to 7 days depending on how you get it" and "Starter and Basic do not include the offer."
- K-0046 records a refund episode tied to the word "unlimited"; it is not re-read here.

### The API: a separate prepaid dollar balance

- "There is no subscription: you top up a balance, pay per generation at published rates, and spending stops automatically at zero." (blog, Higgsfield API, 2026-09-16)
- "A plan on higgsfield.ai neither grants API access nor changes API pricing."
- "Failed requests are not charged: billing applies only to successful completions."
- The API concurrency limit "increases with the account's top-up volume" (same blog).
- Discounts: the API page says "volume discounts apply automatically as usage grows" and lists no tiers; it shows per-model launch discounts, such as Seedance 2.5 at "$0.144 / sec" against an original "$0.2057" (30% off) and Kling 3.0 at "$0.042 / sec" against "$0.084" (50% off). No minimum top-up is stated on either page.

### Stripe

- Stripe's newsroom (dated 20 January 2026) says Higgsfield uses Stripe Billing for subscriptions and trials, Stripe Tax, Stripe Radar and Stripe Connect for a creator marketplace, and that Link carries over 40% of its transactions.
- Stripe's customer story says: "Higgsfield selected Stripe as its billing and payments provider in March 2025." It names Payments, Elements, Link, Billing, Radar and Checkout.
- Higgsfield's own help pages read here name no payment processor.

### Company-reported revenue run rate

These figures are company-reported, through Stripe's marketing pages or the press, and are not grounds for a decision.

- Stripe's newsroom (20 January 2026) reports a projected annual revenue run rate that went from $100M to $200M in about two months. The customer story headline: "Higgsfield AI exceeds $200M run rate in 9 months since launching on Stripe."
- The Next Web (2026-08-17): "Higgsfield says its annualised revenue reached $700mn this month." and "Read that carefully, because it is a run rate rather than booked annual revenue."
- Unite.AI (2026-10-23): "The company said it crossed $1 billion in annualized revenue in September 2026, eighteen months after launch."

### Conflicts between sources

- **Unlimited windows:** the help center says most included models get 365-day access and flagship models shorter windows such as 7 days; the blog of 2026-07-22 says the offer lasts 1 to 7 days and, in the fetch tool's paraphrase, that plans above the entry tier also include a separate 365-day unlimited set. The blog names a "Basic" plan that the blog of 2026-10-24 does not list.
- **Refund of failed work:** the app "Usually" refunds failed generations and "Specific models might not"; the API "Failed requests are not charged". The two pages describe different products and do not conflict, but the app gives no list of the models that do not refund.
- **Price per credit:** the company quotes three different rates in its own pages (Plus ≈$0.049, Auto-Refill $1 = 18 credits, a blog reference rate of 20 credits per $1). Our arithmetic gives a fourth to sixth for Starter, Ultra and the business plans. These are different products, not errors, but no single price per credit exists.

### Claims that did not re-check

These carry no confidence and are not grounds for a decision.

- Third-party pricing guides found by search list other plan names and prices (for example Starter at about $19 a month on annual billing for 270 credits, Plus at $59 monthly for 1,200, Ultra at $129 for 3,000; or Basic, Pro, Ultimate and Creator plans). None was fetched, and Higgsfield's blog of 2026-10-24 gives different figures.
- A search summary gave a fixed spending order (subscription, then Credit Pack, then promo, then Auto-Refill last). Both help center paths fetched say subscription first and then soonest expiring.
- A search summary said a help page lists Credit Packs as non-refundable. The refund page fetched says Credit Packs are refundable within 7 days with zero credits used.
- Third-party blogs say the API needs a $5 minimum top-up and that API funds expire after one year; another says API calls draw from the app credit balance. None was fetched; Higgsfield's own API blog says the API has its own dollar balance.
- A Higgsfield-hosted page on geo.higgsfield.ai that a search said names Stripe returned 404.

## Unknowns

- Credit Pack and Concurrency Boost prices, and annual plan prices.
- Whether MCP and CLI use from a plan draws on app credits or the API balance; the help center says such use "always deducts credits".
- What Higgsfield pays model vendors (see K-0086), and what share of credits expire unused.

## Why it matters for ORIVILO

ORV-131 asks how platforms that resell third-party models charge for them. Higgsfield's app uses tiered, expiring subscription credits with a fixed spending order, paid add-ons for packs, refills and concurrency, and an "Unlimited" offer bounded by fair use; its API is a separate prepaid dollar wallet. This entry records the model; it makes no decision on ORIVILO's own pricing.
