# Fuzzy

A simple image filter/processing JavaScript library

## Getting Started
### In the browser
Download the [production version][min] or the [development version][max].

[min]: https://raw.github.com/aloca_000/Fuzzy/master/dist/fuzzy.min.js
[max]: https://raw.github.com/aloca_000/Fuzzy/master/lib/fuzzy.js

In your web page:

```html
<script src="dist/fuzzy.min.js"></script>
<script>
var canvas = document.getElementById("myCanvas");
var img = document.getElementById("myImage");

// pixelates the image on the canvas and sets the Image element's src to this modified image
fuzzy(canvas).pixelate(5).draw({ img: img }); 

// inverts the image on the canvas and returns a new canvas
var newCanvas = fuzzy(canvas).invert().draw(); 
</script>
```

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
