

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

* **Object** Returns the current instance `fuzzy`

## greyscale()

Applies a grey scale effect

### Example:
    fuzzy(img).greyscale().draw();

### Return:

* **Object** Returns the current instance `fuzzy`

## pixelate(pixelSize)

Applies a pixelation effect

### Example:
    fuzzy(img).pixelate(4).draw();

### Params: 

* **(Number)** *pixelSize* Specifies the pixel size for the pixelation effect

### Return:

* **Object** Returns the current instance `fuzzy`

## boxBlur(The)

Applies a box blur effect

### Example:
    fuzzy(img).boxBlur(5).draw();

### Params: 

* **(Number)** *The* size of the blur. The larger the number, the greater the affect.

### Return:

* **Object** Returns the current instance `fuzzy`

## draw((Optional), (Optional))

Places the image data on the canvas

### Example:
After you apply your filters, the altered imaged data will not be placed until `draw()` is called.
    var filters = fuzzy(img).pixelate(5).invert(); // Not applied to canvas yet
    filters.draw(img);                             // Applied

This function can take various options:
    - `overwrite`: Places the altered image data into the original canvas
    - `callback`: A callback to be called passing along a HTMLImageElement containing the alterations
    - `width`: Specifies the width to use when setting the image passed in directly or passed back through the callback (defaults to image width and finally to canvas width)
    - `height`: Specifies the height to use when setting the image passed in directly or passed back through the callback (defaults to image height and finally to canvas height)

### Params: 

* **Object** *(Optional)* An HTMLImageElement to place the altered canvas&#39; contents into

* **Object** *(Optional)* Various options

### Return:

* **Object** A copy of the altered HTMLImageCanvas

## scale(w, h)

Simple scaling tool
Also places the altered image data into the canvas

### Example:
    var newImage = fuzzy(img).scale(500, 500);

### Params: 

* **Number** *w* the new width

* **Number** *h* the new height

### Return:

* **Object** Returns a new image with the new dimensions and containing the canvas content

<!-- End lib\fuzzy.js -->

