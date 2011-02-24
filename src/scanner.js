
var Scanner = Class.extend({

	init: function(nj_strength)
	{
		log("Setting NJ Strength to " + nj_strength);
		this.nudejs = new NudeChecker(nj_strength);
		this.canvas = null;
	},

	injectCanvas: function()
	{
		this.canvas = document.createElement('canvas');
		this.canvas.style.setProperty('display', 'none');
		this.canvas.id = '__kfw_canvas';
		document.body.appendChild(this.canvas);
	},

	scanImage: function(img)
	{
		var ctx = this.canvas.getContext('2d');
		this.canvas.width = img.width;
		this.canvas.height = img.height;

		ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);

		// throws a DOMException if cross-site
		var imgData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;

		return this.nudejs.scanImage(
			imgData,
			this.canvas.width,
			this.canvas.height
		);
	}
});
