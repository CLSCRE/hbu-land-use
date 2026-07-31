# LandToYield SB 79 / Los Angeles Low-Rise Live Audit

**Audit date:** 2026-07-30
**Scope:** Confirm whether the live LandToYield website uses Los Angeles Ordinances 188967 and 188968, the Sean Lahijani APN workbooks, and the correct parcel-level development constraints.
**Result:** **Partial implementation. The APN data was ingested exactly, but Low-Rise yield calculation and final-rule reconciliation are incomplete.**

## Executive conclusion

LandToYield correctly imported the Sean Lahijani May 2026 parcel control set:

- Full phased APN workbook: **139,450 unique APNs**
- Live website APN records: **139,450**
- APN-set differences: **0**
- Source-row-hash mismatches: **0**
- Sean `SB79_Available_HBU_Sites_2026-05-05.xlsx`: **13,585 APNs**
- Website `p=e` / study-ready records: **13,585**
- Available-set differences: **0**

However, the live product does **not** yet calculate Los Angeles Low-Rise Incentive Area yield. For a real flagged record, the `low_rise_retained` scenario returns `envelope: null`, with no units, FAR, height, parking, affordability or performance-standard calculation.

The main app also continues to use coordinate-only SB 79 detection that marks a parcel eligible based on distance to a station, without first resolving the parcel against the City/ZIMAS APN status and temporary/permanent exemptions.

## Primary sources verified

1. Los Angeles City Planning SB 79 page:
   https://planning.lacity.gov/resources/senate-bill-sb-79
2. Signed Low-Rise Ordinance No. 188967, effective 2026-06-30:
   https://cityclerk.lacity.org/onlinedocs/2025/25-1083-S3_ord_188967_06-30-26.pdf
3. Signed Phased Implementation Ordinance No. 188968, effective 2026-06-30:
   https://cityclerk.lacity.org/onlinedocs/2025/25-1083-S4_ord_188968_06-30-26.pdf
4. Chaptered SB 79 / Government Code §§ 65912.155–65912.162:
   https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260SB79

City Planning states that both ordinances became effective June 30, 2026 and that local SB 79 and Low-Rise eligibility maps are available through ZIMAS.

## What is correctly live

Raw live files match local source byte-for-byte:

- `core-sb79.js`
- `core-geo.js`
- `core-data.js`
- `sb79.html`
- `app.html`
- `lender.html`
- `market-data.json`

Policy metadata correctly references:

- Low-Rise Ordinance **188967**
- Phased Implementation Ordinance **188968**
- Effective date **2026-06-30**
- ZIMAS-first underwriting caveat

The compact website dataset exactly matches the Sean Lahijani May source workbooks.

## Data provenance issue

The live APN source metadata remains:

- Snapshot: **2026-05-05**
- CPC meeting: 2026-05-14
- Determination mailing: 2026-05-19
- Extracted: 2026-05-22

This predates:

- City Council adoption on 2026-06-23
- Signed ordinances/effective date on 2026-06-30
- Final June ordinance maps and live ZIMAS eligibility layer

The website therefore needs a final June/ZIMAS reconciliation and should continue labeling May-derived results as a screening snapshot until that reconciliation is complete.

## Parcel-status test

Website phase counts from the Sean workbook:

| Status | Count |
|---|---:|
| Available to study (`e`) | 13,585 |
| Temporary exemption (`t`) | 121,519 |
| Permanent exclusion (`x`) | 2,718 |
| Statutory exemption (`s`) | 1,628 |
| **Total** | **139,450** |

The APN status import is exact. The issue is calculation after status resolution.

## Low-Rise calculation failure

Test APN: `2010004010`

- Dataset status: temporary hold
- TOD zone: Orange Line – Nordhoff
- Tier/distance: Tier 2 outer half-mile
- Zoning: `A1-1`
- Low-Rise/phased flag: true
- Website Low-Rise scenario: `potentially_available`
- Website Low-Rise envelope: **null**

The website displays a scenario shell but does not calculate the local ordinance result.

### Signed Ordinance 188967 requirements missing from the calculator

The local Low-Rise result must determine the applicable **LR-1 or LR-2** subarea and calculate:

- Unit maximum tied to each LR menu
- FAR tied to unit count
- Story/height cap
- Parking (no minimum in the signed base-incentive table)
- Restricted-affordable-unit requirement
- Opportunity Station / Opportunity Corridor eligibility
- Underlying residential-zone eligibility
- Fire Restriction Area and Coastal exclusions
- Historic/HPOZ/HCM treatment
- Lot consolidation rules
- Multi-bedroom option (+0.5 FAR and one story when conditions are met)
- Half-SB-79 floor/area exception under LAMC 12.22 A.38(g)(3)(iii)(a)
- Setbacks, lot area/width, passageway and lot-coverage standards

Signed Ordinance 188967’s base table includes a Low-Rise ladder from 5 to 16 units, approximately 1.30:1 to 2.90:1 FAR, with LR-1/LR-2 affordability and story rules. The current website has no data model or function for this table.

## Statutory SB 79 calculation inconsistencies

### Correct chaptered state floors

| Location | Height | Density | FAR |
|---|---:|---:|---:|
| Tier 1, adjacent (200 ft intensifier) | 95 ft | 160 du/ac | 4.5 |
| Tier 1, within 1/4 mile | 75 ft | 120 du/ac | 3.5 |
| Tier 1, 1/4–1/2 mile | 65 ft | 100 du/ac | 3.0 |
| Tier 2, adjacent (200 ft intensifier) | 85 ft | 140 du/ac | 4.0 |
| Tier 2, within 1/4 mile | 65 ft | 100 du/ac | 3.0 |
| Tier 2, 1/4–1/2 mile | 55 ft | 80 du/ac | 2.5 |

### Current code conflicts

`core-sb79.js` currently holds correct density/FAR values but incorrectly keeps full adjacent height for inner and outer bands:

- Tier 1 inner/outer both return 95 ft; should be 75/65 ft
- Tier 2 inner/outer both return 85 ft; should be 65/55 ft

`core-geo.js` instead applies a generic `0.68` multiplier to every outer-band metric:

- Tier 1 outer: about 65 ft / 109 du-ac / 3.06 FAR instead of 65 / 100 / 3.0
- Tier 2 outer: about 58 ft / 95 du-ac / 2.72 FAR instead of 55 / 80 / 2.5

`core-data.js` contains additional stale/incorrect narrative claims:

- Describes inner band as receiving full adjacent benefits
- States all projects require 15% affordable units; chaptered SB 79 uses tiered affordability choices and exempts projects of 10 units or fewer from that requirement
- Uses a proximity-only `detectSB79Eligibility()` path

## Main-app eligibility defect

`core-geo.js::detectSB79Eligibility(lat, lon)`:

1. Selects nearest hardcoded station
2. Checks straight-line coordinate distance
3. Returns `eligible: true` for every point within 0.5 mile
4. Does not query the APN shard
5. Does not check ZIMAS/local map status
6. Does not apply temporary/permanent/statutory exclusions
7. Does not distinguish local Low-Rise retention from direct SB 79 application

This path is consumed by `core-data.js`, `app.html`, `lender.html`, and `agent.html`, so a user can receive a positive SB 79 result even when the dedicated APN dataset classifies the property as temporarily exempt or excluded.

## Public-copy issues

- `sb79.html` still contains pre-effective-date countdown/readiness language.
- It makes categorical “permitted use / ministerial / no CEQA” statements without consistently conditioning them on parcel status, local phasing, affordability, demolition, labor and other statutory requirements.
- Some demo/site tables present a statutory envelope without proving current ZIMAS eligibility.

## Required correction sequence

1. **Make APN/ZIMAS resolution the gate** for City of Los Angeles SB 79 results.
2. Reconcile the Sean May workbook against the **final June ordinance maps and current ZIMAS**; preserve source date and diff log.
3. Add `LOW_RISE_POLICY` and a deterministic LR-1/LR-2 calculator from signed Ordinance 188967.
4. Add missing fields needed to choose LR-1/LR-2 and apply local constraints.
5. Replace the generic `heightMult` model with the exact six-cell chaptered SB 79 table.
6. Route `core-data.js`, app, lender and agent results through the same parcel-aware rules engine.
7. Correct affordability, parking, height, density and FAR public copy.
8. Remove stale countdown/readiness copy.
9. Add tests for all six statutory cells, LR-1 and LR-2 unit/FAR ladders, temporary hold, permanent exclusion, statutory exclusion, Opportunity Station eligibility, historic/fire/coastal constraints and ZIMAS-not-confirmed fallback.
10. Deploy and re-fetch raw live files; run real APN acceptance checks against the Sean control set.

## Acceptance criteria

- No City of LA address is labeled SB 79 eligible solely from proximity.
- Every result identifies source: ZIMAS/final map, Sean May snapshot, or coordinate-only screening.
- Temporary/permanent/statutory exclusions block direct SB 79 yield.
- Low-Rise-retained sites return a calculated local envelope rather than `null`.
- The six statutory cells equal the chaptered values in the table above.
- Live/local hashes match after deployment.
- A sample of Sean control APNs returns the expected phase and rule path.

## Files inspected

- `LandtoYield/core-sb79.js`
- `LandtoYield/core-geo.js`
- `LandtoYield/core-data.js`
- `LandtoYield/sb79.html`
- `LandtoYield/app.html`
- `LandtoYield/lender.html`
- `LandtoYield/sb79-data/*`
- `Deals/1. Active/Sean Lahijani/Regulation/APN Lookup/la_sb79_phased_apn_lookup.xlsx`
- `Deals/1. Active/Sean Lahijani/Properties/SB79_Available_HBU_Sites_2026-05-05.xlsx`
- Westwood/Rancho, Wilshire/Fairfax and Culver City workbooks in the Sean Lahijani folder
