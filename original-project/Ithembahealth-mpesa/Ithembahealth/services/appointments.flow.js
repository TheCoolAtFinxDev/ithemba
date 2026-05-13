// services/appointments.flow.js
//
// Shared flow for:
//  - Booking (search providers, slots, book)
//  - Patient appointments list/detail
//
// Wraps services/api.client.js and normalises data for pages.

var apiFactory = require('./api.client.js');
var Errs = (function(){ try { return require('./errors.problem.js'); } catch(_) { return null; } })();
var SA = (function(){ try { return require('./time.sa.js'); } catch(_) { return {}; } })();

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

function hasStart(x){ return x && (x.start || x.startUtc || x.startsAt || x.startsAtUtc); }

function saLabel(iso){
  if (SA && typeof SA.toSaLabel === 'function') return SA.toSaLabel(iso);
  try{
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    var h = d.getHours(), m = d.getMinutes();
    return (h<10?('0'+h):h)+':' + (m<10?('0'+m):m);
  }catch(_){ return ''; }
}

function saYmd(iso){
  if (SA && typeof SA.toSaYmd === 'function') return SA.toSaYmd(iso);
  try{
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    var y = d.getFullYear(), m = d.getMonth()+1, day = d.getDate();
    return y + '-' + (m<10?('0'+m):m) + '-' + (day<10?('0'+day):day);
  }catch(_){ return ''; }
}

// ---- STATUS HELPERS ---------------------------------------------------------
function statusSlug(st) {
  st = (st || '').toString().toLowerCase();
  if (!st) return 'st-unknown';
  if (st === 'requested')  return 'st-requested';
  if (st === 'scheduled')  return 'st-scheduled';
  if (st === 'confirmed')  return 'st-confirmed';
  if (st === 'rescheduled')return 'st-rescheduled';
  if (st === 'checkedin' || st === 'checked_in') return 'st-checkedin';
  if (st === 'inprogress' || st === 'in_progress') return 'st-inprogress';
  if (st === 'completed')  return 'st-completed';
  if (st.indexOf('cancel') >= 0 || st.indexOf('no') >= 0) return 'st-cancelled';
  return 'st-unknown';
}

function statusText(st) {
  st = (st || '').toString().trim();
  if (!st) return 'Unknown';

  var s = st.toLowerCase();
  if (s === 'requested') return 'Requested';
  if (s === 'scheduled') return 'Scheduled';
  if (s === 'confirmed') return 'Confirmed';
  if (s === 'rescheduled') return 'Rescheduled';
  if (s === 'checkedin' || s === 'checked_in') return 'Checked in';
  if (s === 'inprogress' || s === 'in_progress') return 'In progress';
  if (s === 'completed') return 'Completed';
  if (s === 'cancelledbypatient') return 'Cancelled by patient';
  if (s === 'cancelledbyprovider') return 'Cancelled by provider';
  if (s === 'noshow' || s === 'no_show') return 'No show';

  // fallback: nice-case
  return st.charAt(0).toUpperCase() + st.slice(1).toLowerCase();
}

function mapApptItem(x) {
  x = x || {};

  // Status strictly from x.status
  var stRaw = (x.status || '').toString();

  var sRaw = x.startsAtUtc || x.startUtc || x.start || null;
  var eRaw = x.endsAtUtc   || x.endUtc   || x.end   || null;

  var timeLabel = '';
  if (sRaw && eRaw) {
    timeLabel = saLabel(sRaw) + ' - ' + saLabel(eRaw);
  } else if (sRaw) {
    timeLabel = saLabel(sRaw);
  }

  var dateYmd  = sRaw ? saYmd(sRaw) : '';
  var dateText = dateYmd;

  // 👇 Prefer API's appointmentDate, fall back to computed date
  var displayDate = x.appointmentDate || dateText;

  return {
    id: x.appointmentId || x.id || '',
    clinic: x.providerClinicName || '',
    doctor: x.providerName || x.providerFullName || '',

    start: sRaw,
    end:   eRaw,

    dateYmd:   dateYmd,
    dateText:  dateText,
    timeLabel: timeLabel,
    label:     timeLabel,

    // NEW: surfaced date property for UI
    appointmentDate: displayDate,
    displayDate:     displayDate,   // handy alias

    status:     stRaw,
    statusText: statusText(stRaw),
    statusSlug: statusSlug(stRaw),

    reason: x.reason || ''
  };
}

function buildApptList(payload) {
  var container = (payload && payload.data) ? payload.data : payload;
  var src = (container && Array.isArray(container.items))
    ? container.items
    : (Array.isArray(container) ? container : []);

  return src.map(mapApptItem);
}

// ---- FACTORY ----------------------------------------------------------------
function build() {
  var api = apiFactory.buildClientFromApp();

  // 1) BOOKING ---------------------------------------------------------------
  async function searchProviders(q, skip, take) {
    try {
      var res = await api.providers.list(q || '', skip || 0, take || 20);
      return (res && res.data) ? res.data : res;
    } catch (e) {
      throw normalizeThrown(e);
    }
  }

  async function getSlots(providerId, fromYmd, days) {
    try {
      var res = await api.providers.slots(providerId, fromYmd, days);
      var payload = (res && res.data) ? res.data : res;

      if (Array.isArray(payload) && payload.length && hasStart(payload[0])) {
        return payload; // AvailableSlotDto[] from API
      }

      return [];
    } catch (e) {
      throw normalizeThrown(e);
    }
  }

  function buildSlotGrid(payload) {
    var arr = [];
    var src = (payload && payload.data) ? payload.data : payload;
    if (!Array.isArray(src)) return arr;

    for (var i=0;i<src.length;i++){
      var it = src[i] || {};

      var sRaw = it.startUtc || it.startsAtUtc || it.start || it.startsAt || it.startLocal || it.startsAtLocal || '';
      var eRaw = it.endUtc   || it.endsAtUtc   || it.end   || it.endsAt   || it.endLocal   || it.endsAtLocal   || null;
      if (!sRaw) continue;

      var sIso = (new Date(sRaw)).toISOString();
      var eIso = eRaw ? (new Date(eRaw)).toISOString() : null;

      var lbl = it.label || (saLabel(sIso) + (eIso ? (' - ' + saLabel(eIso)) : ''));
      var dayYmd = saYmd(sIso);

      arr.push({
        start: sIso,
        end:   eIso,
        label: lbl,
        day:   dayYmd
      });
    }

    arr.sort(function(a,b){ return new Date(a.start) - new Date(b.start); });
    return arr;
  }

  async function book(providerId, dateYmd, timeHm, opts) {
    try {
      opts = opts || {};
      var dur = (typeof opts.durationMinutes === 'number' && opts.durationMinutes > 0) ? opts.durationMinutes : 30;

      if (opts.pickedSlotIso && typeof opts.pickedSlotIso === 'string') {
        var d = new Date(opts.pickedSlotIso);
        if (isNaN(d.getTime())) {
          throw { status: 400, data: { title: 'Invalid time', detail: 'Selected slot is invalid.' } };
        }
        var end = new Date(d.getTime() + (dur|0)*60000);
        opts._utcStart = d.toISOString();
        opts._utcEnd   = end.toISOString();
      }

      return await api.bookings.create(providerId, dateYmd, timeHm, opts);
    } catch (e) {
      throw normalizeThrown(e);
    }
  }

    // 2) PATIENT APPOINTMENTS --------------------------------------------------
  // Flexible signature:
  //   getMyAppointments(fromYmd, toYmd, page, pageSize, status)
  //   getMyAppointments({ from, to, page, pageSize, status, search })
  async function getMyAppointments(arg1, arg2, arg3, arg4, arg5) {
    try {
      var fromYmd = '';
      var toYmd   = '';
      var page    = 1;
      var pageSize= 20;
      var status  = '';
      var search  = '';

      // Object-style call from pages/appointments/index.js
      if (arg1 && typeof arg1 === 'object' && !Array.isArray(arg1)) {
        var opts = arg1;
        status   = opts.status   || '';
        search   = opts.search   || '';
        fromYmd  = opts.from     || opts.fromYmd || '';
        toYmd    = opts.to       || opts.toYmd   || '';
        page     = opts.page     || 1;
        pageSize = opts.size     || opts.pageSize || 20;
      } else {
        // Legacy positional call
        fromYmd  = arg1 || '';
        toYmd    = arg2 || '';
        page     = arg3 || 1;
        pageSize = arg4 || 20;
        status   = arg5 || '';
      }

      var q = {
        status:   status,
        from:     fromYmd,
        to:       toYmd,
        page:     page,
        pageSize: pageSize,
        search:   search          // 🔥 send search to API
      };

      var res = await api.appointments.listMine(q);
      // return raw PagedResult or data – callers handle both
      return (res && res.data) ? res.data : res;
    } catch (e) {
      throw normalizeThrown(e);
    }
  }

  // Optional alias (kept for backwards compatibility)
  async function listMyAppointments(status, fromYmd, toYmd, page, pageSize) {
    return getMyAppointments(fromYmd, toYmd, page, pageSize, status);
  }



  async function getAppointmentById(appointmentId) {
    try {
      var res = await api.appointments.getMineById(appointmentId);
      var x = (res && res.data) ? res.data : res;
      return mapApptItem(x);
    } catch (e) {
      throw normalizeThrown(e);
    }
  }

  
  
      // PATIENT: cancel my appointment via api.appointments.cancelMyAppointment
  async function cancelMyAppointment(appointmentId, reason) {
    if (!appointmentId) {
      throw {
        status: 0,
        title: 'Missing id',
        message: 'No appointment id provided.'
      };
    }

    var svc = api && api.appointments;
    if (!svc || typeof svc.cancelMyAppointment !== 'function') {
      throw {
        status: 0,
        title: 'Cancel not available',
        message: 'appointments.cancelMyAppointment missing in api.client.js'
      };
    }

    // api.appointments.cancelMyAppointment(appointmentId, note)
    // note becomes { reason: note || '' } inside api.client.js
    var res = await svc.cancelMyAppointment(appointmentId, reason || '');

    // normalise shape for callers
    return (res && res.data) ? res.data : res;
  }
  // patient: reschedule my appointment via api.appointments.rescheduleMine
  async function rescheduleMyAppointment(appointmentId, newStartsAtUtc, newEndsAtUtc, reason) {
    if (!appointmentId) {
      throw {
        status: 0,
        title: 'Missing id',
        message: 'No appointment id provided.'
      };
    }

    if (!newStartsAtUtc || !newEndsAtUtc) {
      throw {
        status: 0,
        title: 'Missing time',
        message: 'New start/end time required.'
      };
    }

    var svc = api && api.appointments;
    if (!svc || typeof svc.rescheduleMine !== 'function') {
      throw {
        status: 0,
        title: 'Reschedule not available',
        message: 'appointments.rescheduleMine missing in api.client.js'
      };
    }

    var payload = {
      newStartsAtUtc: newStartsAtUtc,
      newEndsAtUtc:   newEndsAtUtc,
      reason:         reason || ''
    };

    var res = await svc.rescheduleMine(appointmentId, payload);
    return (res && res.data) ? res.data : res;
  }
  async function sendOtpForAppointment (appointmentId) {
    return api.appointments.sendOtp(appointmentId);
  }



  return {
    // booking
    searchProviders: searchProviders,
    getSlots:        getSlots,
    buildSlotGrid:   buildSlotGrid,
    book:            book,

    // appointments
    getMyAppointments:      getMyAppointments,
    listMyAppointments:     listMyAppointments,
    buildApptList:          buildApptList,
    cancelMyAppointment:    cancelMyAppointment,

    // detail
    getAppointmentById:     getAppointmentById,
    getMyAppointmentById:   getAppointmentById,   // alias for pages/appointments/detail
    buildApptDetail:        mapApptItem,          // alias used by detail page
    rescheduleMyAppointment: rescheduleMyAppointment,
    //Otp
    sendOtpForAppointment:sendOtpForAppointment
  };
}

module.exports = { build: build };
