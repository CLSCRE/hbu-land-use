// Vercel Serverless Function — GET /api/auth/logout
// Clears the LTY auth cookie and redirects to the login page.

module.exports = function handler(req, res) {
  res.setHeader(
    'Set-Cookie',
    'lty_auth=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax; Secure'
  );
  res.redirect(302, '/login.html');
};
