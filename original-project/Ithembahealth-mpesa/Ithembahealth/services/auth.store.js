// services/auth.store.js
// (Additive only) — original token helpers kept as-is, plus patientId helpers.

var AT_KEY  = 'ih_at';
var RT_KEY  = 'ih_rt';
var PID_KEY = 'ih_patientId'; // NEW

/* -------------------- Tokens (unchanged) -------------------- */
function getAccessToken() {
  try { var r = my.getStorageSync({ key: AT_KEY }); return (r && r.data) ? r.data : null; } catch (e) { return null; }
}
function getRefreshToken() {
  try { var r = my.getStorageSync({ key: RT_KEY }); return (r && r.data) ? r.data : null; } catch (e) { return null; }
}
function setAccessToken(t) {
  try { my.setStorageSync({ key: AT_KEY, data: String(t || '') }); } catch (e) {}
}
function setRefreshToken(t) {
  try { my.setStorageSync({ key: RT_KEY, data: String(t || '') }); } catch (e) {}
}
function clearTokens() {
  try { my.removeStorageSync({ key: AT_KEY }); } catch (e) {}
  try { my.removeStorageSync({ key: RT_KEY }); } catch (e) {}
}

/* -------------------- Patient Id (NEW) -------------------- */

// Get stored patient id (used by bookings to call /patients/{id}/appointments)
function getPatientId() {
  try { var r = my.getStorageSync({ key: PID_KEY }); return (r && r.data) ? String(r.data) : ''; } catch (e) { return ''; }
}

// Persist patient id explicitly
function setPatientId(id) {
  try { if (id) my.setStorageSync({ key: PID_KEY, data: String(id) }); } catch (e) {}
}

// Remove stored patient id (e.g., on logout)
function clearPatientId() {
  try { my.removeStorageSync({ key: PID_KEY }); } catch (e) {}
}

/**
 * Try to read patient id from known places and persist it if found.
 * - If an explicit object is passed (e.g., login response), we check common fields.
 * - Otherwise we decode the current access token (JWT) to look for patientId/sub.
 */
function ensurePatientIdKnown(possibleBody) {
  // 1) Use explicit body fields if present
  try {
    if (possibleBody) {
      var pid = possibleBody.patientId
             || (possibleBody.profile && possibleBody.profile.patientId)
             || (possibleBody.user     && possibleBody.user.patientId)
             || '';
      if (pid) { setPatientId(pid); return getPatientId(); }
    }
  } catch (_) {}

  // 2) Try to derive from JWT in storage
  try {
    var at = getAccessToken();
    var claimPid = _extractPatientIdFromJwt(at);
    if (claimPid) { setPatientId(claimPid); return claimPid; }
  } catch (_) {}

  return getPatientId(); // may be empty string
}

/* -------------------- Roles / Admin helpers (NEW) -------------------- */

/**
 * Decode the current access token (JWT) and return an array of roles.
 * Tries common claim names used by ASP.NET Identity and JWTs.
 */
function getUserRoles() {
  try {
    var at = getAccessToken();
    if (!at || typeof at !== 'string') return [];
    var parts = at.split('.');
    if (parts.length < 2) return [];
    var b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) b64 += '=';
    var jsonStr = _b64Decode(b64);
    var obj = JSON.parse(jsonStr || '{}');

    // Common role claim keys
    var roles = obj.role
             || obj.roles
             || obj['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

    if (!roles) return [];
    if (Array.isArray(roles)) return roles.map(function (r) { return String(r); });

    // Some token issuers put a single string here
    return [String(roles)];
  } catch (_) {
    return [];
  }
}

/**
 * Convenience helper: true if user is an admin (any role containing "admin").
 */
function isAdmin() {
  var rs = getUserRoles();
  for (var i = 0; i < rs.length; i++) {
    var slug = String(rs[i] || '').toLowerCase();
    if (!slug) continue;
    if (slug === 'admin' || slug === 'administrator' || slug.indexOf('admin') >= 0) return true;
  }
  return false;
}

/* -------------------- Internal helpers (NEW) -------------------- */

// Best-effort JWT decode to read `patientId` or `sub`
function _extractPatientIdFromJwt(jwt) {
  try {
    if (!jwt || typeof jwt !== 'string') return '';
    var parts = jwt.split('.');
    if (parts.length < 2) return '';
    var b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    // pad base64 if needed
    while (b64.length % 4 !== 0) b64 += '=';
    var jsonStr = _b64Decode(b64);
    var obj = JSON.parse(jsonStr || '{}');
    // prefer explicit claim if your API issues one
    return String(obj.patientId || obj.pid || obj.sub || '') || '';
  } catch (_) { return ''; }
}

// Small base64 decoder with atob fallback
function _b64Decode(b64) {
  try {
    // atob exists in most mini-app runtimes
    /* eslint-disable no-undef */
    return decodeURIComponent(escape(atob(b64)));
  } catch (_) {
    // Last resort: manual decode (limited) — return empty on failure
    return '';
  }
}

/* -------------------- Exports -------------------- */
module.exports = {
  // original exports
  getAccessToken: getAccessToken,
  getRefreshToken: getRefreshToken,
  setAccessToken: setAccessToken,
  setRefreshToken: setRefreshToken,
  clearTokens: clearTokens,

  // patient id helpers
  getPatientId: getPatientId,
  setPatientId: setPatientId,
  clearPatientId: clearPatientId,
  ensurePatientIdKnown: ensurePatientIdKnown,

  // role / admin helpers
  getUserRoles: getUserRoles,
  isAdmin: isAdmin
};
