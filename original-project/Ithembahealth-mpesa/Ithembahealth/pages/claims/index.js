Page({
  data:{items:[]},
  onShow:function(){
    // TODO: fetch /api/v1/claims/list
    this.setData({ items:[
      {id:'c1', clinic:'City Clinic', amount:'M 350.00', date:'2025-10-30', status:'Approved'}
    ]});
  },
  open:function(e){ var id=e.currentTarget.dataset.id; my.navigateTo({url:'/pages/claims/detail?id='+encodeURIComponent(id)}); }
});