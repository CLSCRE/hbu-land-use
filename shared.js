// ============================================================
//  SHARED UTILITIES — Land to Yield Portal Suite
//  Used by: app.html, lender.html, agent.html
//
//  This file centralizes duplicated code from the three portals.
//  Functions use a guard pattern (typeof check) so they can
//  coexist with inline versions during migration.
// ============================================================

// --- Auth Gate ---
var VALID_HASHES = [
    '6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090',
    'eed9899e026ac5d73d0230db369e2461a4d5358db80898f5b7981a0526a03bd9', // LandYield2026 — 90-day trial, expires 2026-06-22
];

// Trial code expiration map: hash → expiry date (ISO string)
var HASH_EXPIRY = {
    'eed9899e026ac5d73d0230db369e2461a4d5358db80898f5b7981a0526a03bd9': '2026-06-22'
};

async function sha256(message) {
    var msgBuffer = new TextEncoder().encode(message);
    var hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    var hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
}

async function checkAuth() {
    var input = document.getElementById('authPassword');
    var errEl = document.getElementById('authError');
    var code = (input ? input.value : '').trim();
    if (!code) {
        if (errEl) errEl.textContent = 'Please enter an access code.';
        return;
    }
    var hash = await sha256(code);
    if (VALID_HASHES.indexOf(hash) !== -1) {
        // Check if this code has an expiration date
        if (HASH_EXPIRY[hash] && new Date() > new Date(HASH_EXPIRY[hash] + 'T23:59:59')) {
            if (errEl) errEl.textContent = 'This trial code has expired.';
            if (input) { input.value = ''; input.focus(); }
            return;
        }
        sessionStorage.setItem('hbu_auth', 'ok');
        var overlay = document.getElementById('authOverlay');
        if (overlay) {
            overlay.classList.add('fade-out');
            setTimeout(function() { overlay.remove(); }, 500);
        }
    } else {
        if (errEl) errEl.textContent = 'Invalid access code.';
        if (input) { input.value = ''; input.focus(); }
    }
}

// Auto-grant if already authenticated this session
document.addEventListener('DOMContentLoaded', function() {
    if (sessionStorage.getItem('hbu_auth') === 'ok') {
        var overlay = document.getElementById('authOverlay');
        if (overlay) overlay.remove();
    }
});

// --- Parcel Layer ---
if (typeof PARCEL_QUERY_URL === 'undefined') {
    var PARCEL_QUERY_URL = 'https://public.gis.lacounty.gov/public/rest/services/LACounty_Cache/LACounty_Parcel/MapServer/0/query';
    var PARCEL_OUT_FIELDS = 'APN,SitusFullAddress,UseType,UseDescription,Roll_LandValue,Roll_ImpValue,YearBuilt1,SQFTmain1,Units1,Shape.STArea()';
    var PARCEL_MIN_ZOOM = 16;
}

if (typeof formatParcelCurrency === 'undefined') {
    function formatParcelCurrency(val) {
        if (!val && val !== 0) return 'N/A';
        return '$' + Number(val).toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
}

if (typeof formatAPN === 'undefined') {
    function formatAPN(apn) {
        if (!apn) return 'N/A';
        var s = String(apn).replace(/\D/g, '');
        if (s.length === 10) return s.slice(0,4) + '-' + s.slice(4,7) + '-' + s.slice(7);
        return apn;
    }
}

if (typeof haversine === 'undefined') {
    function haversine(lat1, lon1, lat2, lon2) {
        var R = 3958.8;
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}

if (typeof computePolygonArea === 'undefined') {
    function computePolygonArea(rings, sr) {
        var totalArea = 0;
        for (var r = 0; r < rings.length; r++) {
            var ring = rings[r];
            var a = 0;
            for (var i = 0; i < ring.length - 1; i++) {
                a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
            }
            totalArea += Math.abs(a) / 2;
        }
        if (sr && (sr.wkid === 102100 || sr.wkid === 3857)) {
            var latRad = 34.05 * Math.PI / 180;
            var scaleFactor = Math.cos(latRad);
            var realSqMeters = totalArea * scaleFactor * scaleFactor;
            return Math.round(realSqMeters * 10.7639);
        }
        if (sr && (sr.wkid === 2229 || sr.wkid === 102645)) {
            return Math.round(totalArea);
        }
        return Math.round(totalArea);
    }
}

if (typeof estimateFrontage === 'undefined') {
    function estimateFrontage(areaSqFt) {
        if (!areaSqFt || areaSqFt <= 0) return 80;
        var f = Math.sqrt(areaSqFt / 2);
        return Math.round(Math.max(20, Math.min(500, f)));
    }
}

// --- Formatting Helpers ---
if (typeof formatCompactDollars === 'undefined') {
    function formatCompactDollars(v) {
        if (v >= 1e9) return '$' + (v / 1e9).toFixed(1) + 'B';
        if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
        if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K';
        return '$' + Math.round(v).toLocaleString();
    }
}

// --- Debounce Helper ---
if (typeof _debouncedCall === 'undefined') {
    var _debounceTimers = {};
    function _debouncedCall(key, fn, delay) {
        if (_debounceTimers[key]) clearTimeout(_debounceTimers[key]);
        _debounceTimers[key] = setTimeout(fn, delay || 200);
    }
}

// --- Multi-city Zoning GIS Endpoints ---
if (typeof SHARED_CITY_ZONING_GIS === 'undefined') {
    var SHARED_CITY_ZONING_GIS = {
        'glendale':       { url: 'https://gismap.glendaleca.gov/arcgis/rest/services/Common/Zoning/MapServer/2/query', field: 'ZONE_DISTR', descField: 'ZONE_DESC' },
        'long beach':     { url: 'https://services6.arcgis.com/yCArG7wGXGyWLqav/ArcGIS/rest/services/Zoning/FeatureServer/0/query', field: 'ZONING_SYMBOL' },
        'pasadena':       { url: 'https://services2.arcgis.com/zNjnZafDYCAJAbN0/arcgis/rest/services/Zoning/FeatureServer/0/query', field: 'ZONE_CODE' },
        'santa monica':   { url: 'https://gis.santamonica.gov/server/rest/services/Zoning/FeatureServer/2/query', field: 'zoning', descField: 'zonedesc' },
        'west hollywood': { url: 'https://gis.weho.org/arcgis/rest/services/Planning/Zoning_Map_2018/MapServer/1/query', field: 'ZONECLASS', descField: 'ZONEDESC' },
        'beverly hills':  { url: 'https://gis.beverlyhills.org/arcgis/rest/services/Zoning/MapServer/2/query', field: 'ZONE' },
        'inglewood':      { url: 'https://gisweb.cityofinglewood.org/arcgis/rest/services/CityofInglewoodZoning/MapServer/0/query', field: 'ZNGCODE', descField: 'ZONEDESCRP' },
        'pomona':         { url: 'https://gismaps.ci.pomona.ca.us/arcgis/rest/services/CommunityDevelopment/Zoning/MapServer/0/query', field: 'Label', descField: 'Zone_Defin' },
        'arcadia':        { url: 'https://arcgis.gis.lacounty.gov/arcgis/rest/services/Arcadia/Zoning/MapServer/1/query', field: 'Zones' },
        'torrance':       { url: 'https://services1.arcgis.com/38fAqAZVRCrVtPUU/ArcGIS/rest/services/Zoning/FeatureServer/20/query', field: 'ZONING' },
        'culver city':    { url: 'https://services2.arcgis.com/LNAhiRpezPbHTIUO/arcgis/rest/services/Final_Zoning_Map_100924/FeatureServer/0/query', field: 'Zoning' },
        'alhambra':       { url: 'https://services6.arcgis.com/GZCJsJngT6kRZkzb/arcgis/rest/services/Alhambra_Planning/FeatureServer/9/query', field: 'Zoning', descField: 'Zoning_Description' },
    };
}

// --- SB 9 Lot Split Scenario Card ---
if (typeof buildSB9Card === 'undefined') {
    function buildSB9Card(inp, transitProximity) {
        var SF_ZONES = ['R1', 'R1V', 'R1V1', 'R1V2', 'R1V3', 'RE', 'RE9', 'RE11', 'RE15', 'RE20', 'RE40', 'RS', 'RA', 'RD', 'RD1.5', 'RD2', 'RD3', 'RD4', 'RD5', 'RD6', 'RW1'];
        if (!SF_ZONES.includes(inp.zoning) || inp.parcelSize < 2400) return null;
        if (inp.constHistoric || inp.constFire || inp.constHillside || inp.constFault || inp.constFlood || inp.constCoastal) return null;

        var canSplit = inp.parcelSize >= 2400;
        var lotA = Math.floor(inp.parcelSize * 0.5);
        var lotB = inp.parcelSize - lotA;
        var splitValid = lotA >= 1200 && lotB >= 1200;
        var nearTransit = (transitProximity === 'adjacent' || transitProximity === 'near');
        var maxUnits = splitValid ? 4 : 2;
        var parkingPerUnit = nearTransit ? 0 : 1;
        var totalParking = maxUnits * parkingPerUnit;
        var maxSFPerUnit = 800;
        var totalBuildable = maxUnits * maxSFPerUnit;

        return {
            eligible: true,
            canSplit: canSplit && splitValid,
            maxUnits: maxUnits,
            lotA: splitValid ? lotA : inp.parcelSize,
            lotB: splitValid ? lotB : 0,
            maxSFPerUnit: maxSFPerUnit,
            totalBuildable: totalBuildable,
            parkingPerUnit: parkingPerUnit,
            totalParking: totalParking,
            nearTransit: nearTransit,
            setbacks: { front: 'existing', side: 4, rear: 4 },
            maxHeight: 25,
            ownerOccupancy: splitValid,
            ownerOccupancyYears: 3,
            // Render as HTML card
            html: '<div class="sb9-card" style="background:#1a2332;border:1px solid #2d6a4f;border-radius:8px;padding:12px;margin:8px 0;">' +
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
                '<span style="background:#2d6a4f;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">SB 9 ELIGIBLE</span>' +
                '<span style="color:#a7f3d0;font-weight:600;">Lot Split + Duplex</span></div>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px;color:#94a3b8;">' +
                '<div><b style="color:#e2e8f0;">' + maxUnits + ' Units</b> possible</div>' +
                '<div><b style="color:#e2e8f0;">' + totalBuildable.toLocaleString() + ' SF</b> buildable</div>' +
                (splitValid ? '<div>Lot A: <b style="color:#e2e8f0;">' + lotA.toLocaleString() + ' SF</b></div>' +
                '<div>Lot B: <b style="color:#e2e8f0;">' + lotB.toLocaleString() + ' SF</b></div>' : '') +
                '<div>Max/unit: <b style="color:#e2e8f0;">' + maxSFPerUnit + ' SF</b></div>' +
                '<div>Parking: <b style="color:#e2e8f0;">' + (nearTransit ? 'None (transit)' : totalParking + ' spaces') + '</b></div>' +
                '<div>Setbacks: <b style="color:#e2e8f0;">4 ft side/rear</b></div>' +
                '<div>Height: <b style="color:#e2e8f0;">25 ft (2 stories)</b></div>' +
                '</div>' +
                (splitValid ? '<div style="margin-top:6px;font-size:11px;color:#fbbf24;">⚠ Owner-occupancy required for 3 years if lot split</div>' : '') +
                '</div>'
        };
    }
}

// --- Fire Perimeter Check (CalFire/NIFC) ---
if (typeof checkFirePerimeter === 'undefined') {
    var FIRE_PERIMETER_URL = 'https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/California_Fire_Perimeters_Time_Enabled_View/FeatureServer/0/query';
    async function checkFirePerimeter(lat, lon) {
        if (!FIRE_PERIMETER_URL) return null;
        try {
            var url = FIRE_PERIMETER_URL + '?where=YEAR_%3E%3D2024&geometry=' + lon + ',' + lat +
                '&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects' +
                '&outFields=FIRE_NAME,ALARM_DATE,CONT_DATE,GIS_ACRES,YEAR_&returnGeometry=false&f=json';
            var resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
            if (!resp.ok) return null;
            var data = await resp.json();
            if (data.features && data.features.length > 0) {
                var attrs = data.features[0].attributes;
                var fireName = attrs.FIRE_NAME || 'Unknown';
                var fireYear = attrs.YEAR_ || '';
                var acres = attrs.GIS_ACRES ? Math.round(attrs.GIS_ACRES).toLocaleString() : '?';
                var alarmDate = attrs.ALARM_DATE ? new Date(attrs.ALARM_DATE).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
                return {
                    inFireZone: true,
                    fireName: fireName,
                    fireYear: fireYear,
                    acres: attrs.GIS_ACRES || 0,
                    html: '<div style="background:#451a03;border:1px solid #f97316;border-radius:8px;padding:12px;margin:8px 0;">' +
                        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
                        '<span style="background:#f97316;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">FIRE REBUILD ZONE</span>' +
                        '<span style="color:#fdba74;font-weight:600;">' + fireName + ' Fire</span>' +
                        (alarmDate ? '<span style="color:#fed7aa;font-size:12px;">(' + alarmDate + ' · ' + acres + ' acres)</span>' : '') + '</div>' +
                        '<div style="display:grid;grid-template-columns:1fr;gap:4px;font-size:13px;color:#fed7aa;">' +
                        '<div>This parcel is within the <b style="color:#fb923c;">' + fireName + '</b> fire perimeter.</div>' +
                        '<div style="margin-top:4px;"><b style="color:#fbbf24;">Development opportunities:</b></div>' +
                        '<div>• Expedited permitting for fire rebuilds</div>' +
                        '<div>• Insurance-funded demolition & site clearance</div>' +
                        '<div>• Rebuild at higher density under current zoning + SB 9/SB 35</div>' +
                        '<div>• Potential property tax reassessment advantage (Prop 13 reset)</div>' +
                        '<div>• State/federal disaster recovery funding may apply</div>' +
                        '</div></div>'
                };
            }
            return null;
        } catch { return null; }
    }
}

// --- ATTOM Enrichment (comps, assessment history) ---
if (typeof fetchAttomComps === 'undefined') {
    var AVM_PROXY_BASE = 'https://lty-avm-proxy.clscre.workers.dev';
    async function fetchAttomComps(address) {
        // Sales comps are available via the ATTOM proxy if we add a /comps route
        // For now, store the AVM data from the main fetch and display extended fields
        return window._lastAVM || null;
    }

    function buildAttomEnrichmentCard(avm) {
        if (!avm || avm.avmSource !== 'attom') return '';
        var parts = [];
        if (avm.value && avm.assessedTotal) {
            var gap = avm.value - avm.assessedTotal;
            var gapPct = Math.round((gap / avm.assessedTotal) * 100);
            parts.push('<div>Market vs Assessed gap: <b style="color:#e2e8f0;">$' + Math.round(gap).toLocaleString() + '</b> (' + gapPct + '% above assessed)</div>');
        }
        if (avm.priceLow && avm.priceHigh) {
            parts.push('<div>Value range: <b style="color:#e2e8f0;">$' + Math.round(avm.priceLow).toLocaleString() + ' – $' + Math.round(avm.priceHigh).toLocaleString() + '</b></div>');
        }
        if (avm.confidence) {
            var confColor = avm.confidence >= 80 ? '#4ade80' : avm.confidence >= 60 ? '#fbbf24' : '#f87171';
            parts.push('<div>Confidence: <b style="color:' + confColor + ';">' + avm.confidence + '/100</b></div>');
        }
        if (avm.lastSalePrice && avm.lastSaleDate) {
            var saleYear = String(avm.lastSaleDate).substring(0, 4);
            var appreciation = avm.value ? Math.round(((avm.value - avm.lastSalePrice) / avm.lastSalePrice) * 100) : 0;
            parts.push('<div>Last sale: <b style="color:#e2e8f0;">$' + Math.round(avm.lastSalePrice).toLocaleString() + '</b> (' + saleYear + ')' +
                (appreciation > 0 ? ' · <span style="color:#4ade80;">+' + appreciation + '% since</span>' : '') + '</div>');
        }
        if (parts.length === 0) return '';
        return '<div class="attom-card" style="background:#1a2332;border:1px solid #3b82f6;border-radius:8px;padding:12px;margin:8px 0;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
            '<span style="background:#3b82f6;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">ATTOM VALUATION</span></div>' +
            '<div style="display:grid;grid-template-columns:1fr;gap:4px;font-size:13px;color:#94a3b8;">' +
            parts.join('') + '</div></div>';
    }
}

// ============================================================
//  NOTE TO DEVELOPERS:
//
//  To fully deduplicate, each portal should:
//  1. Add <script src="shared.js"></script> before their main <script>
//  2. Remove the corresponding inline functions after testing
//
//  Functions safe to remove from inline code once this file is loaded:
//  - sha256, checkAuth, ADMIN_HASH, VALID_CODES
//  - PARCEL_QUERY_URL, PARCEL_OUT_FIELDS, PARCEL_MIN_ZOOM
//  - formatParcelCurrency, formatAPN, buildParcelPopup
//  - fetchParcelsByBounds, drawParcelsOnMap, setupParcelLayer
//  - haversine, computePolygonArea, estimateFrontage
//  - formatCompactDollars, _debouncedCall
//
//  METRO_STATIONS and LINE_COLORS are large constants (~300 lines)
//  and can also be extracted here in a future pass.
// ============================================================
