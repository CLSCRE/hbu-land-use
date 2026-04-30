// Vercel Edge Middleware — runs before cache on every matched request.
// Protects app.html, lender.html, and agent.html behind token-based auth.
//
// Flow:
//   1. Request arrives for a protected page
//   2. Middleware reads the lty_auth cookie
//   3. If cookie matches a token in LTY_TOKENS → allow
//   4. If not → redirect to /login.html?from=<original-path>
//
// Environment variable:
//   LTY_TOKENS — comma-separated valid tokens (set in Vercel dashboard)
//   If LTY_TOKENS is empty, access is allowed (dev mode).

export const config = {
  matcher: ['/app.html', '/lender.html', '/agent.html'],
};

export default function middleware(request) {
  const rawTokens = process.env.LTY_TOKENS || '';
  const validTokens = rawTokens
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  // Dev mode: no tokens configured → allow everything
  if (validTokens.length === 0) {
    return;
  }

  // Read the auth cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)lty_auth=([^;]+)/);
  const cookieToken = match ? decodeURIComponent(match[1]) : '';

  if (validTokens.includes(cookieToken)) {
    return; // Authenticated — let the request through
  }

  // Not authenticated — redirect to login with the original path as a return URL
  const url = new URL(request.url);
  const loginUrl = new URL('/login.html', request.url);
  loginUrl.searchParams.set('from', url.pathname);
  return Response.redirect(loginUrl.toString(), 302);
}
