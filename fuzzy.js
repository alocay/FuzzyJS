if ( typeof Fuzzy == 'undefined') {
    Fuzzy = {};
}

(function() {
    this.ColorFilters = {
        RED: "red",
        GREEN: "green",
        BLUE: "blue",
        NONE: "none"
    }
    
    this.Pixelate = function(ctx, pixelsize) {
        var width = ctx.canvas.width;
        var height = ctx.canvas.height;
        var imgData = ctx.getImageData(0, 0, width, height);
        pixelsize = pixelsize <= 0 ? 1 : pixelsize;
		
        for(var i = 0; i < width; i += pixelsize) {
            for(var j = 0; j < width; j += pixelsize) {
                var offsetx = (pixelsize / 2) | 0;
                var offsety = (pixelsize / 2) | 0;
		        
		        while(i + offsetx >= width) {
		            offsetx--;
		        }
		        
		        while(j + offsety >= height) {
		            offsety--;
		        }
		        
		        var pixel = _getPixel(imgData, i + offsetx, j + offsety);
		        
		        for(var x = i; x < i + pixelsize && x < width; x++) {
		            for(var y = j; y < j + pixelsize && y < height; y++){
		                _setPixel(imgData, x, y, pixel) {
                    }
                }
            }
        }

        ctx.putImageData(imgData, 0, 0);
    }

    this.ColorFilter = function(ctx, colorFilter) {
        var width = ctx.canvas.width;
        var height = ctx.canvas.height;
        var imgData = ctx.getImageData(0, 0, width, height);

        for (var i = 0; i < imgData.data.length; i += 4) {
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
                    r = imgData.data[i] - 255;
                    g = imgData.data[i + 1] - 255;
                    b = imgData.data[i + 2];
                    break;
                default:
                    r = imgData.data[i];
                    g = imgData.data[i + 1];
                    b = imgData.data[i + 2];
                    break;
            }

            imgData.data[i] = Math.min(255, Math.max(0, r));
            imgData.data[i + 1] = Math.min(255, Math.max(0, g));
            imgData.data[i + 2] = Math.min(255, Math.max(0, b));
        }

        ctx.putImageData(imgData, 0, 0);
    }

    this.Invert = function(ctx) {
        _invertColorFilter(ctx, this.ColorFilters.NONE);
    }

    this.InvertedColorFilter = function(ctx, colorFilter) {
        _invertColorFilter(ctx, colorFilter);
    }

    this.Greyscale = function(ctx) {
        var width = ctx.canvas.width;
        var height = ctx.canvas.height;
        var imgData = ctx.getImageData(0, 0, width, height);

        for (var i = 0; i < imgData.data.length; i += 4) {
            var grey = 0.299 * imgData.data[i] + 0.587 * imgData.data[i + 1] + 0.114 * imgData.data[i + 2];
            imgData.data[i] = imgData.data[i + 1] = imgData.data[i + 2] = grey;
        }
        
        ctx.putImageData(imgData, 0, 0);
    }
    
    function _invertColorFilter(ctx, colorFilter) {
        var width = ctx.canvas.width;
        var height = ctx.canvas.height;
        var imgData = ctx.getImageData(0, 0, width, height);

        for (var i = 0; i < imgData.data.length; i += 4) {
            var r, g, b;
            switch (colorFilter) {
                case Fuzzy.ColorFilters.RED:
                    r = imgData.data[i];
                    g = 255 - imgData.data[i + 1];
                    b = 255 - imgData.data[i + 2];
                    break;
                case Fuzzy.ColorFilters.GREEN:
                    r = 255 - imgData.data[i];
                    g = imgData.data[i + 1];
                    b = 255 - imgData.data[i + 2];
                    break;
                case Fuzzy.ColorFilters.BLUE:
                    r = 255 - imgData.data[i];
                    g = 255 - imgData.data[i + 1];
                    b = imgData.data[i + 2];
                    break;
                default:
                    r = 255 - imgData.data[i];
                    g = 255 - imgData.data[i + 1];
                    b = 255 - imgData.data[i + 2];
                    break;
            }

            imgData.data[i] = Math.min(255, Math.max(0, r));
            imgData.data[i + 1] = Math.min(255, Math.max(0, g));
            imgData.data[i + 2] = Math.min(255, Math.max(0, b));
        }

        ctx.putImageData(imgData, 0, 0);
    }
    
    function _getPixel(imgData, x, y) {
        index = (x + y * imgData.width) * 4;
        return {
            r : imgData.data[index + 0],
            g : imgData.data[index + 1],
            b : imgData.data[index + 2],
            a : imgData.data[index + 3]
        };
    }

    function _setPixel(imgData, x, y, pixel) {
        index = (x + y * imgData.width) * 4;
        imgData.data[index + 0] = pixel.r;
        imgData.data[index + 1] = pixel.g;
        imgData.data[index + 2] = pixel.b;
        imgData.data[index + 3] = pixel.a;
    }

    function _reset() {
        ctx.mozImageSmoothingEnabled = true;
        ctx.webkitImageSmoothingEnabled = true;
        ctx.imageSmoothingEnabled = true;
    }

}).call(Fuzzy); 