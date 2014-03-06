if(typeof Fuzzy == 'undefined') {
	Fuzzy = {};
}

(function(){
	this.Pixelate = function(ctx, pixelsize) {
		var width = ctx.canvas.width;
		var height = ctx.canvas.height;
		var imgData = ctx.getImageData(0, 0, width, height);
		for (var i = 0; i < width; i += pixelsize) {
			for(var j = 0; j < height; j += pixelsize) {
				var offsetx = pixelsize / 2;
				var offsety = pixelsize / 2;
				
				while (i + offsetx >= width) {
					offsetx--;
				}
				
				while (j + offsety >= height) {
					offsety--;
				}
				
				var pixel = _getPixel(imgData, i + offsetx, j + offsety);
				
				for(var x = i; x < i + pixelsize && x < width; x++) {
					for(var y = j; y < j + pixelsize && y < height; y++) {
						_setPixel(imgData, x, y, pixel);
					}
				}
			}
		}
		
		ctx.putImageData(imgData, 0, 0);
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
}).call(Fuzzy);