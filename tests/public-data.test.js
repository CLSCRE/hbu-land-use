'use strict';
const assert = require('node:assert/strict');
const { mapCountyParcel, mapCityParcel, fetchCountyParcelsByZip, fetchPublicParcelsByZip } = require('../core-public-data.js');

const feature = {
  attributes: {
    AIN: '2385011034',
    APN: '2385-011-034',
    SitusAddress: '6503 W 6TH ST',
    SitusCity: 'LOS ANGELES',
    SitusZIP: '90048',
    UseType: 'Residential',
    UseDescription: 'Single',
    YearBuilt1: '1956',
    Units1: 1,
    SQFTmain1: 2136,
    Roll_Year: '2026',
    Roll_LandValue: 1472106,
    Roll_ImpValue: 368026,
    CENTER_LAT: 34.063,
    CENTER_LON: -118.37,
    'Shape.STArea()': 6500
  }
};

const result = mapCountyParcel(feature);
assert.equal(result.prop.identifier.apn, '2385-011-034');
assert.equal(result.prop.address.line1, '6503 W 6TH ST');
assert.equal(result.prop.summary.proptype, 'SFR');
assert.equal(result.prop.lot.lotsize2, 6500);
assert.equal(result.prop.location.latitude, 34.063);
assert.equal(result.assessment.property[0].assessment.assessed.assdttlvalue, 1840132);
assert.equal(result.source.name, 'LA County Assessor Parcel Map Service');
console.log('PASS public parcel adapter maps authoritative county fields');

const cityParcel = {
  attributes: { BPP: '5510013020', PIN: '135B173   377', Shape_Area: 6100.06 },
  geometry: { rings: [[[-118.370, 34.065], [-118.369, 34.065], [-118.369, 34.066], [-118.370, 34.066], [-118.370, 34.065]]] }
};
const cityZones = [{
  attributes: { ZONE_CMPLT: '[Q]R1-1-O', ZONE_CODE: 'R1' },
  geometry: { rings: [[[-118.371, 34.064], [-118.368, 34.064], [-118.368, 34.067], [-118.371, 34.067], [-118.371, 34.064]]] }
}];
const cityResult = mapCityParcel(cityParcel, cityZones);
assert.equal(cityResult.prop.identifier.apn, '5510-013-020');
assert.equal(cityResult.prop.lot.lotsize2, 6100);
assert.equal(cityResult.prop.summary.proptype, 'SFR');
assert.equal(cityResult.prop.summary.propsubtype, '[Q]R1-1-O');
assert.ok(cityResult.prop.location.latitude > 34.065 && cityResult.prop.location.latitude < 34.066);
assert.equal(cityResult.source.name, 'City of Los Angeles ZIMAS Landbase and Zoning');
console.log('PASS City parcel geometry stays tied to APN, area, and zoning');

(async () => {
  const publicCalls = [];
  const publicOptions = [];
  const publicFetch = async (url, options) => {
    const text = String(url);
    publicCalls.push(text);
    publicOptions.push({ url: text, options: options || {} });
    if (text.includes('tigerweb.geo.census.gov')) {
      return { ok: true, json: async () => ({ features: [{ geometry: cityZones[0].geometry }] }) };
    }
    if (text.includes('/MapServer/105/query')) {
      return { ok: true, json: async () => ({ features: [cityParcel] }) };
    }
    if (text.includes('/MapServer/1101/query')) {
      return { ok: true, json: async () => ({ features: cityZones }) };
    }
    if (text.includes('/MapServer/1102/query')) {
      return { ok: true, json: async () => ({ features: [] }) };
    }
    throw new Error(`Unexpected URL ${text}`);
  };
  const publicScan = await fetchPublicParcelsByZip('90048', { fetchImpl: publicFetch, pageSize: 2000 });
  assert.equal(publicScan.records.length, 1);
  assert.equal(publicScan.records[0].prop.identifier.apn, '5510-013-020');
  assert.equal(publicScan.records[0].prop.summary.propsubtype, '[Q]R1-1-O');
  assert.ok(publicCalls.some(url => url.includes('tigerweb.geo.census.gov')), 'must use Census ZCTA boundary');
  assert.ok(publicCalls.some(url => url.includes('/MapServer/105/query')), 'must use ZIMAS landbase parcels');
  assert.ok(publicCalls.some(url => url.includes('/MapServer/1101/query')), 'must use current ZIMAS zoning');
  assert.ok(publicOptions.filter(call => call.url.includes('zimas.lacity.org')).every(call => call.options.method === 'POST'), 'large ZIMAS spatial queries must use POST');
  console.log('PASS free public stack joins Census ZIP, ZIMAS parcels, and ZIMAS zoning');

  const calls = [];
  const fakeFetch = async (url) => {
    calls.push(String(url));
    const parsed = new URL(url);
    if (parsed.searchParams.get('returnCountOnly') === 'true') {
      return { ok: true, json: async () => ({ count: 1002 }) };
    }
    const offset = Number(parsed.searchParams.get('resultOffset') || 0);
    return {
      ok: true,
      json: async () => ({
        features: [{ attributes: { ...feature.attributes, AIN: String(offset), APN: `APN-${offset}` } }]
      })
    };
  };

  const scan = await fetchCountyParcelsByZip('90048', { fetchImpl: fakeFetch, pageSize: 1000 });
  assert.equal(scan.total, 1002);
  assert.equal(scan.records.length, 2);
  assert.match(calls[0], /SitusZIP/);
  assert.ok(calls.some(url => url.includes('resultOffset=1000')), 'must paginate beyond the county 1,000-record cap');
  assert.ok(calls.every(url => !url.includes('apikey')), 'public parcel calls must not require an API key');
  console.log('PASS public ZIP scan paginates without credentials');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
