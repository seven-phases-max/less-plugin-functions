
'use strict';

module.exports = function(less, pluginManager, options) {

// ............................................................

    var tree         = less.tree,
        MixinCall    = tree.mixin.Call,
        mergeRules   = less.visitors.ToCSSVisitor.prototype._mergeRules,
        rootHook     = new RootContextVisitor(pluginManager),
        rootRegistry = less.functions.functionRegistry,
        overridable  = overridableFunc(options),
        builtinGet   = rootRegistry.get,
        stackDepth   = 0;

    var registryHook = !options.globalsOnly
        ? function() {return eagerLookup;}
        : function(name) {
            // this = <function-registry object>
            return fastLookup(rootHook.root, this, name);
        };

    // plugin.install can be used several times per less session
    // (e.g. Grunt compiling multiple files per task), hence ensure
    // we hook to real built-ins instead of an earlier hook:
    var id = '__pluginFuncsHook';
    if (builtinGet[id])
        builtinGet = builtinGet[id].builtin;
    rootRegistry.get = registryHook;
    rootRegistry.get[id] = {builtin: builtinGet};

    // ........................................................
    // global scope only lookup:

    function fastLookup(root, registry, name) {
        if (!overridable(name))
            return builtinGet.call(registry, name);

        // FIXME/TODO, the evaluated (copy of) `root` should actually be used here,
        // see test/expanded-definition.less for obvious example
        // (though this can be tricky as it can use the funcs during eval too, hmm...)

        var selector = mixinSelector(name),
            scope = {context: {frames: [root]}}; // hmm, fixme, is there a better way?

        function f(i) {return function() {
            // this = <function-caller object>
            scope.index           = this.index;
            scope.currentFileInfo = this.currentFileInfo;
            return callMixin(scope, selector[i], arguments);
        };}

        for (var i = 0; i < selector.length; i++)
            if (root.find(selector[i]).length > 0)
                return f(i);

        // no mixins found, fallback to a built-in Less function:
        return builtinGet.call(registry, name);
    }

    // ........................................................
    // scope-wise lookup:

    function eagerLookup() {
        // this = <function-caller object>
        // jshint validthis: true
        var name = this.name;
        if (overridable(name)) {
            var frames   = this.context.frames,
                selector = mixinSelector(name);
            // before callMixin we need to try to find if such mixin exist on our own, otherwise
            // MixinCall.eval will throw 'undefined' (if no such mixin) and it's hard to fallback.
            // (it's possible to catch hardcoded-error-message and continue, but this would be doh!).
            // So here callMixin goes only if mixin(s) exists for sure (search results are cached
            // so it should be not that bad from perf. point of view):
            for (var i = 0; i < selector.length; i++)
                for (var j = 0; j < frames.length; j++)
                    if (frames[j].rules && // <- see less/less.js#2574
                       (frames[j].find(selector[i]).length > 0))
                            return callMixin(this, selector[i], arguments);
        }

        // no mixins found, fallback to a built-in Less function:
        // (may be scope-wise since Less 2.5.0)
        // using global registry for now, but to be compatible with `@plugin`
        // it should run through all frames[0...n].functionRegistry, TODO:
        var f = builtinGet.call(rootRegistry, name);
        return f && f.apply(this, arguments);
    }

    // ........................................................

    function callMixin(scope, selector, args) {
        // scope = <function-caller object>

        // TODO: find a way to throw this at highest depth to not print 1000 errors :)
        assert(stackDepth < 1000, 'possible infinite recursion detected'
            + ' (nested function calls > 1000)');

        var value, rules = tryCallMixin(scope.context,
            new MixinCall(selector.elements, convertArgs(args),
                scope.index, scope.currentFileInfo));

        if (!rules)
            return;
        if (mergeRules)
            mergeRules(rules); // first merge any `return+:` stuff
        for (var i = 0; i < rules.length; i++) {
            var r = rules[i];
            if (r.name && !r.variable) {
                assert(r.name === 'return', 'unexpected property `'
                     + r.name + '`, functions may not generate CSS properies');
                value = r.value;
            }
        }

        assert(value, 'can\'t deduce return value, either no'
            + ' mixin matches or return statement is missing');

        // FIXME: when a plain value assigned to a property, e.g. `return: red;`
        // the compiler does not bother to actually parse it and passes such
        // value as Anonymous. But here we have a problem when such value is
        // later used in further expressions (which can never happen in the core).
        // This should be fixed either in the core OR by using `@return` instead of `return` :(,
        // but so far here a dirty kludge goes :(
        if (value.type === "Anonymous")
           return reparseAnonymous(value);

        return value;
    }

    function tryCallMixin(context, mixinCall) {
        var r;
        ++stackDepth;
        try {r = mixinCall.eval(context);}
        catch (e) {error(e);}
        --stackDepth;
        return r;
    }

    function mixinSelector(name) {
        var Element  = tree.Element,
            Selector = tree.Selector;
        return [
            new Selector([
                new Element('', '.function'),
                new Element(' ', '.' + name)]),
            new Selector([
                new Element('', '.function-' + name)])
        ];
    }

    function reparseAnonymous(value) {
        var r, v = value.value;
        if (/^#([a-f0-9]{6}|[a-f0-9]{3})$/i.test(v)) // ref: functions.color
            return new tree.Color(v.slice(1));
        if ((r = /^([+-]?\d*\.?\d+)(%|[a-z]+)?$/i.exec(v))) // ref: Parser.dimension
            return new tree.Dimension(r[1], r[2]);
        if (/^[_a-z-][\w-]*$/i.test(v)) // keyword
            return tree.Color.fromKeyword(v)
                || new tree.Keyword(v);

        return value;
    }

// ............................................................

}; // ~ end of module.exports

// ............................................................

function RootContextVisitor(pluginManager) {
    pluginManager.addVisitor(this);
}

RootContextVisitor.prototype = {
    isPreEvalVisitor: true,
    run: function(root) {
        this.root = root;
        return root;
    }
};

// ............................................................

function overridableFunc(options) {
    if (options.alwaysOverride)
        return function() {return true;};
    var list = require("./no-overrides.js");
    return function(name) {
        return !list[name];
    };
}

// ............................................................

function convertArgs(src) {
    // convert function arguments to mixing arguments
    // (can't have named args support)
    var i, n = src.length, dst = new Array(n);
    for (i = 0; i < n; i++)
        dst[i] = {name: null, value: src[i]};
    return dst;
}

// ............................................................

function error(e) {
    // no reason to set file info here since tree.Call will override it anyway
    var id = '[plugin-functions] ';
    if (typeof e === 'string')
        e = {type: 'Runtime', message: e};
    // TODO: try to find better formatting for a nested call errors
    e.message = '\n  ' + id + e.message;
    throw e;
}

function assert(condition, msg) {
    return condition || error(msg);
}

// ............................................................
