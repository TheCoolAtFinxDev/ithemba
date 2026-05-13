Component({ props:{title:'',actionText:'',onAction:null}, methods:{ go:function(){ this.props.onAction&&this.props.onAction(); } } });
