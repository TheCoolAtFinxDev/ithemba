// services/api.client.js
var Errs = require('./errors.problem.js');
var SA = require('./time.sa.js');

var normErr = (Errs && typeof Errs.normalizeHttpError === 'function')
  ? Errs.normalizeHttpError
  : function (status, body) {
      return {
        status: (typeof status !== 'undefined' && status !== null) ? status : 0,
        title: 'Error',
        message: 'Request failed'
      };
    };

// ----- low-level request (mini program bridge) -----
function miniRequest(opts) {
  return new Promise(function (resolve, reject) {
    var url     = opts && opts.url ? String(opts.url) : '';
    var method  = opts && opts.method ? String(opts.method).toUpperCase() : 'GET';
    var data    = (opts && typeof opts.data !== 'undefined') ? opts.data : null;
    var headers = (opts && opts.headers) ? opts.headers : {};
    var timeout = (opts && typeof opts.timeout === 'number') ? opts.timeout : 15000;

    my.request({
      url: url,
      method: method,
      headers: Object.assign({ 'Content-Type': 'application/json', 'Accept': 'application/json' }, headers),
      data: data,
      dataType: 'json',
      timeout: timeout,
      success: function (res) {
        var status = Number(res && (res.status || res.statusCode) ? (res.status || res.statusCode) : 0);
        var body = res ? (res.data !== undefined ? res.data : (res.body !== undefined ? res.body : null)) : null;
        if (typeof body === 'string') {
          try { body = JSON.parse(body); } catch (_) {}
        }

        if (status >= 200 && status < 300) {
          resolve({
            status: status,
            data: body,
            headers: (res && res.headers) ? res.headers : {}
          });
        } else {
          var n = normErr(status, body);
          n.raw = body;
          reject(n);
        }
      },
      fail: function (err) {
        var st = (err && typeof err.status !== 'undefined') ? err.status : 0;
        var d = null;
        if (err && typeof err.data !== 'undefined') d = err.data;
        else if (err && typeof err.body !== 'undefined') d = err.body;
        reject({ status: st, data: d, raw: err });
      }
    });
  });
}

// ----- tiny helpers -----
function ymdHmToIso(startYmd, timeHm) {
  if (typeof startYmd !== 'string' || typeof timeHm !== 'string') return null;
  var ym = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startYmd);
  var tm = /^(\d{2})-(\d{2})$/.exec(timeHm);
  if (!ym || !tm) return null;
  var d = new Date(+ym[1], +ym[2] - 1, +ym[3], +tm[1], +tm[2], 0, 0);
  return isNaN(d.getTime()) ? null : d.toISOString();
}
function addMinutesIso(iso, mins) {
  try {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return new Date(d.getTime() + (mins | 0) * 60000).toISOString();
  } catch (_) { return null; }
}
function pad(n) { return (n < 10 ? '0' : '') + n; }

function resolvePatientIdFromApp(cfg) {
  try {
    var app = getApp && getApp();
    if (app && app.globalData && app.globalData.patientId) return String(app.globalData.patientId);
  } catch (_) {}
  try {
    var r = my.getStorageSync({ key: 'ih_patientId' });
    if (r && r.data) return String(r.data);
  } catch (_) {}
  try {
    var rp = my.getStorageSync({ key: 'ih_profile' });
    if (rp && rp.data && rp.data.id) return String(rp.data.id);
    if (rp && rp.data && rp.data.patientId) return String(rp.data.patientId);
  } catch (_) {}
  if (cfg && cfg.hints && cfg.hints.patientId) return String(cfg.hints.patientId);
  return null;
}

function resolveProviderIdFromApp(cfg) {
  try {
    var app = getApp && getApp();
    if (app && app.globalData && app.globalData.providerId) return String(app.globalData.providerId);
  } catch (_) {}
  try {
    var r = my.getStorageSync({ key: 'ih_providerId' });
    if (r && r.data) return String(r.data);
  } catch (_) {}
  if (cfg && cfg.hints && cfg.hints.providerId) return String(cfg.hints.providerId);
  return null;
}

function decodeJwtClaim(key) {
  try {
    var atObj = my.getStorageSync({ key: 'ih_at' });
    var at = atObj && atObj.data ? atObj.data : '';
    if (!at || at.split('.').length < 2) return '';
    var b = at.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    var obj = JSON.parse(decodeURIComponent(escape(atob(b))));
    return String(obj[key] || '');
  } catch (_) { return ''; }
}

// ----- client factory -----
function createApiClient(cfg) {
  if (!cfg || !cfg.baseUrl) throw new Error('baseUrl required');
  var BASE = String(cfg.baseUrl).replace(/\/+$/, '');

  function authed(method, path, body, opts) {
    opts = opts || {};
    var retryOn401 = (typeof opts.retryOn401 === 'boolean') ? opts.retryOn401 : true;

    var at = (cfg.getAccessToken && cfg.getAccessToken()) ? cfg.getAccessToken() : null;
    var url = BASE + path;
    var headers = at ? { Authorization: 'Bearer ' + at } : undefined;

    return miniRequest({ url: url, method: method, data: body, headers: headers }).catch(function (e) {
      if (retryOn401 && e && e.status === 401 && cfg.getRefreshToken && cfg.setAccessToken) {
        var rt = cfg.getRefreshToken();
        if (!rt) throw e;
        return miniRequest({
          url: BASE + '/api/v1/auth/refresh',
          method: 'POST',
          data: { refreshToken: rt }
        })
          .then(function (r) {
            var newAt = r && r.data && r.data.accessToken ? r.data.accessToken : '';
            if (newAt) {
              cfg.setAccessToken(newAt);
              return miniRequest({
                url: url,
                method: method,
                data: body,
                headers: { Authorization: 'Bearer ' + newAt }
              });
            }
            throw e;
          })
          .catch(function () { throw e; });
      }
      throw e;
    });
  }

  // ----- API groups -----
  var auth = {
    login:    function (phone, password) { return miniRequest({ url: BASE + '/api/v1/login',    method: 'POST', data: { phone: phone, password: password } }); },
    register: function (phone, password, name) { return miniRequest({ url: BASE + '/api/v1/register', method: 'POST', data: { phone: phone, password: password, name: name } }); },
    requestOtp: function (phone) { return miniRequest({ url: BASE + '/api/v1/auth/otp/request', method: 'POST', data: { phone: phone } }); },
    verifyOtp:  function (phone, code) { return miniRequest({ url: BASE + '/api/v1/auth/otp/verify', method: 'POST', data: { phone: phone, code: code } }); },
    refresh:    function (refreshToken) { return miniRequest({ url: BASE + '/api/v1/auth/refresh', method: 'POST', data: { refreshToken: refreshToken } }); }
  };

  var wallet = {
    summary: function () { return authed('GET', '/api/v1/wallet/summary'); },

    history: function (skip, take) {
      skip = (typeof skip === 'number') ? skip : 0;
      take = (typeof take === 'number') ? take : 50;
      return authed('GET', '/api/v1/wallet/history?skip=' + skip + '&take=' + take)
        .then(function (r) {
          var body = r && r.data ? r.data : null;
          if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) { body = []; }
          }
          if (!Array.isArray(body)) body = [];
          return body;
        });
    },

    topUp:       function (amount, note) { return authed('POST', '/api/v1/wallet/topup', { amount: amount, note: note }); },
    createHold:  function (amount, reference, note) { return authed('POST', '/api/v1/wallet/holds', { amount: amount, reference: reference, note: note }); },
    releaseHold: function (holdId, commit, note) {
      return authed(
        'POST',
        '/api/v1/wallet/holds/' + encodeURIComponent(holdId) + '/release?commit=' + (commit ? 'true' : 'false'),
        { note: note }
      );
    }
  };

  var providers = {
    list: function (q, skip, take) {
      q = q || '';
      skip = (typeof skip === 'number') ? skip : 0;
      take = (typeof take === 'number') ? take : 20;
      return authed(
        'GET',
        '/api/v1/providers/profile/search?q=' + encodeURIComponent(q) +
        '&skip=' + encodeURIComponent(skip) +
        '&take=' + encodeURIComponent(take)
      );
    },

    // fromYmd/days are optional; if provided, they’re passed through
    slots: function (providerId, fromYmd, days) {
      var url = '/api/v1/providers/profile/slots?providerId=' + encodeURIComponent(providerId);
      if (typeof fromYmd === 'string' && fromYmd) url += '&from=' + encodeURIComponent(fromYmd);
      if (typeof days === 'number') url += '&days=' + encodeURIComponent(days);
      return authed('GET', url);
    }
  };

  var bookings = {
    create: function (providerId, dateYmd, timeHm, opts) {
      opts = opts || {};
      var duration = (typeof opts.durationMinutes === 'number' && opts.durationMinutes > 0) ? opts.durationMinutes : 30;

      var patientId = opts.patientId || resolvePatientIdFromApp(cfg);
      if (!patientId) {
        var pe = normErr(400, { title: 'Missing patient', detail: 'Patient context not found. Please complete onboarding.' });
        if (!pe.message && pe.detail) pe.message = pe.detail;
        throw pe;
      }

      var startsAtUtc = '';
      var endsAtUtc   = '';

      // Case 1: exact instants from slot pick (already UTC/Z from buildSlotGrid)
      if (opts._utcStart && typeof opts._utcStart === 'string') {
        var s = new Date(String(opts._utcStart));
        if (isNaN(s.getTime())) {
          var ee = normErr(400, { title: 'Invalid time', detail: 'Selected slot is invalid.' });
          if (!ee.message && ee.detail) ee.message = ee.detail;
          throw ee;
        }
        var e;
        if (opts._utcEnd && typeof opts._utcEnd === 'string') {
          e = new Date(String(opts._utcEnd));
          if (isNaN(e.getTime())) e = new Date(s.getTime() + (duration | 0) * 60000);
        } else {
          e = new Date(s.getTime() + (duration | 0) * 60000);
        }

        startsAtUtc = s.toISOString();
        endsAtUtc   = e.toISOString();
      } else {
        // Case 2: fallback from local parts => build SAST then convert to UTC for the API
        var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateYmd || ''));
        var t = /^(\d{2}):(\d{2})$/.exec(String(timeHm  || ''));
        if (!m || !t) {
          var be = normErr(400, { title: 'Invalid time', detail: 'Invalid date or time for appointment.' });
          if (!be.message && be.detail) be.message = be.detail;
          throw be;
        }
        var saStart = SA.makeSaIsoFromLocalParts(dateYmd, timeHm);   // "YYYY-MM-DDTHH:mm:00+02:00"
        if (!saStart) {
          var be2 = normErr(400, { title: 'Invalid time', detail: 'Invalid date or time for appointment.' });
          if (!be2.message && be2.detail) be2.message = be2.detail;
          throw be2;
        }
        var saEnd = SA.addMinutesSaIso(saStart, duration) || saStart;

        startsAtUtc = (new Date(saStart)).toISOString();
        endsAtUtc   = (new Date(saEnd)).toISOString();
      }

      var body = {
        providerId: providerId,
        startsAtUtc: startsAtUtc,
        endsAtUtc:   endsAtUtc,
        reason: (opts.reason || ''),
        beneficiaryId: (opts.beneficiaryId || null)
      };

      return authed('POST', '/api/patients/' + encodeURIComponent(patientId) + '/appointments', body);
    }
  };

  var appointments = {
    listMine: function (q) {
      q = q || {};
      var patientId = resolvePatientIdFromApp(cfg);
      if (!patientId) {
        var pe = normErr(400, { title: 'Missing patient', detail: 'Patient context not found. Please complete onboarding.' });
        if (!pe.message && pe.detail) pe.message = pe.detail;
        throw pe;
      }

      var url = '/api/patients/' + encodeURIComponent(patientId) + '/appointments';
      var qp = [];
      function addDays(date, days) {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    }
    
      // existing params
      if (q.status != null && q.status !== '') qp.push('status=' + encodeURIComponent(q.status));
      if (q.from)      qp.push('fromUtc=' + encodeURIComponent(q.from));
      if (q.to)
      qp.push('toUtc=' + encodeURIComponent(addDays(q.to, 7).toISOString()));
        if (q.page)      qp.push('page=' + encodeURIComponent(q.page));
      if (q.pageSize)  qp.push('pageSize=' + encodeURIComponent(q.pageSize));

      // 🔥 NEW: pass search through
      if (q.search != null && q.search !== '') {
        qp.push('search=' + encodeURIComponent(q.search));
      }

      if (qp.length) url += '?' + qp.join('&');
      return authed('GET', url);
    },

    // get one appointment detail
    getMineById: function (appointmentId) {
      var patientId = resolvePatientIdFromApp(cfg);
      if (!patientId) {
        var pe = normErr(400, { title: 'Missing patient', detail: 'Patient context not found. Please complete onboarding.' });
        if (!pe.message && pe.detail) pe.message = pe.detail;
        throw pe;
      }
      var url = '/api/patients/' + encodeURIComponent(patientId) + '/appointments/' + encodeURIComponent(appointmentId);
      return authed('GET', url);
    },

    // cancel an appointment (note optional)
    cancelMyAppointment: async function (appointmentId, note) {
      var patientId = resolvePatientIdFromApp(cfg);
      if (!patientId) {
        var pe = normErr(400, { title: 'Missing patient', detail: 'Patient context not found. Please complete onboarding.' });
        if (!pe.message && pe.detail) pe.message = pe.detail;
        throw pe;
      }

      var url = '/api/patients/' + encodeURIComponent(patientId) +
                '/appointments/' + encodeURIComponent(appointmentId) + '/cancel';
      var body = { reason: note || '' };

      try {
        return await authed('PUT', url, body);
      } catch (e) {
        if (e && e.status === 404) {
          var alt = '/api/patients/' + encodeURIComponent(patientId) +
                    '/appointments/' + encodeURIComponent(appointmentId) + ':cancel';
          return authed('POST', alt, body);
        }
        throw e;
      }
    },
        // reschedule an appointment (NewStartsAtUtc, NewEndsAtUtc, Reason)
        rescheduleMine: async function (appointmentId, payload) {
          var patientId = resolvePatientIdFromApp(cfg);
          if (!patientId) {
            var pe = normErr(400, { title: 'Missing patient', detail: 'Patient context not found. Please complete onboarding.' });
            if (!pe.message && pe.detail) pe.message = pe.detail;
            throw pe;
          }
    
          var url = '/api/patients/' + encodeURIComponent(patientId) +
                    '/appointments/' + encodeURIComponent(appointmentId) + '/reschedule';
    
          // expected payload shape:
          // { newStartsAtUtc: '2025-11-17T12:00:00Z', newEndsAtUtc: '...', reason: '...' }
          var body = {
            newStartsAtUtc: payload && payload.newStartsAtUtc,
            newEndsAtUtc:   payload && payload.newEndsAtUtc,
            reason:         (payload && payload.reason) || ''
          };
    
          try {
            return await authed('PUT', url, body);
          } catch (e) {
            // optional alt route with colon, in case you mirror cancel pattern:
            if (e && e.status === 404) {
              var alt = '/api/patients/' + encodeURIComponent(patientId) +
                        '/appointments/' + encodeURIComponent(appointmentId) + ':reschedule';
              return authed('POST', alt, body);
            }
            throw e;
          }
        },

    // STEP 1A: create cashier order token
    payRequest: function (appointmentId) {
      var patientId = resolvePatientIdFromApp(cfg);
      if (!patientId) {
        var pe = normErr(400, { title: 'Missing patient', detail: 'Patient context not found. Please complete onboarding.' });
        if (!pe.message && pe.detail) pe.message = pe.detail;
        throw pe;
      }
      var url = '/api/patients/' + encodeURIComponent(patientId) +
                '/appointments/' + encodeURIComponent(appointmentId) + '/pay/request';
      return authed('POST', url);
    },
    // send OTP for this appointment (patient side)
    sendOtp: function (appointmentId) {
      var patientId = resolvePatientIdFromApp(cfg);
      if (!patientId) {
        var pe = normErr(400, { title: 'Missing patient', detail: 'Patient context not found. Please complete onboarding.' });
        if (!pe.message && pe.detail) pe.message = pe.detail;
        throw pe;
      }

      var url = '/api/patients/' + encodeURIComponent(patientId) +
                '/appointments/' + encodeURIComponent(appointmentId) + '/otp/send';

      // no body needed for now
      return authed('POST', url, {});
    },

    // STEP 1B: confirm cashier result
    payConfirm: function (appointmentId, payload) {
      var patientId = resolvePatientIdFromApp(cfg);
      if (!patientId) {
        var pe = normErr(400, { title: 'Missing patient', detail: 'Patient context not found. Please complete onboarding.' });
        if (!pe.message && pe.detail) pe.message = pe.detail;
        throw pe;
      }
      var url = '/api/patients/' + encodeURIComponent(patientId) +
                '/appointments/' + encodeURIComponent(appointmentId) + '/pay/confirm';
      return authed('POST', url, payload || {});
    }
  };

  // --- Provider Appointments ---
  var providerAppts = {
    listMine: function (q) {
      // q: { status, from, to, page, pageSize }
      var providerId = resolveProviderIdFromApp(cfg);
      if (!providerId) {
        var pe = normErr(400, { title: 'Missing provider', detail: 'Provider context not found.' });
        if (!pe.message && pe.detail) pe.message = pe.detail;
        throw pe;
      }
      var qs = [];
      if (q && q.status)   qs.push('status=' + encodeURIComponent(q.status));
      if (q && q.from)     qs.push('from=' + encodeURIComponent(q.from));
      if (q && q.to)       qs.push('to=' + encodeURIComponent(q.to));
      if (q && q.page)     qs.push('page=' + encodeURIComponent(q.page));
      if (q && q.pageSize) qs.push('pageSize=' + encodeURIComponent(q.pageSize));
      var url = '/api/providers/' + encodeURIComponent(providerId) +
                '/appointments' + (qs.length ? ('?' + qs.join('&')) : '');
      return authed('GET', url);
    },

    getById: function (appointmentId) {
      var providerId = resolveProviderIdFromApp(cfg);
      if (!providerId) throw normErr(400, { title: 'Missing provider' });
      var url = '/api/providers/' + encodeURIComponent(providerId) +
                '/appointments/' + encodeURIComponent(appointmentId);
      return authed('GET', url);
    },

    // action one of: confirm | start | complete | cancel
    action: async function (appointmentId, action) {
      var providerId = resolveProviderIdFromApp(cfg);
      if (!providerId) throw normErr(400, { title: 'Missing provider' });
      action = String(action || '').toLowerCase();
      var root = '/api/providers/' + encodeURIComponent(providerId) +
                 '/appointments/' + encodeURIComponent(appointmentId);

      try {
        return await authed('POST', root + '/' + action, {});
      } catch (e) {
        if (e && e.status === 404) {
          return authed('POST', root + ':' + action, {});
        }
        throw e;
      }
    }
  };

  var users = {
    onboard: function (payload, userId) {
      var uid = userId;
      if (!uid) {
        uid = decodeJwtClaim('userId') ||
              decodeJwtClaim('sub') ||
              decodeJwtClaim('nameid') || '';
      }
      if (!uid) {
        var ue = normErr(401, { title: 'Missing user', detail: 'User context not found. Please login again.' });
        if (!ue.message && ue.detail) ue.message = ue.detail;
        throw ue;
      }
      return authed('POST', '/api/v1/users/' + encodeURIComponent(uid) + '/patient/onboard', payload);
    }
  };

  var claims = {
    create:  function (bookingId, amount) { return authed('POST', '/api/v1/claims', { bookingId: bookingId, amount: amount }); },
    list:    function (status, skip, take) {
      skip = (typeof skip === 'number') ? skip : 0;
      take = (typeof take === 'number') ? take : 50;
      var s = status ? String(status) : '';
      return authed(
        'GET',
        '/api/v1/claims?status=' + encodeURIComponent(s) +
        '&skip=' + encodeURIComponent(skip) +
        '&take=' + encodeURIComponent(take)
      );
    },
    get:     function (id) { return authed('GET', '/api/v1/claims/' + encodeURIComponent(id)); },
    approve: function (id) { return authed('POST', '/api/v1/claims/' + encodeURIComponent(id) + '/approve'); },
    reject:  function (id, reason) { return authed('POST', '/api/v1/claims/' + encodeURIComponent(id) + '/reject', { reason: reason }); },
    payout:  function (id) { return authed('POST', '/api/v1/claims/' + encodeURIComponent(id) + '/payout'); }
  };

  // --- Admin ---
  var admin = {
    claims: {
      list: function (status, page, pageSize) {
        var qs = [];
        if (status != null && status !== '') qs.push('status=' + encodeURIComponent(status));
        if (page) qs.push('page=' + page);
        if (pageSize) qs.push('pageSize=' + pageSize);
        var qstr = qs.length ? ('?' + qs.join('&')) : '';
        return authed('GET', '/api/admin/claims' + qstr);
      },
      get: function (id) {
        return authed('GET', '/api/admin/claims/' + encodeURIComponent(id));
      },
      approve: function (id, body) {
        return authed('POST', '/api/admin/claims/' + encodeURIComponent(id) + '/approve', body || {});
      },
      reject: function (id, body) {
        return authed('POST', '/api/admin/claims/' + encodeURIComponent(id) + '/reject', body || {});
      }
    }
  };

  return {
    auth: auth,
    wallet: wallet,
    providers: Object.assign({}, providers, { appts: providerAppts }),
    bookings: bookings,
    users: users,
    claims: claims,
    appointments: appointments,
    admin: admin
  };
}

function buildClientFromApp() {
  var app = getApp && getApp ? getApp() : null;
  var baseUrl = '';
  if (app && app.globalData && app.globalData.apiBase) baseUrl = app.globalData.apiBase;

  var tokenKey = 'ih_at';
  var rtKey = 'ih_rt';

  return createApiClient({
    baseUrl: baseUrl,
    getAccessToken: function () {
      try {
        var r = my.getStorageSync({ key: tokenKey });
        return (r && r.data) ? r.data : null;
      } catch (_) { return null; }
    },
    setAccessToken: function (t) {
      try {
        my.setStorageSync({ key: tokenKey, data: String(t || '') });
      } catch (_) {}
    },
    getRefreshToken: function () {
      try {
        var r = my.getStorageSync({ key: rtKey });
        return (r && r.data) ? r.data : null;
      } catch (_) { return null; }
    },
    hints: (app && app.globalData && app.globalData.hints) ? app.globalData.hints : undefined
  });
}

module.exports = {
  createApiClient: createApiClient,
  buildClientFromApp: buildClientFromApp
};
