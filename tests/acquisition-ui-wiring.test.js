'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function extractNamedFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} exists`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`Unclosed ${name}`);
}

for (const portal of ['app.html', 'lender.html', 'agent.html']) {
  const html = fs.readFileSync(path.join(__dirname, '..', portal), 'utf8');
  const context = vm.createContext({ console, window: {} });
  const coreScripts = [...html.matchAll(/<script src="(core-(?:data|geo|sb79|acquisition)\.js)(?:\?[^\"]*)?"><\/script>/g)]
    .map((match) => match[1]);
  assert.deepEqual(coreScripts.slice(0, 4), ['core-geo.js', 'core-sb79.js', 'core-data.js', 'core-acquisition.js'], `${portal} loads shared modules in dependency order`);
  for (const script of coreScripts) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', script), 'utf8'), context, { filename: script });
  }
  assert.equal(
    typeof context.resolveSb79ParcelContext,
    'function',
    `${portal} executes core-sb79 before its inline SB79 API calls`
  );
  assert.equal(typeof context.loadSb79Data, 'function', `${portal} executes the shared APN/source loader`);

  assert.match(html, /<script src="core-acquisition\.js\?v=/, `${portal} loads shared acquisition controls`);
  assert.match(
    html,
    /else if \(zoningResult && zoningResult\.raw\) \{\s*window\._zoningIsUnverified = true;/,
    `${portal} marks unmapped raw zoning unresolved`
  );
  assert.match(
    html,
    /evaluateAcquisitionReadiness\([\s\S]{0,900}canUnderwrite/,
    `${portal} checks shared readiness before underwriting`
  );
  assert.match(html, /rawZoning:\s*window\._rawZoning/, `${portal} sends source zoning to the shared gate`);
  assert.match(html, /deriveParcelEvidenceStatus\(window\.lastSb79Context\)/, `${portal} derives legal/source status from parcel evidence`);
  assert.match(html, /id="zimasConfirmed"/, `${portal} exposes explicit current ZIMAS confirmation`);
  assert.match(html, /id="zimasVerificationDate"/, `${portal} records the verification date`);
  assert.match(html, /applySb79VerificationEvidence\(/, `${portal} applies dated verification evidence`);
  assert.match(html, /async function lookupAddress\(\) \{[\s\S]*?window\._lookupGeneration = lookupGeneration;[\s\S]*?clearBlockedAcquisitionOutput\('Lookup in progress\./, `${portal} clears visible output and starts a lookup generation before validation`);
  assert.match(html, /clearBlockedAcquisitionOutput\('Lookup in progress\.[^']*'\);\s*window\.lastSb79Context = null;/, `${portal} clears stale APN evidence immediately on lookup`);
  assert.match(html, /evidenceApn:\s*parcelEvidenceStatus\.evidenceApn/, `${portal} binds readiness to the evidence APN`);
  assert.match(html, /parcelAreaEvidence:\s*window\._parcelAreaEvidence/, `${portal} sends APN-bound parcel-area provenance to readiness`);
  assert.match(html, /_parcelSizeEl\.addEventListener\('change',[\s\S]{0,320}_parcelAreaEvidence\s*=\s*null[\s\S]{0,220}clearBlockedAcquisitionOutput\(/, `${portal} invalidates area evidence and clears output after manual edits`);
  assert.match(html, /_zoningEl\.addEventListener\('change',[\s\S]{0,260}_zoningIsUnverified\s*=\s*true[\s\S]{0,200}clearBlockedAcquisitionOutput\(/, `${portal} clears output immediately after zoning changes`);
  assert.match(html, /handleVerificationEvidenceChange[\s\S]{0,320}applyCurrentZimasEvidence\(\)[\s\S]{0,220}clearBlockedAcquisitionOutput\(/, `${portal} clears output immediately after ZIMAS evidence changes`);
  assert.doesNotMatch(html, /_parcelSizeEl\.addEventListener\('change',[\s\S]{0,160}_parcelSizeIsUnverified\s*=\s*false/, `${portal} never treats a manual area edit as verified`);
  assert.match(html, /clearBlockedAcquisitionOutput\(/, `${portal} clears visible stale results when blocked`);
  assert.ok((html.match(/lookupGeneration !== window\._lookupGeneration/g) || []).length >= 2, `${portal} rejects stale async lookup responses`);
  assert.match(html, /sb79Panel\.replaceChildren\(\)/, `${portal} clears standalone SB79 parcel output`);
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, { style: { display: 'block' }, textContent: 'stale', replaceChildren() { this.textContent = ''; } });
    return elements.get(id);
  };
  let mapRemoved = false;
  const clearContext = vm.createContext({
    document: { getElementById: element },
    mapRemoved,
  });
  vm.runInContext(
    `var sb79Map = { remove: function() { mapRemoved = true; } }; var lastResults = { stale: true }; var lastInputs = { stale: true };\n` +
    extractNamedFunction(html, 'clearBlockedAcquisitionOutput') +
    `\nclearBlockedAcquisitionOutput('cleared'); result = { mapRemoved, mapDisplay: document.getElementById('mapSection').style.display, lastResults, lastInputs };`,
    clearContext
  );
  assert.equal(clearContext.result.mapRemoved, true, `${portal} removes the active stale map`);
  assert.equal(clearContext.result.mapDisplay, 'none', `${portal} hides stale mapSection`);
  assert.equal(clearContext.result.lastResults, null, `${portal} clears stale result state with map`);
  assert.equal(clearContext.result.lastInputs, null, `${portal} clears stale input state with map`);
  assert.doesNotMatch(html, /legalPathStatus:\s*window\._zoningIsUnverified/, `${portal} does not infer legal status from zoning`);
  assert.doesNotMatch(html, /criticalSourceStatus:\s*'current'/, `${portal} does not hardcode source currency`);
  assert.match(html, /hasComplexZoningControls\(zoningResult\.raw\)/, `${portal} keeps conditioned zoning unresolved`);
  assert.match(
    html,
    /_zoningEl\.addEventListener\('change',[\s\S]{0,120}_zoningIsUnverified\s*=\s*true/,
    `${portal} treats manual zoning changes as unverified`
  );
}

const app = fs.readFileSync(path.join(__dirname, '..', 'app.html'), 'utf8');
assert.doesNotMatch(app, /bid \* 0\.9|bid \* 1\.1/, 'developer summary removes arbitrary plus/minus 10 percent band');
assert.match(app, /computeControlledOffer\(/, 'developer summary uses shared controlled offer calculation');
assert.match(app, /requiredDeveloperProfit/, 'developer summary passes an explicit developer profit hurdle');
assert.match(app, /riskReserve/, 'developer summary passes an explicit risk reserve');
assert.match(app, /deriveLandExcludingDevelopmentCosts\(budget\)/, 'developer summary derives costs without assumed land financing');
assert.doesNotMatch(app, /devCostsExLand\s*=\s*\(budget\.totalHard[^;]+budget\.totalSoft/, 'developer summary does not label land-dependent total soft costs as excluding land');
assert.match(app, /lastResults = null;[\s\S]{0,300}lastInputs = null;[\s\S]{0,300}canUnderwrite/, 'blocked calculation clears prior result state');
assert.match(app, /_origCalcHBU\.apply\([\s\S]{0,300}lastAcquisitionReadiness[\s\S]{0,200}return;/, 'developer summary wrapper stops after a blocked calculation');

console.log('PASS all role portals fail closed and developer offer uses controlled hurdles');
