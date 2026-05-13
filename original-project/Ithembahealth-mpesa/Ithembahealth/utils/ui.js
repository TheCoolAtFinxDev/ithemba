function toastOk(m){ my.showToast({type:'success',content:m||'Done'}); }
function toastFail(m){ my.showToast({type:'fail',content:m||'Failed'}); }
function alert(t,c){ my.alert({title:t||'Notice',content:c||''}); }
module.exports={toastOk:toastOk,toastFail:toastFail,alert:alert};