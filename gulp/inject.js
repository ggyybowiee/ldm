'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');

var $ = require('gulp-load-plugins')();

var wiredep = require('wiredep').stream;
var _ = require('lodash');

var browserSync = require('browser-sync');

gulp.task('inject-reload', ['inject'], function() {
  browserSync.reload();
});

gulp.task('inject', ['scripts', 'styles'], function () {
  var styles = [], scripts = [];
  _.each(conf.apps, function(app) {
    styles.push({
      name: app.name,
      src: gulp.src([
          path.join(conf.paths.tmp, '/serve/' + app.dir + '/**/*.css'),
          path.join('!' + conf.paths.tmp, '/serve/' + app.dir + '/vendor.css')
        ], { read: false })
    });
    scripts.push({
      name: app.name,
      src: gulp.src([
          path.join(conf.paths.src, '/' + app.dir + '/**/*.module.js'),
          path.join(conf.paths.src, '/' + app.dir + '/**/*.js'),
          path.join('!' + conf.paths.src, '/' + app.dir + '/**/*.spec.js'),
          path.join('!' + conf.paths.src, '/' + app.dir + '/**/*.mock.js')
        ])
        .pipe($.angularFilesort()).on('error', conf.errorHandler('AngularFilesort'))
    });
  });

  var injectOptions = {
    ignorePath: [conf.paths.src, path.join(conf.paths.tmp, '/serve')],
    addRootSlash: false
  };

  var src = gulp.src(path.join(conf.paths.src, '/*.html'));
  var afterStyles = _.reduce(styles, function(stream, style) {
    return stream.pipe($.inject(style.src, _.extend({name: style.name}, injectOptions)))
  }, src);
  var afterScripts = _.reduce(scripts, function(stream, script) {
    return stream.pipe($.inject(script.src, _.extend({name: script.name}, injectOptions)))
  }, afterStyles);
  return afterScripts.pipe(wiredep(_.extend({}, conf.wiredep)))
    .pipe(gulp.dest(path.join(conf.paths.tmp, '/serve')));
});
