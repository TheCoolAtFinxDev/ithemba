// pages/appointments/index.js
var apptsFlow = require('../../services/appointments.flow.js');
var SA = require('../../services/time.sa.js');

function pad(n){ return (n<10?('0'+n):n); }
function todayYmd(){
  var d=new Date();
  return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
}

// Simple date label: 2025-11-17
function formatDateLabel(iso){
  if (!iso) return '';
  try{
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' +
      pad(d.getMonth()+1) + '-' +
      pad(d.getDate());
  }catch(_){
    return '';
  }
}

Page({
  data:{   search: '', tab:'upcoming', loading:false, err:'', list:[], fromYmd:'', toYmd:'' },

  onLoad:function(){
    // ✅ build the flow instance (fixes "getMyAppointments is not a function")
    this.flow = apptsFlow.build();

    // default window: past 14d .. next 30d
    var now = new Date();
    var from = new Date(now.getTime() - 14*86400000);
    var to   = new Date(now.getTime() + 30*86400000);
    this.setData({
      fromYmd: SA.toSaYmd ? SA.toSaYmd(from.toISOString()) : todayYmd(),
      toYmd:   SA.toSaYmd ? SA.toSaYmd(to.toISOString())   : todayYmd()
    });
    this.load();
  },
  onSearch(e){
    this.setData({ search: e.detail.value });
    this.load();        // refresh list
  },
  showUpcoming:function(){
    if (this.data.tab!=='upcoming'){
      this.setData({tab:'upcoming'});
      this.render(this._all);
    }
  },
  showPast:function(){
    if (this.data.tab!=='past'){
      this.setData({tab:'past'});
      this.render(this._all);
    }
  },
  refresh:function(){ this.load(); },

  async load(){
    if (this.data.loading) return;
    this.setData({ loading:true, err:'', list:[] });
    try{
      var res = await this.flow.getMyAppointments({
        status: this.data.tab,          // "upcoming" or "past" (you can map to API later if needed)
        search: this.data.search,       // 🔍 search term
        from:   this.data.fromYmd,
        to:     this.data.toYmd,
        page:   1,
        size:   100
      });

      var raw = (res && res.data) ? res.data : res;
      var all = this.flow.buildApptList(raw); // normalized items
      this._all = all;
      this.render(all);
    }catch(err){
      this._showError(err, 'Could not fetch appointments');
    }finally{
      this.setData({ loading:false });
    }
  },

  render(all){
    all = Array.isArray(all) ? all : [];
    var out = [];
    var now = Date.now();
  
    for (var i = 0; i < all.length; i++) {
      var it = all[i];
      if (!it || !it.start) continue;
  
      var startTs = new Date(it.start).getTime();
      var endTs   = it.end ? new Date(it.end).getTime() : startTs;
  
      if (isNaN(startTs)) continue;
  
      if (this.data.tab === 'upcoming') {
        // upcoming = start time in the future (or now)
        if (startTs < now) continue;
      } else {
        // past = start time in the past
        if (startTs >= now) continue;
      }
  
      out.push(it);
    }
  
    // sort by start ascending
    out.sort(function(a,b){ return new Date(a.start) - new Date(b.start); });
  
    // add dateLabel for display
    for (var k = 0; k < out.length; k++) {
      var ap = out[k];
      ap.dateLabel = formatDateLabel(ap.start);
    }
  
    this.setData({ list: out });
  },
  _showError:function(e, fb){
    var msg = fb || 'Error';
    try{
      var b = e && (e.data||e.body||e.raw||e) || {};
      if (typeof b==='string'){ try{ b=JSON.parse(b); }catch(_){ } }
      msg = b.detail || b.message || b.title || msg;
    }catch(_){}
    this.setData({ err: msg });
    try{ my.showToast({ type:'fail', content: msg }); }catch(_){}
  },

  openDetail: function (e) {
    var id = (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.id)
      ? e.currentTarget.dataset.id
      : '';
    if (!id) return;
    var url = '/pages/appointments/detail/index?id=' + encodeURIComponent(id);
    try { my.navigateTo({ url }); } catch (_) { my.reLaunch({ url }); }
  }
});
