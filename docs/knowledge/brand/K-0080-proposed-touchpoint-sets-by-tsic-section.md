---
id: K-0080
topic: brand
claim: Lead, not grounds for a decision - from the touchpoints counted in K-0077 to K-0079, a set of up to four touchpoints for the first mockup round and one product screen sample can be proposed for each of the 18 brand-relevant TSIC 2009 sections; the evidence is thin for B, L and S and mixed within C, N and R.
source: "docs/knowledge/brand/K-0077-touchpoints-seen-tsic-sections-a-to-f.md; docs/knowledge/brand/K-0078-touchpoints-seen-tsic-sections-g-to-l.md; docs/knowledge/brand/K-0079-touchpoints-seen-tsic-sections-m-to-s.md; docs/knowledge/brand/K-0070-mood-carried-by-applications-in-context.md; docs/adr/0018-image-generation-provider.md; docs/specs/ORV-126/spec.md"
retrieved: 2026-10-26
confidence: 0.6
applies_to: [ORV-126, ORV-127]
license: own-words
---

## Evidence

This entry is inference, written by the researcher from our own counts in [[K-0077-touchpoints-seen-tsic-sections-a-to-f]], [[K-0078-touchpoints-seen-tsic-sections-g-to-l]] and [[K-0079-touchpoints-seen-tsic-sections-m-to-s]]. No source states a touchpoint set per industry section, so nothing here is quoted. Confidence is 0.6: the counts behind it come from two to five non-random pages per section, and the order is a rule we chose, not one we found. It is a lead for the designer and the owner; who decides the map is the `touchpoints` story (ADR 0018 decision 3, ORV-126 spec layer 3).

The frame it fits (fact, from the repo): ADR 0018 draws mockups in rounds of up to four touchpoints, one image request each, and a larger set takes more rounds. The ORV-126 spec (open question "Which product screen samples") asks this research for one product screen per business type, and a second only where the customer uses a digital product.

## How the proposal was made (inference)

1. Take the touchpoints counted for the section and rank them by how many pages named them.
2. Break a tie by which the customer meets first (outside the business before inside, the object handed over before the paperwork).
3. Prefer a flat or simple object a single mockup image can show (a sign, a bag, a card) over a whole interior.
4. Keep a touchpoint seen on one page only when the section has nothing better; mark it "(1)".
5. The product screen sample is the screen the pages show where one was seen; where none was, the business's website home page, marked "not seen".

Numbers in brackets are how many pages named the touchpoint in K-0077 to K-0079.

## All 18 sections, top-down (inference)

TSIC 2009 section letters and names follow ISIC Rev.4 ([[K-0048-tsic-2009-is-isic-rev4-based-at-five-digits]]); O, T and U are left out because they build no brands. "Round 1" is the proposed order of up to four; "later" lists the next candidates for a second round.

- **A, Agriculture, forestry and fishing.** Evidence: three farm pages. Round 1: farm sign (3), product label or sticker on packaging (3, packaging of any kind), paper bag or produce box (1), work clothing (1). Later: business card, menu board or shelf display. Screen: website home page (1).
- **B, Mining and quarrying.** Evidence: thin, three weak pages. Round 1: site entrance sign (2), haul truck or equipment livery (2), hard hat and high-visibility vest (1), report or corporate document cover (1). Later: advertising. Screen: corporate website home page, not seen.
- **C, Manufacturing.** Evidence: four pages, split between consumer and industrial makers. Round 1: product packaging, or the product itself for an industrial maker (3), trade show booth (2), catalogue or brochure cover (2), trade advertisement (1). Screen: website product page (2). A later split by division (consumer goods against industrial goods) would fit better than one set.
- **D, Electricity, gas, steam and air conditioning supply.** Evidence: four pages, mostly solar firms that may be section F. Round 1: work clothing (3), service van (2), letterhead and business card (2), billboard (1). Later: building sign, lanyard. Screen: customer app home screen (1, Evolta's app listing and icon).
- **E, Water supply; sewerage, waste management and remediation.** Evidence: two pages that agree on all four. Round 1: collection truck (2), bin or container (2), work clothing (2), depot building or gate sign (2). Screen: collection or service booking page, not seen.
- **F, Construction.** Evidence: two pages. Round 1: site hoarding or job site sign (2), vehicle livery (2), hard hat and equipment (2), tender or presentation document cover (2). Later: office wall graphics. Screen: website project gallery (1).
- **G, Wholesale and retail trade; repair of motor vehicles and motorcycles.** Evidence: four pages, retail only. Round 1: shopping bag (4), storefront sign (3), price or hang tag (3), window graphic (3). Later: shipping box and tape, gift card, staff uniform. Screen: e-commerce product page (1).
- **H, Transportation and storage.** Evidence: three pages and a student brief. Round 1: vehicle livery (2), parcel satchel or box (2), outdoor advertisement such as a billboard or lightbox (1), staff uniform (student brief only). Later: ticket or boarding pass. Screen: parcel tracking app screen (1).
- **I, Accommodation and food service activities.** Evidence: four pages. Round 1: exterior sign (3), menu (3), staff uniform (2), then takeaway packaging for a restaurant (1) or a room card or door hanger for a hotel (2). Later: business card, merchandise. Screen: ordering or booking website home page (2).
- **J, Information and communication.** Evidence: four pages, software and online services only. Round 1: icon set and illustration sheet (3), web landing page on a laptop (2), a phone in a hand showing the app (2), billboard (1). Screen: app home screen (2); a second screen fits here, since the customer uses the product.
- **K, Financial and insurance activities.** Evidence: three pages, banks and a wallet. Round 1: branch exterior sign (2), payment card (1), ATM (1), app icon or splash screen (3); the app icon goes last, against rule 1, because the screen sample already shows the app. Screen: mobile banking app home screen (3); a second screen fits here.
- **L, Real estate activities.** Evidence: thin, two estate agents. Round 1: business card (2), for-sale board (1), vehicle signage (1), A-frame or directional sign (1). Later: property brochure. Screen: property listing page (1).
- **M, Professional, scientific and technical activities.** Evidence: three pages. Round 1: business card and letterhead (3), proposal or report cover (2), reception wall sign (2), notebook or tote (1). Screen: firm website home page (2).
- **N, Administrative and support service activities.** Evidence: four pages, mixed. Round 1: service vehicle (3), staff uniform (2), business card (2), ID badge (1). Later: signage, hard hat. Screen: website home page with a quote or booking form (3). A travel agency fits this set badly; its page showed photography, stationery and merchandise.
- **P, Education.** Evidence: two school pages. Round 1: prospectus cover (2), school sign (2), uniform (1), banner or bus advertisement (2). Later: digital signage, stationery. Screen: school website home page (2).
- **Q, Human health and social work activities.** Evidence: three pages, a hospital group and two dental clinics. Round 1: exterior sign (3), business or appointment card (2), staff uniform or scrubs (1), interior wayfinding sign (1). Later: social media tile. Screen: appointment booking page on the website (2).
- **R, Arts, entertainment and recreation.** Evidence: five pages, mixed. Round 1: venue or event sign (5), poster (1), ticket or wristband (1), merchandise t-shirt (1). Later: interior wall graphic, programme. Screen: ticket or class booking app screen (2). For a gym, the app screen and interior may matter more than a poster and a ticket.
- **S, Other service activities.** Evidence: thin, one case study and one advice article. Round 1: storefront sign (2), staff uniform (2), loyalty or service card (2), flyer (2). Later: retail product label. Screen: booking website home page (2).

## Where evidence is thin

- B (no mining company's own guideline read), L (two estate agents only) and S (one real case) are the weakest and should be checked first.
- Within sections, these parts were not read at all: commodity farming and fishing (A), wholesale and motor vehicle repair (G), bus, rail and warehousing (H), publishing, broadcasting and telecoms (J), insurance (K), property developers (L), universities (P), social work (Q), membership organisations and repair (S).
- C, N and R each hold two kinds of business whose touchpoints differ; a set chosen at the division level would fit them better than one per section.

## Why it matters for ORIVILO

The `touchpoints` story needs a deterministic map from TSIC section to an ordered set before it can draw mockups, and ADR 0018's rounds of four make the first four the ones a person sees first. This entry gives a starting map for all 18 sections at once, as the owner asked (top-down), with the weak sections named. At 0.6 it may not ground the decision; the designer or the owner accepts, changes or rejects it.
