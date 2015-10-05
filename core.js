
// var root=document.documentElement;
var Registry={};
var prefix="ao-";
var expose=Date.now();
var subscribers = 'aaron-' + expose;
// var stopRepeatAssign = false;
var rcheckType=/^(?:array|object)$/i;
var documentFragment=document.createDocumentFragment();

function noop (argument) {}

var MVVM={};
var VMODELS=MVVM.models={};

MVVM.define=function(name,factory){
	var scope={};

	factory(scope);

	var vm=modelfactory(scope);
	factory(vm);
	vm._id=name;
	return VMODELS[name] =vm;
};

function modelfactory(scope){
	var model={};

	var originalModel={};
	var normalProperty={};
	var accessProperty={};
	// var watchProperty={};

	for(var key in scope){
		parseModel(key,scope[key],originalModel,normalProperty,accessProperty);
	}
	model=Object.defineProperties(model,withValue(accessProperty));

	// for(var name in originalModel){
	// 	model[name]=originalModel[name];
	// }

	model._access=accessProperty;
	model._originalModel=originalModel;
	return model;
}

function withValue(access){
	var description={};
	for(var i in access){
		description[i]={
			get:access[i],
			set:access[i],
			enumerable:true,
			configurable:true
		};
	}
	return description;
}

function parseModel(name,value,originalModel,normalProperty,accessProperty){
	originalModel[name]=value;

	var type=$.type(value);

	if(type=='function'){
		normalProperty[name]=value;
		return;
	}

	if(type=='object'&& typeof type.get=='function'){

	}else{

		accessProperty[name]=createAccessProperty(type,name,value,originalModel);
	}

}

function createAccessProperty(type,name,value,originalModel){
	var access=function(newValue){
		var preValue=originalModel[name];
		if(arguments.length){
			originalModel[name]=newValue;
			noticeHandle(access);
		}else{
			subscriberHandle(access);
			return preValue;
		}
	};
	access[subscribers]=[];

	return access;
}
function noticeHandle(access){
	var list=access[subscribers];

	for(var i=(list.length-1);i>=0;--i){
		list[i].handler(list[i].evaluator.apply(0, list[i].args || []),list[i].element,list[i]);
	}
}
function subscriberHandle(access){
	if(Registry[expose]){
		var list=access[subscribers];
		if(list.indexOf(Registry[expose])<0){
			list.push(Registry[expose]);
		}
	}
}

MVVM.scan=function(item){
	var control=item;
	var model=VMODELS[control.getAttribute(prefix + "controller")];
	control.removeAttribute(prefix + "controller");

	scanAttr(control,model);
};
function scanAttr(control,model){
	var attributes=control.attributes,binding=[],match;

	for(var i=0;i<attributes.length;i++){
		if(attributes[i].specified){
			if(match=attributes[i].name.match(/ao-(\w+)-?(.*)/)){
				var bind={
					type:match[1],
					name:match,
					param:match[2],
					value:attributes[i].value,
					element:control
				};
				binding.push(bind);
			}
		}
	}

	if(binding.length){
		exeBind(binding,model);
	}

	scanChild(control,model);
}
function exeBind(binding,vm){
	$.each(binding,function(index,item){
		bindHandle[item.type](item,vm);
		if(item.name&&item.evaluator){
			item.element.removeAttribute(item.name);
		}
	});
}

function scanChild(control,model){
	var node=control.firstChild;

	while(node){

		switch(node.nodeType){
			case 1:
			scanAttr(node,model);break;
			case 3:
			if(node.data.match(/\{\{(.*?)\}\}/)){
				scanText(node,model);
			}
			break;
		}
		node=node.nextSibling;
	}
}

function scanText(node,model){
    var binding=[],tokens=tokenize(node.data);
    for(var i=0,token;token=tokens[i++];){
    	var textNode=document.createTextNode(token.value);
    	if(token.expr){
    		var bind={
    			type:'text',
				node:textNode,
				nodeType:3,
				value:token.value
    		};
    		binding.push(bind);
    	}
    	documentFragment.appendChild(textNode);
    }
    node.parentNode.replaceChild(documentFragment,node);
    if(binding.length){
		exeBind(binding,model);
	}
}

function tokenize(text){
	var result=[],start=0;

	while(1){

		var preFlag =text.indexOf("{{",start);
		if(preFlag<0){
			break;
		}
		var value=text.slice(start,preFlag);
		if(value){

			result.push({
				value:value,
				expr:false
			});
		}
		start=preFlag+2;
		var lateFlag=text.indexOf("}}",start);
		if(lateFlag<0){
			break;
		}
		value=text.slice(start,lateFlag);
		if(value){

			result.push({
				value:value,
				expr:true
			});
		}
		start=lateFlag+2;
	}
	return result;
}

var bindHandle={
	css:function(data,model){
		parseExprProxy(data.value, model, data);

	},
	click:function(data,model){
		data.type="on";
		parseExprProxy(data.value, model, data);
	},
	text:function(data,model){
		parseExprProxy(data.value, model, data);
	}
};
var bindExe={
	css:function(value,element,data){
		$(element).css(data.param,value);
	},
	on:function(value,element,data){
		// var callback=function(e){
		// 	value.call(noop,e);
		// };
		var fn = data.evaluator;
		var args = data.args;
		var vmodels = data.vmodels;
		var callback = function(e) {
			return fn.apply(0, args).call(this, e);
		};
		element.addEventListener('click',callback,false);

	},
	text:function(value,element,data){
		if (data.nodeType === 3) {
			data.node.data = value;
		} else {
			$(elem).text(val);
		}
	}
};

function parseExprProxy(code,scopes,data){
	parseExpr(code, scopes, data);
	if(data.evaluator){
		data.handler=bindExe[data.type];

		registerHandler(data);
	}
}
function parseExpr(code, scopes, data){
	var modelName='vm'+expose;
	var pre="var "+data.value+"= "+modelName+"."+data.value+";";
	data.args=[scopes];
	// if(data.type=='click'){
	// 	var code = "\nreturn " + data.value + ";";
	// 	var fn=Function.apply(noop,[modelName].concat(pre+code));
	// }else{
		code = "\nreturn " + data.value + ";";
		var fn=Function.apply(noop,[modelName].concat(pre+code));
	// }
	data.evaluator=fn;
}

function registerHandler(data){
	var fn=data.evaluator;
	Registry[expose]=data;
	// MVVM.openComputedCollect = true ;//排除事件处理函数
	fn&&data.handler(fn.apply(0,data.args||[]),data.element,data);
	// MVVM.openComputedCollect = true //排除事件处理函数
	delete Registry[expose]; 
}