Component({
  props:{ type:'primary', text:'', loading:false, disabled:false, onTap:null },
  data:{ t:'btn-primary' },
  didMount:function(){ this.sync(); }, didUpdate:function(){ this.sync(); },
  methods:{
    sync:function(){ var m={primary:'btn-primary',outline:'btn-outline',link:'btn-link'}; this.setData({t:m[this.props.type||'primary']}); },
    tap:function(){ this.props.onTap&&this.props.onTap(); }
  }
});
