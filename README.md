# less-plugin-functions

Write genuine [Less](http://lesscss.org) functions in Less itself.

[![npm version](https://badge.fury.io/js/less-plugin-functions.svg)](http://badge.fury.io/js/less-plugin-functions)
[![dependencies](https://david-dm.org/seven-phases-max/less-plugin-functions.svg)](https://david-dm.org/seven-phases-max/less-plugin-functions)
[![dev dependencies](https://david-dm.org/seven-phases-max/less-plugin-functions/dev-status.svg)](https://david-dm.org/seven-phases-max/less-plugin-functions#info=devDependencies)

This experimental "proof-of-concept" plugin extends [Less](http://lesscss.org) with a possibility to define custom functions directly in Less itself and use them just like regular [built-in functions](http://lesscss.org/features/#features-overview-feature-functions).

Define `foo` function:
```less
.function {
    .foo(@x) {
        return: @x * 2;
    }
}
```
Use it:
```less
div {
    width: foo(21em); // -> 42em
}
```

## Installation

    npm install -g less-plugin-functions

## Usage

    lessc --functions file.less

For more details about using plugins with the command line Less compiler see
[the corresponding section](http://lesscss.org/usage/#plugins-how-do-i-use-a-plugin-command-line)
in the [Less documentation](http://lesscss.org).

Using with common Less tools:

- [`grunt-contrib-less`](https://github.com/gruntjs/grunt-contrib-less#usage-examples)
- [`gulp-less`](https://github.com/plus3network/gulp-less#using-plugins)

For more details on a programmatic Less plugin usage see [Using a plugin in code](http://lesscss.org/usage/#plugins-using-a-plugin-in-code).

## Feature Details

Custom functions recognizable by this plugin are defined as plain Less [mixins](http://lesscss.org/features/#mixins-parametric-feature) having either `.function-` prefix or being immediate descendant of a `.function` [namespace](http://lesscss.org/features/#features-overview-feature-namespaces-and-accessors). For example the following two snippets create the same function named `bar`.

Using namespace:
```less
.function {
    .bar() {
        return: red;
    }
}
```
Using prefix:
```less
.function-bar() {
	return: red;
}
```
The defined function can be used same way and anywhere a CSS/Less function can:
```less
div {
    background-color: bar();    // red
    color: lighten(bar(), 13%); // #ff4242
    // etc.
}
```
Don't miss that the defined function name is `bar`, without any prefix or a dot.

Additionally note that the function definitions should use only lowercase names (e.g. `.function-bar` not `.function-Bar`). Less function names are case-insensitive so for both `bar()` and `Bar()` call statements the compiler will look only for the lowercase `bar` definition  (for more details see [#1](https://github.com/seven-phases-max/less-plugin-functions/issues/1)).

#### Supported functionality

Since custom functions are defined as regular Less mixins, they inherit most of standard mixin behaviour and functionality. In particular:

* [Overloading](http://lesscss.org/features/#mixins-parametric-feature-pattern-matching) (aka "Arguments Pattern Matching")
* [Default Parameters](http://lesscss.org/features/#mixins-parametric-feature)
* [Variadic Arguments](http://lesscss.org/features/#mixins-parametric-feature-advanced-arguments-and-the-rest-variable)
* [Guards](http://lesscss.org/features/#mixin-guards-feature)

#### Return Value

Function return value is specified via `return` property.
```less
.function-foo() {
    return: "Hello, I'm the foo return value.";
}
```
Notice that since the return statement is just a regular CSS property it does not "return immediately", and any code after `return` is still in effect. Same way all default Less behavior of CSS properties applies to the `return` property as well.

E.g. it can be overridden:
```less
.function-bar() {
    return: 1;
    return: 2;
    // function returns 2
}
```
[merged](http://lesscss.org/features/#merge-feature):
```less
.function-baz() {
    return+: 1;
    return+: 2;
    // function returns 1, 2
}
```
etc.

#### Overriding CSS and built-in Less functions

Custom function definitions override CSS or [built-in](http://lesscss.org/functions/#functions-overview) Less functions of the same
name (certain performance critical functions are not overridable by default though, see [`-a` option](#--always-override--alwaysoverride) below for more details). That is, you can "replace"/"extend" any Less or even CSS function by your own implementation.

For example:
```less
// override `calc` globally:
.function-calc(@expr) {
    return: tired, won΄t calculate;
}

div {
    width: calc(50% - 20px);
    color: hsl(0, 50%, 25%);
}

span {
    color: hsl(0, 50%, 25%);

    // override `hsl` locally:
    .function-hsl(@h, @s, @l) {
        return: hsla(@h, @l, @s, 1); // happy debugging!
    }
}
```
CSS result:
```css
div {
    width: tired, won΄t calculate;
    color: #602020;
}
span {
    color: #9f6060;
}
```

#### More examples

See [included tests](test/less) for more advanced examples.

## Options

#### `--always-override` / `alwaysOverride`
>Always override native CSS or Less functions

Shorthand: `-a`. For performance reasons (mixin lookup is a costly process) certain CSS and built-in Less functions are marked as not overridable by the custom functions. Setting this option allows you to override *any*. Note however, this can significantly increase compilation time even if you don't override anything (for a typical Less framework/codebase this option may result in about 20% performance hit).

The list of functions not overridable w/o `-a` can be found [here](lib/no-overrides.js).

#### `--globals-only` / `globalsOnly`
>Use only global scope definitions

Shorthand: `-g`. By default the plugin searches for a possible function definition(s) starting from the current scope upwards (i.e. standard Less scoping). If your Less code is heavy on using too deep nesting and/or too many local mixins, such scope-aware lookup may negatively affect compilation time. This option allows you to restrict the search to a functions explicitly defined in the global scope.

For an average Less source code the performance difference is insignificant (unless `-a` option is also set), so normally you don't need this option (consider it as "experimental") unless you're hunting for every single bit of compilation time improvement.

## Implementation and Compatibility

To deliver its functionality this plugin has to use certain hackish tricks and methods a standard Less plugin is not supposed to use (simply because a standard Less plugin is not supposed to provide such functionality at all). This makes the plugin to be quite vulnerable to possible compiler internals changes, thus it's more tied to a particular Less version than a typical plugin would be.

_Currently supported Less versions are `2.4.0` or higher._

## Future

Because of the [implementation details](#implementation-and-compatibility) and sightly confusing function definition syntax, this functionality/feature ideally should be moved into the Less core (not necessarily using the same syntax).

See corresponding feature request and related discussion at [#538](https://github.com/less/less.js/issues/538). Please, do not hesitate to put your `+1` there if you find this functionality valuable.
