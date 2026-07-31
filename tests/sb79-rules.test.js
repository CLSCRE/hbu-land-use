'use strict';

const assert = require('node:assert/strict');
const rules = require('../core-sb79.js');

function verifiedLowRise(overrides = {}) {
  return {
    sourceType: 'ZIMAS', verificationDate: '2026-07-30', asOf: '2026-07-30',
    legalPathResult: 'eligible', finalMapSubarea: 'LR-1', overlaysResolved: true,
    fireHazard: false, coastalZone: false, designatedHistoricResource: false,
    lotAreaSf: 7500, lotWidthFt: 50, pedestrianAccessFt: 3,
    ...overrides,
  };
}

function test(name, fn) {
  try {
    fn();
    console.log('PASS', name);
  } catch (error) {
    console.error('FAIL', name);
    throw error;
  }
}

const STATUTORY = [
  [1, 'adjacent', 95, 160, 4.5],
  [1, 'inner',    75, 120, 3.5],
  [1, 'outer',    65, 100, 3.0],
  [2, 'adjacent', 85, 140, 4.0],
  [2, 'inner',    65, 100, 3.0],
  [2, 'outer',    55,  80, 2.5],
];

for (const [tier, band, height, density, far] of STATUTORY) {
  test(`SB79 T${tier} ${band} uses chaptered height/density/FAR`, () => {
    const env = rules.computeEnvelope(43560, tier, band);
    assert.equal(env.maxHeight, height);
    assert.equal(env.densityDuAc, density);
    assert.equal(env.maxFar, far);
    assert.equal(env.maxUnits, density);
    assert.equal(env.maxGfa, Math.floor(43560 * far));
  });
}

test('Low-Rise classifies Opportunity Corridor distance bands', () => {
  assert.equal(rules.classifyLowRiseSubarea({ transportationQualifier: 'opportunity_corridor', distanceFeet: 249 }), 'LR-2');
  assert.equal(rules.classifyLowRiseSubarea({ transportationQualifier: 'opportunity_corridor', distanceFeet: 250 }), 'LR-2');
  assert.equal(rules.classifyLowRiseSubarea({ transportationQualifier: 'opportunity_corridor', distanceFeet: 251 }), 'LR-1');
  assert.equal(rules.classifyLowRiseSubarea({ transportationQualifier: 'opportunity_corridor', distanceFeet: 750 }), 'LR-1');
  assert.equal(rules.classifyLowRiseSubarea({ transportationQualifier: 'opportunity_corridor', distanceFeet: 751 }), null);
});

test('Low-Rise classifies Tier 1 and Tier 2 TOD distance bands', () => {
  assert.equal(rules.classifyLowRiseSubarea({ tier: 1, distanceFeet: 2640, residentialZone: true }), 'LR-2');
  assert.equal(rules.classifyLowRiseSubarea({ tier: 2, distanceFeet: 1320, residentialZone: true }), 'LR-2');
  assert.equal(rules.classifyLowRiseSubarea({ tier: 2, distanceFeet: 1321, residentialZone: true }), 'LR-1');
  assert.equal(rules.classifyLowRiseSubarea({ tier: 2, distanceFeet: 2640, residentialZone: true }), 'LR-1');
});

test('Historic resource is capped at LR-1', () => {
  assert.equal(rules.classifyLowRiseSubarea({ tier: 1, distanceFeet: 500, residentialZone: true, designatedHistoricResource: true }), 'LR-1');
});

test('LR-1 returns signed maximum ladder and affordability', () => {
  const env = rules.computeLowRiseEnvelope(7500, { subarea: 'LR-1' });
  assert.equal(env.subarea, 'LR-1');
  assert.equal(env.maxUnits, 11);
  assert.equal(env.maxFar, 2.15);
  assert.equal(env.maxGfa, Math.floor(7500 * 2.15));
  assert.equal(env.maxStories, 3);
  assert.equal(env.parkingRatio, 0);
  assert.deepEqual(env.affordability, { moderateIncomeUnits: 1 });
});

test('LR-2 returns signed maximum ladder and affordability options', () => {
  const env = rules.computeLowRiseEnvelope(7500, { subarea: 'LR-2' });
  assert.equal(env.subarea, 'LR-2');
  assert.equal(env.maxUnits, 16);
  assert.equal(env.maxFar, 2.9);
  assert.equal(env.maxGfa, Math.floor(7500 * 2.9));
  assert.equal(env.maxStories, 3);
  assert.equal(env.parkingRatio, 0);
  assert.deepEqual(env.affordabilityOptions, [
    { veryLowIncomeUnits: 1 },
    { lowerIncomeUnits: 1 },
    { moderateIncomeUnits: 2 },
  ]);
});

test('Multi-bedroom option adds 0.5 FAR and one story', () => {
  const env = rules.computeLowRiseEnvelope(7500, { subarea: 'LR-2', multiBedroomShare: 0.20 });
  assert.equal(env.maxFar, 3.4);
  assert.equal(env.maxStories, 4);
  assert.equal(env.multiBedroomIncentiveApplied, true);
});

test('Source metadata is escaped before HTML rendering', () => {
  const malicious = '<img src=x onerror="globalThis.pwned=true">&\'';
  assert.equal(
    rules.escapeSb79Metadata(malicious),
    '&lt;img src=x onerror=&quot;globalThis.pwned=true&quot;&gt;&amp;&#39;'
  );
});

test('Parcel status gate blocks proximity-only conclusions', () => {
  const result = rules.resolveParcelAwareSb79({ eligible: true, zone: 'inner', tier: 1 }, null);
  assert.equal(result.finalEligibility, false);
  assert.equal(result.screeningOnly, true);
  assert.equal(result.currentPath, 'zimas_verification_required');
});

test('Temporary state hold can route to LA Low-Rise without claiming statutory eligibility', () => {
  const result = rules.resolveParcelAwareSb79(
    { eligible: true, zone: 'outer', tier: 2 },
    { p: 't', lr: true, t: 2, b: 'o', zn: 'R2-1' },
    { zimasConfirmed: true, lotSf: 7500, lowRiseVerification: verifiedLowRise() }
  );
  assert.equal(result.statutoryEligible, false);
  assert.equal(result.lowRiseEligible, true);
  assert.equal(result.currentPath, 'la_low_rise');
});

test('Generic or incomplete ZIMAS review cannot unlock Low-Rise', () => {
  const proximity = { eligible: true, zone: 'outer', tier: 2 };
  const record = { p: 't', lr: true, t: 2, b: 'o', zn: 'R2-1' };
  const invalid = [
    null,
    verifiedLowRise({ legalPathResult: 'ineligible' }),
    verifiedLowRise({ verificationDate: '2026-02-30' }),
    verifiedLowRise({ finalMapSubarea: null }),
    verifiedLowRise({ finalMapSubarea: 'LR-2' }),
    verifiedLowRise({ overlaysResolved: false }),
    verifiedLowRise({ fireHazard: true }),
    verifiedLowRise({ coastalZone: true }),
    verifiedLowRise({ designatedHistoricResource: true }),
    verifiedLowRise({ lotAreaSf: 599 }),
    verifiedLowRise({ lotWidthFt: 14 }),
    verifiedLowRise({ pedestrianAccessFt: 2 }),
  ];
  for (const lowRiseVerification of invalid) {
    const result = rules.resolveParcelAwareSb79(proximity, record, {
      zimasConfirmed: true, lotSf: 7500, lowRiseVerification,
    });
    assert.equal(result.lowRiseEligible, false);
    assert.equal(result.finalEligibility, false);
  }
});

test('Unconfirmed Table 1C Low-Rise flag stays screening-only and has no HBU envelope', () => {
  const compact = { p: 't', lr: true, t: 2, b: 'o', zn: 'R2-1' };
  const decision = rules.resolveParcelAwareSb79(
    { eligible: true, zone: 'outer', tier: 2 },
    compact,
    { zimasConfirmed: false }
  );
  assert.equal(decision.finalEligibility, false);
  assert.equal(decision.lowRiseEligible, false);
  assert.equal(decision.screeningOnly, true);
  assert.equal(decision.currentPath, 'zimas_verification_required');

  const record = rules.expandSb79Record(compact, '2010004010');
  const set = rules.buildSb79ScenarioSet(record, { lotSf: 7500, zimasConfirmed: false });
  const lowRise = set.scenarios.find((scenario) => scenario.id === 'low_rise_retained');
  assert.equal(lowRise.eligibilityStatus, 'needs_verification');
  assert.equal(lowRise.envelope, null);
});

test('Direct SB79 selects the APN decision scenario envelope, never coordinate allowances', () => {
  const apnEnvelope = { maxHeight: 55, densityDuAc: 80, maxFar: 2.5, parkingRatio: 0.5 };
  const context = {
    decision: {
      finalEligibility: true,
      currentPath: 'sb79_statutory',
      proximity: { envelope: { maxHeight: 95, densityDuAc: 160, maxFar: 4.5 } },
    },
    scenarios: { scenarios: [{ id: 'sb79_statutory', envelope: apnEnvelope }] },
  };
  assert.equal(rules.getSb79DecisionScenario(context).envelope, apnEnvelope);
  assert.equal(rules.getSb79DecisionScenario({
    decision: { finalEligibility: false, proximity: { envelope: apnEnvelope } },
    scenarios: context.scenarios,
  }), null);
});

test('Explicit dated ZIMAS evidence unlocks a verified APN scenario', () => {
  const context = rules.applySb79VerificationEvidence({
    apn: '5546018012',
    found: true,
    record: rules.expandSb79Record({ p: 'e', t: 1, b: 'a' }, '5546018012'),
    decision: { proximity: { eligible: true, tier: 1, zone: 'adjacent' } },
    evidence: { zimasConfirmed: false },
  }, {
    zimasConfirmed: true,
    sourceType: 'ZIMAS',
    verificationDate: '2026-07-30',
    asOf: '2026-07-30',
    parcelFacts: { lotSf: 10000 },
  });
  assert.equal(context.evidence.zimasConfirmed, true);
  assert.equal(context.decision.finalEligibility, true);
  assert.ok(rules.getSb79DecisionScenario(context));
});

test('Impossible calendar dates cannot confirm ZIMAS evidence', () => {
  const context = rules.applySb79VerificationEvidence({
    apn: '5546018012',
    found: true,
    record: rules.expandSb79Record({ p: 'e', t: 1, b: 'a' }, '5546018012'),
    decision: { proximity: { eligible: true, tier: 1, zone: 'adjacent' } },
  }, {
    zimasConfirmed: true,
    sourceType: 'ZIMAS',
    verificationDate: '2026-02-30',
    asOf: '2026-03-02',
    parcelFacts: { lotSf: 10000 },
  });
  assert.equal(context.evidence.zimasConfirmed, false);
  assert.equal(context.decision.finalEligibility, false);
});

test('Dated ZIMAS evidence verifies base zoning outside the SB79 index without creating incentives', () => {
  const context = {
    apn: '1111111111', found: false, record: null,
    decision: { finalEligibility: false, screeningOnly: false, currentPath: 'not_in_dataset' },
    scenarios: null,
  };
  rules.applySb79VerificationEvidence(context, {
    zimasConfirmed: true, sourceType: 'ZIMAS',
    verificationDate: '2026-07-30', asOf: '2026-07-30',
    parcelFacts: { lotSf: 10000 },
  });
  assert.equal(context.evidence.zimasConfirmed, true);
  assert.equal(context.decision.finalEligibility, false);
  assert.equal(context.decision.currentPath, 'not_in_dataset');
  assert.equal(context.scenarios, null);
});

test('Permanent and statutory exclusions block both paths', () => {
  for (const phase of ['x', 's']) {
    const result = rules.resolveParcelAwareSb79(
      { eligible: true, zone: 'inner', tier: 1 },
      { p: phase, lr: true, t: 1, b: 'i', zn: 'R2-1' }
    );
    assert.equal(result.finalEligibility, false);
    assert.equal(result.statutoryEligible, false);
    assert.equal(result.lowRiseEligible, false);
    assert.equal(result.currentPath, 'excluded');
  }
});

test('Scenario set calculates Low-Rise envelope instead of null', () => {
  const record = rules.expandSb79Record({
    p: 't', lr: 1, t: 2, b: 'o', zn: 'R2-1', td: 'T2-0.5', z: 'Test Station'
  }, '2010004010');
  const set = rules.buildSb79ScenarioSet(record, {
    lotSf: 7500, zimasConfirmed: true, lowRiseVerification: verifiedLowRise(),
  });
  const lowRise = set.scenarios.find((s) => s.id === 'low_rise_retained');
  const statutory = set.scenarios.find((s) => s.id === 'sb79_statutory');
  assert.equal(lowRise.eligibilityStatus, 'current_local_path');
  assert.equal(lowRise.envelope.subarea, 'LR-1');
  assert.equal(lowRise.envelope.maxUnits, 11);
  assert.equal(statutory.eligibilityStatus, 'temporary_hold');
});

console.log(`PASS all ${STATUTORY.length + 11} SB79/Low-Rise rules tests`);
