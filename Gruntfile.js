/*
 * emp.ria-grunt-jsbuild3
 * https://code.google.com/p/emp-ria/
 *
 * Copyright (c) 2013 Volodymyt Iatsyshyn
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var build_number = grunt.option("build") || '0';
  var build_tag = grunt.option("tag") || '0.0';

  var pkg = grunt.file.readJSON('package.json');
  pkg.version = build_tag || pkg.version;

  // Project configuration.
  grunt.initConfig({
    pkg: pkg,
    jshint: {
      all: [
        'Gruntfile.js',
        '{bin,lib,tools}/*.js',
      ],
      options: {
        jshintrc: '.jshintrc',
      },
    },

    exec: {
      jsbuild3: 'node bin/jsbuild3 --config test/jsbuild.json'
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp'],
    },

    replace: {
      version: {
        src: 'package.json',               // source files array (supports minimatch)
        dest: 'package.json',              // destination directory or file
        replacements: [{
          from: '0.0.0',                   // string replacement
          to: pkg.version
        }]
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-text-replace');
  grunt.loadNpmTasks('grunt-exec');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'exec']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);
};
