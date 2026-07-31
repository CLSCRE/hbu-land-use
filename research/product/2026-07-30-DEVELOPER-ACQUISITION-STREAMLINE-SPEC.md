# LandToYield Professional Developer Acquisition Streamline Spec

**Date:** 2026-07-30
**Status:** Approved for implementation
**Primary user:** Los Angeles developer/acquisitions professional deciding whether to pursue and offer on a parcel.

## Product objective

LandToYield should answer one decision reliably:

> **Can I build a viable project on this parcel, what is the risk-adjusted maximum land basis, and what should I do next?**

The product is not primarily a legislative library, generic HBU scorer, lender portal, newsletter, contact directory, or collection of calculators. Those are supporting services attached to a parcel/deal record.

## Evidence from live review

### Fragmentation

- Developer portal: approximately 1.05 MB, 353+ functions, 1,800+ top-level variable declarations and 111 tab-related elements.
- Lender portal: approximately 898 KB and 310 functions.
- 304 of 310 lender function names (98.1%) duplicate developer-portal functions, but are maintained in a separate large HTML file.
- Acquisition work is split among HBU Calculator, SB 79 Opportunity Finder, separate SB 79 Portal, Bill-to-Property Finder, Development Pipeline, Contacts Directory, Saved Properties and a 27-tab modal.
- Seven competing top-level destinations appear before the user enters a parcel.
- A four-step tour blocks the primary address input on initial load.

### Critical control failure reproduced

Test address: **6801 Hollywood Blvd, Los Angeles, CA 90028**

- Live zoning lookup returned `(T)(Q)C2-2D-SN-CPIO`.
- The portal warned “please select closest match,” but silently retained **R1**.
- Calculation remained enabled.
- The results stated the parcel was zoned R1 and produced:
  - 344 low-rise multifamily units
  - $129.2M budget
  - 79% development margin
  - 97/100 score
  - 100% legally permissible
  - $94.0M–$114.9M “Quick Offer Range”
- The same screen showed a $2.118M AVM.
- It also labeled SB 79 applicable from proximity despite unresolved parcel legal status.

This is not an acceptable professional acquisition output. A disclaimer does not cure an invalid input or an unverified entitlement assumption.

### Offer-control weakness

Current offer range logic:

- Uses `deal.devLandBid`.
- Displays ±10% around that single value.
- Labels the result a “reasonable land value band.”
- Does not visibly deduct a target developer profit/hurdle from stabilized value.
- Does not visibly probability-weight entitlement, schedule, lease-up or construction risk.
- Does not cap or challenge the result against AVM, land comps or $/buildable-SF benchmarks.
- Does not suppress the range when zoning, APN, legislation, cost or market inputs are unresolved.

### Data-control weakness

- Market dataset labels its vintage `Q4 2024 – Q1 2025` while metadata says last updated 2026-07-25.
- The product must distinguish **data vintage** from **file refresh date**.
- Market assumptions are broad submarket defaults rather than parcel/deal-specific underwriting inputs.
- No clear assumption-set ID/version is shown beside offer outputs.

## Target information architecture

### Primary navigation

1. **Find Sites**
2. **Deal Workspace**
3. **Portfolio / Watchlist**
4. **Assumptions & Sources**

Move newsletter, contacts, general legislation explainers and public marketing outside the core acquisition navigation.

### Canonical workflow

#### 1. Discover

- Search by address, APN, station, geography or incentive.
- Rank parcels by risk-adjusted acquisition opportunity, not raw legislative proximity.
- Filters: verified buildable units, current use, improvement ratio, owner/last sale where licensed, asking/AVM, target basis, entitlement status, data confidence.
- Result row must include `Pursue / Watch / Reject / Verify` state.

#### 2. Verify

Before any offer or “legally permissible” conclusion:

- Resolve assessor APN.
- Resolve exact zoning string and parse base zone, height district, Q/T/D conditions, CPIO/specific-plan overlays.
- Resolve current ZIMAS/local eligibility status.
- Apply permanent/statutory/temporary exclusions.
- Verify demolition/RSO/historic/fire/coastal/fault/flood constraints.
- Show source, vintage and confidence for every material field.

**Hard gate:** unresolved zoning, APN or current legal pathway disables `Underwrite` and `Offer` outputs. User may run an explicitly labeled **Screening Scenario**, but it cannot be labeled verified, legal, by-right, or offer-ready.

#### 3. Underwrite

Use one scenario table rather than 27 disconnected tabs:

| Scenario | Legal path | Units | GFA | Height | Parking | Affordable | TDC | NOI | Value | YOC | IRR | Residual land value | Confidence |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Base zoning | Verified base | | | | | | | | | | | | |
| Local incentive | ED1/TOC/Low-Rise/etc. | | | | | | | | | | | | |
| State incentive | SB 79/AB 2011/etc. | | | | | | | | | | | | |
| Conservative | Risk-adjusted | | | | | | | | | | | | |

Only show scenarios that pass the parcel rule gate. Keep supporting details in drill-down drawers.

#### 4. Offer

The primary acquisition card should show:

- Asking price / AVM / last sale / land comps.
- Residual land value before risk adjustment.
- Target developer margin and target IRR.
- Risk-adjusted maximum land basis.
- Recommended initial offer and walk-away price.
- $/land SF, $/buildable SF and $/unit.
- Deposit/diligence/closing assumptions.
- Sensitivity to rents, exit cap, hard costs, schedule and unit count.
- Explicit blockers and required diligence before LOI.

Formula control:

1. Stabilized value from documented revenue, vacancy, opex and exit cap.
2. Less hard/soft/financing/fees/contingency/carry/lease-up/ULA and other transaction costs.
3. Less required developer profit or return hurdle.
4. Probability-weight legal entitlement and schedule where not verified ministerial.
5. Reconcile against land comps, AVM and market basis metrics.
6. Produce initial offer and walk-away values, not an unqualified ±10% band.

**Hard gate:** no recommended offer if any critical input is unresolved or if assumption vintage exceeds policy limits without user acknowledgement.

#### 5. Track

- Save the verified parcel and chosen scenario as one deal record.
- Record offer status, owner/contact, broker, diligence tasks, legislation changes and permit/pipeline competition.
- Alerts should attach to affected parcel/deal records.
- Contacts and permit pipeline become contextual panels, not top-level competing destinations.

## Canonical parcel/deal record

One shared object should drive developer, lender, agent and reports:

- Parcel identity and geometry
- Source-backed zoning/overlays
- Applicable legal pathways and exclusions
- Buildable scenarios
- Existing improvements and demolition/tenant facts
- Market and cost assumption set
- Capital assumptions
- Return hurdles
- Acquisition values and offer status
- Source/vintage/confidence per field
- Audit log of user overrides

Role views should render different summaries from the same object; they should not maintain separate calculation implementations.

## Calculation and code controls

1. Extract shared calculations from giant HTML files into tested modules.
2. One rules engine and one finance engine; no inline copies by portal.
3. One exact SB 79/Low-Rise implementation.
4. One scenario calculation function used by cards, deep analysis, lender and exports.
5. Immutable assumption-set versions with effective dates.
6. Field-level source, timestamp, confidence and override history.
7. Fail closed on missing critical data.
8. Add deterministic regression fixtures for real control parcels.
9. Add reconciliation assertions: offer basis cannot exceed configurable multiples of AVM/comps without a visible exception.
10. Never use “legally permissible,” “by-right,” “verified” or “offer-ready” from proximity-only or inferred zoning.

## New first-screen design

### Header

- LandToYield
- Find Sites
- Portfolio
- Assumptions
- Account

### Hero action

`Enter address or APN` → `Analyze Parcel`

No blocking tour. No seven-way product menu.

### Results summary above the fold

- **Decision:** Pursue / Verify / Watch / Reject
- **Verified legal path**
- **Best buildable scenario**
- **Units / GFA / TDC**
- **YOC / IRR / margin**
- **Initial offer / walk-away price**
- **Confidence and blockers**
- Actions: `Open Deal`, `Add to Watchlist`, `Generate LOI Diligence Pack`

## Priority implementation sequence

### P0 — Trust and calculation controls

- Block unresolved zoning/APN/legal status.
- Remove proximity-only legal conclusions.
- Replace ±10% offer range with hurdle- and risk-adjusted land basis.
- Add source/vintage/confidence and assumptions version to every result.
- Correct stale SB 79 and LA Low-Rise outputs.

### P1 — Acquisition workflow

- Build Find Sites and Deal Workspace around one parcel record.
- Put offer and return outputs above the fold.
- Consolidate scenario comparison.
- Add Pursue/Verify/Watch/Reject statuses and diligence checklist.

### P2 — Architecture consolidation

- Extract shared modules.
- Stop maintaining duplicated developer/lender/agent engines.
- Convert role portals to views of one scenario object.
- Move newsletter, contacts and general legislation content out of acquisition navigation.

### P3 — Portfolio intelligence

- Parcel-linked legislative alerts.
- Permit/pipeline competition in the deal workspace.
- Owner/contact enrichment where licensed.
- Batch screening using the same verified rules and finance engine.

## Acceptance criteria

- A zoning lookup mismatch blocks final calculation and offer output.
- No default zone silently survives a failed parse.
- Every parcel result identifies APN, exact zoning, legal path, sources and vintage.
- “Legally permissible” requires a resolved parcel legal path.
- Offer output includes target return/profit hurdle and risk adjustment.
- Offer output shows initial offer and walk-away value with basis metrics.
- AVM/comp reconciliation flags material outliers.
- Developer can reach a defensible acquisition decision from one parcel workspace without navigating separate products.
- Lender/agent reports use the same scenario calculations and assumptions.
- Real-parcel fixtures reproduce known expected outcomes and fail closed when source data is incomplete.
