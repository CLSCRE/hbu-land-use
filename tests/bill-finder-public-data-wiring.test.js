'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'bill-finder.html'), 'utf8');

assert.match(html, /<script src="core-public-data\.js"><\/script>/, 'Bill Finder must load the public-data adapter');
assert.match(html, /fetchPublicParcelsByZip/, 'ZIP scans must join Census ZIP boundaries with ZIMAS parcels and zoning');
assert.match(html, /City of Los Angeles ZIMAS Landbase and Zoning/, 'UI must identify the parcel and zoning source');
assert.match(html, /preliminary/i, 'eligibility output must identify preliminary screening');
assert.doesNotMatch(html, /ATTOM_KEY|api\.gateway\.attomdata\.com|attomFetch\(/, 'Bill Finder must not require ATTOM credentials');
assert.doesNotMatch(html, /fetchCountyParcelsByZip/, 'Bill Finder must not use the county cache with mismatched APN/address joins');
assert.doesNotMatch(html, /Assumed \(ATTOM CA data\)/, 'eligibility must not cite ATTOM as location evidence');
console.log('PASS Bill Finder uses free public parcel data without ATTOM');
