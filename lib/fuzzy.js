/*
 * fuzzy js
 * https://github.com/alocay/FuzzyJS
 *
 * Copyright (c) 2014 Armando Locay
 * Licensed under the MIT license.
 */

(function(global) {
  'use strict';
  
  var
    // Canvas constructor to use in case we're running in node
    Canvas = (global.require && typeof global.require === 'function') ? global.require('canvas') : null,
    
    // Image constructor to use
    Img = Canvas ? Canvas.Image : global.Image,
  
    // stores a copy of the original canvas - internal use
    _canvas,
    
    // 2d context of _canvas - internal use
    _context,
    
    // pixel data array of _canvas - internal use
    _imgData,
    
    // dimensions of the given image or canvas - internal use
    _dimension,
    
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
      _canvas = _getCanvas();
      _context = _canvas.getContext("2d");
      
      // check if we have a canvas or image, return null if neither
      if(_isImage(imgObj)) { // in an image
        if(!Canvas && !imgObj.complete) {
          throw "image must first be loaded (src: " + imgObj.src + ")";
        }
        
        // Sets up the canvas object or later use
        _initImg(imgObj);
      }
      else if (_isCanvas(imgObj)) {
        // Copies this canvas for later use
        _initCanvas(imgObj);
      }
      else {
        return null;
      }
      
      // Get the pixel data
      _imgData = _context.getImageData(0, 0, _dimension.width, _dimension.height);
      
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
    pixelSize = pixelSize >= _dimension.width ? _dimension.width - 1 : pixelSize;
    
    for (var i = 0; i < _dimension.width; i += pixelSize) {
      for (var j = 0; j < _dimension.height; j += pixelSize) {
        var offsetx = (pixelSize / 2) | 0;
        var offsety = (pixelSize / 2) | 0;
      
        while (i + offsetx >= _dimension.width) {
          offsetx--;
        }
        
        while (j + offsety >= _dimension.height) {
          offsety--;
        }
        
        var pixel = _getPixel(i + offsetx, j + offsety);
        
        for (var x = i; x < i + pixelSize && x < _dimension.width; x++) {
          for (var y = j; y < j + pixelSize && y < _dimension.height; y++) {
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
    _motionBlur(new Dimension(blurSize, blurSize));
    
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
        _motionBlur(new Dimension(blur, 1));
        break;
      case fuzzy.directions.VERTICAL:
        _motionBlur(new Dimension(1, blur));
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
    
    for (var x = 0; x < _dimension.width; x++) {
      for (var y = 0; y < _dimension.height; y++) {
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
    
    if(_isImage(img)) {
      var
        width = options.width || img.width,
        height = options.height || img.height;
      
      var dim = _getImageDimensions(width, height);
      img.src = _getImageSrc(dim);
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
  
  /*!
  * Creates a new canvas object
  * 
  * @method _getCanvas
  * @return {Object} Returns a new canvas
  * @api private
  */
  function _getCanvas() {
    return Canvas ? new Canvas() : global.document.createElement('canvas');
  }
  
  /*!
  * Gets whether the given object is an image
  * 
  * @method _isImage
  * @param {Object} img The object to check
  * @return {Boolean} Returns true if it's an image, false otherwise
  * @api private
  */
  function _isImage(img) {
    return (Canvas && img instanceof Img) || (global.HTMLImageElement && img instanceof global.HTMLImageElement);
  }
  
  /*!
  * Gets whether the given object is a canvas
  * 
  * @method _isCanvas
  * @param {Object} c The object to check
  * @return {Boolean} Returns true if it's a canvas, false otherwise
  * @api private
  */
  function _isCanvas(c) {
    return (Canvas && c instanceof Canvas) || (global.HTMLCanvasElement && c instanceof global.HTMLCanvasElement);
  }
  
  /*!
  * Initializes the fuzzy object with the provided image. Uses the image to create a canvas which will be used for modifications.
  * 
  * @method _initImg
  * @param {Object} img Image to use for initialization
  * @api private
  */
  function _initImg(img) {
    var w = _canvas.width = img.width;
    var h = _canvas.height = img.height;
    _dimension = new Dimension(w, h);
    _context.drawImage(img, 0, 0, _dimension.width, _dimension.height);
  }

 /*!
  * Initializes the fuzzy object with the provided canvas. Uses the canvas to create a canvas which will be used for modifications.
  * 
  * @method _initCanvas
  * @param {Object} c Image to use for initialization
  * @api private
  */
  function _initCanvas(c) {
    var tempContext, data;

    var w = _canvas.width = c.width;
    var h = _canvas.height = c.height;
    _dimension = new Dimension(w, h);
    _originalCanvas = c;
    tempContext = _originalCanvas.getContext("2d");
    data = tempContext.getImageData(0, 0, _dimension.width, _dimension.height);
    _context.putImageData(data, 0, 0);
  }
  
 /*!
  * Gets a new image from the current data on the stored canvas
  * 
  * @method _getNewImage
  * @param {Number} width (Optional) The width of the new image
  * @param {Number} height (Optional) The height of the new image
  * @return {Object} Returns the new image
  * @api private
  */
  function _getNewImage(width, height) {
    var img = new Img();
      
    var dimension = _getImageDimensions(width, height);
      
    img.width = dimension.width;
    img.height = dimension.height;
    img.src = _getImageSrc(dimension);
    
    return img;
  }
  
 /*!
  * Gets the dimensions for a new image. 
  * If width and height are given, uses those. If only one is given, it infers the other. If none are given, it uses the canvas width/height.
  * 
  * @method _getImageDimensions
  * @param {Number} width (Optional) The width of the new image
  * @param {Number} height (Optional) The height of the new image
  * @return {Object} Returns an dimension object containing the new width/height
  * @api private
  */
  function _getImageDimensions(width, height) {
    var
      widthDimension = width, 
      heightDimension = height,
      hasWidth = width && typeof width === 'number' && width > 0,
      hasHeight = height && typeof height === 'number' && height > 0;
    
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
    
    return new Dimension(widthDimension, heightDimension);
  }

 /*!
  * Gets the source for a new image with the content on the canvas. 
  * If width/height given do not match the stored canvas, create a new cavnas to this new width/height and use that instead.
  * 
  * @method _getImageSrc
  * @param {Object} dimensions The desired dimensions for the image
  * @return {Object} Returns the source
  * @api private
  */
  function _getImageSrc(dimensions) {
    var newCanvas = _canvas;
        
    if (dimensions.width !== _dimension.width || dimensions.height !== _dimension.height) {
        newCanvas = _getCanvas();
        newCanvas.width = dimensions.width;
        newCanvas.height = dimensions.height;
        
        newCanvas.getContext("2d").drawImage(_canvas, 0, 0, dimensions.width, dimensions.height);
      }
      
      return newCanvas.toDataURL();
  }
  
 /*!
  * Creates a new canvas and places to the content of the stored canvas into the newly created one
  * 
  * @method _getCanvasCopy
  * @return {Object} Returns the new canvas
  * @api private
  */
  function _getCanvasCopy() {
    var tempCanvas = _getCanvas();
    tempCanvas.width = _canvas.width;
    tempCanvas.height = _canvas.height;
    tempCanvas.getContext("2d").drawImage(_canvas, 0, 0, _canvas.width, _canvas.height);
    
    return tempCanvas;
  }
  
 /*!
  * Applies the invert filter. If a color filter is provided, that channel is unaltered.
  * 
  * @method _invertColorFilter
  * @param {String} colorFilter (Optional) A channel to leave unchanged
  * @api private
  */
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
  
 /*!
  * Gets the average pixel value in the given area of pixels (for all 3 channels)
  * 
  * @method _getAvgPixel
  * @param {Number} x The x-coordinate of the pixel (zero based indexing)
  * @param {Number} y The y-coordinate of the pixel (zero based indexing)
  * @param {Number} width The width of the area we're altering
  * @param {Number} height The height of the area we're altering
  * @param {Number} wSize The width of the area we're averaging
  * @param {Number} wSize The height of the area we're averaging
  * @return {Object} Returns a pixel object containing the averaged 3 channels
  * @api private
  */
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
    
    return new Pixel (
      avgR, 
      avgB, 
      avgG
    );
  }
  
 /*!
  * Gets the pixel at the given (x, y).
  * Translates the (x, y) coordinate value to the correct array index
  * 
  * @method _getPixel
  * @param {Number} x The x-coordinate of the pixel (zero based indexing)
  * @param {Number} y The y-coordinate of the pixel (zero based indexing)
  * @return {Object} Returns the pixel object
  * @api private
  */
  function _getPixel(x, y) {
    var index = (x + y * _imgData.width) * 4;
    return new Pixel(
      _imgData.data[index + 0],
      _imgData.data[index + 1],
      _imgData.data[index + 2],
      _imgData.data[index + 3]
    );
  }

 /*!
  * Sets the pixel at the given (x, y).
  * Translates the (x, y) coordinate value to the correct array index
  * 
  * @method _setPixel
  * @param {Number} x The x-coordinate of the pixel (zero based indexing)
  * @param {Number} y The y-coordinate of the pixel (zero based indexing)
  * @param {Object} pixel The new pixel values
  * @param {Object} pixels (Optional) The array of pixels we're changing. Defaults to _imgData.data.
  * @api private
  */
  function _setPixel(x, y, pixel, pixels) {
    var index;
    
    pixels = pixels || _imgData.data;
    index = (x + y * _imgData.width) * 4;
    pixels[index + 0] = pixel.r;
    pixels[index + 1] = pixel.g;
    pixels[index + 2] = pixel.b;
    pixels[index + 3] = pixel.a;
  }

 /*!
  * Sets the pixel at the given (x, y).
  * Translates the (x, y) coordinate value to the correct array index
  * 
  * @method _setPixel
  * @param {Number} x The x-coordinate of the pixel (zero based indexing)
  * @param {Number} y The y-coordinate of the pixel (zero based indexing)
  * @param {Object} matrix The convolution matrix
  * @param {Object} divisor The divisor
  * @param {Object} offset The offset
  * @return {Object} Returns a pixel object with the new rgb values
  * @api private
  */
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
    
    return new Pixel(red, green, blue);
  }
  
 /*!
  * Applies a motion blur affect with the given width/height
  * An equal width/height simply applies a box blur.
  * 
  * @method _motionBlur
  * @param {Number} w The width of the blur area
  * @param {Number} h The height of the blur area
  * @api private
  */
  function _motionBlur(w, h) {
    h = h < 0 ? 0 : h;
    w = w < 0 ? 0 : w;

    for (var i = 0; i < _dimension.width; i++) {
      for (var j = 0; j < _dimension.height; j++) {
        var avgPixel = _getAvgPixel(i, j, _dimension.width, _dimension.height, w, h);
        
        for (var x = i; x < i + w && x < _dimension.width; x++) {
          for (var y = j; y < j + h && y < _dimension.height; y++) {
            avgPixel.a = _getPixel(x, y).a;
            _setPixel(x, y, avgPixel);
          }
        }
      }
    }
  }
  
 /*!
  * Pixel object used to store pixel channel data
  *
  * @method Pixel
  * @param {Number} r The red channel value
  * @param {Number} g The green channel value
  * @param {Number} b The blue channel value
  * @param {Number} a The alpha channel value
  * @api private
  */
  function Pixel(red, green, blue, alpha) {
      this.r = (!red || typeof red !== 'number') ? 0 : Math.min(255, Math.max(0, red));
      this.g = (!green || typeof green !== 'number') ? 0 : Math.min(255, Math.max(0, green));
      this.b = (!blue || typeof blue !== 'number') ? 0 : Math.min(255, Math.max(0, blue));
      this.a = (!alpha || typeof alpha !== 'number') ? 255 : Math.min(255, Math.max(0, alpha));
  }

 /*!
  * Dimension object used t specify a width/height
  *
  * @method Dimension
  * @param {Number} w The width
  * @param {Number} h The height
  * @api private
  */
  function Dimension(w, h) {
      this.width = (!w || typeof w !== 'number' || w < 0) ? 0 : w;
      this.height = (!h || typeof h !== 'number' || h < 0) ? 0 : h;
  }

  global.fuzzy = fuzzy;

}(typeof exports === 'object' && exports || this));
