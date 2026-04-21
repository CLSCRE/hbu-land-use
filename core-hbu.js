// ============================================================
//  CORE HBU — Land to Yield Portal Suite
//  Shared HBU scoring engine, legislation helpers, budget
//  generation, and deal object.
//  Used by: app.html, lender.html, agent.html
//
//  Portal-specific behavior is controlled via:
//    window.HBU_PORTAL_CONFIG = {
//        portalId:           'developer' | 'lender' | 'agent',
//        aduZoneBoostList:   ['R1','R2','R3','R4','R5'],
//        aduJurisdictionCap: true | false,
//        feasibilityGateMode:'penalty-only' | 'boost-and-penalty',
//    };
// ============================================================

// Default config — developer portal behavior
var HBU_PORTAL_CONFIG = window.HBU_PORTAL_CONFIG || {
    portalId: 'developer',
    aduZoneBoostList: ['R1','R2','R3','R4','R5'],
    aduJurisdictionCap: true,
    feasibilityGateMode: 'penalty-only',
};


// ============================================================
//  UTILITY FUNCTIONS
// ============================================================

// Strip commas from formatted number inputs before parsing
function parseNumericInput(id, fallback) {
    var el = document.getElementById(id);
    if (!el) return fallback || 0;
    return parseFloat(String(el.value).replace(/,/g, '')) || fallback || 0;
}

// Format a number input with commas on blur, strip on focus
function setupCommaFormatting(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('focus', function() {
        var raw = String(this.value).replace(/,/g, '').replace(/^\$/, '');
        this.value = raw === '0' ? '' : raw;
    });
    el.addEventListener('blur', function() {
        var raw = parseFloat(String(this.value).replace(/,/g, '').replace(/^\$/, '')) || 0;
        this.value = raw > 0 ? Math.round(raw).toLocaleString() : '0';
    });
    // Format initial value
    var initVal = parseFloat(String(el.value).replace(/,/g, '')) || 0;
    if (initVal > 0) el.value = Math.round(initVal).toLocaleString();
}

function getInputs() {
    return {
        parcelSize:    parseNumericInput('parcelSize', 10000),
        frontage:      parseFloat(document.getElementById('frontage').value) || 80,
        zoning:        document.getElementById('zoning').value,
        neighborhood:  document.getElementById('neighborhood').value,
        siteCondition: document.getElementById('siteCondition').value,
        topography:    document.getElementById('topography').value,
        cornerLot:     document.getElementById('cornerLot').value === 'yes',
        transit:       document.getElementById('transit').value,
        arterial:      document.getElementById('arterial').value,
        utilities:     document.getElementById('utilities').value,
        constFlood:    document.getElementById('constFlood').checked,
        constHillside: document.getElementById('constHillside').checked,
        constHistoric: document.getElementById('constHistoric').checked,
        constFault:    document.getElementById('constFault').checked,
        constCoastal:  document.getElementById('constCoastal').checked,
        constParking:  document.getElementById('constParking').checked,
    };
}


// ============================================================
//  VALUATION ENGINE
// ============================================================

// Simple neighborhood median $/SF (fast fallback for bulk scans)
function estimateMarketValue(structureSqFt, lotSizeSqFt, useType, neighborhood) {
    const mvPSF = MARKET_VALUE_PSF[neighborhood] || 600;
    const landPSF = LAND_VALUE_PSF[neighborhood] || 150;
    if (useType === 'Vacant' || structureSqFt <= 0) return Math.round(lotSizeSqFt * landPSF);
    return Math.round(structureSqFt * mvPSF);
}

// ── Dollar formatter ─────────────────────────────────────────────
function fmtDollar(n) { return '$' + Math.round(n).toLocaleString(); }

function getAppreciationMultiplier(baseYear) {
    const yr = parseInt(baseYear) || 2020;
    if (yr < 1975) return LA_PRICE_INDEX[1975];
    if (yr > 2026) return 1.0;
    return LA_PRICE_INDEX[yr] || 1.0;
}

/**
 * Approach 1: Prop 13 Base Year Adjusted Value
 */
function prop13AdjustedValue(rollLandVal, rollImpVal, landBaseYear, impBaseYear) {
    const landVal = parseFloat(rollLandVal) || 0;
    const impVal = parseFloat(rollImpVal) || 0;
    if (landVal + impVal <= 0) return 0;
    const landMult = getAppreciationMultiplier(landBaseYear);
    const impMult = getAppreciationMultiplier(impBaseYear || landBaseYear);
    return Math.round(landVal * landMult + impVal * impMult);
}

/**
 * Property-type multiplier — multi-family trades at discount to SFR $/SF
 */
function getPropertyTypeMultiplier(units, useDesc) {
    const desc = (useDesc || '').toLowerCase();
    if (units >= 5 || desc.includes('five or more')) return 0.45;
    if (units === 4 || desc.includes('four')) return 0.52;
    if (units === 3 || desc.includes('three') || desc.includes('triplex')) return 0.58;
    if (units === 2 || desc.includes('two') || desc.includes('duplex')) return 0.65;
    if (desc.includes('condo')) return 0.85;
    return 1.0; // SFR
}

/**
 * Approach 2: Sales Comp via Assessor + Land Comp Data
 */
function compBasedValue(structureSqFt, lotSizeSqFt, useType, neighborhood, units, useDesc) {
    const landComps = COMP_LAND_SALES[neighborhood] || COMP_LAND_SALES.dtla;
    if (useType === 'Vacant' || structureSqFt <= 0) {
        return Math.round(lotSizeSqFt * landComps.median);
    }
    const mvPSF = MARKET_VALUE_PSF[neighborhood] || 600;
    const typeMult = getPropertyTypeMultiplier(units, useDesc);
    return Math.round(structureSqFt * mvPSF * typeMult);
}

/**
 * Approach 3: Income Approach — NOI / Cap Rate
 * Estimates what an investor would pay based on rental income.
 */
function incomeApproachValue(structureSqFt, lotSizeSqFt, useType, neighborhood, units, useDesc) {
    if (useType === 'Vacant' || structureSqFt <= 0) return 0;
    const rents = MARKET_RENTS_2025[neighborhood] || MARKET_RENTS_2025.dtla;
    const vacancy = VACANCY_RATES[neighborhood] || VACANCY_RATES.dtla;
    const caps = CAP_RATES[neighborhood] || CAP_RATES.dtla;

    // Use actual unit count if available, otherwise estimate
    const actualUnits = (units && units > 0) ? units : Math.max(1, Math.floor(structureSqFt * 0.85 / 850));
    // Adjust rent mix by unit count
    let avgRent;
    if (actualUnits <= 2) {
        avgRent = rents.br2; // Duplexes: typically 2BR units
    } else if (actualUnits <= 4) {
        avgRent = rents.br1 * 0.5 + rents.br2 * 0.5; // Small multi: mix of 1BR and 2BR
    } else {
        avgRent = rents.studio * 0.20 + rents.br1 * 0.45 + rents.br2 * 0.30 + rents.br3 * 0.05;
    }
    const grossAnnual = actualUnits * avgRent * 12;
    const vacancyLoss = grossAnnual * vacancy.residential;
    const opex = grossAnnual * (actualUnits <= 4 ? 0.40 : 0.35); // Higher expense ratio for small multi
    const noi = grossAnnual - vacancyLoss - opex;
    if (noi <= 0 || caps.residential <= 0) return 0;
    return Math.round(noi / caps.residential);
}

// ── AVM Proxy (ATTOM primary, RentCast fallback) ────────────────
const AVM_PROXY_URL = 'https://lty-avm-proxy.clscre.workers.dev';
function _avmCacheKey(address) { return 'lty_avm5_' + address.toLowerCase().trim().replace(/\s+/g, ' '); }
function _avmCacheGet(address) {
    try {
        const raw = localStorage.getItem(_avmCacheKey(address));
        if (!raw) return null;
        const obj = JSON.parse(raw);
        if (Date.now() - obj.timestamp > 90 * 86400000) { localStorage.removeItem(_avmCacheKey(address)); return null; }
        return obj;
    } catch { return null; }
}
function _avmCacheSet(address, data) {
    try { localStorage.setItem(_avmCacheKey(address), JSON.stringify({ ...data, timestamp: Date.now() })); } catch {}
}
async function fetchAVM(address) {
    if (!address) return null;
    const cached = _avmCacheGet(address);
    if (cached && cached.price) return cached;
    try {
        const resp = await fetch(AVM_PROXY_URL + '?address=' + encodeURIComponent(address), { signal: AbortSignal.timeout(12000) });
        if (!resp.ok) return null;
        const data = await resp.json();
        if (data.price) { _avmCacheSet(address, data); return data; }
        return null;
    } catch { return null; }
}
// Backward compat alias
async function fetchRentCastAVM(address) { return fetchAVM(address); }

/**
 * MARKET VALUE — ATTOM AVM preferred (professional-grade), with fallback chain
 */
async function getMarketValue(address, structureSqFt, lotSizeSqFt, useType, neighborhood, parcelAttrs) {
    // Priority 1: ATTOM/RentCast AVM via proxy (professional-grade valuation)
    const avm = await fetchAVM(address);
    if (avm && avm.price) {
        const result = { value: Math.round(avm.price), source: 'avm' };
        // Store extra ATTOM data for display
        if (avm.confidence) result.confidence = avm.confidence;
        if (avm.priceLow) result.priceLow = avm.priceLow;
        if (avm.priceHigh) result.priceHigh = avm.priceHigh;
        if (avm.lastSalePrice) result.lastSalePrice = avm.lastSalePrice;
        if (avm.lastSaleDate) result.lastSaleDate = avm.lastSaleDate;
        if (avm.assessedTotal) result.assessedTotal = avm.assessedTotal;
        if (avm.source) result.avmSource = avm.source;  // 'attom' or 'rentcast'
        // Fallback-match metadata: when ATTOM matched a ±2 house number on the
        // same parcel (common for duplexes where USPS numbers each unit but
        // ATTOM keys to the parcel's canonical address), pass the resolved
        // address through so the UI can show it.
        if (avm.addressFallback) result.addressFallback = true;
        if (avm.address) result.resolvedAddress = avm.address;
        return result;
    }

    // Priority 2: Prop 13 base-year adjusted (uses real assessor data)
    if (parcelAttrs) {
        const p13val = prop13AdjustedValue(
            parcelAttrs.Roll_LandValue, parcelAttrs.Roll_ImpValue,
            parcelAttrs.Roll_LandBaseYear, parcelAttrs.Roll_ImpBaseYear
        );
        if (p13val > 0) return { value: p13val, source: 'assessor' };
    }

    // Fallback: neighborhood median $/SF
    const est = estimateMarketValue(structureSqFt, lotSizeSqFt, useType, neighborhood);
    return { value: est, source: 'estimate' };
}


// ============================================================
//  LEGISLATION & ADU HELPERS
// ============================================================

function getApplicableLegislation(useId, inp) {
    return CA_HOUSING_LEGISLATION.filter(bill => bill.applies(useId, inp));
}

function stackLegislationEffects(legislationList) {
    let densityBonus = 0;
    let parkingReduction = 0;
    let softCostReduction = 0;
    let legalOverride = false;
    let minFAR = 0;

    for (const bill of legislationList) {
        densityBonus = Math.max(densityBonus, bill.densityBonus || 0);
        parkingReduction = Math.max(parkingReduction, bill.parkingReduction || 0);
        softCostReduction += (bill.softCostReduction || 0);
        if (bill.legalOverride) legalOverride = true;
        minFAR = Math.max(minFAR, bill.minFAR || 0);
    }

    softCostReduction = Math.min(softCostReduction, 0.50);
    return { densityBonus, parkingReduction, softCostReduction, legalOverride, minFAR };
}

function getADURules(jurisdiction) {
    if (!jurisdiction) return ADU_RULES['default'];
    const j = jurisdiction.jurisdiction || '';
    if (j === 'City of Los Angeles' || j === 'Los Angeles') return ADU_RULES['Los Angeles'];
    if (j.includes('Unincorporated') || j === 'LA County') return ADU_RULES['LA County'];
    return ADU_RULES[j] || ADU_RULES['default'];
}

function getMatchingADUPlans(jurisdiction, lotSizeSF) {
    const jurisName = (!jurisdiction || jurisdiction.isLA) ? 'Los Angeles' :
        (jurisdiction.jurisdiction && jurisdiction.jurisdiction.includes('Unincorporated')) ? 'LA County' :
        jurisdiction.jurisdiction || 'Los Angeles';
    const planSet = PREAPPROVED_ADU_PLANS[jurisName] || PREAPPROVED_ADU_PLANS['Los Angeles'];
    if (!planSet) return null;

    // Filter tiers by lot size feasibility (need at least footprint + setbacks)
    const rules = getADURules(jurisdiction);
    const minSetback = (rules.setbacks.side * 2) + (rules.setbacks.rear);
    const usableLot = lotSizeSF - (minSetback * 10); // rough usable area estimate

    const matching = planSet.tiers.filter(tier => {
        return tier.maxSF <= Math.min(usableLot, rules.maxSF);
    });

    return {
        program: planSet.program,
        catalogUrl: planSet.catalogUrl,
        totalPlans: planSet.totalPlans,
        benefits: planSet.benefits,
        matchingTiers: matching.length > 0 ? matching : planSet.tiers.slice(0, 2), // fallback to smallest tiers
    };
}

// Scale timeline phases by project size (GSF)
function getScaledTimeline(useId, gsf) {
    var tl = TIMELINE_MONTHS[useId] || { entitlement: 6, design: 4, permits: 3, construction: 18, leaseup: 6 };
    if (!gsf || gsf <= 0) return { entitlement: tl.entitlement, design: tl.design, permits: tl.permits, construction: tl.construction, leaseup: tl.leaseup };
    var typical = TYPICAL_GSF[useId] || 30000;
    var ratio = gsf / typical;
    // Diminishing returns: scale = ratio^0.35, clamped 0.6x-2.0x
    var scale = Math.max(0.6, Math.min(2.0, Math.pow(ratio, 0.35)));
    // Entitlement/permits scale less (process-driven); construction/leaseup scale more (size-driven)
    var procScale = Math.max(0.8, Math.min(1.5, Math.pow(ratio, 0.2)));
    return {
        entitlement: Math.round(tl.entitlement * procScale),
        design:      Math.round(tl.design * procScale),
        permits:     Math.round(tl.permits * procScale),
        construction: Math.round(tl.construction * scale),
        leaseup:     Math.round(tl.leaseup * scale)
    };
}


// ============================================================
//  SCORING FUNCTIONS
// ============================================================

function scoreLegal(useId, inp, effects) {
    const zoneRow = ZONING_MATRIX[inp.zoning];
    if (!zoneRow) return 0;
    let base = zoneRow[useId] || 0;

    // CA Housing Legislation: by-right override
    if (effects && effects.legalOverride) {
        base = 1.0;
    }

    // Historic overlay reduces redevelopment permission
    if (inp.constHistoric && ['multifamily_high', 'hotel', 'industrial'].includes(useId)) {
        base *= 0.5;
    }
    // Coastal zone limits industrial, dense residential
    if (inp.constCoastal && ['industrial', 'multifamily_high', 'selfstorage'].includes(useId)) {
        base *= 0.4;
    }
    // Hillside ordinance restricts density
    if (inp.constHillside && ['multifamily_mid', 'multifamily_high', 'hotel', 'industrial'].includes(useId)) {
        base *= 0.3;
    }
    return Math.min(base, 1.0);
}

function scorePhysical(useId, inp) {
    let score = 1.0;

    // Parcel size check
    const minSqFt = MIN_PARCEL[useId] || 2000;
    if (inp.parcelSize < minSqFt) {
        score *= Math.max(0.1, inp.parcelSize / minSqFt);
    } else if (inp.parcelSize > minSqFt * 3) {
        score *= 1.0; // plenty of room
    }

    // Frontage adequacy
    const needsFrontage = ['retail', 'mixeduse', 'hotel', 'office', 'medical'];
    if (needsFrontage.includes(useId) && inp.frontage < 50) {
        score *= 0.6;
    }

    // Topography
    const topoPenalty = { flat: 1.0, gentle: 0.9, moderate: 0.65, steep: 0.3 };
    const baseTopo = topoPenalty[inp.topography] || 1.0;
    // Some uses are more topo-tolerant
    if (['parking', 'selfstorage'].includes(useId)) {
        score *= Math.max(baseTopo, 0.7);
    } else if (['industrial', 'multifamily_high', 'hotel'].includes(useId)) {
        score *= baseTopo * 0.9; // extra sensitive
    } else {
        score *= baseTopo;
    }

    // Utilities
    if (inp.utilities === 'partial') score *= 0.85;
    if (inp.utilities === 'none') score *= 0.5;

    // Site condition
    if (inp.siteCondition === 'demolition') score *= 0.85;
    if (inp.siteCondition === 'brownfield') score *= 0.6;

    // Flood zone
    if (inp.constFlood) score *= 0.7;

    // Fault zone — penalizes tall structures
    if (inp.constFault && ['multifamily_high', 'hotel', 'office'].includes(useId)) {
        score *= 0.7;
    }

    return Math.min(score, 1.0);
}

function scoreFinancial(useId, inp, effects) {
    // Compute effective FAR with legislation bonuses + jurisdiction overrides
    const juris = window._lastJurisdiction || null;
    const jurisdictionFAR = getJurisdictionFAR(useId, juris);
    const baseFAR = jurisdictionFAR || FAR_TYPICAL[useId] || 1.0;
    let far = baseFAR;
    if (effects) {
        far = baseFAR * (1 + effects.densityBonus);
        if (effects.minFAR > 0) far = Math.max(far, effects.minFAR);
    }

    const params = BUILDING_PARAMS[useId];
    let buildableSF = inp.parcelSize * far;
    // ADU: cap to jurisdiction max size
    if (useId === 'adu') {
        const aduRules = getADURules(window._lastJurisdiction);
        buildableSF = Math.min(buildableSF, aduRules.maxSF);
    }
    const nsf = buildableSF * (params ? params.eff : 0.82);
    const landValuePSF = LAND_VALUE_PSF[inp.neighborhood] || 150;
    // Land cost: use assessor value if available, checkbox zeroes it out
    const _ownProp = document.getElementById('ownProperty');
    const landCost = (useId === 'adu' || (_ownProp && _ownProp.checked)) ? 0
        : (parseFloat(String((document.getElementById('marketValue') || {}).value).replace(/,/g, '')) > 0) ? parseFloat(String(document.getElementById('marketValue').value).replace(/,/g, ''))
        : inp.parcelSize * landValuePSF;

    // Build cost with parking reduction from legislation
    let buildCostPerSF = BUILD_COST_PSF[useId] || 300;
    if (effects && effects.parkingReduction > 0) {
        buildCostPerSF *= (1 - effects.parkingReduction * 0.18);
    }
    const buildCost = buildableSF * buildCostPerSF;

    // Parking cost (use-specific, with jurisdiction override)
    const parkCostPerSpace = PARKING_COST_MAP[useId] || 35000;
    const jurisdictionPark = getJurisdictionParking(useId, juris);
    const baseParkRatio = jurisdictionPark || (params ? (params.parkRatio || 0) : 0);
    const parkReduction = effects ? effects.parkingReduction : 0;
    const hasUnits = params && params.unitSF;
    let parkSpaces = 0;
    if (useId === 'parking') parkSpaces = Math.round(buildableSF / 350);
    else if (hasUnits) parkSpaces = Math.max(0, Math.ceil(Math.floor(nsf / params.unitSF) * baseParkRatio * (1 - parkReduction)));
    else parkSpaces = Math.max(0, Math.ceil(buildableSF / 1000 * baseParkRatio * (1 - parkReduction)));
    const parkingCost = parkSpaces * parkCostPerSpace;

    // Total cost including overhead (parking, contingency, soft costs)
    // Site work cost (uses breakdown function for consistency)
    const siteWorkCost = calcSiteWorkBreakdown(useId, inp, buildableSF).total;
    const hardCostBase = buildCost + parkingCost + siteWorkCost;
    const totalHard = hardCostBase * 1.11; // ~4% landscaping + 7% contingency
    const totalSoft = totalHard * 0.235; // ~23.5% (A&E 8%, permits 5%, legal 2%, financing 4.5%, dev fee 4%)
    let totalCost = landCost + totalHard + totalSoft;
    if (effects && effects.softCostReduction > 0) {
        totalCost -= totalSoft * effects.softCostReduction * 0.20;
    }

    // Annual NOI with neighborhood rent adjustment
    const rentMult = NEIGHBORHOOD_RENT_MULT[inp.neighborhood] || 1.0;
    const opexRate = params ? params.opex : 0.35;
    const annualNOI = nsf * (REVENUE_PSF[useId] || 30) * rentMult * (1 - opexRate);

    // Yield-on-cost and development margin
    const yieldOnCost = annualNOI / totalCost;
    const capRate = params ? params.cap : 0.05;
    const devMargin = capRate > 0 ? (yieldOnCost / capRate - 1) : 0;

    // Score based on dev margin — directly ties to project profitability
    let score;
    if (devMargin >= 0.25) score = 1.0;
    else if (devMargin >= 0.15) score = 0.75 + (devMargin - 0.15) / 0.10 * 0.25;
    else if (devMargin >= 0.05) score = 0.45 + (devMargin - 0.05) / 0.10 * 0.30;
    else if (devMargin >= 0) score = 0.20 + (devMargin / 0.05) * 0.25;
    else if (devMargin >= -0.15) score = Math.max(0.02, 0.20 + devMargin * 1.2);
    else score = 0.02;

    // Neighborhood demand multiplier
    const demandRow = NEIGHBORHOOD_DEMAND[inp.neighborhood];
    const demand = demandRow ? (demandRow[useId] || 0.7) : 0.7;
    score *= demand;

    // Corner lot bonus for visibility-dependent uses
    if (inp.cornerLot && ['retail', 'mixeduse', 'hotel', 'office', 'medical'].includes(useId)) {
        score *= 1.15;
    }

    // Transit proximity bonus
    const transitBonus = { adjacent: 1.2, near: 1.1, moderate: 1.0, far: 0.85 };
    if (['multifamily_mid', 'multifamily_high', 'mixeduse', 'office', 'hotel'].includes(useId)) {
        score *= (transitBonus[inp.transit] || 1.0);
    }

    // Arterial bonus
    if (inp.arterial === 'major' && ['retail', 'mixeduse', 'hotel', 'office'].includes(useId)) {
        score *= 1.1;
    }
    if (inp.arterial === 'residential' && ['retail', 'hotel', 'industrial'].includes(useId)) {
        score *= 0.7;
    }

    // Site condition cost adjustments
    if (inp.siteCondition === 'demolition') score *= 0.9;
    if (inp.siteCondition === 'brownfield') score *= 0.7;

    // Parking constraints
    if (inp.constParking && ['retail', 'office', 'medical', 'hotel'].includes(useId)) {
        score *= 0.8;
    }

    // ADU bonus: low total cost, zero parking, by-right, fastest timeline,
    // can add to existing structure — highest ROI per dollar invested
    if (useId === 'adu') {
        // ADU total investment is a fraction of ground-up projects, so the dev-margin
        // math (which divides NOI by total cost incl. land) understates its attractiveness.
        // Boost reflects: minimal entitlement risk, 13-month timeline, no parking cost.
        score = Math.max(score, 0.55);
        // Extra lift for residential zones where ADU is by-right
        if (HBU_PORTAL_CONFIG.aduZoneBoostList.includes(inp.zoning)) score *= 1.25;
        // ADU excels on smaller/mid-size parcels with existing structures
        if (inp.siteCondition === 'improved' || inp.siteCondition === 'vacant') score *= 1.10;
    }

    // SB 9 Lot Split + Duplex bonus: models 4-unit scenario on qualifying R1 parcels
    // Lot split creates two lots, each with a duplex = 4 units total from a single R1 parcel
    if (useId === 'duplex') {
        const sfZones = ['R1', 'R1V', 'R1V1', 'R1V2', 'R1V3', 'RE', 'RE9', 'RE11', 'RE15', 'RE20', 'RE40', 'RS', 'RA', 'RD', 'RD1.5', 'RD2', 'RD3', 'RD4', 'RD5', 'RD6', 'RW1'];
        const sb9Eligible = sfZones.includes(inp.zoning) && inp.parcelSize >= 2400
            && !inp.constHistoric && !inp.constFire && !inp.constHillside
            && !inp.constFault && !inp.constFlood && !inp.constCoastal;
        if (sb9Eligible) {
            // SB 9 makes duplex by-right on single-family lots — significant entitlement advantage
            score = Math.max(score, 0.50);
            // Lot split potential: if lot is large enough to split (each lot ≥ 1,200 SF)
            if (inp.parcelSize >= 2400) {
                const lotA = Math.floor(inp.parcelSize * 0.5);
                const lotB = inp.parcelSize - lotA;
                if (lotA >= 1200 && lotB >= 1200) {
                    // 4-unit scenario: 2 duplexes, each max 800 SF/unit = 3,200 SF total
                    // Higher revenue from 4 units vs 2, with same land cost
                    score *= 1.30;  // 30% boost for lot split optionality
                }
            }
            // Transit proximity: SB 9 waives parking within 0.5 mi of transit
            if (inp.transit === 'adjacent' || inp.transit === 'near') {
                score *= 1.10;  // No parking required = lower cost, more buildable area
            }
        }
    }

    return Math.min(score, 1.0);
}

function scoreProductive(useId, inp, effects) {
    // Compute effective FAR with legislation bonuses
    const baseFAR = FAR_TYPICAL[useId] || 1.0;
    let far = baseFAR;
    if (effects) {
        far = baseFAR * (1 + effects.densityBonus);
        if (effects.minFAR > 0) far = Math.max(far, effects.minFAR);
    }

    let buildableSF = inp.parcelSize * far;
    // ADU: cap to jurisdiction max size
    if (useId === 'adu' && HBU_PORTAL_CONFIG.aduJurisdictionCap) {
        var aduRules = getADURules(window._lastJurisdiction);
        buildableSF = Math.min(buildableSF, aduRules.maxSF);
    }
    const revenuePSF = REVENUE_PSF[useId] || 30;
    const rentMult = NEIGHBORHOOD_RENT_MULT[inp.neighborhood] || 1.0;
    const totalAnnualRev = buildableSF * revenuePSF * rentMult;
    const landValuePSF = LAND_VALUE_PSF[inp.neighborhood] || 150;

    // Revenue-to-land-value ratio (higher = more productive per dollar of land)
    const revToLand = totalAnnualRev / (inp.parcelSize * landValuePSF);

    // Normalize
    let score;
    if (revToLand >= 0.20) score = 1.0;
    else if (revToLand >= 0.10) score = 0.5 + (revToLand - 0.10) / 0.10 * 0.5;
    else score = revToLand / 0.10 * 0.5;

    // Demand multiplier
    const demandRow = NEIGHBORHOOD_DEMAND[inp.neighborhood];
    const demand = demandRow ? (demandRow[useId] || 0.7) : 0.7;
    score *= demand;

    // ADU productivity: revenue-to-land-value underrates ADU because it
    // doesn't require using the full parcel — it adds income to an existing
    // property. Adjust to reflect incremental value-add ROI.
    if (useId === 'adu') {
        score = Math.max(score, 0.45);
        if (HBU_PORTAL_CONFIG.aduZoneBoostList.includes(inp.zoning)) score *= 1.20;
    }

    return Math.min(score, 1.0);
}


// ============================================================
//  BUDGET & SITE WORK
// ============================================================

/**
 * Calculate site work cost broken into sub-components.
 * Adjusts for topography, soil conditions, site condition, and use type.
 *
 * Sub-components (all $/SF of lot area unless noted):
 *   1. Clearing & Grubbing  — remove vegetation, trees, debris ($1.50-$4.50/SF)
 *   2. Rough Grading         — cut/fill, grade to design elevations ($2-$12/SF depending on slope)
 *   3. Soil Prep / Compaction — scarify, moisture condition, compact subgrade ($1.50-$5/SF)
 *   4. Utility Rough-In      — trench, stub water/sewer/storm/electric/gas to building pad ($3-$8/SF)
 *   5. Erosion / SWPPP        — silt fence, BMP, SWPPP compliance during grading ($0.75-$2/SF)
 *
 * @param {string} useId — land use type
 * @param {object} inp — site input (parcelSize, topography, siteCondition, etc.)
 * @param {number} gsf — gross square footage of building
 * @param {object} [rateOverrides] — optional user-overridden $/SF rates for each sub-component
 * @returns {object} { clearing, grading, soilPrep, utilities, erosion, total, rates, assumptions }
 */
function calcSiteWorkBreakdown(useId, inp, gsf, rateOverrides) {
    var lot = inp.parcelSize || 10000;

    // ADU: minimal site work scoped to footprint
    if (useId === 'adu') {
        var aduArea = Math.min(lot * 0.3, gsf || 800);
        return { clearing: 0, grading: Math.round(aduArea * 3), soilPrep: Math.round(aduArea * 2),
                 utilities: Math.round(aduArea * 5), erosion: Math.round(aduArea * 1),
                 total: Math.round(aduArea * 11), rates: { clearing: 0, grading: 3, soilPrep: 2, utilities: 5, erosion: 1 },
                 assumptions: 'ADU — site work scoped to ADU footprint only (~' + Math.round(aduArea).toLocaleString() + ' SF). Minimal grading, shared utility laterals.' };
    }

    // Base rates ($/SF of lot) — typical flat urban infill in LA
    var rates = {
        clearing:  2.00,  // vegetation/debris removal
        grading:   3.50,  // rough grading, cut/fill
        soilPrep:  2.50,  // compaction, moisture conditioning
        utilities: 5.00,  // trench & stub all utilities to pad
        erosion:   1.25,  // SWPPP, silt fence, BMPs
    };

    // --- Adjust for TOPOGRAPHY ---
    if (inp.topography === 'steep') {
        rates.grading = 10.00;   // heavy cut/fill, retaining walls, export
        rates.soilPrep = 4.50;   // deeper compaction, engineered fill
        rates.erosion = 2.00;    // extended SWPPP, slope stabilization
    } else if (inp.topography === 'moderate' || inp.topography === 'sloped') {
        rates.grading = 6.00;    // moderate cut/fill
        rates.soilPrep = 3.25;
        rates.erosion = 1.50;
    }
    // flat = base rates

    // --- Adjust for SITE CONDITION ---
    if (inp.siteCondition === 'vacant') {
        rates.clearing = 1.50;   // minimal — empty lot, weeds/fence
    } else if (inp.siteCondition === 'brownfield') {
        rates.clearing = 4.00;   // hazmat screening, debris, potential contaminated soil handling
        rates.soilPrep = 4.00;   // over-excavation, clean fill import
    } else if (inp.siteCondition === 'demolition') {
        rates.clearing = 3.50;   // post-demo debris, asbestos survey area
    }

    // --- Adjust for UTILITIES ---
    if (inp.utilities === 'partial') {
        rates.utilities = 7.00;  // some laterals need extension
    } else if (inp.utilities === 'none') {
        rates.utilities = 12.00; // full utility extension from main to site
    }

    // --- Adjust for CONSTRAINTS ---
    if (inp.constFlood) {
        rates.grading += 2.00;   // flood mitigation grading, raised pad
        rates.erosion += 0.75;   // extra drainage BMPs
    }
    if (inp.constHillside) {
        rates.grading += 3.00;   // hillside grading ordinance compliance
    }
    if (inp.constFault) {
        rates.soilPrep += 1.50;  // fault zone geotech compliance
    }

    // Apply user overrides if provided
    if (rateOverrides) {
        if (rateOverrides.clearing !== undefined) rates.clearing = rateOverrides.clearing;
        if (rateOverrides.grading !== undefined) rates.grading = rateOverrides.grading;
        if (rateOverrides.soilPrep !== undefined) rates.soilPrep = rateOverrides.soilPrep;
        if (rateOverrides.utilities !== undefined) rates.utilities = rateOverrides.utilities;
        if (rateOverrides.erosion !== undefined) rates.erosion = rateOverrides.erosion;
    }

    var clearing  = Math.round(lot * rates.clearing);
    var grading   = Math.round(lot * rates.grading);
    var soilPrep  = Math.round(lot * rates.soilPrep);
    var utilities = Math.round(lot * rates.utilities);
    var erosion   = Math.round(lot * rates.erosion);
    var total     = clearing + grading + soilPrep + utilities + erosion;

    // Build human-readable assumption string
    var assumptionParts = [];
    if (inp.topography === 'steep') assumptionParts.push('steep slope (+heavy grading, retaining, export)');
    else if (inp.topography === 'moderate' || inp.topography === 'sloped') assumptionParts.push('moderate slope (+additional grading)');
    else assumptionParts.push('flat/level grade (standard grading)');
    if (inp.siteCondition === 'brownfield') assumptionParts.push('brownfield (+over-excavation, clean fill)');
    else if (inp.siteCondition === 'demolition') assumptionParts.push('post-demo site (+debris handling)');
    else if (inp.siteCondition === 'vacant') assumptionParts.push('vacant lot (minimal clearing)');
    if (inp.utilities === 'none') assumptionParts.push('no utilities (+full lateral extension)');
    else if (inp.utilities === 'partial') assumptionParts.push('partial utilities (+lateral extensions)');
    if (inp.constFlood) assumptionParts.push('flood zone (+raised pad, drainage)');
    if (inp.constHillside) assumptionParts.push('hillside (+ordinance compliance)');
    if (inp.constFault) assumptionParts.push('fault zone (+geotech)');

    return {
        clearing: clearing, grading: grading, soilPrep: soilPrep, utilities: utilities, erosion: erosion,
        total: total, rates: rates,
        assumptions: assumptionParts.join('; '),
    };
}

function generateBudget(useId, inp, effects) {
    const params = BUILDING_PARAMS[useId];
    const baseFAR = FAR_TYPICAL[useId] || 1.0;
    let far = baseFAR;
    if (effects) {
        far = baseFAR * (1 + effects.densityBonus);
        if (effects.minFAR > 0) far = Math.max(far, effects.minFAR);
    }

    let gsf = Math.round(inp.parcelSize * far);
    // ADU: cap GSF to jurisdiction max size and use jurisdiction-aware setbacks
    if (useId === 'adu') {
        const aduRules = getADURules(window._lastJurisdiction);
        gsf = Math.min(gsf, aduRules.maxSF);
        params.setF = aduRules.setbacks.rear;
        params.setS = aduRules.setbacks.side;
    }
    const nsf = Math.round(gsf * params.eff);
    const stories = Math.max(params.stories, Math.ceil(gsf / (inp.parcelSize * 0.7)));
    const buildingHeight = stories * params.floorH;
    const buildingFootprint = Math.min(Math.round(inp.parcelSize * 0.7), Math.round(gsf / stories));
    const units = params.unitSF ? Math.max(1, Math.floor(nsf / params.unitSF)) : null;

    // Parking (use-specific cost per space)
    const baseParkRatio = params.parkRatio || 0;
    const parkReduction = effects ? effects.parkingReduction : 0;
    let parkingSpaces;
    if (useId === 'parking') {
        parkingSpaces = Math.round(gsf / 350);
    } else if (units) {
        parkingSpaces = Math.max(0, Math.ceil(units * baseParkRatio * (1 - parkReduction)));
    } else {
        parkingSpaces = Math.max(0, Math.ceil(gsf / 1000 * baseParkRatio * (1 - parkReduction)));
    }
    const parkingCostPerSpace = PARKING_COST_MAP[useId] || 35000;

    const landValuePSF = LAND_VALUE_PSF[inp.neighborhood] || 150;
    // Land cost: use assessor value if available, checkbox zeroes it out
    const _ownProp2 = document.getElementById('ownProperty');
    const landCost = (useId === 'adu' || (_ownProp2 && _ownProp2.checked)) ? 0
        : (parseFloat(String((document.getElementById('marketValue') || {}).value).replace(/,/g, '')) > 0) ? parseFloat(String(document.getElementById('marketValue').value).replace(/,/g, ''))
        : inp.parcelSize * landValuePSF;

    // Hard costs — Site work broken into sub-components
    const siteWorkBreakdown = calcSiteWorkBreakdown(useId, inp, gsf);
    const siteWork = siteWorkBreakdown.total;
    const demolition = (inp.siteCondition === 'demolition' && useId !== 'adu') ? inp.parcelSize * 12 : 0;
    let buildCostPSF = BUILD_COST_PSF[useId] || 300;
    if (effects && effects.parkingReduction > 0) {
        buildCostPSF *= (1 - effects.parkingReduction * 0.18);
    }
    const construction = gsf * buildCostPSF;
    const parkingCost = parkingSpaces * parkingCostPerSpace;
    const landscaping = Math.round(construction * 0.04);
    const hardContingency = Math.round((siteWork + demolition + construction + parkingCost + landscaping) * 0.07);
    const totalHard = siteWork + demolition + construction + parkingCost + landscaping + hardContingency;

    // Soft costs
    const archEng = Math.round(totalHard * 0.08);
    const permits = Math.round(totalHard * 0.05);
    const legal = Math.round(totalHard * 0.02);
    const financing = Math.round((landCost + totalHard) * 0.045);
    const rentMult = NEIGHBORHOOD_RENT_MULT[inp.neighborhood] || 1.0;
    const revenuePSF = (REVENUE_PSF[useId] || 30) * rentMult;
    const marketing = Math.round(nsf * revenuePSF * 0.02);
    const devFee = Math.round((totalHard + archEng + permits) * 0.04);
    const softCostMult = effects && effects.softCostReduction > 0 ? (1 - effects.softCostReduction * 0.20) : 1;
    const totalSoft = Math.round((archEng + permits + legal + financing + marketing + devFee) * softCostMult);

    const totalDev = landCost + totalHard + totalSoft;

    // Revenue & returns (neighborhood-adjusted)
    const grossRevenue = nsf * revenuePSF;
    const opex = Math.round(grossRevenue * params.opex);
    const noi = grossRevenue - opex;
    const capRate = params.cap || 0.05;
    const stabilizedValue = capRate > 0 ? Math.round(noi / capRate) : 0;
    const yieldOnCost = totalDev > 0 ? noi / totalDev : 0;
    const devMargin = totalDev > 0 ? (stabilizedValue - totalDev) / totalDev : 0;

    return {
        gsf, nsf, revenueNSF: nsf, stories, buildingHeight, buildingFootprint, units, parkingSpaces, far,
        landCost, landValuePSF, siteWork, siteWorkBreakdown, demolition, construction, buildCostPSF, parkingCost, parkingCostPerSpace, landscaping, hardContingency, totalHard,
        archEng, permits, legal, financing, marketing, devFee, totalSoft,
        totalDev,
        grossRevenue, opex, noi, capRate, stabilizedValue, yieldOnCost, devMargin,
        params, revenuePSF,
    };
}


// ============================================================
//  ANALYSIS HELPERS
// ============================================================

function formatCompactDollars(n) {
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
    return '$' + Math.round(n).toLocaleString();
}

function approxIRR(devMargin, totalMonths) {
    if (totalMonths <= 0 || devMargin <= -1) return 0;
    return Math.pow(1 + devMargin, 12 / totalMonths) - 1;
}

function computeEaseOfExecution(useId, inp, effects, legalScore) {
    let ease = 50; // base score

    // Entitlement timeline — shorter is easier
    const tl = getScaledTimeline(useId, (typeof computed !== "undefined" && computed ? computed.gsf : (typeof budget !== "undefined" && budget ? budget.gsf : 0)));
    const totalMo = tl.entitlement + tl.design + tl.permits + tl.construction + tl.leaseup;
    if (totalMo <= 20) ease += 20;
    else if (totalMo <= 35) ease += 10;
    else if (totalMo >= 55) ease -= 15;
    else if (totalMo >= 45) ease -= 8;

    // Legal permissibility bonus
    if (legalScore >= 80) ease += 12;
    else if (legalScore >= 60) ease += 6;
    else if (legalScore < 30) ease -= 15;

    // Legislation streamlining bonuses
    if (effects && effects.legalOverride) ease += 8;
    if (effects && effects.softCostReduction > 0) ease += Math.round(effects.softCostReduction * 10);
    if (effects && effects.parkingReduction > 0) ease += 5;

    // Site constraints penalties
    if (inp.constHistoric) ease -= 10;
    if (inp.constHillside) ease -= 8;
    if (inp.constCoastal) ease -= 8;
    if (inp.constFault) ease -= 5;
    if (inp.constFlood) ease -= 5;
    if (inp.siteCondition === 'brownfield') ease -= 10;
    if (inp.topography === 'steep') ease -= 7;
    if (inp.utilities === 'none') ease -= 10;
    else if (inp.utilities === 'partial') ease -= 5;

    // Construction complexity — high-rise / hotel harder
    const params = BUILDING_PARAMS[useId];
    if (params && params.stories >= 10) ease -= 10;
    else if (params && params.stories >= 6) ease -= 5;

    return Math.max(0, Math.min(100, ease));
}

function computeRiskLevel(useId, inp, legalScore, physicalScore) {
    let riskPts = 0;

    // Site constraint risks
    if (inp.constFlood) riskPts += 12;
    if (inp.constHillside) riskPts += 10;
    if (inp.constHistoric) riskPts += 10;
    if (inp.constFault) riskPts += 12;
    if (inp.constCoastal) riskPts += 8;
    if (inp.siteCondition === 'brownfield') riskPts += 14;
    if (inp.topography === 'steep') riskPts += 8;
    if (inp.utilities === 'none') riskPts += 10;
    else if (inp.utilities === 'partial') riskPts += 5;

    // Score-based risk
    if (legalScore < 40) riskPts += 15;
    else if (legalScore < 60) riskPts += 8;
    if (physicalScore < 40) riskPts += 10;

    // Building complexity
    const params = BUILDING_PARAMS[useId];
    if (params && params.stories >= 10) riskPts += 10;
    else if (params && params.stories >= 6) riskPts += 5;

    // Market risk for certain types
    if (['office', 'retail', 'hotel'].includes(useId)) riskPts += 6;

    if (riskPts >= 35) return { level: 'High', color: '#c53030', bg: '#fff5f5' };
    if (riskPts >= 18) return { level: 'Moderate', color: '#b7791f', bg: '#fffff0' };
    return { level: 'Low', color: '#276749', bg: '#f0fff4' };
}

// Incentive summary functions removed — dollar estimates were not credible
var INCENTIVE_PERIODS = {};
function getIncentiveAnnual(inc) { return { annual: 0, period: { type: 'oneTime', label: '' } }; }
function getIncentivesSummaryForUse() { return { all: [], eligible: [], oneTimeTotal: 0, annualTotal: 0, count: 0 }; }
function generateIncentiveSummaryHTML() { return ''; }


// ============================================================
//  CORE CALCULATE HBU
// ============================================================

lastResults = null;
lastInputs = null;

/**
 * Core HBU scoring loop — shared by all portals.
 * Scores all land uses, applies feasibility gates based on portal config,
 * and returns sorted results.
 *
 * @param {object} inp — site inputs from getInputs()
 * @returns {{ results: Array, inp: object }}
 */
function calculateHBUCore(inp) {
    // Score all uses
    var results = LAND_USES.map(function(use) {
        var legislation = getApplicableLegislation(use.id, inp);
        var effects = stackLegislationEffects(legislation);

        var legal      = scoreLegal(use.id, inp, effects);
        var physical   = scorePhysical(use.id, inp);
        var financial  = scoreFinancial(use.id, inp, effects);
        var productive = scoreProductive(use.id, inp, effects);

        // Compute actual dev margin for feasibility check
        var budget = generateBudget(use.id, inp, effects);
        var devMarginPct = budget.devMargin;

        // HBU must pass ALL four tests. Weight: Legal gateway, then others.
        // If legal = 0, overall = 0
        var overall;
        if (legal === 0) {
            overall = 0;
        } else {
            overall = legal * 0.25 + physical * 0.20 + financial * 0.30 + productive * 0.25;
            // Penalize further if legal is only conditional
            if (legal <= 0.5) overall *= 0.8;

            // Feasibility gate — portal-specific behavior
            if (HBU_PORTAL_CONFIG.feasibilityGateMode === 'boost-and-penalty') {
                // Agent portal: reward high margins, penalize low/negative
                if (devMarginPct >= 0.30) overall *= 1.20;       // excellent deal — boost
                else if (devMarginPct >= 0.15) overall *= 1.10;  // strong deal — slight boost
                else if (devMarginPct >= 0.05) overall *= 1.0;   // acceptable — no change
                else if (devMarginPct >= 0) overall *= 0.75;     // barely feasible — penalize
                else if (devMarginPct >= -0.05) overall *= 0.55;
                else if (devMarginPct >= -0.15) overall *= 0.40;
                else overall *= 0.25;                            // major money loser
            } else {
                // Developer/lender portal: penalty-only for negative margins
                if (devMarginPct < -0.15) overall *= 0.50;
                else if (devMarginPct < -0.05) overall *= 0.65;
                else if (devMarginPct < 0) overall *= 0.80;
            }
        }

        return {
            id: use.id,
            name: use.name,
            icon: use.icon,
            legal: Math.round(legal * 100),
            physical: Math.round(physical * 100),
            financial: Math.round(financial * 100),
            productive: Math.round(productive * 100),
            overall: Math.min(100, Math.round(overall * 100)),
            devMarginPct: devMarginPct,
            legislation: legislation,
        };
    });

    // Sort by overall descending
    results.sort(function(a, b) { return b.overall - a.overall; });

    return { results: results, inp: inp };
}

/**
 * calculateHBU — main entry point for all portals.
 * Calls calculateHBUCore and stores results in module-level variables.
 * Portal-specific post-processing (rendering, maps, etc.) should be done
 * by the portal after calling this function.
 *
 * @returns {{ results: Array, inp: object }}
 */
function calculateHBU() {
    var inp = getInputs();
    var result = calculateHBUCore(inp);

    // Store for modal access and cross-function use
    lastResults = result.results;
    lastInputs = result.inp;

    return result;
}


// ============================================================
//  DEAL OBJECT
// ============================================================

function buildDealObject(overrides) {
  overrides = overrides || {};
  var base = {
    id: overrides.id || (Date.now().toString() + Math.random().toString(16).slice(2)),
    createdAt: overrides.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    address: overrides.address || '',
    apn: overrides.apn || '',
    city: overrides.city || '',
    zip: overrides.zip || '',
    lat: overrides.lat || null,
    lng: overrides.lng || null,
    zoning: overrides.zoning || '',
    bestUse: overrides.bestUse || '',
    sb79Tier: overrides.sb79Tier || null,
    tocTier: overrides.tocTier || null,
    lotSizeSqft: overrides.lotSizeSqft || null,
    marketValue: overrides.marketValue || null,
    devLandBid: overrides.devLandBid || null,
    opportunityRatio: overrides.opportunityRatio || null,
    easeScore: overrides.easeScore || null,
    overallScore: overrides.overallScore || null,
    yieldOnCost: overrides.yieldOnCost || null,
    devMarginPct: overrides.devMarginPct || null,
    stabilizedValue: overrides.stabilizedValue || null,
    status: overrides.status || 'new',
    developer: overrides.developer || {},
    agent: overrides.agent || {},
    lender: overrides.lender || {}
  };
  return Object.assign({}, base, overrides);
}
