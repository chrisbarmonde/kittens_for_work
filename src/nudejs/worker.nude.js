Array.prototype.remove = function (a)
{
	var b = this.slice(a + 1);
	this.length = a;
	return this.push.apply(this, b)
};

var NudeChecker = Class.extend({
	reset: function() {
		this.skinRegions = [];
		this.skinMap = [];

		this.lastFrom = -1;
		this.lastTo = -1;
		this.mergeRegions = [];
		this.detectedRegions = [];
	},

	scanImage: function(imageData, width, height) {

		this.reset();

		var length = imageData.length;

		// iterate the image from the top left to the bottom right
		for(var i = 0, u = 1; i < length; i+=4, u++){

			var r = imageData[i],
			g = imageData[i+1],
			b = imageData[i+2],
			x = (u>width)?((u%width)-1):u,
			y = (u>width)?(Math.ceil(u/width)-1):1;

			if (this.classifySkin(r, g, b)){ //

				this.skinMap.push({"id": u, "skin": true, "region": 0, "x": x, "y": y, "checked": false});

				var region = -1,
				checkIndexes = [u-2, (u-width)-2, u-width-1, (u-width)],
				checker = false;

				for(var o = 0; o < 4; o++){
					var index = checkIndexes[o];
					if(this.skinMap[index] && this.skinMap[index].skin){
						if(this.skinMap[index].region!=region && region!=-1 && this.lastFrom!=region && this.lastTo!=this.skinMap[index].region){
							this.addMerge(region, this.skinMap[index].region);
						}
						region = this.skinMap[index].region;
						checker = true;
					}
				}

				if(!checker){
					this.skinMap[u-1].region = this.detectedRegions.length;
					this.detectedRegions.push([this.skinMap[u-1]]);
					continue;
				}else{
					if(region > -1){
						if(!this.detectedRegions[region]){
							this.detectedRegions[region] = [];
						}

						this.skinMap[u-1].region = region;
						this.detectedRegions[region].push(this.skinMap[u-1]);
					}
				}
			} else {
				this.skinMap.push({"id": u, "skin": false, "region": 0, "x": x, "y": y, "checked": false});
			}
		}

		this.merge();
		return this.analyseRegions(width, height);
	},

	addMerge: function(from, to) {
		this.lastFrom = from;
		this.lastTo = to;
		var len = this.mergeRegions.length,
		fromIndex = -1,
		toIndex = -1;

		while(len--) {
			var region = this.mergeRegions[len],
			rlen = region.length;

			while(rlen--) {
				if(region[rlen] == from){
					fromIndex = len;
				}

				if(region[rlen] == to){
					toIndex = len;
				}
			}
		}

		if(fromIndex != -1 && toIndex != -1 && fromIndex == toIndex){
			return;
		}

		if(fromIndex == -1 && toIndex == -1){
			this.mergeRegions.push([from, to]);
			return;
		}
		if(fromIndex != -1 && toIndex == -1){
			this.mergeRegions[fromIndex].push(to);
			return;
		}
		if(fromIndex == -1 && toIndex != -1){
			this.mergeRegions[toIndex].push(from);
			return;
		}
		if(fromIndex != -1 && toIndex != -1 && fromIndex != toIndex){
			this.mergeRegions[fromIndex] = this.mergeRegions[fromIndex].concat(this.mergeRegions[toIndex]);
			this.mergeRegions.remove(toIndex);
			return;
		}
	},

	// function for merging detected regions
	merge: function() {
		var length = this.mergeRegions.length,
		detRegions = [];

		// merging detected regions
		while (length--) {
			var region = this.mergeRegions[length],
			rlen = region.length;

			if(!detRegions[length])
				detRegions[length] = [];

			while (rlen--) {
				var index = region[rlen];
				detRegions[length] = detRegions[length].concat(this.detectedRegions[index]);
				this.detectedRegions[index] = [];
			}
		}

		// push the rest of the regions to the detRegions array
		// (regions without merging)
		var l = this.detectedRegions.length;
		while(l--){
			if(this.detectedRegions[l].length > 0){
				detRegions.push(this.detectedRegions[l]);
			}
		}

		// clean up
		this.clearRegions(detRegions);
	},

	// clean up function
	// only pushes regions which are bigger than a specific amount to the final result
	clearRegions: function(detectedRegions) {
		var length = detectedRegions.length;

		for(var i=0; i < length; i++){
			if(detectedRegions[i].length > 30){
				this.skinRegions.push(detectedRegions[i]);
			}
		}
	},
	analyseRegions: function(width, height) {

		// sort the detected regions by size
		var length = this.skinRegions.length,
		totalPixels = width * height,
		totalSkin = 0;

		// if there are less than 3 regions
		if(length < 3){
			console.log("Not nude: less than 3 regions (" + length + ")");
			return false;
		}

		// sort the skinRegions with bubble sort algorithm
		(function() {
			var sorted = false;
			while(!sorted){
				sorted = true;
				for(var i = 0; i < length-1; i++){
					if(this.skinRegions[i].length < this.skinRegions[i+1].length){
						sorted = false;
						var temp = this.skinRegions[i];
						this.skinRegions[i] = this.skinRegions[i+1];
						this.skinRegions[i+1] = temp;
					}
				}
			}
		}).bind(this)();

		// count total skin pixels
		while(length--){
			totalSkin += this.skinRegions[length].length;
		}

		// check if there are more than 15% skin pixel in the image
		if((totalSkin/totalPixels)*100 < 15){
			// if the percentage lower than 15, it's not nude!
			console.log("it's not nude :) - total skin percent is "+((totalSkin/totalPixels)*100)+"% ");
			return false;
		}


		// check if the largest skin region is less than 35% of the total skin count
		// AND if the second largest region is less than 30% of the total skin count
		// AND if the third largest region is less than 30% of the total skin count
		if((this.skinRegions[0].length/totalSkin)*100 < 35
				&& (this.skinRegions[1].length/totalSkin)*100 < 30
				&& (this.skinRegions[2].length/totalSkin)*100 < 30){
			// the image is not nude.
			console.log("it's not nude :) - less than 35%,30%,30% skin in the biggest areas :" + ((this.skinRegions[0].length/totalSkin)*100) + "%, " + ((this.skinRegions[1].length/totalSkin)*100)+"%, "+((this.skinRegions[2].length/totalSkin)*100)+"%");
			return false;

		}

		// check if the number of skin pixels in the largest region is less than 45% of the total skin count
		if((this.skinRegions[0].length/totalSkin)*100 < 45){
			// it's not nude
			console.log("it's not nude :) - the biggest region contains less than 45%: "+((this.skinRegions[0].length/totalSkin)*100)+"%");
			return false;
		}

		// TODO:
		// build the bounding polygon by the regions edge values:
		// Identify the leftmost, the uppermost, the rightmost, and the lowermost skin pixels of the three largest skin regions.
		// Use these points as the corner points of a bounding polygon.

		// TODO:
		// check if the total skin count is less than 30% of the total number of pixels
		// AND the number of skin pixels within the bounding polygon is less than 55% of the size of the polygon
		// if this condition is true, it's not nude.

		// TODO: include bounding polygon functionality
		// if there are more than 60 skin regions and the average intensity within the polygon is less than 0.25
		// the image is not nude
		if(this.skinRegions.length > 60){
			console.log("it's not nude :) - more than 60 skin regions");
			return false;
		}


		// otherwise it is nude
		return true;

	},

	/** Could probably break the rest of these out... */
	classifySkin: function(r, g, b) {
		// A Survey on Pixel-Based Skin Color Detection Techniques
		var rgbClassifier = ((r>95) && (g>40 && g <100) && (b>20) && ((Math.max(r,g,b) - Math.min(r,g,b)) > 15) && (Math.abs(r-g)>15) && (r > g) && (r > b)),
		nurgb = this.toNormalizedRgb(r, g, b),
		nr = nurgb[0],
		ng = nurgb[1],
		nb = nurgb[2],
		normRgbClassifier = (((nr/ng)>1.185) && (((r*b)/(Math.pow(r+g+b,2))) > 0.107) && (((r*g)/(Math.pow(r+g+b,2))) > 0.112)),
		//hsv = toHsv(r, g, b),
		//h = hsv[0]*100,
		//s = hsv[1],
		//hsvClassifier = (h < 50 && h > 0 && s > 0.23 && s < 0.68);
		hsv = this.toHsvTest(r, g, b),
		h = hsv[0],
		s = hsv[1],
		hsvClassifier = (h > 0 && h < 35 && s > 0.23 && s < 0.68);
		/*
		 * ycc doesnt work

		ycc = toYcc(r, g, b),
		y = ycc[0],
		cb = ycc[1],
		cr = ycc[2],
		yccClassifier = ((y > 80) && (cb > 77 && cb < 127) && (cr > 133 && cr < 173));
		*/

		return (rgbClassifier || normRgbClassifier || hsvClassifier); //
	},

	toYcc: function(r, g, b) {
		r/=255,g/=255,b/=255;
		var y = 0.299*r + 0.587*g + 0.114*b,
		cr = r - y,
		cb = b - y;

		return [y, cr, cb];
	},

	toHsv: function(r, g, b) {
		return [
				// hue
				Math.acos((0.5*((r-g)+(r-b)))/(Math.sqrt((Math.pow((r-g),2)+((r-b)*(g-b)))))),
				// saturation
				1-(3*((Math.min(r,g,b))/(r+g+b))),
				// value
				(1/3)*(r+g+b)
				];
	},

	toHsvTest: function(r, g, b) {
		var h = 0,
		mx = Math.max(r, g, b),
		mn = Math.min(r, g, b),
		dif = mx - mn;

		if(mx == r){
			h = (g - b)/dif;
		}else if(mx == g){
			h = 2+((g - r)/dif)
		}else{
			h = 4+((r - g)/dif);
		}
		h = h*60;
		if(h < 0){
			h = h+360;
		}

		return [h, 1-(3*((Math.min(r,g,b))/(r+g+b))),(1/3)*(r+g+b)] ;
	},

	toNormalizedRgb: function(r, g, b) {
		var sum = r+g+b;
		return [(r/sum), (g/sum), (b/sum)];
	}
});