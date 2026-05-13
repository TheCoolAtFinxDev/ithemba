// pages/appointments/detail/index.js
var apptsFlow = require('../../../services/appointments.flow.js');
var SA = require('../../../services/time.sa.js');

Page({
  data: {
    loading: false,
    err: '',
    item: null,
    canCancel: false,
    canReschedule: false,   // 🔥 NEW
    id: '',
    showCancel: false,
    cancelNote: '',
    // payment
    paying: false,
    canPay: false,
    // OTP
    canSendOtp: false,
    sendingOtp: false,
    otpRequested: false
  },

  onLoad: function (opts) {
    this.flow = apptsFlow.build();
    var id = (opts && (opts.id || opts.appointmentId)) ? (opts.id || opts.appointmentId) : '';
    this.setData({ id: id });
    this.load();
  },

  refresh: function () { this.load(); },

  async load() {
    if (!this.data.id) {
      this.setData({ err: 'Missing appointment id' });
      return;
    }
    if (this.data.loading) return;
    this.setData({
      loading: true,
      err: '',
      item: null,
      canCancel: false,
      canReschedule: false,
      canPay: false,
      canSendOtp: false
    });

    try {
      var res = await this.flow.getMyAppointmentById(this.data.id);
      var raw = (res && res.data) ? res.data : res;
      var item = this.flow.buildApptDetail(raw);

      // Existing cancel logic
      var canCancel = this._computeCanCancel(item);

      // ---- STATUS HANDLING ----
      var rawStatus = (item.status || '').toString().toLowerCase();
      var slug = (item.statusSlug || '').toString().toLowerCase();

      var isRequested  = (rawStatus === 'requested'  || slug === 'st-requested');
      var isScheduled  = (rawStatus === 'scheduled'  || slug === 'st-scheduled');
      var isConfirmed  = (rawStatus === 'confirmed'  || slug === 'st-confirmed');
      var isInProgress =
        (rawStatus === 'inprogress' || rawStatus === 'in_progress' || slug === 'st-inprogress');

      // Pay allowed only once confirmed / in progress
      var canPay = isConfirmed || isInProgress;

      // OTP: patient can request visit code BEFORE check-in:
      // Requested / Scheduled / Confirmed all allowed
      var canSendOtp = (isRequested || isScheduled || isConfirmed);

      // 🔥 RESCHEDULE GUARD: only when scheduled AND still in the future
      var canReschedule = this._computeCanReschedule(item);

      this.setData({
        item: item,
        canCancel: canCancel,
        canReschedule: canReschedule,
        canPay: canPay,
        canSendOtp: canSendOtp
      });
    } catch (e) {
      var msg = this._msg(e, 'Could not load appointment');
      this.setData({ err: msg });
      try { my.showToast({ type: 'fail', content: msg }); } catch (_) { }
    } finally {
      this.setData({ loading: false });
    }
  },

  _computeCanCancel: function (item) {
    if (!item) return false;
    var now = Date.now();
    var startMs = item.start ? (new Date(item.start)).getTime() : 0;
    var isFuture = startMs > now;
    var s = (item.statusSlug || '').toLowerCase();
    var isTerminal =
      (s === 'st-completed' ||
        s === 'st-cancelled' ||
        s === 'st-noshow');
    return isFuture && !isTerminal;
  },

  // 🔥 NEW: RESCHEDULE GUARD
  _computeCanReschedule: function (item) {
    if (!item) return false;
    var now = Date.now();
    var startMs = item.start ? (new Date(item.start)).getTime() : 0;
    var isFuture = startMs > now;
    var slug = (item.statusSlug || '').toLowerCase();

    var isScheduled = (slug === 'st-scheduled');
    // Only allow reschedule if it is scheduled AND in the future
    return isScheduled && isFuture;
  },

  // ===== PAY HOOK (unchanged, but with fixed gating above) =====
  async doPay() {
    if (this.data.paying) return;
    this.setData({ paying: true, err: '' });
    try {
      var res = await this.flow.payForAppointment
        ? this.flow.payForAppointment(this.data.id)
        : null;

      if (res && (res.status === 'Paid' || res.status === 'paid')) {
        try { my.showToast({ content: 'Payment successful' }); } catch (_) { }
        await this.load(); // refresh to hide Pay button & update status
      } else {
        var m = (res && res.status) ? ('Payment ' + res.status) : 'Payment failed';
        try { my.showToast({ type: 'fail', content: m }); } catch (_) { }
      }
    } catch (e) {
      var msg = this._msg(e, 'Payment failed');
      this.setData({ err: msg });
      try { my.showToast({ type: 'fail', content: 'Payment failed' }); } catch (_) { }
    } finally {
      this.setData({ paying: false });
    }
  },

  // ===== NEW: REQUEST VISIT OTP =====
  async doRequestOtp() {
    if (this.data.sendingOtp) return;
    if (!this.data.id) return;

    this.setData({ sendingOtp: true, err: '' });
    try {
      // uses appointments.sendOtp -> sendOtpForAppointment in flow
      await this.flow.sendOtpForAppointment(this.data.id);

      this.setData({ otpRequested: true });
      try { my.showToast({ content: 'Visit code sent to your phone' }); } catch (_) { }
    } catch (e) {
      var msg = this._msg(e, 'Could not send visit code');
      this.setData({ err: msg });
      try { my.showToast({ type: 'fail', content: msg }); } catch (_) { }
    } finally {
      this.setData({ sendingOtp: false });
    }
  },

  // ===== RESCHEDULE ENTRY POINT =====
  onReschedule: function () {
    // guard at UI-level as well, just in case
    if (!this.data.canReschedule) return;

    var pid = (this.data.item && this.data.item.providerId) ? this.data.item.providerId : '';
    var aid = this.data.id || '';
    var url = '/pages/booking/index';

    var qs = [];
    if (pid) qs.push('pid=' + encodeURIComponent(pid));
    if (aid) qs.push('aid=' + encodeURIComponent(aid));

    if (qs.length) url += '?' + qs.join('&');

    try { my.navigateTo({ url: url }); }
    catch (_) { my.reLaunch({ url: url }); }
  },

  // ===== Cancel dialog + actions =====
  openCancelNote: function () { this.setData({ showCancel: true, cancelNote: '' }); },
  closeCancelNote: function () { this.setData({ showCancel: false }); },
  onCancelNoteInput: function (e) {
    var v = (e && e.detail) ? e.detail.value : '';
    this.setData({ cancelNote: v });
  },

  submitCancelNote: async function () {
    var note = this.data.cancelNote || '';
    this.setData({ loading: true });
    try {
      await this.flow.cancelMyAppointment(this.data.id, note);
      try { my.showToast({ content: 'Cancelled' }); } catch (_) { }
      this.setData({ showCancel: false, cancelNote: '' });
      await this.load();
    } catch (e) {
      var msg = this._msg(e, 'Could not cancel appointment');
      this.setData({ err: msg });
      try { my.showToast({ type: 'fail', content: msg }); } catch (_) { }
    } finally {
      this.setData({ loading: false });
    }
  },

  onCancel: function () {
    var self = this;
    try {
      my.confirm({
        title: 'Cancel appointment',
        content: 'Are you sure you want to cancel this appointment?',
        confirmButtonText: 'Cancel appt',
        cancelButtonText: 'Keep',
        success: function (r) { if (r && r.confirm) { self._doCancel(''); } }
      });
    } catch (_) { this._doCancel(''); }
  },

  async _doCancel(note) {
    this.setData({ loading: true });
    try {
      await this.flow.cancelMyAppointment(this.data.id, note || '');
      try { my.showToast({ content: 'Cancelled' }); } catch (_) { }
      await this.load();
    } catch (e) {
      var msg = this._msg(e, 'Could not cancel appointment');
      this.setData({ err: msg });
      try { my.showToast({ type: 'fail', content: msg }); } catch (_) { }
    } finally {
      this.setData({ loading: false });
    }
  },

  _msg: function (e, fb) {
    var b = e && (e.data || e.body || e.raw || e) || {};
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch (_) { } }
    return b.detail || b.message || b.title || fb || 'Error';
  }
});
