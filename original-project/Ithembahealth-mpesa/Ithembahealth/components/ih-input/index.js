Component({ props:{label:'',placeholder:'',value:'',password:false,onChange:null}, methods:{ chg:function(e){ this.props.onChange&&this.props.onChange(e.detail.value); } } });
