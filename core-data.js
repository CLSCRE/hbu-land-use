// ============================================================
//  CORE DATA — Land to Yield Portal Suite
//  Shared data constants for HBU scoring, building params,
//  market data, and legislation.
//  Used by: app.html, lender.html, agent.html
//
//  All declarations use `var` so portals can override during
//  migration. Once inline copies are removed, these are the
//  single source of truth.
// ============================================================


// ============================================================
//  SCORING CONSTANTS — Land Uses, Zoning, Demand, Parcel Mins
// ============================================================

LAND_USES = [
    { id: 'sfr',            name: 'Single-Family Residential',      icon: '🏡' },
    { id: 'duplex',         name: 'Duplex / Two-Unit',              icon: '🏘️' },
    { id: 'multifamily_low', name: 'Multi-Family (Low-Rise)',       icon: '🏢' },
    { id: 'multifamily_mid', name: 'Multi-Family (Mid-Rise)',       icon: '🏙️' },
    { id: 'multifamily_high', name: 'Multi-Family (High-Rise)',     icon: '🏗️' },
    { id: 'mixeduse',       name: 'Mixed-Use (Retail + Residential)', icon: '🏬' },
    { id: 'retail',         name: 'Retail / Restaurant',            icon: '🛍️' },
    { id: 'office',         name: 'Office / Professional',          icon: '🏛️' },
    { id: 'medical',        name: 'Medical Office',                 icon: '🏥' },
    { id: 'hotel',          name: 'Hotel / Hospitality',            icon: '🏨' },
    { id: 'industrial',     name: 'Industrial / Warehouse',         icon: '🏭' },
    { id: 'selfstorage',    name: 'Self-Storage',                   icon: '📦' },
    { id: 'senior',         name: 'Senior Living / Assisted',       icon: '🧓' },
    { id: 'parking',        name: 'Parking Structure / Lot',        icon: '🅿️' },
    { id: 'creative',       name: 'Creative Office / Flex',         icon: '🎨' },
    { id: 'adu',            name: 'ADU / Small-Lot Subdivision',    icon: '🏠' },
];

// Zoning → which uses are legally permissible
// 0 = not permitted, 0.5 = conditional/CUP required, 1.0 = by-right
ZONING_MATRIX = {
    'R1':  { sfr:1, duplex:0, multifamily_low:0, multifamily_mid:0, multifamily_high:0, mixeduse:0, retail:0, office:0, medical:0, hotel:0, industrial:0, selfstorage:0, senior:0.5, parking:0, creative:0, adu:1 },
    'R2':  { sfr:1, duplex:1, multifamily_low:0.5, multifamily_mid:0, multifamily_high:0, mixeduse:0, retail:0, office:0, medical:0, hotel:0, industrial:0, selfstorage:0, senior:0.5, parking:0, creative:0, adu:1 },
    'R3':  { sfr:1, duplex:1, multifamily_low:1, multifamily_mid:0.5, multifamily_high:0, mixeduse:0, retail:0, office:0, medical:0, hotel:0, industrial:0, selfstorage:0, senior:0.5, parking:0.5, creative:0, adu:1 },
    'R4':  { sfr:0.5, duplex:1, multifamily_low:1, multifamily_mid:1, multifamily_high:0.5, mixeduse:0, retail:0, office:0, medical:0, hotel:0, industrial:0, selfstorage:0, senior:1, parking:0.5, creative:0, adu:1 },
    'R5':  { sfr:0, duplex:0.5, multifamily_low:1, multifamily_mid:1, multifamily_high:1, mixeduse:0, retail:0, office:0, medical:0, hotel:0.5, industrial:0, selfstorage:0, senior:1, parking:0.5, creative:0, adu:1 },
    'C1':  { sfr:0, duplex:0, multifamily_low:0.5, multifamily_mid:0, multifamily_high:0, mixeduse:0.5, retail:1, office:1, medical:1, hotel:0, industrial:0, selfstorage:0, senior:0, parking:1, creative:0.5, adu:0 },
    'C1.5':{ sfr:0, duplex:0, multifamily_low:0.5, multifamily_mid:0.5, multifamily_high:0, mixeduse:1, retail:1, office:1, medical:1, hotel:0.5, industrial:0, selfstorage:0, senior:0.5, parking:1, creative:0.5, adu:0 },
    'C2':  { sfr:0, duplex:0, multifamily_low:1, multifamily_mid:1, multifamily_high:0.5, mixeduse:1, retail:1, office:1, medical:1, hotel:1, industrial:0, selfstorage:0.5, senior:1, parking:1, creative:1, adu:0 },
    'C4':  { sfr:0, duplex:0, multifamily_low:0.5, multifamily_mid:1, multifamily_high:0.5, mixeduse:1, retail:1, office:1, medical:1, hotel:1, industrial:0, selfstorage:0.5, senior:0.5, parking:1, creative:1, adu:0 },
    'C5':  { sfr:0, duplex:0, multifamily_low:0, multifamily_mid:0.5, multifamily_high:0, mixeduse:0.5, retail:1, office:1, medical:0.5, hotel:0.5, industrial:0, selfstorage:0.5, senior:0, parking:1, creative:0.5, adu:0 },
    'CM':  { sfr:0, duplex:0, multifamily_low:0, multifamily_mid:0, multifamily_high:0, mixeduse:0.5, retail:0.5, office:1, medical:0.5, hotel:0, industrial:0.5, selfstorage:1, senior:0, parking:1, creative:1, adu:0 },
    'M1':  { sfr:0, duplex:0, multifamily_low:0, multifamily_mid:0, multifamily_high:0, mixeduse:0, retail:0.5, office:0.5, medical:0, hotel:0, industrial:1, selfstorage:1, senior:0, parking:1, creative:1, adu:0 },
    'M2':  { sfr:0, duplex:0, multifamily_low:0, multifamily_mid:0, multifamily_high:0, mixeduse:0, retail:0, office:0, medical:0, hotel:0, industrial:1, selfstorage:1, senior:0, parking:1, creative:0.5, adu:0 },
    'M3':  { sfr:0, duplex:0, multifamily_low:0, multifamily_mid:0, multifamily_high:0, mixeduse:0, retail:0, office:0, medical:0, hotel:0, industrial:1, selfstorage:0.5, senior:0, parking:1, creative:0, adu:0 },
    'PF':  { sfr:0, duplex:0, multifamily_low:0, multifamily_mid:0, multifamily_high:0, mixeduse:0, retail:0, office:0.5, medical:0.5, hotel:0, industrial:0, selfstorage:0, senior:0.5, parking:0.5, creative:0, adu:0 },
    'OS':  { sfr:0, duplex:0, multifamily_low:0, multifamily_mid:0, multifamily_high:0, mixeduse:0, retail:0, office:0, medical:0, hotel:0, industrial:0, selfstorage:0, senior:0, parking:0, creative:0, adu:0 },
    'LAX': { sfr:0, duplex:0, multifamily_low:0, multifamily_mid:0, multifamily_high:0, mixeduse:0, retail:0.5, office:0.5, medical:0, hotel:0.5, industrial:0.5, selfstorage:0.5, senior:0, parking:1, creative:0, adu:0 },
    'TOD': { sfr:0, duplex:0.5, multifamily_low:1, multifamily_mid:1, multifamily_high:1, mixeduse:1, retail:1, office:1, medical:1, hotel:1, industrial:0, selfstorage:0, senior:1, parking:0.5, creative:1, adu:0.5 },
};

// Neighborhood market demand multipliers (1.0 = average)
NEIGHBORHOOD_DEMAND = {
    dtla:         { sfr:0.3, duplex:0.4, multifamily_low:1.1, multifamily_mid:1.3, multifamily_high:1.4, mixeduse:1.4, retail:1.2, office:1.3, medical:0.7, hotel:1.3, industrial:0.5, selfstorage:0.7, senior:0.6, parking:1.3, creative:1.4, adu:0.3 },
    hollywood:    { sfr:0.5, duplex:0.7, multifamily_low:1.2, multifamily_mid:1.3, multifamily_high:1.1, mixeduse:1.3, retail:1.2, office:1.0, medical:0.8, hotel:1.2, industrial:0.3, selfstorage:0.7, senior:0.5, parking:1.1, creative:1.3, adu:0.6 },
    koreatown:    { sfr:0.4, duplex:0.6, multifamily_low:1.3, multifamily_mid:1.4, multifamily_high:1.2, mixeduse:1.3, retail:1.2, office:0.9, medical:1.1, hotel:1.0, industrial:0.3, selfstorage:0.8, senior:0.8, parking:1.2, creative:0.9, adu:0.5 },
    westside:     { sfr:1.0, duplex:0.9, multifamily_low:1.1, multifamily_mid:1.2, multifamily_high:0.9, mixeduse:1.2, retail:1.1, office:1.2, medical:1.3, hotel:1.0, industrial:0.2, selfstorage:0.6, senior:1.0, parking:1.0, creative:1.1, adu:0.9 },
    santamonica:  { sfr:0.8, duplex:0.8, multifamily_low:1.0, multifamily_mid:1.1, multifamily_high:0.8, mixeduse:1.2, retail:1.3, office:1.1, medical:1.0, hotel:1.1, industrial:0.2, selfstorage:0.4, senior:0.8, parking:1.0, creative:1.2, adu:0.7 },
    beverly:      { sfr:1.2, duplex:0.8, multifamily_low:1.0, multifamily_mid:1.1, multifamily_high:0.9, mixeduse:1.1, retail:1.1, office:1.3, medical:1.4, hotel:1.1, industrial:0.1, selfstorage:0.3, senior:1.0, parking:0.9, creative:0.9, adu:0.7 },
    midcity:      { sfr:0.7, duplex:0.8, multifamily_low:1.2, multifamily_mid:1.2, multifamily_high:0.8, mixeduse:1.2, retail:1.0, office:0.9, medical:1.0, hotel:0.8, industrial:0.3, selfstorage:0.8, senior:0.9, parking:0.9, creative:1.0, adu:0.8 },
    southla:      { sfr:0.9, duplex:1.0, multifamily_low:1.1, multifamily_mid:0.8, multifamily_high:0.4, mixeduse:0.8, retail:0.8, office:0.5, medical:0.7, hotel:0.4, industrial:0.9, selfstorage:1.1, senior:0.7, parking:0.6, creative:0.6, adu:1.1 },
    valleyeast:   { sfr:1.1, duplex:1.0, multifamily_low:1.0, multifamily_mid:0.8, multifamily_high:0.5, mixeduse:0.9, retail:0.9, office:0.8, medical:0.9, hotel:0.6, industrial:1.0, selfstorage:1.1, senior:0.9, parking:0.7, creative:0.7, adu:1.0 },
    valleywest:   { sfr:1.2, duplex:1.0, multifamily_low:0.9, multifamily_mid:0.8, multifamily_high:0.4, mixeduse:0.9, retail:0.9, office:0.9, medical:1.0, hotel:0.6, industrial:0.8, selfstorage:1.0, senior:1.0, parking:0.6, creative:0.7, adu:1.0 },
    silverlake:   { sfr:0.9, duplex:0.9, multifamily_low:1.2, multifamily_mid:1.0, multifamily_high:0.5, mixeduse:1.2, retail:1.1, office:0.8, medical:0.7, hotel:0.7, industrial:0.3, selfstorage:0.5, senior:0.5, parking:0.7, creative:1.3, adu:1.0 },
    highland:     { sfr:0.9, duplex:0.9, multifamily_low:1.1, multifamily_mid:0.9, multifamily_high:0.4, mixeduse:1.1, retail:1.0, office:0.7, medical:0.7, hotel:0.5, industrial:0.5, selfstorage:0.7, senior:0.5, parking:0.6, creative:1.1, adu:1.0 },
    venice:       { sfr:0.9, duplex:0.8, multifamily_low:1.0, multifamily_mid:0.9, multifamily_high:0.5, mixeduse:1.2, retail:1.2, office:1.0, medical:0.7, hotel:1.0, industrial:0.2, selfstorage:0.3, senior:0.6, parking:0.8, creative:1.3, adu:0.8 },
    culver:       { sfr:0.8, duplex:0.8, multifamily_low:1.1, multifamily_mid:1.1, multifamily_high:0.7, mixeduse:1.2, retail:1.0, office:1.2, medical:1.0, hotel:0.9, industrial:0.5, selfstorage:0.7, senior:0.8, parking:0.8, creative:1.3, adu:0.8 },
    exposition:   { sfr:0.6, duplex:0.7, multifamily_low:1.2, multifamily_mid:1.2, multifamily_high:0.9, mixeduse:1.2, retail:1.0, office:0.9, medical:0.8, hotel:0.7, industrial:0.4, selfstorage:0.8, senior:0.7, parking:0.9, creative:1.0, adu:0.8 },
    southbay:     { sfr:1.0, duplex:0.9, multifamily_low:0.9, multifamily_mid:0.7, multifamily_high:0.3, mixeduse:0.8, retail:0.9, office:0.8, medical:1.0, hotel:0.7, industrial:1.2, selfstorage:1.1, senior:0.9, parking:0.6, creative:0.6, adu:0.9 },
    harbor:       { sfr:0.7, duplex:0.7, multifamily_low:0.8, multifamily_mid:0.6, multifamily_high:0.3, mixeduse:0.7, retail:0.7, office:0.5, medical:0.6, hotel:0.6, industrial:1.3, selfstorage:1.1, senior:0.7, parking:0.7, creative:0.5, adu:0.7 },
    boyleheights: { sfr:0.9, duplex:1.0, multifamily_low:1.1, multifamily_mid:0.7, multifamily_high:0.3, mixeduse:0.9, retail:0.9, office:0.5, medical:0.6, hotel:0.3, industrial:0.8, selfstorage:0.9, senior:0.6, parking:0.5, creative:0.8, adu:1.1 },
};

// Minimum parcel sizes (sq ft) for feasibility
MIN_PARCEL = {
    sfr: 2500, duplex: 3500, multifamily_low: 5000, multifamily_mid: 10000,
    multifamily_high: 20000, mixeduse: 5000, retail: 2000, office: 3000,
    medical: 3000, hotel: 15000, industrial: 5000, selfstorage: 8000,
    senior: 15000, parking: 3000, creative: 3000, adu: 3000
};

// Approx LA land value per SF by neighborhood (for relative comparisons)
LAND_VALUE_PSF = {
    dtla: 250, hollywood: 250, koreatown: 200, westside: 350, santamonica: 400,
    beverly: 450, midcity: 180, southla: 85, valleyeast: 110, valleywest: 130,
    silverlake: 220, highland: 150, venice: 350, culver: 260, exposition: 160,
    southbay: 120, harbor: 80, boyleheights: 110
};

// Median market value per structure SF by neighborhood (2025 LA County comps)
MARKET_VALUE_PSF = {
    dtla: 650, hollywood: 700, koreatown: 550, westside: 900, santamonica: 1100,
    beverly: 1000, midcity: 750, southla: 450, valleyeast: 550, valleywest: 600,
    silverlake: 800, highland: 600, venice: 1000, culver: 800, exposition: 550,
    southbay: 700, harbor: 450, boyleheights: 500
};


// ============================================================
//  VALUATION — Cap Rates, Price Index
// ============================================================

// Cap rates by neighborhood and property type (2025 LA County)
CAP_RATES = {
    dtla: { residential: 0.045, retail: 0.055, office: 0.065 },
    hollywood: { residential: 0.042, retail: 0.052, office: 0.060 },
    koreatown: { residential: 0.048, retail: 0.058, office: 0.068 },
    westside: { residential: 0.038, retail: 0.048, office: 0.055 },
    santamonica: { residential: 0.035, retail: 0.045, office: 0.052 },
    beverly: { residential: 0.038, retail: 0.045, office: 0.052 },
    midcity: { residential: 0.047, retail: 0.057, office: 0.067 },
    southla: { residential: 0.055, retail: 0.068, office: 0.078 },
    valleyeast: { residential: 0.050, retail: 0.062, office: 0.072 },
    valleywest: { residential: 0.048, retail: 0.060, office: 0.070 },
    silverlake: { residential: 0.040, retail: 0.050, office: 0.058 },
    highland: { residential: 0.048, retail: 0.058, office: 0.068 },
    venice: { residential: 0.038, retail: 0.048, office: 0.055 },
    culver: { residential: 0.040, retail: 0.050, office: 0.058 },
    exposition: { residential: 0.048, retail: 0.058, office: 0.068 },
    southbay: { residential: 0.050, retail: 0.060, office: 0.070 },
    harbor: { residential: 0.055, retail: 0.068, office: 0.078 },
    boyleheights: { residential: 0.052, retail: 0.065, office: 0.075 },
};

// ── LA County Home Price Index ───────────────────────────────────
LA_PRICE_INDEX = {
    1975: 14.0, 1976: 12.5, 1977: 10.8, 1978: 9.0, 1979: 7.5,
    1980: 6.8, 1981: 6.3, 1982: 6.0, 1983: 5.7, 1984: 5.4,
    1985: 5.0, 1986: 4.5, 1987: 3.8, 1988: 3.2, 1989: 2.8,
    1990: 2.7, 1991: 2.9, 1992: 3.1, 1993: 3.3, 1994: 3.4,
    1995: 3.5, 1996: 3.5, 1997: 3.4, 1998: 3.2, 1999: 3.0,
    2000: 2.9, 2001: 2.7, 2002: 2.4, 2003: 2.1, 2004: 1.8,
    2005: 1.55, 2006: 1.6, 2007: 1.75, 2008: 2.2, 2009: 2.6,
    2010: 2.5, 2011: 2.6, 2012: 2.4, 2013: 2.1, 2014: 1.95,
    2015: 1.85, 2016: 1.75, 2017: 1.6, 2018: 1.5, 2019: 1.45,
    2020: 1.38, 2021: 1.18, 2022: 1.08, 2023: 1.05, 2024: 1.02,
    2025: 1.0, 2026: 1.0
};


// ============================================================
//  REVENUE & COST CONSTANTS
// ============================================================

// Revenue potential per NSF of building (annual $/SF, new-construction achievable rents)
REVENUE_PSF = {
    sfr: 40, duplex: 42, multifamily_low: 52, multifamily_mid: 58,
    multifamily_high: 66, mixeduse: 56, retail: 52, office: 52,
    medical: 62, hotel: 90, industrial: 22, selfstorage: 24,
    senior: 62, parking: 30, creative: 52, adu: 54
};

// Neighborhood rent multiplier — adjusts REVENUE_PSF by submarket
NEIGHBORHOOD_RENT_MULT = {
    dtla: 0.95, hollywood: 1.10, koreatown: 0.88, westside: 1.25, santamonica: 1.35,
    beverly: 1.40, midcity: 1.00, southla: 0.70, valleyeast: 0.82, valleywest: 0.85,
    silverlake: 1.08, highland: 0.88, venice: 1.25, culver: 1.12, exposition: 0.88,
    southbay: 0.85, harbor: 0.70, boyleheights: 0.75
};

// Parking cost per space by building type
PARKING_COST_MAP = {
    sfr: 8000, duplex: 8000, multifamily_low: 30000, multifamily_mid: 40000,
    multifamily_high: 65000, mixeduse: 40000, retail: 8000, office: 40000,
    medical: 40000, hotel: 55000, industrial: 5000, selfstorage: 5000,
    senior: 30000, parking: 35000, creative: 8000, adu: 5000
};

// Build cost per SF (LA 2024-2025 market)
BUILD_COST_PSF = {
    sfr: 300, duplex: 275, multifamily_low: 310, multifamily_mid: 400,
    multifamily_high: 575, mixeduse: 420, retail: 260, office: 365,
    medical: 430, hotel: 480, industrial: 150, selfstorage: 110,
    senior: 400, parking: 85, creative: 290, adu: 400
};

// FAR (floor area ratio) by use — typical LA densities
FAR_TYPICAL = {
    sfr: 0.5, duplex: 0.6, multifamily_low: 1.5, multifamily_mid: 3.0,
    multifamily_high: 6.0, mixeduse: 3.0, retail: 0.5, office: 2.0,
    medical: 1.5, hotel: 4.0, industrial: 0.5, selfstorage: 2.5,
    senior: 2.5, parking: 3.0, creative: 1.5, adu: 0.5
};

// Rationale templates
RATIONALE = {
    sfr:             'Single-family development suits the site due to residential zoning, neighborhood character, and stable demand for ownership housing.',
    duplex:          'Duplex development provides moderate density with manageable entitlement complexity, strong for owner-occupant or rental income strategies.',
    multifamily_low: 'Low-rise multifamily maximizes unit count within a manageable building type, aligning well with LA\'s housing demand and density incentives.',
    multifamily_mid: 'Mid-rise multifamily leverages the parcel size and zoning to achieve meaningful density, supported by strong rental market fundamentals.',
    multifamily_high:'High-rise multifamily captures maximum density bonus potential in a high-demand corridor, though construction costs are significantly higher.',
    mixeduse:        'Mixed-use development combines ground-floor commercial revenue with residential density above, ideal for transit-accessible commercial corridors.',
    retail:          'Retail use leverages street frontage, visibility, and pedestrian traffic in a commercial corridor with demonstrated consumer demand.',
    office:          'Office development responds to professional service demand in the submarket, with viable access and infrastructure to support employment density.',
    medical:         'Medical office benefits from proximity to health care services, strong tenant demand, and premium rents typical of medical-zoned uses.',
    hotel:           'Hotel/hospitality use leverages tourism and business travel demand, arterial visibility, and transit proximity for viable room-night revenue.',
    industrial:      'Industrial/warehouse use provides strong yield potential with lower construction costs, supported by limited industrial land supply in LA.',
    selfstorage:     'Self-storage is operationally efficient with low staffing costs, serves population density demand, and tolerates suboptimal site configurations.',
    senior:          'Senior living addresses the growing aging population with premium per-unit revenue and purpose-built care facilities.',
    parking:         'Parking structure use addresses chronic parking deficits in dense urban areas, with modest build costs and reliable demand.',
    creative:        'Creative office/flex space appeals to tech and media tenants seeking character space, commanding premium rents in emerging neighborhoods.',
    adu:             'ADU or small-lot subdivision maximizes yield on smaller parcels under CA housing legislation (SB 9, AB 68) with minimal entitlement friction.',
};


// ============================================================
//  CALIFORNIA HOUSING LEGISLATION
// ============================================================

CA_HOUSING_LEGISLATION = [
    {
        id: 'sb9',
        name: 'SB 9 (HOME Act)',
        description: 'By-right duplex and lot splits on single-family parcels statewide.',
        detail: 'The California HOME Act (2021) allows property owners to split single-family lots and build duplexes by-right, bypassing traditional zoning restrictions. Applies to parcels of at least 2,400 SF in urbanized areas zoned for single-family residential (R1, R1V, RE, RS, RA, RD, and equivalents). Exclusions: historic districts, very high fire hazard severity zones (VHFHSZ), earthquake fault zones (Alquist-Priolo), flood zones, conservation/habitat areas, and coastal zone. Each resulting lot must be at least 1,200 SF. Owner-occupancy required for 3 years on one unit if lot split is pursued. Development standards: max 800 SF per unit (or 60% of existing if larger), 4 ft rear/side setbacks, no parking required within 0.5 mi of transit. Lot split + duplex on each lot = up to 4 units total on a single R1 parcel. Impact: Significant for small infill developers targeting single-family neighborhoods.',
        effectiveDate: 'January 1, 2022',
        author: 'Sen. Toni Atkins',
        codeSection: 'Cal. Gov. Code §§ 65852.21, 66411.7',
        billUrl: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202120220SB9',
        chaptered: 'Stats. 2021, Ch. 162',
        applies: (useId, inp) => {
            // SB 9 applies to ALL single-family residential zones, not just R1
            const sfZones = ['R1', 'R1V', 'R1V1', 'R1V2', 'R1V3', 'RE', 'RE9', 'RE11', 'RE15', 'RE20', 'RE40', 'RS', 'RA', 'RD', 'RD1.5', 'RD2', 'RD3', 'RD4', 'RD5', 'RD6', 'RW1'];
            if (!sfZones.includes(inp.zoning) || inp.parcelSize < 2400 || !['duplex', 'adu', 'sfr'].includes(useId)) return false;
            // Exclusion: historic districts / historic overlay
            if (inp.constHistoric) return false;
            // Exclusion: very high fire hazard severity zones
            if (inp.constFire || inp.constHillside) return false;
            // Exclusion: earthquake fault zones (Alquist-Priolo)
            if (inp.constFault) return false;
            // Exclusion: flood zones (FEMA special flood hazard area)
            if (inp.constFlood) return false;
            // Exclusion: coastal zone
            if (inp.constCoastal) return false;
            // Jurisdiction-specific: South Pasadena historic districts
            const _j = window._lastJurisdiction;
            if (_j && _j.jurisdiction === 'South Pasadena') return false;
            return true;
        },
        // SB 9 development envelope
        sb9Envelope: {
            maxUnitSize: 800,           // Max 800 SF per unit (or 60% of existing structure, whichever greater)
            minLotForSplit: 2400,       // Min lot size to qualify for lot split
            minResultingLot: 1200,      // Each resulting lot must be at least 1,200 SF
            maxUnitsPerLot: 2,          // Duplex (2 units) per lot
            maxUnitsWithSplit: 4,       // Lot split + duplex each side = 4 units total
            setbacks: { front: 'existing', side: 4, rear: 4 },  // 4 ft side/rear setbacks
            maxHeight: 25,              // 25 ft (two stories) for new construction
            parkingPerUnit: 1,          // 1 space per unit max
            parkingTransitExempt: 0.5,  // No parking within 0.5 mi of transit
            ownerOccupancy: true,       // Required for 3 years if lot split
            ownerOccupancyYears: 3,
        },
        densityBonus: 1.0,
        parkingReduction: 0,
        softCostReduction: 0,
        legalOverride: true,
    },
    {
        id: 'ab2011',
        name: 'AB 2011',
        description: 'By-right affordable housing on commercially zoned land.',
        detail: 'AB 2011 (2022) creates a streamlined, ministerial (by-right) approval pathway for 100% affordable housing on commercially zoned land. Projects must pay prevailing wages and meet affordability requirements — mixed-income projects require a percentage of units at below-market rents. Applies to sites zoned for office, retail, or parking that are not in industrial zones, coastal zones, or high fire areas. Overrides local zoning that would otherwise prohibit residential uses on commercial parcels. Impact: Unlocks large swaths of commercial land for affordable housing development across California.',
        effectiveDate: 'July 1, 2023',
        author: 'Asm. Buffy Wicks',
        codeSection: 'Cal. Gov. Code §§ 65912.100–65912.140',
        billUrl: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202120220AB2011',
        chaptered: 'Stats. 2022, Ch. 647',
        applies: (useId, inp) => ['C1','C1.5','C2','C4','C5','CM'].includes(inp.zoning) && ['multifamily_low','multifamily_mid','multifamily_high','mixeduse'].includes(useId),
        densityBonus: 0.35,
        parkingReduction: 0,
        softCostReduction: 0,
        legalOverride: true,
    },
    {
        id: 'sb6',
        name: 'SB 6',
        description: 'Market-rate housing permitted on commercially zoned land.',
        detail: 'SB 6, the Middle Class Housing Act (2022), allows market-rate residential development on commercially zoned land, provided the project meets specified objective design standards and at least 20% of units are affordable. Unlike AB 2011, SB 6 allows market-rate projects but requires the local approval process. Projects must comply with local height and FAR limits. Applies to parcels zoned for office, retail, or parking uses. Impact: Enables market-rate housing on commercial corridors where residential was previously prohibited.',
        effectiveDate: 'January 1, 2023',
        author: 'Sen. Anna Caballero',
        codeSection: 'Cal. Gov. Code §§ 65852.24',
        billUrl: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202120220SB6',
        chaptered: 'Stats. 2022, Ch. 659',
        applies: (useId, inp) => ['C1','C1.5','C2','C4','C5','CM'].includes(inp.zoning) && ['multifamily_low','multifamily_mid','multifamily_high','mixeduse'].includes(useId),
        densityBonus: 0.25,
        parkingReduction: 0,
        softCostReduction: 0,
        legalOverride: false,
    },
    {
        id: 'sb423',
        name: 'SB 423 (Streamlined)',
        description: 'Streamlined ministerial approval for multifamily projects meeting affordability thresholds.',
        detail: 'SB 423 (2023) extends and strengthens SB 35\'s streamlined ministerial approval process for multifamily housing projects meeting affordability thresholds. Projects with 10%+ affordable units in jurisdictions that have not met housing production goals qualify for ministerial approval. Eliminates discretionary review, CEQA requirements, and public hearings for qualifying projects. Applies to urban infill sites in areas meeting RHNA progress standards. Impact: Dramatically reduces entitlement timelines and costs for projects meeting affordability thresholds.',
        effectiveDate: 'January 1, 2024',
        author: 'Sen. Scott Wiener',
        codeSection: 'Cal. Gov. Code § 65913.4 (amending SB 35)',
        billUrl: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240SB423',
        chaptered: 'Stats. 2023, Ch. 778',
        applies: (useId, inp) => ['R2','R3','R4','R5','C1.5','C2','C4','TOD'].includes(inp.zoning) && ['multifamily_low','multifamily_mid','multifamily_high','mixeduse'].includes(useId),
        densityBonus: 0,
        parkingReduction: 0,
        softCostReduction: 0.15,
        legalOverride: false,
    },
    {
        id: 'ab2345',
        name: 'AB 2345 (Density Bonus)',
        description: 'Up to 50% density bonus and reduced parking for projects including affordable units.',
        detail: 'AB 2345 (2020) enhances California\'s Density Bonus Law, increasing the maximum density bonus from 35% to 50% for projects including affordable units. Provides up to 4 incentives or concessions such as reduced setbacks, increased height, and reduced parking. Parking minimums reduced to 0.5 spaces per unit for projects near transit. Applies to all residential and mixed-use zones with affordable set-asides meeting specified thresholds. Impact: One of the most widely used tools by LA developers to significantly increase project density and reduce parking requirements.',
        effectiveDate: 'January 1, 2021',
        author: 'Asm. David Chiu',
        codeSection: 'Cal. Gov. Code § 65915 (amending Density Bonus Law)',
        billUrl: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201920200AB2345',
        chaptered: 'Stats. 2020, Ch. 197',
        applies: (useId, inp) => ['R2','R3','R4','R5','C1','C1.5','C2','C4','TOD'].includes(inp.zoning) && ['duplex','multifamily_low','multifamily_mid','multifamily_high','mixeduse','senior'].includes(useId),
        densityBonus: 0.50,
        parkingReduction: 0.20,
        softCostReduction: 0,
        legalOverride: false,
    },
    {
        id: 'ab1763',
        name: 'AB 1763',
        description: 'Unlimited density for 100% affordable housing projects near transit.',
        detail: 'AB 1763 (2019) provides unlimited density for 100% affordable housing projects located within half a mile of a major transit stop. Eliminates maximum FAR and unit count restrictions entirely. Parking requirements are set to zero for projects within half a mile of transit. Projects must be 100% affordable with an allowance for manager units. Impact: Enables very high-density affordable development near transit without the typical density caps, making transit-adjacent sites extremely valuable for affordable housing developers.',
        effectiveDate: 'January 1, 2020',
        author: 'Asm. David Chiu',
        codeSection: 'Cal. Gov. Code § 65915(o)',
        billUrl: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201920200AB1763',
        chaptered: 'Stats. 2019, Ch. 666',
        applies: (useId, inp) => ['adjacent','near'].includes(inp.transit) && ['multifamily_low','multifamily_mid','multifamily_high','senior'].includes(useId),
        densityBonus: 1.0,
        parkingReduction: 0,
        softCostReduction: 0,
        legalOverride: true,
    },
    {
        id: 'toc',
        name: 'TOC (LA Local)',
        description: 'Transit Oriented Communities incentives — up to 80% density bonus and parking reductions near transit.',
        detail: 'The Transit Oriented Communities (TOC) program is an LA-specific incentive providing density bonuses of up to 80% and significant parking reductions for housing projects near transit. Projects are tiered by proximity: Tier 1 (within 750 ft of a major stop) through Tier 4 (within 2,640 ft), with each tier providing increasing incentives. Affordable units must be included at specified set-aside levels. Impact: The most impactful local density incentive in Los Angeles, enabling significantly larger buildings near Metro stations.',
        effectiveDate: 'September 22, 2017',
        author: 'City of Los Angeles (Measure JJJ Implementation)',
        codeSection: 'LAMC § 12.22 A.31 (TOC Guidelines)',
        billUrl: 'https://planning.lacity.gov/plans-policies/transit-oriented-communities-incentive-program',
        chaptered: 'LA City Ordinance No. 185,573',
        applies: (useId, inp) => ['adjacent','near'].includes(inp.transit) && ['multifamily_low','multifamily_mid','multifamily_high','mixeduse'].includes(useId),
        densityBonus: 0.80,
        parkingReduction: 0.30,
        softCostReduction: 0,
        legalOverride: false,
    },
    {
        id: 'ab2097',
        name: 'AB 2097',
        description: 'Eliminates minimum parking requirements within 1/2 mile of major transit stops.',
        detail: 'AB 2097 (2022) eliminates minimum parking requirements for any development within half a mile of a major transit stop in California. Applies to all land use types — residential, commercial, and mixed-use — not just affordable housing. Local jurisdictions cannot impose minimum parking requirements in these areas. Developers can still choose to build parking, but it is not mandated. Impact: Reduces development costs by $30,000 to $80,000 per eliminated parking space and enables more efficient site utilization near transit.',
        effectiveDate: 'January 1, 2023',
        author: 'Asm. Laura Friedman',
        codeSection: 'Cal. Gov. Code § 65863.2',
        billUrl: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202120220AB2097',
        chaptered: 'Stats. 2022, Ch. 459',
        applies: (useId, inp) => ['adjacent','near'].includes(inp.transit),
        densityBonus: 0,
        parkingReduction: 1.0,
        softCostReduction: 0,
        legalOverride: false,
    },
    {
        id: 'adu_reform',
        name: 'ADU Reform (AB 68/SB 13/AB 881)',
        description: 'By-right ADU construction on residential lots; no parking required near transit.',
        detail: 'California\'s ADU reform package (2019-2020) established a comprehensive by-right framework for Accessory Dwelling Units on residential lots. AB 68 allows at least one ADU on any residential lot regardless of local zoning. SB 13 eliminates impact fees for ADUs under 750 SF and caps fees for larger units. AB 881 prohibits local agencies from requiring owner-occupancy or imposing minimum lot sizes. No additional parking is required near transit. Impact: Has generated tens of thousands of new housing units statewide, particularly in single-family neighborhoods.',
        effectiveDate: 'January 1, 2020',
        author: 'Asm. Phil Ting (AB 68), Sen. Bob Wieckowski (SB 13), Asm. Richard Bloom (AB 881)',
        codeSection: 'Cal. Gov. Code §§ 65852.2, 65852.22 (as amended)',
        billUrl: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201920200AB68',
        chaptered: 'Stats. 2019, Ch. 655 (AB 68), Ch. 653 (SB 13), Ch. 659 (AB 881)',
        applies: (useId, inp) => ['R1','R2','R3','R4','R5'].includes(inp.zoning) && useId === 'adu',
        densityBonus: 0,
        parkingReduction: 0,
        softCostReduction: 0,
        legalOverride: true,
    },
    {
        id: 'sb478',
        name: 'SB 478',
        description: 'Sets minimum 1.0 FAR for multifamily projects on parcels up to 10,000 SF.',
        detail: 'SB 478 (2021) establishes a minimum floor area ratio (FAR) of 1.0 for multifamily housing projects on parcels of 10,000 SF or less in areas zoned for at least two residential units. Prohibits local jurisdictions from imposing lot coverage limits below 60% on qualifying parcels. Prevents cities from using low FAR limits to effectively block apartment construction on small lots. Applies only to urban infill locations. Impact: Ensures meaningful development potential on small multifamily parcels that might otherwise be restricted by overly conservative FAR limits.',
        effectiveDate: 'January 1, 2023',
        author: 'Sen. Scott Wiener',
        codeSection: 'Cal. Gov. Code § 65585.1',
        billUrl: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202120220SB478',
        chaptered: 'Stats. 2021, Ch. 363',
        applies: (useId, inp) => inp.parcelSize <= 10000 && ['R3','R4','R5','C1.5','C2','C4','TOD'].includes(inp.zoning) && ['multifamily_low','multifamily_mid','multifamily_high'].includes(useId),
        densityBonus: 0,
        parkingReduction: 0,
        softCostReduction: 0,
        legalOverride: false,
        minFAR: 1.0,
    },
    {
        id: 'ed1',
        name: 'ED1 (LA Local)',
        description: 'Executive Directive 1 — streamlined approvals and density bonus for 100% affordable and senior housing.',
        detail: 'Executive Directive 1 (2022) is an LA mayoral order streamlining approvals for 100% affordable and senior housing projects in Los Angeles. Provides expedited processing, priority permitting, and fee waivers for qualifying projects. Includes density bonus provisions beyond state law for affordable projects. Directs all city departments to prioritize affordable housing applications and reduce bureaucratic barriers. Impact: Significantly reduces entitlement timelines for affordable housing, with some projects receiving permits in weeks rather than months.',
        effectiveDate: 'December 12, 2022',
        author: 'Mayor Karen Bass',
        codeSection: 'Executive Directive No. 1 (City of Los Angeles)',
        billUrl: 'https://mayor.lacity.gov/news/mayor-bass-signs-executive-directive-1-expedite-affordable-housing-construction',
        chaptered: 'Mayoral Executive Directive',
        applies: (useId, inp) => ['multifamily_low','multifamily_mid','multifamily_high','senior'].includes(useId),
        densityBonus: 0.35,
        parkingReduction: 0,
        softCostReduction: 0.20,
        legalOverride: false,
    },
    {
        id: 'sb684',
        name: 'SB 684',
        description: 'By-right approval for 10+ unit housing projects on commercially zoned land.',
        detail: 'SB 684 (2023) establishes a by-right (ministerial) approval pathway for housing projects of 10 or more units on commercially zoned land. Projects must meet objective design and development standards. Requires compliance with density, height, and FAR limits as defined by local jurisdictions. Overrides local discretionary review requirements and CEQA for qualifying projects on infill sites. Impact: Provides certainty and speed for developers building housing on commercial sites, reducing entitlement risk and project timelines substantially.',
        effectiveDate: 'January 1, 2024',
        author: 'Sen. Anna Caballero',
        codeSection: 'Cal. Gov. Code § 65852.28',
        billUrl: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240SB684',
        chaptered: 'Stats. 2023, Ch. 753',
        applies: (useId, inp) => ['C1','C1.5','C2','C4','C5','CM'].includes(inp.zoning) && ['multifamily_low','multifamily_mid','multifamily_high','mixeduse'].includes(useId),
        densityBonus: 0,
        parkingReduction: 0,
        softCostReduction: 0,
        legalOverride: true,
    },
    {
        id: 'sb79',
        name: 'SB 79 (Transit-Oriented)',
        description: 'Overrides local zoning near qualifying transit stations — up to 95ft, 160 du/acre, 4.5 FAR.',
        detail: 'SB 79 (statewide July 1, 2026; LA Ords 188967/188968 eff. June 30, 2026 — underwrite ZIMAS first) is California\'s transit-oriented development bill that overrides local zoning near qualifying heavy and light rail stations. Tier 1 (heavy rail, including all Metro Rail lines) allows 95ft height, 160 du/acre, and 4.5 FAR. Tier 2 (light rail, BRT, qualifying Metrolink) allows 85ft height, 140 du/acre, and 4.0 FAR. Three distance zones apply: Adjacent (within 200ft of station entrance) and Inner (within 1/4 mile) get full tier benefits and zero parking requirements. Outer zone (1/4 to 1/2 mile) is limited to 65ft height and 3.25 FAR, with 0.5 parking spaces per unit. All projects require 15% affordable units. 100% affordable projects receive the full tier benefits regardless of zone. Impact: Unlocks massive upzoning near every Metro station in LA County, making transit-adjacent parcels significantly more valuable for higher-density development.',
        effectiveDate: 'July 1, 2026',
        author: 'Sen. Scott Wiener',
        codeSection: 'Cal. Gov. Code §§ 65913.6–65913.12',
        billUrl: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260SB79',
        chaptered: 'Stats. 2025; LA Ords 188967/188968 (2026)',
        applies: (useId, inp) => {
            if (!window.lastGeocode) return false;
            if (inp && inp.constHistoric) return false;  // SB 79 excludes historic overlay areas
            if (!['multifamily_low','multifamily_mid','multifamily_high','mixeduse','senior','hotel'].includes(useId)) return false;
            const sb79 = detectSB79Eligibility(window.lastGeocode.lat, window.lastGeocode.lon);
            return sb79.eligible;
        },
        get densityBonus() {
            if (!window.lastGeocode) return 0;
            const sb79 = detectSB79Eligibility(window.lastGeocode.lat, window.lastGeocode.lon);
            if (!sb79.eligible) return 0;
            return sb79.allowances.far / 3.0 - 1;
        },
        get parkingReduction() {
            if (!window.lastGeocode) return 0;
            const sb79 = detectSB79Eligibility(window.lastGeocode.lat, window.lastGeocode.lon);
            if (!sb79.eligible) return 0;
            return sb79.allowances.parking === 0 ? 1.0 : 0.5;
        },
        softCostReduction: 0.10,
        legalOverride: true,
        get minFAR() {
            if (!window.lastGeocode) return 0;
            const sb79 = detectSB79Eligibility(window.lastGeocode.lat, window.lastGeocode.lon);
            if (!sb79.eligible) return 0;
            return sb79.allowances.far;
        },
    },
    {
        id: 'sb897',
        name: 'SB 897',
        description: 'Increases ADU height limits to 18ft (detached single-story) and 25ft (2-story near transit).',
        detail: 'SB 897 (2022) increases height limits for ADUs statewide. Detached single-story ADUs may be up to 18 feet tall. Two-story detached ADUs are allowed up to 25 feet in height when the parcel is located within half a mile of a major transit stop or high-quality transit corridor. Attached ADUs may match the height of the primary dwelling up to 25 feet. Also clarifies that ADUs built above garages can reach 25 feet. Impact: Enables more livable two-story ADU designs, particularly near transit, and supports taller garage-conversion ADUs.',
        effectiveDate: 'January 1, 2023',
        author: 'Sen. Bob Wieckowski',
        codeSection: 'Cal. Gov. Code § 65852.2(c) (height provisions)',
        billUrl: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202120220SB897',
        chaptered: 'Stats. 2022, Ch. 664',
        applies: (useId, inp) => ['R1','R2','R3','R4','R5'].includes(inp.zoning) && useId === 'adu',
        densityBonus: 0,
        parkingReduction: 0,
        softCostReduction: 0,
        legalOverride: false,
    },
    {
        id: 'ab2221',
        name: 'AB 2221',
        description: 'Permanently removes owner-occupancy requirement for ADUs.',
        detail: 'AB 2221 (2022) permanently eliminates the owner-occupancy requirement for ADUs that was temporarily suspended during COVID. Property owners are no longer required to live on-site to build or rent an ADU. Also prohibits local jurisdictions from imposing owner-occupancy as a condition of ADU approval. Clarifies that ADUs cannot be required to have separate utility connections if the primary dwelling uses shared connections. Impact: Makes ADU investment viable for non-owner-occupied rental properties and investor-owned parcels.',
        effectiveDate: 'January 1, 2023',
        author: 'Asm. Luz Rivas',
        codeSection: 'Cal. Gov. Code § 65852.2(a)(6) (owner-occupancy)',
        billUrl: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202120220AB2221',
        chaptered: 'Stats. 2022, Ch. 662',
        applies: (useId, inp) => ['R1','R2','R3','R4','R5'].includes(inp.zoning) && useId === 'adu',
        densityBonus: 0,
        parkingReduction: 0,
        softCostReduction: 0,
        legalOverride: false,
    },
    {
        id: 'ab916',
        name: 'AB 916',
        description: 'Reduces parking requirements for Junior ADUs (JADUs).',
        detail: 'AB 916 (2022) eliminates replacement parking requirements when a garage, carport, or covered parking structure is converted to a Junior ADU (JADU). Previously, some jurisdictions required property owners to replace lost parking spaces when converting a garage to a JADU. This bill prohibits local agencies from requiring replacement parking for garage conversions. Also streamlines JADU permitting by clarifying that JADUs are always permitted within the existing footprint of a single-family home. Impact: Removes the most common barrier to JADU construction — the cost and space needed for replacement parking.',
        effectiveDate: 'January 1, 2023',
        author: 'Asm. Phil Ting',
        codeSection: 'Cal. Gov. Code § 65852.22(a) (JADU parking)',
        billUrl: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202120220AB916',
        chaptered: 'Stats. 2022, Ch. 663',
        applies: (useId, inp) => ['R1','R2','R3'].includes(inp.zoning) && useId === 'adu',
        densityBonus: 0,
        parkingReduction: 1.0,
        softCostReduction: 0,
        legalOverride: false,
    },
    {
        id: 'ab1033',
        name: 'AB 1033',
        description: 'Allows separate sale of ADUs as condominiums.',
        detail: 'AB 1033 (2023) authorizes local jurisdictions to allow ADUs to be sold separately from the primary dwelling as condominiums. This creates a new homeownership pathway by enabling ADU condo conversions where the ADU and primary home can have separate owners. Requires local opt-in — jurisdictions must adopt an ordinance permitting separate ADU sales. The ADU must meet all building code requirements for separate ownership. Impact: Transforms ADUs from rental-only investments to potential for-sale units, significantly increasing their financial value and creating new affordable homeownership opportunities.',
        effectiveDate: 'January 1, 2024',
        author: 'Asm. Phil Ting',
        codeSection: 'Cal. Civ. Code § 6714; Cal. Gov. Code § 65852.26',
        billUrl: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB1033',
        chaptered: 'Stats. 2023, Ch. 752',
        applies: (useId, inp) => ['R1','R2','R3','R4','R5'].includes(inp.zoning) && useId === 'adu',
        densityBonus: 0,
        parkingReduction: 0,
        softCostReduction: 0,
        legalOverride: false,
    },
    {
        id: 'sb477',
        name: 'SB 477',
        description: 'Streamlines ADU permit processing timelines to 60 days.',
        detail: 'SB 477 (2023) tightens ADU permit processing deadlines, requiring local agencies to approve or deny ADU applications within 60 days of receiving a complete application. Reduces the previous timeline and closes loopholes that allowed jurisdictions to delay processing by deeming applications incomplete. Also requires agencies to provide a comprehensive list of deficiencies within 30 days if the application is incomplete. Impact: Accelerates ADU permitting and prevents jurisdictional delay tactics, making ADU development timelines more predictable.',
        effectiveDate: 'January 1, 2024',
        author: 'Sen. Anna Caballero',
        codeSection: 'Cal. Gov. Code § 65852.2(a)(3) (processing deadlines)',
        billUrl: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240SB477',
        chaptered: 'Stats. 2023, Ch. 751',
        applies: (useId, inp) => ['R1','R2','R3','R4','R5'].includes(inp.zoning) && useId === 'adu',
        densityBonus: 0,
        parkingReduction: 0,
        softCostReduction: 0.05,
        legalOverride: false,
    },
    {
        id: 'ab976',
        name: 'AB 976',
        description: 'Makes ADU permit streamlining permanent (removes 2025 sunset clause).',
        detail: 'AB 976 (2024) removes the January 1, 2025 sunset date on key ADU reform provisions, making California\'s ADU permit streamlining framework permanent. Previously, several provisions from the 2019-2020 ADU reform package (AB 68, SB 13, AB 881) were set to expire. AB 976 ensures that by-right ADU construction, impact fee exemptions for units under 750 SF, and prohibitions on owner-occupancy requirements remain in effect indefinitely. Impact: Provides long-term certainty for ADU developers and investors that the streamlined permitting framework will not expire.',
        effectiveDate: 'January 1, 2025',
        author: 'Asm. Luz Rivas',
        codeSection: 'Cal. Gov. Code § 65852.2 (sunset removal)',
        billUrl: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB976',
        chaptered: 'Stats. 2024, Ch. 399',
        applies: (useId, inp) => ['R1','R2','R3','R4','R5'].includes(inp.zoning) && useId === 'adu',
        densityBonus: 0,
        parkingReduction: 0,
        softCostReduction: 0,
        legalOverride: true,
    },
];


// ============================================================
//  ADU RULES & PRE-APPROVED PLANS
// ============================================================

ADU_RULES = {
    'Los Angeles': {
        maxSF: 1200, maxHeight: 25, maxHeightSingle: 18,
        setbacks: { front: 0, side: 4, rear: 4 },
        jadu: true, maxJADU: 500,
        parking: 0, ownerOccupancy: false,
        preApprovedPlans: true,
        notes: 'LA City allows detached ADUs up to 1,200 SF and 25ft (2-story). 18ft for single-story detached. 4ft side/rear setbacks. No parking required. LADBS Standard Plan Program available.',
        catalogUrl: 'https://www.ladbs.org/adu/standard-plan-program',
        citations: [
            { code: 'LAMC § 12.22 A.32', desc: 'City of Los Angeles ADU Ordinance — establishes local ADU development standards including size, height, setbacks, and parking', url: 'https://codelibrary.amlegal.com/codes/los_angeles/latest/lamc/0-0-0-107671' },
            { code: 'Cal. Gov. Code § 65852.2', desc: 'California ADU statute — statewide standards that preempt stricter local rules', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=65852.2.&lawCode=GOV' },
            { code: 'Cal. Gov. Code § 65852.22', desc: 'Junior ADU (JADU) statute — allows units up to 500 SF within existing single-family structures', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=65852.22.&lawCode=GOV' },
            { code: 'LADBS Information Bulletin P/ZC 2017-099', desc: 'LADBS ADU guidelines and permit requirements', url: 'https://www.ladbs.org/adu' },
            { code: 'CA HCD ADU Handbook (2024)', desc: 'California Department of Housing and Community Development — official ADU guidance for local agencies', url: 'https://www.hcd.ca.gov/policy-and-research/accessory-dwelling-units' },
        ],
        buildingCode: [
            { code: '2022 CBC (Title 24, Part 2)', desc: 'California Building Code — structural, fire-life-safety, and accessibility standards for ADUs', url: 'https://www.dgs.ca.gov/BSC/Codes' },
            { code: '2022 CEC (Title 24, Part 6)', desc: 'California Energy Code — energy efficiency requirements including solar-ready provisions', url: 'https://www.energy.ca.gov/programs-and-topics/programs/building-energy-efficiency-standards' },
            { code: '2022 CALGreen (Title 24, Part 11)', desc: 'California Green Building Standards — mandatory green building measures for new ADUs', url: 'https://www.dgs.ca.gov/BSC/Codes' },
        ]
    },
    'LA County': {
        maxSF: 1200, maxHeight: 25, maxHeightSingle: 18,
        setbacks: { front: 0, side: 4, rear: 4 },
        jadu: true, maxJADU: 500,
        parking: 0, ownerOccupancy: false,
        preApprovedPlans: true,
        notes: 'Unincorporated LA County allows detached ADUs up to 1,200 SF and 25ft. 4ft side/rear setbacks. No parking required. Pre-approved plans available.',
        catalogUrl: 'https://planning.lacounty.gov/adu',
        citations: [
            { code: 'LA County Code Title 22 § 22.140.640', desc: 'LA County ADU ordinance — local development standards for unincorporated areas', url: 'https://planning.lacounty.gov/adu' },
            { code: 'Cal. Gov. Code § 65852.2', desc: 'California ADU statute — statewide standards', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=65852.2.&lawCode=GOV' },
            { code: 'Cal. Gov. Code § 65852.22', desc: 'Junior ADU (JADU) statute', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=65852.22.&lawCode=GOV' },
            { code: 'LA County DRP ADU Resources', desc: 'Department of Regional Planning — ADU application materials and pre-approved plans', url: 'https://planning.lacounty.gov/adu' },
        ],
        buildingCode: [
            { code: '2022 CBC (Title 24, Part 2)', desc: 'California Building Code', url: 'https://www.dgs.ca.gov/BSC/Codes' },
            { code: '2022 CEC (Title 24, Part 6)', desc: 'California Energy Code', url: 'https://www.energy.ca.gov/programs-and-topics/programs/building-energy-efficiency-standards' },
        ]
    },
    'Santa Monica': {
        maxSF: 900, maxHeight: 18, maxHeightSingle: 16,
        setbacks: { front: 0, side: 4, rear: 4 },
        jadu: true, maxJADU: 500,
        parking: 0, ownerOccupancy: false,
        preApprovedPlans: false,
        notes: 'Santa Monica caps detached ADUs at 900 SF per local ordinance. 18ft height limit. State law preempts local restrictions on setbacks and parking.',
        citations: [
            { code: 'SMMC § 9.31.300', desc: 'Santa Monica ADU ordinance', url: 'https://www.santamonica.gov/housing/accessory-dwelling-units' },
            { code: 'Cal. Gov. Code § 65852.2', desc: 'California ADU statute', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=65852.2.&lawCode=GOV' },
        ],
        buildingCode: [
            { code: '2022 CBC (Title 24, Part 2)', desc: 'California Building Code', url: 'https://www.dgs.ca.gov/BSC/Codes' },
        ]
    },
    'Pasadena': {
        maxSF: 1200, maxHeight: 25, maxHeightSingle: 18,
        setbacks: { front: 0, side: 4, rear: 4 },
        jadu: true, maxJADU: 500,
        parking: 0, ownerOccupancy: false,
        preApprovedPlans: true,
        notes: 'Pasadena allows ADUs up to 1,200 SF. Pre-approved plans available through city program.',
        citations: [
            { code: 'PMC § 17.50.275', desc: 'Pasadena ADU ordinance', url: 'https://www.cityofpasadena.net/housing/accessory-dwelling-units/' },
            { code: 'Cal. Gov. Code § 65852.2', desc: 'California ADU statute', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=65852.2.&lawCode=GOV' },
        ],
        buildingCode: [
            { code: '2022 CBC (Title 24, Part 2)', desc: 'California Building Code', url: 'https://www.dgs.ca.gov/BSC/Codes' },
        ]
    },
    'Long Beach': {
        maxSF: 1200, maxHeight: 25, maxHeightSingle: 18,
        setbacks: { front: 0, side: 4, rear: 4 },
        jadu: true, maxJADU: 500,
        parking: 0, ownerOccupancy: false,
        preApprovedPlans: true,
        notes: 'Long Beach allows ADUs up to 1,200 SF. Pre-approved plans available through city program.',
        citations: [
            { code: 'LBMC § 21.51.275', desc: 'Long Beach ADU ordinance', url: 'https://www.longbeach.gov/lbds/planning/accessory-dwelling-units/' },
            { code: 'Cal. Gov. Code § 65852.2', desc: 'California ADU statute', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=65852.2.&lawCode=GOV' },
        ],
        buildingCode: [
            { code: '2022 CBC (Title 24, Part 2)', desc: 'California Building Code', url: 'https://www.dgs.ca.gov/BSC/Codes' },
        ]
    },
    'Glendale': {
        maxSF: 1200, maxHeight: 25, maxHeightSingle: 18,
        setbacks: { front: 0, side: 4, rear: 4 },
        jadu: true, maxJADU: 500,
        parking: 0, ownerOccupancy: false,
        preApprovedPlans: false,
        notes: 'Glendale allows ADUs up to 1,200 SF per state law. 25ft height for 2-story.',
        citations: [
            { code: 'GMC § 30.48.200', desc: 'Glendale ADU ordinance', url: 'https://www.glendaleca.gov/government/departments/community-development/planning-division/adu-information' },
            { code: 'Cal. Gov. Code § 65852.2', desc: 'California ADU statute', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=65852.2.&lawCode=GOV' },
        ],
        buildingCode: [
            { code: '2022 CBC (Title 24, Part 2)', desc: 'California Building Code', url: 'https://www.dgs.ca.gov/BSC/Codes' },
        ]
    },
    'default': {
        maxSF: 1200, maxHeight: 25, maxHeightSingle: 18,
        setbacks: { front: 0, side: 4, rear: 4 },
        jadu: true, maxJADU: 500,
        parking: 0, ownerOccupancy: false,
        preApprovedPlans: false,
        notes: 'Default CA state ADU rules apply: up to 1,200 SF, 25ft height (2-story), 4ft side/rear setbacks, no parking near transit.',
        citations: [
            { code: 'Cal. Gov. Code § 65852.2', desc: 'California ADU statute — statewide standards', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=65852.2.&lawCode=GOV' },
            { code: 'Cal. Gov. Code § 65852.22', desc: 'Junior ADU (JADU) statute', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=65852.22.&lawCode=GOV' },
            { code: 'CA HCD ADU Handbook (2024)', desc: 'Official ADU guidance', url: 'https://www.hcd.ca.gov/policy-and-research/accessory-dwelling-units' },
        ],
        buildingCode: [
            { code: '2022 CBC (Title 24, Part 2)', desc: 'California Building Code', url: 'https://www.dgs.ca.gov/BSC/Codes' },
        ]
    }
};

PREAPPROVED_ADU_PLANS = {
    'Los Angeles': {
        program: 'LADBS Standard Plan Program',
        totalPlans: 90,
        catalogUrl: 'https://www.ladbs.org/adu/standard-plan-program',
        tiers: [
            {
                name: 'Studio',
                maxSF: 400,
                bedrooms: 0,
                plans: 18,
                costRange: [120000, 180000],
                planNumbers: 'SPP-ADU-001 through SPP-ADU-018',
                description: 'Compact studio units ideal for small lots. Includes kitchen, bath, and open living/sleeping area.'
            },
            {
                name: '1-Bedroom',
                maxSF: 600,
                bedrooms: 1,
                plans: 28,
                costRange: [180000, 280000],
                planNumbers: 'SPP-ADU-019 through SPP-ADU-046',
                description: 'One-bedroom units with separate living room and bedroom. Most popular tier for rental income.'
            },
            {
                name: '2-Bedroom',
                maxSF: 1000,
                bedrooms: 2,
                plans: 30,
                costRange: [280000, 420000],
                planNumbers: 'SPP-ADU-047 through SPP-ADU-076',
                description: 'Two-bedroom units suitable for families. Includes full kitchen, living area, and 1-2 bathrooms.'
            },
            {
                name: '2-Bedroom+',
                maxSF: 1200,
                bedrooms: 2,
                plans: 14,
                costRange: [400000, 520000],
                planNumbers: 'SPP-ADU-077 through SPP-ADU-090',
                description: 'Larger two-bedroom units up to the 1,200 SF max. Premium finishes, 2 full baths, larger living areas.'
            }
        ],
        benefits: [
            'Pre-reviewed structural and architectural plans — faster permit approval',
            'Reduced plan check fees (up to 50% savings)',
            'Typical permit timeline: 1-2 weeks vs 4-8 weeks for custom plans',
            'All plans meet current LA building code and Title 24 energy requirements'
        ]
    },
    'LA County': {
        program: 'LA County Pre-Approved ADU Plans',
        totalPlans: 3,
        catalogUrl: 'https://planning.lacounty.gov/adu',
        tiers: [
            {
                name: 'Plan A — Studio',
                maxSF: 400,
                bedrooms: 0,
                plans: 1,
                costRange: [130000, 180000],
                dimensions: '20\' x 20\'',
                description: 'Compact studio with efficiency kitchen, full bath, and open living area. Single-story.'
            },
            {
                name: 'Plan B — 1-Bedroom',
                maxSF: 600,
                bedrooms: 1,
                plans: 1,
                costRange: [200000, 300000],
                dimensions: '20\' x 30\'',
                description: 'One-bedroom unit with separate bedroom, full kitchen, bath, and living room. Single-story.'
            },
            {
                name: 'Plan C — 2-Bedroom',
                maxSF: 1200,
                bedrooms: 2,
                plans: 1,
                costRange: [380000, 520000],
                dimensions: '30\' x 40\' (two-story)',
                description: 'Two-bedroom, two-story unit with full kitchen, 2 baths, living/dining area. Maximum size allowed.'
            }
        ],
        benefits: [
            'Expedited permit review — pre-approved structural calculations',
            'Consistent construction quality standards',
            'Simplified contractor bidding with standardized plans'
        ]
    }
};


// ============================================================
//  BUILDING PARAMETERS & TIMELINES
// ============================================================

BUILDING_PARAMS = {
    sfr:              { stories: 2,  floorH: 10, eff: 0.92, unitSF: 1800, parkRatio: 2.0,  setF: 20, setS: 5,  opex: 0.30, cap: 0.045 },
    duplex:           { stories: 2,  floorH: 10, eff: 0.90, unitSF: 1200, parkRatio: 1.5,  setF: 15, setS: 5,  opex: 0.32, cap: 0.047 },
    multifamily_low:  { stories: 4,  floorH: 10, eff: 0.82, unitSF: 850,  parkRatio: 1.25, setF: 10, setS: 5,  opex: 0.35, cap: 0.047 },
    multifamily_mid:  { stories: 7,  floorH: 10, eff: 0.80, unitSF: 800,  parkRatio: 1.0,  setF: 10, setS: 5,  opex: 0.35, cap: 0.045 },
    multifamily_high: { stories: 18, floorH: 10, eff: 0.78, unitSF: 750,  parkRatio: 1.0,  setF: 10, setS: 10, opex: 0.38, cap: 0.042 },
    mixeduse:         { stories: 6,  floorH: 12, eff: 0.80, unitSF: 850,  parkRatio: 1.0,  setF: 0,  setS: 0,  opex: 0.36, cap: 0.048 },
    retail:           { stories: 1,  floorH: 16, eff: 0.88, unitSF: null, parkRatio: 4.0,  setF: 0,  setS: 0,  opex: 0.32, cap: 0.058 },
    office:           { stories: 5,  floorH: 13, eff: 0.85, unitSF: null, parkRatio: 3.0,  setF: 5,  setS: 5,  opex: 0.38, cap: 0.065 },
    medical:          { stories: 4,  floorH: 13, eff: 0.82, unitSF: null, parkRatio: 4.0,  setF: 10, setS: 5,  opex: 0.40, cap: 0.055 },
    hotel:            { stories: 10, floorH: 11, eff: 0.75, unitSF: 400,  parkRatio: 0.5,  setF: 5,  setS: 5,  opex: 0.55, cap: 0.070 },
    industrial:       { stories: 1,  floorH: 24, eff: 0.92, unitSF: null, parkRatio: 1.0,  setF: 10, setS: 5,  opex: 0.28, cap: 0.052 },
    selfstorage:      { stories: 4,  floorH: 9,  eff: 0.88, unitSF: null, parkRatio: 0.2,  setF: 5,  setS: 5,  opex: 0.30, cap: 0.062 },
    senior:           { stories: 5,  floorH: 10, eff: 0.78, unitSF: 600,  parkRatio: 0.5,  setF: 10, setS: 5,  opex: 0.50, cap: 0.058 },
    parking:          { stories: 5,  floorH: 11, eff: 0.90, unitSF: null, parkRatio: null, setF: 0,  setS: 0,  opex: 0.25, cap: 0.065 },
    creative:         { stories: 3,  floorH: 14, eff: 0.85, unitSF: null, parkRatio: 2.5,  setF: 0,  setS: 0,  opex: 0.32, cap: 0.058 },
    adu:              { stories: 2,  floorH: 16, eff: 0.90, unitSF: 800,  parkRatio: 0,    setF: 4,  setS: 4,  opex: 0.30, cap: 0.048 },
};

TIMELINE_MONTHS = {
    sfr:              { entitlement: 2,  design: 2,  permits: 2, construction: 10, leaseup: 1 },
    duplex:           { entitlement: 3,  design: 2,  permits: 2, construction: 12, leaseup: 1 },
    multifamily_low:  { entitlement: 6,  design: 4,  permits: 3, construction: 18, leaseup: 6 },
    multifamily_mid:  { entitlement: 8,  design: 5,  permits: 4, construction: 24, leaseup: 8 },
    multifamily_high: { entitlement: 12, design: 8,  permits: 6, construction: 36, leaseup: 10 },
    mixeduse:         { entitlement: 8,  design: 5,  permits: 4, construction: 22, leaseup: 8 },
    retail:           { entitlement: 4,  design: 3,  permits: 2, construction: 10, leaseup: 4 },
    office:           { entitlement: 6,  design: 4,  permits: 3, construction: 18, leaseup: 8 },
    medical:          { entitlement: 6,  design: 5,  permits: 4, construction: 16, leaseup: 6 },
    hotel:            { entitlement: 10, design: 6,  permits: 5, construction: 28, leaseup: 12 },
    industrial:       { entitlement: 4,  design: 3,  permits: 2, construction: 10, leaseup: 3 },
    selfstorage:      { entitlement: 4,  design: 3,  permits: 2, construction: 12, leaseup: 12 },
    senior:           { entitlement: 8,  design: 5,  permits: 4, construction: 22, leaseup: 10 },
    parking:          { entitlement: 4,  design: 3,  permits: 2, construction: 14, leaseup: 2 },
    creative:         { entitlement: 4,  design: 3,  permits: 2, construction: 14, leaseup: 6 },
    adu:              { entitlement: 1,  design: 1,  permits: 2, construction: 8,  leaseup: 1 },
};

// Scale timeline phases by project size (GSF)
TYPICAL_GSF = {
    sfr: 2500, duplex: 3500, multifamily_low: 35000, multifamily_mid: 80000,
    multifamily_high: 250000, mixeduse: 50000, retail: 8000, office: 30000,
    medical: 15000, hotel: 80000, industrial: 25000, selfstorage: 40000,
    senior: 60000, parking: 50000, creative: 20000, adu: 800
};

USE_COLORS = {
    sfr: '#4a9e5c', duplex: '#5ba86e', multifamily_low: '#3182ce', multifamily_mid: '#2b6cb0',
    multifamily_high: '#1a4791', mixeduse: '#805ad5', retail: '#dd6b20', office: '#2c5282',
    medical: '#38a169', hotel: '#b83280', industrial: '#718096', selfstorage: '#a0aec0',
    senior: '#d69e2e', parking: '#4a5568', creative: '#ed8936', adu: '#48bb78',
};


// ============================================================
//  MARKET DATA — Rents, Vacancy, Absorption, Land Comps
// ============================================================

// Using var (not const) so the JSON loader above can update values
MARKET_RENTS_2025 = {
    // Monthly asking rents by neighborhood and unit type (2025 LA market)
    dtla:         { studio: 1950, br1: 2550, br2: 3400, br3: 4200, retail_psf: 42, office_psf: 48 },
    hollywood:    { studio: 2100, br1: 2800, br2: 3650, br3: 4500, retail_psf: 48, office_psf: 52 },
    koreatown:    { studio: 1650, br1: 2150, br2: 2850, br3: 3500, retail_psf: 36, office_psf: 38 },
    westside:     { studio: 2400, br1: 3100, br2: 4100, br3: 5200, retail_psf: 54, office_psf: 58 },
    santamonica:  { studio: 2600, br1: 3400, br2: 4500, br3: 5800, retail_psf: 62, office_psf: 65 },
    beverly:      { studio: 2500, br1: 3200, br2: 4200, br3: 5400, retail_psf: 55, office_psf: 68 },
    midcity:      { studio: 1850, br1: 2400, br2: 3200, br3: 4000, retail_psf: 38, office_psf: 42 },
    southla:      { studio: 1300, br1: 1700, br2: 2200, br3: 2750, retail_psf: 24, office_psf: 28 },
    valleyeast:   { studio: 1500, br1: 1950, br2: 2600, br3: 3200, retail_psf: 30, office_psf: 34 },
    valleywest:   { studio: 1600, br1: 2100, br2: 2800, br3: 3400, retail_psf: 32, office_psf: 36 },
    silverlake:   { studio: 2000, br1: 2600, br2: 3500, br3: 4300, retail_psf: 44, office_psf: 46 },
    highland:     { studio: 1700, br1: 2200, br2: 2900, br3: 3600, retail_psf: 34, office_psf: 38 },
    venice:       { studio: 2400, br1: 3100, br2: 4100, br3: 5100, retail_psf: 56, office_psf: 54 },
    culver:       { studio: 2200, br1: 2850, br2: 3800, br3: 4700, retail_psf: 48, office_psf: 52 },
    exposition:   { studio: 1650, br1: 2150, br2: 2850, br3: 3500, retail_psf: 34, office_psf: 38 },
    southbay:     { studio: 1600, br1: 2050, br2: 2700, br3: 3350, retail_psf: 32, office_psf: 36 },
    harbor:       { studio: 1300, br1: 1650, br2: 2200, br3: 2700, retail_psf: 22, office_psf: 26 },
    boyleheights: { studio: 1350, br1: 1750, br2: 2300, br3: 2850, retail_psf: 26, office_psf: 28 },
};

VACANCY_RATES = {
    dtla:         { residential: 0.072, retail: 0.085, office: 0.185, trend: 'improving' },
    hollywood:    { residential: 0.055, retail: 0.062, office: 0.145, trend: 'stable' },
    koreatown:    { residential: 0.048, retail: 0.070, office: 0.160, trend: 'stable' },
    westside:     { residential: 0.042, retail: 0.055, office: 0.125, trend: 'stable' },
    santamonica:  { residential: 0.038, retail: 0.058, office: 0.135, trend: 'stable' },
    beverly:      { residential: 0.035, retail: 0.048, office: 0.110, trend: 'stable' },
    midcity:      { residential: 0.052, retail: 0.068, office: 0.155, trend: 'improving' },
    southla:      { residential: 0.058, retail: 0.095, office: 0.200, trend: 'improving' },
    valleyeast:   { residential: 0.050, retail: 0.075, office: 0.165, trend: 'stable' },
    valleywest:   { residential: 0.045, retail: 0.070, office: 0.155, trend: 'stable' },
    silverlake:   { residential: 0.040, retail: 0.055, office: 0.130, trend: 'stable' },
    highland:     { residential: 0.048, retail: 0.072, office: 0.160, trend: 'improving' },
    venice:       { residential: 0.042, retail: 0.060, office: 0.140, trend: 'stable' },
    culver:       { residential: 0.038, retail: 0.052, office: 0.120, trend: 'improving' },
    exposition:   { residential: 0.055, retail: 0.078, office: 0.170, trend: 'improving' },
    southbay:     { residential: 0.048, retail: 0.072, office: 0.160, trend: 'stable' },
    harbor:       { residential: 0.062, retail: 0.092, office: 0.195, trend: 'declining' },
    boyleheights: { residential: 0.055, retail: 0.088, office: 0.190, trend: 'improving' },
};

ABSORPTION_DATA = {
    // Annual absorption rate — % of new units absorbed per year by submarket
    dtla:         { residential: 0.82, retail: 0.70, office: 0.55, newSupplyUnits: 2800 },
    hollywood:    { residential: 0.88, retail: 0.78, office: 0.62, newSupplyUnits: 1500 },
    koreatown:    { residential: 0.90, retail: 0.75, office: 0.58, newSupplyUnits: 2200 },
    westside:     { residential: 0.92, retail: 0.82, office: 0.68, newSupplyUnits: 800 },
    santamonica:  { residential: 0.94, retail: 0.85, office: 0.70, newSupplyUnits: 400 },
    beverly:      { residential: 0.95, retail: 0.88, office: 0.72, newSupplyUnits: 300 },
    midcity:      { residential: 0.88, retail: 0.72, office: 0.58, newSupplyUnits: 1200 },
    southla:      { residential: 0.85, retail: 0.65, office: 0.48, newSupplyUnits: 600 },
    valleyeast:   { residential: 0.87, retail: 0.70, office: 0.55, newSupplyUnits: 900 },
    valleywest:   { residential: 0.88, retail: 0.72, office: 0.58, newSupplyUnits: 700 },
    silverlake:   { residential: 0.92, retail: 0.80, office: 0.65, newSupplyUnits: 500 },
    highland:     { residential: 0.88, retail: 0.72, office: 0.58, newSupplyUnits: 600 },
    venice:       { residential: 0.93, retail: 0.82, office: 0.68, newSupplyUnits: 350 },
    culver:       { residential: 0.92, retail: 0.80, office: 0.70, newSupplyUnits: 600 },
    exposition:   { residential: 0.87, retail: 0.70, office: 0.55, newSupplyUnits: 800 },
    southbay:     { residential: 0.86, retail: 0.70, office: 0.55, newSupplyUnits: 500 },
    harbor:       { residential: 0.80, retail: 0.60, office: 0.45, newSupplyUnits: 400 },
    boyleheights: { residential: 0.85, retail: 0.65, office: 0.50, newSupplyUnits: 350 },
};

// Comparable land sales $/SF by neighborhood (recent transactions 2024-2025)
COMP_LAND_SALES = {
    dtla:         { low: 200, median: 275, high: 400, sampleSize: 18, trend: '+8% YoY' },
    hollywood:    { low: 180, median: 260, high: 380, sampleSize: 14, trend: '+5% YoY' },
    koreatown:    { low: 140, median: 210, high: 320, sampleSize: 22, trend: '+12% YoY' },
    westside:     { low: 280, median: 370, high: 520, sampleSize: 8, trend: '+3% YoY' },
    santamonica:  { low: 320, median: 420, high: 600, sampleSize: 5, trend: '+2% YoY' },
    beverly:      { low: 350, median: 470, high: 650, sampleSize: 6, trend: '+4% YoY' },
    midcity:      { low: 130, median: 185, high: 280, sampleSize: 16, trend: '+10% YoY' },
    southla:      { low: 55, median: 90, high: 140, sampleSize: 24, trend: '+15% YoY' },
    valleyeast:   { low: 70, median: 115, high: 180, sampleSize: 20, trend: '+8% YoY' },
    valleywest:   { low: 85, median: 135, high: 200, sampleSize: 15, trend: '+6% YoY' },
    silverlake:   { low: 165, median: 230, high: 340, sampleSize: 10, trend: '+7% YoY' },
    highland:     { low: 100, median: 155, high: 240, sampleSize: 12, trend: '+9% YoY' },
    venice:       { low: 280, median: 365, high: 500, sampleSize: 7, trend: '+3% YoY' },
    culver:       { low: 200, median: 275, high: 380, sampleSize: 9, trend: '+6% YoY' },
    exposition:   { low: 110, median: 165, high: 250, sampleSize: 14, trend: '+11% YoY' },
    southbay:     { low: 80, median: 125, high: 190, sampleSize: 18, trend: '+5% YoY' },
    harbor:       { low: 50, median: 82, high: 130, sampleSize: 16, trend: '+4% YoY' },
    boyleheights: { low: 70, median: 115, high: 175, sampleSize: 15, trend: '+14% YoY' },
};
