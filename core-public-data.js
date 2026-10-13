(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.LandToYieldPublicData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const COUNTY_PARCEL_URL = 'https://public.gis.lacounty.gov/public/rest/services/LACounty_Cache/LACounty_Parcel/MapServer/0/query';
    const COUNTY_SOURCE = {
        name: 'LA County Assessor Parcel Map Service',
        url: 'https://data.lacounty.gov/documents/4d67b154ae614d219c58535659128e71',
        authority: 'Los Angeles County Office of the Assessor'
    };

    function normalizedPropertyType(useType, useDescription) {
        const text = `${useType || ''} ${useDescription || ''}`.toUpperCase();
        if (/VACANT/.test(text)) return 'VACANT';
        if (/SINGLE/.test(text)) return 'SFR';
        if (/CONDO/.test(text)) return 'CONDO';
        if (/MOBILE/.test(text)) return 'MOBILE';
        if (/APART|MULTI|DUPLEX|TRIPLEX|FOURPLEX/.test(text)) return 'MULTI';
        if (/RETAIL/.test(text)) return 'RETAIL';
        if (/OFFICE/.test(text)) return 'OFFICE';
        if (/INDUSTR/.test(text)) return 'INDUSTRIAL';
        if (/COMMERCIAL/.test(text)) return 'COMMERCIAL';
        return (useDescription || useType || 'UNKNOWN').toUpperCase();
    }

    function number(value) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function mapCountyParcel(feature) {
        const a = (feature && feature.attributes) || {};
        const land = number(a.Roll_LandValue);
        const improvements = number(a.Roll_ImpValue);
        const propertyType = normalizedPropertyType(a.UseType, a.UseDescription);
        const lotSqft = Math.round(number(a['Shape.STArea()']));
        return {
            prop: {
                identifier: { apn: a.APN || '', ain: a.AIN || '' },
                address: {
                    line1: a.SitusAddress || '',
                    locality: a.SitusCity || '',
                    countrySubd: 'CA',
                    postal1: String(a.SitusZIP || '').slice(0, 5)
                },
                summary: {
                    proptype: propertyType,
                    propclass: a.UseType || '',
                    propsubtype: a.UseDescription || ''
                },
                lot: { lotsize2: lotSqft },
                building: {
                    summary: { yearbuilt: a.YearBuilt1 || '' },
                    size: { universalsize: number(a.SQFTmain1) },
                    units: number(a.Units1)
                },
                location: {
                    latitude: number(a.CENTER_LAT),
                    longitude: number(a.CENTER_LON)
                }
            },
            assessment: {
                property: [{ assessment: {
                    assessed: {
                        assdlandvalue: land,
                        assdimprvalue: improvements,
                        assdttlvalue: land + improvements
                    },
                    tax: {},
                    rollYear: a.Roll_Year || ''
                }}]
            },
            avm: null,
            source: COUNTY_SOURCE
        };
    }

    const CITY_SOURCE = {
        name: 'City of Los Angeles ZIMAS Landbase and Zoning',
        url: 'https://zimas.lacity.org/',
        authority: 'City of Los Angeles'
    };

    function formatApn(value) {
        const digits = String(value || '').replace(/\D/g, '');
        return digits.length === 10 ? `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}` : String(value || '');
    }

    function geometryCenter(geometry) {
        const points = ((geometry && geometry.rings) || []).flat();
        if (!points.length) return { latitude: 0, longitude: 0 };
        const xs = points.map(point => number(point[0]));
        const ys = points.map(point => number(point[1]));
        return {
            latitude: (Math.min(...ys) + Math.max(...ys)) / 2,
            longitude: (Math.min(...xs) + Math.max(...xs)) / 2
        };
    }

    function pointInRing(point, ring) {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const xi = ring[i][0], yi = ring[i][1];
            const xj = ring[j][0], yj = ring[j][1];
            const crosses = ((yi > point[1]) !== (yj > point[1])) &&
                (point[0] < (xj - xi) * (point[1] - yi) / ((yj - yi) || Number.EPSILON) + xi);
            if (crosses) inside = !inside;
        }
        return inside;
    }

    function pointInGeometry(point, geometry) {
        return ((geometry && geometry.rings) || []).some(ring => pointInRing(point, ring));
    }

    function zoningPropertyType(rawZone) {
        const zone = String(rawZone || '').toUpperCase();
        if (/(^|[^A-Z0-9])(R1|RS|RE|RA|RU|RZ)([^A-Z0-9]|$)/.test(zone)) return 'SFR';
        if (/(^|[^A-Z0-9])(R2|RD|RMP|RW|R3|R4|R5)([^A-Z0-9]|$)/.test(zone)) return 'MULTI';
        if (/(^|[^A-Z0-9])(C1|C2|C4|C5|CM|CR|CW)([^A-Z0-9]|$)/.test(zone)) return 'COMMERCIAL';
        if (/(^|[^A-Z0-9])(M1|M2|M3|MR)([^A-Z0-9]|$)/.test(zone)) return 'INDUSTRIAL';
        return 'UNKNOWN';
    }

    function mapCityParcel(feature, zones) {
        const a = (feature && feature.attributes) || {};
        const center = geometryCenter(feature && feature.geometry);
        const point = [center.longitude, center.latitude];
        const zoneFeature = (zones || []).find(zone => pointInGeometry(point, zone.geometry));
        const za = (zoneFeature && zoneFeature.attributes) || {};
        const rawZone = za.ZONE_CMPLT || za.ZONELEGEND || za.ZONE_CODE || '';
        const apn = formatApn(a.BPP);
        return {
            prop: {
                identifier: { apn, ain: String(a.BPP || '') },
                address: { line1: apn ? `APN ${apn}` : 'City parcel', locality: 'LOS ANGELES', countrySubd: 'CA', postal1: '' },
                summary: { proptype: zoningPropertyType(rawZone), propclass: 'City zoning', propsubtype: rawZone },
                lot: { lotsize2: Math.round(number(a.Shape_Area)) },
                building: { summary: {}, size: {}, units: 0 },
                location: center,
                geometry: feature && feature.geometry
            },
            assessment: null,
            avm: null,
            source: CITY_SOURCE
        };
    }

    const CENSUS_ZCTA_URL = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer/2/query';
    const CITY_PARCELS_URL = 'https://zimas.lacity.org/arcgis/rest/services/zma/zimas/MapServer/105/query';
    const CITY_ZONING_URLS = [
        'https://zimas.lacity.org/arcgis/rest/services/zma/zoning/MapServer/1101/query',
        'https://zimas.lacity.org/arcgis/rest/services/zma/zoning/MapServer/1102/query'
    ];

    function arcGisUrl(base, params) {
        return `${base}?${new URLSearchParams({ f: 'json', ...params })}`;
    }

    async function fetchArcGisPages(base, params, options) {
        const opts = options || {};
        const pageSize = Math.min(2000, Math.max(1, Number(opts.pageSize) || 2000));
        const fetchImpl = opts.fetchImpl;
        const features = [];
        for (let offset = 0; ; offset += pageSize) {
            // ZIP polygons are too long for a GET query string, so page through with a form POST.
            const body = new URLSearchParams({
                f: 'json',
                ...params,
                resultOffset: String(offset),
                resultRecordCount: String(pageSize)
            });
            const payload = await fetchJson(base, fetchImpl, {
                method: 'POST',
                headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString()
            });
            const page = payload.features || [];
            features.push(...page);
            if (typeof opts.onPage === 'function') opts.onPage(features.length);
            if (page.length < pageSize) break;
        }
        return features;
    }

    async function fetchPublicParcelsByZip(zip, options) {
        const cleanZip = String(zip || '').trim();
        if (!/^\d{5}$/.test(cleanZip)) throw new Error('A valid 5-digit ZIP code is required');
        const opts = options || {};
        const fetchImpl = opts.fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
        if (!fetchImpl) throw new Error('Fetch is unavailable');
        const onProgress = typeof opts.onProgress === 'function' ? opts.onProgress : function () {};

        onProgress({ stage: 'zip', loaded: 0, total: 0 });
        const zipPayload = await fetchJson(arcGisUrl(CENSUS_ZCTA_URL, {
            where: `ZCTA5='${cleanZip}'`,
            outFields: 'ZCTA5',
            returnGeometry: 'true',
            outSR: '4326',
            geometryPrecision: '5'
        }), fetchImpl);
        const zipFeature = (zipPayload.features || [])[0];
        if (!zipFeature || !zipFeature.geometry) throw new Error(`No Census ZIP boundary found for ${cleanZip}`);
        const geometry = JSON.stringify({ ...zipFeature.geometry, spatialReference: { wkid: 4326 } });
        const spatial = {
            where: '1=1',
            geometry,
            geometryType: 'esriGeometryPolygon',
            inSR: '4326',
            spatialRel: 'esriSpatialRelIntersects',
            returnGeometry: 'true',
            outSR: '4326',
            geometryPrecision: '6'
        };

        const parcels = await fetchArcGisPages(CITY_PARCELS_URL, {
            ...spatial,
            outFields: 'BPP,PIN,PIND,Shape_Area',
            orderByFields: 'BPP'
        }, {
            fetchImpl,
            pageSize: opts.pageSize,
            onPage: loaded => onProgress({ stage: 'parcels', loaded, total: null })
        });

        const zoningPages = await Promise.all(CITY_ZONING_URLS.map(url => fetchArcGisPages(url, {
            ...spatial,
            outFields: 'ZONE_CMPLT,ZONE_CLASS,ZONE_CODE,ZONELEGEND'
        }, { fetchImpl, pageSize: opts.pageSize })));
        const zones = zoningPages.flat();
        onProgress({ stage: 'zoning', loaded: zones.length, total: zones.length });

        const records = parcels.map(parcel => mapCityParcel(parcel, zones))
            .filter(record => record.prop.identifier.apn.trim());

        // Join the County Assessor roll on APN for address, current use, building facts and assessed value.
        // The City landbase stays the source for geometry, lot area and zoning.
        try {
            onProgress({ stage: 'assessor', loaded: 0, total: null });
            const county = await fetchCountyParcelsByZip(cleanZip, { fetchImpl });
            const byApn = new Map(county.records.map(r => [r.prop.identifier.apn, r]));
            for (const record of records) {
                const match = byApn.get(record.prop.identifier.apn);
                if (!match) continue;
                record.prop.address = match.prop.address;
                record.prop.building = match.prop.building;
                record.prop.summary.propclass = match.prop.summary.propsubtype || match.prop.summary.propclass;
                record.prop.summary.existingUse = match.prop.summary.proptype;
                record.assessment = match.assessment;
                record.assessorSource = COUNTY_SOURCE;
            }
        } catch (error) {
            // Assessor enrichment is optional; zoning and lot data still stand on their own.
        }

        return {
            total: records.length,
            records,
            source: CITY_SOURCE,
            coverage: 'City of Los Angeles parcels intersecting the Census ZIP Code Tabulation Area',
            zip: cleanZip
        };
    }

    async function fetchJson(url, fetchImpl, init) {
        const response = await fetchImpl(url, init || { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`LA County parcel service ${response.status}`);
        const payload = await response.json();
        if (payload.error) throw new Error(payload.error.message || 'LA County parcel service query failed');
        return payload;
    }

    function countyQueryUrl(zip, extra) {
        const params = new URLSearchParams({
            where: `SitusZIP LIKE '${zip}%'`,
            f: 'json',
            ...extra
        });
        return `${COUNTY_PARCEL_URL}?${params}`;
    }

    async function fetchCountyParcelsByZip(zip, options) {
        const cleanZip = String(zip || '').trim();
        if (!/^\d{5}$/.test(cleanZip)) throw new Error('A valid 5-digit ZIP code is required');
        const opts = options || {};
        const fetchImpl = opts.fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
        if (!fetchImpl) throw new Error('Fetch is unavailable');
        const pageSize = Math.min(1000, Math.max(1, Number(opts.pageSize) || 1000));
        const onProgress = typeof opts.onProgress === 'function' ? opts.onProgress : function () {};

        const countPayload = await fetchJson(countyQueryUrl(cleanZip, {
            returnCountOnly: 'true'
        }), fetchImpl);
        const total = number(countPayload.count);
        const records = [];
        const outFields = [
            'AIN', 'APN', 'SitusAddress', 'SitusCity', 'SitusZIP',
            'UseType', 'UseDescription', 'YearBuilt1', 'Units1', 'SQFTmain1',
            'Roll_Year', 'Roll_LandValue', 'Roll_ImpValue',
            'CENTER_LAT', 'CENTER_LON', 'Shape.STArea()'
        ].join(',');

        for (let offset = 0; offset < total; offset += pageSize) {
            const payload = await fetchJson(countyQueryUrl(cleanZip, {
                outFields,
                returnGeometry: 'false',
                orderByFields: 'AIN',
                resultOffset: String(offset),
                resultRecordCount: String(pageSize)
            }), fetchImpl);
            for (const feature of payload.features || []) records.push(mapCountyParcel(feature));
            onProgress({ loaded: records.length, total });
            if (!(payload.features || []).length) break;
        }

        return { total, records, source: COUNTY_SOURCE };
    }

    return {
        COUNTY_PARCEL_URL,
        COUNTY_SOURCE,
        CITY_SOURCE,
        normalizedPropertyType,
        mapCountyParcel,
        mapCityParcel,
        fetchCountyParcelsByZip,
        fetchPublicParcelsByZip
    };
});
