if(typeof Fuzzy == 'undefined') {
	Fuzzy = {};
}

(function(){
	this.ColorFilters = {
		RED: "red",
		GREEN: "green",
		BLUE: "blue"
	}
	
	this.Pixelate = function(ctx, img, pixelsize) {
		ctx.mozImageSmoothingEnabled = false;
		ctx.webkitImageSmoothingEnabled = false;
		ctx.imageSmoothingEnabled = false;
		pixelsize = pixelsize > 100 ? 100 : pixelsize;
		pixelsize = pixelsize < 1 ? 1 : pixelsize;
	    pixelsize *= 0.01;
	
        width = ctx.canvas.width * pixelsize,
        height = ctx.canvas.height * pixelsize;

	    ctx.drawImage(img, 0, 0, width, height);
	
	    ctx.drawImage(ctx.canvas, 0, 0, width, height, 0, 0, ctx.canvas.width, ctx.canvas.height);
	}
	
	this.ColorFilter = function(ctx, colorFilter) {
		//_reset();
		var width = ctx.canvas.width;
		var height = ctx.canvas.height;
		var imgData = ctx.getImageData(0, 0, width, height);
		
		for(var i = 0; i < imgData.data.length; i += 4) {
			var r, g, b;
			switch (colorFilter) {
				case this.ColorFilters.RED:
					r = imgData.data[i];
					g = imgData.data[i + 1] - 255;
					b = imgData.data[i + 2] - 255;
					break;
				case this.ColorFilters.GREEN:
					r = imgData.data[i] - 255;
					g = imgData.data[i + 1];
					b = imgData.data[i + 2] - 255;
					break;
				case this.ColorFilters.GREEN:
					r = imgData.data[i]  - 255;
					g = imgData.data[i + 1]  - 255;
					b = imgData.data[i + 2];
					break;
			}
			
			imgData.data[i] = Math.min(255, Math.max(0, r));
			imgData.data[i + 1] = Math.min(255, Math.max(0, g));
			imgData.data[i + 2] = Math.min(255, Math.max(0, b));
		}
		
		ctx.putImageData(imgData, 0, 0);
	}
	
	this.Greyscale = function(ctx) {
	}
	
	function _getPixel(imgData, x, y) {
		index = (x + y * imgData.width) * 4;
		return { r: imgData.data[index+0], g: imgData.data[index+1], b: imgData.data[index+2], a: imgData.data[index+3] };
	}
	
	function _setPixel(imgData, x, y, pixel) {
	    index = (x + y * imgData.width) * 4;
	    imgData.data[index+0] = pixel.r;
	    imgData.data[index+1] = pixel.g;
	    imgData.data[index+2] = pixel.b;
	    imgData.data[index+3] = pixel.a;
	}
	
	function _reset() {
		ctx.mozImageSmoothingEnabled = true;
		ctx.webkitImageSmoothingEnabled = true;
		ctx.imageSmoothingEnabled = true;
	}
}).call(Fuzzy);