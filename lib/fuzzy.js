/*
 * fuzzy
 * https://github.com/alocay/fuzzy
 *
 * Copyright (c) 2014 Armando Locay
 * Licensed under the MIT license.
 */

(function(exports) {
  'use strict';
  
  var 
    _canvas,
    _context,
    _imgData,
    _width,
    _height,
    _originalCanvas,
    
    /* init */

    fuzzy = function (obj) {
      _canvas = document.createElement('canvas');
      _context = _canvas.getContext("2d");
      
      if(obj instanceof HTMLImageElement) { // in an image
        if(!obj.complete) {
          throw "image must first be loaded (src: " + obj.src + ")";
        }
        _initImg(obj);
      }
      else if (obj instanceof HTMLCanvasElement) {
        _initCanvas(obj);
      }
      else {
        return null;
      }
      
      _imgData = _context.getImageData(0, 0, _width, _height);
      
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
    for (var i = 0; i < _imgData.data.length; i += 4) {
      var r, g, b;
      switch (colorFilter) {
        case fuzzy.colorFilters.RED:
          r = _imgData.data[i];
          g = _imgData.data[i + 1] - 255;
          b = _imgData.data[i + 2] - 255;
          break;
        case tfuzzy.colorFilters.GREEN:
          r = _imgData.data[i] - 255;
          g = _imgData.data[i + 1];
          b = _imgData.data[i + 2] - 255;
          break;
        case fuzzy.colorFilters.BLUE:
          r = _imgData.data[i] - 255;
          g = _imgData.data[i + 1] - 255;
          b = _imgData.data[i + 2];
          break;
        default:
          r = _imgData.data[i];
          g = _imgData.data[i + 1];
          b = _imgData.data[i + 2];
          break;
      }
  
      _imgData.data[i] = Math.min(255, Math.max(0, r));
      _imgData.data[i + 1] = Math.min(255, Math.max(0, g));
      _imgData.data[i + 2] = Math.min(255, Math.max(0, b));
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
    for (var i = 0; i < _imgData.data.length; i += 4) {
      var grey = 0.299 * _imgData.data[i] + 0.587 * _imgData.data[i + 1] + 0.114 * _imgData.data[i + 2];
      _imgData.data[i] = _imgData.data[i + 1] = _imgData.data[i + 2] = grey;
    }
    
    return this;
  }
  
  /* Blurs */
 
  fuzzy.pixelate = function (pixelSize) {
    pixelSize = pixelSize <= 0 ? 1 : pixelSize;
    
    for(var i = 0; i < _width; i += pixelSize) {
      for(var j = 0; j < _width; j += pixelSize) {
        var offsetx = (pixelSize / 2) | 0;
        var offsety = (pixelSize / 2) | 0;
      
        while(i + offsetx >= _width) {
          offsetx--;
        }
        
        while(j + offsety >= _height) {
          offsety--;
        }
        
        var pixel = _getPixel(i + offsetx, j + offsety);
        
        for(var x = i; x < i + pixelSize && x < _width; x++) {
          for(var y = j; y < j + pixelSize && y < _height; y++){
            _setPixel(x, y, pixel);
          }
        }
      }
    }
    
    return this;
  };
  
  fuzzy.boxBlur = function (blurSize) {
    blurSize = blurSize < 0 ? 0 : blurSize;

    for(var i = 0; i < _width; i++) {
      for(var j = 0; j < _height; j++) {
        var avgPixel = _getAvgPixel(i, j, _width, _height, blurSize);
        
        for(var x = i; x < i + blurSize && x < _width; x++) {
          for(var y = j; y < j + blurSize && y < _height; y++) {
            avgPixel.a = _getPixel(x, y).a;
            _setPixel(x, y, avgPixel);
          }
        }
      }
    }
    
    return this;
  };
  
  /* finalize processing */
  fuzzy.scale = function (w, h) {
    _context.putImageData(_imgData, 0, 0);
    return _getNewImage(w, h);
  };
 
  fuzzy.draw = function (img, options) {    
    _context.putImageData(_imgData, 0, 0);
    options = options || {};
    
    if(img instanceof HTMLImageElement) {
      var
        width = options.width || img.width,
        height = options.height || img.height,
        widthAttr = img.attributes["width"],
        heightAttr = img.attributes["height"];
        
      width = width <= 0 && widthAttr ? widthAttr.value : _canvas.width;
      height = height <= 0 && heightAttr ? heightAttr.value : _canvas.height;
      
      img.src = _getImageSrc(width, height);
    }
    
    if(options.overwrite === true) {
      if(_originalCanvas) {
        _originalCanvas.getContext("2d").putImageData(_imgData, 0, 0);
      }
    }
    
    if(options.callback && typeof options.callback === 'function') {
      var img = _getNewImage(options.width, options.height);      
      options.callback(img);
    }
    
    return _getCanvasCopy();
  }
  
  /* Utility functions */
  function _initImg(img) {
    _width = _canvas.width = img.width;
    _height = _canvas.height = img.height;
    _context.drawImage(img, 0, 0, _width, _height);
  }

  function _initCanvas(c) {
    var tempContext, data;

    _width = _canvas.width = c.width;
    _height = _canvas.height = c.height;
    _originalCanvas = c;
    tempContext = _originalCanvas.getContext("2d");
    data = tempContext.getImageData(0, 0, _width, _height);
    _context.putImageData(data, 0, 0);
  }
  
  function _getNewImage(width, height) {
    var img = new Image();
      
    var dimensions = _getImageDimensions(width, height);
      
    img.width = dimensions.width;
    img.height = dimensions.height;
    img.src = _getImageSrc(img.width, img.height);
    
    return img;
  }
  
  function _getImageDimensions(width, height) {
    var
      widthDimension = width, 
      heightDimension = height,
      hasWidth = width && typeof width === 'number',
      hasHeight = height && typeof height === 'number';
    
    if(hasWidth && !hasHeight) {
      heightDimension = width != _canvas.width ? ((width / _canvas.width) * _canvas.height) | 0 : _canvas.height;
    }
    else if (hasHeight && !hasWidth) {
      widthDimension = height != _canvas.height ? ((height / _canvas.height) * _canvas.width) | 0 : _canvas.width;
    }
    else if (!hasWidth && !hasWidth) {
      widthDimension = _canvas.width;
      heightDimension = _canvas.height;
    }
    
    return { width: widthDimension, height: heightDimension };
  }
  
  function _getImageSrc(width, height) {
    var newCanvas = _canvas;
        
      if(width != _width || height != _height) {
        newCanvas = document.createElement('canvas');
        newCanvas.width = width;
        newCanvas.height = height;
        
        newCanvas.getContext("2d").drawImage(_canvas, 0, 0, width, height);
      }
      
      return newCanvas.toDataURL();
  }
  
  function _getCanvasCopy() {
    var tempCanvas = document.createElement('canvas');
    tempCanvas.width = _canvas.width;
    tempCanvas.height = _canvas.height;
    tempCanvas.getContext("2d").drawImage(_canvas, 0, 0, _canvas.width, _canvas.height);
    
    return tempCanvas;
  }
  
  function _invertColorFilter(colorFilter) {  
    for (var i = 0; i < _imgData.data.length; i += 4) {
      var r, g, b;
      switch (colorFilter) {
        case fuzzy.colorFilters.RED:
          r = _imgData.data[i];
          g = 255 - _imgData.data[i + 1];
          b = 255 - _imgData.data[i + 2];
          break;
        case fuzzy.colorFilters.GREEN:
          r = 255 - _imgData.data[i];
          g = _imgData.data[i + 1];
          b = 255 - _imgData.data[i + 2];
          break;
        case fuzzy.colorFilters.BLUE:
          r = 255 - _imgData.data[i];
          g = 255 - _imgData.data[i + 1];
          b = _imgData.data[i + 2];
          break;
        default:
          r = 255 - _imgData.data[i];
          g = 255 - _imgData.data[i + 1];
          b = 255 - _imgData.data[i + 2];
          break;
      }
  
      _imgData.data[i] = Math.min(255, Math.max(0, r));
      _imgData.data[i + 1] = Math.min(255, Math.max(0, g));
      _imgData.data[i + 2] = Math.min(255, Math.max(0, b));
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
    var index = (x + y * _imgData.width) * 4;
    return {
      r : _imgData.data[index + 0],
      g : _imgData.data[index + 1],
      b : _imgData.data[index + 2],
      a : _imgData.data[index + 3]
    };
  }

  function _setPixel(x, y, pixel) {
    var index = (x + y * _imgData.width) * 4;
    _imgData.data[index + 0] = pixel.r;
    _imgData.data[index + 1] = pixel.g;
    _imgData.data[index + 2] = pixel.b;
    _imgData.data[index + 3] = pixel.a;
  }
  
  exports.fuzzy = fuzzy;

}(typeof exports === 'object' && exports || this));
