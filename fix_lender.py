import re

path = r"C:\Users\tdamy\OneDrive - CLS CRE\CLS CRE\Brokerage\AI - ChatGPT\Claude Code\HBU Land Use - Perplexity\lender.html"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# FIX 1: Lease-up ramp absorption cap
old1 = "        const monthlyAbsorb = Math.max(1, Math.round(baseMonthlyAbsorption * u.absorptionMult * 0.15));"
new1 = """        // Cap absorption: max 8-15% of a project's units per month (larger buildings lease slower per-unit)
        var projectAbsorbCap = Math.max(1, Math.round(totalUnits * (totalUnits <= 20 ? 0.15 : totalUnits <= 50 ? 0.12 : totalUnits <= 100 ? 0.08 : totalUnits <= 200 ? 0.06 : 0.04)));
        const monthlyAbsorb = Math.min(projectAbsorbCap, Math.max(1, Math.round(baseMonthlyAbsorption * u.absorptionMult * 0.15)));"""

assert old1 in content, "FIX 1: search string not found!"
content = content.replace(old1, new1, 1)
print("FIX 1 applied: absorption cap")

# FIX 2: Infrastructure data sources
old2 = """    return html;
}

function renderInfrastructureTab(st) {"""

new2 = """    // Data sources
    html += '<div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #e2e8f0;font-size:0.75rem;color:#a0aec0;line-height:1.6;">' +
        '<strong style="color:#718096;">Data Sources & References</strong><br>' +
        'Electrical: LADWP Power Engineering — distribution grid capacity data, transformer specifications, and Will-Serve requirements per LADWP Rule 21.<br>' +
        'Sewer: LA Sanitation & Environment (LASAN) — sewer generation rates per LA Plumbing Code Table 11-1; S-permit thresholds per LAMC §64.15.<br>' +
        'Water: LADWP Water System — demand rates per LA Plumbing Code; Will-Serve letter requirements per LADWP Rule 8.<br>' +
        'Stormwater: LA LID Ordinance (Ord. 181,899 & 184,248) — 3/4-inch design storm retention; BMP sizing per LA Stormwater Manual (2014, updated 2024).<br>' +
        'Fire Flow: LAFD Fire Code — required flow rates per CFC Table B105.1(2); hydrant spacing per LAMC §57.507.3.<br>' +
        'EV Charging: CalGreen Code (2022 Title 24 Part 11) §4.106.4; City of LA local amendment (2023) requiring 100% residential EV-readiness.<br>' +
        'Cost estimates based on RS Means 2024, LADWP published fee schedules, and Southern California contractor bid data. Site-specific conditions may vary.' +
    '</div>';

    return html;
}

function renderInfrastructureTab(st) {"""

assert old2 in content, "FIX 2: search string not found!"
content = content.replace(old2, new2, 1)
print("FIX 2 applied: infrastructure data sources")

# FIX 3a: Add scaleByGSF to building_permit
old3a = "    building_permit:   { fee: 0,     timeline: 2,  hearing: 'None (over-the-counter)' },"
new3a = "    building_permit:   { fee: 0,     timeline: 2,  hearing: 'None (over-the-counter)', scaleByGSF: true },"

assert old3a in content, "FIX 3a: search string not found!"
content = content.replace(old3a, new3a, 1)
print("FIX 3a applied: scaleByGSF flag")

# FIX 3b: Entitlement path loop
old3b = """    for (const a of approvals) {
        const fee = LA_ENTITLEMENT_FEES[a.id] || { fee: 0, timeline: 0, hearing: 'N/A' };
        steps.push({
            name: a.name,
            cost: fee.fee,
            months: fee.timeline,
            hearing: fee.hearing,
            color: a.id === 'building_permit' ? '#38a169' : (a.id === 'zone_change' ? '#c53030' : '#805ad5'),
        });
        totalCost += fee.fee;
        totalMonths += fee.timeline;
    }"""

new3b = """    for (const a of approvals) {
        const fee = LA_ENTITLEMENT_FEES[a.id] || { fee: 0, timeline: 0, hearing: 'N/A' };
        var stepMonths = fee.timeline;
        if (a.id === 'building_permit') {
            var gsf = inp.parcelSize * (FAR_TYPICAL[useId] || 1);
            if (gsf > 200000) stepMonths = 8;
            else if (gsf > 100000) stepMonths = 6;
            else if (gsf > 50000) stepMonths = 5;
            else if (gsf > 25000) stepMonths = 4;
            else if (gsf > 10000) stepMonths = 3;
            else stepMonths = 2;
            if (inp.constHistoric) stepMonths += 2;
        }
        if (a.id === 'cup' && inp.parcelSize > 30000) stepMonths += 2;
        if (a.id === 'site_plan_review' && inp.parcelSize > 40000) stepMonths += 2;
        steps.push({
            name: a.name,
            cost: fee.fee,
            months: stepMonths,
            hearing: fee.hearing,
            color: a.id === 'building_permit' ? '#38a169' : (a.id === 'zone_change' ? '#c53030' : '#805ad5'),
        });
        totalCost += fee.fee;
        totalMonths += stepMonths;
    }"""

assert old3b in content, "FIX 3b: search string not found!"
content = content.replace(old3b, new3b, 1)
print("FIX 3b applied: entitlement path loop with size-based timelines")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\nAll fixes applied. File size: {len(original)} -> {len(content)} bytes (+{len(content)-len(original)})")
