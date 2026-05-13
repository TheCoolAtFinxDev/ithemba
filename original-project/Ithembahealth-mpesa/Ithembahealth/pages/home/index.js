var auth = require('../../utils/auth.js');
var apiFactory = require('../../services/api.client.js');

Page({
  data: {
    user: null,
    errorMsg: '',
    hasError: false,
    phoneDisplay: '-',
    roleDisplay: 'Patient',

    // Wallet summary shown on the home screen
    walletBalanceDisplay: 'M 0.00',
    walletSavingsDisplay: 'M 0.00',
    walletUpdatedDisplay: 'Not synced'
  },

  onShow: function () {
    var self = this;

    // Reset to safe defaults while we fetch fresh data
    self.setData({
      walletBalanceDisplay: 'M 0.00',
      walletSavingsDisplay: 'M 0.00',
      walletUpdatedDisplay: 'Not synced'
    });

    auth.refreshIfNeeded()
      .then(function () { return auth.getUserInfo(); })
      .then(function (res) {
        if (res && res.status >= 200 && res.status < 300) {
          var body = (typeof res.data === 'string') ? JSON.parse(res.data) : res.data;
          var phone = (body && body.phoneNumber) ? body.phoneNumber : '-';
          var role = (body && body.role) ? body.role : 'Patient';

          self.setData({
            user: body,
            phoneDisplay: phone,
            roleDisplay: role,
            errorMsg: '',
            hasError: false
          });

          // Now that we know who the user is, load wallet summary
          self.loadWalletSummary();
        } else {
          self._forceRelogin();
        }
      })
      .catch(function () {
        self._forceRelogin();
      });
  },

  // -------- Wallet summary (home card) --------
  loadWalletSummary: function () {
    var self = this;
    var api = apiFactory.buildClientFromApp();

    // Optional: show "syncing" text while loading
    self.setData({ walletUpdatedDisplay: 'Syncing…' });

    api.wallet.summary()
      .then(function (res) {
        var dto = (res && res.data) || res || {};

        // WalletSummaryDto(string Currency, decimal Balance, decimal Savings, DateTimeOffset UpdatedAt)
        var cur = dto.currency || 'M';
        var balance = Number(dto.balance || 0);
        var savings = Number(dto.savings || 0);
        var updatedAt = dto.updatedAt ? self._formatDate(dto.updatedAt) : '—';

        self.setData({
          walletBalanceDisplay: self._fm(cur, balance),
          walletSavingsDisplay: self._fm(cur, savings),
          walletUpdatedDisplay: updatedAt
        });
      })
      .catch(function (e) {
        // Leave defaults, just show "Not synced" so page doesn’t look broken
        var msg = (e && (e.errorMessage || (e.data && e.data.title))) || '';
        console.warn('wallet summary failed', msg);
        self.setData({ walletUpdatedDisplay: 'Not synced' });
      });
  },

  // -------- Navigation (unchanged) --------
  toWallet: function () { my.navigateTo({ url: '/pages/wallet/index' }); },
  toAppointments: function () { my.navigateTo({ url: '/pages/appointments/index' }); },
  toClaims: function () { my.navigateTo({ url: '/pages/admin/claims/index' }); },
  toProfile: function () { my.navigateTo({ url: '/pages/profile/index' }); },
  toSupport: function () { my.navigateTo({ url: '/pages/support/index' }); },
  toBooking: function () { my.navigateTo({ url: '/pages/booking/index' }); },

  logout: function () {
    auth.clearTokens();
    my.reLaunch({ url: '/pages/auth/login/index' });
  },

  // -------- Helpers --------
  _forceRelogin: function () {
    this.setData({
      errorMsg: 'Please sign in again.',
      hasError: true,
      phoneDisplay: '-',
      roleDisplay: 'Patient'
    });
    try {
      var self = this;
      setTimeout(function () {
        my.reLaunch({ url: '/pages/auth/login/index' });
      }, 800);
    } catch (_) { }
  },

  _fm: function (cur, n) {
    var v = isNaN(n) ? 0 : n;
    var c = cur || 'M';
    return c + ' ' + v.toFixed(2);
  },

  _formatDate: function (iso) {
    if (!iso) return '—';
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return '—';
      var pad = function (x) {
        x = String(x);
        return x.length < 2 ? '0' + x : x;
      };
      return (
        d.getFullYear() + '-' +
        pad(d.getMonth() + 1) + '-' +
        pad(d.getDate()) + ' ' +
        pad(d.getHours()) + ':' +
        pad(d.getMinutes())
      );
    } catch (_) {
      return '—';
    }
  }
});
