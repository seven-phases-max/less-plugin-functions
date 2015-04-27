'use strict';

module.exports = function (grunt) {

    require('time-grunt')(grunt);
    require('jit-grunt')(grunt);

    grunt.initConfig({
    
        less: {
            base: {
                expand:   true,
                flatten:  true,
                src:     'test/less/*.less',
                dest:    'test/tmp/css',
                ext:     '.css', 
            }
        },

        compare: {
            src:  '**/*.css',
            dest: 'test/tmp/css',
            cwd:  'test/css'
        },

        jshint: {
            options: {
                jshintrc: 'test/.jshintrc'
            },
            src: [
                'lib/*.js',
                'Gruntfile.js',
                'test/compare.js'
            ],
        },

        clean: ['test/tmp']

    });

    grunt.registerTask('compare', require('./test/compare')(grunt));

    var addLessTask = (function() {
        var base   = grunt.config('less.base'),
            Plugin = require('../less-plugin-functions');
        
        grunt.config.set('less.base', {});
        return function(name, options) {
            var task = 'less.' + name;
            grunt.config.set(task, grunt.util
                .recurse(base, function(value) {return value;}));
            grunt.config.set(task + '.options.plugins', [new Plugin(options)]);
            grunt.config.set(task + '.dest', base.dest + '/' + name);
        };
    })();
    
    addLessTask('default',         {});
    addLessTask('globals-only',    {globalsOnly: true});
    addLessTask('always-override', {alwaysOverride: true});

    grunt.registerTask('regression', [
        'clean',
        'less',
        'compare'
    ]);

    grunt.registerTask('test', [
        'jshint',
        'regression'
    ]);

    grunt.registerTask('default', ['test']);

};
