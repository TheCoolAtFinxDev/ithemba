// pages/booking/index.js

var apptsFlow = require('../../services/appointments.flow.js');
var Errs = (function () {
  try { return require('../../services/errors.problem.js'); } catch (_) { return null; }
})();
var SA = require('../../services/time.sa.js');

function pad(n){ return (n < 10 ? '0' : '') + n; }
function todayYmd(){ var d=new Date(); return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()); }
function getReturnUrl(){ return '/pages/booking/index?ymd=' + encodeURIComponent(this.data.ymd || todayYmd()); }

// ymd -> "Fri 07 Nov"
function dayLabelFromYmd(ymd){
  try {
    var p = String(ymd).split('-'); if (p.length !== 3) return ymd;
    var Y = parseInt(p[0],10), M = parseInt(p[1],10)-1, D = parseInt(p[2],10);
    var d = new Date(Y, M, D, 0, 0, 0, 0);
    var w = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
    var m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][M];
    var dd = (D<10?('0'+D):D);
    return w + ' ' + dd + ' ' + m;
  } catch(_) { return ymd; }
}

// --- util to add minutes to an ISO instant (UTC safe)
function addMinutesIso(iso, minutes){
  try {
    var t = new Date(String(iso)); if (isNaN(t.getTime())) return '';
    var e = new Date(t.getTime() + (minutes|0)*60000);
    return e.toISOString();
  } catch(_){ return ''; }
}

Page({
  data:{
    q:'', ymd:'', dateText:'Select date',
    providers:[], pickedProviderId:'', pickedSlotIso:'',
    slots:[], slotGroups:[],
    reason:'', beneficiaryId:'',
    loading:false, err:'', initialLoaded:false,

    // NEW: reschedule context
    rescheduleApptId:'',   // appointmentId we’re rescheduling
    isReschedule:false     // true when opened from detail page
  },

  onLoad:function(opts){
    this.flow = apptsFlow.build();
    this._searchTimer = null;
    this._lastSearchQ = '';
    this._slotsCache  = {}; // key => groups

    var t = todayYmd();

    // accept aid / appointmentId / id from detail page
    var aid = (opts && (opts.aid || opts.appointmentId || opts.id))
      ? (opts.aid || opts.appointmentId || opts.id)
      : '';

    // optional providerId hint
    var pid = (opts && (opts.pid || opts.providerId))
      ? (opts.pid || opts.providerId)
      : '';

    this.setData({
      ymd: t,
      dateText: t,
      rescheduleApptId: aid,
      isReschedule: !!aid,
      pickedProviderId: pid || ''
    });

    this.initProviders();
  },

  initProviders: async function(){
    if (this.data.loading) return;
    this.setData({ loading:true, err:'', providers:[] });
    try{
      var res = await this.flow.searchProviders('', 0, 20);
      var list = (res && res.data && res.data.items) ? res.data.items
               : (res && res.items) ? res.items
               : (res && res.data) ? res.data
               : (res || []);
      if (!Array.isArray(list)) list = [];
      this.setData({ providers:list, initialLoaded:true });
    }catch(err){
      this._showError(err, 'Could not load providers');
      this.setData({ initialLoaded:true });
    }finally{
      this.setData({ loading:false });
    }
  },

  onQueryInput:function(e){
    var v = (e && e.detail) ? e.detail.value : '';
    this.setData({ q:v });
    if (this._searchTimer) { try { clearTimeout(this._searchTimer); } catch(_) {} this._searchTimer = null; }
    var self = this;
    this._searchTimer = setTimeout(function(){ self.onSearch(); }, 350);
  },

  onDateInput:function(e){
    var v = (e && e.detail) ? e.detail.value : '';
    if (!v) return;
    this.setData({ ymd: v, dateText: v });
    if (this.data.pickedProviderId) {
      this.loadSlots({ currentTarget:{ dataset:{ pid: this.data.pickedProviderId } } });
    }
  },

  today:function(){
    var ymd = todayYmd();
    this.setData({ ymd: ymd, dateText: ymd });
    if (this.data.pickedProviderId) {
      this.loadSlots({ currentTarget:{ dataset:{ pid: this.data.pickedProviderId } } });
    }
  },

  onReasonInput:function(e){
    var v = e && e.detail ? e.detail.value : '';
    if (v) v = v.replace(/^\s+|\s+$/g, '');
    if (v) {
      var out = '';
      for (var i=0; i<v.length; i++){
        var code = v.charCodeAt(i);
        if (code >= 0xD800 && code <= 0xDFFF) { continue; }
        if (code < 32 || (code >= 127 && code <= 159)) { continue; }
        out += v.charAt(i);
      }
      v = out;
    }
    if (v && v.length > 240) v = v.slice(0,240);
    this.setData({ reason:v });
  },

  onBeneficiaryInput:function(e){ var v=e&&e.detail?e.detail.value:''; this.setData({ beneficiaryId:v }); },

  onSearch: async function(){
    if (this.data.loading) return;
    var term = (this.data.q || '').replace(/^\s+|\s+$/g,'');
    if (term === this._lastSearchQ && this.data.providers && this.data.providers.length) return;
    this._lastSearchQ = term;

    this.setData({ loading:true, err:'', providers:[], slots:[], slotGroups:[], pickedProviderId:'', pickedSlotIso:'' });
    try{
      var res = await this.flow.searchProviders(term, 0, 20);
      var list = (res && res.data && res.data.items) ? res.data.items
               : (res && res.items) ? res.items
               : (res && res.data) ? res.data
               : (res || []);
      if (!Array.isArray(list)) list = [];
      this.setData({ providers:list });
    }catch(err){
      this._showError(err, 'Search failed');
    }finally{
      this.setData({ loading:false });
    }
  },

  // Slots per provider/date with small cache (grouped by day)
  loadSlots: async function(e){
    if (this.data.loading) return;
    var pid = (e && e.currentTarget && e.currentTarget.dataset) ? e.currentTarget.dataset.pid : '';
    if (!pid) return;

    var key = pid + '|' + (this.data.ymd || todayYmd());
    if (this._slotsCache[key] && Array.isArray(this._slotsCache[key])) {
      this.setData({ err:'', pickedProviderId:pid, slotGroups: this._slotsCache[key], pickedSlotIso:'', slots: flattenGroups(this._slotsCache[key]) });
    } else {
      this.setData({ err:'', pickedProviderId:pid, slotGroups:[], pickedSlotIso:'', slots:[] });
    }

    this.setData({ loading:true });
    try{
      // API returns available slots only (UTC + label)
      var raw = await this.flow.getSlots(pid, this.data.ymd, 7);
      var arr = (raw && raw.data) ? raw.data : raw;
      var grid = this.flow.buildSlotGrid(arr); // -> { start, end, label, day } (start/end = UTC Z)

      // Hide past slots and group by day
      var byDay = {};
      for (var i=0;i<grid.length;i++){
        var it = grid[i];
        if (!it || !it.start) continue;
        // SA.isPastSa accepts ISO; grid.start is UTC Z; helper converts properly
        if (SA.isPastSa(it.start)) continue;
        var d = it.day || '';
        if (!byDay[d]) byDay[d] = [];
        byDay[d].push(it);
      }

      var days = Object.keys(byDay).sort();
      if (days.length > 7) days = days.slice(0,7);

      var groups = [];
      for (var j=0;j<days.length;j++){
        var day = days[j];
        var items = byDay[day] || [];
        items.sort(function(a,b){ return new Date(a.start) - new Date(b.start); });
        groups.push({ day: day, dayLabel: dayLabelFromYmd(day), items: items });
      }

      this._slotsCache[key] = groups;
      this.setData({ slotGroups: groups, slots: flattenGroups(groups) });
    }catch(err){
      this._showError(err, 'Could not load slots');
    }finally{
      this.setData({ loading:false });
    }
  },

  pickSlot:function(e){
    var iso = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.iso : '';
    if (!iso) return;
    this.setData({ pickedSlotIso: iso });
  },

  bookNow: async function(){
    if (!this.data.pickedProviderId || !this.data.pickedSlotIso) return;

    var patientId = this._getPatientId();
    if (!patientId) {
      var back = getReturnUrl.call(this);
      try { my.navigateTo({ url: '/pages/patient/onboard/index?return=' + encodeURIComponent(back) }); }
      catch(_){ my.reLaunch({ url: '/pages/patient/onboard/index?return=' + encodeURIComponent(back) }); }
      return;
    }

    // Validate slot is in the future using UTC (no double TZ math)
    var picked = new Date(this.data.pickedSlotIso);
    if (isNaN(picked.getTime())) { try{ my.showToast({ type:'fail', content:'Invalid slot' }); }catch(_){} return; }
    if (picked.getTime() <= Date.now()) {
      try{ my.showToast({ type:'fail', content:'Please pick a future time' }); }catch(_){} 
      return;
    }

    // Build a human date/time (for legacy flow) from the picked instant
    var date = picked.getFullYear() + '-' + pad(picked.getMonth()+1) + '-' + pad(picked.getDate());
    var time = pad(picked.getHours()) + ':' + pad(picked.getMinutes());

    // We still compute a SAST window for any legacy code paths, but booking uses exact UTC
    var win  = SA.buildSaWindow(date, time, 30);
    if (!win.start || SA.isPastSa(win.start)) {
      try{ my.showToast({ type:'fail', content:'Please pick a future time' }); }catch(_){} 
      return;
    }

    // Purge cache for this provider/day so the taken slot disappears after booking/reschedule
    var cacheKey = this.data.pickedProviderId + '|' + (this.data.ymd || todayYmd());
    try { delete this._slotsCache[cacheKey]; } catch(_) {}

    var reason = this.data.reason || '';
    if (reason) {
      reason = reason.replace(/^\s+|\s+$/g, '');
      if (reason) {
        var clean = '';
        for (var i=0; i<reason.length; i++){
          var code = reason.charCodeAt(i);
          if (code >= 0xD800 && code <= 0xDFFF) { continue; }
          if (code < 32 || (code >= 127 && code <= 159)) { continue; }
          clean += reason.charAt(i);
        }
        reason = clean;
        if (reason.length > 240) reason = reason.slice(0,240);
      }
    }

    // Compute exact end instant (UTC) for booking / reschedule payload
    var endIso = addMinutesIso(this.data.pickedSlotIso, 30);

    var isReschedule = !!this.data.rescheduleApptId;
    this.setData({ loading:true, err:'' });

    try{
      if (isReschedule && typeof this.flow.rescheduleMyAppointment === 'function') {
        // RESCHEDULE FLOW
        await this.flow.rescheduleMyAppointment(
          this.data.rescheduleApptId,
          this.data.pickedSlotIso,
          endIso,
          reason || ''
        );
        try { my.showToast({ content: 'Appointment rescheduled' }); } catch(_){}
        // go back to detail page
        try { my.navigateBack(); } catch(_) {}
      } else {
        // NORMAL BOOKING FLOW
        var r = await this.flow.book(this.data.pickedProviderId, date, time, {
          durationMinutes: 30,
          reason: reason || '',
          beneficiaryId: this.data.beneficiaryId || null,

          // send precise instants so API gets exact UTC times
          pickedSlotIso: this.data.pickedSlotIso,
          _utcStart: this.data.pickedSlotIso,
          _utcEnd: endIso
        });

        // Clear cache again (defensive), then refresh slots
        try { delete this._slotsCache[cacheKey]; } catch(_) {}
        var ok = (r && (r.status >= 200 && r.status < 300)) || !!(r && (r.id || r.appointmentId));
        try { my.showToast({ content: ok ? 'Booked' : 'Appointment created' }); } catch(_){}
        this.setData({ pickedSlotIso:'' });
        this.loadSlots({ currentTarget:{ dataset:{ pid: this.data.pickedProviderId } } });
      }
    }catch(err){
      var st = (err && typeof err.status !== 'undefined') ? err.status : 0;
      this._showError(err, isReschedule ? 'Reschedule failed' : 'Booking failed');

      if (!isReschedule && st === 409 && this.data.pickedProviderId) {
        // conflict: slot taken; refresh slots
        try { delete this._slotsCache[cacheKey]; } catch(_) {}
        this.loadSlots({ currentTarget:{ dataset:{ pid: this.data.pickedProviderId } } });
      }
    }finally{
      this.setData({ loading:false });
    }
  },

  _getPatientId:function(){
    try{ var r = my.getStorageSync({ key:'ih_patientId' }); if (r && r.data) return String(r.data); }catch(_){}
    try{
      var rp = my.getStorageSync({ key:'ih_profile' });
      if (rp && rp.data && (rp.data.id || rp.data.patientId)) return String(rp.data.id || rp.data.patientId);
    }catch(_){}
    try{
      var app = getApp && getApp();
      var h = app && app.globalData && app.globalData.hints;
      if (h && h.patientId) return String(h.patientId);
    }catch(_){}
    return '';
  },

  _showError: function (e, fallback) {
    var status = (e && typeof e.status !== 'undefined') ? e.status : 0;

    var body = null;
    if (e && e.data) body = e.data;
    else if (e && e.body) body = e.body;
    else if (e && e.raw) body = e.raw;
    else body = e;

    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch(_) {}
    }

    var n;
    if (Errs && typeof Errs.normalizeHttpError === 'function') {
      n = Errs.normalizeHttpError(status, body);
    } else {
      var msg0 = '';
      if (body && body.errors) {
        if (Array.isArray(body.errors) && body.errors.length) msg0 = String(body.errors[0]);
        else if (typeof body.errors === 'object') {
          for (var k in body.errors) if (Object.prototype.hasOwnProperty.call(body.errors,k)) {
            var v = body.errors[k];
            if (Array.isArray(v) && v.length) msg0 = String(v[0]); break;
            if (v != null) { msg0 = String(v); break; }
          }
        }
      }
      if (!msg0 && body && body.detail) msg0 = String(body.detail);
      if (!msg0 && body && body.message) msg0 = String(body.message);
      if (!msg0 && body && body.title)   msg0 = String(body.title);
      n = { title: 'Error', message: msg0, fieldErrors: [] };
    }

    var msg = '';
    if (n && n.fieldErrors && n.fieldErrors.length) msg = String(n.fieldErrors[0]);
    else if (n && n.message) msg = String(n.message);
    else if (n && n.title)   msg = String(n.title);
    else if (fallback)       msg = String(fallback);
    else                     msg = 'Error';

    this.setData({ err: msg });
    try { my.showToast({ type:'fail', content: msg }); } catch(_) {}
  }
});

// flatten helper (for any legacy code reading data.slots)
function flattenGroups(groups){
  var out = [];
  for (var i=0;i<groups.length;i++){
    var a = groups[i] && groups[i].items ? groups[i].items : [];
    for (var j=0;j<a.length;j++){ out.push(a[j]); }
  }
  return out;
}
