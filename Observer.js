!function(o){
	if( typeof module==='object' || typeof require==='function'){
		module.export=o;
	}else{
		this.aaObserve=o;
	}
}((function(){

	var nativeEach=Array.prototype.forEach;
	function each(obj,fn,context){
		if(obj===null) return;
		if(nativeEach&&obj.forEach===nativeEach){
			obj.forEach(fn,context);
		}else if(obj.length===+obj.length){
			for(var i=0,item=obj[i];i<obj.length;i++){
				fn.call(context,item,i,obj);
			}
		}
	}
	function bind(event,fn){
		var events=this.events=this.events||{};
		var parts=event.split(/\s+/);
		each(parts,function(item){
			events[item]=events[item]||[];
			events[item].push(fn);
		},this);
		return this;
	}
	function once(event,fn){
		this.subscribe(event,function fnc(){
			fn.apply(this,[].slice.call(arguments));
			this.remove(event,fnc);
		});
		return this;
	}
	function unbind(event,fn){
		var events=this.events;
		var parts=event.split(/\s+/);
		if(!events) return;
		each(parts,function(item){
			if(events[item]&&events[item].indexOf(fn)>=0){
				events[item].splice(events[item].indexOf(fn),1); 
				if(events[item].length==0){
					delete events[item];
				}
			}
		});
		return this;
	}
	function trigger(event){
		var events=this.events;
		// var parts=event.split(/\s+/);
		var args=[].slice.call(arguments,1);
		if(!events||event in events ===false) return;

		for(var i=0;i<events[event].length;i++){
			events[event][i].apply(this,args);
		}
		return this;
	}
	return function(){
		this.subscribe=bind;
		this.remove=unbind;
		this.publish=trigger;
		this.one=once;
		return this;
	}
})())