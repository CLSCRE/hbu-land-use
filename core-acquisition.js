'use strict';

/**
 * Central acquisition-readiness gate.
 * Fails closed when parcel identity, exact zoning, or legal-path evidence is unresolved.
 */
function hasComplexZoningControls(rawZoning) {
  const zoning = String(rawZoning || '').toUpperCase().trim();
  if (!zoning) return false;
  const supportedBase = '(?:R1|R2|R3|R4|R5|C1(?:\\.5)?|C2|C4|C5|CM|M1|M2|M3|PF|OS|LAX|TOD)';
  const recognizedHeightDistrict = '(?:1|1L|1VL|1XL|2|3|4)';
  return !(new RegExp(`^${supportedBase}(?:-${recognizedHeightDistrict})?$`)).test(zoning);
}

function parseIsoDateStrict(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return NaN;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day ? timestamp : NaN;
}

function deriveParcelEvidenceStatus(parcelContext) {
  const context = parcelContext || {};
  const decision = context.decision || {};
  const evidence = context.evidence || {};
  const evidenceApn = String(context.apn || '').replace(/[^0-9]/g, '');
  const source = context.source || {};
  const explicitZimasEvidence = evidence.zimasConfirmed === true && evidence.sourceType === 'ZIMAS';
  const verificationDate = explicitZimasEvidence ? evidence.verificationDate : source.snapshotDate;
  const asOf = explicitZimasEvidence ? evidence.asOf : source.asOf;
  const verificationMs = parseIsoDateStrict(verificationDate);
  const asOfMs = parseIsoDateStrict(asOf);
  const ageDays = (asOfMs - verificationMs) / 86400000;
  const datesPresent = !!verificationDate && !!asOf;
  const datesCurrent = Number.isFinite(ageDays) && ageDays >= 0 && ageDays <= 180;
  // Current parcel-specific ZIMAS evidence verifies the base-zoning path.
  // SB 79/Low-Rise incentive eligibility is a separate downstream decision;
  // absence from or exclusion by that dataset must not invalidate base zoning.
  const legalVerified = /^\d{10}$/.test(evidenceApn)
    && explicitZimasEvidence
    && datesCurrent;

  let criticalSourceStatus = 'missing';
  if (datesPresent) criticalSourceStatus = datesCurrent ? 'current' : 'stale';

  return {
    legalPathStatus: legalVerified ? 'verified' : 'unresolved',
    criticalSourceStatus,
    evidenceApn,
  };
}

function evaluateAcquisitionReadiness(input = {}) {
  const blockers = [];

  const cleanApn = String(input.apn || '').replace(/[^0-9]/g, '');
  if (!/^\d{10}$/.test(cleanApn)) blockers.push('apn_unresolved');
  const evidenceApn = String(input.evidenceApn || '').replace(/[^0-9]/g, '');
  if (/^\d{10}$/.test(cleanApn) && evidenceApn !== cleanApn) blockers.push('apn_evidence_mismatch');
  const parcelSize = Number(input.parcelSize);
  const areaEvidence = input.parcelAreaEvidence || {};
  const areaEvidenceApn = String(areaEvidence.apn || '').replace(/[^0-9]/g, '');
  const evidencedArea = Number(areaEvidence.area);
  const areaVerificationMs = parseIsoDateStrict(areaEvidence.verificationDate);
  const areaAsOfMs = parseIsoDateStrict(areaEvidence.asOf);
  const areaAgeDays = (areaAsOfMs - areaVerificationMs) / 86400000;
  const acceptedAreaSource = ['LA_COUNTY_GIS', 'ZIMAS', 'ASSESSOR_GIS'].includes(areaEvidence.sourceType);
  const areaVerified = Number.isFinite(parcelSize) && parcelSize > 0
    && Number.isFinite(evidencedArea) && evidencedArea > 0
    && Math.abs(parcelSize - evidencedArea) <= 1
    && areaEvidenceApn === cleanApn
    && acceptedAreaSource
    && Number.isFinite(areaAgeDays) && areaAgeDays >= 0 && areaAgeDays <= 180;
  if (!areaVerified) {
    blockers.push('parcel_area_unresolved');
  }
  if (input.zoningResolution !== 'verified' || hasComplexZoningControls(input.rawZoning)) blockers.push('zoning_unresolved');
  if (input.legalPathStatus !== 'verified') blockers.push('legal_path_unresolved');
  if (input.criticalSourceStatus !== 'current') {
    blockers.push(input.criticalSourceStatus === 'stale' ? 'critical_source_stale' : 'critical_source_unresolved');
  }

  const blocked = blockers.length > 0;

  let message = 'Critical parcel controls are verified.';
  if (blockers.includes('zoning_unresolved')) {
    message = 'Verify exact zoning and parcel controls before underwriting or recommending an offer.';
  } else if (blockers.includes('critical_source_stale')) {
    message = 'Refresh critical source data before underwriting or recommending an offer.';
  } else if (blocked) {
    message = 'Resolve all critical parcel controls before underwriting or recommending an offer.';
  }

  return {
    decision: blocked ? 'verify' : 'pursue',
    canUnderwrite: !blocked,
    canRecommendOffer: !blocked,
    blockers,
    message,
  };
}

function deriveLandExcludingDevelopmentCosts(budget = {}) {
  const keys = ['totalHard', 'archEng', 'permits', 'legal', 'financing', 'marketing', 'devFee', 'totalSoft'];
  const values = Object.fromEntries(keys.map((key) => [key, Number(budget[key])]));
  if (keys.some((key) => !Number.isFinite(values[key]) || values[key] < 0)) return null;
  const softBeforeMultiplier = values.archEng + values.permits + values.legal
    + values.financing + values.marketing + values.devFee;
  const softMultiplier = softBeforeMultiplier > 0 ? values.totalSoft / softBeforeMultiplier : 1;
  if (!Number.isFinite(softMultiplier) || softMultiplier < 0) return null;
  const landIndependentFinancing = values.totalHard * 0.045;
  const softExcludingLand = (values.archEng + values.permits + values.legal
    + landIndependentFinancing + values.marketing + values.devFee) * softMultiplier;
  return Math.round(values.totalHard + softExcludingLand);
}

function computeControlledOffer(input = {}) {
  if (!input.readiness || !input.readiness.canRecommendOffer) {
    return {
      status: 'blocked',
      initialOffer: null,
      walkAwayPrice: null,
      blockers: input.readiness ? input.readiness.blockers : ['readiness_missing'],
    };
  }

  const requiredFields = [
    'stabilizedValue',
    'developmentCostsExcludingLand',
    'requiredDeveloperProfit',
    'riskReserve',
    'initialOfferDiscount',
  ];
  const hasMissingInput = requiredFields.some((field) => input[field] == null || input[field] === '');
  const stabilizedValue = Number(input.stabilizedValue);
  const costsExLand = Number(input.developmentCostsExcludingLand);
  const requiredProfit = Number(input.requiredDeveloperProfit);
  const riskReserve = Number(input.riskReserve);
  const discount = Number(input.initialOfferDiscount);
  const avm = input.avm == null ? 0 : Number(input.avm);
  const nonnegative = [stabilizedValue, costsExLand, requiredProfit, riskReserve, avm];
  if (hasMissingInput || nonnegative.some((value) => !Number.isFinite(value) || value < 0)
      || !Number.isFinite(discount) || discount < 0 || discount >= 1) {
    return {
      status: 'blocked',
      initialOffer: null,
      walkAwayPrice: null,
      blockers: ['invalid_offer_inputs'],
    };
  }

  const residualBeforeHurdles = stabilizedValue - costsExLand;
  const walkAwayPrice = Math.max(0, residualBeforeHurdles - requiredProfit - riskReserve);
  const initialOffer = Math.max(0, Math.round(walkAwayPrice * (1 - discount)));
  const flags = [];
  if (avm > 0 && walkAwayPrice > avm * 1.5) flags.push('above_avm_50pct');

  return {
    status: 'offer_ready',
    residualBeforeHurdles,
    walkAwayPrice,
    initialOffer,
    hurdles: {
      requiredDeveloperProfit: requiredProfit,
      riskReserve,
    },
    flags,
  };
}

const api = {
  evaluateAcquisitionReadiness,
  computeControlledOffer,
  hasComplexZoningControls,
  deriveParcelEvidenceStatus,
  deriveLandExcludingDevelopmentCosts,
};

if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.LTYAcquisition = api;
