/**
 * Land to Yield — RentCast AVM Proxy Worker
 * Deploy to Cloudflare Workers (free tier)
 *
 * Setup:
 * 1. npx wrangler init lty-avm-proxy
 * 2. Copy this file to src/index.js
 * 3. wrangler secret put RENTCAST_API_KEY   (paste your key)
 * 4. wrangler deploy
 *
 * Environment variable required:
 *   RENTCAST_API_KEY — your RentCast API key from https://app.rentcast.io/app/api
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

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'GET') {
      return Response.json({ error: 'Method not allowed' }, { status: 405, headers: cors });
    }

    const url = new URL(request.url);
    const address = url.searchParams.get('address');

    if (!address) {
      return Response.json({ error: 'Missing address parameter' }, { status: 400, headers: cors });
    }

    // Check Cloudflare KV cache first (if bound)
    const cacheKey = `avm:${address.toLowerCase().trim()}`;
    if (env.AVM_CACHE) {
      const cached = await env.AVM_CACHE.get(cacheKey, 'json');
      if (cached) {
        return Response.json({ ...cached, _cached: true }, {
          headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' }
        });
      }
    }

    // Call RentCast AVM API
    const apiKey = env.RENTCAST_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500, headers: cors });
    }

    try {
      const rcUrl = `https://api.rentcast.io/v1/avm/value?address=${encodeURIComponent(address)}`;
      const rcResp = await fetch(rcUrl, {
        headers: {
          'Accept': 'application/json',
          'X-Api-Key': apiKey,
        },
      });

      if (!rcResp.ok) {
        const errText = await rcResp.text();
        // Rate limit or quota exceeded
        if (rcResp.status === 429 || rcResp.status === 402) {
          return Response.json({ error: 'API quota exceeded', detail: errText }, {
            status: 429, headers: cors
          });
        }
        return Response.json({ error: 'RentCast API error', status: rcResp.status, detail: errText }, {
          status: 502, headers: cors
        });
      }

      const data = await rcResp.json();

      // Normalize response — extract what we need
      const result = {
        price: data.price || null,
        priceLow: data.priceRangeLow || null,
        priceHigh: data.priceRangeHigh || null,
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

      // Cache for 90 days in KV — values don't shift much in 3 months
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
