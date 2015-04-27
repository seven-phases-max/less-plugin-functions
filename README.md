# less-plugin-functions

Write genuine [Less](http://lesscss.org) functions in Less itself.

[![npm version](https://badge.fury.io/js/less-plugin-functions.svg)](http://badge.fury.io/js/less-plugin-functions)
[![dependencies](https://david-dm.org/seven-phases-max/less-plugin-functions.svg)](https://david-dm.org/seven-phases-max/less-plugin-functions)
[![dev dependencies](https://david-dm.org/seven-phases-max/less-plugin-functions/dev-status.svg)](https://david-dm.org/seven-phases-max/less-plugin-functions#info=devDependencies)

This experimental "proof-of-concept" plugin extends [Less](http://lesscss.org) with a possibility to define functions directly in Less itself and use them just like regular [built-in functions](http://lesscss.org/functions/#functions-overview).
```less
// define:
.function {
    .foo(@x) {
        return: @x * 2;
    }
}

// use:
div {
    width: foo(21em); // -> 42em
}
```

## Installation

    npm install -g less-plugin-functions
    
## Using with [`lessc`](http://lesscss.org/usage/#command-line-usage)

    lessc --functions file.less
    
For more details about using plugins with the command line Less compiler see 
[the corresponding section](http://lesscss.org/usage/#plugins-how-do-i-use-a-plugin-command-line) 
in the [Less documentation](http://lesscss.org).

## Using with common Less tools

- [`grunt-contrib-less`](https://github.com/gruntjs/grunt-contrib-less#usage-examples)
- [`gulp-less`](https://github.com/plus3network/gulp-less#using-plugins)

## Programmatic Usage

See [Using a plugin in code](http://lesscss.org/usage/#plugins-using-a-plugin-in-code).