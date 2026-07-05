/**
 * Redirect unauthenticated visitors to login.html
 */
(function () {
  if (typeof NexxAuth === 'undefined') return;
  NexxAuth.requireAuth('login.html');
})();