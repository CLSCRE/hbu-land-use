'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
}

(async () => {
  const elements = Object.fromEntries(
    ['constFlood', 'constHillside', 'constHistoric', 'constFault', 'constCoastal']
      .map(id => [id, { checked: false }])
  );
  const statuses = [];
  let autofills = 0;
  const requests = new Map();
  const context = {
    console,
    Math,
    Date,
    URLSearchParams,
    fetch: async () => { throw new Error('unexpected network request'); },
    window: { _lookupGeneration: 1, _lastFireCheck: null },
    document: { getElementById: id => elements[id] || null },
    markAutofill: () => { autofills += 1; },
    addStatus: message => { statuses.push(message); },
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(path.resolve(__dirname, '..', 'core-geo.js'), 'utf8'),
    context,
    { filename: 'core-geo.js' }
  );
  context.fetchConstraintsFromGIS = lat => {
    const request = deferred();
    requests.set(lat, request);
    return request.promise;
  };

  const oldRequest = context.refineConstraintsFromGIS(1, 1, 1);
  context.window._lookupGeneration = 2;
  const newRequest = context.refineConstraintsFromGIS(2, 2, 2);

  requests.get(2).resolve({
    constFlood: false, constHillside: false, constHistoric: true,
    constFault: false, constCoastal: false,
  });
  await newRequest;
  assert.equal(elements.constHistoric.checked, true);
  assert.equal(elements.constFlood.checked, false);
  assert.equal(autofills, 1);
  assert.equal(statuses.length, 1);

  requests.get(1).resolve({
    constFlood: true, constHillside: true, constHistoric: false,
    constFault: true, constCoastal: true,
  });
  await oldRequest;
  assert.equal(elements.constHistoric.checked, true, 'old GIS response cannot alter newer historic status');
  assert.equal(elements.constFlood.checked, false, 'old GIS response cannot alter newer flood status');
  assert.equal(elements.constHillside.checked, false, 'old GIS response cannot alter newer hillside status');
  assert.equal(elements.constFault.checked, false, 'old GIS response cannot alter newer fault status');
  assert.equal(elements.constCoastal.checked, false, 'old GIS response cannot alter newer coastal status');
  assert.equal(autofills, 1, 'old GIS response cannot mark stale autofill');
  assert.equal(statuses.length, 1, 'old GIS response cannot append stale status');

  assert.equal(context.applyFireCheckForGeneration({ inPerimeter: false }, 2), true);
  assert.deepEqual(context.window._lastFireCheck, { inPerimeter: false });
  assert.equal(context.applyFireCheckForGeneration({ inPerimeter: true }, 1), false);
  assert.deepEqual(context.window._lastFireCheck, { inPerimeter: false }, 'old fire response cannot replace newer fire status');

  for (const portal of ['app.html', 'lender.html', 'agent.html']) {
    const html = fs.readFileSync(path.resolve(__dirname, '..', portal), 'utf8');
    assert.match(html, /applyFireCheckForGeneration\(f, lookupGeneration\)/, `${portal} generation-binds fire response`);
    assert.match(html, /refineConstraintsFromGIS\(coords\.lat, coords\.lon, lookupGeneration\)/, `${portal} generation-binds GIS constraints`);
  }

  console.log('PASS delayed old hazard responses cannot overwrite a newer lookup');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
