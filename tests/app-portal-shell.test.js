const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.html'), 'utf8');
const tabBarMatch = app.match(/<div class="tab-bar">([\s\S]*?)<\/div>/i);

assert.ok(tabBarMatch, 'development portal must retain its application tab bar');
const tabBar = tabBarMatch[1];

assert.match(
  tabBar,
  /data-tab="finder"[^>]*>Development Opportunity Finder<\/button>/i,
  'finder tab must use the unified Development Opportunity Finder name'
);
assert.match(
  app,
  /<div id="tabFinder"[^>]*>[\s\S]*?<h3>Development Opportunity Finder<\/h3>/i,
  'finder panel heading must use the unified Development Opportunity Finder name'
);
assert.doesNotMatch(
  tabBar,
  /newsletter\.html|Legislative Edge Newsletter/i,
  'newsletter must not occupy a primary application menu tab'
);
assert.match(
  app,
  /<a[^>]+class="newsletter-side-cta"[^>]+href="newsletter\.html"[^>]*>[\s\S]*?Join Our Newsletter[\s\S]*?<\/a>/i,
  'portal must preserve newsletter access through a side CTA'
);

for (const tab of ['calculator', 'finder', 'pipeline', 'contacts']) {
  assert.match(tabBar, new RegExp(`data-tab="${tab}"`, 'i'), `portal must retain the ${tab} application tab`);
}
for (const href of ['sb79.html', 'bill-finder.html']) {
  assert.match(tabBar, new RegExp(`href="${href.replace('.', '\\.')}`), `portal must retain the ${href} destination`);
}

console.log('PASS development portal has unified finder naming and side newsletter access');
