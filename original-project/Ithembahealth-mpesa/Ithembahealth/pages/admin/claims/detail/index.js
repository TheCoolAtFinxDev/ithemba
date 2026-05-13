// pages/admin/claims/detail/index.js
var AdminClaims = require('../../../../services/admin.claims.flow.js');

Page({
  data: {
    id: '',
    item: null,
    loading: false,
    working: false,
    action: '',
    err: '',
    rejectReason: ''
  },

  onLoad(query) {
    this.flow = AdminClaims.build();
    var id = query && query.id ? query.id : '';
    this.setData({ id: id }, () => {
      if (id) this.reload();
    });
  },

  _msg(e, fallback) {
    if (!e) return fallback || 'Error';
    if (e.message) return e.message;
    if (e.title) return e.title;
    if (e.data && e.data.detail) return e.data.detail;
    if (e.data && e.data.title) return e.data.title;
    return fallback || 'Error';
  },

  async reload() {
    if (!this.flow || !this.data.id) return;
    this.setData({ loading: true, err: '' });
    try {
      var item = await this.flow.getClaim(this.data.id);
      this.setData({ item: item });
    } catch (e) {
      this.setData({ err: this._msg(e, 'Failed to load claim') });
    } finally {
      this.setData({ loading: false });
    }
  },

  onRejectReason(e) {
    var v = e && e.detail && e.detail.value;
    this.setData({ rejectReason: v || '' });
  },

  async onApprove() {
    var item = this.data.item;
    if (!item || !item.id) return;
    if (this.data.working) return;

    this.setData({ working: true, action: 'approve', err: '' });
    try {
      // NOTE: assumes patientId/providerId are wallet owner/UserIds.
      var updated = await this.flow.approveClaim(item.id, item.patientId, item.providerId);
      this.setData({ item: updated });
      try { my.showToast({ content: 'Claim approved' }); } catch (_) {}
    } catch (e) {
      this.setData({ err: this._msg(e, 'Failed to approve claim') });
    } finally {
      this.setData({ working: false, action: '' });
    }
  },

  async onReject() {
    var item = this.data.item;
    if (!item || !item.id) return;
    if (this.data.working) return;

    this.setData({ working: true, action: 'reject', err: '' });
    try {
      var reason = this.data.rejectReason || '';
      var updated = await this.flow.rejectClaim(item.id, reason);
      this.setData({ item: updated });
      try { my.showToast({ content: 'Claim rejected' }); } catch (_) {}
    } catch (e) {
      this.setData({ err: this._msg(e, 'Failed to reject claim') });
    } finally {
      this.setData({ working: false, action: '' });
    }
  }
});
