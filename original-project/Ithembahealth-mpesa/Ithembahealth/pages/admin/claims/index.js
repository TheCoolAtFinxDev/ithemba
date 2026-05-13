// pages/admin/claims/index.js
var AdminClaims = require('../../../services/admin.claims.flow.js');

Page({
  data: {
    loading: false,
    err: '',
    status: 'Submitted',
    list: []
  },

  onLoad: function () {
    this.flow = AdminClaims.build();
    this.reload();
  },

  _msg: function (e, fallback) {
    if (!e) return fallback || 'Error';
    if (e.message) return e.message;
    if (e.title) return e.title;
    if (e.data && e.data.detail) return e.data.detail;
    if (e.data && e.data.title) return e.data.title;
    return fallback || 'Error';
  },

  async reload() {
    if (!this.flow) return;
    this.setData({ loading: true, err: '' });
    try {
      var res = await this.flow.listClaims(this.data.status, 1, 50);
      this.setData({ list: res.items || [] });
    } catch (e) {
      this.setData({ err: this._msg(e, 'Failed to load claims') });
    } finally {
      this.setData({ loading: false });
    }
  },

  changeStatus(e) {
    var s = (e && e.target && e.target.dataset && e.target.dataset.status) || '';
    this.setData({ status: s }, () => {
      this.reload();
    });
  },

  openDetail(e) {
    var id = e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.id;
    if (!id) return;
    my.navigateTo({
      url: '/pages/admin/claims/detail/index?id=' + encodeURIComponent(id)
    });
  }
});
