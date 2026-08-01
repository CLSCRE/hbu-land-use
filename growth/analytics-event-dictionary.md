# LandToYield Analytics Event Dictionary

**Analytics:** Plausible is already installed on the public site. Prefer its custom events before adding GA4/GTM complexity.

## Acquisition events

| Event | Trigger | Useful properties |
|---|---|---|
| `audience_developer_viewed` | Developer page loads | referrer, campaign |
| `audience_attorney_viewed` | Attorney page loads | referrer, campaign |
| `guide_viewed` | Canonical guide loads | guide slug, audience |
| `guide_tool_clicked` | Guide visitor clicks Analyze a Parcel | guide slug, CTA location |
| `newsletter_clicked` | Visitor clicks Legislative Edge CTA | source page |
| `attorney_council_requested` | Visitor starts Attorney Council email/form | source page |

## Product events

| Event | Trigger | Useful properties |
|---|---|---|
| `parcel_lookup_started` | Valid lookup is submitted | input type: address/APN |
| `parcel_lookup_resolved` | Exact parcel context is established | jurisdiction, source set |
| `parcel_lookup_blocked` | Lookup cannot establish required evidence | blocker category |
| `verification_step_viewed` | User opens parcel verification | stage |
| `underwriting_started` | User begins a scenario | pathway, screening status |
| `report_exported` | User exports a supported report | report type |
| `email_report_requested` | User requests an emailed report | report type |
| `financing_help_requested` | User requests Commercial Lending Solutions contact | source stage |

## Privacy controls

- Never send an address, APN, name, email, parcel geometry, financing amount, or free-form user text to analytics.
- Event properties should use controlled categories, not raw inputs.
- Do not treat a button click as a completed lead if it only opens email.
- Document and test any backend confirmation event separately.

## Weekly dashboard

1. Organic landing sessions by canonical page
2. Non-brand search impressions and clicks
3. Guide -> tool click rate
4. Lookup starts
5. Resolved versus blocked lookups
6. Attorney Council requests
7. Newsletter signups
8. Qualified developer/attorney conversations tracked manually

## Implementation order

1. Add public acquisition events after the new pages are live.
2. Verify events in Plausible real-time/debug reporting.
3. Add product events only where a state transition is deterministic.
4. Establish a baseline before any paid campaign.
