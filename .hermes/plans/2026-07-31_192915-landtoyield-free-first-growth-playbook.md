# LandToYield Free-First Growth and Product Simplification Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Turn LandToYield into a focused parcel-screening product that developers and land-use attorneys can understand, trust, discover, and try, then extract a reusable launch system for Trevor's future ventures.

**Architecture:** Separate the public acquisition site from the working application. The public site answers audience-specific questions and drives one primary action. The application follows one workflow: Discover -> Verify -> Underwrite -> Offer -> Track, with advanced features progressively disclosed instead of presented as dozens of equal buttons.

**Tech stack:** Existing static HTML/JavaScript site on Vercel, Plausible analytics, Google Search Console, Bing Webmaster Tools, LinkedIn, YouTube, Legislative Edge, schema.org JSON-LD, sitemap/robots/llms.txt, and the existing Legislative Stacker research system.

---

## 1. Executive decision

LandToYield currently demonstrates breadth, but the public promise and the app both expose too much at once. The live homepage asks visitors to choose among agent, developer, and lender portals, then presents multiple CTAs, a long animated product demonstration, pricing, and many feature claims. The working portals contain roughly 100+ buttons each and multiple H1s. This creates choice overload and makes the product appear less controlled than the underlying intelligence warrants.

The new center of gravity should be:

> **Screen an LA parcel for development potential, document what is known, and identify what must be verified before money or legal conclusions are put at risk.**

Primary CTA: **Analyze a Parcel**
Secondary CTA: **Get the LA Development Brief**
Attorney CTA: **Use or Partner With LandToYield**

LandToYield should complement land-use attorneys, not imply that software replaces legal judgment. The positioning line should stay close to:

> LandToYield creates the shortlist, rough development envelope, and preliminary economics. A qualified land-use attorney verifies developability, entitlement strategy, overlays, and legal conclusions.

## 2. Current evidence and gaps

### Public-site evidence

- Homepage title is only `Land to Yield`; it lacks a descriptive search phrase.
- Homepage has one SoftwareApplication schema block, but the other public pages have no schema.
- No local page has a canonical tag.
- `app.html`, `lender.html`, and `agent.html` contain approximately 115, 102, and 104 buttons respectively.
- Those same portals contain multiple H1 elements.
- The live sitemap lists only four URLs and still carries `2026-02-26` last-modified dates.
- Important public pages such as `sb79.html`, `newsletter.html`, and `bill-finder.html` are absent from the sitemap.
- `llms.txt` is absent.
- Live copy alternates between “LA County” coverage and “City of Los Angeles” coverage.
- The homepage makes broad instant-data and legal-output claims that must be reconciled with the product's fail-closed verification controls.
- Search results currently surface the homepage and application portals, but there is no visible topic-cluster footprint.

### Strategic implication

Do not start with hundreds of generic city or bill pages. First establish a small set of authoritative, source-backed pages that match real developer and attorney questions. Each page must state coverage, source date, confidence, and what still requires professional verification.

## 3. Audience and job-to-be-done map

### A. Small and midsize developers

**Moment:** Evaluating an address, APN, listing, or off-market parcel.
**Question:** “Is this worth spending time and diligence money on?”
**Desired outcome:** A ranked screen, preliminary envelope, rough economics, fatal flags, and next diligence steps.
**Conversion:** Free parcel screen -> emailed summary -> financing conversation or paid analysis.

### B. Land-use attorneys

**Moment:** Early client intake, acquisition diligence, or legislative-change triage.
**Question:** “Can I get to the important issues faster without adopting unsupported software conclusions?”
**Desired outcome:** Source-linked parcel facts, explicit unresolved issues, dated legal pathways, and a clean client-facing screening appendix.
**Conversion:** Attorney beta group -> co-designed verification report -> referrals/co-branded work product/paid professional plan.

### C. Capital partners and brokers

Keep as secondary audiences. They can use the same canonical parcel and underwriting case with role-specific views. Do not maintain three competing acquisition funnels on the homepage.

## 4. Product simplification strategy

### Public navigation

Keep only:

1. **Analyze a Parcel**
2. **For Developers**
3. **For Attorneys**
4. **Insights**
5. **Sign In**

Remove pricing, role portals, newsletters, tools, and feature demos as equal top-level choices. Pricing belongs after the visitor understands the outcome.

### App navigation

Use one persistent workflow:

1. **Discover** — address/APN input and opportunity queue
2. **Verify** — APN, exact zoning, source date, overlays, blockers
3. **Underwrite** — development assumptions and sensitivity
4. **Offer** — controlled initial offer and walk-away analysis
5. **Track** — saved case, diligence tasks, contacts, and status

Rules:

- One primary button per screen.
- Maximum one secondary action near the primary action.
- Put specialist tools in an **Advanced** drawer or contextual menu.
- Replace duplicated developer/lender/agent applications over time with role-based views of the same Parcel -> Opportunity -> Underwriting Case -> Deal record.
- Never hide a legal or data blocker merely to simplify the UI.

## 5. Search, answer-engine, and generative-engine architecture

### Core commercial pages

1. `/` — Los Angeles parcel feasibility and highest-and-best-use screening
2. `/developers/` — acquisition screening for LA developers
3. `/land-use-attorneys/` — source-backed parcel screening for attorneys
4. `/pricing/` — simple free/pilot/pro plans after the offer is proven
5. `/about-methodology/` — sources, confidence, limitations, and review process

### Tool landing pages

1. `/tools/los-angeles-parcel-feasibility/`
2. `/tools/sb-79-parcel-screening/`
3. `/tools/sb-1123-lot-screening/`
4. `/tools/measure-ula-calculator/`
5. `/tools/legislation-stacker/`

Each tool page should explain the decision it supports before embedding or linking to the application.

### Initial source-backed guide cluster

1. “How to evaluate an LA development parcel before making an offer”
2. “What ZIMAS tells you, and what it does not”
3. “SB 79 in Los Angeles: statewide law versus local implementation”
4. “SB 1123 lot screening: minimum facts to verify”
5. “Measure ULA cliff underwriting for development exits”
6. “Developer parcel due-diligence checklist”
7. “Land-use attorney intake checklist for development sites”
8. “How developers and land-use attorneys can divide early diligence”

### Answer-engine page standard

Every guide/tool landing page should contain:

- A 40–70 word direct answer immediately below the H1.
- A “What this means for a developer” section.
- A “What an attorney must verify” section.
- A dated primary-source table with publisher, source, effective/as-of date, and link.
- A concise checklist.
- A real worked example with assumptions clearly labeled.
- FAQs derived from actual user questions, not keyword stuffing.
- Author, reviewer where available, last reviewed date, and limitations.
- Article, FAQPage where appropriate, BreadcrumbList, Organization, and SoftwareApplication schema.
- Canonical URL, descriptive title, meta description, OG/Twitter fields, and unique image.

### GEO/LLM discoverability

- Publish `/llms.txt` as a concise map of canonical pages and source/limitations policy.
- Make important explanations available as crawlable HTML, not only client-side application state.
- Use stable headings and explicit entity names: LandToYield, City of Los Angeles, ZIMAS, SB 79, SB 1123, Measure ULA.
- Link claims to primary sources and include as-of dates.
- Do not create fake “AI optimization” text or promise inclusion in ChatGPT/Google AI results. Measure referral traffic and citations where observable.

## 6. Free-first distribution system

### Owned channels

- LandToYield site and tools
- Legislative Edge email
- Trevor's LinkedIn profile
- LandToYield LinkedIn company page
- YouTube channel for short screen recordings
- Reusable PDF/checklist lead magnets

### Weekly solo-operator cadence

Create one authoritative source asset each week, then repurpose it into:

1. One website article or tool update
2. One email/newsletter section
3. Three LinkedIn posts:
   - direct answer/explanation
   - annotated parcel or map example
   - opinion/lesson for developers or attorneys
4. One 60–120 second screen-recording video
5. Three to five FAQ answers added to the relevant canonical page

The Legislative Stacker remains the research source of truth. Content is downstream of verified research, not a second legal database.

### Community-led attorney acquisition

- Recruit a 10-person “LandToYield Attorney Council.”
- Offer free beta access in exchange for workflow feedback, not endorsements.
- Publish interviews or short Q&As with permission.
- Offer co-branded parcel-screening appendices while making attorney verification explicit.
- Create an attorney referral directory only after participation and consent.
- Pitch practical demonstrations to local bar sections, ULI, NAIOP, Bisnow communities, and developer meetups.

### Developer acquisition

- Use public planning/permit signals and existing ED-1 monitoring to identify active developers.
- Offer a useful parcel screen or legislative checklist before asking for a meeting.
- Build case studies around decisions and diligence saved, not inflated “units unlocked” claims.
- Never auto-contact developers without approval.

## 7. Cookie-cutter venture launch system

Every future Trevor venture should receive the same minimum launch pack:

1. **Positioning sheet** — audience, painful moment, one promised outcome, one CTA
2. **Five-page website** — home, audience page, proof/method, insights, contact
3. **Trust pack** — author/about, methodology, sources, privacy, terms, limitations
4. **Search pack** — Search Console, Bing Webmaster, sitemap, robots, canonicals, schema, analytics
5. **Content engine** — one weekly source asset repurposed into article/email/social/video
6. **Lead magnet** — checklist, calculator, template, or diagnostic tied to the product
7. **Measurement dashboard** — impressions, non-brand clicks, engaged visits, tool starts, completions, emails, qualified conversations

Do not create separate social accounts for every experiment immediately. Use Trevor's personal LinkedIn as the initial distribution hub; create a company channel only when there is recurring content and a clear product identity.

## 8. Budget ladder

### Stage 0: $0–$100/month

- Search Console and Bing Webmaster Tools
- Plausible already installed; retain unless a clear need justifies GA4/GTM
- LinkedIn personal distribution
- YouTube screen recordings using existing equipment/software
- Legislative Edge
- Free public data and primary sources
- Vercel/GitHub existing infrastructure
- Canva or existing design tools

Do not buy SEO tools, directories, backlinks, or broad paid social at this stage.

### Stage 1: $300–$500/month

Use only after a page/offer converts organically:

- Small retargeting/search tests on one high-intent offer
- Editing/design help for the best-performing source asset
- Limited webinar/event sponsorship with a developer or attorney audience

### Stage 2: $1,000+/month

Use only when qualified-conversation and customer economics are known:

- High-intent Google Search campaigns
- Sponsored niche newsletters/events
- Professional demo/case-study production
- Partnerships and referral programs

## 9. Measurement model

### Product events

- `parcel_lookup_started`
- `parcel_lookup_resolved`
- `parcel_lookup_blocked`
- `verification_step_viewed`
- `underwriting_started`
- `report_exported`
- `email_report_requested`
- `financing_help_requested`
- `attorney_beta_requested`

### Acquisition events

- organic landing page
- guide -> tool click
- LinkedIn -> site visit
- YouTube -> tool visit
- newsletter signup
- qualified developer conversation
- qualified attorney conversation

### 90-day success standard

Prioritize evidence of intent over vanity traffic:

- Search engines index all canonical commercial/tool/guide pages.
- At least five non-brand queries generate impressions for each target audience.
- Visitors complete parcel screens rather than merely opening the app.
- Developers and attorneys request follow-up conversations.
- At least three published case studies or worked examples show the real verification workflow.

## 10. Four-sprint implementation sequence

### Sprint 1: Measurement, truth, and information architecture

**Files:**
- Modify: `index.html`
- Modify: `sitemap.xml`
- Modify: `robots.txt`
- Create: `llms.txt`
- Create: `growth/positioning-and-message-map.md`
- Create: `tests/seo-foundation.test.js`

**Tasks:**

1. Inventory every public claim about coverage, data retrieval, timing, legal certainty, and pricing.
2. Write a failing test for one canonical tag, one H1, required description, schema validity, and source/limitations link on every indexable page.
3. Reconcile “LA County” versus “City of Los Angeles” claims.
4. Define indexable versus `noindex` application/utility pages.
5. Expand the sitemap to canonical public pages with accurate last-modified dates.
6. Add `llms.txt` and validate that it references only canonical public pages.
7. Define the event dictionary and verify Plausible custom-event support before adding another analytics system.

**Verification:**

- Parse every HTML file and enforce title/description/canonical/H1/schema rules.
- Validate sitemap XML.
- Fetch live robots, sitemap, and canonical pages after deployment.
- Confirm no legal-output claim bypasses the product's verification controls.

### Sprint 2: Public-site simplification and audience pages

**Files:**
- Modify: `index.html`
- Create: `developers/index.html`
- Create: `land-use-attorneys/index.html`
- Create: `about-methodology/index.html`
- Create: `assets/site.css`
- Create: `tests/public-conversion-path.test.js`

**Tasks:**

1. Test for one primary CTA and no more than five top-level navigation choices.
2. Replace the three competing role cards with one parcel-analysis CTA and two audience pathways.
3. Move detailed feature demonstrations below the outcome, methodology, and trust sections.
4. Publish the developer page around acquisition screening.
5. Publish the attorney page around source-backed intake and verification.
6. Publish methodology/source/limitations content.
7. Add audience-specific conversion events.

**Verification:**

- Mobile and desktop browser review.
- Keyboard and accessibility checks.
- CTA path reaches the intended tool in one click.
- No pricing CTA appears before the visitor sees the product outcome and limitations.

### Sprint 3: Application progressive disclosure

**Files:**
- Modify: `app.html`
- Modify: `agent.html`
- Modify: `lender.html`
- Modify: `core-acquisition.js`
- Create: `tests/workflow-navigation.test.js`

**Tasks:**

1. Map every button to Discover, Verify, Underwrite, Offer, Track, Advanced, or Remove.
2. Write failing tests requiring one primary action per workflow stage.
3. Introduce the five-stage navigation shell without altering readiness gates.
4. Move specialist finders/calculators into contextual Advanced panels.
5. Route role views to the same canonical case state.
6. Remove duplicated or dead controls only after usage and dependency checks.

**Verification:**

- Existing acquisition, SB 79, stale-state, and UI-wiring tests remain green.
- Real browser tests cover one blocked parcel and one verified parcel.
- Button count drops materially without removing required legal/data controls.

### Sprint 4: Content and distribution launch

**Files:**
- Create: `guides/` page templates
- Create: `tools/` landing-page templates
- Create: `growth/editorial-calendar.md`
- Create: `growth/content-repurposing-template.md`
- Create: `growth/attorney-council-outreach.md`
- Create: `tests/content-schema.test.js`

**Tasks:**

1. Build one reusable source-backed guide template.
2. Publish the first three guides: parcel evaluation, ZIMAS limitations, SB 79 local implementation.
3. Build the developer due-diligence checklist lead magnet.
4. Create four weeks of LinkedIn/email/video derivatives.
5. Prepare Attorney Council outreach for Trevor's approval; do not send automatically.
6. Submit updated sitemap to Google and Bing.

**Verification:**

- Rich-results/schema validation.
- Search Console URL inspection for canonical pages.
- Every article has primary sources, dates, author/reviewer, and limitations.
- Every social post links to one canonical page, not a disconnected campaign URL.

## 11. Risks and controls

- **Legal overclaiming:** Every parcel output is screening until parcel-specific verification is complete.
- **Coverage contradiction:** Public copy must distinguish City of LA coverage from broader LA County aspirations.
- **Programmatic-content dilution:** No mass city/bill pages until the first topic cluster earns impressions and engagement.
- **Solo-founder overload:** One source asset per week; repurpose rather than create five separate content streams.
- **Social sprawl:** Trevor's LinkedIn first; do not maintain empty accounts on every network.
- **Premature paid acquisition:** No ads until a specific organic landing page and CTA demonstrate conversion.
- **Attorney alienation:** Position LandToYield as an intake and diligence accelerator, not a substitute for counsel.
- **SEO vanity metrics:** Optimize for completed analyses and qualified conversations, not raw pageviews.

## 12. Immediate first sprint deliverables

Before changing the crowded application UI, ship this sequence:

1. Truth-and-coverage claim inventory.
2. Simplified public navigation and one primary CTA design.
3. Developer and land-use attorney page copy.
4. Updated sitemap, canonicals, schema, and `llms.txt`.
5. Analytics event dictionary.
6. First guide: “How to evaluate an LA development parcel before making an offer.”
7. Four-week repurposing calendar.

The application-button redesign should begin after Trevor provides the additional workflow details, but the public acquisition and search foundation can proceed independently.
