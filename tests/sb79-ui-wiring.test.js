'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function read(name) { return fs.readFileSync(path.join(root, name), 'utf8'); }
function must(text, regex, message) { assert.match(text, regex, message); }
function mustNot(text, regex, message) { assert.doesNotMatch(text, regex, message); }

for (const file of ['app.html', 'lender.html', 'agent.html']) {
  const text = read(file);
  must(text, /lastGeocode\.apn\s*=/, `${file} must retain the assessor APN`);
  must(text, /const resolvedContext\s*=\s*await resolveSb79ParcelContext[\s\S]{0,250}lookupGeneration !== window\._lookupGeneration[\s\S]{0,150}lastSb79Context\s*=\s*resolvedContext/, `${file} must guard APN resolution against stale lookup generations`);
  must(text, /parcelDecision/, `${file} must pass the parcel decision to the SB79 panel`);
  must(text, /zimas_verification_required/, `${file} must visibly handle unresolved ZIMAS status`);
  must(text, /la_low_rise/, `${file} must visibly handle the local Low-Rise path`);
  must(text, /excluded/, `${file} must visibly handle excluded parcels`);
  must(text, /prevSb79Context/, `${file} Finder legislation scoring must preserve parcel context`);
  must(text, /sourceDate\s*=\s*escapeSb79Metadata\(/, `${file} must escape source metadata before innerHTML rendering`);
  must(text, /directScenario\s*=\s*getSb79DecisionScenario\(/, `${file} must render the APN decision scenario`);
  must(text, /const a\s*=\s*directScenario\.envelope/, `${file} must source direct underwriting values from the APN scenario`);
  mustNot(text, /const a\s*=\s*eligibility\.allowances/, `${file} must not render coordinate allowances as direct SB79`);
  mustNot(text, /Full tier benefits, zero parking/, `${file} must not claim the adjacent envelope in the inner band`);
  mustNot(text, /65ft height, 3\.25 FAR/, `${file} must not use the stale generic outer envelope`);
  mustNot(text, /heightMult\s*[:=]\s*0\.68/, `${file} must not derive an outer envelope with a multiplier`);
  mustNot(text, /Affordable Req<\/div><div class="stat-value">15%/, `${file} must not claim universal 15% affordability`);
}

const geo = read('core-geo.js');
must(geo, /SB79_ENVELOPE_BY_BAND/, 'core-geo must expose the exact six-cell table');
mustNot(geo, /heightMult\s*:\s*0\.68/, 'core-geo must not store the generic multiplier');
mustNot(geo, /tierData\.(height|density|far)\s*\*\s*zone\.heightMult/, 'core-geo must not multiply adjacent values for other bands');

const data = read('core-data.js');
must(data, /getCurrentSb79Decision\(\)/, 'core-data must gate legislation applicability through APN status');
must(data, /getSb79DecisionScenario\(context\)/, 'core-data must underwrite the APN decision scenario');
mustNot(data, /return sb79\.eligible;/, 'core-data must not treat coordinate proximity as final eligibility');
mustNot(data, /15% affordable/, 'core-data must not state a universal 15% affordability rule');

const portal = read('sb79.html');
mustNot(portal, /between now and July 1, 2026/i, 'portal must not show a stale pre-effective checklist');
mustNot(portal, /File ministerial application on July 1, 2026/i, 'portal must not instruct a past-date filing');
must(portal, /ZIMAS/i, 'portal must identify current ZIMAS as the underwriting source');

console.log('PASS SB79 parcel-aware UI wiring checks');
