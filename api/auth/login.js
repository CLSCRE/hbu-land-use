// Vercel Serverless Function — POST /api/auth/login
// Validates an LTY access token and sets a 30-day HttpOnly auth cookie.
//
// Environment variables (set in Vercel dashboard → Settings → Environment Variables):
//   LTY_TOKENS — comma-separated list of valid access tokens
//               Example: abc-123,xyz-789,broker-token-001
//
// After a customer pays via Stripe, generate a token (any unique string works)
// and append it to LTY_TOKENS, then redeploy. The customer uses that token
// as their "password" on the login page.

module.exports = function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = ((req.body && req.body.token) || '').trim();

  if (!token) {
    return res.status(400).json({ error: 'Access token is required' });
  }

  // Parse the comma-separated token list from environment
  const rawTokens = process.env.LTY_TOKENS || '';
  const validTokens = rawTokens
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  // Dev/staging: if no tokens are configured, allow all access
  if (validTokens.length === 0) {
    console.warn('[LTY Auth] LTY_TOKENS not set — allowing access in dev mode');
    setAuthCookie(res, token);
    return res.status(200).json({ ok: true, dev: true });
  }

  if (!validTokens.includes(token)) {
    return res.status(401).json({ error: 'Invalid access token' });
  }

  setAuthCookie(res, token);
  return res.status(200).json({ ok: true });
};

function setAuthCookie(res, token) {
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  res.setHeader(
    'Set-Cookie',
    `lty_auth=${encodeURIComponent(token)}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax; Secure`
  );
}
