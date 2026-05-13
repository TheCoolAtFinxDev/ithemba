// services/errors.problem.js
// Central ProblemDetails/Validation error normalizer
// IMPORTANT: Never read or rely on any "errorMessage" fields anywhere.

function _unwrap(x){
  // Only consider structured bodies: raw/data/body → body
  // (DO NOT use/forward any errorMessage text)
  if (x && x.data !== undefined) return x.data;
  if (x && x.body !== undefined) return x.body;
  if (x && x.raw  !== undefined) return x.raw;
  return x;
}

function _toObject(x){
  if (!x) return null;
  if (typeof x === 'object') return x;
  if (typeof x === 'string') {
    try { return JSON.parse(x); } catch(_){ return { message: String(x) }; }
  }
  return { message: String(x) };
}

function _collectFieldErrors(bag){
  // Accept either dict { key: [..] } OR array ["msg", ...]
  if (!bag) return [];
  if (Array.isArray(bag)) {
    var arr = [];
    for (var i=0;i<bag.length;i++) arr.push(String(bag[i]));
    return arr;
  }
  var out = [];
  if (typeof bag === 'object') {
    for (var k in bag) if (Object.prototype.hasOwnProperty.call(bag, k)) {
      var v = bag[k];
      if (Array.isArray(v)) {
        for (var j=0;j<v.length;j++) out.push(String(v[j]));
      } else if (v != null) {
        out.push(String(v));
      }
    }
  }
  return out;
}

function parseProblemSafe(data){
  try{
    var body = _toObject(_unwrap(data));
    if (!body) return null;

    var ext = (body && body.extensions) ? body.extensions : {};
    var status = Number((body && body.status) ? body.status : 0) || 0;
    var title  = String((body && (body.title || body.error)) ? (body.title || body.error) : '');
    var detail = String((body && (body.detail || body.Detail)) ? (body.detail || body.Detail) : '');
    var traceId = '';
    if (ext && ext.traceId) traceId = String(ext.traceId);
    else if (body && body.traceId) traceId = String(body.traceId);
    else if (body && body['trace-id']) traceId = String(body['trace-id']);

    var fieldErrors = _collectFieldErrors((body && body.errors) ? body.errors : (ext ? ext.errors : null));

    // Message priority: FIRST field error → detail → message → title
    var msg = '';
    if (fieldErrors.length) msg = String(fieldErrors[0]);
    else if (detail) msg = detail;
    else if (body && typeof body.message === 'string' && body.message) msg = String(body.message);
    else if (title) msg = title;
    else msg = 'Request failed';

    return {
      status: status,
      title: title || (status ? ('Error ' + status) : 'Error'),
      message: msg,
      traceId: traceId || '',
      fieldErrors: fieldErrors.length ? fieldErrors : null
    };
  } catch(_){
    return null;
  }
}

function normalizeHttpError(status, body){
  // If no HTTP status (network/bridge failure), prefer a clean network message,
  // but still try to surface any server-provided body text (NOT errorMessage).
  if (!status || status === 0){
    var raw = _unwrap(body);
    var msg = '';
    if (raw && typeof raw === 'object') {
      if (raw.data && typeof raw.data === 'string') msg = raw.data;
      else if (raw.message && typeof raw.message === 'string') msg = raw.message;
      else if (raw.title && typeof raw.title === 'string') msg = raw.title;
    } else if (typeof raw === 'string') {
      msg = raw;
    }
    return {
      status: 0,
      title: 'Network error',
      message: msg || 'Network error. Please try again.',
      traceId: '',
      fieldErrors: null
    };
  }

  // Try strict ProblemDetails/validation parsing first
  var p = parseProblemSafe(body);
  if (p) {
    if (!p.status && status) p.status = status;
    return p;
  }

  // Fallback by status class (no errorMessage usage)
  var title = 'Error';
  var message = '';
  if (status === 401) { title = 'Unauthorized'; message = 'Please sign in again.'; }
  else if (status === 403) { title = 'Forbidden'; message = 'Access denied.'; }
  else if (status === 404) { title = 'Not found'; message = 'The resource was not found.'; }
  else if (status === 409) { title = 'Conflict'; message = 'Data conflict; try again.'; }
  else if (status >= 500) { title = 'Server error'; message = 'Something went wrong on the server.'; }
  else if (status >= 400) { title = 'Bad request'; message = 'The request could not be processed.'; }

  if (!message && typeof body === 'string') message = String(body);

  return { status: status || 0, title: title, message: message || 'Request failed', traceId: '', fieldErrors: null };
}

module.exports = { normalizeHttpError: normalizeHttpError, parseProblemSafe: parseProblemSafe };
