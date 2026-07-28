// ============================================================
//  CORE FINANCE — Land to Yield Portal Suite
//  Shared financial calculation and rendering functions.
//  Used by: app.html, lender.html, agent.html
// ============================================================

// === FINANCIAL CALCULATIONS ===

function getDefaultAssumptions(useId, inp, effects) {
    const params = BUILDING_PARAMS[useId];
    const baseFAR = FAR_TYPICAL[useId] || 1.0;
    let far = baseFAR;
    if (effects) {
        far = baseFAR * (1 + effects.densityBonus);
        if (effects.minFAR > 0) far = Math.max(far, effects.minFAR);
    }

    const gsf = Math.round(inp.parcelSize * far);
    const nsf = Math.round(gsf * params.eff);
    const hasUnits = !!params.unitSF;
    const unitsOrNSF = hasUnits ? Math.max(1, Math.floor(nsf / params.unitSF)) : nsf;

    const baseParkRatio = params.parkRatio || 0;
    const parkReduction = effects ? effects.parkingReduction : 0;
    let parkingSpaces;
    if (useId === 'parking') {
        parkingSpaces = Math.round(gsf / 350);
    } else if (hasUnits) {
        parkingSpaces = Math.max(0, Math.ceil(unitsOrNSF * baseParkRatio * (1 - parkReduction)));
    } else {
        parkingSpaces = Math.max(0, Math.ceil(gsf / 1000 * baseParkRatio * (1 - parkReduction)));
    }

    let buildCostPSF = BUILD_COST_PSF[useId] || 300;
    if (effects && effects.parkingReduction > 0) {
        buildCostPSF = Math.round(buildCostPSF * (1 - effects.parkingReduction * 0.18));
    }

    const rentMult = NEIGHBORHOOD_RENT_MULT[inp.neighborhood] || 1.0;

    // Calculate default site work for display
    var swBreakdown = calcSiteWorkBreakdown(useId, inp, gsf);
    var siteWorkTotalPSF = inp.parcelSize > 0 ? Math.round(swBreakdown.total / inp.parcelSize) : 18;

    return {
        far: parseFloat(far.toFixed(2)),
        unitsOrNSF,
        parkingSpaces,
        buildCostPSF: Math.round(buildCostPSF),
        landValuePSF: LAND_VALUE_PSF[inp.neighborhood] || 150,
        revenuePSF: Math.round((REVENUE_PSF[useId] || 30) * rentMult),
        opexPct: Math.round(params.opex * 100),
        capRatePct: parseFloat((params.cap * 100).toFixed(1)),
        parkingCostPerSpace: PARKING_COST_MAP[useId] || 35000,
        siteWorkPSF: siteWorkTotalPSF,
        siteWorkTotal: swBreakdown.total,
        siteWorkOverride: null,
        parcelSize: inp.parcelSize || 10000,
        // Design Configurator fields
        coveragePct: 70,
        efficiencyPct: Math.round(params.eff * 100),
        setbackFront: params.setF,
        setbackSide: params.setS,
        setbackRear: params.setS,
        amenityPct: 0,
        parkingType: 'surface',
        unitMixStudio: (typeof UNIT_MIX_PROFILES !== 'undefined') ? Math.round(((UNIT_MIX_PROFILES[inp.neighborhood] || UNIT_MIX_PROFILES.dtla).studio) * 100) : 20,
        unitMixBr1: (typeof UNIT_MIX_PROFILES !== 'undefined') ? Math.round(((UNIT_MIX_PROFILES[inp.neighborhood] || UNIT_MIX_PROFILES.dtla).br1) * 100) : 45,
        unitMixBr2: (typeof UNIT_MIX_PROFILES !== 'undefined') ? Math.round(((UNIT_MIX_PROFILES[inp.neighborhood] || UNIT_MIX_PROFILES.dtla).br2) * 100) : 30,
    };
}

function computeFromAssumptions(useId, inp, assumptions, effects) {
    const params = BUILDING_PARAMS[useId];
    const far = assumptions.far;
    let gsf = Math.round(inp.parcelSize * far);
    // ADU: cap to jurisdiction max size
    if (useId === 'adu') {
        const aduRules = getADURules(window._lastJurisdiction);
        gsf = Math.min(gsf, aduRules.maxSF);
    }

    // Configurator-aware efficiency & amenity
    const effPct = (assumptions.efficiencyPct != null ? assumptions.efficiencyPct : Math.round(params.eff * 100)) / 100;
    const amenityPct = (assumptions.amenityPct || 0) / 100;
    const nsf = Math.round(gsf * effPct * (1 - amenityPct));
    const amenitySF = Math.round(gsf * effPct * amenityPct);

    // Configurator-aware setbacks & coverage
    const setF = assumptions.setbackFront != null ? assumptions.setbackFront : params.setF;
    const setS = assumptions.setbackSide != null ? assumptions.setbackSide : params.setS;
    const setR = assumptions.setbackRear != null ? assumptions.setbackRear : params.setS;
    const frontage = inp.frontage || Math.sqrt(inp.parcelSize * 2);
    const depth = inp.parcelSize / frontage;
    const buildableW = Math.max(0, frontage - 2 * setS);
    const buildableD = Math.max(0, depth - setF - setR);
    const buildableArea = Math.round(buildableW * buildableD);
    const covPct = (assumptions.coveragePct != null ? assumptions.coveragePct : 70) / 100;
    const maxFootprint = Math.min(Math.round(inp.parcelSize * covPct), buildableArea);
    const stories = Math.max(params.stories, Math.ceil(gsf / Math.max(maxFootprint, 1)));
    const buildingHeight = stories * params.floorH;
    const buildingFootprint = Math.min(maxFootprint, Math.round(gsf / stories));

    const hasUnits = !!params.unitSF;
    const units = hasUnits ? assumptions.unitsOrNSF : null;
    // For revenue: use user-edited NSF for non-unit uses, or units * unitSF for unit-based uses
    const revenueNSF = hasUnits ? assumptions.unitsOrNSF * params.unitSF : assumptions.unitsOrNSF;
    const parkingSpaces = assumptions.parkingSpaces;

    const landValuePSF = assumptions.landValuePSF;
    // Land cost: use assessor value if available, checkbox zeroes it out
    const _ownProp3 = document.getElementById('ownProperty');
    const landCost = (useId === 'adu' || (_ownProp3 && _ownProp3.checked)) ? 0
        : (parseFloat(String((document.getElementById('marketValue') || {}).value).replace(/,/g, '')) > 0) ? parseFloat(String(document.getElementById('marketValue').value).replace(/,/g, ''))
        : inp.parcelSize * landValuePSF;

    // Hard costs — Site work with user-overridable sub-components
    let siteWorkBreakdown;
    if (assumptions.siteWorkOverride !== undefined && assumptions.siteWorkOverride !== null) {
        // User manually set a total site work cost
        siteWorkBreakdown = { total: assumptions.siteWorkOverride, grading: 0, utilities: 0, erosion: 0, soilPrep: 0, clearing: 0, isOverride: true };
    } else {
        siteWorkBreakdown = calcSiteWorkBreakdown(useId, inp, gsf, assumptions.siteWorkRates);
    }
    const siteWork = siteWorkBreakdown.total;
    const demolition = (inp.siteCondition === 'demolition' && useId !== 'adu') ? inp.parcelSize * 12 : 0;
    const buildCostPSF = assumptions.buildCostPSF;
    const construction = gsf * buildCostPSF;
    const parkingCost = parkingSpaces * assumptions.parkingCostPerSpace;
    const landscaping = Math.round(construction * 0.04);
    const hardContingency = Math.round((siteWork + demolition + construction + parkingCost + landscaping) * 0.07);
    const totalHard = siteWork + demolition + construction + parkingCost + landscaping + hardContingency;

    // Soft costs
    const archEng = Math.round(totalHard * 0.08);
    const permits = Math.round(totalHard * 0.05);
    const legal = Math.round(totalHard * 0.02);
    const financing = Math.round((landCost + totalHard) * 0.045);
    const revenuePSF = assumptions.revenuePSF;
    const marketing = Math.round(revenueNSF * revenuePSF * 0.02);
    const devFee = Math.round((totalHard + archEng + permits) * 0.04);
    const softCostMult = effects && effects.softCostReduction > 0 ? (1 - effects.softCostReduction * 0.20) : 1;
    const totalSoft = Math.round((archEng + permits + legal + financing + marketing + devFee) * softCostMult);

    const totalDev = landCost + totalHard + totalSoft;

    // Revenue & returns — use revenueNSF so user edits to units/NSF flow through
    const grossRevenue = revenueNSF * revenuePSF;
    const opexRate = assumptions.opexPct / 100;
    const opex = Math.round(grossRevenue * opexRate);
    const noi = grossRevenue - opex;
    const capRate = assumptions.capRatePct / 100;
    const stabilizedValue = capRate > 0 ? Math.round(noi / capRate) : 0;
    const yieldOnCost = totalDev > 0 ? noi / totalDev : 0;
    const devMargin = totalDev > 0 ? (stabilizedValue - totalDev) / totalDev : 0;

    // Exit transfer tax stack (ULA cliff on stabilized value; City of LA default)
    const ulaResult = (typeof calculateUlaTax === 'function')
        ? calculateUlaTax(stabilizedValue)
        : { ulaTax: 0, totalTransferTax: 0, band: 'none', cliffWarning: null };

    return {
        gsf, nsf, revenueNSF, stories, buildingHeight, buildingFootprint, units, parkingSpaces, far,
        landCost, siteWork, siteWorkBreakdown, demolition, construction, buildCostPSF, parkingCost, landscaping, hardContingency, totalHard,
        archEng, permits, legal, financing, marketing, devFee, totalSoft,
        totalDev,
        grossRevenue, opex, noi, capRate, stabilizedValue, yieldOnCost, devMargin,
        params, landValuePSF, revenuePSF, parkingCostPerSpace: assumptions.parkingCostPerSpace,
        // Design Configurator extras
        amenitySF, buildableArea,
        setbacks: { front: setF, side: setS, rear: setR },
        coveragePct: covPct * 100,
        efficiencyPct: effPct * 100,
        // Measure ULA (Jul 2026 thresholds)
        ula: ulaResult,
        measureUlaTax: ulaResult.ulaTax || 0,
        totalTransferTax: ulaResult.totalTransferTax || 0,
    };
}

// === FINANCIAL RENDERERS ===

function renderSensitivityMatrix(budget, useId, inp, effects) {
  var panel = document.getElementById('sensitivity-matrix-panel');
  var grid = document.getElementById('sensitivity-matrix-grid');
  if (!panel || !grid || !budget) return;
  var steps = [-15, -10, -5, 0, 5, 10, 15];
  var baseRev = budget.grossRevenue || 0;
  var baseOpex = budget.opex || 0;
  var baseTotalDev = budget.totalDev || 0;
  var baseLand = budget.landCost || 0;
  var baseHard = budget.totalHard || 0;
  var baseSoft = budget.totalSoft || 0;
  var baseCap = budget.capRate || 0.05;
  function sensColor(m) {
    if (m >= 25) return 'sens-green';
    if (m >= 15) return 'sens-ltgreen';
    if (m >= 5) return 'sens-yellow';
    if (m >= 0) return 'sens-orange';
    return 'sens-red';
  }
  var html = '<table class="sens-matrix-table"><thead><tr><th></th>';
  steps.forEach(function(r) { html += '<th>Rent ' + (r >= 0 ? '+' : '') + r + '%</th>'; });
  html += '</tr></thead><tbody>';
  steps.forEach(function(c) {
    html += '<tr><th>Cost ' + (c >= 0 ? '+' : '') + c + '%</th>';
    steps.forEach(function(r) {
      var adjRev = baseRev * (1 + r / 100);
      var adjOpex = baseOpex * (1 + r / 100);
      var adjNoi = adjRev - adjOpex;
      var adjStab = baseCap > 0 ? adjNoi / baseCap : 0;
      var adjHard = baseHard * (1 + c / 100);
      var adjSoft = baseSoft * (1 + c / 100);
      var adjTotalDev = baseLand + adjHard + adjSoft;
      var margin = adjTotalDev > 0 ? ((adjStab - adjTotalDev) / adjTotalDev) * 100 : 0;
      var cls = sensColor(margin);
      var isBase = (r === 0 && c === 0);
      html += '<td class="' + cls + (isBase ? ' base-cell' : '') + '">' + margin.toFixed(1) + '%</td>';
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  grid.innerHTML = html;
  panel.style.display = '';
}

// === Sources & Uses ===
function renderSourcesAndUses(budget, isSimplified) {
  var panel = document.getElementById('sources-uses-panel');
  var grid = document.getElementById('sources-uses-grid');
  if (!panel || !grid || !budget) return;
  function fmt(n) { return '$' + Math.round(n).toLocaleString(); }
  var totalDev = budget.totalDev || 0;
  var seniorDebt = Math.round(totalDev * 0.65);
  var equity = totalDev - seniorDebt;
  var html = '<div class="su-columns">';
  // Uses column
  html += '<div class="su-col"><h3>Uses of Funds</h3><table class="su-table">';
  if (isSimplified) {
    html += '<tr><td>Land Acquisition</td><td>' + fmt(budget.landCost || 0) + '</td></tr>';
    html += '<tr><td>Hard Costs</td><td>' + fmt(budget.totalHard || 0) + '</td></tr>';
    html += '<tr><td>Soft Costs</td><td>' + fmt(budget.totalSoft || 0) + '</td></tr>';
  } else {
    html += '<tr><td>Land Acquisition</td><td>' + fmt(budget.landCost || 0) + '</td></tr>';
    html += '<tr class="su-subtotal"><td colspan="2" style="padding-top:8px;">Hard Costs</td></tr>';
    html += '<tr><td>&nbsp;&nbsp;Site Work</td><td>' + fmt(budget.siteWork || 0) + '</td></tr>';
    if (budget.demolition > 0) html += '<tr><td>&nbsp;&nbsp;Demolition</td><td>' + fmt(budget.demolition) + '</td></tr>';
    html += '<tr><td>&nbsp;&nbsp;Construction</td><td>' + fmt(budget.construction || 0) + '</td></tr>';
    html += '<tr><td>&nbsp;&nbsp;Parking</td><td>' + fmt(budget.parkingCost || 0) + '</td></tr>';
    html += '<tr><td>&nbsp;&nbsp;Landscaping</td><td>' + fmt(budget.landscaping || 0) + '</td></tr>';
    html += '<tr><td>&nbsp;&nbsp;Contingency (7%)</td><td>' + fmt(budget.hardContingency || 0) + '</td></tr>';
    html += '<tr class="su-subtotal"><td>Hard Cost Subtotal</td><td>' + fmt(budget.totalHard || 0) + '</td></tr>';
    html += '<tr class="su-subtotal"><td colspan="2" style="padding-top:8px;">Soft Costs</td></tr>';
    html += '<tr><td>&nbsp;&nbsp;Architecture &amp; Engineering</td><td>' + fmt(budget.archEng || 0) + '</td></tr>';
    html += '<tr><td>&nbsp;&nbsp;Permits &amp; Fees</td><td>' + fmt(budget.permits || 0) + '</td></tr>';
    html += '<tr><td>&nbsp;&nbsp;Legal</td><td>' + fmt(budget.legal || 0) + '</td></tr>';
    html += '<tr><td>&nbsp;&nbsp;Financing / Interest Reserve</td><td>' + fmt(budget.financing || 0) + '</td></tr>';
    html += '<tr><td>&nbsp;&nbsp;Marketing &amp; Lease-Up</td><td>' + fmt(budget.marketing || 0) + '</td></tr>';
    html += '<tr><td>&nbsp;&nbsp;Developer Fee</td><td>' + fmt(budget.devFee || 0) + '</td></tr>';
    html += '<tr class="su-subtotal"><td>Soft Cost Subtotal</td><td>' + fmt(budget.totalSoft || 0) + '</td></tr>';
  }
  html += '<tr class="su-total"><td>Total Uses</td><td>' + fmt(totalDev) + '</td></tr>';
  html += '</table></div>';
  // Sources column
  html += '<div class="su-col"><h3>Sources of Funds</h3><table class="su-table">';
  html += '<tr><td>Senior Debt (65% LTC)</td><td>' + fmt(seniorDebt) + '</td></tr>';
  html += '<tr><td>Sponsor Equity (35% LTC)</td><td>' + fmt(equity) + '</td></tr>';
  html += '<tr class="su-total"><td>Total Sources</td><td>' + fmt(totalDev) + '</td></tr>';
  html += '</table></div>';
  html += '</div>';
  grid.innerHTML = html;
  panel.style.display = '';
}

// === Levered Returns ===
function fmtCompact(n) {
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (Math.abs(n) >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
  return '$' + Math.round(n).toLocaleString();
}
function renderLeveredReturns(budget) {
  var panel = document.getElementById('levered-returns-panel');
  var grid = document.getElementById('levered-returns-grid');
  if (!panel || !grid || !budget) return;
  var totalDev = budget.totalDev || 0;
  var noi = budget.noi || 0;
  var stabVal = budget.stabilizedValue || 0;
  var ltc = 0.65, rate = 0.065, amortYrs = 30;
  var debtAmt = Math.round(totalDev * ltc);
  var equityAmt = totalDev - debtAmt;
  // Annual debt service (fully amortizing)
  var monthlyRate = rate / 12;
  var nPayments = amortYrs * 12;
  var monthlyPmt = debtAmt * (monthlyRate * Math.pow(1 + monthlyRate, nPayments)) / (Math.pow(1 + monthlyRate, nPayments) - 1);
  var annualDS = monthlyPmt * 12;
  var cashFlowYr1 = noi - annualDS;
  var dscr = annualDS > 0 ? noi / annualDS : 0;
  var cashOnCash = equityAmt > 0 ? cashFlowYr1 / equityAmt : 0;
  var profit = stabVal - totalDev;
  var equityMultiple = equityAmt > 0 ? (equityAmt + profit) / equityAmt : 0;
  var unleveredIRR = budget.yieldOnCost || 0;
  // Simplified levered IRR proxy (equity cash yield + appreciation spread)
  var leveredIRR = equityAmt > 0 ? (cashFlowYr1 + profit * 0.08) / equityAmt : 0;
  var grossRev = budget.grossRevenue || 0;
  var breakeven = grossRev > 0 ? ((budget.opex || 0) + annualDS) / grossRev : 0;
  var metrics = [
    { label: 'Unlevered IRR', value: (unleveredIRR * 100).toFixed(1) + '%', sentiment: unleveredIRR >= 0.08 ? 'positive' : unleveredIRR >= 0.05 ? 'warning' : 'negative' },
    { label: 'Levered IRR', value: (leveredIRR * 100).toFixed(1) + '%', sentiment: leveredIRR >= 0.15 ? 'positive' : leveredIRR >= 0.08 ? 'warning' : 'negative' },
    { label: 'Equity Multiple', value: equityMultiple.toFixed(2) + 'x', sentiment: equityMultiple >= 2.0 ? 'positive' : equityMultiple >= 1.5 ? 'warning' : 'negative' },
    { label: 'Cash-on-Cash Yr 1', value: (cashOnCash * 100).toFixed(1) + '%', sentiment: cashOnCash >= 0.08 ? 'positive' : cashOnCash >= 0 ? 'warning' : 'negative' },
    { label: 'DSCR Year 1', value: dscr.toFixed(2) + 'x', sentiment: dscr >= 1.25 ? 'positive' : dscr >= 1.0 ? 'warning' : 'negative' },
    { label: 'Breakeven Occ.', value: (breakeven * 100).toFixed(0) + '%', sentiment: breakeven <= 0.75 ? 'positive' : breakeven <= 0.90 ? 'warning' : 'negative' },
    { label: 'Profit', value: fmtCompact(profit), sentiment: profit > 0 ? 'positive' : profit === 0 ? 'neutral' : 'negative' }
  ];
  var html = '';
  metrics.forEach(function(m) {
    html += '<div class="lr-metric-card lr-' + m.sentiment + '">';
    html += '<div class="lr-label">' + m.label + '</div>';
    html += '<div class="lr-value">' + m.value + '</div>';
    html += '</div>';
  });
  grid.innerHTML = html;
  panel.style.display = '';
}

// === PROGRAM DISPLAY ===

function renderProgramDisplay(computed) {
    return `<div class="program-grid">
        <div class="program-item"><div class="program-value">${computed.stories}</div><div class="program-label">Stories / ${computed.buildingHeight} ft</div></div>
        <div class="program-item"><div class="program-value">${computed.gsf.toLocaleString()}</div><div class="program-label">Gross SF</div></div>
        ${computed.units
            ? `<div class="program-item"><div class="program-value">${computed.units}</div><div class="program-label">Units</div></div>`
            : `<div class="program-item"><div class="program-value">${computed.nsf.toLocaleString()}</div><div class="program-label">Net Leasable SF</div></div>`}
        <div class="program-item"><div class="program-value">${computed.parkingSpaces}</div><div class="program-label">Parking Spaces</div></div>
    </div>`;
}

// === MEASURE ULA + TRANSFER TAX (City of LA) — thresholds after 2026-06-30 ===
// Source: finance.lacity.gov. Cliff: elevated rate applies to FULL gross consideration.
// Not legal advice.
const ULA_POLICY = {
    asOf: '2026-07-01',
    midThreshold: 5400000,   // 4% if > mid and < high
    highThreshold: 10900000, // 5.5% if >= high
    midRate: 0.04,
    highRate: 0.055,
    cityBaseRate: 0.0045,    // City base RPTT (approx 0.45%)
    countyBaseRate: 0.00056, // County documentary, kept for stack estimate
    effectiveAfter: '2026-06-30',
};

function calculateUlaTax(grossConsideration, opts) {
    opts = opts || {};
    const situs = Math.min(1, Math.max(0, opts.citySitusFraction != null ? opts.citySitusFraction : 1));
    const gross = Math.max(0, Number(grossConsideration) || 0);
    const base = Math.round(gross * situs * 100) / 100;
    let band = 'none';
    let ulaRate = 0;
    if (base >= ULA_POLICY.highThreshold) {
        band = 'high_5_5pct';
        ulaRate = ULA_POLICY.highRate;
    } else if (base > ULA_POLICY.midThreshold) {
        band = 'mid_4pct';
        ulaRate = ULA_POLICY.midRate;
    }
    const ulaTax = Math.round(base * ulaRate * 100) / 100;
    // City base RPTT stylus: $2.25 per $500 or fraction thereof on taxable base
    const baseUnits = base > 0 ? Math.ceil(base / 500) : 0;
    const cityBaseRptt = Math.round(baseUnits * 2.25 * 100) / 100;
    const countyEst = Math.round(base * ULA_POLICY.countyBaseRate * 100) / 100;
    const totalTransferTax = Math.round((ulaTax + cityBaseRptt + countyEst) * 100) / 100;
    let cliffWarning = null;
    if (band === 'mid_4pct') {
        cliffWarning = 'Cliff: 4% ULA applies to the entire consideration once above $' +
            ULA_POLICY.midThreshold.toLocaleString() + ', not just the overage.';
    } else if (band === 'high_5_5pct') {
        cliffWarning = 'Cliff: 5.5% ULA applies to the entire consideration at/above $' +
            ULA_POLICY.highThreshold.toLocaleString() + '.';
    }
    return {
        asOf: ULA_POLICY.asOf,
        grossConsideration: gross,
        taxableBase: base,
        band: band,
        ulaRate: ulaRate,
        ulaTax: ulaTax,
        cityBaseRptt: cityBaseRptt,
        countyEst: countyEst,
        totalTransferTax: totalTransferTax,
        cliffWarning: cliffWarning,
        thresholds: {
            mid: ULA_POLICY.midThreshold,
            high: ULA_POLICY.highThreshold,
        },
    };
}

function isUlaExposed(grossConsideration, citySitusFraction) {
    return calculateUlaTax(grossConsideration, { citySitusFraction: citySitusFraction }).band !== 'none';
}

/** Attach ULA exposure to a completed pro forma budget (exit at stabilized value). */
function attachUlaToBudget(budget, opts) {
    if (!budget) return budget;
    const exit = budget.stabilizedValue || budget.salePrice || 0;
    budget.ula = calculateUlaTax(exit, opts);
    budget.measureUlaTax = budget.ula.ulaTax;
    budget.totalTransferTax = budget.ula.totalTransferTax;
    return budget;
}

// Developer Top-20 rank lookup (from July 2025/2026 legislative scan; ids match tool tags)
const DEVELOPER_TOP20_RANKS = {
    sb79: 1, ula: 2, ab130: 3, chip: 4, dbl: 5, sb35: 6, ab2011: 7,
    aro: 8, parking: 9, rso: 10, sb9: 11, builders_remedy: 12, fee_deferral: 13,
    jjj: 14, road: 15, lihtc: 16, surplus: 17, yigby: 18, lacahsa: 19, starter: 20,
};

function developerTop20Boost(programId) {
    const r = DEVELOPER_TOP20_RANKS[programId];
    if (r == null) return 0;
    return Math.max(0, 21 - r);
}

function renderAssumptions(assumptions, hasUnits) {
    return `<div class="assumptions-panel">
        <h4>Key Assumptions (editable)</h4>
        <div class="assumptions-grid">
            <div class="assumption-field">
                <label>FAR</label>
                <input type="number" class="assumption-input" id="a-far" step="0.1" min="0.1" max="20" value="${assumptions.far}" onchange="recalcAnalysis()">
            </div>
            <div class="assumption-field">
                <label>${hasUnits ? 'Units' : 'Net Leasable SF'}</label>
                <input type="number" class="assumption-input" id="a-unitsOrNSF" step="1" min="1" value="${assumptions.unitsOrNSF}" onchange="recalcAnalysis()">
            </div>
            <div class="assumption-field">
                <label>Parking Spaces</label>
                <input type="number" class="assumption-input" id="a-parkingSpaces" step="1" min="0" value="${assumptions.parkingSpaces}" onchange="recalcAnalysis()">
            </div>
            <div class="assumption-field">
                <label>Build Cost $/SF</label>
                <input type="number" class="assumption-input" id="a-buildCostPSF" step="5" min="10" value="${assumptions.buildCostPSF}" onchange="recalcAnalysis()">
            </div>
            <div class="assumption-field">
                <label>Land Value $/SF</label>
                <input type="number" class="assumption-input" id="a-landValuePSF" step="5" min="1" value="${assumptions.landValuePSF}" onchange="recalcAnalysis()">
            </div>
            <div class="assumption-field">
                <label>Revenue $/SF</label>
                <input type="number" class="assumption-input" id="a-revenuePSF" step="1" min="1" value="${assumptions.revenuePSF}" onchange="recalcAnalysis()">
            </div>
            <div class="assumption-field">
                <label>OpEx %</label>
                <input type="number" class="assumption-input" id="a-opexPct" step="1" min="0" max="100" value="${assumptions.opexPct}" onchange="recalcAnalysis()">
            </div>
            <div class="assumption-field">
                <label>Cap Rate %</label>
                <input type="number" class="assumption-input" id="a-capRatePct" step="0.1" min="0.1" max="20" value="${assumptions.capRatePct}" onchange="recalcAnalysis()">
            </div>
            <div class="assumption-field">
                <label>Parking $/Space</label>
                <input type="number" class="assumption-input" id="a-parkingCostPerSpace" step="1000" min="0" value="${assumptions.parkingCostPerSpace}" onchange="recalcAnalysis()">
            </div>
            <div class="assumption-field">
                <label>Site Work $/SF <span style="font-size:0.6rem;color:#a0aec0;">(of lot)</span></label>
                <input type="number" class="assumption-input" id="a-siteWorkPSF" step="1" min="0" max="100" value="${assumptions.siteWorkPSF || Math.round(assumptions.siteWorkTotal / (assumptions.parcelSize || 10000))}" onchange="recalcAnalysis()" placeholder="auto">
                <span style="font-size:0.6rem;color:#a0aec0;">blank = auto-calc</span>
            </div>
        </div>
    </div>`;
}
