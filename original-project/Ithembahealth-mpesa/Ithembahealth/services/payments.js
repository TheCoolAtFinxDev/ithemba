// services/payments.js
function buyGoods(merchantCode, amount, currency, subject) {
  return new Promise(function (resolve, reject) {
    var app = getApp();
    var mode = (app && app.globalData && app.globalData.mpesaMode) ? app.globalData.mpesaMode : 'backend';

    // Basic validation
    if (!merchantCode || !amount || amount <= 0) {
      reject({ message: 'Invalid payment parameters' });
      return;
    }

    // ---- Mode A: backend-initiated (recommended) ----
    if (mode === 'backend') {
      // POST to your API to initiate M-Pesa collection. Adjust URL to your real endpoint.
      // Expected response { transactionID, amount }
      my.request({
        url: (app && app.globalData && app.globalData.apiBase ? app.globalData.apiBase : '') + '/api/v1/payments/mpesa/buygoods',
        method: 'POST',
        data: {
          merchantCode: merchantCode,
          amount: amount,
          currency: currency || 'LSL',
          subject: subject || 'IthembaHealth Top-up'
        },
        dataType: 'json',
        success: function (res) {
          var status = Number(res.status || res.statusCode || 0);
          var body = res.data;
          if (typeof body === 'string') { try { body = JSON.parse(body); } catch (err) {} }
          if (status >= 200 && status < 300 && body) {
            resolve({ transactionID: body.transactionID || '', amount: body.amount || amount });
          } else {
            reject({ message: 'Payment create failed' });
          }
        },
        fail: function (err) {
          reject({ message: (err && (err.errorMessage || err.message)) || 'Network error' });
        }
      });
      return;
    }

    // ---- Mode B: device JSAPI (if available in your env) ----
    // If your UAT doesn’t expose a working JSAPI yet, keep using backend mode.
    try {
      // Example placeholder (replace with the real device call when enabled)
      // my.tradePay / my.startBizService / etc. — depends on M-Pesa’s JSAPI in the Lesotho env.
      my.call('tradePay', {
        // These fields are placeholders; replace with what your env requires
        merchantCode: merchantCode,
        amount: String(amount),
        currency: currency || 'LSL',
        subject: subject || 'IthembaHealth Top-up'
      }, function (res) {
        // Normalize a minimal success contract
        if (res && (res.resultCode === '9000' || res.success === true)) {
          resolve({ transactionID: (res.transactionID || res.tradeNO || ''), amount: amount });
        } else {
          reject({ message: (res && (res.errorMessage || res.memo)) || 'Payment declined' });
        }
      });
    } catch (ex) {
      reject({ message: 'Payment not supported in this environment' });
    }
  });
}

module.exports = { buyGoods: buyGoods };
