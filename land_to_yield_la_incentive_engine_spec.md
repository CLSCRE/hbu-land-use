# Land to Yield — LA Incentive Engine & Scenario Optimizer Spec

This document is a clean implementation plan for a production-grade Los Angeles entitlement, incentive, and development strategy engine designed for sophisticated developers, brokers, architects, land-use consultants, and lenders. The initial release should focus on Los Angeles and should be built so that statewide and city-specific expansion can occur through versioned rules and overlay updates rather than core-application rewrites.[cite:29][cite:43][cite:53]

## Product objective

The product should answer a more valuable question than a standard zoning or yield calculator: **what is the best executable development strategy for this parcel based on entitlement path, incentive stacking, timeline, labor standards, cost structure, financing drag, and target financial outcome?**[cite:29][cite:30][cite:67][cite:71]

The engine should not simply return theoretical maximum unit count. It should compare alternative scenarios and identify the best **risk-adjusted** path based on user priorities such as maximizing stabilized NOI, maximizing IRR, minimizing entitlement risk, minimizing timeline, or minimizing exposure to labor-cost triggers such as prevailing wage.[cite:30][cite:64][cite:67][cite:68]

## Scope of release v1

Release v1 as a Los Angeles-only engine with the following capabilities:[cite:29][cite:43]

1. California State Density Bonus analysis, including bonus eligibility, density increase, incentives/concessions, waivers or reductions of development standards, and parking relief.[cite:30][cite:52][cite:58]
2. Los Angeles Citywide Housing Incentive Program analysis, including the State Density Bonus Program path, AHIP, and MIIP.[cite:29][cite:43][cite:48]
3. Scenario ranking across alternative legal and programmatic paths.[cite:29][cite:43]
4. Cost, timeline, labor-standard, and financing-carry modeling for each scenario.[cite:64][cite:67][cite:68][cite:71]
5. Objective-based optimization, allowing users to prioritize NOI, IRR, timeline, or low-risk execution.[cite:68][cite:71]
6. Explainability and auditability, including rule traces, verification items, overlay provenance, and source versioning.[cite:29][cite:43][cite:53]

Do not implement SB 79 calculations in v1, but design the schema and interfaces so SB 79 Opportunity Station Areas, Low-Rise Incentive Areas, and phased implementation logic can be added as the next module.[cite:3][cite:53]

## Core product principles

The engine should follow these principles:

- **Deterministic rules, explicit uncertainty**: if a result depends on an unconfirmed overlay, unclear factual input, or unresolved legal interpretation, return a partial result with confidence and verification steps instead of guessing.[cite:29][cite:43]
- **Law/config separation**: legal thresholds, local program criteria, parking rules, and map-trigger logic must live in editable versioned configurations or rules tables, not in front-end code.[cite:29][cite:30][cite:58]
- **GIS-first architecture**: parcel-level overlay facts should be abstracted into normalized boolean and measured-distance inputs so mapping providers can change without breaking business logic.[cite:43][cite:53]
- **Scenario-first analysis**: one parcel may support multiple valid strategies, and the product should compare them instead of collapsing them into one opaque answer.[cite:29][cite:48]
- **Economic realism**: more units do not always produce the best project; the optimizer must account for labor-cost triggers, timing, financing carry, and NOI or margin impacts.[cite:64][cite:67][cite:68][cite:71]
- **Paid-user credibility**: every result must be reproducible from source inputs, overlay versions, rule versions, benchmark versions, user overrides, and evaluation timestamp.[cite:29][cite:43][cite:53]

## System architecture

Build the engine in seven layers.[cite:29][cite:43]

### Layer 1: Parcel fact intake

Ingest parcel facts either from manual entry, parcel API, or GIS services. Facts should be stored as raw and derived values with provenance.[cite:43][cite:53]

Required parcel inputs:

- `address`
- `apn`
- `jurisdiction` (default Los Angeles)
- `community_plan_area`
- `base_zone`
- `general_plan_land_use`
- `lot_area_sqft`
- `lot_width_ft`
- `lot_depth_ft`
- `existing_use`
- `existing_units`
- `is_vacant`
- `is_multifamily_existing`
- `is_single_family_zone`
- `is_mixed_use_zone`
- `is_industrial_zone`
- `allows_residential_by_right`
- `is_hillside`
- `is_vhfhz`
- `is_coastal`
- `has_historic_designation`
- `has_hpoz_or_historic_overlay`
- `distance_to_major_transit_stop_ft`
- `distance_to_qualifying_corridor_ft`
- `in_higher_opportunity_area`
- `in_moderate_opportunity_area`
- `in_low_resource_tcac_area`
- `in_sea_level_rise_area`
- `in_chip_miip_area`
- `in_chip_ahip_area`
- placeholder `in_sb79_opportunity_station_area`
- `map_version_ids`
- `data_provenance`

These should be modeled as facts rather than conclusions, because the rules engine needs to preserve how each conclusion was reached.[cite:29][cite:43][cite:53]

### Layer 2: Project program intake

The same parcel should support multiple project assumption sets so users can compare alternative programs.[cite:30][cite:68]

Required project inputs:

- `tenure_type`: rental, for_sale, mixed
- `total_base_units`
- `unit_mix` by bedroom count
- `avg_unit_size`
- `affordability_program_type`: market_rate, mixed_income, one_hundred_percent_affordable, senior, supportive, special_needs
- `very_low_income_units`
- `low_income_units`
- `moderate_income_units`
- `senior_units`
- `manager_units`
- `target_affordable_share_percent`
- `requested_concessions`
- `requested_waivers`
- `desired_parking_ratio`
- `commercial_sqft`
- `is_faith_based_project`
- `is_clt_project`
- `is_public_agency_project`
- `is_congregate_or_special_needs`
- `strategy_mode`: conservative, base_case, maximize_yield

### Layer 3: Legal incentive engine

Implement the legal layer as modular evaluation components:[cite:29][cite:30][cite:43]

- `stateDensityBonusModule`
- `chipStateDensityBonusModule`
- `ahipModule`
- `miipModule`
- `parkingReliefModule`
- `verificationModule`
- `scenarioRanker`
- placeholder `sb79Module`

Each module should return:

- pass/fail
- triggered rules
- blocked rules
- assumptions used
- derived metrics
- unresolved verifications
- warnings
- source references to internal legal rule ids

### Layer 4: Economic and execution model

After legal scenarios are built, evaluate each one economically and operationally.[cite:64][cite:67][cite:68][cite:71]

Modules:

- `costModelModule`
- `laborStandardsModule`
- `timelineRiskModule`
- `financingCarryModule`
- `stabilizedEconomicsModule`
- `objectiveOptimizerModule`
- `sensitivityModule`

This layer is essential because prevailing wage, timeline drag, and deeper affordability can materially change the optimal path even when entitlement yield is higher.[cite:64][cite:67][cite:73]

### Layer 5: Scenario synthesis

Normalize all candidate legal/economic paths into one scenario schema that can be ranked consistently.[cite:29][cite:68]

### Layer 6: Ranking and optimization

Rank scenarios according to user objective, using risk-adjusted logic rather than maximum-unit logic.[cite:68][cite:71]

### Layer 7: Presentation and audit

Provide three presentation modes:[cite:29][cite:43]

- Acquisition quick screen
- Developer detail screen
- Legal and audit trace screen

## Scenario object

Use a single normalized scenario model.

```ts
type DevelopmentScenario = {
  scenario_id: string;
  program_path: string[];
  eligibility_status: "eligible" | "potentially_eligible" | "ineligible";
  confidence_score: number;
  confidence_label: "high" | "medium" | "low";

  base_units: number;
  density_bonus_percent: number | null;
  max_units_estimate: number | null;

  parking_ratio_min: number | null;
  parking_total_min: number | null;
  parking_basis: string | null;
  concessions_possible: number | null;
  waivers_possible: boolean | null;
  review_path: "ministerial" | "administrative" | "director" | "discretionary" | "unknown";

  entitlement_months_p50: number | null;
  entitlement_months_p75: number | null;
  entitlement_months_p90: number | null;
  permit_months_p50: number | null;
  construction_months_p50: number | null;
  leaseup_months_p50: number | null;

  prevailing_wage_required: boolean | null;
  prevailing_wage_trigger_basis: string | null;
  skilled_trained_workforce_required: boolean | null;
  labor_cost_premium_percent_low: number | null;
  labor_cost_premium_percent_base: number | null;
  labor_cost_premium_percent_high: number | null;

  hard_cost_total: number | null;
  soft_cost_total: number | null;
  financing_cost_total: number | null;
  contingency_total: number | null;
  total_development_cost: number | null;

  effective_gross_income_stabilized: number | null;
  operating_expenses_stabilized: number | null;
  net_operating_income_stabilized: number | null;
  stabilized_value: number | null;

  developer_profit: number | null;
  project_irr: number | null;
  equity_multiple: number | null;
  yield_on_cost: number | null;

  execution_risk_score: number | null;
  execution_risk_label: "high" | "medium" | "low" | null;
  composite_score: number | null;

  primary_constraints: string[];
  verification_items: VerificationItem[];
  rule_trace: RuleTraceItem[];
  map_dependencies: MapDependency[];
  source_versions: SourceVersionRef[];
};
```

## Persistence model

Use PostgreSQL with JSONB and PostGIS where available. Separate parcel facts, overlay facts, rules, evaluation runs, and scenario outputs.[cite:29][cite:43][cite:53]

### Core tables

#### `parcels`
Stores normalized parcel facts.

| Column | Type | Notes |
|---|---|---|
| `parcel_id` | UUID PK | Internal parcel record id |
| `address` | text | Canonicalized address |
| `apn` | text | Parcel number |
| `jurisdiction` | text | Default Los Angeles |
| `facts_json` | jsonb | Canonical parcel fact bundle |
| `source_bundle_id` | UUID | Links source provenance |
| `created_at` | timestamptz | Audit field |
| `updated_at` | timestamptz | Audit field |

#### `project_assumptions`
Stores scenario inputs tied to a parcel.

| Column | Type | Notes |
|---|---|---|
| `project_assumption_id` | UUID PK | Scenario input id |
| `parcel_id` | UUID FK | Linked parcel |
| `scenario_name` | text | User-defined name |
| `inputs_json` | jsonb | Full development assumptions |
| `created_by` | UUID | User id |
| `created_at` | timestamptz | Audit field |

#### `overlay_facts`
Stores GIS-derived facts and measured distances.[cite:43][cite:53]

| Column | Type | Notes |
|---|---|---|
| `overlay_fact_id` | UUID PK | Overlay fact id |
| `parcel_id` | UUID FK | Linked parcel |
| `overlay_type` | text | e.g., `major_transit_stop`, `chip_miip_area` |
| `overlay_value` | boolean | Fact value |
| `distance_value` | numeric | Where applicable |
| `geometry_version_id` | text | Overlay version |
| `source_url` | text | Source provenance |
| `effective_date` | date | Overlay effective date |
| `created_at` | timestamptz | Audit field |

#### `rule_sets`
Stores versioned legal/program configurations.[cite:29][cite:30][cite:58]

| Column | Type | Notes |
|---|---|---|
| `rule_set_id` | UUID PK | Rule bundle id |
| `jurisdiction` | text | CA or Los Angeles |
| `module_name` | text | e.g., `state_density_bonus`, `chip` |
| `version_label` | text | Semantic or date version |
| `effective_start_date` | date | Rule validity start |
| `effective_end_date` | date | Rule validity end |
| `status` | text | active, deprecated, draft |
| `rules_json` | jsonb | Config payload |
| `source_manifest_json` | jsonb | Underlying sources |
| `created_at` | timestamptz | Audit field |

#### `benchmark_sets`
Stores economic benchmark assumptions.

| Column | Type | Notes |
|---|---|---|
| `benchmark_set_id` | UUID PK | Benchmark bundle id |
| `market_name` | text | e.g., Los Angeles County |
| `version_label` | text | Version tag |
| `cost_benchmarks_json` | jsonb | Hard/soft cost tables |
| `labor_benchmarks_json` | jsonb | Prevailing wage ranges |
| `timeline_benchmarks_json` | jsonb | Entitlement and construction durations |
| `revenue_benchmarks_json` | jsonb | Rent/sales/cap inputs |
| `created_at` | timestamptz | Audit field |

#### `evaluation_runs`
Stores engine executions.

| Column | Type | Notes |
|---|---|---|
| `evaluation_run_id` | UUID PK | Run id |
| `parcel_id` | UUID FK | Linked parcel |
| `project_assumption_id` | UUID FK | Linked assumption set |
| `rule_bundle_version` | text | Active legal rules |
| `benchmark_bundle_version` | text | Active economics bundle |
| `engine_version` | text | App version |
| `input_hash` | text | Input reproducibility |
| `result_hash` | text | Output reproducibility |
| `created_at` | timestamptz | Audit field |

#### `scenario_results`
Stores individual scenarios per run.

| Column | Type | Notes |
|---|---|---|
| `scenario_result_id` | UUID PK | Result id |
| `evaluation_run_id` | UUID FK | Linked run |
| `scenario_type` | text | e.g., `miip_plus_sdb` |
| `program_path_json` | jsonb | Program path array |
| `result_json` | jsonb | Full scenario payload |
| `rank_order` | integer | Ordered rank |
| `created_at` | timestamptz | Audit field |

#### `verification_items`
Stores unresolved dependencies.[cite:29][cite:43]

| Column | Type | Notes |
|---|---|---|
| `verification_item_id` | UUID PK | Verification id |
| `scenario_result_id` | UUID FK | Linked result |
| `category` | text | Zoning, transit, overlay, legal, etc. |
| `severity` | text | info, warning, blocking |
| `message` | text | Human-readable item |
| `required_source_type` | text | city_map, parcel_api, counsel, etc. |
| `is_blocking` | boolean | True if blocking |
| `created_at` | timestamptz | Audit field |

## Rule configuration design

Rules should be editable and versioned. Use declarative JSON payloads rather than embedded conditionals in UI code.[cite:29][cite:30][cite:58]

### Example: State Density Bonus rules

```json
{
  "module": "state_density_bonus",
  "version": "2026-05-14",
  "jurisdiction": "CA",
  "effective_start_date": "2026-01-01",
  "thresholds": [
    {
      "id": "sdb-vli-threshold",
      "affordability_type": "very_low_income",
      "min_percent": 5,
      "max_bonus_percent": 50,
      "bonus_curve": "table_ref_vli_2026"
    },
    {
      "id": "sdb-low-threshold",
      "affordability_type": "low_income",
      "min_percent": 10,
      "max_bonus_percent": 50,
      "bonus_curve": "table_ref_low_2026"
    },
    {
      "id": "sdb-mod-sale-threshold",
      "affordability_type": "moderate_income_for_sale",
      "min_percent": 10,
      "max_bonus_percent": 50,
      "bonus_curve": "table_ref_mod_sale_2026"
    }
  ],
  "concessions": [
    { "id": "conc-1", "min_bonus_trigger": 0, "count": 1 },
    { "id": "conc-2", "min_bonus_trigger": 25, "count": 2 },
    { "id": "conc-3", "min_bonus_trigger": 35, "count": 3 }
  ],
  "waiver_standard": {
    "id": "waiver-physically-preclude",
    "test": "development_standard_physically_precludes_density_bonus_project"
  }
}
```

The exact thresholds and parking rules should always be stored in maintainable legal source tables because California housing laws evolve frequently.[cite:30][cite:58][cite:63]

### Example: CHIP rules

```json
{
  "module": "chip",
  "version": "2026-05-14",
  "jurisdiction": "Los Angeles",
  "programs": [
    {
      "program_code": "AHIP",
      "requires_map_area": true,
      "requires_one_of": [
        "is_faith_based_project",
        "is_clt_project",
        "is_public_agency_project",
        "affordability_program_type == one_hundred_percent_affordable"
      ],
      "exclusions": [
        "is_industrial_zone && !allows_residential_by_right"
      ]
    },
    {
      "program_code": "MIIP",
      "requires_map_area": true,
      "location_logic": [
        "in_chip_miip_area == true || distance_to_qualifying_corridor_ft <= configured_limit || in_higher_opportunity_area == true"
      ],
      "exclusions": [
        "is_industrial_zone && !allows_residential_by_right"
      ]
    }
  ]
}
```

## Evaluation workflow

The system should evaluate scenarios in the following order.[cite:29][cite:30][cite:43]

### Step 1: Fact validation
Validate parcel and project inputs. Missing critical fields should not break execution; instead, create verification items and lower confidence.[cite:29][cite:43]

Critical unknowns include:
- base zone
- lot area
- transit distance
- corridor eligibility
- opportunity-area status
- industrial exclusion status
- historic overlay status

### Step 2: Baseline capacity
Calculate baseline zoning capacity where possible. If baseline capacity cannot be derived from internal zoning logic, allow the user to supply it manually and tag the result as using user-supplied baseline assumptions.[cite:30]

### Step 3: State Density Bonus analysis
Evaluate affordability mix and derive:
- eligible category
- bonus percentage
- estimated max units
- concessions count
- waiver availability standard
- parking relief basis[cede:30]

### Step 4: CHIP analysis
Evaluate whether the project appears to fit:
- CHIP State Density Bonus path
- AHIP
- MIIP[cite:29][cite:43][cite:48]

### Step 5: Legal scenario synthesis
Generate legal candidate scenarios such as:
- state density bonus only
- MIIP plus state density bonus
- AHIP path
- AHIP plus state density bonus if supported by configured logic
- conservative scenario
- maximize yield scenario[cite:29][cite:43]

### Step 6: Labor standards analysis
Evaluate likely labor triggers based on program path, affordability, funding assumptions, and configured labor policies. Output prevailing-wage and skilled-and-trained-workforce indicators plus premium ranges rather than one fixed assumption.[cite:64][cite:67][cite:73][cite:76]

### Step 7: Cost model
Estimate hard costs, parking costs, soft costs, entitlement costs, legal costs, financing costs, contingency, and total development cost. Label every output as user-supplied, benchmark-derived, rules-derived, or assumption-derived.[cite:67][cite:68][cite:71]

### Step 8: Timeline model
Estimate schedule ranges for diligence, entitlement, environmental review where relevant, design, permit, financing, construction, and lease-up or sellout. Output p50, p75, and p90 durations.[cite:68][cite:71][cite:74]

### Step 9: Financing carry
Calculate delay-sensitive financing and carry impacts because longer timelines can erode value materially.[cite:68][cite:71]

### Step 10: Stabilized economics
Calculate NOI and value for rental strategies or margin and sales proceeds for for-sale strategies.[cite:68]

### Step 11: Optimization and ranking
Rank scenarios based on selected user objective.[cite:68][cite:71]

### Step 12: Output bundle
Return best scenario, alternates, confidence, execution risk, verification checklist, rule trace, and source versions.[cite:29][cite:43][cite:53]

## Confidence model

Treat legal confidence separately from execution risk.[cite:29][cite:43][cite:68]

### Suggested legal confidence scoring
Start at 100 and deduct for uncertainty:

- minus 25 if map eligibility is required but overlay is not confirmed
- minus 20 if transit distance is estimated rather than measured
- minus 20 if zoning capacity is user-entered instead of derived
- minus 15 if affordability mix is incomplete
- minus 15 if exclusion overlays are unknown
- minus 10 if parking outcome depends on legal interpretation not encoded in rules
- minus 5 if overlay source is older than the configured staleness threshold

Confidence labels:
- `85-100`: high
- `65-84`: medium
- `<65`: low

### Suggested execution risk dimensions
Score separately on:
- entitlement complexity
- political/discretionary exposure
- map uncertainty
- labor-compliance exposure
- financing complexity
- construction complexity
- lease-up or absorption risk
- dependency on deep affordability or external subsidy[cite:67][cite:68][cite:71]

## Verification framework

Each scenario should produce structured verification items.

```ts
type VerificationItem = {
  id: string;
  category:
    | "zoning"
    | "map_overlay"
    | "transit_distance"
    | "affordability_program"
    | "historic"
    | "fire_hazard"
    | "industrial_exclusion"
    | "parking"
    | "legal_interpretation";
  severity: "info" | "warning" | "blocking";
  message: string;
  required_source_type:
    | "city_map"
    | "parcel_api"
    | "survey"
    | "title"
    | "planning_counter_confirmation"
    | "land_use_counsel";
  is_blocking: boolean;
};
```

Examples:
- Confirm MIIP eligibility against current city map layer version.[cite:29][cite:43]
- Confirm parcel is not in a manufacturing zone that disallows residential use.[cite:57]
- Confirm distance to major transit stop for parking-reduction assumptions.[cite:56][cite:58]

## Explainability requirements

Each scenario must expose a machine-readable and user-readable rule trace.

```ts
type RuleTraceItem = {
  rule_id: string;
  module: string;
  outcome: "pass" | "fail" | "warning";
  short_label: string;
  human_explanation: string;
  input_facts_used: string[];
  derived_values: Record<string, any>;
  source_refs: string[];
};
```

This rule trace is necessary so an experienced user can understand why a result was produced and can hand it to counsel or design consultants as a starting point.[cite:29][cite:43]

## Labor standards engine

Labor standards should be a dedicated module because they can materially affect project viability.[cite:64][cite:67][cite:73]

For each scenario, determine whether the project likely triggers:
- prevailing wage
- skilled and trained workforce requirements
- labor-compliance soft-cost burdens

Outputs:
- `prevailing_wage_required`
- `prevailing_wage_trigger_basis`
- `skilled_trained_workforce_required`
- `labor_cost_premium_percent_low`
- `labor_cost_premium_percent_base`
- `labor_cost_premium_percent_high`
- `labor_compliance_soft_cost`

Because prevailing wage impacts vary by product type, labor market, and baseline assumptions, use configurable low/base/high ranges rather than a fixed percentage uplift.[cite:67][cite:76]

## Cost model

The cost engine should estimate:
- land basis
- demolition
- sitework and horizontal improvements
- hard costs by building type
- parking costs by parking type
- soft costs
- entitlement costs
- architecture and engineering
- legal and land-use costs
- permit and impact fees
- financing and carry
- contingency
- developer fee where relevant[cite:67][cite:71]

Use a hybrid framework:
- user-supplied values where available
- benchmark values where missing
- scenario-specific multipliers for labor, parking, affordability, and typology changes[cite:67][cite:68][cite:73]

## Timeline engine

Estimate phase-level schedule ranges.[cite:68][cite:71][cite:74]

Phases:
- diligence
- entitlement
- environmental review where applicable
- design and documentation
- plan check and permitting
- financing close
- construction
- lease-up or sellout

For each scenario, output:
- `timeline_months_p50`
- `timeline_months_p75`
- `timeline_months_p90`
- phase-by-phase assumptions

The timeline engine should respond to:
- ministerial versus discretionary path
- number of waivers or concessions
- unresolved blocking items
- historic or hillside complexity
- labor compliance complexity
- user-selected team-quality assumption[cite:29][cite:43][cite:71]

## Financing carry model

Once schedule ranges are known, estimate carry and interest burden.[cite:68][cite:71]

Required inputs:
- acquisition loan terms
- predevelopment loan terms
- construction debt terms
- interest rate assumptions
- fees
- equity funding timing
- interest reserve assumptions
- perm refinance or takeout assumptions

Outputs:
- carry during entitlement
- carry during construction
- total interest expense
- cost of delay per month
- monthly burn rate

## Stabilized economics module

For rental scenarios, calculate:
- gross potential rent
- vacancy loss
- concessions
- other income
- effective gross income
- operating expenses
- reserves
- NOI
- value from exit cap[cite:68]

For for-sale scenarios, calculate:
- average sales price
- sales pace
- gross sales revenue
- selling costs
- net sales proceeds
- project margin[cite:68]

Support rental, for-sale, or hybrid strategy modes.[cite:68]

## Objective optimizer

The user should select what matters most. Different goals should produce different recommendations.[cite:68][cite:71]

Supported objectives:
- maximize stabilized NOI
- maximize value over cost
- maximize unlevered yield on cost
- maximize levered IRR
- minimize entitlement duration
- minimize legal/entitlement risk
- minimize labor-cost exposure
- maximize units
- maximize parking efficiency
- balanced developer strategy

### Example weighted formulas

#### Maximize stabilized NOI

```ts
score =
  normalized_noi * 0.40 +
  confidence_score * 0.20 +
  normalized_timeline_inverse * 0.10 +
  normalized_cost_efficiency * 0.15 +
  normalized_execution_risk_inverse * 0.15;
```

#### Quick-turnaround / low-risk

```ts
score =
  confidence_score * 0.30 +
  normalized_timeline_inverse * 0.30 +
  normalized_execution_risk_inverse * 0.20 +
  normalized_cost_certainty * 0.10 +
  normalized_noi * 0.10;
```

#### Maximize yield

```ts
score =
  normalized_unit_yield * 0.30 +
  normalized_noi * 0.20 +
  normalized_parking_efficiency * 0.10 +
  confidence_score * 0.15 +
  normalized_execution_risk_inverse * 0.10 +
  normalized_timeline_inverse * 0.05 +
  normalized_cost_efficiency * 0.10;
```

## Sensitivity analysis

For premium users, run automated downside and stress scenarios.[cite:67][cite:68]

Minimum sensitivity set:
- construction cost +10%
- construction cost +20%
- rents -5%
- rents -10%
- entitlement delay +6 months
- entitlement delay +12 months
- interest rate +100 basis points
- interest rate +200 basis points
- prevailing wage premium low/base/high

For each scenario, output:
- base case NOI / IRR
- downside NOI / IRR
- resilience score
- key breakpoint where scenario becomes unattractive

## API contract

Expose a backend API for evaluation and audit.

```http
POST /api/la-incentives/evaluate
POST /api/la-incentives/validate-facts
GET /api/la-incentives/rulesets/active
GET /api/la-incentives/evaluations/:id
GET /api/la-incentives/evaluations/:id/audit
```

### Example request

```json
{
  "parcel": {
    "address": "123 Example St, Los Angeles, CA",
    "base_zone": "R3",
    "lot_area_sqft": 15000,
    "distance_to_major_transit_stop_ft": 1800,
    "in_chip_miip_area": true,
    "is_industrial_zone": false
  },
  "project": {
    "tenure_type": "rental",
    "total_base_units": 30,
    "affordability_program_type": "mixed_income",
    "low_income_units": 4,
    "very_low_income_units": 0,
    "moderate_income_units": 0,
    "strategy_mode": "base_case"
  },
  "economics": {
    "land_cost": 4500000,
    "hard_cost_per_gsf": 325,
    "soft_cost_percent": 22,
    "vacancy_percent": 4,
    "exit_cap_rate": 5.25
  }
}
```

### Example response

```json
{
  "best_scenario": { "...": "..." },
  "alternate_scenarios": [{ "...": "..." }],
  "verification_summary": {
    "blocking_count": 1,
    "warning_count": 2
  },
  "source_versions": {
    "state_density_bonus": "2026-05-14",
    "chip": "2026-05-14",
    "overlays": ["miip-map-v3", "transit-stops-v5"],
    "benchmarks": "la-dev-benchmarks-v1"
  }
}
```

## UI requirements

Design the product for expert users, not consumers.[cite:29][cite:43]

### Main scenario card
Show:
- recommended path
- confidence
- execution risk
- max units
- bonus percent
- parking minimum
- timeline range
- prevailing wage flag
- total development cost
- stabilized NOI
- yield on cost
- largest red flag[cite:29][cite:30][cite:64][cite:71]

### Comparison table

| Field | Display requirement |
|---|---|
| Scenario | Program path label |
| Confidence | High / medium / low with score |
| Execution risk | High / medium / low |
| Units | Estimated max units |
| Parking | Minimum parking requirement |
| Timeline | P50 schedule |
| Prevailing wage | Yes / no / possible |
| Total cost | All-in estimate |
| NOI | Stabilized NOI |
| IRR | If modeled |
| Blocking items | Count |

### Explainability drawer
Include sections for:
- legal path
- CHIP / AHIP / MIIP logic
- parking basis
- labor triggers
- cost assumptions
- timeline assumptions
- financing carry
- sensitivity summary[cite:29][cite:43][cite:64][cite:67]

### Audit export
Allow export of:
- input facts
- assumptions
- rule trace
- verification items
- source manifest
- benchmark version
- timestamp
- disclaimer metadata[cite:29][cite:43][cite:53]

## Quality assurance and calibration

This product should include calibration datasets and reproducibility logs because serious users will challenge the assumptions.[cite:67][cite:71]

### Benchmark tables
Maintain admin-editable benchmark tables for:
- hard costs by product type
- soft-cost bands
- parking cost bands
- prevailing wage premium ranges
- entitlement duration bands by process type
- lease-up assumptions by product type
- cap rate assumptions by submarket[cite:67][cite:68][cite:71]

### Testing requirements

#### Unit tests
- density bonus threshold edges
- parking-rule edges
- scenario rank ordering
- industrial exclusion logic
- confidence downgrades for missing data
- prevailing-wage range handling
- schedule sensitivity calculations[cite:57][cite:58][cite:67]

#### Regression tests
Build archetype tests for:
- pure State Density Bonus site
- likely MIIP site
- likely AHIP site
- ineligible industrial site
- transit-rich low-parking site
- incomplete-data site with low confidence
- high-yield but high-labor-cost site
- low-risk quick-turn site[cite:29][cite:43][cite:57][cite:58][cite:67]

#### Logging
Every evaluation should log:
- legal rules version
- overlay version
- benchmark version
- user overrides
- evaluation timestamp[cite:29][cite:43][cite:53]

## Technical implementation recommendations

Recommended stack:
- TypeScript for domain models and rules execution
- PostgreSQL with JSONB for rule payloads
- PostGIS for overlay facts where GIS is internal
- Zod or equivalent for runtime validation
- deterministic pure functions for legal and scenario evaluation
- admin ruleset manager for updating statutes, local ordinances, and benchmark assumptions[cite:29][cite:43]

Do not place core legal or financial logic in React components or client-only calculations.[cite:29][cite:30]

## Future roadmap

Design v1 so the following modules can be added without refactoring the core engine:

1. **SB 79 module** for Opportunity Station Areas, Low-Rise Incentive Areas, phased implementation geographies, and exclusions such as VHFHSZ, historic, industrial, or sea-level-rise-related limits where applicable.[cite:3][cite:53]
2. **SB 9 module** for duplex and lot-split workflows with city-specific objective standards.[cite:63]
3. **SB 1123 / Starter Home Revitalization module** for small-lot subdivision and ministerial pathways on eligible multifamily and vacant single-family parcels in Los Angeles.[cite:57]
4. **Cross-module optimizer** to compare Density Bonus, CHIP, SB 79, SB 9, and SB 1123 as alternative development strategies for the same parcel.[cite:29][cite:53]

## Final instruction for Claude Code

Implement this as an expert system, not a marketing feature. Every scenario must be traceable, versioned, and explicit about uncertainty. The product should be credible enough that a professional developer could rely on it for acquisition screening, scenario design, and internal investment committee discussion before handing the output to counsel, architects, or entitlement consultants for final confirmation.[cite:29][cite:30][cite:43]
