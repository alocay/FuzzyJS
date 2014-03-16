/*! FuzzyJS - v0.1.0 - 2014-03-16
* https://github.com/alocay/FuzzyJS
* Copyright (c) 2014 Armando Locay; Licensed MIT */
(function(window) {
  'use strict';
  
  var
    // stores a copy of the original canvas - internal use
    _canvas,
    
    // 2d context of _canvas - internal use
    _context,
    
    // pixel data array of _canvas - internal use
    _imgData,
    
    // width of the given image or canvas - internal use
    _width,
    
    // height of the given image or canvas - internal use
    _height,
    
    // the original canvas/image - internal use
    _originalCanvas,
    
    /**
     * Entry point for the fuzzy library functionality
     * 
     * A new canvas is created based on the image/canvas given. All modifications happen on this canvas, so the original canvas is left untouched.
     * 
     * @method fuzzy
     * @param {Object} imgObj The object containing the image data. Can be either an HTMLImageElement or an HTMLCanvasElement
     * @returns {Object} Returns the current instance of `fuzzy` 
     * @api public
     */
    fuzzy = function (imgObj) {
      _canvas = window.document.createElement('canvas');
      _context = _canvas.getContext("2d");
      
      // check if we have a canvas or image, return null if neither
      if(imgObj instanceof window.HTMLImageElement) { // in an image
        if(!imgObj.complete) {
          throw "image must first be loaded (src: " + imgObj.src + ")";
        }
        
        // Sets up the canvas object or later use
        _initImg(imgObj);
      }
      else if (imgObj instanceof window.HTMLCanvasElement) {
        // Copies this canvas for later use
        _initCanvas(imgObj);
      }
      else {
        return null;
      }
      
      // Get the pixel data
      _imgData = _context.getImageData(0, 0, _width, _height);
      
      // return itself
      return fuzzy;
    };

   /*!
    * Beginning of simple filters - colorFilter, greyscale, invert
    */

  /**
   * Simple object used for passing in color filters
   * 
   * Current values
   *    - `fuzzy.colorFilters.RED`
   *    - `fuzzy.colorFilters.GREEN`
   *    - `fuzzy.colorFilters.BLUE`
   *    - `fuzzy.colorFilters.NONE`
   * 
   * @see fuzzy.colorFilter
   * @api public
   */
  fuzzy.colorFilters = {
    RED: "red",
    GREEN: "green",
    BLUE: "blue",
    NONE: "none" // used primarily interally
  };
  
  /**
   * Applies a very simple color filter by filtering out the OTHER colors
   * 
   * ### Examples:
   *     fuzzy(img).colorFilter(fuzzy.colorFilters.RED).draw(); // filters out green and blue
   * 
   * Best to use the predefined values found in `fuzzy.colorFilters`
   * 
   * @method colorFilter
   * @param {String} colorFilter The color to use in the filter
   * @see fuzzy.colorFilters
   * @return {Object} Returns the current instance of `fuzzy`
   * @api public
   */
  fuzzy.colorFilter = function (colorFilter) {    
    for (var i = 0; i < _imgData.data.length; i += 4) {
      var r, g, b;
      
      // simply set the pixels not related to the specified color to 0
      switch (colorFilter) {
        case fuzzy.colorFilters.RED:
          _imgData.data[i + 1] = 0;
          _imgData.data[i + 2] = 0;
          break;
        case fuzzy.colorFilters.GREEN:
          _imgData.data[i] = 0;
          _imgData.data[i + 2] = 0;
          break;
        case fuzzy.colorFilters.BLUE:
          _imgData.data[i] = 0;
          _imgData.data[i + 1] = 0;
          break;
      }
    }
    
    return this;
  };
  
  /**
   * Applies a negative filter
   * 
   * You can also pass a color filter to this method and that pixel value will not be altered
   * 
   * ### Examples:
   *     fuzzy(img).invert().draw();
   *     fuzzy(img).invert(fuzzy.colorFilters.GREEN).draw();
   * 
   * @method invert
   * @param {Object} colorFilter (Optional) Specifies a color to leave unaltered for each pixel
   * @return {Object} Returns the current instance of `fuzzy`
   * @api public
   */
  fuzzy.invert = function(colorFilter) {
    if(colorFilter) {
      _invertColorFilter(colorFilter);
    }
    else {
      _invertColorFilter(fuzzy.colorFilters.NONE);
    }
    
    return this;
  };

  /**
   * Applies a grey scale effect
   * 
   * ### Example:
   *     fuzzy(img).greyscale().draw();
   * 
   * @method greyscale
   * @return {Object} Returns the current instance of `fuzzy`
   * @api public
   */
  fuzzy.greyscale = function() {
    for (var i = 0; i < _imgData.data.length; i += 4) {
      var grey = 0.299 * _imgData.data[i] + 0.587 * _imgData.data[i + 1] + 0.114 * _imgData.data[i + 2];
      _imgData.data[i] = _imgData.data[i + 1] = _imgData.data[i + 2] = grey;
    }
    
    return this;
  };
  
  /*!
    * Beginning of more complex processing - pixelate, box blur
    */
  
  /**
   * Applies a pixelation effect
   * 
   * ### Example:
   *     fuzzy(img).pixelate(4).draw();
   * 
   * @method pixelate
   * @param (Number) pixelSize Specifies the pixel size for the pixelation effect
   * @return {Object} Returns the current instance of `fuzzy`
   * @api public
   */
  fuzzy.pixelate = function (pixelSize) {
    pixelSize = pixelSize <= 0 ? 1 : pixelSize;
    pixelSize = pixelSize >= _width ? _width-1 : pixelSize;
    
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
  
  /**
   * Applies a box blur effect
   * 
   * ### Example:
   *     fuzzy(img).boxBlur(5).draw();
   * 
   * @method boxBlur
   * @param (Number) The size of the blur. The larger the number, the greater the affect.
   * @return {Object} Returns the current instance of `fuzzy`
   * @api public
   */
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
  
  /*!
   * Beginning finalize functions
   */
  
  /**
   * Places the image data on the canvas
   * 
   * ### Example:
   * After you apply your filters, the altered imaged data will not be placed until `draw()` is called.
   * 
   *     var filters = fuzzy(img).pixelate(5).invert(); // Not applied to canvas yet
   *     filters.draw(img);                             // Applied
   * 
   * Options can be passed along
   * 
   *     fuzzy(img).invert().draw(img, { width: 500, overwrite: true });
   * 
   * This function can take various options:
   *    - `overwrite`: Places the altered image data into the original canvas
   *    - `callback`: A callback to be called passing along a HTMLImageElement containing the alterations
   *    - `width`: Specifies the width to use when setting the image passed in directly or passed back through the callback (defaults to image width and finally to canvas width)
   *    - `height`: Specifies the height to use when setting the image passed in directly or passed back through the callback (defaults to image height and finally to canvas height)
   * 
   * @method draw
   * @param {Object} img (Optional) An HTMLImageElement to place the altered canvas' contents into
   * @param {Object} options (Optional) Various options
   * @return {Object} A copy of the altered HTMLImageCanvas
   * @api public
   */
  fuzzy.draw = function (img, options) {    
    _context.putImageData(_imgData, 0, 0);
    options = options || {};
    
    if(img instanceof window.HTMLImageElement) {
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
      var newImage = _getNewImage(options.width, options.height);      
      options.callback(newImage);
    }
    
    return _getCanvasCopy();
  };
  
  /**
   * Simple scaling tool
   * 
   * Also places the altered image data into the internal canvas
   * 
   * Note: This will place canvas contents into the new image. If no effects have been applied, then this will simply scale, otherwise the new image will contain the effects.
   * 
   * ### Example:
   *     var newImage = fuzzy(img).scale(500, 500);
   * 
   * @method scale
   * @param {Number} w the new width
   * @param {Number} h the new height
   * @return {Object} Returns a new image with the new dimensions
   * @api public
   */
   fuzzy.scale = function (w, h) {
    _context.putImageData(_imgData, 0, 0);
    return _getNewImage(w, h);
  };
  
  /*!
   * Beginnning varius utility functions
   */
  
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
    var img = new window.Image();
      
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
      heightDimension = width !== _canvas.width ? ((width / _canvas.width) * _canvas.height) | 0 : _canvas.height;
    }
    else if (hasHeight && !hasWidth) {
      widthDimension = height !== _canvas.height ? ((height / _canvas.height) * _canvas.width) | 0 : _canvas.width;
    }
    else if (!hasWidth && !hasWidth) {
      widthDimension = _canvas.width;
      heightDimension = _canvas.height;
    }
    
    return { width: widthDimension, height: heightDimension };
  }
  
  function _getImageSrc(width, height) {
    var newCanvas = _canvas;
        
      if(width !== _width || height !== _height) {
        newCanvas = window.document.createElement('canvas');
        newCanvas.width = width;
        newCanvas.height = height;
        
        newCanvas.getContext("2d").drawImage(_canvas, 0, 0, width, height);
      }
      
      return newCanvas.toDataURL();
  }
  
  function _getCanvasCopy() {
    var tempCanvas = window.document.createElement('canvas');
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
  
  window.fuzzy = fuzzy;

}(this));
