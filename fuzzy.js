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
    
    this.Pixelate = function(ctx, pixelSize) {
        var width = ctx.canvas.width;
        var height = ctx.canvas.height;
        var imgData = ctx.getImageData(0, 0, width, height);
        pixelSize = pixelSize <= 0 ? 1 : pixelSize;
		
        for(var i = 0; i < width; i += pixelSize) {
            for(var j = 0; j < width; j += pixelSize) {
                var offsetx = (pixelSize / 2) | 0;
                var offsety = (pixelSize / 2) | 0;
		        
		        while(i + offsetx >= width) {
		            offsetx--;
		        }
		        
		        while(j + offsety >= height) {
		            offsety--;
		        }
		        
		        var pixel = _getPixel(imgData, i + offsetx, j + offsety);
		        
		        for(var x = i; x < i + pixelSize && x < width; x++) {
		            for(var y = j; y < j + pixelSize && y < height; y++){
		                _setPixel(imgData, x, y, pixel);
                    }
                }
            }
        }

        ctx.putImageData(imgData, 0, 0);
    }
    
    this.BoxBlur = function(ctx, blurSize) {
        var width = ctx.canvas.width;
        var height = ctx.canvas.height;
        var imgData = ctx.getImageData(0, 0, width, height);
        
        for(var i = 0; i < width; i++) {
            for(var j = 0; j < height; j++) {
                var avgPixel = _getAvgPixel(imgData, i, j, width, height, blurSize);
                
                for(var x = i; x < i + blurSize && x < width; x++) {
                    for(var y = j; y < j + blurSize && y < height; y++) {
                        _setPixel(imgData, x, y, avgPixel);
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
    
    function _getAvgPixel(imgData, x, y, width, height, areaSize) {
        var avgR = 0;
        var avgG = 0;
        var avgB = 0;
        var pixelCount = 0;

        for(var i = x; i < x + areaSize && i < width; i++) {
            for(var j = y; j < y + areaSize && j < height; j++) {
                var p = _getPixel(imgData, i, j);
                
                avgR += p.r;
                avgB += p.b;
                avgG += p.g;
                
                pixelCount++;
            }
        }
        
        avgR = (avgR / pixelCount) | 0;
        avgG = (avgG / pixelCount) | 0;
        avgB = (avgB / pixelCount) | 0;
        
        return { 
            r: avgR, 
            b: avgB, 
            g: avgG, 
            a: 255 
        };
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