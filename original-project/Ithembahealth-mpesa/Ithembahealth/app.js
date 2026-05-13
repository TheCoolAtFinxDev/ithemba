// ---- WebSocket safe-send shim for Alipay Mini Program (UAT) ----
// Avoid "Failed to execute 'send' on 'WebSocket': Still in CONNECTING state."
(function () {
  try {
    if (!my || !my.sendSocketMessage) return;

    var _send = my.sendSocketMessage;
    var queued = [];
    var isOpen = false;

    // Flush queued messages when socket opens
    if (typeof my.onSocketOpen === 'function') {
      my.onSocketOpen(function () {
        isOpen = true;
        try {
          var d;
          while (queued.length) {
            d = queued.shift();
            _send({ data: d });
          }
        } catch (e) { /* swallow */ }
      });
    }

    if (typeof my.onSocketClose === 'function') {
      my.onSocketClose(function () { isOpen = false; });
    }
    if (typeof my.onSocketError === 'function') {
      my.onSocketError(function () { isOpen = false; });
    }

    // Monkey-patch send to queue while CONNECTING
    my.sendSocketMessage = function (opts) {
      try {
        var data = opts && (opts.data !== undefined ? opts.data : null);
        if (isOpen) return _send({ data: data });

        // No open socket yet — buffer and attempt a connect if available
        if (data !== null) queued.push(data);
        try {
          if (typeof my.connectSocket === 'function') {
            // noop connect; runtime may already manage a socket; ignore errors
            my.connectSocket({});
          }
        } catch (e) {}
      } catch (e) {
        // Never throw here — this is a defensive shim
        try { console.warn('sendSocketMessage shim error', e); } catch (_) {}
      }
    };
  } catch (_) { /* never block app */ }
})();

// app.js
var apiClient = require('/services/api.client.js');
var authStore = require('/services/auth.store.js');
var isDev = false;
var baseUrl = isDev
  ? 'https://localhost:7133'
  : 'https://ithembahealthapi20251029115517-bkgfhjhuhggqg6h3.canadacentral-01.azurewebsites.net';

App({
  globalData: {
    apiBase: baseUrl,
    mpesaMode: 'backend',
    mpesaMerchantCode: '0000',
    // runtime flags
    isLoggedIn: false
  },

  onLaunch: function () {
    this.bootstrapAuth();
  },

  /**
   * Decide where to send the user after a successful auth check.
   * - Admins → Admin claims dashboard
   * - Everyone else → Home
   */
  navigatePostLogin: function () {
    var isAdmin = false;
    try {
      if (authStore && typeof authStore.isAdmin === 'function') {
        isAdmin = !!authStore.isAdmin();
      }
    } catch (_) {}

    this.globalData.isLoggedIn = true;

    if (isAdmin) {
      my.reLaunch({ url: '/pages/admin/claims/index' });
    } else {
      my.reLaunch({ url: '/pages/home/index' });
    }
  },

  // Auth bootstrap at app start
  bootstrapAuth: async function () {
    var at = authStore.getAccessToken();
    var rt = authStore.getRefreshToken();
    var client = apiClient.createApiClient({
      baseUrl: this.globalData.apiBase,
      getAccessToken: function () { return authStore.getAccessToken(); },
      setAccessToken: function (t) { authStore.setAccessToken(t); },
      getRefreshToken: function () { return authStore.getRefreshToken(); }
    });

    // If no tokens at all → go login
    if (!at && !rt) {
      this.globalData.isLoggedIn = false;
      my.reLaunch({ url: '/pages/auth/login/index' });
      return;
    }

    // Validate with a very light protected call (summary)
    try {
      await client.wallet.summary();
      // Tokens are valid → route based on role
      this.navigatePostLogin();
      return;
    } catch (e) {
      // If 401 and we have RT, client will auto-try refresh once (see api.client)
      // If still failing, we’ll land here.
      this.globalData.isLoggedIn = false;
      // wipe broken tokens so UI doesn’t think we’re logged in
      authStore.clearTokens();
      my.reLaunch({ url: '/pages/auth/login/index' });
      return;
    }
  }
});
