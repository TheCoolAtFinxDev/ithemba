// services/time.sa.js
// South Africa time utils (UTC+02:00), device-agnostic

var SA_OFFSET_MIN = 120;

function two(n){ return (n < 10 ? '0' : '') + n; }
function clampInt(x){ return (x|0); }

function _ms(iso){
  // robust parse for ISO (Z or with offset)
  // Date.parse returns ms since epoch (UTC)
  try { return Date.parse(String(iso)); } catch(_){ return NaN; }
}

function _partsFromMsWithOffset(ms, offsetMin){
  // Shift by offset (minutes) then read via getUTC*
  var d = new Date(ms + offsetMin*60000);
  return {
    Y: d.getUTCFullYear(),
    M: d.getUTCMonth() + 1,
    D: d.getUTCDate(),
    h: d.getUTCHours(),
    m: d.getUTCMinutes(),
    s: d.getUTCSeconds()
  };
}

// Build SA ISO (+02:00) from date 'YYYY-MM-DD' and time 'HH:mm'
function makeSaIsoFromLocalParts(dateYmd, timeHm){
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateYmd||''));
  var t = /^(\d{2}):(\d{2})$/.exec(String(timeHm||''));
  if (!m || !t) return '';
  var Y = m[1], MM = m[2], DD = m[3], HH = t[1], MI = t[2];
  return Y + '-' + MM + '-' + DD + 'T' + HH + ':' + MI + ':00+02:00';
}

// Add minutes, preserving the +02:00 offset in the output string
function addMinutesSaIso(saIso, minutes){
  var ms = _ms(saIso);
  if (isNaN(ms)) return '';
  var end = new Date(ms + clampInt(minutes)*60000);
  return end.getFullYear() + '-' + two(end.getMonth()+1) + '-' + two(end.getDate()) + 'T' +
         two(end.getHours()) + ':' + two(end.getMinutes()) + ':00+02:00';
}

// Convert any ISO (Z or with offset) to a display label in SA time: 'HH:mm'
function toSaLabel(iso){
  var ms = _ms(iso);
  if (isNaN(ms)) return '';
  var p = _partsFromMsWithOffset(ms, SA_OFFSET_MIN);
  return two(p.h) + ':' + two(p.m);
}

// Is the given ISO in the past relative to *now* (SA clock)?
function isPastSa(iso){
  var ms = _ms(iso);
  if (isNaN(ms)) return true;
  var nowUtcMs = Date.now();
  // Compare in absolute time (UTC); SA offset same on both sides, so direct compare works
  return ms <= nowUtcMs;
}

// Build a booking window in SA with +02:00 strings
function buildSaWindow(dateYmd, timeHm, durationMin){
  var startIso = makeSaIsoFromLocalParts(dateYmd, timeHm);
  if (!startIso) return { start:'', end:'' };
  var endIso = addMinutesSaIso(startIso, durationMin);
  return { start: startIso, end: endIso || startIso };
}

module.exports = {
  makeSaIsoFromLocalParts: makeSaIsoFromLocalParts,
  addMinutesSaIso: addMinutesSaIso,
  toSaLabel: toSaLabel,
  isPastSa: isPastSa,
  buildSaWindow: buildSaWindow
};
