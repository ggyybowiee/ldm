'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');

var browserSync = require('browser-sync');

var $ = require('gulp-load-plugins')();
var _ = require('lodash');

// gulp.task('scripts-reload', function() {
//   return buildScripts()
//     .pipe(browserSync.stream());
// });

gulp.task('scripts', function() {
  return buildScripts();
});

_.each(conf.apps, function(app) {
  gulp.task(`scripts-reload-${app.dir}`, function() {
    return buildModuleScripts(app.dir).pipe(browserSync.stream());
  });
});

function buildScripts() {
  return gulp.src([
    path.join(conf.paths.src, '/**/*.js'),
    path.join('!' + conf.paths.src, '/assets/*.js'),
    path.join('!' + conf.paths.src + '/DOC', '/**/*.js')
    ]).pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.size())
};

function buildModuleScripts(dir) {
  return gulp.src(path.join(`${conf.paths.src}/${dir}`, '/**/*.js'))
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.size())
}
