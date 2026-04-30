// Vercel Edge Middleware — runs before cache on every matched request.
// Protects app.html, lender.html, agent.html, and city.html behind token-based auth.
//
// Two token types accepted:
//   1. Permanent tokens   — listed in LTY_TOKENS env var (comma-separated)
//   2. Trial tokens       — self-validating: lty-trial-YYYYMMDD-[hmac16]
//                           HMAC verified with LTY_TRIAL_SECRET; expiry checked vs today
//
// Flow:
//   1. Request arrives for a protected page
//   2. Middleware reads the lty_auth cookie
//   3. Permanent token match → allow
//   4. Valid trial token (HMAC ok + not expired) → allow
//   5. Otherwise → redirect to /login.html?from=<original-path>
//
// Environment variables:
//   LTY_TOKENS       — comma-separated permanent tokens (set in Vercel dashboard)
//   LTY_TRIAL_SECRET — secret used to sign trial tokens (set in Vercel dashboard)
//   If LTY_TOKENS is empty, access is allowed (dev mode).

export const config = {
  matcher: ['/app.html', '/lender.html', '/agent.html', '/city.html'],
};

/**
 * Verify a trial token using HMAC-SHA256 via the Web Crypto API (edge-safe).
 * Token format: lty-trial-YYYYMMDD-[16 hex chars]
 * Returns true if signature is valid AND token has not expired.
 */
async function validateTrialToken(token) {
  const match = token.match(/^lty-trial-(\d{8})-([0-9a-f]{16})$/);
  if (!match) return false;

  const [, expiry, sig] = match;

  // Check expiry against today (UTC date as YYYYMMDD)
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  if (today > expiry) return false;  // expired

  const secret = process.env.LTY_TRIAL_SECRET || '';
  if (!secret) return false;  // trial system not configured

  // Verify HMAC-SHA256(secret, expiry) → compare first 16 hex chars
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBuffer = await crypto.subtle.sign(
    'HMAC',
    keyMaterial,
    new TextEncoder().encode(expiry)
  );

  const expected = Array.from(new Uint8Array(sigBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);

  return sig === expected;
}

export default async function middleware(request) {
  const rawTokens = process.env.LTY_TOKENS || '';
  const validTokens = rawTokens
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  // Dev mode: no permanent tokens configured → allow everything
  if (validTokens.length === 0) {
    return;
  }

  // Read the auth cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)lty_auth=([^;]+)/);
  const cookieToken = match ? decodeURIComponent(match[1]) : '';

  // 1. Permanent token check
  if (validTokens.includes(cookieToken)) {
    return;  // Authenticated — let the request through
  }

  // 2. Trial token check (self-validating, no database needed)
  if (cookieToken.startsWith('lty-trial-')) {
    if (await validateTrialToken(cookieToken)) {
      return;  // Valid trial — let the request through
    }
  }

  // Not authenticated — redirect to login with the original path as a return URL
  const url = new URL(request.url);
  const loginUrl = new URL('/login.html', request.url);
  loginUrl.searchParams.set('from', url.pathname);
  return Response.redirect(loginUrl.toString(), 302);
}
