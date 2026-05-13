var apiFactory = require('../../services/api.client.js');

function buyGoods(tillNumber, amount, currency, reason) {
  return new Promise(function (resolve, reject) {
    if (!tillNumber || !amount || amount <= 0) {
      reject({ message: 'Invalid payment parameters' });
      return;
    }
    try {
      my.call('buyGoods', {
        tillNumber: String(tillNumber),
        amount: String(amount),
        currency: currency || 'LSL',
        reason: reason || 'IthembaHealth Wallet Top-up',
        success: function (res) {
          var tx = res && (res.transactionId || res.transactionID || res.tradeNO);
          if (tx) {
            resolve({
              success: true,
              message: 'Payment successful',
              data: { transactionID: tx, amount: amount, referenceNumber: reason || '' }
            });
          } else {
            reject({ success: false, userCanceled: false, message: 'Payment unsuccessful, please try again later.' });
          }
        },
        fail: function (res) {
          var code = res && (res.error || res.errorCode);
          if (code === 'APP667') {
            reject({ success: false, userCanceled: true, message: 'Payment cancelled by user.' });
          } else {
            reject({
              success: false,
              userCanceled: false,
              message: (res && (res.errorMessage || res.message)) || 'Payment failed.'
            });
          }
        }
      });
    } catch (ex) {
      reject({ message: 'Payment not supported in this environment' });
    }
  });
}

function getMpesaTill() {
  try {
    var app = getApp();
    return (app && app.globalData && app.globalData.mpesaMerchantCode)
      ? String(app.globalData.mpesaMerchantCode)
      : '0000';
  } catch (e) {
    return '0000';
  }
}

function getCurrencyIso(code) {
  if (!code) return 'LSL';
  var c = String(code).toUpperCase();
  if (c === 'M') return 'LSL';
  return c;
}

Page({
  data: {
    currency: 'M',
    balanceDisplay: 'M 0.00',
    savingsDisplay: 'M 0.00',
    updatedDisplay: '-',
    amountInput: '',
    transactions: [],
    transactionsRaw: [],
    hasMore: false,   // no paging
    err: '',
    loading: false
  },

  onShow: function () {
    this.refresh();
  },

  onPullDownRefresh: function () {
    var self = this;
    this.refresh()
      .catch(function () { })
      .finally(function () {
        try { my.stopPullDownRefresh(); } catch (_) { }
      });
  },

  onReachBottom: function () {
    // No pagination; everything loads in one go
  },

  // -------- Summary + full history in one shot --------
  refresh: async function () {
    if (this.data.loading) return;
    this.setData({ loading: true, err: '' });

    var api = apiFactory.buildClientFromApp();

    try {
      // Parallel: summary + first 50 history items
      var results = await Promise.all([
        api.wallet.summary(),
        api.wallet.history(0, 50)
      ]);

      var s = results[0];
      var h = results[1];

      // WalletSummaryDto(string Currency, decimal Balance, decimal Savings, DateTimeOffset UpdatedAt)
      var summary = (s && s.data) || s || {};
      var cur = summary.currency || 'M';
      var balance = Number(summary.balance || 0);
      var savings = Number(summary.savings || 0);
      var updatedAt = summary.updatedAt ? this.formatDate(summary.updatedAt) : '-';

      // WalletHistoryItemDto(Guid Id, string Type, decimal Amount, DateTimeOffset CreatedAt, string? Note);
      var rawItems;
      if (Object.prototype.toString.call(h) === '[object Array]') {
        rawItems = h;
      } else if (h && Object.prototype.toString.call(h.data) === '[object Array]') {
        rawItems = h.data;
      } else if (h && Object.prototype.toString.call(h.items) === '[object Array]') {
        rawItems = h.items;
      } else {
        rawItems = [];
      }

      var mapped = [];
      for (var i = 0; i < rawItems.length; i++) {
        var x = rawItems[i] || {};
        var id = x.id || x.Id || ('row-' + i);
        var type = x.type || x.Type || '';
        var amt = Number(x.amount != null ? x.amount : x.Amount || 0);
        var created = x.createdAt || x.CreatedAt || '';
        var note = x.note != null ? x.note : x.Note;

        var formattedAmount = this.fm(cur, amt);
        var formattedDate = this.formatDate(created);

        mapped.push({
          id: id,
          type: type,
          note: note || '',

          // legacy fields
          amount: formattedAmount,
          createdAt: formattedDate,

          // AXML bindings
          title: this.humanType(type),
          amountText: formattedAmount,
          dateText: formattedDate,
          statusText: note || '',
          isFee: (type || '').toLowerCase().indexOf('fee') > -1,

          amountClass:
            ((type || '').toLowerCase().indexOf('debit') > -1 ||
             (type || '').toLowerCase().indexOf('fee')   > -1)
              ? 'debit'
              : 'credit',
          

        });
      }

      this.setData({
        currency: cur,
        balanceDisplay: this.fm(cur, balance),
        savingsDisplay: this.fm(cur, savings),
        updatedDisplay: updatedAt,
        transactionsRaw: rawItems,
        transactions: mapped,
        hasMore: false // no scroll-paging
      });
    } catch (e) {
      var msg = (e && (e.errorMessage || (e.data && e.data.title))) || 'Failed to load wallet';
      this.setData({ err: msg });
      try { my.showToast({ type: 'fail', content: msg }); } catch (_) { }
    } finally {
      this.setData({ loading: false });
    }
  },

  // -------- Top-up handlers --------
  handleAmountInput: function (e) {
    var v = (e && e.detail && e.detail.value) || '';
    this.setData({ amountInput: v });
  },

  topUpManual: async function () {
    var a = parseFloat(this.data.amountInput);
    if (isNaN(a) || a <= 0) {
      try { my.showToast({ type: 'fail', content: 'Enter a valid amount' }); } catch (_) { }
      return;
    }

    var api = apiFactory.buildClientFromApp();

    try {
      await api.wallet.topUp(a, 'Manual top-up');
      this.setData({ amountInput: '' });
      try { my.showToast({ content: 'Top-up recorded' }); } catch (_) { }
      await this.refresh();
    } catch (e) {
      var msg = (e && (e.errorMessage || (e.data && e.data.title))) || 'Top-up failed';
      this.setData({ err: msg });
      try { my.alert({ content: msg }); } catch (_) { }
    }
  },

  topUpMpesa: async function () {
    var a = parseFloat(this.data.amountInput);
    if (isNaN(a) || a <= 0) {
      try { my.showToast({ type: 'fail', content: 'Enter a valid amount' }); } catch (_) { }
      return;
    }

    var till = getMpesaTill();
    var iso = getCurrencyIso(this.data.currency);
    var subject = 'IthembaHealth Wallet Top-up';

    try {
      var payRes = await buyGoods(till, a, iso, subject);
      var api = apiFactory.buildClientFromApp();

      var txId = payRes &&
                 payRes.data &&
                 (payRes.data.transactionID ||
                  payRes.data.transactionId ||
                  payRes.data.tradeNO);

      var note = txId ? ('M-Pesa ' + txId) : 'M-Pesa top-up';

      await api.wallet.topUp(a, note);

      try {
        my.setStorageSync({
          key: 'ih_last_payment',
          data: { transactionId: txId || '', amount: a }
        });
      } catch (_) { }

      this.setData({ amountInput: '' });
      try { my.showToast({ content: 'Payment success' }); } catch (_) { }
      await this.refresh();
    } catch (err) {
      var msg = (err && (err.errorMessage || err.message)) || 'Payment failed';
      try { my.alert({ title: 'Payment', content: msg }); } catch (_) { }
    }
  },

  // -------- Helpers --------
  fm: function (cur, n) {
    var v = isNaN(n) ? 0 : n;
    var c = cur || 'M';
    return c + ' ' + v.toFixed(2);
  },

  formatDate: function (iso) {
    if (!iso) return '-';
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return '-';
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
    } catch (e) {
      return '-';
    }
  },

  humanType: function (t) {
    var k = String(t || '').toLowerCase();
  
    // Top-ups
    if (k === 'topup' || k === 'top-up') return 'Top-up';
  
    // Claim payouts
    if (k === 'claimdebit' || k === 'claim-debit') return 'Claim Debit';
  
    // Adjustments
    if (k === 'adjustcredit' || k === 'adjust-credit') return 'Adjustment (+)';
    if (k === 'adjustdebit' || k === 'adjust-debit') return 'Adjustment (–)';
  
    // FEES
    if (k === 'registrationfee' || k === 'registration-fee')
      return 'Registration Fee';
  
    if (k === 'transactionfee' || k === 'transaction-fee')
      return 'Transaction Fee';
  
    if (k === 'adminfeeannual' || k === 'admin-fee-annual' || k === 'annualadminfee')
      return 'Annual Admin Fee';
  
    if (k.indexOf('fee') > -1)
      return 'Fee';
  
    // fallback
    return t || 'Transaction';
  }
  
});
