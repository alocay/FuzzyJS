

<!-- Start lib\fuzzy.js -->

fuzzy js
https://github.com/alocay/FuzzyJS

Copyright (c) 2014 Armando Locay
Licensed under the MIT license.

## fuzzy(imgObj)

Entry point for the fuzzy library functionality

A new canvas is created based on the image/canvas given. All modifications happen on this canvas, so the original canvas is left untouched.

### Params: 

* **Object** *imgObj* The object containing the image data. Can be either an HTMLImageElement or an HTMLCanvasElement

## colorFilters

Simple object used for passing in color filters

Current values
   - `fuzzy.colorFilters.RED`
   - `fuzzy.colorFilters.GREEN`
   - `fuzzy.colorFilters.BLUE`
   - `fuzzy.colorFilters.NONE`

See: fuzzy.colorFilter

## directions

Simple object used for passing in directions for blurs

Current values
   - `fuzzy.directions.VERTICAL`
   - `fuzzy.directions.HORIZONTAL`

See: fuzzy.motionBlur

## colorFilter(colorFilter)

Applies a very simple color filter by filtering out the OTHER colors

### Examples:
    fuzzy(img).colorFilter(fuzzy.colorFilters.RED).draw(); // filters out green and blue

Best to use the predefined values found in `fuzzy.colorFilters`

See: fuzzy.colorFilters

### Params: 

* **String** *colorFilter* The color to use in the filter

### Return:

* **Object** Returns the current instance of `fuzzy`

## invert(colorFilter)

Applies a negative filter

You can also pass a color filter to this method and that pixel value will not be altered

### Examples:
    fuzzy(img).invert().draw();
    fuzzy(img).invert(fuzzy.colorFilters.GREEN).draw();

### Params: 

* **Object** *colorFilter* (Optional) Specifies a color to leave unaltered for each pixel

### Return:

* **Object** Returns the current instance of `fuzzy`

## greyscale()

Applies a grey scale effect

### Example:
    fuzzy(img).greyscale().draw();

### Return:

* **Object** Returns the current instance of `fuzzy`

## pixelate(pixelSize)

Applies a pixelation effect

### Example:
    fuzzy(img).pixelate(4).draw();

### Params: 

* **(Number)** *pixelSize* Specifies the pixel size for the pixelation effect

### Return:

* **Object** Returns the current instance of `fuzzy`

## boxBlur(blurSize)

Applies a box blur effect

### Example:
    fuzzy(img).boxBlur(5).draw();

### Params: 

* **(Number)** *blurSize* The size of the blur. The larger the number, the greater the affect.

### Return:

* **Object** Returns the current instance of `fuzzy`

## horizontalBlur(blur, direction)

Applies a horizontal motion blur effect

### Example:
    fuzzy(img).horizontalBlur(5).draw();                             // applies a horizontal motion blur

### Params: 

* **(Number)** *blur* The size of the blur. The larger the number, the greater the affect.

### Return:

* **Object** Returns the current instance of `fuzzy`

## verticalBlur(blur, direction)

Applies a horizontal motion blur effect

### Example:
    fuzzy(img).verticalBlur(5).draw();                             // applies a vertical motion blur

### Params: 

* **(Number)** *blur* The size of the blur. The larger the number, the greater the affect.

### Return:

* **Object** Returns the current instance of `fuzzy`

## gaussianBlur()

Applies a gaussian blur effect

### Example:
    fuzzy(img).gaussianBlur().draw();

The convolution matrix used for `gaussianBlur` (with offset 0 and divisor 1) is the following:

    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1]

### Return:

* **Object** Returns the current instance of `fuzzy`

## emboss()

Applies a emboss effect

### Example:
    fuzzy(img).emboss().draw();

The convolution matrix used for `emboss` (with offset 0 and divisor 1) is the following:

    [-2, -1, 0],
    [-1,  1, 1],
    [ 0,  1, 2]

### Return:

* **Object** Returns the current instance of `fuzzy`

## sharpen()

Applies a sharpen effect

### Example:
    fuzzy(img).sharpen().draw();

The convolution matrix used for `sharpen` (with offset 0 and divisor 1) is the following:

    [    0, -0.33,     0],
    [-0.33,  2.33, -0.33],
    [    0, -0.33,     0]

### Return:

* **Object** Returns the current instance of `fuzzy`

## luminosity(value)

Changes the luminosity of the image

### Example:
    fuzzy(img).luminosity(1.5).draw(); // makes the image brighter 50%
    fuzzy(img).luminosity(0.5).draw(); // makes the image darker by 50%
    fuzzy(img).luminosity(1).draw();   // no change to the image

If no value is given, defaulted to 1.0

The convolution matrix used for `luminosity` (with offset 0 and divisor 1) is the following:

    [0, 0, 0],
    [0, x, 0],
    [0, 0, 0]

Where 'x' is the luminosity value

### Params: 

* **Number** *value* The value to change the image's luminosity. < 1 will darken the image and > 1 will brighten the image.

### Return:

* **Object** Returns the current instance of `fuzzy`

## edgetrace()

Applies an edge trace effect

### Example:
    fuzzy(img).edgetrace().draw();

The convolution matrix used for `edgetrace` (with offset 0 and divisor 1) is the following:

    [0,  1, 0],
    [1, -4, 1],
    [0,  1, 0]

### Return:

* **Object** Returns the current instance of `fuzzy`

## convolution(matrix, divisor, offset)

Applies the convolution matrix given to the image

### Example:
    fuzzy(img).convolution(matrix).draw();        // divisor is 1, offset is 0
    fuzzy(img).convolution(matrix, 5).draw();     // divisor is 5, offset is 0
    fuzzy(img).convolution(matrix, 10, 5).draw(); // divisor is 10, offset is 5

The matrix is expected to be a 3x3 matrix (2d array).

### Params: 

* **Object** *matrix* The 2d array representing the convolution matrix

* **Number** *divisor* A divisor to apply to the sums of the separate channels, defaults to 1

* **Number** *offset* An offset to add to the sums of the separate channels, defaults to 0

### Return:

* **Object** Returns the current instance of `fuzzy`

## draw(img, options)

Places the image data on the canvas

### Example:
After you apply your filters, the altered imaged data will not be placed until `draw()` is called.

    var filters = fuzzy(img).pixelate(5).invert(); // Not applied to canvas yet
    filters.draw(img);                             // Applied

Options can be passed along

    fuzzy(img).invert().draw(img, { width: 500, overwrite: true });

This function can take various options:
   - `overwrite`: Places the altered image data into the original canvas
   - `callback`: A callback to be called passing along a HTMLImageElement containing the alterations
   - `width`: Specifies the width to use when setting the image passed in directly or passed back through the callback (defaults to image width and finally to canvas width)
   - `height`: Specifies the height to use when setting the image passed in directly or passed back through the callback (defaults to image height and finally to canvas height)

### Params: 

* **Object** *img* (Optional) An HTMLImageElement to place the altered canvas' contents into

* **Object** *options* (Optional) Various options

### Return:

* **Object** A copy of the altered HTMLImageCanvas

## scale(w, h)

Simple scaling tool

Also places the altered image data into the internal canvas

Note: This will place canvas contents into the new image. If no effects have been applied, then this will simply scale, otherwise the new image will contain the effects.

### Example:
    var newImage = fuzzy(img).scale(500, 500);

### Params: 

* **Number** *w* the new width

* **Number** *h* the new height

### Return:

* **Object** Returns a new image with the new dimensions

<!-- End lib\fuzzy.js -->

