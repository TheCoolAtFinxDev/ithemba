// utils/http.js

function assertString(v, name){ if(typeof v !== 'string' || !v) throw new Error(name+' must be a non-empty string'); }

function normalizeHeaders(h){
  var out = {};
  if (!h) return out;
  for (var k in h) if (Object.prototype.hasOwnProperty.call(h,k)) {
    var val = h[k];
    if (val == null) continue;
    out[String(k).toLowerCase()] = String(val);
  }
  return out;
}

function request(opts){
  if (!opts || typeof opts !== 'object') throw new Error('options must be object');

  assertString(opts.url, 'url');
  if (opts.url.indexOf('https://') !== 0) throw new Error('url must be https');

  var method   = String(opts.method || 'GET').toUpperCase();
  var data     = (opts.data === undefined ? {} : opts.data);
  var headers  = normalizeHeaders(opts.headers);
  var timeout  = (typeof opts.timeout === 'number' && opts.timeout > 0) ? opts.timeout : 20000;
  var dataType = (opts.dataType === 'json' || opts.dataType === 'text') ? opts.dataType : 'json';

  if (method !== 'GET' && !headers['content-type']) headers['content-type'] = 'application/json';
  if (!headers['accept']) headers['accept'] = 'application/json';

  return new Promise(function(resolve, reject){
    my.request({
      url: opts.url,
      method: method,
      data: data,
      headers: headers,
      timeout: timeout,
      dataType: dataType,
      success: function(res){
        var s = Number((res && (res.status || res.statusCode)) ? (res.status || res.statusCode) : 0);
        if (s >= 400) {
          var d = null;
          if (res && res.data) d = res.data;
          else if (res && res.body) d = res.body;
          return reject({ status: s, data: d, raw: res });
        }
        resolve(res);
      },
      fail: function(e){
        var st = (e && typeof e.status !== 'undefined') ? e.status : 0;
        var d  = null;
        if (e && e.data) d = e.data;
        else if (e && e.body) d = e.body;
        // IMPORTANT: ignore anything like errorMessage; pass only status/data/raw
        reject({ status: st, data: d, raw: e });
      }
    });
  });
}

function get(url, headers){ return request({ url: url, method: 'GET', headers: headers }); }
function getJson(url, headers){ return request({ url: url, method: 'GET', headers: headers }); }
function postJson(url, body, headers){
  var h = normalizeHeaders(headers); h['content-type'] = 'application/json';
  return request({ url: url, method: 'POST', data: (body || {}), headers: h, dataType: 'json' });
}

module.exports = { request: request, get: get, getJson: getJson, postJson: postJson };
