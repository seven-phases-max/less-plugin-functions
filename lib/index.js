
'use strict';

module.exports = LessPluginFunctions;

// ............................................................

function LessPluginFunctions(options) {
    this.options = new (require("./tinyargs.js"))([
        ['a', 'always-override', false, 'Always override native CSS or Less functions.'],
        ['g', 'globals-only',    false, 'Use only global scope definitions.']
    ], options);
}

LessPluginFunctions.prototype = {
    minVersion: [2, 4, 0],
    setOptions: function(args) {
        this.options.parse(args);
    },
    printUsage: function() {
        console.log("\nless-plugin-functions options:");
        console.log(this.options.usage());
    },
    install: function(less, pluginManager) {
        require("./main.js")(less,
            pluginManager, this.options.options);
    }
};
