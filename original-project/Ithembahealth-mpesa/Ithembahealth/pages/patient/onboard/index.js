// pages/patient/onboard/index.js
var api = require('../../../services/api.client.js');
var http = require('../../../utils/http.js');

function isoFromYmd(ymd){
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(ymd||''))) return '';
  var p = ymd.split('-'); var d = new Date(+p[0], +p[1]-1, +p[2], 0,0,0,0);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

Page({
  data: {
    firstName: '', lastName: '', dob: '', nid: '',
    returningTo: '', loading: false, err: ''
  },

  onLoad: function(q){
    var back = q && q.return ? decodeURIComponent(q.return) : '/pages/booking/index';
    this.setData({ returningTo: back });
    this.client = api.buildClientFromApp();
  },

  onFirst:function(e){ this.setData({ firstName: (e.detail||{}).value || '' }); },
  onLast:function(e){ this.setData({ lastName: (e.detail||{}).value || '' }); },
  onDob:function(e){ this.setData({ dob: (e.detail||{}).value || '' }); },
  onNid:function(e){ this.setData({ nid: (e.detail||{}).value || '' }); },

  submit: async function(){
    if (this.data.loading) return;
    var first = (this.data.firstName||'').trim();
    var last  = (this.data.lastName||'').trim();
    var isoDob = isoFromYmd(this.data.dob||'');
    var nid = (this.data.nid||'').trim();

    if (!first || !last || !isoDob) {
      this.setData({ err: 'First name, last name and date of birth are required.' });
      return;
    }
    var back = this.data.returningTo || '/pages/booking/index';
    if (!ensureLoggedInOrRedirect(back)) return;

    this.setData({ loading:true, err:'' });
    try{
      // 1) Onboard
      var payload = { firstName: first, lastName: last, dateOfBirth: isoDob, nationalId: nid || '' };
      var onboardRes = await this.client.users.onboard(payload);
      if (!(onboardRes && onboardRes.status>=200 && onboardRes.status<300)) {
        throw { title:'Onboarding failed', message:'Unable to create patient profile' };
      }

      // 2) Fetch profile to get patientId (v1 then non-v1)
      var base = (getApp().globalData && getApp().globalData.apiBase) ? String(getApp().globalData.apiBase) : '';
      var at = (my.getStorageSync({ key:'ih_at' })||{}).data || '';
      var headers = { Authorization: 'Bearer ' + at };
      var root = base.replace(/\/+$/,'');
      var prof = await http.getJson(root + '/api/patients/profile', headers).catch(()=>null);
      if (!prof || prof.status === 404) {
        prof = await http.getJson(root + '/api/v1/patients/profile', headers).catch(()=>null);
      }
      var body = prof && (typeof prof.data==='string' ? JSON.parse(prof.data) : prof.data);
      var pid = body && (body.patientId || body.id);
      if (pid) { my.setStorageSync({ key:'ih_patientId', data:String(pid) }); }

      // 3) Go back to booking
      var dest = this.data.returningTo || '/pages/booking/index';
      try { my.reLaunch({ url: dest }); } catch(_) { my.navigateBack(); }
    }catch(e){
      var msg = (e && (e.message || e.title || e.errorMessage)) || 'Failed to onboard';
      this.setData({ err: String(msg) });
      try{ my.showToast({ type:'fail', content: msg }); }catch(_){}
    }finally{
      this.setData({ loading:false });
    }
  }
});
// --- ADD helper in pages/patient/onboard/index.js ---
function getAccessTokenSync(){
  try { return (my.getStorageSync({ key:'ih_at' }) || {}).data || ''; } catch(_) { return ''; }
}
function ensureLoggedInOrRedirect(backUrl){
  var at = getAccessTokenSync();
  if (!at) {
    var target = '/pages/auth/login/index' + (backUrl ? ('?return=' + encodeURIComponent(backUrl)) : '');
    try { my.reLaunch({ url: target }); } catch(_) { my.navigateTo({ url: target }); }
    return false;
  }
  return true;
}
