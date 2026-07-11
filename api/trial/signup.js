// /api/trial/signup.js
// Generates a cryptographically signed trial token (30-day default,
// longer when a valid promo code is supplied).
//
// Token format:  lty-trial-YYYYMMDD-[16 hex chars from HMAC-SHA256]
//   YYYYMMDD = expiry date
//   HMAC     = sha256(expiry, LTY_TRIAL_SECRET).slice(0, 16)
//
// The token is self-validating: middleware verifies the HMAC and expiry
// without any database. Tokens are non-forgeable (require the secret)
// and auto-expire on the encoded date.
//
// Required env var:
//   LTY_TRIAL_SECRET — random secret string (set in Vercel dashboard)
// Optional env var:
//   LTY_PROMO_CODES  — comma-separated CODE:days pairs, case-insensitive
//                      Example: PROVISORS:365,FRIENDS:90

const crypto = require('crypto');

const DEFAULT_TRIAL_DAYS = 30;

function parsePromoCodes(raw) {
  const map = {};
  (raw || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .forEach(pair => {
      const [code, days] = pair.split(':').map(s => (s || '').trim());
      const n = parseInt(days, 10);
      if (code && n > 0) map[code.toUpperCase()] = n;
    });
  return map;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, role, promoCode } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const secret = process.env.LTY_TRIAL_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Trial system not configured. Contact trevor@clscre.com.' });
  }

  // Resolve access length: default trial, or promo override
  let days = DEFAULT_TRIAL_DAYS;
  let promoApplied = null;
  const code = (promoCode || '').trim().toUpperCase();
  if (code) {
    const promos = parsePromoCodes(process.env.LTY_PROMO_CODES);
    if (promos[code]) {
      days = promos[code];
      promoApplied = code;
    } else {
      return res.status(400).json({ error: 'That promo code isn\'t valid. Leave it blank for the standard 30-day trial, or email trevor@clscre.com.' });
    }
  }

  // Expiry = N days from now, as YYYYMMDD
  const expiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
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
  console.log(`[trial-signup] name="${name}" email="${email}" role="${role || 'n/a'}" promo=${promoApplied || 'none'} days=${days} expiry=${expiry}`);

  return res.status(200).json({
    ok: true,
    token,
    expiresOn: `${expiry.slice(0,4)}-${expiry.slice(4,6)}-${expiry.slice(6,8)}`,
    name,
    promoApplied,
    days,
  });
};
