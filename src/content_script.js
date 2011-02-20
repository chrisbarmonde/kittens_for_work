//chrome.extension.onConnect.addListener(function(port) {
//	//console.assert(port.name == "kfw");
//	console.log("Connecting!");
//
//	port.onMessage.addListener(function(msg) {
//		if ('images' in msg) {
//			for (var i = 0; i < document.images.length; i++) {
//				document.images[i].src = (typeof msg.images[i] == "string")
//					? msg.images[i]
//					: msg.images[i].src;
//			}
//		}
//	});
//
//	var images = [];
//	for (var i = 0; i < document.images.length; i++)
//	{
//		images.push(document.images[i].src);
//	}
//	port.postMessage({original_images: images});
//	delete images;
//});

blockCSSStyle=document.createElement('style');
blockCSSStyle.setAttribute("type","text/css");
//blockCSSStyle.appendChild(document.createTextNode('@import url("'+chrome.extension.getURL('flashblock.css')+'");'))
blockCSSStyle.appendChild(document.createTextNode('img{	visibility: hidden !important;}'));
document.querySelector('html').appendChild(blockCSSStyle)


var canvas,ctx;


var port = chrome.extension.connect({name: "kfw"});
port.onMessage.addListener(function(msg) {
	if ('result' in msg) {
		if (msg.result) { // Nude pics oh no
			replaceImg(msg.img);
		}
	}
});


function evt(el,type,callback,t){el.addEventListener(type,callback,t)}

function domnodeinserted(e){
	if (e.target.nodeName != 'IMG') return;

	postMessage(e.target);
	//replaceImg(e.target)
	//evt(e.target,'DOMNodeInsertedIntoDocument',monitorEmbed,false) // better to catch it last, immutable event anyway
}

function replaceImg(el) {
	if (el.getAttribute('cloned') || el.getAttribute('clone')) return;

	var img = el.cloneNode();
	img.src = 'http://somehow-someday.com/images/lol.png';
//	img.height = el.height;
//	img.width = el.width;
	img.style.setProperty('visibility', 'visible', 'important');
	img.setAttribute('clone', 'true');

	el.style.setProperty('display', 'none', 'important');
	el.setAttribute('cloned', 'true');
	//el.parentNode.insertBefore(img, el);
	el.parentNode.replaceChild(img, el);
}

function findAllImages() {
	var els = document.querySelectorAll('img');
	for (var i = 0; i < els.length; i++) {
		postMessage(els[i]);
	}
}

var imgid = 0;
var scripts = {};

function postMessage(img) {

	console.log("Checking " + img.src + " [" + img.width + ", " + img.height + "]");
	if (img.width == 0 || img.height == 0) {
		img.style.setProperty('visibility', 'visible', 'important');
		return;
	}

//	$.ajax({
//		url: "//img-to-json.appspot.com/",
//		crossDomain: true,
//		timeout: 10000,
//		data: {url: img.src},
//		dataType: 'jsonp',
//		jsonp: false,
//		jsonpCallback: "checkImage",
//		success: function(data) {
//			console.log("success");
//			console.log(data);
//		},
//		error: function(data) {
//			console.log("error");
//			console.log(data);
//		}
//	});
//
//
//	try {
//
//	} catch(e) {
//		console.log("Cross domain :( " + e);
//		img.style.setProperty('visibility', 'visible', 'important');
//		return;
//	}

	img.id = (img.id) ? img.id : "img-" + (++imgid);

var callback = "checkImage('" + img.id + "')"; 	
// Script container
var script = document.createElement('script');

// Set the URL to the JSONP and then append to document
script.src = "//img-to-json.appspot.com/?url=" + escape(img.src) + "&callback=" + callback;
scripts[img.id] = script;
document.body.appendChild(script);
}

// Callback function
function checkImage(imgid) {
	return function(data) {
		var realimg = document.getElementById(imgid);
		if (!realimg) return;

		console.log('found results for ' + realimg.src);
	  // Create the image and set its src to the data URL
	  var img = new Image();
	  img.src = data.data;

	  // When the image has loaded
	  img.onload = function(){
		// Set its width and height
		img.width = data.width;
		img.height = data.height;

		var canvas = document.getElementById('__kfw_canvas');
		var ctx = canvas.getContext('2d');
		canvas.width = data.width;
		canvas.height = data.height;
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
		var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

		var result = nudejs.scanImage(
			imgData,
			data.width,
			data.height
		);
		console.log(result);

		if (result) {
			realimg.setAttribute('replace', 'true');
		} else {
			realimg.style.setProperty('visibility', 'visible', 'important');
		}
	  };
	}
}

/**/
evt(window,'DOMNodeInsertedIntoDocument',domnodeinserted,false)
evt(window,'load',function(){
	if (document.body){ // will not run on other none document such as XML
		canvas = document.createElement("canvas");
		canvas.style.setProperty('display', 'none');
		canvas.id = '__kfw_canvas';
		document.body.appendChild(canvas);

		// Add nudechecker
		var script = document.createElement('script');
		script.innerHTML = "Array.prototype.remove=function(a){var b=this.slice(a+1);this.length=a;return this.push.apply(this,b)};";
		document.body.appendChild(script);
		var script = document.createElement('script');
		script.innerHTML = "function checkImage(e){return function(a){var b=document.getElementById(e);if(b){console.log('found results for '+b.src);var c=new Image;c.src=a.data;c.onload=function(){c.width=a.width;c.height=a.height;var canvas=document.getElementById('__kfw_canvas');var ctx=canvas.getContext('2d');canvas.width=a.width;canvas.height=a.height;ctx.drawImage(c,0,0,canvas.width,canvas.height);var d=ctx.getImageData(0,0,canvas.width,canvas.height).data;d=nudejs.scanImage(d,a.width,a.height);console.log(d);d?b.setAttribute('replace','true'):b.style.setProperty('visibility','visible','important')}}}};";
		document.body.appendChild(script);
		var script = document.createElement('script');
		script.innerHTML = "(function() {var NudeChecker=function(){return;};NudeChecker.prototype={reset:function(){this.skinRegions=[];this.skinMap=[];this.lastTo=this.lastFrom=-1;this.mergeRegions=[];this.detectedRegions=[]},scanImage:function(b,a,c){this.reset();for(var e=b.length,d=0,g=1;d<e;d+=4,g++){var f=g>a?g%a-1:g,h=g>a?Math.ceil(g/a)-1:1;if(this.classifySkin(b[d],b[d+1],b[d+2])){this.skinMap.push({id:g,skin:true,region:0,x:f,y:h,checked:false});f=-1;h=[g-2,g-a-2,g-a-1,g-a];for(var k=false,j=0;j<4;j++){var i=h[j];if(this.skinMap[i]&&this.skinMap[i].skin){this.skinMap[i].region!=f&&f!=-1&&this.lastFrom!=f&&this.lastTo!=this.skinMap[i].region&&this.addMerge(f,this.skinMap[i].region);f=this.skinMap[i].region;k=true}}if(k){if(f>-1){this.detectedRegions[f]||(this.detectedRegions[f]=[]);this.skinMap[g-1].region=f;this.detectedRegions[f].push(this.skinMap[g-1])}}else{this.skinMap[g-1].region=this.detectedRegions.length;this.detectedRegions.push([this.skinMap[g-1]])}}else this.skinMap.push({id:g,skin:false,region:0,x:f,y:h,checked:false})}this.merge();return this.analyseRegions(a,c)},addMerge:function(b,a){this.lastFrom=b;this.lastTo=a;for(var c=this.mergeRegions.length,e=-1,d=-1;c--;)for(var g=this.mergeRegions[c],f=g.length;f--;){if(g[f]==b)e=c;if(g[f]==a)d=c}if(!(e!=-1&&d!=-1&&e==d))if(e==-1&&d==-1)this.mergeRegions.push([b,a]);else if(e!=-1&&d==-1)this.mergeRegions[e].push(a);else if(e==-1&&d!=-1)this.mergeRegions[d].push(b);else if(e!=-1&&d!=-1&&e!=d){this.mergeRegions[e]=this.mergeRegions[e].concat(this.mergeRegions[d]);this.mergeRegions.remove(d)}},merge:function(){for(var b=this.mergeRegions.length,a=[];b--;){var c=this.mergeRegions[b],e=c.length;for(a[b]||(a[b]=[]);e--;){var d=c[e];a[b]=a[b].concat(this.detectedRegions[d]);this.detectedRegions[d]=[]}}for(b=this.detectedRegions.length;b--;)this.detectedRegions[b].length>0&&a.push(this.detectedRegions[b]);this.clearRegions(a)},clearRegions:function(b){for(var a=b.length,c=0;c<a;c++)b[c].length>30&&this.skinRegions.push(b[c])},analyseRegions:function(b,a){var c=this.skinRegions.length,e=b*a,d=0;if(c<3){console.log('Not nude: less than 3 regions ('+c+')');return false}for(function(){for(var g=false;!g;){g=true;for(var f=0;f<c-1;f++)if(this.skinRegions[f].length<this.skinRegions[f+1].length){g=false;var h=this.skinRegions[f];this.skinRegions[f]=this.skinRegions[f+1];this.skinRegions[f+1]=h}}}.bind(this)();c--;)d+=this.skinRegions[c].length;if(d/e*100<15){console.log('it is not nude :) - total skin percent is '+d/e*100+'% ');return false}if(this.skinRegions[0].length/d*100<35&&this.skinRegions[1].length/d*100<30&&this.skinRegions[2].length/d*100<30){console.log('it is not nude :) - less than 35%,30%,30% skin in the biggest areas :'+this.skinRegions[0].length/d*100+'%, '+this.skinRegions[1].length/d*100+'%, '+this.skinRegions[2].length/d*100+'%');return false}if(this.skinRegions[0].length/d*100<45){console.log('it is not nude :) - the biggest region contains less than 45%: '+this.skinRegions[0].length/d*100+'%');return false}if(this.skinRegions.length>60){console.log('it is not nude :) - more than 60 skin regions');return false}return true},classifySkin:function(b,a,c){var e=b>95&&a>40&&a<100&&c>20&&Math.max(b,a,c)-Math.min(b,a,c)>15&&Math.abs(b-a)>15&&b>a&&b>c,d=this.toNormalizedRgb(b,a,c);d=d[0]/d[1]>1.185&&b*c/Math.pow(b+a+c,2)>0.107&&b*a/Math.pow(b+a+c,2)>0.112;a=this.toHsvTest(b,a,c);b=a[0];a=a[1];b=b>0&&b<35&&a>0.23&&a<0.68;return e||d||b},toYcc:function(b,a,c){b/=255;a/=255;c/=255;a=0.299*b+0.587*a+0.114*c;return[a,b-a,c-a]},toHsv:function(b,a,c){return[Math.acos(0.5*(b-a+(b-c))/Math.sqrt(Math.pow(b-a,2)+(b-c)*(a-c))),1-3*(Math.min(b,a,c)/(b+a+c)),1/3*(b+a+c)]},toHsvTest:function(b,a,c){var e=0;e=Math.max(b,a,c);var d=e-Math.min(b,a,c);e=e==b?(a-c)/d:e==a?2+(a-b)/d:4+(b-a)/d;e*=60;if(e<0)e+=360;return[e,1-3*(Math.min(b,a,c)/(b+a+c)),1/3*(b+a+c)]},toNormalizedRgb:function(b,a,c){var e=b+a+c;return[b/e,a/e,c/e]}};window.nudejs=new NudeChecker;})();";
		document.body.appendChild(script);

		findAllImages();
		setInterval(function() {
			var r = document.querySelectorAll('img[replace]');
			for (var i = 0; i < r.length; i++) {
				replaceImg(r[i]);
			}
		}, 1000);
		//setTimeout(handleAllEmbeds,100)
//		document.body.addEventListener('load',function(){
//			handleAllEmbeds()
//		},true)
	}else{
		//console.log(location)
	}
},true)








/*
 * Nude.js - Nudity detection with Javascript and HTMLCanvas
 *
 * Author: Patrick Wied ( http://www.patrick-wied.at )
 * Version: 0.1  (2010-11-21)
 * License: MIT License
 */

Array.prototype.remove = function(index) {
	  var rest = this.slice(index + 1);
	  this.length = index;
	  return this.push.apply(this, rest);
};

// From Prototype.js, modified slightly
Function.prototype.bind = function(context) {
		if (arguments.length < 2 && typeof arguments[0] === "undefined") return this;
		var __method = this, args = Array.prototype.slice.call(arguments).slice(1);
		return function() {
				var a = args.concat(Array.prototype.slice.call(arguments));
				return __method.apply(context, a);
		}
}


