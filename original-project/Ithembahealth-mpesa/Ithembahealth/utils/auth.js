// utils/auth.js
var http = require('./http.js');
var Errs = require('../services/errors.problem.js');
var normErr = (Errs && typeof Errs.normalizeHttpError === 'function')
  ? Errs.normalizeHttpError
  : function (s,b){ return { status:s||0, title:'Error', message:'Request failed' }; };

var app  = getApp();
var KEY_AT = 'ih_at';
var KEY_RT = 'ih_rt';

function saveTokens(at, rt){ try { my.setStorageSync({ key: KEY_AT, data: String(at || '') }); } catch(e){} try { my.setStorageSync({ key: KEY_RT, data: String(rt || '') }); } catch(e){} }
function getAT(){ try { return my.getStorageSync({ key: KEY_AT }).data || ''; } catch(e){ return ''; } }
function getRT(){ try { return my.getStorageSync({ key: KEY_RT }).data || ''; } catch(e){ return ''; } }
function clearTokens(){ saveTokens('', ''); }

function base(){ var b = (app && app.globalData && app.globalData.apiBase) ? app.globalData.apiBase : ''; return b.replace(/\/+$/,''); }
function safeJson(x){ if (x==null) return null; if (typeof x==='object') return x; if (typeof x==='string'){ try{return JSON.parse(x);}catch(_){return null;} } return null; }

function login(phone, password){
  var url = base() + '/api/v1/login';
  return http.postJson(url, { phoneNumber: phone, password: password })
    .then(function(res){
      if (res.status>=200 && res.status<300) {
        var body = safeJson(res.data);
        if (body && body.accessToken) { saveTokens(body.accessToken, body.refreshToken || ''); return { ok:true, data: body }; }
        return { ok:false, error: 'Login succeeded without tokens' };
      }
      var n = normErr(res.status, res.data);
      return { ok:false, error: n.message || n.title || ('Login failed ('+res.status+')') };
    })
    .catch(function(err){
      if (err && typeof err.status !== 'undefined') {
        var n = (err.title || err.message) ? err : normErr(err.status, err.data || err.raw || null);
        return { ok:false, error: n.message || n.title || 'Network error' };
      }
      return { ok:false, error:(err && (err.errorMessage||err.message)) || 'Network error' };
    });
}

function register(phone, password){
  var url = base() + '/api/v1/register';
  return http.postJson(url, { phoneNumber: phone, password: password })
    .then(function(res){
      if (res.status>=200 && res.status<300) {
        var body = safeJson(res.data);
        if (body && body.accessToken) { saveTokens(body.accessToken, body.refreshToken || ''); }
        return { ok:true, data: body || {} };
      }
      var n = normErr(res.status, res.data);
      return { ok:false, error: n.message || n.title || ('Registration failed ('+res.status+')') };
    })
    .catch(function(err){
      if (err && typeof err.status !== 'undefined') {
        var n = (err.title || err.message) ? err : normErr(err.status, err.data || err.raw || null);
        return { ok:false, error: n.message || n.title || 'Network error' };
      }
      return { ok:false, error:(err && (err.errorMessage||err.message)) || 'Network error' };
    });
}

function refreshIfNeeded(){
  var rt = getRT(); if (!rt) return Promise.resolve();
  var url = base() + '/api/v1/refresh';
  return http.postJson(url, { refreshToken: rt })
    .then(function(res){
      if (res.status>=200 && res.status<300) {
        var body = safeJson(res.data);
        if (body && body.accessToken) saveTokens(body.accessToken, body.refreshToken || rt);
      } else {
        try { var n = normErr(res.status, res.data); console.warn('[auth.refresh] non-2xx:', n.title, n.message); } catch(_) {}
      }
    })
    .catch(function(err){
      try {
        if (err && typeof err.status !== 'undefined') {
          var n = (err.title || err.message) ? err : normErr(err.status, err.data || err.raw || null);
          console.warn('[auth.refresh] failed:', n.title, n.message);
        }
      } catch(_) {}
    });
}

function getUserInfo(){ var at=getAT(); var hdr= at?{ Authorization:'Bearer '+at }:{}; return http.get(base() + '/api/v1/manage/info', hdr); }

module.exports = { login, register, refreshIfNeeded, getUserInfo, clearTokens };
