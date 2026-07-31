'use strict';

const assert = require('node:assert/strict');
const {
  evaluateAcquisitionReadiness,
  computeControlledOffer,
  hasComplexZoningControls,
  deriveParcelEvidenceStatus,
  deriveLandExcludingDevelopmentCosts,
} = require('../core-acquisition.js');

const currentSource = { snapshotDate: '2026-05-05', asOf: '2026-07-25' };
const areaEvidence = (overrides = {}) => ({
  apn: '5546018012', area: 10000, sourceType: 'LA_COUNTY_GIS',
  verificationDate: '2026-07-30', asOf: '2026-07-30', ...overrides,
});
assert.equal(deriveParcelEvidenceStatus({
  found: true,
  decision: { screeningOnly: true },
  evidence: { zimasConfirmed: true },
  source: currentSource,
}).legalPathStatus, 'unresolved');
assert.equal(deriveParcelEvidenceStatus({
  found: true,
  decision: { screeningOnly: false },
  evidence: { zimasConfirmed: false },
  source: currentSource,
}).legalPathStatus, 'unresolved');
assert.equal(deriveParcelEvidenceStatus({
  found: true,
  decision: { screeningOnly: false },
  evidence: { zimasConfirmed: true },
  source: null,
}).criticalSourceStatus, 'missing');
assert.equal(deriveParcelEvidenceStatus({
  found: true,
  decision: { screeningOnly: false },
  evidence: { zimasConfirmed: true },
  source: { snapshotDate: '2025-01-01', asOf: '2026-07-25' },
}).criticalSourceStatus, 'stale');
console.log('PASS parcel evidence fails closed when screening, unconfirmed, absent, or stale');

const verifiedEvidence = deriveParcelEvidenceStatus({
  apn: '5546018012',
  found: true,
  decision: { screeningOnly: false, finalEligibility: true },
  evidence: {
    zimasConfirmed: true,
    sourceType: 'ZIMAS',
    verificationDate: '2026-07-30',
    asOf: '2026-07-30',
  },
});
assert.deepEqual(verifiedEvidence, {
  legalPathStatus: 'verified',
  criticalSourceStatus: 'current',
  evidenceApn: '5546018012',
});
console.log('PASS explicit dated ZIMAS evidence makes a valid parcel usable');

for (const context of [
  { apn: '5546018012', found: false, decision: { finalEligibility: false, screeningOnly: false } },
  { apn: '5546018012', found: true, decision: { finalEligibility: false, screeningOnly: false, excluded: true } },
]) {
  const status = deriveParcelEvidenceStatus({
    ...context,
    evidence: { zimasConfirmed: true, sourceType: 'ZIMAS', verificationDate: '2026-07-30', asOf: '2026-07-30' },
  });
  assert.equal(status.legalPathStatus, 'verified');
  assert.equal(status.criticalSourceStatus, 'current');
}
console.log('PASS verified base zoning remains usable outside or excluded from SB79');

for (const evidence of [
  { zimasConfirmed: true, sourceType: 'ZIMAS' },
  { zimasConfirmed: true, sourceType: 'ZIMAS', verificationDate: '2026-02-30', asOf: '2026-03-02' },
]) {
  const status = deriveParcelEvidenceStatus({
    found: true,
    decision: { screeningOnly: false, finalEligibility: true },
    evidence,
    source: { snapshotDate: '2026-05-05', asOf: '2026-07-30' },
  });
  assert.notEqual(status.legalPathStatus, 'verified');
  assert.notEqual(status.criticalSourceStatus, 'current');
}
console.log('PASS missing and impossible ZIMAS dates fail closed without metadata fallback');

const invalidApn = evaluateAcquisitionReadiness({
  apn: '123-45',
  rawZoning: 'C2-2',
  zoningResolution: 'verified',
  legalPathStatus: 'verified',
  criticalSourceStatus: 'current',
});
assert.ok(invalidApn.blockers.includes('apn_unresolved'));
assert.equal(invalidApn.canUnderwrite, false);

assert.equal(hasComplexZoningControls('(T)(Q)C2-2D-SN-CPIO'), true);
assert.equal(hasComplexZoningControls('[Q]R3-1XL'), true);
assert.equal(hasComplexZoningControls('[T]C2-1'), true);
for (const zoning of ['R1-1-HCR', 'RD1.5-1-O', 'R2-1-CUGU', 'C1.5-1-SP', 'C4-1-CA', 'R1V3-RG', 'C2-1-RPD']) {
  assert.equal(hasComplexZoningControls(zoning), true, `${zoning} must retain its supplemental district`);
}
for (const zoning of ['R1', 'R1-1', 'C2-2', 'C4-1XL', 'C1.5-1']) {
  assert.equal(hasComplexZoningControls(zoning), false, `${zoning} is a recognized simple base/height zoning`);
}
const conditioned = evaluateAcquisitionReadiness({
  apn: '5546-018-012',
  rawZoning: '(T)(Q)C2-2D-SN-CPIO',
  normalizedZoning: 'C2',
  zoningResolution: 'verified',
  legalPathStatus: 'verified',
  criticalSourceStatus: 'current',
});
assert.ok(conditioned.blockers.includes('zoning_unresolved'));
assert.equal(conditioned.canUnderwrite, false);

console.log('PASS invalid APNs and conditioned zoning fail acquisition readiness');

const result = evaluateAcquisitionReadiness({
  apn: '5546-018-012',
  rawZoning: '(T)(Q)C2-2D-SN-CPIO',
  normalizedZoning: 'R1',
  zoningResolution: 'unresolved',
  legalPathStatus: 'unresolved',
});

assert.equal(result.decision, 'verify');
assert.equal(result.canUnderwrite, false);
assert.equal(result.canRecommendOffer, false);
assert.ok(result.blockers.includes('zoning_unresolved'));
assert.ok(result.blockers.includes('legal_path_unresolved'));
assert.match(result.message, /verify exact zoning/i);

console.log('PASS unresolved zoning blocks underwriting and offer output');

const stale = evaluateAcquisitionReadiness({
  apn: '5546-018-012',
  rawZoning: 'C2-2',
  normalizedZoning: 'C2',
  zoningResolution: 'verified',
  legalPathStatus: 'verified',
  criticalSourceStatus: 'stale',
});

assert.equal(stale.decision, 'verify');
assert.equal(stale.canUnderwrite, false);
assert.equal(stale.canRecommendOffer, false);
assert.ok(stale.blockers.includes('critical_source_stale'));
assert.match(stale.message, /refresh critical source/i);

console.log('PASS stale critical sources block underwriting and offer output');

const verified = evaluateAcquisitionReadiness({
  apn: '5546-018-012',
  evidenceApn: '5546018012',
  parcelSize: 10000,
  parcelAreaEvidence: areaEvidence(),
  rawZoning: 'C2-2',
  normalizedZoning: 'C2',
  zoningResolution: 'verified',
  legalPathStatus: 'verified',
  criticalSourceStatus: 'current',
});

const mismatchedEvidence = evaluateAcquisitionReadiness({
  apn: '2222222222',
  evidenceApn: '1111111111',
  parcelSize: 10000,
  parcelAreaEvidence: areaEvidence({ apn: '1111111111' }),
  rawZoning: 'C2-2',
  zoningResolution: 'verified',
  legalPathStatus: 'verified',
  criticalSourceStatus: 'current',
});
assert.equal(mismatchedEvidence.canUnderwrite, false);
assert.ok(mismatchedEvidence.blockers.includes('apn_evidence_mismatch'));

for (const parcelInput of [
  { parcelSize: 10000 },
  { parcelSize: 10000, parcelAreaEvidence: areaEvidence({ apn: '1111111111' }) },
  { parcelSize: 12000, parcelAreaEvidence: areaEvidence() },
  { parcelSize: 10000, parcelAreaEvidence: areaEvidence({ verificationDate: '2026-02-30' }) },
  { parcelSize: 0, parcelAreaEvidence: areaEvidence({ area: 0 }) },
]) {
  const parcelReadiness = evaluateAcquisitionReadiness({
    apn: '5546018012', evidenceApn: '5546018012', rawZoning: 'C2-2',
    zoningResolution: 'verified', legalPathStatus: 'verified', criticalSourceStatus: 'current',
    ...parcelInput,
  });
  assert.equal(parcelReadiness.canUnderwrite, false);
  assert.ok(parcelReadiness.blockers.includes('parcel_area_unresolved'));
}
console.log('PASS evidence is APN-bound and parcel area must be verified');

const offer = computeControlledOffer({
  readiness: verified,
  stabilizedValue: 20_000_000,
  developmentCostsExcludingLand: 12_000_000,
  requiredDeveloperProfit: 2_000_000,
  riskReserve: 500_000,
  initialOfferDiscount: 0.10,
  avm: 3_000_000,
});

assert.equal(offer.status, 'offer_ready');
assert.equal(offer.residualBeforeHurdles, 8_000_000);
assert.equal(offer.walkAwayPrice, 5_500_000);
assert.equal(offer.initialOffer, 4_950_000);
assert.deepEqual(offer.hurdles, {
  requiredDeveloperProfit: 2_000_000,
  riskReserve: 500_000,
});
assert.ok(offer.flags.includes('above_avm_50pct'));

console.log('PASS controlled offer deducts profit hurdle and risk reserve');

for (const invalidInput of [
  { stabilizedValue: Number.NaN, developmentCostsExcludingLand: 1, requiredDeveloperProfit: 0, riskReserve: 0, initialOfferDiscount: 0.1 },
  { stabilizedValue: 10, developmentCostsExcludingLand: -1, requiredDeveloperProfit: 0, riskReserve: 0, initialOfferDiscount: 0.1 },
  { stabilizedValue: 10, developmentCostsExcludingLand: 1, requiredDeveloperProfit: -1, riskReserve: 0, initialOfferDiscount: 0.1 },
  { stabilizedValue: 10, developmentCostsExcludingLand: 1, requiredDeveloperProfit: 0, riskReserve: -1, initialOfferDiscount: 0.1 },
  { stabilizedValue: 10, developmentCostsExcludingLand: 1, requiredDeveloperProfit: 0, riskReserve: 0, initialOfferDiscount: 1 },
  { stabilizedValue: 10, developmentCostsExcludingLand: null, requiredDeveloperProfit: 0, riskReserve: 0, initialOfferDiscount: 0.1 },
]) {
  const invalidOffer = computeControlledOffer({ readiness: verified, ...invalidInput });
  assert.equal(invalidOffer.status, 'blocked');
  assert.ok(invalidOffer.blockers.includes('invalid_offer_inputs'));
}

console.log('PASS controlled offer rejects invalid numeric and discount inputs');

const budgetWithLandFinancing = {
  totalHard: 10_000_000,
  archEng: 800_000,
  permits: 500_000,
  legal: 200_000,
  financing: 900_000,
  marketing: 300_000,
  devFee: 200_000,
  totalSoft: 2_900_000,
};
const budgetWithoutLandFinancing = {
  ...budgetWithLandFinancing,
  financing: 450_000,
  totalSoft: 2_450_000,
};
assert.equal(deriveLandExcludingDevelopmentCosts(budgetWithLandFinancing), 12_450_000);
assert.equal(
  deriveLandExcludingDevelopmentCosts(budgetWithLandFinancing),
  deriveLandExcludingDevelopmentCosts(budgetWithoutLandFinancing),
);

console.log('PASS land-excluding development costs remove assumed land financing');
