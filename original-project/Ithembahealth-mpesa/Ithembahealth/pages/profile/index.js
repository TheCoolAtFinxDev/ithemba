
var auth=require('../../utils/auth.js');
Page({
  data:{ u:{}, nameDisplay:'-', phoneDisplay:'-', roleDisplay:'Patient' },
  onShow:function(){
    var self=this;
    auth.refreshIfNeeded()
      .then(function(){ return auth.getUserInfo(); })
      .then(function(r){
        var d=(r&&r.data)?((typeof r.data==='string')?JSON.parse(r.data):r.data):{};
        var name=(d && (d.fullName || d.nickname || d.name)) ? (d.fullName || d.nickname || d.name) : '-';
        var phone=(d && d.phoneNumber) ? d.phoneNumber : '-';
        var role=(d && d.role) ? d.role : 'Patient';
        self.setData({ u:d||{}, nameDisplay:name, phoneDisplay:phone, roleDisplay:role });
      })
      .catch(function(){
        self.setData({ u:{}, nameDisplay:'-', phoneDisplay:'-', roleDisplay:'Patient' });
      });
  },
  edit:function(){ my.alert({title:'Edit',content:'TODO: edit profile'}); },
  home:function(){ my.reLaunch({url:'/pages/home/index'}); }
});
