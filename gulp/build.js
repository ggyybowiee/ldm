'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');

var _ = require('lodash');

var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license', 'del']
});

gulp.task('partials', function() {
  return _.map(conf.apps, function(app) {
    return gulp.src([
        path.join(conf.paths.src, '/' + app.dir + '/**/*.html'),
        path.join(conf.paths.tmp, '/serve/' + app.dir + '/**/*.html')
      ])
      .pipe($.minifyHtml({
        empty: true,
        spare: true,
        quotes: true
      }))
      .pipe($.angularTemplatecache(app.name + '.js', {
        module: app.module,
        root: app.dir
      }))
      .pipe(gulp.dest(conf.paths.tmp + '/partials/'));
  });
});

// gulp.task('html', ['inject', 'partials'], function() {
gulp.task('html', ['inject'], function() {
  var parts = _.map(conf.apps, function(app) {
    return {
      file: gulp.src(path.join(conf.paths.tmp, '/partials/' + app.name + '.js'), { read: false }),
      options: {
        starttag: '<!-- ' + app.name + ':partials -->',
        ignorePath: path.join(conf.paths.tmp, '/partials'),
        addRootSlash: false
      }
    }
  });

  var htmlFilter = $.filter('*.html', { restore: true });
  var jsFilter = $.filter('**/*.js', { restore: true });
  var cssFilter = $.filter('**/*.css', { restore: true });
  var assets;
  var src = gulp.src(path.join(conf.paths.tmp, '/serve/*.html'));
  return _.reduce(parts, function(stream, part) {
    return stream.pipe($.inject(part.file, part.options));
  }, src)
    .pipe(assets = $.useref.assets())
    .pipe($.rev())
    .pipe(jsFilter)
    // .pipe($.sourcemaps.init())
    .pipe($.ngAnnotate())
    // .pipe($.uglify({ preserveComments: $.uglifySaveLicense })).on('error', conf.errorHandler('Uglify'))
    // .pipe($.sourcemaps.write('maps'))
    .pipe(jsFilter.restore)
    .pipe(cssFilter)
    .pipe($.sourcemaps.init())
    .pipe($.replace('../../bower_components/bootstrap-sass/assets/fonts/bootstrap/', '../fonts/'))
    .pipe($.minifyCss({ processImport: false }))
    .pipe($.sourcemaps.write('maps'))
    .pipe(cssFilter.restore)
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.revReplace())
    .pipe(htmlFilter)
    .pipe($.minifyHtml({
      empty: true,
      spare: true,
      quotes: true,
      conditionals: true
    }))
    .pipe(htmlFilter.restore)
    .pipe(gulp.dest(path.join(conf.paths.dist, '/')))
    .pipe($.size({ title: path.join(conf.paths.dist, '/'), showFiles: true }));
});

// Only applies for fonts from bower dependencies
// Custom fonts are handled by the "other" task
gulp.task('fonts', function() {
  return gulp.src($.mainBowerFiles())
    .pipe($.filter('**/*.{eot,svg,ttf,woff,woff2}'))
    .pipe($.flatten())
    .pipe(gulp.dest(path.join(conf.paths.dist, '/fonts/')));
});

gulp.task('images', function() {
  return gulp.src('bower_components/angular-tree-control/images/*.png')
    .pipe(gulp.dest(path.join(conf.paths.dist, '/images')));
});

gulp.task('doc', function() {
  gulp.src(['src/DOC/**/*'])
    .pipe(gulp.dest(path.join(conf.paths.dist, '/DOC/')));
  gulp.src(path.join(conf.paths.src, '/DOC/design/static/**/*'))
    .pipe(gulp.dest(path.join(conf.paths.dist, '/static/')));
})

gulp.task('other', function() {
  var fileFilter = $.filter(function(file) {
    return file.stat.isFile();
  });

  return gulp.src([
      path.join(conf.paths.src, '/**/*'),
      path.join('!' + conf.paths.src, '/**/*.{html,css,js,scss}')
    ])
    .pipe(fileFilter)
    .pipe(gulp.dest(path.join(conf.paths.dist, '/')));
});

gulp.task('external', function () {
  var fileFilter = $.filter(function(file) {
    return file.stat.isFile();
  });

  return gulp.src([
      path.join(conf.paths.src, '/external/**/*.js')
    ])
    .pipe(fileFilter)
    .pipe(gulp.dest(path.join(conf.paths.dist, '/external/')));
});

gulp.task('clean', function() {
  return $.del([path.join(conf.paths.dist, '/'), path.join(conf.paths.tmp, '/')]);
});

gulp.task('build', ['html', 'fonts', 'other', 'external', 'images', 'doc']);
