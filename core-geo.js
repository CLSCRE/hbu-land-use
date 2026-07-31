// ============================================================
//  CORE GEO — Land to Yield Portal Suite
//  Shared GIS, geocoding, jurisdiction detection, transit
//  proximity, and site constraint functions.
//  Used by: app.html, lender.html, agent.html
// ============================================================

// === GEO CONSTANTS ===

// Neighborhood centroids (lat, lon)
NEIGHBORHOOD_CENTROIDS = {
    dtla:         { lat: 34.0407, lon: -118.2468 },
    hollywood:    { lat: 34.0928, lon: -118.3287 },
    koreatown:    { lat: 34.0578, lon: -118.3010 },
    westside:     { lat: 34.0367, lon: -118.4376 },
    santamonica:  { lat: 34.0906, lon: -118.3856 },
    beverly:      { lat: 34.0736, lon: -118.4004 },
    midcity:      { lat: 34.0483, lon: -118.3396 },
    southla:      { lat: 33.9425, lon: -118.2820 },
    valleyeast:   { lat: 34.2219, lon: -118.4157 },
    valleywest:   { lat: 34.1866, lon: -118.5353 },
    silverlake:   { lat: 34.0869, lon: -118.2697 },
    highland:     { lat: 34.1133, lon: -118.1902 },
    venice:       { lat: 33.9850, lon: -118.4695 },
    culver:       { lat: 34.0211, lon: -118.3965 },
    exposition:   { lat: 34.0183, lon: -118.2932 },
    southbay:     { lat: 33.8358, lon: -118.3406 },
    harbor:       { lat: 33.7361, lon: -118.2922 },
    boyleheights: { lat: 34.0345, lon: -118.2120 },
};

// Map Nominatim suburb/neighbourhood names → our dropdown IDs
SUBURB_TO_NEIGHBORHOOD = {
    'downtown': 'dtla',
    'downtown los angeles': 'dtla',
    'little tokyo': 'dtla',
    'arts district': 'dtla',
    'chinatown': 'dtla',
    'civic center': 'dtla',
    'bunker hill': 'dtla',
    'financial district': 'dtla',
    'skid row': 'dtla',
    'hollywood': 'hollywood',
    'east hollywood': 'hollywood',
    'thai town': 'hollywood',
    'hollywood hills': 'hollywood',
    'los feliz': 'silverlake',
    'koreatown': 'koreatown',
    'pico-union': 'koreatown',
    'westlake': 'koreatown',
    'west los angeles': 'westside',
    'west la': 'westside',
    'sawtelle': 'westside',
    'westwood': 'westside',
    'brentwood': 'westside',
    'bel air': 'westside',
    'santa monica': 'santamonica',
    'west hollywood': 'santamonica',
    'weho': 'santamonica',
    'beverly hills': 'beverly',
    'beverly grove': 'beverly',
    'beverlywood': 'beverly',
    'century city': 'beverly',
    'mid-wilshire': 'midcity',
    'mid wilshire': 'midcity',
    'mid-city': 'midcity',
    'mid city': 'midcity',
    'miracle mile': 'midcity',
    'hancock park': 'midcity',
    'larchmont': 'midcity',
    'windsor square': 'midcity',
    'park la brea': 'midcity',
    'fairfax': 'midcity',
    'south los angeles': 'southla',
    'south la': 'southla',
    'watts': 'southla',
    'florence': 'southla',
    'vermont square': 'southla',
    'vermont-slauson': 'southla',
    'green meadows': 'southla',
    'north hollywood': 'valleyeast',
    'noho': 'valleyeast',
    'studio city': 'valleyeast',
    'valley village': 'valleyeast',
    'sun valley': 'valleyeast',
    'panorama city': 'valleyeast',
    'arleta': 'valleyeast',
    'pacoima': 'valleyeast',
    'sylmar': 'valleyeast',
    'sherman oaks': 'valleywest',
    'encino': 'valleywest',
    'tarzana': 'valleywest',
    'woodland hills': 'valleywest',
    'reseda': 'valleywest',
    'canoga park': 'valleywest',
    'winnetka': 'valleywest',
    'chatsworth': 'valleywest',
    'northridge': 'valleywest',
    'granada hills': 'valleywest',
    'west hills': 'valleywest',
    'silver lake': 'silverlake',
    'silverlake': 'silverlake',
    'echo park': 'silverlake',
    'elysian valley': 'silverlake',
    'atwater village': 'silverlake',
    'highland park': 'highland',
    'eagle rock': 'highland',
    'glassell park': 'highland',
    'mount washington': 'highland',
    'cypress park': 'highland',
    'el sereno': 'highland',
    'venice': 'venice',
    'mar vista': 'venice',
    'del rey': 'venice',
    'playa vista': 'venice',
    'playa del rey': 'venice',
    'marina del rey': 'venice',
    'culver city': 'culver',
    'palms': 'culver',
    'rancho park': 'culver',
    'cheviot hills': 'culver',
    'castle heights': 'culver',
    'exposition park': 'exposition',
    'university park': 'exposition',
    'leimert park': 'exposition',
    'jefferson park': 'exposition',
    'west adams': 'exposition',
    'baldwin hills': 'exposition',
    'crenshaw': 'exposition',
    'torrance': 'southbay',
    'gardena': 'southbay',
    'carson': 'southbay',
    'hawthorne': 'southbay',
    'inglewood': 'southbay',
    'lawndale': 'southbay',
    'el segundo': 'southbay',
    'manhattan beach': 'southbay',
    'hermosa beach': 'southbay',
    'redondo beach': 'southbay',
    'san pedro': 'harbor',
    'wilmington': 'harbor',
    'harbor city': 'harbor',
    'harbor gateway': 'harbor',
    'boyle heights': 'boyleheights',
    'east los angeles': 'boyleheights',
    'east la': 'boyleheights',
    'lincoln heights': 'boyleheights',
};

// LA Metro Rail & Metrolink stations { lat, lon, name, line, tier, serviceType }
// Tier is determined by SERVICE TYPE, not distance:
//   Tier 1 = Heavy Rail (subway): Red/B Line, Purple/D Line
//   Tier 2 = Light Rail: Blue/A, Expo/E, Gold/L, Green/C, K Line, Regional Connector
//   Tier 2 = Commuter Rail: Metrolink
METRO_STATIONS = [
    // --- Red Line (B Line) — HEAVY RAIL (Tier 1): Union Station → North Hollywood ---
    { lat: 34.0557, lon: -118.2343, name: 'Union Station', line: 'red', tier: 1, serviceType: 'Heavy Rail' },
    { lat: 34.0548, lon: -118.2461, name: 'Civic Center/Grand Park', line: 'red', tier: 1, serviceType: 'Heavy Rail' },
    { lat: 34.0485, lon: -118.2516, name: 'Pershing Square', line: 'red', tier: 1, serviceType: 'Heavy Rail' },
    { lat: 34.0487, lon: -118.2585, name: '7th St/Metro Center', line: 'red', tier: 1, serviceType: 'Heavy Rail' },
    { lat: 34.0628, lon: -118.2906, name: 'Wilshire/Vermont', line: 'red', tier: 1, serviceType: 'Heavy Rail' },
    { lat: 34.1015, lon: -118.3090, name: 'Hollywood/Western', line: 'red', tier: 1, serviceType: 'Heavy Rail' },
    { lat: 34.1015, lon: -118.3257, name: 'Hollywood/Vine', line: 'red', tier: 1, serviceType: 'Heavy Rail' },
    { lat: 34.1018, lon: -118.3392, name: 'Hollywood/Highland', line: 'red', tier: 1, serviceType: 'Heavy Rail' },
    { lat: 34.14000, lon: -118.36270, name: 'Universal City/Studio City', line: 'red', tier: 1, serviceType: 'Heavy Rail' },
    { lat: 34.1687, lon: -118.3770, name: 'North Hollywood', line: 'red', tier: 1, serviceType: 'Heavy Rail' },
    // --- Purple Line (D Line) — HEAVY RAIL (Tier 1): Wilshire corridor ---
    { lat: 34.0614, lon: -118.3009, name: 'Wilshire/Normandie', line: 'purple', tier: 1, serviceType: 'Heavy Rail' },
    { lat: 34.0621, lon: -118.3089, name: 'Wilshire/Western', line: 'purple', tier: 1, serviceType: 'Heavy Rail' },
    { lat: 34.0617, lon: -118.3448, name: 'Wilshire/La Brea', line: 'purple', tier: 1, serviceType: 'Heavy Rail' },
    { lat: 34.0622, lon: -118.3601, name: 'Wilshire/Fairfax', line: 'purple', tier: 1, serviceType: 'Heavy Rail' },
    { lat: 34.0655, lon: -118.3759, name: 'Wilshire/La Cienega', line: 'purple', tier: 1, serviceType: 'Heavy Rail' },
    { lat: 34.0669, lon: -118.3983, name: 'Wilshire/Rodeo', line: 'purple', tier: 1, serviceType: 'Heavy Rail' },
    { lat: 34.0597, lon: -118.4150, name: 'Century City/Constellation', line: 'purple', tier: 1, serviceType: 'Heavy Rail' },
    { lat: 34.0586, lon: -118.4444, name: 'Westwood/UCLA', line: 'purple', tier: 1, serviceType: 'Heavy Rail' },
    { lat: 34.0544, lon: -118.4536, name: 'Westwood/VA Hospital', line: 'purple', tier: 1, serviceType: 'Heavy Rail' },
    // --- Blue/A Line — LIGHT RAIL (Tier 2): 7th/Metro → Long Beach ---
    { lat: 34.04074, lon: -118.26612, name: 'Pico', line: 'blue_a', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.02911, lon: -118.27360, name: 'LATTC/Ortho Institute', line: 'blue_a', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.02681, lon: -118.25551, name: 'San Pedro St', line: 'blue_a', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.01965, lon: -118.24308, name: 'Washington', line: 'blue_a', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.00292, lon: -118.24330, name: 'Vernon', line: 'blue_a', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.98876, lon: -118.24340, name: 'Slauson', line: 'blue_a', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.97374, lon: -118.24327, name: 'Florence', line: 'blue_a', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.95961, lon: -118.24321, name: 'Firestone', line: 'blue_a', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.94222, lon: -118.24316, name: '103rd St/Watts Towers', line: 'blue_a', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.92805, lon: -118.23756, name: 'Willowbrook/Rosa Parks', line: 'blue_a', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.89749, lon: -118.22425, name: 'Compton', line: 'blue_a', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.87608, lon: -118.22250, name: 'Artesia', line: 'blue_a', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.84822, lon: -118.21102, name: 'Del Amo', line: 'blue_a', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.81987, lon: -118.19609, name: 'Wardlow', line: 'blue_a', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.80708, lon: -118.18983, name: 'Willow St', line: 'blue_a', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.78909, lon: -118.18938, name: 'Pacific Coast Hwy', line: 'blue_a', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.7686, lon: -118.1891, name: '1st St (Long Beach)', line: 'blue_a', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.76807, lon: -118.19292, name: 'Downtown Long Beach', line: 'blue_a', tier: 2, serviceType: 'Light Rail' },
    // --- Expo/E Line — LIGHT RAIL (Tier 2): 7th/Metro → Downtown Santa Monica ---
    { lat: 34.01823, lon: -118.28573, name: 'Expo Park/USC', line: 'expo_e', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.01825, lon: -118.29154, name: 'Expo/Vermont', line: 'expo_e', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.01833, lon: -118.30891, name: 'Expo/Western', line: 'expo_e', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.02253, lon: -118.33508, name: 'Expo/Crenshaw', line: 'expo_e', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.02398, lon: -118.34610, name: 'Farmdale', line: 'expo_e', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.02480, lon: -118.35516, name: 'Expo/La Brea', line: 'expo_e', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.02636, lon: -118.37212, name: 'La Cienega/Jefferson', line: 'expo_e', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.02790, lon: -118.38899, name: 'Culver City', line: 'expo_e', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.02932, lon: -118.40426, name: 'Palms', line: 'expo_e', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.03682, lon: -118.42458, name: 'Westwood/Rancho Park', line: 'expo_e', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.03541, lon: -118.43423, name: 'Expo/Sepulveda', line: 'expo_e', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.03171, lon: -118.45290, name: 'Expo/Bundy', line: 'expo_e', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.02800, lon: -118.46912, name: '26th St/Bergamot', line: 'expo_e', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.01401, lon: -118.49138, name: 'Downtown Santa Monica', line: 'expo_e', tier: 2, serviceType: 'Light Rail' },
    // --- Gold/L Line — LIGHT RAIL (Tier 2): East LA → Azusa/APU ---
    { lat: 34.0501, lon: -118.2379, name: 'Little Tokyo/Arts District', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.0561, lon: -118.2361, name: 'Union Station (Gold)', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.0638, lon: -118.2359, name: 'Chinatown', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.0808, lon: -118.2207, name: 'Lincoln/Cypress', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.0871, lon: -118.2126, name: 'Heritage Square/Arroyo', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.0982, lon: -118.2067, name: 'Southwest Museum', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.1111, lon: -118.1930, name: 'Highland Park', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.1153, lon: -118.1578, name: 'South Pasadena', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.1334, lon: -118.1481, name: 'Fillmore', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.1419, lon: -118.1482, name: 'Del Mar', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.1485, lon: -118.1475, name: 'Memorial Park', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.1519, lon: -118.1325, name: 'Lake', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.1518, lon: -118.1130, name: 'Allen', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.1485, lon: -118.0815, name: 'Sierra Madre Villa', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.1429, lon: -118.0292, name: 'Arcadia', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.1332, lon: -118.0035, name: 'Monrovia', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.1325, lon: -117.9675, name: 'Duarte/City of Hope', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.1288, lon: -117.9333, name: 'Irwindale', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.1359, lon: -117.9067, name: 'Azusa Downtown', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.1371, lon: -117.8908, name: 'APU/Citrus College', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    // Gold/L Line East LA branch
    { lat: 34.0476, lon: -118.2260, name: 'Pico/Aliso', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.04722, lon: -118.21965, name: 'Mariachi Plaza/Boyle Heights', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.04375, lon: -118.21006, name: 'Soto', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.03430, lon: -118.19218, name: 'Indiana', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.03332, lon: -118.16814, name: 'Maravilla', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.03336, lon: -118.16121, name: 'East LA Civic Center', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.03340, lon: -118.15447, name: 'Atlantic', line: 'gold_l', tier: 2, serviceType: 'Light Rail' },
    // --- Green/C Line — LIGHT RAIL (Tier 2): Norwalk → Aviation/LAX ---
    { lat: 33.9140, lon: -118.1046, name: 'Norwalk', line: 'green_c', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.9131, lon: -118.1406, name: 'Lakewood Blvd', line: 'green_c', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.92488, lon: -118.20995, name: 'Long Beach Blvd', line: 'green_c', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.9275, lon: -118.2652, name: 'Avalon', line: 'green_c', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.92826, lon: -118.23805, name: 'Willowbrook/Rosa Parks (Green)', line: 'green_c', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.9287, lon: -118.2919, name: 'Vermont/Athens', line: 'green_c', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.9287, lon: -118.2813, name: 'Harbor Freeway', line: 'green_c', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.92520, lon: -118.32655, name: 'Crenshaw (Green)', line: 'green_c', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.9335, lon: -118.3520, name: 'Hawthorne/Lennox', line: 'green_c', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.92962, lon: -118.37713, name: 'Aviation/LAX', line: 'green_c', tier: 2, serviceType: 'Light Rail' },
    // --- K Line (Crenshaw/LAX + South Bay) — LIGHT RAIL (Tier 2) ---
    { lat: 34.02216, lon: -118.33485, name: 'Expo/Crenshaw (K)', line: 'k_line', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.0046, lon: -118.3327, name: 'Leimert Park', line: 'k_line', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.9884, lon: -118.3308, name: 'Hyde Park', line: 'k_line', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.9752, lon: -118.3363, name: 'Fairview Heights', line: 'k_line', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.9673, lon: -118.3514, name: 'Downtown Inglewood', line: 'k_line', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.9620, lon: -118.3746, name: 'Westchester/Veterans', line: 'k_line', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.94557, lon: -118.37868, name: 'Aviation/Century', line: 'k_line', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.9232, lon: -118.3876, name: 'Mariposa', line: 'k_line', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.9162, lon: -118.3867, name: 'El Segundo', line: 'k_line', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.9051, lon: -118.3829, name: 'Douglas', line: 'k_line', tier: 2, serviceType: 'Light Rail' },
    { lat: 33.8945, lon: -118.3690, name: 'Redondo Beach', line: 'k_line', tier: 2, serviceType: 'Light Rail' },
    // --- Regional Connector — LIGHT RAIL (Tier 2) ---
    { lat: 34.0550, lon: -118.2512, name: 'Grand Av Arts/Bunker Hill', line: 'connector', tier: 2, serviceType: 'Light Rail' },
    { lat: 34.05216, lon: -118.24632, name: 'Historic Broadway', line: 'connector', tier: 2, serviceType: 'Light Rail' },
    // --- Metrolink Stations (LA County) — COMMUTER RAIL (Tier 2) ---
    // Shared hub
    { lat: 34.0562, lon: -118.2365, name: 'LA Union Station (Metrolink)', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    // Antelope Valley Line
    { lat: 34.29250, lon: -118.45020, name: 'Sylmar/San Fernando', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    { lat: 34.22239, lon: -118.37335, name: 'Sun Valley', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    { lat: 34.20640, lon: -118.34950, name: 'Burbank Airport North', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    { lat: 34.17860, lon: -118.31200, name: 'Burbank Downtown', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    { lat: 34.12370, lon: -118.25900, name: 'Glendale', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    { lat: 34.37933, lon: -118.52691, name: 'Newhall', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    { lat: 34.41372, lon: -118.52503, name: 'Santa Clarita', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    { lat: 34.40846, lon: -118.46924, name: 'Via Princessa', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    { lat: 34.41297, lon: -118.43400, name: 'Vista Canyon', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    { lat: 34.49797, lon: -118.11826, name: 'Vincent Grade/Acton', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    { lat: 34.59083, lon: -118.11960, name: 'Palmdale', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    { lat: 34.69659, lon: -118.13624, name: 'Lancaster', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    // Ventura County Line (LA County stations)
    { lat: 34.19295, lon: -118.35351, name: 'Burbank Airport-South', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    { lat: 34.23046, lon: -118.54515, name: 'Northridge', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    { lat: 34.25290, lon: -118.59930, name: 'Chatsworth', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    { lat: 34.21130, lon: -118.44670, name: 'Van Nuys', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    // San Bernardino Line (LA County stations)
    { lat: 34.06220, lon: -118.17150, name: 'Cal State LA', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    { lat: 34.07650, lon: -118.03620, name: 'El Monte', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    { lat: 34.08540, lon: -117.95810, name: 'Baldwin Park', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    { lat: 34.09220, lon: -117.88850, name: 'Covina', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    { lat: 34.00695, lon: -118.12610, name: 'Montebello/Commerce', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    { lat: 34.09375, lon: -117.75233, name: 'Pomona-North', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    { lat: 34.09396, lon: -117.71692, name: 'Claremont', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    // Orange County / 91-Perris Valley / IEOC Line (LA County stations)
    { lat: 33.99069, lon: -118.14391, name: 'Commerce', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    { lat: 33.91636, lon: -118.05983, name: 'Norwalk/Santa Fe Springs', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
    // Riverside Line (LA County station)
    { lat: 34.00807, lon: -117.84545, name: 'Industry', line: 'metrolink', tier: 2, serviceType: 'Commuter Rail' },
];

// SB 79 Transit-Oriented Development tier definitions (effective July 1, 2026)
SB79_TIERS = {
    1: { label: 'Tier 1 (Heavy Rail)', height: 95, density: 160, far: 4.5 },
    2: { label: 'Tier 2 (Light Rail/BRT)', height: 85, density: 140, far: 4.0 },
};
// Gov. Code §65912.157(a): exact tier × distance cells. Never derive
// inner/outer standards by multiplying the adjacent envelope.
SB79_ENVELOPE_BY_BAND = {
    '1-adjacent': { height: 95, density: 160, far: 4.5, parking: 0 },
    '1-inner':    { height: 75, density: 120, far: 3.5, parking: 0 },
    '1-outer':    { height: 65, density: 100, far: 3.0, parking: 0.5 },
    '2-adjacent': { height: 85, density: 140, far: 4.0, parking: 0 },
    '2-inner':    { height: 65, density: 100, far: 3.0, parking: 0 },
    '2-outer':    { height: 55, density: 80,  far: 2.5, parking: 0.5 },
};
SB79_ZONES = {
    adjacent: { maxDist: 0.038, label: '200ft (Adjacent)' },
    inner:    { maxDist: 0.25,  label: '1/4 Mile (Inner)' },
    outer:    { maxDist: 0.50,  label: '1/2 Mile (Outer)' },
};

function getSB79BandAllowances(tier, zoneKey) {
    const envelope = SB79_ENVELOPE_BY_BAND[String(tier) + '-' + zoneKey];
    return envelope ? Object.assign({}, envelope) : null;
}

// Line display colors for map markers
LINE_COLORS = {
    red: '#e53e3e', purple: '#805ad5', blue_a: '#3182ce', expo_e: '#d69e2e',
    gold_l: '#b7791f', green_c: '#38a169', k_line: '#00bcd4', connector: '#ed64a6',
    metrolink: '#e53e3e',
};
LINE_LABELS = {
    red: 'Red/B Line', purple: 'Purple/D Line', blue_a: 'Blue/A Line', expo_e: 'Expo/E Line',
    gold_l: 'Gold/L Line', green_c: 'Green/C Line', k_line: 'K Line (Crenshaw)', connector: 'Regional Connector',
    metrolink: 'Metrolink',
};

// Major LA arterials for street detection
MAJOR_ARTERIALS = [
    'wilshire', 'sunset', 'santa monica', 'hollywood', 'venice', 'olympic',
    'pico', 'la cienega', 'figueroa', 'vermont', 'western', 'crenshaw',
    'sepulveda', 'van nuys', 'ventura', 'victory', 'sherman way', 'lincoln',
    'pacific coast', 'pch', 'florence', 'manchester', 'century', 'imperial',
    'alameda', 'broadway', 'spring', 'main st', 'san fernando', 'glendale',
    'beverly', 'la brea', 'fairfax', 'robertson', 'melrose', 'highland',
    'cahuenga', 'vine', 'western ave', 'normandie', 'hoover', 'alvarado',
    'temple', 'cesar chavez', 'first', '1st st', '3rd st', '6th st',
    'whittier', 'washington', 'jefferson', 'exposition', 'mlk',
    'martin luther king', 'slauson', 'gage', 'rosecrans', 'artesia',
    'el segundo', 'hawthorne', 'inglewood', 'prairie', 'aviation',
    'centinela', 'overland', 'motor', 'sawtelle', 'barrington',
    'balboa', 'reseda', 'tampa', 'winnetka', 'de soto', 'topanga',
    'canoga', 'fallbrook', 'laurel canyon', 'coldwater canyon',
    'lankershim', 'vineland', 'tujunga', 'foothill', 'glenoaks',
    'brand', 'colorado', 'huntington', 'atlantic', 'soto',
];

// Known Alquist-Priolo fault trace segments (simplified polyline vertices).
// Each segment is [lat1, lon1, lat2, lon2]. If a parcel is within ~0.15 mi of any
// segment, it is likely in a state-designated fault zone.
LA_FAULT_SEGMENTS = [
    // Hollywood Fault (runs roughly E-W through Hollywood)
    [34.1015, -118.3640, 34.0975, -118.3290],
    [34.0975, -118.3290, 34.0942, -118.3010],
    [34.0942, -118.3010, 34.0905, -118.2700],
    // Santa Monica Fault
    [34.0490, -118.5100, 34.0430, -118.4700],
    [34.0430, -118.4700, 34.0370, -118.4350],
    [34.0370, -118.4350, 34.0310, -118.3960],
    // Raymond Fault (Pasadena area)
    [34.1600, -118.1700, 34.1480, -118.1200],
    [34.1480, -118.1200, 34.1400, -118.0900],
    // Newport-Inglewood Fault
    [33.9600, -118.3960, 33.9850, -118.3800],
    [33.9850, -118.3800, 34.0100, -118.3650],
    [34.0100, -118.3650, 34.0350, -118.3530],
    // Sierra Madre Fault
    [34.1850, -118.1200, 34.1750, -118.0600],
    [34.1750, -118.0600, 34.1650, -118.0100],
    // Verdugo Fault
    [34.2200, -118.2800, 34.2000, -118.2400],
    [34.2000, -118.2400, 34.1850, -118.2100],
];

// Neighborhoods / areas within LA Coastal Zone (roughly west of Lincoln Blvd to ocean)
COASTAL_NEIGHBORHOODS = [
    'venice', 'marina_del_rey', 'playa_del_rey', 'westchester',
    'pacific_palisades', 'malibu', 'san_pedro', 'wilmington',
];

// Hillside Ordinance areas — simplified bounding regions
HILLSIDE_REGIONS = [
    // Hollywood Hills / Mulholland
    { latMin: 34.105, latMax: 34.160, lonMin: -118.420, lonMax: -118.280 },
    // Mt Washington / Glassell Park hills
    { latMin: 34.095, latMax: 34.125, lonMin: -118.230, lonMax: -118.195 },
    // Baldwin Hills / Kenneth Hahn
    { latMin: 33.990, latMax: 34.015, lonMin: -118.380, lonMax: -118.340 },
    // Griffith Park perimeter (not buildable, but adjacent parcels)
    { latMin: 34.120, latMax: 34.160, lonMin: -118.320, lonMax: -118.260 },
    // Silver Lake hills (Micheltorena / Crestmont)
    { latMin: 34.088, latMax: 34.105, lonMin: -118.270, lonMax: -118.250 },
    // El Sereno hills
    { latMin: 34.080, latMax: 34.100, lonMin: -118.185, lonMax: -118.160 },
    // Pacific Palisades / Brentwood hills
    { latMin: 34.050, latMax: 34.090, lonMin: -118.530, lonMax: -118.470 },
    // Bel Air / Holmby Hills
    { latMin: 34.075, latMax: 34.110, lonMin: -118.460, lonMax: -118.420 },
];

// HPOZ (Historic Preservation Overlay Zone) neighborhoods
HPOZ_NEIGHBORHOODS = [
    'hancock_park', 'windsor_square', 'west_adams', 'highland_park',
    'jefferson_park', 'country_club_park', 'carthay',
    'south_carthay', 'spaulding_square', 'melrose_hill',
    'vinegar_hill', 'whitley_heights', 'banning',
];

// Flood zone: areas near major channels and the LA River
FLOOD_CORRIDORS = [
    // LA River — simplified centerline segments [lat, lon] with 0.15 mi buffer
    { lat: 34.145, lon: -118.260 }, // Glendale Narrows
    { lat: 34.115, lon: -118.245 }, // Elysian Valley / Frogtown
    { lat: 34.085, lon: -118.230 }, // Lincoln Heights / Cypress Park
    { lat: 34.060, lon: -118.220 }, // Boyle Heights
    { lat: 34.030, lon: -118.210 }, // Vernon
    { lat: 33.980, lon: -118.200 }, // South Gate
    { lat: 33.940, lon: -118.195 }, // Lynwood / Compton
    { lat: 33.900, lon: -118.210 }, // Carson
    { lat: 33.770, lon: -118.215 }, // Long Beach (river mouth)
    // Ballona Creek
    { lat: 33.980, lon: -118.420 }, // Culver City
    { lat: 33.975, lon: -118.440 }, // MDR / Playa Vista
    // Tujunga Wash
    { lat: 34.200, lon: -118.370 }, // Sun Valley
    { lat: 34.175, lon: -118.355 }, // North Hollywood
    // Dominguez Channel
    { lat: 33.870, lon: -118.260 }, // Carson / Torrance
    // Compton Creek
    { lat: 33.905, lon: -118.220 },
];
FLOOD_BUFFER_MI = 0.20; // ~1,000 ft from channel centerline

// ── Multi-city zoning GIS endpoints ─────────────────────────────
// Each entry: { url, field, descField? } — all support inSR=4326
CITY_ZONING_GIS = {
    'glendale':       { url: 'https://gismap.glendaleca.gov/arcgis/rest/services/Common/Zoning/MapServer/2/query', field: 'ZONE_DISTR', descField: 'ZONE_DESC' },
    'long beach':     { url: 'https://services6.arcgis.com/yCArG7wGXGyWLqav/ArcGIS/rest/services/Zoning/FeatureServer/0/query', field: 'ZONING_SYMBOL' },
    'pasadena':       { url: 'https://services2.arcgis.com/zNjnZafDYCAJAbN0/arcgis/rest/services/Zoning/FeatureServer/0/query', field: 'ZONE_CODE' },
    'santa monica':   { url: 'https://gis.santamonica.gov/server/rest/services/Zoning/FeatureServer/2/query', field: 'zoning', descField: 'zonedesc' },
    'west hollywood': { url: 'https://gis.weho.org/arcgis/rest/services/Planning/Zoning_Map_2018/MapServer/1/query', field: 'ZONECLASS', descField: 'ZONEDESC' },
    'beverly hills':  { url: 'https://gis.beverlyhills.org/arcgis/rest/services/Zoning/MapServer/2/query', field: 'ZONE' },
    'inglewood':      { url: 'https://gisweb.cityofinglewood.org/arcgis/rest/services/CityofInglewoodZoning/MapServer/0/query', field: 'ZNGCODE', descField: 'ZONEDESCRP' },
    'pomona':         { url: 'https://gismaps.ci.pomona.ca.us/arcgis/rest/services/CommunityDevelopment/Zoning/MapServer/0/query', field: 'Label', descField: 'Zone_Defin' },
    'arcadia':        { url: 'https://arcgis.gis.lacounty.gov/arcgis/rest/services/Arcadia/Zoning/MapServer/1/query', field: 'Zones' },
    'torrance':       { url: 'https://services1.arcgis.com/38fAqAZVRCrVtPUU/ArcGIS/rest/services/Zoning/FeatureServer/20/query', field: 'ZONING' },
    'culver city':    { url: 'https://services2.arcgis.com/LNAhiRpezPbHTIUO/arcgis/rest/services/Final_Zoning_Map_100924/FeatureServer/0/query', field: 'Zoning' },
    'alhambra':       { url: 'https://services6.arcgis.com/GZCJsJngT6kRZkzb/arcgis/rest/services/Alhambra_Planning/FeatureServer/9/query', field: 'Zoning', descField: 'Zoning_Description' },
};


// === NEIGHBORHOOD & TRANSIT DETECTION ===

// haversine() — defined in shared.js (haversine distance in miles)

// Detect nearest neighborhood from coordinates + Nominatim address details
function detectNeighborhood(lat, lon, addressDetails) {
    // Try Nominatim address fields (neighbourhood is most specific, then suburb)
    if (addressDetails) {
        const fields = [
            addressDetails.neighbourhood,
            addressDetails.suburb,
            addressDetails.city_district,
            addressDetails.quarter,
        ];
        for (const field of fields) {
            if (field) {
                const key = field.toLowerCase().trim();
                if (SUBURB_TO_NEIGHBORHOOD[key]) {
                    return SUBURB_TO_NEIGHBORHOOD[key];
                }
            }
        }
    }
    // Fall back to centroid distance
    let best = 'westside';
    let bestDist = Infinity;
    for (const [key, c] of Object.entries(NEIGHBORHOOD_CENTROIDS)) {
        const d = haversine(lat, lon, c.lat, c.lon);
        if (d < bestDist) { bestDist = d; best = key; }
    }
    return best;
}

// Detect transit proximity from coordinates
function detectTransitProximity(lat, lon) {
    let minDist = Infinity;
    for (const s of METRO_STATIONS) {
        const d = haversine(lat, lon, s.lat, s.lon);
        if (d < minDist) minDist = d;
    }
    if (minDist <= 0.25) return 'adjacent';
    if (minDist <= 0.5) return 'near';
    if (minDist <= 1.0) return 'moderate';
    return 'far';
}

// Detect SB 79 eligibility from coordinates
function detectSB79Eligibility(lat, lon) {
    let nearest = null;
    let nearestDist = Infinity;
    let nearestIdx = -1;
    for (let i = 0; i < METRO_STATIONS.length; i++) {
        const s = METRO_STATIONS[i];
        const d = haversine(lat, lon, s.lat, s.lon);
        if (d < nearestDist) {
            nearestDist = d;
            nearest = s;
            nearestIdx = i;
        }
    }
    if (!nearest || nearestDist > 0.5) {
        return { eligible: false, station: nearest, distMiles: nearestDist, nearestIdx };
    }
    const tier = nearest.tier;
    const tierData = SB79_TIERS[tier];
    let zone, zoneKey;
    if (nearestDist <= SB79_ZONES.adjacent.maxDist) { zone = SB79_ZONES.adjacent; zoneKey = 'adjacent'; }
    else if (nearestDist <= SB79_ZONES.inner.maxDist) { zone = SB79_ZONES.inner; zoneKey = 'inner'; }
    else { zone = SB79_ZONES.outer; zoneKey = 'outer'; }

    const allowances = getSB79BandAllowances(tier, zoneKey);
    return {
        eligible: true,
        station: nearest,
        nearestIdx,
        tier,
        tierLabel: tierData.label,
        zone: zoneKey,
        zoneLabel: zone.label,
        distMiles: nearestDist,
        allowances,
    };
}

// Detect if address is on a major arterial
function detectArterial(addressString, addressDetails) {
    // Try Nominatim road field first (most accurate — avoids matching neighborhood names)
    if (addressDetails && addressDetails.road) {
        const road = addressDetails.road.toLowerCase();
        for (const art of MAJOR_ARTERIALS) {
            if (road.includes(art)) return 'major';
        }
        if (/\bblvd\b|\bboulevard\b|\bave\b|\bavenue\b/.test(road)) return 'secondary';
        return 'residential';
    }
    // Fall back to full address string
    const lower = addressString.toLowerCase();
    for (const art of MAJOR_ARTERIALS) {
        if (lower.includes(art)) return 'major';
    }
    if (/\bblvd\b|\bboulevard\b|\bave\b|\bavenue\b/.test(lower)) return 'secondary';
    return 'residential';
}

// Detect site condition from Nominatim result
// For HBU analysis, any existing structure implies redevelopment → demolition
function detectSiteCondition(osmClass, osmType) {
    // Named structures (buildings, amenities, commercial, etc.)
    const structureClasses = ['building', 'amenity', 'shop', 'office', 'tourism', 'leisure', 'craft', 'club', 'healthcare'];
    if (structureClasses.includes(osmClass)) return 'demolition';
    // Address resolving to a house/building → existing structure for HBU redevelopment
    if (osmClass === 'place' && ['house', 'building', 'apartments', 'residential'].includes(osmType)) return 'demolition';
    // Other place types (most LA parcels have structures)
    if (osmClass === 'place') return 'demolition';
    return 'vacant';
}


// === SITE CONSTRAINT DETECTION ===

// Bounding box: if lon is west of -118.44 AND lat is south of 34.05, likely coastal
// Also Pacific Palisades / Malibu: lon west of -118.50
function isCoastalHeuristic(lat, lon, hood) {
    if (COASTAL_NEIGHBORHOODS.includes(hood)) return true;
    // Pacific coast strip: within ~0.5 mi of shoreline
    if (lon < -118.47 && lat < 34.08) return true;  // Venice/MDR/Playa
    if (lon < -118.52) return true;                   // Palisades/Malibu
    if (lat < 33.76 && lon < -118.30) return true;   // San Pedro/Pt Fermin
    return false;
}

function isHillsideHeuristic(lat, lon) {
    for (const r of HILLSIDE_REGIONS) {
        if (lat >= r.latMin && lat <= r.latMax && lon >= r.lonMin && lon <= r.lonMax) return true;
    }
    return false;
}

function isHistoricHeuristic(hood) {
    return HPOZ_NEIGHBORHOODS.includes(hood);
}

function isFloodHeuristic(lat, lon) {
    for (const pt of FLOOD_CORRIDORS) {
        if (haversine(lat, lon, pt.lat, pt.lon) <= FLOOD_BUFFER_MI) return true;
    }
    return false;
}

// Distance from point to line segment (returns miles)
function pointToSegmentDist(lat, lon, lat1, lon1, lat2, lon2) {
    // Project onto segment in degree space (approximate at LA latitude)
    const dx = lon2 - lon1, dy = lat2 - lat1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return haversine(lat, lon, lat1, lon1);
    let t = ((lon - lon1) * dx + (lat - lat1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projLat = lat1 + t * dy, projLon = lon1 + t * dx;
    return haversine(lat, lon, projLat, projLon);
}

function isFaultHeuristic(lat, lon) {
    const FAULT_BUFFER_MI = 0.15; // ~800 ft Alquist-Priolo zone width
    for (const seg of LA_FAULT_SEGMENTS) {
        if (pointToSegmentDist(lat, lon, seg[0], seg[1], seg[2], seg[3]) <= FAULT_BUFFER_MI) return true;
    }
    return false;
}

// Master heuristic function — returns which checkboxes to pre-check
function detectSiteConstraints(lat, lon, hood) {
    return {
        constFlood:    isFloodHeuristic(lat, lon),
        constHillside: isHillsideHeuristic(lat, lon),
        constHistoric: isHistoricHeuristic(hood),
        constFault:    isFaultHeuristic(lat, lon),
        constCoastal:  isCoastalHeuristic(lat, lon, hood),
    };
}

// --- GIS API refinement (runs in background after heuristics) ---

async function fetchConstraintsFromGIS(lat, lon) {
    var results = { constFlood: null, constHillside: null, constHistoric: null, constFault: null, constCoastal: null };

    // All queries use ZIMAS / LA City Planning ArcGIS REST services
    var queries = [];

    // 1. Flood Zone — FEMA National Flood Hazard Layer
    queries.push(
        fetch('https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query?' +
            'geometry=' + lon + ',' + lat + '&geometryType=esriGeometryPoint&inSR=4326' +
            '&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE&returnGeometry=false&f=json')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.features && data.features.length > 0) {
                var zone = data.features[0].attributes.FLD_ZONE || '';
                // A, AE, AH, AO, V, VE = flood zone; X = minimal risk
                results.constFlood = /^[AV]/.test(zone);
            }
        }).catch(function() {})
    );

    // 2. Hillside Ordinance — ZIMAS specific plan overlay
    queries.push(
        fetch('https://zimas.lacity.org/arcgis/rest/services/zma/specific_plan/MapServer/1117/query?' +
            'geometry=' + lon + ',' + lat + '&geometryType=esriGeometryPoint&inSR=4326' +
            '&spatialRel=esriSpatialRelIntersects&outFields=APTS_NAME&returnGeometry=false&f=json')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.features && data.features.length > 0) {
                var name = (data.features[0].attributes.APTS_NAME || '').toLowerCase();
                results.constHillside = name.indexOf('hillside') >= 0 || name.indexOf('baseline') >= 0;
            }
        }).catch(function() {})
    );

    // 3. Historic (HPOZ) — ZIMAS HPOZ overlay
    queries.push(
        fetch('https://zimas.lacity.org/arcgis/rest/services/zma/hpoz/MapServer/1116/query?' +
            'geometry=' + lon + ',' + lat + '&geometryType=esriGeometryPoint&inSR=4326' +
            '&spatialRel=esriSpatialRelIntersects&outFields=OBJECTID&returnGeometry=false&f=json')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.features && data.features.length > 0) {
                results.constHistoric = true;
            }
        }).catch(function() {})
    );

    // 4. Fault Zone — CGS Alquist-Priolo layer
    queries.push(
        fetch('https://zimas.lacity.org/arcgis/rest/services/zma/fault_zone/MapServer/1107/query?' +
            'geometry=' + lon + ',' + lat + '&geometryType=esriGeometryPoint&inSR=4326' +
            '&spatialRel=esriSpatialRelIntersects&outFields=OBJECTID&returnGeometry=false&f=json')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.features && data.features.length > 0) {
                results.constFault = true;
            }
        }).catch(function() {})
    );

    // 5. Coastal Zone — CA Coastal Commission boundary
    queries.push(
        fetch('https://zimas.lacity.org/arcgis/rest/services/zma/coastal/MapServer/1105/query?' +
            'geometry=' + lon + ',' + lat + '&geometryType=esriGeometryPoint&inSR=4326' +
            '&spatialRel=esriSpatialRelIntersects&outFields=OBJECTID&returnGeometry=false&f=json')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.features && data.features.length > 0) {
                results.constCoastal = true;
            }
        }).catch(function() {})
    );

    await Promise.all(queries);
    return results;
}

// Refine heuristic results with GIS API data (called in background)
// NOTE: This function manipulates DOM elements — portals must provide
// markAutofill() and addStatus() in their own scope.
function applyFireCheckForGeneration(result, lookupGeneration) {
    if (lookupGeneration !== window._lookupGeneration) return false;
    window._lastFireCheck = result;
    return true;
}

async function refineConstraintsFromGIS(lat, lon, lookupGeneration) {
    try {
        var gis = await fetchConstraintsFromGIS(lat, lon);
        if (lookupGeneration !== undefined && lookupGeneration !== window._lookupGeneration) return;
        var updated = false;
        ['constFlood', 'constHillside', 'constHistoric', 'constFault', 'constCoastal'].forEach(function(id) {
            if (gis[id] !== null) {
                var el = document.getElementById(id);
                if (el && el.checked !== gis[id]) {
                    el.checked = gis[id];
                    updated = true;
                }
            }
        });
        if (updated) {
            markAutofill('siteConstraints');
            // Build refined status message
            var detected = [];
            ['constFlood', 'constHillside', 'constHistoric', 'constFault', 'constCoastal'].forEach(function(id) {
                var el = document.getElementById(id);
                if (el && el.checked) {
                    var labels = { constFlood: 'Flood Zone', constHillside: 'Hillside', constHistoric: 'Historic (HPOZ)', constFault: 'Fault Zone', constCoastal: 'Coastal Zone' };
                    detected.push(labels[id]);
                }
            });
            if (detected.length > 0) {
                addStatus('<br><span class="status-item warn">GIS verified constraints: ' + detected.join(', ') + '</span>');
            } else {
                addStatus('<br><span class="status-item ok">GIS confirmed: no site constraints detected</span>');
            }
        }
    } catch (e) {
        console.warn('GIS constraint refinement failed:', e);
    }
}


// === JURISDICTION DETECTION ===

JURISDICTIONS = [
    { name: 'Beverly Hills', lat: 34.0736, lon: -118.4004, radius: 1.8, note: 'Beverly Hills Municipal Code applies — different density/height rules than LA.' },
    { name: 'Santa Monica', lat: 34.0195, lon: -118.4912, radius: 2.5, note: 'Santa Monica zoning code applies — rent control, strict height limits, Coastal Zone overlay likely.' },
    { name: 'West Hollywood', lat: 34.0900, lon: -118.3617, radius: 1.2, note: 'West Hollywood Municipal Code applies — strong rent stabilization, unique zoning districts.' },
    { name: 'Culver City', lat: 34.0211, lon: -118.3965, radius: 2.0, note: 'Culver City zoning applies — TOD incentives near Expo Line, distinct fee schedules.' },
    { name: 'Glendale', lat: 34.1425, lon: -118.2551, radius: 3.0, note: 'Glendale Municipal Code applies — own specific plan areas and development standards.' },
    { name: 'Burbank', lat: 34.1808, lon: -118.3090, radius: 2.8, note: 'Burbank zoning code applies — media district incentives, own entitlement process.' },
    { name: 'Pasadena', lat: 34.1478, lon: -118.1445, radius: 3.5, note: 'Pasadena zoning code applies — historic preservation focus, Central District Specific Plan.' },
    { name: 'Inglewood', lat: 33.9617, lon: -118.3531, radius: 2.5, note: 'Inglewood zoning applies — SoFi Stadium area incentives, own development review.' },
    { name: 'Long Beach', lat: 33.7701, lon: -118.1937, radius: 5.0, note: 'Long Beach Municipal Code applies — own zoning, PD districts, and Coastal Zone rules.' },
    { name: 'Malibu', lat: 34.0259, lon: -118.7798, radius: 8.0, note: 'City of Malibu — Coastal Commission jurisdiction, severe height/density limits, LCP applies.' },
    { name: 'Torrance', lat: 33.8358, lon: -118.3406, radius: 3.0, note: 'Torrance zoning code applies — own development standards and review process.' },
    { name: 'Hawthorne', lat: 33.9164, lon: -118.3526, radius: 1.5, note: 'Hawthorne zoning applies — distinct fee schedule and entitlement process.' },
    { name: 'Carson', lat: 33.8317, lon: -118.2620, radius: 2.5, note: 'Carson Municipal Code applies — own specific plans and environmental review.' },
    { name: 'Redondo Beach', lat: 33.8492, lon: -118.3884, radius: 2.0, note: 'Redondo Beach zoning code applies — Coastal Zone, own height/density standards.' },
    { name: 'Pomona', lat: 34.0551, lon: -117.7500, radius: 3.5, note: 'Pomona zoning code applies — own downtown specific plan and development incentives.' },
    { name: 'South Pasadena', lat: 34.1161, lon: -118.1503, radius: 1.5, note: 'South Pasadena Municipal Code (SPMC Ch. 36) applies — zones RE/RS/RM/RH (not LA R1-R5). Strong historic preservation (11+ historic districts, 50+ landmarks). ADUs allowed with 4 ft setbacks. SB 9 prohibited in historic districts. Downtown Specific Plan covers Mission St & Fair Oaks Ave corridors.' },
    { name: 'Arcadia', lat: 34.1397, lon: -118.0353, radius: 2.5, note: 'Arcadia zoning code applies — own development standards and review process.' },
    { name: 'Monrovia', lat: 34.1442, lon: -117.9990, radius: 2.0, note: 'Monrovia zoning code applies — Old Town specific plan, own entitlement process.' },
    { name: 'Alhambra', lat: 34.0953, lon: -118.1270, radius: 2.0, note: 'Alhambra zoning code applies — own specific plans and development standards.' },
    { name: 'San Gabriel', lat: 34.0961, lon: -118.1058, radius: 1.5, note: 'San Gabriel zoning code applies — Mission District overlay, own development standards.' },
    { name: 'Whittier', lat: 33.9792, lon: -118.0328, radius: 3.0, note: 'Whittier zoning code applies — Uptown specific plan, own development standards.' },
    { name: 'Downey', lat: 33.9401, lon: -118.1332, radius: 2.5, note: 'Downey zoning code applies — own specific plans and development review.' },
    { name: 'El Monte', lat: 34.0686, lon: -118.0276, radius: 2.5, note: 'El Monte zoning code applies — own development standards and review process.' },
    { name: 'Covina', lat: 34.0900, lon: -117.8903, radius: 2.5, note: 'Covina zoning code applies — own downtown specific plan and development standards.' },
    { name: 'West Covina', lat: 34.0686, lon: -117.9390, radius: 3.0, note: 'West Covina zoning code applies — own development standards and review process.' },
    { name: 'Diamond Bar', lat: 34.0286, lon: -117.8103, radius: 3.0, note: 'Diamond Bar zoning code applies — hillside management, own development standards.' },
    { name: 'Claremont', lat: 34.0967, lon: -117.7198, radius: 2.5, note: 'Claremont zoning code applies — Village specific plan, own development standards.' },
    { name: 'Azusa', lat: 34.1336, lon: -117.9076, radius: 2.0, note: 'Azusa zoning code applies — TOD district near Gold Line, own development standards.' },
    { name: 'Compton', lat: 33.8958, lon: -118.2201, radius: 2.5, note: 'Compton zoning code applies — own development standards and review process.' },
    { name: 'Lakewood', lat: 33.8536, lon: -118.1340, radius: 2.5, note: 'Lakewood zoning code applies — own development standards and review process.' },
    { name: 'Norwalk', lat: 33.9022, lon: -118.0817, radius: 2.5, note: 'Norwalk zoning code applies — own specific plans and development standards.' },
    { name: 'Cerritos', lat: 33.8583, lon: -118.0647, radius: 2.0, note: 'Cerritos zoning code applies — own development standards and review process.' },
    { name: 'Hermosa Beach', lat: 33.8622, lon: -118.3995, radius: 1.0, note: 'Hermosa Beach zoning code applies — Coastal Zone, own height/density standards.' },
    { name: 'Manhattan Beach', lat: 33.8847, lon: -118.4109, radius: 1.5, note: 'Manhattan Beach zoning code applies — Coastal Zone, strict R-1 protections.' },
];
LA_CITY_CENTER = { lat: 34.0522, lon: -118.2437 };
LA_CITY_APPROX_RADIUS = 15; // miles — rough bounding for City of LA

function detectJurisdiction(lat, lon, addressDetails) {
    // Check Nominatim city field first (most accurate)
    if (addressDetails) {
        const city = (addressDetails.city || addressDetails.town || addressDetails.municipality || '').toLowerCase().trim();
        if (city) {
            // First pass: exact match (prevents "South Pasadena" matching "Pasadena")
            for (const j of JURISDICTIONS) {
                if (city === j.name.toLowerCase()) {
                    return { jurisdiction: j.name, isLA: false, note: j.note };
                }
            }
            // Second pass: substring match (fallback for variations like "City of ...")
            for (const j of JURISDICTIONS) {
                if (city.includes(j.name.toLowerCase())) {
                    return { jurisdiction: j.name, isLA: false, note: j.note };
                }
            }
            if (city.includes('los angeles')) {
                return { jurisdiction: 'City of Los Angeles', isLA: true, note: 'City of LA zoning (LAMC) applies. ZIMAS is the authoritative zoning source.' };
            }
        }
        // Check for unincorporated
        const county = (addressDetails.county || '').toLowerCase();
        if (county.includes('los angeles') && !city) {
            return { jurisdiction: 'Unincorporated LA County', isLA: false, note: 'Unincorporated LA County — County zoning code applies, not City of LA. Different entitlement process through County DRP.' };
        }
    }
    // Fall back to centroid distance matching
    for (const j of JURISDICTIONS) {
        const d = haversine(lat, lon, j.lat, j.lon);
        if (d < j.radius) {
            return { jurisdiction: j.name, isLA: false, note: j.note };
        }
    }
    // Default: if within LA metro area, assume City of LA
    const dLA = haversine(lat, lon, LA_CITY_CENTER.lat, LA_CITY_CENTER.lon);
    if (dLA < LA_CITY_APPROX_RADIUS) {
        return { jurisdiction: 'City of Los Angeles', isLA: true, note: 'City of LA zoning (LAMC) applies. ZIMAS is the authoritative zoning source.' };
    }
    return { jurisdiction: 'Unincorporated LA County', isLA: false, note: 'Unincorporated LA County — County zoning code applies, not City of LA. Different entitlement process through County DRP.' };
}

// Jurisdiction-specific development standards — override LA City defaults
JURISDICTION_STANDARDS = {
    'South Pasadena': {
        zoneMap: { 'R1': 'RS', 'R2': 'RM', 'R3': 'RM', 'R4': 'RH', 'R5': 'RH' },
        zones: {
            RS: { maxHeight: 45, maxFAR: 0.50, maxDensity: 5, minLot: 10000, parking: { sfr: 2, duplex: 2.5 },
                   setbacks: { front: 10, side: 4, rear: 15 }, maxCoverage: 0.50, label: 'RS (Residential Single-Family)' },
            RE: { maxHeight: 35, maxFAR: 0.35, maxDensity: 3, minLot: 12500, parking: { sfr: 2 },
                   setbacks: { front: 25, side: '10%', rear: 25 }, maxCoverage: 0.40, label: 'RE (Residential Estate)' },
            RM: { maxHeight: 45, maxFAR: 1.50, maxDensity: 30, minLot: 10000, parking: { studio: 0.5, '1br': 1, '2br': 1.5 },
                   setbacks: { front: 7.5, side: 4, rear: 15 }, openSpace: 200, label: 'RM (Residential Medium Density)' },
            RH: { maxHeight: 45, maxFAR: 2.50, maxDensity: 45, minLot: 10000, parking: { studio: 0.5, '1br': 1, '2br': 1.5 },
                   setbacks: { front: 7.5, side: 4, rear: 15 }, openSpace: 200, label: 'RH (Residential High Density)' },
        },
        adu: { maxSize: 1200, attachedMax: '50% of primary or 1200 SF', maxHeight: 16, setbacks: 4, parking: 1, parkingWaiver: 'Within 0.5 mi of transit or in historic district', permitDays: 60 },
        sb9: { eligible: true, maxUnitSize: 850, maxTotal: 1700, minLotForSplit: 1200, parking: 1, prohibited: 'Historic districts, State Historic Resources Inventory, designated landmarks, slopes >15%' },
        historic: { districts: 11, landmarks: 50, millsAct: true, chc: 'Cultural Heritage Commission', sb9Prohibited: true },
        dtsp: { name: 'Downtown Specific Plan (2023, amended 2025)', corridors: 'Mission St & Fair Oaks Ave', muc70: { density: '20-70 du/acre', height: 55 }, muc50: { density: '20-50 du/acre', height: 50 } },
        fees: { school: 4.79, schoolThreshold: 500 },
        farOverrides: { sfr: 0.50, duplex: 0.55, multifamily_low: 1.50, multifamily_mid: 2.50, multifamily_high: 2.50, mixeduse: 2.50, adu: 0.50, senior: 2.50 },
        parkingOverrides: { sfr: 2, duplex: 2.5, multifamily_low: 1.25, multifamily_mid: 1.25, multifamily_high: 1.25, mixeduse: 1.25, senior: 0.75, adu: 1 },
    },
};

function getJurisdictionFAR(useId, jurisdiction) {
    if (!jurisdiction || jurisdiction.isLA) return null;
    const std = JURISDICTION_STANDARDS[jurisdiction.jurisdiction];
    return (std && std.farOverrides) ? (std.farOverrides[useId] || null) : null;
}

function getJurisdictionParking(useId, jurisdiction) {
    if (!jurisdiction || jurisdiction.isLA) return null;
    const std = JURISDICTION_STANDARDS[jurisdiction.jurisdiction];
    return (std && std.parkingOverrides) ? (std.parkingOverrides[useId] || null) : null;
}

function getJurisdictionSummary(jurisdiction, zoning) {
    if (!jurisdiction || jurisdiction.isLA) return null;
    const std = JURISDICTION_STANDARDS[jurisdiction.jurisdiction];
    if (!std) return null;
    const localZone = std.zoneMap && std.zoneMap[zoning] ? std.zoneMap[zoning] : null;
    const zoneData = localZone && std.zones[localZone] ? std.zones[localZone] : null;
    return { standards: std, localZone, zoneData };
}


// === ZONING QUERIES ===

// Estimate zoning when ZIMAS is blocked (fallback heuristic)
function estimateZoningFallback(addressString, addressDetails, neighborhood) {
    const lower = (addressString || '').toLowerCase();
    const road = (addressDetails && addressDetails.road) ? addressDetails.road.toLowerCase() : '';

    // Check if on a major commercial corridor
    const commercialCorridors = [
        'wilshire', 'sunset blvd', 'santa monica blvd', 'hollywood blvd', 'venice blvd',
        'olympic', 'pico blvd', 'beverly blvd', 'melrose ave', '3rd st', 'la brea',
        'la cienega', 'fairfax ave', 'robertson', 'highland ave', 'western ave',
        'vermont ave', 'figueroa', 'broadway', 'spring st', 'main st',
        'ventura blvd', 'lankershim', 'sepulveda blvd', 'van nuys blvd',
        'colorado blvd', 'brand blvd', 'glendale ave',
        'crenshaw', 'slauson', 'florence', 'manchester', 'century blvd',
        'imperial', 'rosecrans', 'compton', 'atlantic blvd', 'whittier blvd',
        'cesar chavez', 'temple st', 'alvarado', 'hoover', 'normandie',
        'adams blvd', 'jefferson blvd', 'exposition blvd', 'martin luther king',
    ];
    const isCommercialCorridor = commercialCorridors.some(c => road.includes(c) || lower.includes(c));

    // Industrial areas
    const industrialAreas = ['arts district', 'vernon', 'commerce', 'boyle heights industrial'];
    const isIndustrial = industrialAreas.some(a => lower.includes(a));

    // DTLA is mostly commercial/mixed
    if (neighborhood === 'dtla') return isIndustrial ? 'M1' : 'C2';

    // Commercial corridors
    if (isCommercialCorridor) return 'C2';

    // Check for apartment-style addresses (Nominatim type)
    if (addressDetails && addressDetails.type === 'apartments') return 'R3';

    // Residential streets — check street suffix patterns
    const residentialSuffixes = /\b(ave|avenue|st|street|dr|drive|pl|place|way|ln|lane|ct|court|rd|road|blvd|ter|terrace|cir|circle)\b/i;
    const isResidential = residentialSuffixes.test(road) && !isCommercialCorridor;

    // Residential neighborhoods default to R1
    const residentialHoods = ['beverly', 'westside', 'santamonica', 'valleyeast', 'valleywest',
        'silverlake', 'highland', 'venice', 'culver', 'southbay', 'harbor'];
    if (residentialHoods.includes(neighborhood) && isResidential) return 'R1';

    // Dense residential neighborhoods
    const denseHoods = ['koreatown', 'hollywood', 'midcity', 'exposition'];
    if (denseHoods.includes(neighborhood) && isResidential) return 'R3';

    // South LA residential
    if (['southla', 'boyleheights'].includes(neighborhood) && isResidential) return 'R1';

    // Default: R1 for residential streets, C2 for commercial
    if (isResidential) return 'R1';
    return null; // Can't determine — let user select
}

// Map ZIMAS zoning code to our dropdown values
function mapZoningCode(rawZone) {
    if (!rawZone) return null;
    // ZIMAS returns codes like "C2-1VL", "[Q]R3-1XL", "M1-1", "R1-1-HCR" etc.
    // Strip Q conditions, D limitations, and supplemental use districts
    let z = rawZone.toUpperCase().replace(/\[.*?\]/g, '').trim();
    // Extract the base zone (letters + optional digits before the dash-height suffix)
    const match = z.match(/^(R[1-5]|C[1-5]|C1\.5|CM|M[1-3]|PF|OS|LAX)/);
    if (match) return match[1];
    // TOD areas are usually identified via overlay, not base zone
    return null;
}

// Query zoning — routes to city-specific GIS or ZIMAS for LA City
async function fetchZoning(lat, lon, cityName) {
    const city = (cityName || '').toLowerCase().trim();
    const cityGIS = CITY_ZONING_GIS[city];

    if (cityGIS) {
        // Use city-specific ArcGIS endpoint
        try {
            const fields = [cityGIS.field];
            if (cityGIS.descField) fields.push(cityGIS.descField);
            const url = `${cityGIS.url}?where=1%3D1&geometry=${lon},${lat}` +
                `&geometryType=esriGeometryPoint&inSR=4326` +
                `&spatialRel=esriSpatialRelIntersects&outFields=${fields.join(',')}&returnGeometry=false` +
                `&distance=30&units=esriSRUnit_Meter&f=json`;
            const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
            if (!resp.ok) throw new Error(city + ' GIS unavailable');
            const data = await resp.json();
            if (data.features && data.features.length > 0) {
                const attrs = data.features[0].attributes;
                const raw = attrs[cityGIS.field] || Object.values(attrs).find(v => typeof v === 'string' && v.length > 0) || '';
                const desc = cityGIS.descField ? (attrs[cityGIS.descField] || '') : '';
                return { raw: raw, mapped: mapZoningCode(raw), city: city, description: desc };
            }
            return null;
        } catch (e) {
            console.warn(city + ' zoning query failed:', e);
            return { error: 'cors' };
        }
    }

    // Default: ZIMAS (City of Los Angeles)
    try {
        const url = `https://zimas.lacity.org/arcgis/rest/services/zma/zoning/MapServer/1102/query?` +
            `geometry=${lon},${lat}&geometryType=esriGeometryPoint&inSR=4326` +
            `&spatialRel=esriSpatialRelIntersects&outFields=ZONE_CMPLT&returnGeometry=false` +
            `&distance=30&units=esriSRUnit_Meter&f=json`;
        const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!resp.ok) throw new Error('ZIMAS unavailable');
        const data = await resp.json();
        if (data.features && data.features.length > 0) {
            const raw = data.features[0].attributes.ZONE_CMPLT || data.features[0].attributes.zone_cmplt;
            return { raw, mapped: mapZoningCode(raw) };
        }
        // ZIMAS returned nothing — try unincorporated LA County zoning (Regional Planning)
        return await fetchUnincorporatedZoning(lat, lon);
    } catch (e) {
        console.warn('ZIMAS zoning query failed (may be CORS):', e);
        // Still try unincorporated county zoning as fallback
        try { return await fetchUnincorporatedZoning(lat, lon); } catch { return { error: 'cors' }; }
    }
}

// Query unincorporated LA County zoning (Regional Planning Z-NET)
async function fetchUnincorporatedZoning(lat, lon) {
    try {
        const url = `https://arcgis.gis.lacounty.gov/arcgis/rest/services/DRP/ZNET_Public/MapServer/4/query?` +
            `where=1%3D1&geometry=${lon},${lat}&geometryType=esriGeometryPoint&inSR=4326` +
            `&spatialRel=esriSpatialRelIntersects&outFields=ZONE,Z_DESC,Z_CATEGORY,PLNG_AREA&returnGeometry=false&f=json`;
        const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!resp.ok) return null;
        const data = await resp.json();
        if (data.features && data.features.length > 0) {
            const attrs = data.features[0].attributes;
            const raw = attrs.ZONE || '';
            return { raw: raw, mapped: mapZoningCode(raw), city: 'unincorporated', description: attrs.Z_DESC || '', planningArea: attrs.PLNG_AREA || '' };
        }
        return null;
    } catch { return null; }
}

// Query LA County parcel layer for lot size
// computePolygonArea() — defined in shared.js
// estimateFrontage() — defined in shared.js
async function fetchParcelInfo(lat, lon, addressInfo) {
    try {
        // Use 50m buffer because Nominatim geocodes to road centerline, not parcel centroid
        const url = `https://public.gis.lacounty.gov/public/rest/services/LACounty_Cache/LACounty_Parcel/MapServer/0/query?` +
            `geometry=${lon},${lat}&geometryType=esriGeometryPoint&inSR=4326&outSR=4326` +
            `&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=true` +
            `&distance=50&units=esriSRUnit_Meter&f=json`;
        const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!resp.ok) throw new Error('Parcel service unavailable');
        const data = await resp.json();
        if (data.features && data.features.length > 0) {
            // PRIORITY 1: Match by house number in SitusFullAddress
            // This is far more reliable than proximity to geocode point
            let bestFeature = null;
            const inputHouseNum = (addressInfo && addressInfo.house_number) ? String(addressInfo.house_number).trim() : '';
            const inputStreet = (addressInfo && addressInfo.road) ? addressInfo.road.replace(/\b(Avenue|Street|Boulevard|Drive|Place|Court|Lane|Way|Road|Circle|Terrace)\b/gi, '').trim().toLowerCase() : '';

            if (inputHouseNum && data.features.length > 1) {
                // Try exact house number match first
                for (let fi = 0; fi < data.features.length; fi++) {
                    const situs = String(data.features[fi].attributes.SitusFullAddress || '').trim();
                    if (!situs) continue;
                    const situsNum = situs.match(/^(\d+)/);
                    if (situsNum && situsNum[1] === inputHouseNum) {
                        bestFeature = data.features[fi];
                        break;
                    }
                }
                // Try nearby house numbers (e.g. 7951 matches 7949 — same property, dual address)
                if (!bestFeature) {
                    const targetNum = parseInt(inputHouseNum);
                    let closestNumDiff = Infinity;
                    for (let fi = 0; fi < data.features.length; fi++) {
                        const situs = String(data.features[fi].attributes.SitusFullAddress || '').trim();
                        if (!situs) continue;
                        const situsNum = situs.match(/^(\d+)/);
                        if (situsNum) {
                            const diff = Math.abs(parseInt(situsNum[1]) - targetNum);
                            // Within 4 house numbers and same street
                            const situsStreet = situs.replace(/^\d+\s*/, '').replace(/\b(AVE|ST|BLVD|DR|PL|CT|LN|WAY|RD|CIR|TER)\b/gi, '').trim().toLowerCase();
                            if (diff <= 4 && diff < closestNumDiff && (inputStreet === '' || situsStreet.includes(inputStreet) || inputStreet.includes(situsStreet))) {
                                closestNumDiff = diff;
                                bestFeature = data.features[fi];
                            }
                        }
                    }
                }
            }

            // PRIORITY 2: Fall back to closest by distance
            if (!bestFeature) {
                bestFeature = data.features[0];
                if (data.features.length > 1) {
                    let bestDist = Infinity;
                    for (let fi = 0; fi < data.features.length; fi++) {
                        const fa = data.features[fi].attributes;
                        const clat = parseFloat(fa.CENTER_LAT) || 0;
                        const clon = parseFloat(fa.CENTER_LON) || 0;
                        if (clat && clon) {
                            const d = Math.pow(clat - lat, 2) + Math.pow(clon - lon, 2);
                            if (d < bestDist) { bestDist = d; bestFeature = data.features[fi]; }
                        }
                    }
                }
            }
            const attrs = bestFeature.attributes;
            // Try different field names for area
            let area = attrs['Shape.STArea()'] || attrs['Shape__Area'] || attrs['ShapeSTArea'] || attrs['SHAPE.STArea()'] || null;
            // If geometry is returned, try to compute from rings
            if (!area && bestFeature.geometry && bestFeature.geometry.rings) {
                area = computePolygonArea(bestFeature.geometry.rings, data.spatialReference);
            }
            // Store geometry + spatial reference for massing satellite overlay
            var _geometry = null;
            if (bestFeature.geometry && bestFeature.geometry.rings) {
                _geometry = { rings: bestFeature.geometry.rings, spatialReference: data.spatialReference };
            }
            return { area, attrs, _geometry };
        }
        return null;
    } catch (e) {
        console.warn('Parcel query failed (may be CORS):', e);
        return { error: e.name === 'TimeoutError' ? 'timeout' : 'cors' };
    }
}


// === GEOCODING ===

// Geocode via OpenStreetMap Nominatim (CORS-friendly)
async function geocodeAddress(address) {
    // Append county/state hint only if no city/state info is already present
    let query = address;
    const isZipCode = /^\d{5}$/.test(query.trim());

    // For bare zip codes, use Nominatim structured postal code search for accuracy
    if (isZipCode) {
        const zip = query.trim();
        // Use structured search with postalcode param — much more reliable than free-form q=
        const url = `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=us&state=California&format=json&addressdetails=1&limit=3`;
        const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!resp.ok) throw new Error('Geocoding service unavailable');
        const data = await resp.json();
        if (!data || data.length === 0) {
            // Fallback: try free-form query if structured search fails
            const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(zip + ', California, USA')}&format=json&addressdetails=1&limit=1&countrycodes=us`;
            const fallbackResp = await fetch(fallbackUrl, { headers: { 'Accept': 'application/json' } });
            const fallbackData = fallbackResp.ok ? await fallbackResp.json() : [];
            if (!fallbackData || fallbackData.length === 0) throw new Error('Zip code not found. Try a different zip code.');
            data.push(...fallbackData);
        }
        // Prefer the zip polygon relation (polygon label point is the true centroid).
        // Fall back to any postcode-typed result, then the first result.
        let m = data.find(r => r.osm_type === 'relation' && (r.class === 'boundary' || r.type === 'postal_code' || r.type === 'postcode'))
             || data.find(r => r.type === 'postcode' || r.type === 'postal_code')
             || data[0];
        const a = m.address || {};
        // Use Nominatim's lat/lon directly — for relations this is the polygon label point
        // (pole of inaccessibility), far more accurate than the arithmetic center of a bbox
        // around an irregular zip polygon.
        const lat = parseFloat(m.lat), lon = parseFloat(m.lon);
        const city = a.city || a.town || a.municipality || a.village || '';
        return {
            lat, lon,
            matched: m.display_name,
            cleanAddress: [city, 'CA', zip].filter(Boolean).join(', '),
            address: a,
            osmClass: m.class || '',
            osmType: m.type || '',
            isZipCode: true,
            boundingbox: m.boundingbox || null,
        };
    }

    // Check if address already contains a recognizable LA County city or state abbreviation
    const hasCity = /,\s*\w/.test(query) || /\b(CA|California)\b/i.test(query) ||
        /\b(Los Angeles|Glendale|Burbank|Pasadena|Long Beach|Santa Monica|Beverly Hills|Culver City|Inglewood|Torrance|Pomona|West Hollywood|Alhambra|Arcadia|Azusa|Baldwin Park|Bell|Bellflower|Cerritos|Claremont|Compton|Covina|Downey|Duarte|El Monte|El Segundo|Gardena|Glendora|Hawthorne|Hermosa Beach|Huntington Park|La Mirada|La Verne|Lakewood|Lancaster|Lawndale|Lomita|Lynwood|Malibu|Manhattan Beach|Maywood|Monrovia|Montebello|Monterey Park|Norwalk|Palmdale|Palos Verdes|Paramount|Pico Rivera|Rancho Palos Verdes|Redondo Beach|Rosemead|San Dimas|San Fernando|San Gabriel|San Marino|Santa Clarita|Sierra Madre|Signal Hill|South El Monte|South Gate|South Pasadena|Temple City|Walnut|West Covina|Whittier)\b/i.test(query);
    if (!hasCity) {
        query += ', Los Angeles County, CA';
    } else if (!/\b(CA|California)\b/i.test(query)) {
        query += ', CA';
    }
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1&countrycodes=us`;
    const resp = await fetch(url, {
        headers: { 'Accept': 'application/json' }
    });
    if (!resp.ok) throw new Error('Geocoding service unavailable');
    const data = await resp.json();
    if (!data || data.length === 0) throw new Error('Address not found. Try including city and zip code.');
    const m = data[0];
    const a = m.address || {};
    // Build clean street address from components: "7951 Blackburn Avenue, Los Angeles, CA 90048"
    const streetParts = [a.house_number, a.road].filter(Boolean).join(' ');
    const city = a.city || a.town || a.municipality || a.village || '';
    const state = a.state ? a.state.replace(/^California$/, 'CA') : '';
    const cleanAddr = [streetParts, city, [state, a.postcode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
    return {
        lat: parseFloat(m.lat),
        lon: parseFloat(m.lon),
        matched: m.display_name,
        cleanAddress: cleanAddr || m.display_name,
        address: a,
        osmClass: m.class || '',
        osmType: m.type || '',
    };
}
