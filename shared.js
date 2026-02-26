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
];

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
