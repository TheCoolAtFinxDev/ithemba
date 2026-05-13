// services/admin.claims.flow.js
//
// Admin claims flow:
//  - list claims from /api/admin/claims
//  - map them into UI-friendly objects
//  - (optionally) update status (approve / reject)

var apiFactory = require('./api.client.js');
var Errs = (function(){ try { return require('./errors.problem.js'); } catch(_) { return null; } })();

var normErr = (Errs && typeof Errs.normalizeHttpError === 'function')
  ? Errs.normalizeHttpError
  : function(s,b){ return { status:s||0, title:'Error', message:'Request failed' }; };

function normalizeThrown(e) {
  try {
    if (e && (typeof e.status !== 'undefined' || e.message || e.title)) return e;
    var status = (e && typeof e.status !== 'undefined') ? e.status : 0;
    var body   = (e && (e.raw || e.data)) ? (e.raw || e.data) : e;
    return normErr(status, body);
  } catch (_){
    return { status:0, title:'Error', message:'Unknown error' };
  }
}

/* ---------- helpers ---------- */

function statusSlug(st) {
  st = (st || '').toString().toLowerCase();
  if (!st) return 'st-unknown';
  if (st === 'pending')   return 'st-pending';
  if (st === 'approved')  return 'st-approved';
  if (st === 'rejected')  return 'st-rejected';
  if (st === 'paid')      return 'st-paid';
  return 'st-unknown';
}

function statusText(st) {
  st = (st || '').toString().trim();
  if (!st) return 'Unknown';

  var s = st.toLowerCase();
  if (s === 'pending')  return 'Pending';
  if (s === 'approved') return 'Approved';
  if (s === 'rejected') return 'Rejected';
  if (s === 'paid')     return 'Paid';

  return st.charAt(0).toUpperCase() + st.slice(1).toLowerCase();
}

function formatAmount(amount, currency) {
  var n = Number(amount || 0);
  var c = currency || 'M';
  // Keep it simple, 2 decimals
  return c + ' ' + n.toFixed(2);
}

function bestDate(c) {
  // Try paid -> approved -> rejected; all are UTC strings
  if (c.paidAtUtc)     return c.paidAtUtc;
  if (c.approvedAtUtc) return c.approvedAtUtc;
  if (c.rejectedAtUtc) return c.rejectedAtUtc;
  // fallback: maybe there is a created date later; for now leave blank
  return '';
}

/* ---------- mapping ---------- */

function mapClaimItem(c) {
  c = c || {};
  var stRaw = (c.status || '').toString();

  return {
    id:            c.claimId || c.id || '',
    claimId:       c.claimId || c.id || '',
    appointmentId: c.appointmentId || '',
    patientId:     c.patientId || '',
    providerId:    c.providerId || '',

    amount:        c.amount || 0,
    currency:      c.currency || 'M',
    amountLabel:   formatAmount(c.amount, c.currency),

    status:        stRaw,
    statusText:    statusText(stRaw),
    statusSlug:    statusSlug(stRaw),

    patientHoldId:    c.patientHoldId || '',
    approvedAtUtc:    c.approvedAtUtc || null,
    rejectedAtUtc:    c.rejectedAtUtc || null,
    paidAtUtc:        c.paidAtUtc || null,
    rejectionReason:  c.rejectionReason || '',

    dateLabel:     bestDate(c) || ''
  };
}

function buildClaimList(payload) {
  // Handles: { data: { items:[...] }}, { items: [...] }, or directly [...]
  var container = (payload && payload.data) ? payload.data : payload;
  var src = (container && Array.isArray(container.items))
    ? container.items
    : (Array.isArray(container) ? container : []);

  return src.map(mapClaimItem);
}

/* ---------- factory ---------- */

function build() {
  var api = apiFactory.buildClientFromApp();

  // LIST CLAIMS
  // NOTE: We support multiple calling styles:
  //   listClaims(status, page, pageSize)
  //   getClaims(status, page, pageSize)
  //   list(status, page, pageSize)
  async function listClaims(status, page, pageSize) {
    try {
      var st = status || '';          // e.g. 'Pending' | '' (all)
      var pg = page || 1;
      var ps = pageSize || 20;

      // Expect api.admin.claims.list to exist (as per previous wiring)
      var res = await api.admin.claims.list(st, pg, ps);
      var data = (res && res.data) ? res.data : res;

      return {
        raw: data,
        items: buildClaimList(data),
        total: (typeof data.total === 'number') ? data.total : ((data.items && data.items.length) || 0),
        page:  (typeof data.page === 'number') ? data.page : pg,
        pageSize: (typeof data.pageSize === 'number') ? data.pageSize : ps
      };
    } catch (e) {
      throw normalizeThrown(e);
    }
  }
  // GET SINGLE CLAIM BY ID
  async function getClaimById(claimId) {
    try {
      // Prefer a dedicated GET endpoint if available
      if (api.admin && api.admin.claims && typeof api.admin.claims.get === 'function') {
        var res = await api.admin.claims.get(claimId);
        var data = (res && res.data) ? res.data : res;
        return mapClaimItem(data || {});
      }

      // Fallback: use listClaims and find in the list
      var listRes = await listClaims('', 1, 200); // pageSize 200 to keep it sane
      var items = listRes && listRes.items ? listRes.items : [];
      var found = null;

      for (var i = 0; i < items.length; i++) {
        var x = items[i];
        if (x.claimId === claimId || x.id === claimId) {
          found = x;
          break;
        }
      }

      if (!found) {
        throw { status: 404, title: 'Not Found', message: 'Claim not found' };
      }

      return found;
    } catch (e) {
      throw normalizeThrown(e);
    }
  }

  // UPDATE CLAIM STATUS (approve / reject)
  // We'll keep this generic; your page can pass the body.
  async function updateClaimStatus(claimId, body) {
    try {
      // Try api.admin.claims.update(claimId, body)
      if (api.admin && api.admin.claims && typeof api.admin.claims.update === 'function') {
        return await api.admin.claims.update(claimId, body || {});
      }

      // Fallback: updateStatus
      if (api.admin && api.admin.claims && typeof api.admin.claims.updateStatus === 'function') {
        return await api.admin.claims.updateStatus(claimId, body || {});
      }

      // If neither exists, surface a clear error
      throw { status: 0, title: 'Admin claims API missing', message: 'No update method found on api.admin.claims' };
    } catch (e) {
      throw normalizeThrown(e);
    }
  }

  return {
    // main listing
    listClaims:      listClaims,
    getClaims:       listClaims,   // alias
    list:            listClaims,   // alias

    // mapping
    buildClaimList:  buildClaimList,
    buildClaimsList: buildClaimList, // alias
    mapClaimItem:    mapClaimItem,   // alias

    // single item
    getClaimById:    getClaimById,
    getClaim:        getClaimById,

    // update
    updateClaimStatus: updateClaimStatus,
    updateStatus:      updateClaimStatus
  };
}

module.exports = { build: build };
