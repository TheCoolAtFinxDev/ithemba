Component({ props:{ title:'' , onRight:null }, methods:{ onRight:function(){ this.props.onRight&&this.props.onRight(); } } });
