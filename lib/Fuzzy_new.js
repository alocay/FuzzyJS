/*
 * Fuzzy
 * https://github.com/alocay/Fuzzy
 *
 * Copyright (c) 2014 Armando Locay
 * Licensed under the MIT license.
 */

(function(exports) {
  'use strict';
  
  var 
    canvas,
    context,
    imgData,
    originalCanvas,
    
    fuzzy = function (obj) {
      originalCanvas = obj;
      var tempContext = originalCanvas.getContext("2d");
      var data = tempContext.getImageData(0, 0, obj.width, obj.height);
      
      canvas = document.createElement('canvas');
      canvas.width = obj.width;
      canvas.height = obj.height;
      canvas.getContext("2d").putImageData(data, 0, 0);
      context = canvas.getContext("2d");
      imgData = context.getImageData(0, 0, canvas.width, canvas.height);
      return fuzzy;
    };

  /* filters */
  
  fuzzy.colorFilters = {
    RED: "red",
    GREEN: "green",
    BLUE: "blue",
    NONE: "none"
  }
  
  fuzzy.colorFilter = function (colorFilter) {
    var width = canvas.width;
    var height = canvas.height;
    
    for (var i = 0; i < imgData.data.length; i += 4) {
      var r, g, b;
      switch (colorFilter) {
        case fuzzy.colorFilters.RED:
          r = imgData.data[i];
          g = imgData.data[i + 1] - 255;
          b = imgData.data[i + 2] - 255;
          break;
        case tfuzzy.colorFilters.GREEN:
          r = imgData.data[i] - 255;
          g = imgData.data[i + 1];
          b = imgData.data[i + 2] - 255;
          break;
        case fuzzy.colorFilters.BLUE:
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
    
    return this;
  };
  
  fuzzy.invert = function(colorFilter) {
    if(colorFilter) {
      _invertColorFilter(colorFilter)
    }
    else {
      _invertColorFilter(fuzzy.colorFilters.NONE);
    }
    
    return this;
  }

  fuzzy.greyscale = function() {
    var width = canvas.width;
    var height = canvas.height;

    for (var i = 0; i < imgData.data.length; i += 4) {
      var grey = 0.299 * imgData.data[i] + 0.587 * imgData.data[i + 1] + 0.114 * imgData.data[i + 2];
      imgData.data[i] = imgData.data[i + 1] = imgData.data[i + 2] = grey;
    }
    
    return this;
  }
  
  /* Blurs */
 
  fuzzy.pixelate = function (pixelSize) {
    var width = canvas.width;
    var height = canvas.height;
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
        
        var pixel = _getPixel(i + offsetx, j + offsety);
        
        for(var x = i; x < i + pixelSize && x < width; x++) {
          for(var y = j; y < j + pixelSize && y < height; y++){
            _setPixel(x, y, pixel);
          }
        }
      }
    }
    
    return this;
  };
  
  fuzzy.boxBlur = function (blurSize) {
    var width = canvas.width;
    var height = canvas.height;
    
    for(var i = 0; i < width; i++) {
      for(var j = 0; j < height; j++) {
        var avgPixel = _getAvgPixel(i, j, width, height, blurSize);
        
        for(var x = i; x < i + blurSize && x < width; x++) {
          for(var y = j; y < j + blurSize && y < height; y++) {
            _setPixel(x, y, avgPixel);
          }
        }
      }
    }
    
    return this;
  };
  
  /* finalize processing */
 
  fuzzy.draw = function (options) {
    options = options || {};    
    context.putImageData(imgData, 0, 0);
    
    if(options.img && options.img instanceof HTMLImageElement) {
      var
        img = options.img,
        newCanvas = canvas,
        widthAttr = img.attributes["width"],
        heightAttr = img.attributes["height"];
        
      if((widthAttr && widthAttr.value != canvas.width )|| (heightAttr && heightAttr.value != canvas.height)) {
        newCanvas = document.createElement('canvas');
        newCanvas.width = widthAttr.value;
        newCanvas.height = heightAttr.value;
        
        newCanvas.getContext("2d").drawImage(canvas, 0, 0, widthAttr.value, heightAttr.value);
      }
      
      img.src = newCanvas.toDataURL();
    }
    
    if(options.overwrite === true) {
      originalCanvas.getContext("2d").putImageData(imgData, 0, 0);
    }
    
    return canvas;
  };
  
  /* Utility functions */
 
  function _invertColorFilter(colorFilter) {
    var width = canvas.width;
    var height = canvas.height;
  
    for (var i = 0; i < imgData.data.length; i += 4) {
      var r, g, b;
      switch (colorFilter) {
        case fuzzy.colorFilters.RED:
          r = imgData.data[i];
          g = 255 - imgData.data[i + 1];
          b = 255 - imgData.data[i + 2];
          break;
        case fuzzy.colorFilters.GREEN:
          r = 255 - imgData.data[i];
          g = imgData.data[i + 1];
          b = 255 - imgData.data[i + 2];
          break;
        case fuzzy.colorFilters.BLUE:
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
  }
    
  function _getAvgPixel(x, y, width, height, areaSize) {
    var avgR = 0;
    var avgG = 0;
    var avgB = 0;
    var pixelCount = 0;
    
    for(var i = x; i < x + areaSize && i < width; i++) {
      for(var j = y; j < y + areaSize && j < height; j++) {
        var p = _getPixel(i, j);
        
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
  
  function _getPixel(x, y) {
    var index = (x + y * imgData.width) * 4;
    return {
      r : imgData.data[index + 0],
      g : imgData.data[index + 1],
      b : imgData.data[index + 2],
      a : imgData.data[index + 3]
    };
  }

  function _setPixel(x, y, pixel) {
    var index = (x + y * imgData.width) * 4;
    imgData.data[index + 0] = pixel.r;
    imgData.data[index + 1] = pixel.g;
    imgData.data[index + 2] = pixel.b;
    imgData.data[index + 3] = pixel.a;
  }
  
  exports.fuzzy = fuzzy;

}(typeof exports === 'object' && exports || this));
