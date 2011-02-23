Function.prototype.bind = function (a)
{
	if (arguments.length < 2 && typeof arguments[0] === 'undefined') return this;
	var b = this,
		c = Array.prototype.slice.call(arguments).slice(1);
	return function ()
	{
		var d = c.concat(Array.prototype.slice.call(arguments));
		return b.apply(a, d)
	}
};

function log(msg)
{
	console.log(msg);
}


var ContentScript = Class.extend({
	init: function(as_content_script)
	{
		this.as_content_script = !!as_content_script;
		if (this.as_content_script)
		{
			this.injectCSS();
			this.connectToBackground();
			this.addListeners();
		}

		this.nudejs = new NudeChecker();

		// Hidden Canvas element to get image pixel data
		this.canvas = null;

		// List of images on the page (to weed out dupes, etc)
		this.imgs = {};

		// List of images that have been scanned by nude.js and don't need to be scanned again.
		this.scanned = {};

		// Image counter to give each image a unique id, if necessary
		this.imgid = 0;
	},

	injectCSS: function()
	{
		var css = document.createElement('style');
		css.setAttribute("type","text/css");
		//blockCSSStyle.appendChild(document.createTextNode('@import url("'+chrome.extension.getURL('flashblock.css')+'");'))
		css.appendChild(document.createTextNode('img{ visibility: hidden !important; }'));
		document.querySelector('html').appendChild(css);
	},

	injectCanvas: function()
	{
		this.canvas = document.createElement('canvas');
		this.canvas.style.setProperty('display', 'none');
		this.canvas.id = '__kfw_canvas';
		document.body.appendChild(this.canvas);
	},

	connectToBackground: function()
	{
		this.port = chrome.extension.connect({name: "kfw"});
		this.port.onMessage.addListener(function(msg) {
			if ('scan_result' in msg) {
				log("Found scan result for " + msg.scan_result.id);
				var img = document.getElementById(msg.scan_result.id);
				if (msg.scan_result.result)
				{
					this.replaceImage(img);
				}
				else
				{
					img.style.setProperty('visibility', 'visible', 'important');
				}
			}
		}.bind(this));
	},

	addListeners: function()
	{
		// From Flashblock
		window.addEventListener('DOMNodeInsertedIntoDocument', this.domnodeinserted.bind(this), false);
		window.addEventListener('load', function() {
			// will not run on other none document such as XML
			if (document.body)
			{
				this.injectCanvas();
				this.findAllImages();
			}
		}.bind(this),true);
	},

	domnodeinserted: function(e)
	{
		if (e.target.nodeName != 'IMG') return;
		this.checkImage(e.target);
	},

	replaceImage: function(element)
	{
		if (!element.src) return;

		var to_replace = [];
		if (!(element.src in this.imgs)) {
			log(element.src + " not in imgs??");
			to_replace = [element];
		} else {
			to_replace = this.imgs[element.src];
		}
		
		for (var i = 0; i < to_replace.length; i++)
		{
			var el = to_replace[i];

			// If it's a cloned image, ignore it
			if (el.getAttribute('cloned') || el.getAttribute('clone')) continue;

			// Generate a clone of the image on the page to copy all its styling/sizing
			// All we're going to modify is the URL and then make it visible.
			var img = el.cloneNode();
			img.src = 'http://somehow-someday.com/images/lol.png';
			img.onload = function() {
				img.width = el.width;
				img.height = el.height;
				img.style.setProperty('visibility', 'visible', 'important');
				img.setAttribute('clone', 'true');

				el.style.setProperty('display', 'none', 'important');
				el.setAttribute('cloned', 'true');
				//el.parentNode.insertBefore(img, el);
				el.parentNode.replaceChild(img, el);
			}
		}
	},

	findAllImages: function() {
		//$('img').live('load', this.checkImage.bind(this));
		var els = document.querySelectorAll('img');
		for (var i = 0; i < els.length; i++) {
			this.checkImage(els[i]);
		}
	},

	checkImage: function(img)
	{
		// Don't scan the image if we already have a copy of it somewhere
		if (!(img.src in this.imgs)) {
			this.imgs[img.src] = [];
		}
		this.imgs[img.src].push(img);

		// If we already have results, process the image
		if (img.src in this.scanned)
		{
			// Replace it if it's bad, otherwise show it
			if (this.scanned[img.src])
			{
				this.replaceImage(img);
			}
			else
			{
				img.style.setProperty('visibility', 'visible', 'important');
			}
			return;
		}

		log("Checking " + img.src + " [" + img.width + ", " + img.height + "]");
		
		// If the image hasn't loaded or something somehow, just ignore it
		if (img.width == 0 || img.height == 0) {
			img.style.setProperty('visibility', 'visible', 'important');
			return;
		}

		// Give it an id if it doesn't have one
		img.id = (img.id) ? img.id : "img-" + (++this.imgid);
		this.scanImage(img);
	},

	scanImage: function(img)
	{
		console.log("Getting context");
		var ctx = this.canvas.getContext('2d');
		this.canvas.width = img.width;
		this.canvas.height = img.height;

		console.log("Drawing image");
		ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);

		try
		{
			console.log("Getting image data");
			var imgData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
		}
		catch (e)
		{
			log(e);
			if (this.as_content_script)
			{
				log("Failed, handling cross-domain image");
				if (!this.handleCrossDomain(img))
				{
					img.style.setProperty('visibility', 'visible', 'important');
				}
			}
			else
			{
				log("Failed, not handling error.");
				img.style.setProperty('visibility', 'visible', 'important');
			}
			return;
		}

		console.log("Scanning image");
		var result = this.nudejs.scanImage(
			imgData,
			this.canvas.width,
			this.canvas.height
		);

		log(result);
		if (this.as_content_script)
		{
			this.scanned[img.src] = result;

			if (result) {
				this.replaceImage(img);
			} else {
				img.style.setProperty('visibility', 'visible', 'important');
			}
		}

		return result;
	},

	handleCrossDomain: function(img)
	{
		if (img.src.substring(0,5) == 'data:') return false;

		this.port.postMessage({
			scan: {
				id: img.id,
				src: img.src,
				width: img.width,
				height: img.height
			}
		});

		return true;
		/*** JSONP ***/
//		// Script container
//		var script = document.createElement('script');
//
//		// Hilarious hack
//		var callback = "scanImage('" + img.id + "')";
//
//		// Set the URL to the JSONP and then append to document
//		script.src = "//img-to-json.appspot.com/?url=" + escape(img.src) + "&callback=" + callback;
//		scripts[img.id] = script;
//		document.body.appendChild(script);
	}
});

