/**
 * Land to Yield — Property AVM Proxy Worker
 * Deploy to Cloudflare Workers (free tier)
 *
 * Supports two AVM providers:
 *   1. ATTOM Data (primary) — professional-grade AVM with confidence scores
 *   2. RentCast (fallback)  — used if ATTOM returns no result
 *
 * Setup:
 * 1. npx wrangler init lty-avm-proxy
 * 2. Copy this file to src/index.js
 * 3. wrangler secret put ATTOM_API_KEY    (paste your ATTOM key)
 * 4. wrangler secret put RENTCAST_API_KEY (paste your RentCast key)
 * 5. wrangler deploy
 *
 * Routes:
 *   GET /?address=...                     — ATTOM AVM (primary), RentCast fallback
 *   GET /?address=...&provider=attom    — force ATTOM only
 *   GET /?address=...&provider=rentcast — force RentCast only
 *   POST /track                    — Log search event (address, portal, timestamp)
 *   GET /stats?key=<admin_key>     — View usage stats (requires ADMIN_KEY secret)
 *   GET /stats/recent?key=<admin_key> — View recent searches
 */

const ALLOWED_ORIGINS = [
  'https://landtoyield.com',
  'https://www.landtoyield.com',
  'https://clscre.github.io',
  'http://localhost',
  'http://127.0.0.1',
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.some(o => origin && origin.startsWith(o));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

// ── ATTOM AVM ──────────────────────────────────────────────────
async function fetchAttomAVM(address, apiKey) {
  // ATTOM requires address split into address1 (street) and address2 (city state zip)
  // Parse "123 Main St, Los Angeles, CA 90012" → address1="123 Main St" address2="Los Angeles, CA 90012"
  const parts = address.split(',').map(s => s.trim());
  let address1, address2;
  if (parts.length >= 3) {
    address1 = parts[0];
    address2 = parts.slice(1).join(', ');
  } else if (parts.length === 2) {
    address1 = parts[0];
    address2 = parts[1];
  } else {
    address1 = address;
    address2 = 'CA';
  }

  const url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/attomavm/detail?address1=${encodeURIComponent(address1)}&address2=${encodeURIComponent(address2)}`;
  const resp = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'APIKey': apiKey,
    },
  });

  if (!resp.ok) return null;
  const data = await resp.json();
  if (!data.property || data.property.length === 0) return null;

  const prop = data.property[0];
  const avm = prop.avm || {};
  const amt = avm.amount || {};
  const sale = prop.sale || {};
  const saleAmt = sale.amount || {};
  const assessment = prop.assessment || {};
  const assessed = assessment.assessed || {};
  const bldg = prop.building || {};
  const bldgSize = bldg.size || {};
  const rooms = bldg.rooms || {};
  const lot = prop.lot || {};

  return {
    price: amt.value || null,
    priceLow: amt.low || null,
    priceHigh: amt.high || null,
    confidence: amt.scr || null,          // ATTOM confidence score (0-100)
    fsd: amt.fsd || null,                 // Forecast standard deviation
    avmDate: avm.eventDate || null,
    priceSqFt: (amt.value && bldgSize.universalsize) ? Math.round(amt.value / bldgSize.universalsize) : null,
    sqFt: bldgSize.universalsize || bldgSize.livingsize || null,
    bedrooms: rooms.beds || null,
    bathrooms: rooms.bathstotal || null,
    yearBuilt: (prop.summary || {}).yearbuilt || null,
    lotSize: lot.lotsize2 || (lot.lotsize1 ? Math.round(lot.lotsize1 * 43560) : null),  // Convert acres to SF
    lotAcres: lot.lotsize1 || null,
    propertyType: (prop.summary || {}).propertyType || null,
    lastSaleDate: saleAmt.salerecdate || sale.salesearchdate || null,
    lastSalePrice: saleAmt.saleamt || null,
    assessedTotal: assessed.assdttlvalue || null,
    attomId: (prop.identifier || {}).attomId || null,
    apn: (prop.identifier || {}).apn || null,
    address: (prop.address || {}).oneLine || address,
    source: 'attom',
    timestamp: Date.now(),
  };
}

// ── RentCast AVM ───────────────────────────────────────────────
async function fetchRentCastAVM(address, apiKey) {
  const url = `https://api.rentcast.io/v1/avm/value?address=${encodeURIComponent(address)}`;
  const resp = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'X-Api-Key': apiKey,
    },
  });

  if (!resp.ok) return null;
  const data = await resp.json();
  if (!data.price) return null;

  return {
    price: data.price || null,
    priceLow: data.priceRangeLow || null,
    priceHigh: data.priceRangeHigh || null,
    confidence: null,
    priceSqFt: data.pricePerSquareFoot || null,
    sqFt: data.squareFootage || null,
    bedrooms: data.bedrooms || null,
    bathrooms: data.bathrooms || null,
    yearBuilt: data.yearBuilt || null,
    lotSize: data.lotSize || null,
    propertyType: data.propertyType || null,
    lastSaleDate: data.lastSaleDate || null,
    lastSalePrice: data.lastSalePrice || null,
    address: data.formattedAddress || address,
    source: 'rentcast',
    timestamp: Date.now(),
  };
}

// ── Main Handler ───────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // ── Analytics: POST /track ─────────────────────────────────
    if (request.method === 'POST' && path === '/track') {
      try {
        const body = await request.json();
        const event = {
          address: body.address || '',
          portal: body.portal || 'unknown',    // 'developer', 'agent', 'lender'
          city: body.city || '',
          zoning: body.zoning || '',
          timestamp: Date.now(),
          date: new Date().toISOString().slice(0, 10),
          ua: request.headers.get('User-Agent') || '',
        };
        if (env.AVM_CACHE) {
          // Store individual event (kept for 180 days)
          const eventKey = `evt:${event.date}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
          ctx.waitUntil(env.AVM_CACHE.put(eventKey, JSON.stringify(event), { expirationTtl: 15552000 }));

          // Increment daily counter
          const dayKey = `day:${event.date}`;
          const dayCount = parseInt(await env.AVM_CACHE.get(dayKey) || '0') + 1;
          ctx.waitUntil(env.AVM_CACHE.put(dayKey, String(dayCount), { expirationTtl: 15552000 }));

          // Increment portal counter
          const portalKey = `portal:${event.portal}:${event.date}`;
          const portalCount = parseInt(await env.AVM_CACHE.get(portalKey) || '0') + 1;
          ctx.waitUntil(env.AVM_CACHE.put(portalKey, String(portalCount), { expirationTtl: 15552000 }));

          // Track unique addresses searched
          const addrKey = `addr:${event.address.toLowerCase().trim()}`;
          ctx.waitUntil(env.AVM_CACHE.put(addrKey, JSON.stringify({ last: event.timestamp, count: 1, portal: event.portal }), { expirationTtl: 15552000 }));
        }
        return Response.json({ ok: true }, { headers: cors });
      } catch (err) {
        return Response.json({ error: 'Track error', detail: err.message }, { status: 400, headers: cors });
      }
    }

    // ── Analytics: GET /stats ──────────────────────────────────
    if (request.method === 'GET' && path.startsWith('/stats')) {
      const adminKey = url.searchParams.get('key');
      if (!env.ADMIN_KEY || adminKey !== env.ADMIN_KEY) {
        return Response.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
      }

      if (path === '/stats/recent' && env.AVM_CACHE) {
        // List recent events
        const list = await env.AVM_CACHE.list({ prefix: 'evt:', limit: 50 });
        const events = [];
        for (const key of list.keys) {
          const val = await env.AVM_CACHE.get(key.name, 'json');
          if (val) events.push(val);
        }
        events.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        return Response.json({ count: events.length, events }, { headers: { ...cors, 'Content-Type': 'application/json' } });
      }

      // Daily stats for last 30 days
      const stats = { daily: {}, portals: {} };
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        if (env.AVM_CACHE) {
          const dayCount = await env.AVM_CACHE.get(`day:${dateStr}`);
          if (dayCount) stats.daily[dateStr] = parseInt(dayCount);
          for (const p of ['developer', 'agent', 'lender']) {
            const pc = await env.AVM_CACHE.get(`portal:${p}:${dateStr}`);
            if (pc) {
              if (!stats.portals[p]) stats.portals[p] = {};
              stats.portals[p][dateStr] = parseInt(pc);
            }
          }
        }
      }
      const totalSearches = Object.values(stats.daily).reduce((a, b) => a + b, 0);
      return Response.json({ totalSearches, ...stats }, { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    if (request.method !== 'GET') {
      return Response.json({ error: 'Method not allowed' }, { status: 405, headers: cors });
    }

    const address = url.searchParams.get('address');
    const provider = url.searchParams.get('provider') || 'auto';  // auto, attom, rentcast

    if (!address) {
      return Response.json({ error: 'Missing address parameter' }, { status: 400, headers: cors });
    }

    // Check cache first. Key includes provider-priority version so swapping
    // providers invalidates the cache cleanly.
    const cacheKey = `avm2:${address.toLowerCase().trim()}`;
    if (env.AVM_CACHE) {
      const cached = await env.AVM_CACHE.get(cacheKey, 'json');
      if (cached) {
        return Response.json({ ...cached, _cached: true }, {
          headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' }
        });
      }
    }

    let result = null;

    try {
      // Priority 1: ATTOM (primary — professional-grade AVM with confidence scores)
      if (provider !== 'rentcast' && env.ATTOM_API_KEY) {
        result = await fetchAttomAVM(address, env.ATTOM_API_KEY);
      }

      // Priority 2: RentCast (fallback — used if ATTOM returns no result)
      if (!result && provider !== 'attom' && env.RENTCAST_API_KEY) {
        result = await fetchRentCastAVM(address, env.RENTCAST_API_KEY);
      }

      if (!result) {
        return Response.json({ error: 'No AVM data available for this address', address }, {
          status: 404, headers: cors
        });
      }

      // Cache for 90 days
      if (env.AVM_CACHE) {
        ctx.waitUntil(env.AVM_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 7776000 }));
      }

      return Response.json(result, {
        headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' }
      });

    } catch (err) {
      return Response.json({ error: 'Proxy error', detail: err.message }, {
        status: 500, headers: cors
      });
    }
  },
};
