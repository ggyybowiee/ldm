'use strict';

var path = require('path');
var process = require('process');
var gulp = require('gulp');
var fs = require('fs');
var conf = require('./conf');

var browserSync = require('browser-sync');
var $ = require('gulp-load-plugins')();
var _ = require('lodash');

function isOnlyChange(event) {
  return event === 'change';
}

function isOnlyAdd(event, filePath) {
  return event === 'add' && !(fs.readFileSync(filePath).length);
}

gulp.task('watch', ['inject'], function () {

  $.watch([path.join(conf.paths.src, '/*.html'), path.join('!' + conf.paths.src, '/' + 'DOC/**/**'), 'bower.json'], function() {
    gulp.start('inject-reload');
  });

  $.watch([
    path.join(conf.paths.src, '/**/*.css'),
    path.join(conf.paths.src, '/**/*.scss')
  ], function({ event, path: filePath }) {
    const module = path.relative(process.cwd(), filePath).split(path.sep)[1];
    console.log('css: ' + module);
    if(isOnlyChange(event)) {
      if(module === 'sass') {
        gulp.start('styles-reload');
      }else {
        gulp.start(`styles-reload-${module}`);
      }
    } else {
      gulp.start('inject-reload');
    }
  });

  {
    const emptys = [];
    $.watch(path.join(conf.paths.src, '/**/*.js'), function({ event, path: filePath }) {
      // return;
      const module = path.relative(process.cwd(), filePath).split(path.sep)[1];
      if(isOnlyChange(event)) {
        console.log(`${filePath}: change`);
        if(emptys.indexOf(filePath) > -1) {
          gulp.start('inject-reload');
          _.remove(emptys, ele => ele === filePath);
        }else {
          gulp.start(`scripts-reload-${module}`);
        }
      } else if(isOnlyAdd(event, filePath)) {
        console.log(`${filePath}: add empty`);
        emptys.push(filePath);
      } else {
        gulp.start('inject-reload');
      }
    });
  }

  $.watch(path.join(conf.paths.src, '/**/*.html'), function({event, path: filePath}) {
    // return;
    browserSync.reload(filePath);
  });

});
