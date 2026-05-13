
// utils/kyc.js
function _can(name){
  try { if (typeof my.canIUse === 'function' && my.canIUse(name)) return true; } catch(_){}
  return typeof my[name] === 'function';
}
function _sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }

function getAuthCodeSafe(scopes){
  scopes = scopes && scopes.length ? scopes : ['auth_user'];
  if (!_can('getAuthCode')) return Promise.resolve({ ok:true });
  var attempts = 2, delay = 200;
  function once(){
    return new Promise(function(resolve){
      try {
        my.getAuthCode({
          scopes: scopes,
          success: function(res){ resolve({ ok:true, authCode: res && res.authCode }); },
          fail: function(e){ resolve({ ok:false, error: (e && (e.errorMessage||e.message||e.error)) || 'getAuthCode failed' }); },
          complete: function(){}
        });
      } catch (err) { resolve({ ok:false, error: (err && err.message) || 'getAuthCode exception' }); }
    });
  }
  return once().then(function(r){ if (r.ok || attempts<=1) return r; return new Promise(function(rs){ setTimeout(function(){ once().then(rs); }, delay); }); });
}

function _normalize(resp) {
  var out = { success: false, data: null, error: null };
  try {
    var raw = resp;
    if (raw && raw.data && typeof raw.data === 'object') raw = raw.data;
    if (raw && typeof raw.response === 'string') { try { raw = JSON.parse(raw.response); } catch(_){} }
    var d = {};
    if (raw) {
      d.phone     = raw.phone || raw.msisdn || raw.mobile || raw.phoneNumber || '';
      d.firstName = raw.firstName || raw.givenName || raw.nameFirst || '';
      d.lastName  = raw.lastName  || raw.surname  || raw.nameLast  || '';
      d.fullName  = raw.fullName  || raw.name     || ((d.firstName||'') + (d.lastName?(' '+d.lastName):''));
      d.idNumber  = raw.idNumber  || raw.nationalId || raw.documentNumber || '';
      d.dob       = raw.dateOfBirth || raw.dob || '';
      d.avatar    = raw.avatar || raw.avatarUrl || '';
      d.kycLevel  = raw.kycLevel || raw.kyc_status || raw.kycStatus || '';
      d.address   = raw.address || '';
      d.email     = raw.email || '';
    }
    out.success = true; out.data = d; return out;
  } catch (e) { out.error = (e && e.message) || 'normalize failed'; return out; }
}

function fetchCustomerKYC() {
  return new Promise(function(resolve){
    if (_can('fetchCustomerKYC')) {
      try {
        return my.fetchCustomerKYC({
          success: function(r){ resolve(_normalize(r)); },
          fail: function(e){ resolve({ success:false, error: (e && (e.errorMessage||e.message||e.error)) || 'KYC failed' }); },
          complete: function(){}
        });
      } catch(e){ /* fallthrough */ }
    }
    try {
      if (typeof my.call === 'function') {
        return my.call('fetchCustomerKYC', {}, function(r){ resolve(_normalize(r)); });
      }
    } catch(e){}
    try {
      if (typeof my.call === 'function') {
        return my.call('openAPIBridge', { action: 'fetchCustomerKYC' }, function(r){ resolve(_normalize(r)); });
      }
    } catch(e){}
    resolve({ success:false, error:'fetchCustomerKYC not available in this container' });
  });
}
function _can(name){
  try { if (typeof my.canIUse === 'function' && my.canIUse(name)) return true; } catch(_) {}
  return typeof my[name] === 'function';
}

function isAuthCodeAvailable(){ return _can('getAuthCode'); }
function isKycAvailable(){
  if (_can('fetchCustomerKYC')) return true;
  // Some containers expose via my.call('fetchCustomerKYC', …)
  return typeof my.call === 'function';
}



// export them
module.exports = {
  getAuthCodeSafe: getAuthCodeSafe,  // you already have this
  fetchCustomerKYC: fetchCustomerKYC,
  isAuthCodeAvailable: isAuthCodeAvailable,
  isKycAvailable: isKycAvailable
};