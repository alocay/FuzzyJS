# FuzzyJS

A simple image filter/processing JavaScript library

[Simple Fuzzy JS Demo](http://fuzzyjs.webuda.com/)

## Getting Started
### In the browser
Download the [production version][min] or the [development version][max].

[min]: https://raw.github.com/aloca_000/Fuzzy/master/dist/fuzzy.min.js
[max]: https://raw.github.com/aloca_000/Fuzzy/master/dist/fuzzy.js

In your web page:

```html
<script src="dist/fuzzy.min.js"></script>
<script>
var canvas = document.getElementById("myCanvas");
var img = document.getElementById("myImage");
var img2 = document.getElementById("myImage2");
var img3 = document.getElementById("myImage3");

var addNewImage = function (image) {
	document.body.appendChild(image);
};

// pixelates and sets the modified image to 'img'
fuzzy(canvas).pixelate(5).draw(img); 

// inverts and invokes the given callback with the new modified image
fuzzy(img2).invert().draw(null, { callback: addNewImage, width: 500 });

// adds a color filter and sets 'img3' to the modified image
// also calls 'addNewImage' with a new image (with the same modification) with a width of 500
fuzzy(canvas).colorFilter(fuzzy.colorFilters.RED).draw(img3, { callback: addNewImage, width: 500 });

// inverts and returns the canvas
var newCanvas = fuzzy(canvas).invert().draw(); 
</script>
```

There are various other operations, please refer to the documentation.

## Documentation
_(Coming soon)_

## Examples
_(Coming soon)_

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

_Also, please don't edit files in the "dist" subdirectory as they are generated via Grunt. You'll find source code in the "lib" subdirectory!_

## Release History
_(Nothing yet)_

## License
Copyright (c) 2014 Armando Locay  
Licensed under the MIT license.
