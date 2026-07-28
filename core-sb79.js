// ============================================================
//  CORE SB 79 — Land to Yield Portal Suite
//  Rules engine for California Senate Bill 79 ("Abundant and
//  Affordable Homes Near Transit Act", Gov. Code §65912.155-162)
//  as implemented by City of LA Department of City Planning
//  (Phased Implementation Model, CPC-2026-1798-MSC; Low-Rise Ord.
//  188967 + Phased Implementation Ord. 188968 effective 2026-06-30).
//  Statewide operative: July 1, 2026.
//
//  UNDERWRITE RULE (City of LA): Prefer ZIMAS SB 79 eligibility
//  maps and local ordinances over pure statutory tier floors.
//  SCAG TOD stop maps and City working maps have diverged on some
//  planned corridors — confirm map source before LOI underwriting.
//
//  Used by: sb79.html (primary), app.html, agent.html
//  Depends on: core-geo.js (METRO_STATIONS, haversine), shared.js
// ============================================================

/** Policy meta — bump when ords/maps change */
SB79_POLICY_META = {
    asOf: '2026-07-25',
    statewideEffective: '2026-07-01',
    laLowRiseOrd: '188967',
    laPhasedOrd: '188968',
    laOrdsEffective: '2026-06-30',
    underwriteFirst: 'ZIMAS local eligibility maps',
    caveat: 'City of LA phased path toward ~2030 alternative plan; Low-Rise retention and temporary exemptions reduce near-term study-ready set vs pure statute.',
    planningUrl: 'https://planning.lacity.gov/resources/senate-bill-sb-79',
    zimasUrl: 'https://zimas.lacity.org/',
};

// === STATUTORY DEVELOPMENT STANDARDS ===
// Gov. Code §65912.157(a) Table — six (tier × distance band) cells.
// Density values are in du/acre; FAR is unitless; height_ft is per
// LA Planning Phased Implementation Model assumptions.
SB79_ENVELOPE = {
    'tier1-adjacent': { density: 160, far: 4.5, height: 95, label: 'Tier 1 / 200 feet',  parking: 0   },
    'tier1-inner':    { density: 120, far: 3.5, height: 95, label: 'Tier 1 / ¼ mile',    parking: 0   },
    'tier1-outer':    { density: 100, far: 3.0, height: 95, label: 'Tier 1 / ½ mile',    parking: 0.5 },
    'tier2-adjacent': { density: 140, far: 4.0, height: 85, label: 'Tier 2 / 200 feet',  parking: 0   },
    'tier2-inner':    { density: 100, far: 3.0, height: 85, label: 'Tier 2 / ¼ mile',    parking: 0   },
    'tier2-outer':    { density:  80, far: 2.5, height: 85, label: 'Tier 2 / ½ mile',    parking: 0.5 },
};

// Distance band thresholds (miles)
SB79_DISTANCE_BANDS = {
    adjacent: 0.038,  // 200 feet ≈ 0.0379 mi
    inner:    0.25,   // 1/4 mile
    outer:    0.50,   // 1/2 mile
};

// === PERMANENT EXCLUSIONS ===
// Industrial Employment Hubs (§65912.160(e)(2)) — six contiguous
// industrial areas ≥ 250 acres identified by LA Planning.
// Approximate centroids and bounding circles (mi radius).
SB79_INDUSTRIAL_HUBS = [
    { name: 'LAX',                    centroid: { lat: 33.945, lon: -118.408 }, radius: 1.8, sites: 297,  acreage: 3623 },
    { name: 'Van Nuys',               centroid: { lat: 34.218, lon: -118.487 }, radius: 1.6, sites: 1733, acreage: 2383 },
    { name: 'Downtown / Southeast LA',centroid: { lat: 34.000, lon: -118.230 }, radius: 1.5, sites: 3077, acreage: 1758 },
    { name: 'Chatsworth',             centroid: { lat: 34.245, lon: -118.595 }, radius: 1.2, sites: 1023, acreage: 1282 },
    { name: 'Pacoima',                centroid: { lat: 34.260, lon: -118.420 }, radius: 0.9, sites: 442,  acreage: 664  },
    { name: 'Atwater / Cypress Park', centroid: { lat: 34.110, lon: -118.250 }, radius: 0.7, sites: 413,  acreage: 312  },
];

// === EXEMPTION PATHWAYS ===
// Eight temporary exemption pathways under §65912.161(b)(1).
// Six site-level, two TOD-zone-level. Aggregate counts from
// LA Planning Exhibit 4 Table 1A (May 5, 2026 snapshot).
SB79_EXEMPTION_PATHWAYS = [
    { id: 'A',     statute: '§65912.161(b)(1)(A)',
      level: 'site',
      label: 'Site permits ≥ 50% of SB 79 capacity',
      description: 'Local zoning (base + bonus) already permits both density and RFAR at no less than 50% of the SB 79 standards.',
      laCount: 46526, laPct: 34.34,
      laCountWithLowRise: 17562, laPctWithLowRise: 12.59,
    },
    { id: 'B(i)',  statute: '§65912.161(b)(1)(B)(i)',
      level: 'zone',
      label: 'TOD Zone meets 33%/75% capacity threshold',
      description: 'At least 33% of sites in the TOD Zone permit ≥50% of SB 79 standards AND total local capacity ≥75% of SB 79 aggregate.',
      laCount: 74, laPct: 51.00,
      unit: 'TOD zones',
    },
    { id: 'B(ii)', statute: '§65912.161(b)(1)(B)(ii)',
      level: 'zone',
      label: 'Primarily low-resource TOD Zone with ≥ 40% capacity',
      description: 'TOD Zone is primarily (plurality methodology) low-resource AND sites cumulatively permit ≥ 40% of SB 79 capacity.',
      laCount: 80, laPct: 55.10,
      unit: 'TOD zones',
    },
    { id: 'B(iii)',statute: '§65912.161(b)(1)(B)(iii)',
      level: 'site',
      label: 'Low-resource TCAC site within capable jurisdiction',
      description: 'Parcel is in a Low Resource area on the CTCAC/HCD Opportunity Map AND jurisdiction permits ≥ 50% of SB 79 aggregate.',
      laCount: 75704, laPct: 55.88,
    },
    { id: 'C',     statute: '§65912.161(b)(1)(C)',
      level: 'site',
      label: 'Local TOD alternative plan',
      description: 'Site is covered by a local TOD alternative plan adopted under §65912.161(a) requiring net capacity gain.',
      laCount: 0, laPct: 0.00,
    },
    { id: 'D',     statute: '§65912.161(b)(1)(D)',
      level: 'site',
      label: 'Very High Fire Hazard Severity Zone',
      description: 'Site is in a VHFHSZ per CalFire (Public Resources Code §5118) or state responsibility area.',
      laCount: 12910, laPct: 10.59,
    },
    { id: 'E',     statute: '§65912.161(b)(1)(E)',
      level: 'site',
      label: 'Sea Level Rise Vulnerable',
      description: 'Site is in an area vulnerable to one foot of sea level rise per NOAA/OPC/USGS/UC/local assessment.',
      laCount: 0, laPct: 0.00,
    },
    { id: 'F',     statute: '§65912.161(b)(1)(F)',
      level: 'site',
      label: 'Historic Resource (pre-2025 designation)',
      description: 'Site has a historic resource designation on a local register as of January 1, 2025 (HCM or HPOZ in LA).',
      laCount: 7689, laPct: 6.31,
    },
];

// === STATUTORILY EXEMPT ZONES ===
// Public Facilities, Parking, and Open Space zones do not permit
// residential or commercial uses → not subject to SB 79.
SB79_STATUTORY_EXEMPT_ZONES = ['PF', 'PF(UV)', 'P', 'PB', 'OS', 'OS1', 'OS(PV)', 'OS(UV)', 'P1', 'P2', 'FWY', 'FRWY'];

// APN-level status styles used by public and developer map overlays.
SB79_STATUS_STYLES = {
    study_ready: {
        label: 'Available to Study',
        color: '#2f855a',
        fillColor: '#48bb78',
        description: 'No permanent/statutory exclusion or temporary exemption flag in Table 1C.',
    },
    temporary_hold: {
        label: 'Temporary Exemption',
        color: '#b7791f',
        fillColor: '#ecc94b',
        description: 'In the phased universe, but one or more temporary exemption pathways apply.',
    },
    excluded: {
        label: 'Excluded / Not Study-Ready',
        color: '#c53030',
        fillColor: '#f56565',
        description: 'Permanent exclusion or statutory exemption flag applies.',
    },
    outside_dataset: {
        label: 'Not in Table 1C',
        color: '#4a5568',
        fillColor: '#a0aec0',
        description: 'APN was not found in the normalized LA Table 1C lookup.',
    },
};

// === CITYWIDE FUNNEL (Exhibit 4 Table 1A, May 5, 2026) ===
SB79_LA_FUNNEL = {
    totalTodZoneSites:      138192,
    statutoryExempt:          3976,
    permanentExclusionWalk:    341,
    permanentExclusionHub:    2377,
    eligibleSitesInLA:      135474,
    finalPhasedLowRiseSites:139450,
    studyReadyNoFlags:       13585,
    temporaryExemptionSites:121888,
    sitesWithLowRiseRetained:17562,
    totalLocalUnits:       2885702,
    totalSb79Units:        2893063,
    totalLocalBuildingSf: 3194396578,
    totalSb79BuildingSf:  3704362693,
    numTodZones:               145,
};

// Shard cache avoids repeated fetches while map overlays color many parcels.
SB79_SHARD_CACHE = {};

// === HELPERS ===

// Compute distance band for a given mile distance from station
function getDistanceBand(distMi) {
    if (distMi <= SB79_DISTANCE_BANDS.adjacent) return 'adjacent';
    if (distMi <= SB79_DISTANCE_BANDS.inner)    return 'inner';
    if (distMi <= SB79_DISTANCE_BANDS.outer)    return 'outer';
    return 'beyond';
}

// Find nearest qualifying transit station
// Returns { station, distMi, distFt, tier, distanceBand, envelope }
function getNearestStation(lat, lon) {
    if (typeof METRO_STATIONS === 'undefined') {
        console.warn('METRO_STATIONS not loaded (core-geo.js required)');
        return null;
    }
    let nearest = null;
    let nearestDist = Infinity;
    for (let i = 0; i < METRO_STATIONS.length; i++) {
        const s = METRO_STATIONS[i];
        const d = haversine(lat, lon, s.lat, s.lon);
        if (d < nearestDist) { nearestDist = d; nearest = s; }
    }
    if (!nearest) return null;
    const band = getDistanceBand(nearestDist);
    const envelopeKey = 'tier' + nearest.tier + '-' + (band === 'beyond' ? 'outer' : band);
    return {
        station: nearest,
        distMi: nearestDist,
        distFt: Math.round(nearestDist * 5280),
        tier: nearest.tier,
        distanceBand: band,
        envelope: band === 'beyond' ? null : SB79_ENVELOPE[envelopeKey],
    };
}

// Compute development envelope for a site given lot SF, tier, band
function computeEnvelope(lotSf, tier, distanceBand) {
    if (distanceBand === 'beyond' || !lotSf) return null;
    const key = 'tier' + tier + '-' + distanceBand;
    const env = SB79_ENVELOPE[key];
    if (!env) return null;
    const lotAcres = lotSf / 43560;
    return {
        maxUnits:    Math.floor(lotAcres * env.density),
        maxGfa:      Math.floor(lotSf * env.far),
        maxHeight:   env.height,
        maxFar:      env.far,
        parkingRatio:env.parking,
        densityDuAc: env.density,
        label:       env.label,
    };
}

// Check if coordinates fall inside any Industrial Employment Hub
function inIndustrialHub(lat, lon) {
    for (const hub of SB79_INDUSTRIAL_HUBS) {
        const d = haversine(lat, lon, hub.centroid.lat, hub.centroid.lon);
        if (d <= hub.radius) return hub;
    }
    return null;
}

function normalizeSb79Phase(compact) {
    if (!compact) return null;
    const phaseMap = { e: 'eligible', t: 'temp_exempt', x: 'permanent_exclude', s: 'statutory_exempt' };
    return phaseMap[compact.p] || compact.phase || null;
}

function getSb79StudyStatus(record) {
    const phase = normalizeSb79Phase(record);
    if (phase === 'eligible') return Object.assign({ key: 'study_ready' }, SB79_STATUS_STYLES.study_ready);
    if (phase === 'temp_exempt') return Object.assign({ key: 'temporary_hold' }, SB79_STATUS_STYLES.temporary_hold);
    if (phase === 'permanent_exclude' || phase === 'statutory_exempt') return Object.assign({ key: 'excluded' }, SB79_STATUS_STYLES.excluded);
    return Object.assign({ key: 'outside_dataset' }, SB79_STATUS_STYLES.outside_dataset);
}

function getSb79SourceInfo(compact) {
    compact = compact || {};
    const meta = (typeof SB79_DATA_META !== 'undefined' && SB79_DATA_META) ? SB79_DATA_META : {};
    const policy = (typeof SB79_POLICY_META !== 'undefined' && SB79_POLICY_META) ? SB79_POLICY_META : {};
    return {
        source: meta.source || 'LA Department of City Planning - Table 1C',
        sourcePdf: compact.sourcePdf || meta.sourcePdf || 'Regulation/Table_1C-Sites_Eligible_for_Phased_Implementation.pdf',
        sourceUrl: meta.sourceUrl || policy.planningUrl || '',
        sourcePage: compact.sp || compact.sourcePage || null,
        snapshotDate: meta.snapshotDate || '2026-05-05',
        cpcMeetingDate: meta.cpcMeetingDate || '2026-05-14',
        determinationMailingDate: meta.determinationMailingDate || '2026-05-19',
        extractedAt: meta.extractedAt || '2026-05-22',
        rowHash: compact.rh || compact.sourceRowHash || '',
        laOrds: (policy.laLowRiseOrd || '') + '/' + (policy.laPhasedOrd || ''),
        underwriteFirst: policy.underwriteFirst || 'ZIMAS',
        asOf: policy.asOf || '2026-07-25',
    };
}

/** Human disclaimer for UI footers */
function getSb79UnderwriteDisclaimer() {
    const p = (typeof SB79_POLICY_META !== 'undefined' && SB79_POLICY_META) ? SB79_POLICY_META : {};
    return 'SB 79 screening only (as of ' + (p.asOf || '2026-07') + '). Underwrite ZIMAS eligibility and LA Ords ' +
        (p.laLowRiseOrd || '188967') + '/' + (p.laPhasedOrd || '188968') +
        ' before relying on statutory tier floors. Not legal advice.';
}

function getBaseZoneFromZoning(zoning) {
    const z = String(zoning || '').toUpperCase();
    const match = z.match(/\b(R1|R2|R3|R4|R5|C1\.5|C1|C2|C4|C5|CM|M1|M2|M3|PF|OS|LAX)\b/);
    return match ? match[1] : '';
}

function estimateBaseZoningEnvelope(lotSf, zoning) {
    const baseZone = getBaseZoneFromZoning(zoning);
    const lot = Number(lotSf) || 0;
    const acres = lot > 0 ? lot / 43560 : 0;
    const table = {
        R1: { density: 9, far: 0.45, height: 33 },
        R2: { density: 18, far: 0.75, height: 33 },
        R3: { density: 54, far: 3.0, height: 45 },
        R4: { density: 108, far: 3.0, height: 75 },
        R5: { density: 217, far: 6.0, height: 150 },
        C1: { density: 54, far: 1.5, height: 45 },
        'C1.5': { density: 72, far: 1.5, height: 45 },
        C2: { density: 108, far: 3.0, height: 75 },
        C4: { density: 108, far: 6.0, height: 150 },
        C5: { density: 72, far: 1.5, height: 45 },
        CM: { density: 0, far: 1.5, height: 45 },
        M1: { density: 0, far: 1.5, height: 45 },
        M2: { density: 0, far: 1.5, height: 45 },
        M3: { density: 0, far: 1.5, height: 45 },
        PF: { density: 0, far: 0, height: 0 },
        OS: { density: 0, far: 0, height: 0 },
    };
    const env = table[baseZone] || null;
    if (!env || !lot) {
        return {
            label: baseZone ? baseZone + ' base zoning' : 'Base zoning',
            confidence: 'low',
            note: 'Base-zoning yield requires parcel-specific zoning, overlays, and dimensional standards.',
        };
    }
    return {
        label: baseZone + ' base zoning',
        maxUnits: Math.max(0, Math.floor(acres * env.density)),
        maxGfa: Math.max(0, Math.floor(lot * env.far)),
        maxHeight: env.height,
        maxFar: env.far,
        densityDuAc: env.density,
        confidence: 'low',
        note: 'Screening estimate only; verify base zone, overlays, RSO, and site dimensions.',
    };
}

function buildSb79ScenarioSet(record, parcelFacts) {
    parcelFacts = parcelFacts || {};
    const lotSf = Number(parcelFacts.lotSf || parcelFacts.lotSizeSqFt || parcelFacts.parcelSize || 0);
    const status = getSb79StudyStatus(record);
    const base = estimateBaseZoningEnvelope(lotSf, record.zoning || record.zn);
    const sb79Env = lotSf ? computeEnvelope(lotSf, record.tier || record.t, record.distanceBand) : null;
    return {
        status: status,
        lotSf: lotSf || null,
        monetizationStage: status.key === 'study_ready' ? 'pro_underwrite' : status.key === 'temporary_hold' ? 'watchlist' : 'exclude_or_verify',
        scenarios: [
            {
                id: 'base_zoning',
                label: 'Base zoning',
                eligibilityStatus: base.maxUnits || base.maxGfa ? 'screening_estimate' : 'needs_verification',
                confidence: base.confidence,
                envelope: base,
                source: 'Land to Yield screening assumptions',
            },
            {
                id: 'low_rise_retained',
                label: 'Local / Low-Rise retained capacity',
                eligibilityStatus: record.phasedLowRise || record.lr ? 'potentially_available' : 'needs_verification',
                confidence: 'medium',
                envelope: null,
                source: 'LA Low-Rise Ordinance / phased implementation materials',
                note: 'Table 1C confirms the APN is in the final Low-Rise phased universe; parcel-level Low-Rise yield needs zoning module verification.',
            },
            {
                id: 'sb79_statutory',
                label: 'SB 79 statutory envelope',
                eligibilityStatus: status.key === 'excluded' ? 'blocked' : status.key === 'temporary_hold' ? 'temporary_hold' : 'study_ready',
                confidence: sb79Env ? 'high' : 'medium',
                envelope: sb79Env,
                source: 'Gov. Code 65912.157 table, applied to Table 1C tier/distance band',
                note: status.description,
            },
        ],
    };
}

// Expand compact Table 1C shard record (see scripts/ingest_table_1c.py).
function expandSb79Record(compact, cleanApn) {
    if (!compact) return compact;
    if (compact.phase && !compact.p) return compact;
    const bandMap = { a: 'adjacent', i: 'inner', o: 'outer' };
    const pathwayLabels = {
        'A': 'Site permits ≥ 50% of SB 79 capacity',
        'B(i)': 'TOD Zone meets 33%/75% capacity threshold',
        'B(ii)': 'Primarily low-resource TOD Zone with ≥ 40% capacity',
        'B(iii)': 'Low-resource TCAC site within capable jurisdiction',
        'C': 'Local TOD alternative plan',
        'D': 'Very High Fire Hazard Severity Zone',
        'E': 'Sea Level Rise Vulnerable',
        'F': 'Historic Resource (pre-2025 designation)',
        'TEMP': 'Temporary exemption flag in Table 1C',
    };
    const phase = normalizeSb79Phase(compact);
    const tier = compact.t || compact.tier || null;
    const band = bandMap[compact.b] || compact.distanceBand || null;
    const permanentExclusions = [];
    const pe = compact.pe || '';
    if (pe.indexOf('w') !== -1) {
        permanentExclusions.push({
            pathway: '§65912.160(e)(1)',
            reason: 'Site is more than one-mile walking distance from the SB 79 TOD stop.',
        });
    }
    if (pe.indexOf('h') !== -1) {
        permanentExclusions.push({
            pathway: '§65912.160(e)(2)',
            reason: 'Site is within an Industrial Employment Hub.',
        });
    }
    if (compact.se && !permanentExclusions.length) {
        permanentExclusions.push({
            pathway: 'Statutory exemption',
            reason: 'Site is in a statutorily exempt zone or use class in Table 1C.',
        });
    }
    const exemptions = (compact.x || []).map(function(pid) {
        return { pathway: pid, applies: true, reason: pathwayLabels[pid] || String(pid) };
    });
    let envelope = compact.envelope || null;
    if (!envelope && tier && band) {
        const key = 'tier' + tier + '-' + band;
        const env = SB79_ENVELOPE[key];
        if (env) {
            envelope = {
                densityDuAc: env.density,
                maxFar: env.far,
                maxHeight: env.height,
                label: env.label,
            };
        }
    }
    const dashed = cleanApn.length === 10
        ? cleanApn.slice(0, 4) + '-' + cleanApn.slice(4, 7) + '-' + cleanApn.slice(7)
        : cleanApn;
    const sourceInfo = getSb79SourceInfo(compact);
    const expanded = {
        found: true,
        eligible: compact.el !== undefined ? compact.el : compact.eligible,
        phase: phase,
        phaseStatusCode: compact.ps || compact.phaseStatusCode || null,
        phasedStatus: compact.ps === 'phased_low_rise'
            ? 'Eligible for phased implementation with Low-Rise Ordinance adoption'
            : (compact.phasedStatus || null),
        phasedLowRise: compact.lr !== undefined ? !!compact.lr : !!compact.phasedLowRise,
        statutoryExempt: !!compact.se,
        tier: tier,
        distanceBand: band,
        station: { name: compact.tz || (compact.station && compact.station.name) || '', tierDist: compact.td || '' },
        envelope: envelope,
        exemptions: exemptions.length ? exemptions : (compact.exemptions || []),
        permanentExclusions: permanentExclusions.length ? permanentExclusions : (compact.permanentExclusions || []),
        notes: compact.notes || [
            'LA Planning Table 1C snapshot ' + sourceInfo.snapshotDate + '.',
            'Source page ' + (sourceInfo.sourcePage || 'not captured') + ' in the phased implementation materials.',
        ],
        sourceVersion: compact.sourceVersion || 'table-1c-2026-05-05',
        source: sourceInfo,
        zoning: compact.zn || compact.zoning,
        zoningIncentiveProgramEligibility: compact.zi || compact.zoningIncentiveProgramEligibility || '',
        apn: dashed,
    };
    expanded.studyStatus = getSb79StudyStatus(expanded);
    expanded.mapStyle = expanded.studyStatus;
    expanded.buildableLayers = buildSb79ScenarioSet(expanded, compact.parcelFacts || {});
    return expanded;
}

// Resolve a lat/lon point to the LA County parcel that actually contains it,
// via the same public ArcGIS parcel layer LA Planning's own maps use. Returns
// the clean 10-digit AIN string, or null if no parcel was found there.
async function resolveApnFromLatLon(lat, lon) {
    if (typeof PARCEL_QUERY_URL === 'undefined') return null;
    try {
        const url = PARCEL_QUERY_URL + '?' + new URLSearchParams({
            geometry: lon + ',' + lat,
            geometryType: 'esriGeometryPoint',
            inSR: '4326',
            spatialRel: 'esriSpatialRelIntersects',
            outFields: 'AIN',
            returnGeometry: 'false',
            f: 'json',
        }).toString();
        const resp = await fetch(url);
        if (!resp.ok) return null;
        const data = await resp.json();
        const ain = data.features && data.features[0] && data.features[0].attributes && data.features[0].attributes.AIN;
        return ain ? String(ain).replace(/[^0-9]/g, '') : null;
    } catch (e) {
        console.warn('Parcel resolve from coordinates failed:', e);
        return null;
    }
}

// === MAIN ELIGIBILITY LOOKUP ===
// lookupAPN(apn) — async: queries sharded JSON; falls back to coordinate-based
//   logic if no data layer is loaded.
// Returns: {
//   apn, found, eligible, status, tier, distanceBand, station, envelope,
//   exemptions: [{pathway, applies, reason}], permanentExclusions: [...],
//   phase: 'eligible' | 'temp_exempt' | 'permanent_exclude' | 'statutory_exempt',
//   notes: [string]
// }
async function lookupAPN(apn, opts) {
    opts = opts || {};
    const result = {
        apn:                 (typeof formatAPN === 'function') ? formatAPN(apn) : apn,
        found:               false,
        eligible:            null,
        phase:               null,
        tier:                null,
        distanceBand:        null,
        station:             null,
        envelope:            null,
        exemptions:          [],
        permanentExclusions: [],
        notes:               [],
    };

    // 1. Try sharded JSON lookup (if APN database is loaded)
    if (typeof SB79_APN_INDEX !== 'undefined' && SB79_APN_INDEX) {
        const cleanApn = String(apn).replace(/[^0-9]/g, '');
        const shardId = SB79_APN_INDEX[cleanApn];
        if (shardId !== undefined) {
            try {
                if (!SB79_SHARD_CACHE[shardId]) {
                    const resp = await fetch('sb79-data/apn-shards/shard-' + shardId + '.json');
                    SB79_SHARD_CACHE[shardId] = await resp.json();
                }
                const shard = SB79_SHARD_CACHE[shardId];
                const record = shard[cleanApn];
                if (record) {
                    return expandSb79Record(record, cleanApn);
                }
            } catch (e) {
                console.warn('SB79 APN shard fetch failed:', e);
            }
        }
    }

    // 2. Resolve the actual parcel APN from coordinates, then re-run the
    // authoritative Table 1C lookup on that real APN, instead of guessing
    // tier/band from straight-line distance to a hardcoded station list.
    if (opts.lat && opts.lon) {
        const resolvedApn = await resolveApnFromLatLon(opts.lat, opts.lon);
        const alreadyTried = String(apn).replace(/[^0-9]/g, '');
        if (resolvedApn && resolvedApn !== alreadyTried) {
            const resolved = await lookupAPN(resolvedApn);
            if (resolved && resolved.found) {
                resolved.notes = (resolved.notes || []).concat([
                    'Resolved from the geocoded address to APN ' + (resolved.apn || resolvedApn) + ' via the LA County parcel service.',
                ]);
                return resolved;
            }
        }
    }

    // 3. Coordinate-radius fallback (requires lat/lon in opts) — used only when
    // the parcel resolve above found no containing parcel, or that parcel isn't
    // in the Table 1C phased-implementation universe. Approximate: straight-line
    // distance to the nearest station, not LA Planning's walking-path analysis.
    if (opts.lat && opts.lon) {
        const ns = getNearestStation(opts.lat, opts.lon);
        if (!ns || ns.distanceBand === 'beyond') {
            result.eligible = false;
            result.phase = 'outside_tod_zone';
            result.notes.push('Site is more than ½ mile from nearest qualifying TOD stop.');
            return result;
        }
        result.station = ns.station;
        result.tier = ns.tier;
        result.distanceBand = ns.distanceBand;
        result.envelope = ns.envelope;

        const hub = inIndustrialHub(opts.lat, opts.lon);
        if (hub) {
            result.eligible = false;
            result.phase = 'permanent_exclude';
            result.permanentExclusions.push({
                pathway: '§65912.160(e)(2)',
                reason:  'Located within ' + hub.name + ' Industrial Employment Hub (' + hub.acreage + ' acres, ' + hub.sites + ' sites).',
            });
            return result;
        }

        // No walking-path-distance check possible without network analysis
        result.notes.push('Walking-path distance to TOD stop not yet verified (requires LA County street network analysis).');

        if (opts.lotSf) {
            result.envelope = Object.assign({}, ns.envelope, computeEnvelope(opts.lotSf, ns.tier, ns.distanceBand));
        }

        result.eligible = true;
        result.phase = 'eligible';
        return result;
    }

    result.notes.push('No APN database record and no coordinates supplied; supply opts.lat/opts.lon for proximity check.');
    result.studyStatus = getSb79StudyStatus(result);
    result.mapStyle = result.studyStatus;
    return result;
}

// === EXEMPTION EVALUATION ===
// Given an APN + parcel data, run all 8 pathways and report verdicts.
function evaluateExemptions(parcelData) {
    parcelData = parcelData || {};
    const verdicts = SB79_EXEMPTION_PATHWAYS.map(p => {
        let applies = false;
        let reason = 'Not yet evaluated (data not loaded).';

        switch (p.id) {
            case 'A':
                if (parcelData.localDensity && parcelData.sb79Density && parcelData.localRfar && parcelData.sb79Rfar) {
                    const densOk = parcelData.localDensity >= 0.5 * parcelData.sb79Density;
                    const rfarOk = parcelData.localRfar    >= 0.5 * parcelData.sb79Rfar;
                    applies = densOk && rfarOk;
                    reason = applies
                        ? 'Local zoning permits ≥ 50% of SB 79 density AND RFAR.'
                        : 'Local zoning falls short of the 50% threshold (density: ' + (densOk?'OK':'short') + ', RFAR: ' + (rfarOk?'OK':'short') + ').';
                }
                break;
            case 'B(i)':
                if (parcelData.todZoneB1Eligible !== undefined) {
                    applies = !!parcelData.todZoneB1Eligible;
                    reason = applies
                        ? 'TOD Zone meets 33%/75% capacity threshold.'
                        : 'TOD Zone does not meet 33%/75% capacity threshold.';
                }
                break;
            case 'B(ii)':
                if (parcelData.todZoneB2Eligible !== undefined) {
                    applies = !!parcelData.todZoneB2Eligible;
                    reason = applies
                        ? 'TOD Zone is primarily low-resource AND meets 40% capacity threshold.'
                        : 'TOD Zone does not meet primarily-low-resource + 40% capacity criteria.';
                }
                break;
            case 'B(iii)':
                if (parcelData.tcacCategory !== undefined) {
                    applies = parcelData.tcacCategory === 'Low Resource' || parcelData.tcacCategory === 'low';
                    reason = applies
                        ? 'Site is in Low Resource area (TCAC); LA citywide capacity ≥ 50% of SB 79 aggregate.'
                        : 'Site is not in a Low Resource area per TCAC Opportunity Map.';
                }
                break;
            case 'C':
                applies = false;
                reason = 'LA has no adopted local TOD alternative plan (0 sites citywide).';
                break;
            case 'D':
                if (parcelData.fireHazardZone !== undefined) {
                    applies = parcelData.fireHazardZone === 'VHFHSZ' || parcelData.fireHazardZone === true;
                    reason = applies
                        ? 'Site is in a Very High Fire Hazard Severity Zone per CalFire.'
                        : 'Site is not in a Very High Fire Hazard Severity Zone.';
                }
                break;
            case 'E':
                applies = false;
                reason = 'No qualifying LA TOD-Zone parcels are within 1-ft sea level rise vulnerability.';
                break;
            case 'F':
                if (parcelData.historicDesignation !== undefined) {
                    applies = !!parcelData.historicDesignation;
                    reason = applies
                        ? 'Site is designated HCM or within an HPOZ (pre-Jan 1, 2025).'
                        : 'Site has no pre-2025 historic resource designation.';
                }
                break;
        }
        return { pathway: p.id, statute: p.statute, label: p.label, applies, reason };
    });
    return verdicts;
}

// === PRO FORMA STUB ===
// Compute a simple residual-land-value pro forma given envelope and cost inputs.
// Reuses core-finance.js / core-hbu.js when available, otherwise self-contained.
function runProForma(envelope, costInputs) {
    costInputs = costInputs || {};
    const hardCostPerSf = costInputs.hardCostPerSf || 350;
    const softMult      = costInputs.softMult      || 1.30;
    const rentPerSfMo   = costInputs.rentPerSfMo   || 4.25;
    const vacancy       = costInputs.vacancy       || 0.05;
    const opexPerUnit   = costInputs.opexPerUnit   || 8000;
    const capRate       = costInputs.capRate       || 0.055;
    const targetYoc     = costInputs.targetYoc     || 0.065;

    if (!envelope || !envelope.maxUnits || !envelope.maxGfa) {
        return null;
    }

    const units = envelope.maxUnits;
    const gfa   = envelope.maxGfa;
    const nrsf  = gfa * 0.80; // 80% net rentable assumption

    const hardCost = gfa * hardCostPerSf;
    const totalDevCost = hardCost * softMult;

    const grossRent = nrsf * rentPerSfMo * 12;
    const effRent   = grossRent * (1 - vacancy);
    const opex      = units * opexPerUnit;
    const noi       = effRent - opex;

    const exitValue = noi / capRate;
    const residualLandValue = exitValue - totalDevCost;
    const yieldOnCost = noi / totalDevCost;

    return {
        units, gfa, nrsf,
        hardCost,    totalDevCost,
        grossRent,   effRent, opex,
        noi,         exitValue,
        residualLandValue,
        yieldOnCost,
        meetsTarget: yieldOnCost >= targetYoc,
    };
}

// === EXPORTS (when used as module) ===
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SB79_ENVELOPE, SB79_DISTANCE_BANDS, SB79_INDUSTRIAL_HUBS,
        SB79_EXEMPTION_PATHWAYS, SB79_STATUTORY_EXEMPT_ZONES, SB79_LA_FUNNEL, SB79_STATUS_STYLES,
        SB79_POLICY_META,
        getDistanceBand, getNearestStation, computeEnvelope,
        inIndustrialHub, normalizeSb79Phase, getSb79StudyStatus, getSb79SourceInfo,
        getSb79UnderwriteDisclaimer,
        estimateBaseZoningEnvelope, buildSb79ScenarioSet,
        expandSb79Record, lookupAPN, evaluateExemptions, runProForma,
    };
}
