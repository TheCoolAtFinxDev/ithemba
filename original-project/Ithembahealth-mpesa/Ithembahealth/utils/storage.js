// utils/storage.js
function setJson(key, obj){ try{ my.setStorageSync({ key:key, data: JSON.stringify(obj || null) }); }catch(e){} }
function getJson(key, fallback){
  try{
    var s = my.getStorageSync({ key:key });
    if (!s || typeof s.data !== 'string') return fallback;
    return JSON.parse(s.data);
  }catch(e){ return fallback; }
}
function setBool(key, val){ try{ my.setStorageSync({ key:key, data: val ? 'true' : 'false' }); }catch(e){} }
function getBool(key, fallback){
  try{
    var s = my.getStorageSync({ key:key });
    if (!s || typeof s.data !== 'string') return !!fallback;
    return s.data === 'true';
  }catch(e){ return !!fallback; }
}
module.exports = { setJson:setJson, getJson:getJson, setBool:setBool, getBool:getBool };
