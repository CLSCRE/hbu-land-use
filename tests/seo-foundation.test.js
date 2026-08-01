const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(
  html,
  /<title>Los Angeles Parcel Feasibility[^<]*Land to Yield<\/title>/i,
  'homepage title must describe the Los Angeles parcel-feasibility outcome'
);
assert.match(
  html,
  /<link\s+rel="canonical"\s+href="https:\/\/landtoyield\.com\/"\s*\/?>(?:\s*)/i,
  'homepage must declare one canonical URL'
);

const nav = html.match(/<ul class="nav-links"[^>]*>([\s\S]*?)<\/ul>/i);
assert.ok(nav, 'homepage must have public navigation');
const navItems = nav[1].match(/<li\b/g) || [];
assert.strictEqual(navItems.length, 5, 'public navigation must contain exactly five choices');
for (const href of ['app.html', 'developers/', 'land-use-attorneys/', 'guides/', 'login.html']) {
  assert.ok(nav[1].includes(`href="${href}"`), `public navigation must link to ${href}`);
}

assert.match(
  html,
  /<a[^>]+href="app\.html"[^>]+data-primary-cta[^>]*>\s*Analyze a Parcel\s*<\/a>/i,
  'hero must expose one explicit Analyze a Parcel primary CTA'
);
assert.match(
  html,
  /\.hero-links\s+a\[data-primary-cta\][^{]*\{[^}]*background:[^;}]+;[^}]*color:\s*(?:#fff|var\(--white\))/is,
  'hero primary CTA must have a visually distinct background and high-contrast text'
);
assert.doesNotMatch(
  html,
  /id="role-portals"/i,
  'homepage must not make visitors choose among competing role portals'
);

assert.doesNotMatch(
  html,
  /2\.4M\+|LA County parcels covered|LA County Developer\s*&\s*Early Access User|any LA County address|all parcels within the City|what you can actually build|all applicable legislation|every allowable use|in 60 seconds|under 60 seconds|deliver in seconds|7 bills apply to this parcel|RECOMMEND — Meets all criteria|depth of a \$10,000 PDA|speed of a Google search/i,
  'homepage must not make universal coverage, timing, final-output, or anonymous testimonial claims'
);
assert.match(html, /Illustrative example only[\s\S]{0,300}fictional/i, 'mock walkthrough must be visibly labeled as fictional');
const publicCss = fs.readFileSync(path.join(root, 'assets', 'public-site.css'), 'utf8');
const amberTextMatch = publicCss.match(/--amber-text:(#[0-9a-f]{6})/i);
assert.ok(amberTextMatch, 'shared stylesheet must define an accessible text-only amber');
function relativeLuminance(hex) {
  const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255);
  const linear = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
function contrastRatio(foreground, background) {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}
assert.ok(contrastRatio(amberTextMatch[1], '#ffffff') >= 4.5, 'brand amber text must meet WCAG AA contrast on white');
assert.match(publicCss, /\.brand span\{color:var\(--amber-text\)\}/i, 'brand text must use the accessible amber token');
assert.doesNotMatch(
  publicCss,
  /\.nav-links\s+li:not\(:first-child\)\s*\{\s*display:\s*none/i,
  'shared mobile navigation must not hide all secondary destinations'
);
assert.match(publicCss, /@media\(max-width:780px\)[\s\S]*?overflow-x:auto/i, 'shared mobile navigation must remain reachable');
assert.match(publicCss, /@media\(max-width:780px\)[\s\S]*?\.nav-inner\{[^}]*min-width:0[^}]*width:100%/i, 'mobile nav must not widen and clip the page');

console.log('PASS homepage has one focused public conversion path');

const publicPages = [
  ['index.html', 'https://landtoyield.com/'],
  ['developers/index.html', 'https://landtoyield.com/developers/'],
  ['land-use-attorneys/index.html', 'https://landtoyield.com/land-use-attorneys/'],
  ['about-methodology/index.html', 'https://landtoyield.com/about-methodology/'],
  ['guides/index.html', 'https://landtoyield.com/guides/'],
  ['guides/evaluate-la-development-parcel/index.html', 'https://landtoyield.com/guides/evaluate-la-development-parcel/']
];

for (const [relativePath, canonical] of publicPages) {
  const pagePath = path.join(root, ...relativePath.split('/'));
  assert.ok(fs.existsSync(pagePath), `${relativePath} must exist`);
  const page = fs.readFileSync(pagePath, 'utf8');
  assert.match(page, /<meta\s+name="description"\s+content="[^"]{50,}"/i, `${relativePath} needs a useful description`);
  assert.strictEqual((page.match(/<link\s+rel="canonical"/gi) || []).length, 1, `${relativePath} needs one canonical tag`);
  assert.ok(page.includes(`<link rel="canonical" href="${canonical}">`), `${relativePath} needs its canonical URL`);
  assert.strictEqual((page.match(/<h1\b/gi) || []).length, 1, `${relativePath} must have exactly one H1`);
  const schemaBlocks = [...page.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  assert.ok(schemaBlocks.length > 0, `${relativePath} needs structured data`);
  for (const block of schemaBlocks) {
    const schema = JSON.parse(block[1]);
    assert.strictEqual(schema['@context'], 'https://schema.org', `${relativePath} schema needs schema.org context`);
    assert.ok(schema['@type'], `${relativePath} schema needs a type`);
    const schemaUrl = schema.url || schema.mainEntityOfPage;
    assert.strictEqual(schemaUrl, canonical, `${relativePath} schema URL must agree with its canonical`);
  }
}

const guide = fs.readFileSync(path.join(root, 'guides', 'evaluate-la-development-parcel', 'index.html'), 'utf8');
assert.match(guide, /class="answer-summary"/i, 'guide must open with a direct answer');
assert.match(guide, /What this means for a developer/i, 'guide must explain the developer implication');
assert.match(guide, /What an attorney must verify/i, 'guide must state attorney verification work');
assert.match(guide, /https:\/\/zimas\.lacity\.org\//i, 'guide must cite official ZIMAS');

const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
function parseXmlUrlset(xml) {
  const stack = [];
  const tags = [...xml.matchAll(/<([^>]+)>/g)].map(match => match[1].trim());
  for (const rawTag of tags) {
    if (rawTag.startsWith('?') || rawTag.startsWith('!')) continue;
    if (rawTag.startsWith('/')) {
      const name = rawTag.slice(1).trim();
      assert.strictEqual(stack.pop(), name, `sitemap has mismatched closing tag ${name}`);
      continue;
    }
    if (rawTag.endsWith('/')) continue;
    stack.push(rawTag.split(/\s+/)[0]);
  }
  assert.deepStrictEqual(stack, [], 'sitemap must be well-formed XML');
  assert.match(xml, /^<\?xml[^>]+>\s*<urlset\b/i, 'sitemap must have an XML declaration and urlset root');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
}
const sitemapUrls = parseXmlUrlset(sitemap);
const expectedSitemapUrls = publicPages.map(([, canonical]) => canonical);
assert.deepStrictEqual([...sitemapUrls].sort(), [...expectedSitemapUrls].sort(), 'sitemap URL set must exactly match public canonical pages');
assert.ok(!sitemapUrls.includes('https://landtoyield.com/app.html'), 'noindex application must stay out of sitemap');

const llms = fs.readFileSync(path.join(root, 'llms.txt'), 'utf8');
assert.match(llms, /^# Land to Yield/m, 'llms.txt must identify Land to Yield');
assert.match(llms, /preliminary screening/i, 'llms.txt must state the product limitation');

console.log('PASS public audience and authority pages are crawlable and source-backed');

const app = fs.readFileSync(path.join(root, 'app.html'), 'utf8');
assert.match(app, /<meta\s+name="robots"\s+content="noindex,\s*follow">/i, 'the conversion application must declare its intentional noindex policy');
assert.doesNotMatch(app, /full 27-tab HBU analysis for any LA County parcel|every allowable land use|instant APN eligibility lookup|all 8 exemption pathways/i, 'the conversion application must not promise universal or final outputs');

for (const [relativePath] of publicPages) {
  const pagePath = path.join(root, ...relativePath.split('/'));
  const page = fs.readFileSync(pagePath, 'utf8');
  const baseDir = path.dirname(pagePath);
  for (const href of [...page.matchAll(/href="([^"]+)"/gi)].map(match => match[1])) {
    if (/^(?:https?:|mailto:|tel:|#)/i.test(href)) continue;
    const cleanHref = href.split('#')[0].split('?')[0];
    const target = cleanHref.startsWith('/')
      ? path.join(root, cleanHref.replace(/^\/+/, ''))
      : path.resolve(baseDir, cleanHref);
    const resolved = cleanHref.endsWith('/') ? path.join(target, 'index.html') : target;
    assert.ok(fs.existsSync(resolved), `${relativePath} has a broken local link to ${href}`);
  }
}
console.log('PASS index policy, schema URLs, and internal public links are consistent');

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.match(pkg.scripts.test, /tests\/seo-foundation\.test\.js/, 'npm test must run the SEO foundation regression test');
assert.match(pkg.description, /preliminary.*City of Los Angeles/i, 'package metadata must match the preliminary City of Los Angeles coverage position');
assert.doesNotMatch(pkg.description, /instant|LA County parcels/i, 'package metadata must not retain universal or timing claims');
console.log('PASS SEO regression is part of the full test gate');
