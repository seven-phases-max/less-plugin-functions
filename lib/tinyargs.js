
'use strict';

module.exports = TinyArgs;

var utilFormat = require('util').format;

// ............................................................

var SHORT = 0,
    LONG  = 1,
    VALUE = 2,
    TEXT  = 3;

function TinyArgs(ctor, other, cleanErrors__) {
    var opts = {};
    ctor.forEach(function(a) {
        opts[switch2key(a[LONG])] = a[VALUE];
    });
    this.options = opts;
    this.ctor    = ctor;
    if (cleanErrors__)
        cleanErrors_();
    if (other)
        this.set(other);
}

TinyArgs.prototype = {

    set: function(other) {
        var opts = this.options;
        Object.keys(other).forEach(function(key) {
            if (opts.hasOwnProperty(key)) {
                var value = other[key];
                opts[key] = verifyType(key + ': '
                    + value, typeof(opts[key]), value);
            } else {
                warning("unknown option '" + key + "'.");
            }
        });
    },

    parse: function(args) {
        args = (' ' + args.trim()).split(' -');
        if (args[0] === '')
            return this.parse_(args.slice(1));

        var s = args[0].slice(1);
        error("unexpected option '" + s + "',",
            "did you mean: '--" + s + "'?");
    },

    parse_: function(args) {
        var k, i, s, a;
        for (i = 0; i < args.length; i++) {
            a = args[i].trim().split(/[=:\s]/);
            s = a[0];
            a = a.slice(1);
            if ((s.length > 1) && (s[0] !== '-')) {
                // split & parse compact "-xyz=value" form:
                s = s.split('');
                if (a.length > 0)
                    s[s.length - 1] += '='
                        + a.join(' ');
                this.parse_(s);
            } else {
                k = this.key_(s);
                if (k)
                    this.options[k.key] = convValue('-' + args[i],
                        k.value, (a.length > 1) ? a : a[0]);
                else
                    error("unknown option '-" + s + "'");
            }
        }
    },

    usage: function() {
        var punct = '  -, --  '.length,
            width = this.ctor.reduce(function(r, d) {
                var n = d[LONG].length + d[SHORT].length;
                return (n > r) ? n : r;
            }, 0);

        return this.ctor.map(function(d) {
            var tail,
                n = d[SHORT].length + d[LONG].length,
                s = '  -'  + d[SHORT]
                  + ', --' + d[LONG]
                  + indent(width - n)
                  + '  '   + d[TEXT];

            n = '\n' + indent(width + punct);
            tail = (d.length < (TEXT + 2)) ? ''
                : (n + d.slice(TEXT + 1).join(n));

            return s + tail;
        }).join('\n');
    },

    key_: function(arg) {
        if (this.keys)
            return this.keys[arg];

        var keys = {};
        this.ctor.forEach(function(a) {
            keys['-' + a[LONG]] =
            keys[     a[SHORT]] = {
                key: switch2key(a[LONG]),
                value: a[VALUE]
            };
        });

        this.keys = keys;
        return keys[arg];
    }
};

// ............................................................

var warning = console.warn,
    error   = function() {
        throw new Error(utilFormat.apply(null, arguments));
    };

function cleanErrors_() {
    error = console.error;
}

// ............................................................

var S80 = new Array(80/8 + 1).join("        ");

function indent(n) {
    return (n > 0) ? S80.slice(-n) : "";
}

// ............................................................

function switch2key(s) {
    // convert '-option-name' to 'optionName':
    return s.replace(/-[\w]/g, function(m) {
        return m[1].toUpperCase(m);
    });
}

// ............................................................
// TODO:

function convValue(option, def, value) {
    var type = typeof(def),
        func = convValueFunc[type];
    if (func === undefined)
        return error("not implemented option type",
            "'" + type + "' for '" + option + "'");
    return verifyType(option, type, func(option, def, value));
}

function verifyType(option, type, value) {
    if (type !== typeof(value))
        return error("unexpected option value",
            "'" + option + "', should be", type);
    return value;
}

var convValueFunc = {
    'boolean': function(option, def, value) {
        return {
            'undefined': !def,
            'false':    false,
            'true':      true,
            'off':      false,
            'on':        true
        }[value];
    },
    'string': function convValueString(option, def, value) {
        if (value === undefined)
            error("missing '" + option + "' value");
        return value;
    }
};

// ............................................................
