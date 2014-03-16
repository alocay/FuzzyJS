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
    
    // predefined matrices used for convolution
    _matrices = {
      emboss: [
        [-2, -1, 0],
        [-1,  1, 1],
        [ 0,  1, 2]
      ],
      edge: [
        [0,  1, 0],
        [1, -4, 1],
        [0,  1, 0]
      ],
      luminosity: [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0]
      ],
      gaussianblur: [
        [1, 2, 1],
        [2, 4, 2],
        [1, 2, 1]
      ],
      lighten: [
        [0,   0,   0],
        [0, 1.5,   0],
        [0,   0,   0]
      ],
      darken: [
        [0,    0, 0],
        [0, 0.66, 0],
        [0,    0, 0]
      ],
      sharpen: [
        [    0, -0.33,     0],
        [-0.33,  2.33, -0.33],
        [    0, -0.33,     0]
      ]
    },
    
    // default value used for darkening an image
    _defaultDarken = 0.66,
    
    // default value used for lightening an image
    _defaultLighten = 1.5,
    
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
   * Simple object used for passing in directions for blurs
   * 
   * Current values
   *    - `fuzzy.directions.VERTICAL`
   *    - `fuzzy.directions.HORIZONTAL`
   * 
   * @see fuzzy.motionBlur
   * @api public
   */
  fuzzy.directions = {
    VERTICAL: "vertical",
    HORIZONTAL: "horizontal"
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
    * Beginning of more complex processing - pixelate, box blur, gaussian blur
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
   * @param (Number) blurSize The size of the blur. The larger the number, the greater the affect.
   * @return {Object} Returns the current instance of `fuzzy`
   * @api public
   */
  fuzzy.boxBlur = function (blurSize) {
    blurSize = (!blurSize || typeof blurSize !== 'number' || blurSize < 0) ? 0 : blurSize;
    _motionBlur(blurSize, blurSize);
    
    return this;
  };
  
  /**
   * Applies a motion blur effect
   * 
   * ### Example:
   *     fuzzy(img).motionBlur(5).draw();                             // applies a horizontal motion blur
   *     fuzzy(img).motionBlur(5, fuzzy.directions.VERTICAL).draw();  // applies a vertical motion blur
   * 
   * @method motionBlur
   * @param (Number) blur The size of the blur. The larger the number, the greater the affect.
   * @param {Object} direction (Optional) The direction of the blur. Defaults to horizontal.
   * @return {Object} Returns the current instance of `fuzzy`
   * @api public
   */
  fuzzy.motionBlur = function (blur, direction) {
    blur = (!blur || typeof blur !== 'number' || blur < 0) ? 0 : blur;
    direction = direction || fuzzy.directions.HORIZONTAL;

    switch(direction) {
      case fuzzy.directions.HORIZONTAL:
        _motionBlur(blur, 1);
        break;
      case fuzzy.directions.VERTICAL:
        _motionBlur(1, blur);
        break;
    }
    
    return this;
  };
  
  /**
   * Applies a gaussian blur effect
   * 
   * ### Example:
   *     fuzzy(img).gaussianBlur().draw();
   * 
   * The convolution matrix used for `gaussianBlur` (with offset 0 and divisor 1) is the following:
   * 
   *     [1, 2, 1],
   *     [2, 4, 2],
   *     [1, 2, 1]
   * 
   * @method gaussianBlur
   * @return {Object} Returns the current instance of `fuzzy`
   * @api public
   */
  fuzzy.gaussianBlur = function () {
    fuzzy.convolution(_matrices.gaussianblur, 16);
    return this;
  };
  
  /*!
  * Beginning of other image processing - emboss, sharpen, luminosity, edgetrace
  */
 
 /**
   * Applies a emboss effect
   * 
   * ### Example:
   *     fuzzy(img).emboss().draw();
   * 
   * The convolution matrix used for `emboss` (with offset 0 and divisor 1) is the following:
   * 
   *     [-2, -1, 0],
   *     [-1,  1, 1],
   *     [ 0,  1, 2]
   * 
   * @method emboss
   * @return {Object} Returns the current instance of `fuzzy`
   * @api public
   */
  fuzzy.emboss = function() {
    fuzzy.convolution(_matrices.emboss, 1);
    return this;
  };
  
  /**
   * Applies a sharpen effect
   * 
   * ### Example:
   *     fuzzy(img).sharpen().draw();
   * 
   * The convolution matrix used for `sharpen` (with offset 0 and divisor 1) is the following:
   * 
   *     [    0, -0.33,     0],
   *     [-0.33,  2.33, -0.33],
   *     [    0, -0.33,     0]
   * 
   * @method sharpen
   * @return {Object} Returns the current instance of `fuzzy`
   * @api public
   */
  fuzzy.sharpen = function() {
    fuzzy.convolution(_matrices.sharpen, 1);
    return this;
  };
  
  /**
   * Changes the luminosity of the image
   * 
   * ### Example:
   *     fuzzy(img).luminosity(1.5).draw(); // makes the image brighter 50%
   *     fuzzy(img).luminosity(0.5).draw(); // makes the image darker by 50%
   *     fuzzy(img).luminosity(1).draw();   // no change to the image
   * 
   * If no value is given, defaulted to 1.0
   * 
   * The convolution matrix used for `luminosity` (with offset 0 and divisor 1) is the following:
   * 
   *     [0, 0, 0],
   *     [0, x, 0],
   *     [0, 0, 0]
   * 
   * Where 'x' is the luminosity value
   * 
   * @method luminosity
   * @param {Number} value The value to change the image's luminosity. < 1 will darken the image and > 1 will brighten the image.
   * @return {Object} Returns the current instance of `fuzzy`
   * @api public
   */
  fuzzy.luminosity = function(value) {
    var matrix = _matrices.luminosity.slice(0);
    value = value && typeof value === 'number' ? value : 1;
    
    matrix[1][1] = value;
    
    fuzzy.convolution(matrix, 1);
    return this;
  };
  
  /**
   * Applies an edge trace effect
   * 
   * ### Example:
   *     fuzzy(img).edgetrace().draw();
   * 
   * The convolution matrix used for `edgetrace` (with offset 0 and divisor 1) is the following:
   * 
   *     [0,  1, 0],
   *     [1, -4, 1],
   *     [0,  1, 0]
   * 
   * @method edgetrace
   * @return {Object} Returns the current instance of `fuzzy`
   * @api public
   */
  fuzzy.edgetrace = function() {
    fuzzy.convolution(_matrices.edge, 1);
    return this;
  };
  
  /**
   * Applies the convolution matrix given to the image
   * 
   * ### Example:
   *     fuzzy(img).convolution(matrix).draw();        // divisor is 1, offset is 0
   *     fuzzy(img).convolution(matrix, 5).draw();     // divisor is 5, offset is 0
   *     fuzzy(img).convolution(matrix, 10, 5).draw(); // divisor is 10, offset is 5
   * 
   * The matrix is expected to be a 3x3 matrix (2d array).
   * 
   * @method convolution
   * @param {Object} matrix The 2d array representing the convolution matrix
   * @param {Number} divisor A divisor to apply to the sums of the separate channels, defaults to 1
   * @param {Number} offset An offset to add to the sums of the separate channels, defaults to 0
   * @return {Object} Returns the current instance of `fuzzy`
   * @api public
   */
  fuzzy.convolution = function (matrix, divisor, offset) {
    var pixels = [];
    
    if(!matrix || !(matrix instanceof Array) || matrix.length !== 3) {
      throw "Convolution matrix should be 3x3 matrix";  
    }
    
    divisor = (!divisor || divisor < 1 || typeof divisor !== 'number') ? 1 : divisor;
    offset = (!offset || typeof offset !== 'number') ? 0 : offset;
    
    for(var x = 0; x < _width; x++) {      
      for(var y = 0; y < _height; y++) {
        var pixel = _getNeighborSum(x - 1, y - 1, matrix, divisor, offset);
        _setPixel(x, y, pixel, pixels);
      }
    }
    
    for(var i = 0; i < pixels.length; i++) {
      _imgData.data[i] = pixels[i];
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
   * Beginnning varius private utility functions
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
    
  function _getAvgPixel(x, y, width, height, wSize, hSize) {
    var avgR = 0;
    var avgG = 0;
    var avgB = 0;
    var pixelCount = 0;
    
    for(var i = x; i < x + wSize && i < width; i++) {
      for(var j = y; j < y + hSize && j < height; j++) {
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

  function _setPixel(x, y, pixel, pixels, width) {
    var index;
    
    pixels = pixels || _imgData.data;
    index = (x + y * _imgData.width) * 4;
    pixels[index + 0] = pixel.r;
    pixels[index + 1] = pixel.g;
    pixels[index + 2] = pixel.b;
    pixels[index + 3] = pixel.a;
  }

  function _getNeighborSum (x, y, matrix, divisor, offset) {
    var redSum = 0, greenSum = 0, blueSum = 0, red, green, blue, yy;
    for (var i = 0; i < matrix.length; i++, x++) {
      yy = y;
      for (var j = 0; j < matrix.length; j++, yy++) {
        if(_imgData.data[x] && _imgData.data[yy]) {
          var pixel = _getPixel(x, yy);
          redSum += pixel.r * matrix[i][j];
          greenSum += pixel.g * matrix[i][j];
          blueSum += pixel.b * matrix[i][j];
        }
      }
    }
    
    red = Math.min(255, Math.max(0, (redSum / divisor) + offset));
    green = Math.min(255, Math.max(0, (greenSum / divisor) + offset));
    blue = Math.min(255, Math.max(0, (blueSum / divisor) + offset));
    
    return { r: red, g: green, b: blue, a: 255 };
  }
  
  function _motionBlur(w, h) {
    h = h < 0 ? 0 : h;
    w = w < 0 ? 0 : w;

    for(var i = 0; i < _width; i++) {
      for(var j = 0; j < _height; j++) {
        var avgPixel = _getAvgPixel(i, j, _width, _height, w, h);
        
        for(var x = i; x < i + w && x < _width; x++) {
          for(var y = j; y < j + h && y < _height; y++) {
            avgPixel.a = _getPixel(x, y).a;
            _setPixel(x, y, avgPixel);
          }
        }
      }
    }
  }
  
  window.fuzzy = fuzzy;

}(this));
