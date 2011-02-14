var Tab = Class.extend({
	init: function(id)
	{
		this.id = id;
		this.port = null;

		this.enabled = false;

		this.original_images = [];
	},

	enable: function()
	{
		this.enabled = true;

		if (this.port == null)
		{
			console.log("Creating port for tab " + this.id);

			chrome.tabs.executeScript(
				this.id,
				{file: "src/content_script.js"},
				function() {
					this.port = chrome.tabs.connect(this.id, {name: "kfw"});
					this.port.onMessage.addListener(function(msg) {
						console.log("Received message");
						console.log(msg);
						if ('original_images' in msg) {
							this.original_images = msg.original_images;
							this.replaceImages();
						}
					}.bind(this));

					console.log(this.port);
				}.bind(this)
			);

		}
		else
		{
			console.log("Replacing images.");
			this.replaceImages();
		}
	},

	disable: function()
	{
		console.log("Resetting images");

		this.enabled = false;
		this.port.postMessage({images: this.original_images});
	},

	replaceImages: function()
	{
		var images = [];
		for (var i = 0; i < this.original_images.length; i++) {
			images.push('http://somehow-someday.com/images/lol.png');
		}

		this.port.postMessage({images: images});
	},

	destroy: function()
	{
		this.original_images = null;
		this.port = null; // .disconnect()?
	}
});