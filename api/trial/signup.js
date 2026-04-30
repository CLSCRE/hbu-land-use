// /api/trial/signup.js
// Generates a cryptographically signed 30-day trial token.
//
// Token format:  lty-trial-YYYYMMDD-[16 hex chars from HMAC-SHA256]
//   YYYYMMDD = expiry date (30 days from now)
//   HMAC     = sha256(expiry, LTY_TRIAL_SECRET).slice(0, 16)
//
// The token is self-validating: middleware verifies the HMAC and expiry
// without any database. Tokens are non-forgeable (require the secret)
// and auto-expire on the encoded date.
//
// Required env var:
//   LTY_TRIAL_SECRET — random secret string (set in Vercel dashboard)

const crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, role } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const secret = process.env.LTY_TRIAL_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Trial system not configured. Contact trevor@clscre.com.' });
  }

  // Expiry = 30 days from now, as YYYYMMDD
  const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');

  // Sign: HMAC-SHA256(secret, expiry) → first 16 hex chars
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(expiry)
    .digest('hex')
    .slice(0, 16);

  const token = `lty-trial-${expiry}-${hmac}`;

  // Log signup (visible in Vercel Function logs)
  console.log(`[trial-signup] name="${name}" email="${email}" role="${role || 'n/a'}" expiry=${expiry}`);

  return res.status(200).json({
    ok: true,
    token,
    expiresOn: `${expiry.slice(0,4)}-${expiry.slice(4,6)}-${expiry.slice(6,8)}`,
    name,
  });
};
