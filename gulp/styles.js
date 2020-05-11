'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');

var browserSync = require('browser-sync');

var $ = require('gulp-load-plugins')();

var wiredep = require('wiredep').stream;
var _ = require('lodash');

gulp.task('styles-reload', function() {
  return _.each(buildAllStyles(), function(stream) {
    stream.pipe(browserSync.stream());
  });
});

gulp.task('styles', buildAllStyles);

_.each(conf.apps, function(app) {
  gulp.task(`styles-reload-${app.dir}`, function() {
    return buildStyles(createFile(app.dir)).pipe(browserSync.stream());
  });
});

var buildStyles = function(file) {
  var sassOptions = {
    style: 'expanded'
  };

  var injectOptions = {
    starttag: '// injector',
    endtag: '// endinjector',
    addRootSlash: false
  };

  return gulp.src([path.join(conf.paths.src, '/' + file.dir + '/index.scss')])
    .pipe($.inject(file.src, _.extend({}, injectOptions)))
    .pipe(wiredep(_.extend({}, conf.wiredep)))
    .pipe($.sourcemaps.init())
    .pipe($.sass(sassOptions)).on('error', conf.errorHandler('Sass'))
    .pipe($.autoprefixer()).on('error', conf.errorHandler('Autoprefixer'))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest(path.join(conf.paths.tmp, '/serve/' + file.dir + '/')));
};

function createFile(dir) {
  return {
    dir: dir,
    src: gulp.src([
        path.join(conf.paths.src, '/' + dir + '/**/*.scss'),
        path.join('!' + conf.paths.src, '/' + dir + '/index.scss')
      ], { read: false })
  };
}

function buildAllStyles() {
  const files = [];
  _.each(conf.apps, function(app) {
    files.push(createFile(app.dir));
  });
  return _.map(files, buildStyles);
}
