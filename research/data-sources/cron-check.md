# 30-Day Legislation Review Cycle

## Schedule
- Review cycle: Every 30 days
- Last review: 2026-03-11
- Next review due: 2026-04-10

## What to Check
1. **CA Legislature** (leginfo.legislature.ca.gov)
   - Search for new bills mentioning "accessory dwelling" or "ADU"
   - Check status of tracked bills in legislation-tracker.json

2. **LADBS** (ladbs.org)
   - Standard Plan Program updates
   - New pre-approved ADU designs
   - Fee schedule changes

3. **LA County DRP** (planning.lacounty.gov)
   - Pre-approved plan additions
   - ADU ordinance amendments

4. **CA HCD** (hcd.ca.gov)
   - ADU handbook revisions
   - New guidance memos

## How to Update
1. Update `legislation-tracker.json` with new lastChecked dates
2. Add entries to `update-log.md` documenting what changed
3. If legislation changed, update `CA_HOUSING_LEGISLATION` array in app.html
4. If jurisdiction rules changed, update `ADU_RULES` in app.html
5. If pre-approved plans changed, update `PREAPPROVED_ADU_PLANS` in app.html
