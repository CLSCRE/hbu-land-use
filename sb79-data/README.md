# SB 79 Table 1C data (`sb79-data/`)

Official LA Planning **Table 1C - Sites Eligible for Phased Implementation** (May 5, 2026 snapshot), used by `lookupAPN()` in [`core-sb79.js`](../core-sb79.js).

## Files

| File | Purpose |
|------|---------|
| `apn-index.json` | Maps 10-digit APN to shard id, based on the first 4 APN digits |
| `apn-shards/shard-XXXX.json` | Compact per-APN records keyed by clean APN |
| `source-metadata.json` | Source URL, snapshot date, source document dates, row counts |
| `lookup-stats.json` | Status/pathway counts and top TOD zones |
| `extracted-text/` | Text extracts from related CPC exhibits |

## Build The Production Dataset

Preferred path, from the normalized APN lookup CSV:

```powershell
python scripts\build_sb79_from_normalized_csv.py
```

This stages the production lookup currently used by `sb79.html` and `app.html`: 139,450 APNs, 462 shard files, status/pathway counts, and source/date/page metadata.

The older PDF ingest scripts remain in `scripts/` for reference, but the normalized CSV builder is preferred because it preserves the source fields from the robust extraction workflow.

## Compact Record Schema

| Key | Meaning |
|-----|---------|
| `p` | APN disposition: `e` available to study, `t` temporary exemption, `x` permanent exclusion, `s` statutory exemption |
| `t` | SB 79 tier, 1 or 2 |
| `b` | Distance band: `a` adjacent, `i` inner, `o` outer |
| `x` | Temporary exemption pathway ids, such as `A`, `B(i)`, `B(ii)`, `B(iii)`, `D`, `F` |
| `pe` | Permanent exclusion: `w` one-mile walk, `h` industrial employment hub |
| `tz` | TOD zone / station area name |
| `zn` | Raw zoning |
| `zi` | Zoning incentive program eligibility from Table 1C |
| `ps` | Final phased status code, currently `phased_low_rise` |
| `lr` | Low-Rise Ordinance phased implementation flag |
| `se` | Statutory exemption flag |
| `sp` | Source PDF page in Table 1C |
| `rh` | Source row hash from the normalized extraction |

`expandSb79Record()` in `core-sb79.js` expands these into user-facing fields.

## Land To Yield Usage

Use `lookupAPN(apn)` for one-off checks. It returns `studyStatus`, `source`, `exemptions`, `permanentExclusions`, and a screening-grade `buildableLayers` object with base-zoning, Low-Rise, and SB 79 scenario shells.

Use the Developer Portal's SB 79 Opportunity Finder to monetize the data: visible parcel overlays, saved lists, CSV exports, and deep-analysis inputs all carry the APN status and source page forward.
