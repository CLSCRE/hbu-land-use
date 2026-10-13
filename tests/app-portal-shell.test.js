const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.html'), 'utf8');
const tabBarMatch = app.match(/<div class="tab-bar"[^>]*>([\s\S]*?)<\/div>/i);

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

const tabs = [...tabBar.matchAll(/data-tab="([a-z]+)"/gi)].map(m => m[1]);
assert.deepStrictEqual(
  tabs,
  ['calculator', 'finder', 'pipeline', 'contacts'],
  'portal must expose exactly four tools: HBU, finder, permit data, contacts'
);
assert.doesNotMatch(tabBar, /<a\b/i, 'tab bar holds in-page tools only; linked pages belong in the nav');
assert.match(tabBar, /data-tab="pipeline"[^>]*>Active Permit Data<\/button>/i, 'pipeline tab must be labeled Active Permit Data');

const nav = (app.match(/<nav class="nav"[\s\S]*?<\/nav>/i) || [''])[0];
for (const href of ['sb79.html', 'bill-finder.html', '/api/auth/logout']) {
  assert.ok(nav.includes(`href="${href}"`), `portal nav must keep the ${href} destination`);
}

console.log('PASS development portal has four tools, unified finder naming, and nav access to SB 79, Bill Finder, and the newsletter');
