# Claude Code Instructions — HBU Land Use Portal Update
# Project: C:\Users\tdamy\OneDrive - CLS CRE\CLS CRE\Brokerage\AI - ChatGPT\Claude Code\HBU Land Use - Perplexity

---

## TASK 1: Create lender.html by cloning app.html

Run in PowerShell from the project folder:

```powershell
Copy-Item app.html lender.html
```

Then open lender.html and make ONLY these three text changes:

### Change 1 — Document title (line 6)
FIND:
```html
<title>Highest &amp; Best Use Calculator — Los Angeles, CA</title>
```
REPLACE WITH:
```html
<title>HBU Land Use – Lender &amp; Capital Portal</title>
```

### Change 2 — Main h1 heading (line 2326)
FIND:
```html
<h1>Highest &amp; Best Use Calculator</h1>
```
REPLACE WITH:
```html
<h1>Highest &amp; Best Use Calculator — Lender &amp; Capital Portal</h1>
```

### Change 3 — Header subtitle (line 2327)
FIND:
```html
<p>Land Use Analysis for Los Angeles, CA</p>
```
REPLACE WITH:
```html
<p>Collateral &amp; Land Use Analysis for Lenders and Capital Partners</p>
```

### Change 4 — Header badge (line 2328)
FIND:
```html
<span class="badge">HBU Analysis Tool</span>
```
REPLACE WITH:
```html
<span class="badge">Lender &amp; Capital Portal</span>
```

### Change 5 — Contacts intro box (line 2808)
FIND:
```html
<p>Your <strong>one-stop shop</strong> for all development-related contacts in Los Angeles County. Planning departments, city officials, architects, engineers, contractors, lenders, and consultants. Filter by category or search by name.</p>
```
REPLACE WITH:
```html
<p>Your <strong>one-stop shop</strong> for all development and capital-related contacts in Los Angeles County. Planning departments, city officials, architects, engineers, contractors, lenders, and capital partners. Filter by category or search by name.</p>
```

DO NOT change any IDs, class names, script tags, script order, data attributes, or logic. Only the five text changes above.

---

## TASK 2: Clean up index.html — Remove duplicate role section

The hero section (lines 417–436) already contains working portal cards for all three portals. The `#role-portals` section (lines 445–471) is a duplicate and must be removed.

FIND and DELETE this entire block (lines 445–471):
```html
<!-- ── ROLE PORTALS ── -->
<section id="role-portals" class="role-portals">
    <div class="role-portals-inner">
        <h2>Choose your portal</h2>
        <p>Select the experience that best matches your role. All portals use the same highest-and-best-use engine, tailored to your workflow.</p>

        <div class="role-grid">
            <a href="app.html" class="role-card role-card-developer">
                <h3>Developer Portal</h3>
                <p>Deep feasibility, SB 79 transit overlays, and full land use tools to identify and underwrite the best sites.</p>
                <span class="role-cta">Enter Developer Portal &rarr;</span>
            </a>

            <a href="agent.html" class="role-card role-card-agent">
                <h3>Agent Portal</h3>
                <p>Find homeowners sitting on hidden land value, rank listing opportunities, and generate owner-facing one-pagers in minutes.</p>
                <span class="role-cta">Enter Agent Portal &rarr;</span>
            </a>

            <a href="lender.html" class="role-card role-card-lender">
                <h3>Lender &amp; Capital Portal</h3>
                <p>Quickly assess collateral quality, use options, and pipeline around any parcel using the same engine your borrowers rely on.</p>
                <span class="role-cta">Enter Lender Portal &rarr;</span>
            </a>
        </div>
    </div>
</section>
```

Also remove any orphaned CSS for `.role-portals`, `.role-portals-inner`, `.role-grid`, `.role-card`, `.role-cta` if present in the `<style>` block. These classes are not used anywhere else.

---

## TASK 3: Add Lender Portal link to footer in index.html

FIND (line 694–695):
```html
            <a href="app.html">Developer Portal</a>
            <a href="agent.html">Agent Portal</a>
```
REPLACE WITH:
```html
            <a href="app.html">Developer Portal</a>
            <a href="agent.html">Agent Portal</a>
            <a href="lender.html">Lender Portal</a>
```

---

## TASK 4: Update nav "Launch Tool" button in index.html

The nav currently has a "Launch Tool" button pointing directly to app.html (line 402). Since the hero now serves as the role chooser, update this to scroll to the portal cards.

FIND (line 402):
```html
            <li><a href="app.html" class="btn btn-primary">Launch Tool</a></li>
```
REPLACE WITH:
```html
            <li><a href="#role-portals" class="btn btn-primary">Choose Portal</a></li>
```

Then add an `id` to the hero portal cards section so the anchor works. FIND (line 417):
```html
        <div class="portal-cards">
```
REPLACE WITH:
```html
        <div class="portal-cards" id="role-portals">
```

---

## SANITY CHECKS

After all changes:

1. Open index.html — confirm hero shows 3 portal cards, no duplicate section below it, footer has all 3 portal links, nav "Choose Portal" scrolls to hero cards.
2. Open lender.html — confirm it loads identically to app.html in behavior. Confirm title, h1, subtitle, and badge are lender-oriented. Confirm all tabs work.
3. Open app.html — confirm it is completely unchanged.
4. Open agent.html — confirm it is completely unchanged.

---

## PHASE 2 (next session)

Once Phase 1 is confirmed working:
- Define a shared `dealObject` in JS
- Extract HBU scoring/engine logic into `core-hbu.js`
- Have all three portals load from the shared core
