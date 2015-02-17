'use strict';

/**
 * Import plugins
 */
var gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    browserSync = require('browser-sync'),
    reload = browserSync.reload,
    runSequence = require('run-sequence'),
    argv = require('yargs').argv,
    del = require('del');

/**
 * Build vendors dependencies
 */
gulp.task('vendors', function() {
  /**
   * CSS VENDORS
   */
  gulp.src('assets/sass/plugins/*.css')
      .pipe($.concat('vendors.css'))
      .pipe($.minifyCss())
      .pipe(gulp.dest('build/css'));

  /**
   * JS VENDORS
   * (with jQuery and Bootstrap dependencies first)
   */

  gulp.src('assets/js/plugins/*.js')
    .pipe($.concat('vendors.min.js'))
    .pipe($.uglify())
    .pipe(gulp.dest('build/js'));


  /**
   * FONTS SOURCES
   * Important to add the bootstrap fonts to avoid issues with the fonts include path
   */
  gulp.src('assets/fonts/*')
    .pipe(gulp.dest('build/fonts'));
});

/**
 * Copy images
 */
gulp.task('img', function() {
  gulp.src([
      'assets/img/**/*'
    ])
    .pipe(gulp.dest('build/img'));
});

/**
 * Build styles from SCSS files
 * With error reporting on compiling (so that there's no crash)
 */
gulp.task('styles', function() {
  if (argv.production) { console.log('[styles] Processing styles for production env.' ); }
  else { console.log('[styles] Processing styles for dev env. No minifying here, for sourcemaps!') }

  return gulp.src('assets/sass/main.scss')
    .pipe($.sass({errLogToConsole: true}))
    .pipe($.if(!argv.production, $.sourcemaps.init()))
    .pipe($.autoprefixer({
      browsers: ['last 2 versions', 'safari 5', 'ie 8', 'ie 9', 'ff 27', 'opera 12.1']
    }))
    .pipe($.if(!argv.production, $.sourcemaps.write()))
    .pipe($.if(argv.production, $.minifyCss()))
    .pipe(gulp.dest('build/css'));
});

/**
 * Build JS
 * With error reporting on compiling (so that there's no crash)
 * And jshint check to highlight errors as we go.
 */
gulp.task('scripts', function() {
  return gulp.src('assets/js/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.concat('main.js'))
    .pipe(gulp.dest('build/js'))
    .pipe($.rename({ suffix: '.min' }))
    .pipe($.uglify())
    .pipe(gulp.dest('build/js'));
});

gulp.task('jekyll', function () {
  gulp.src(['./index.html', './_layouts/*.html', './_posts/*.{markdown,md}'])
    .pipe(jekyll({
      source: './',
      destination: './deploy/',
      bundleExec: true
      }))
    .pipe(gulp.dest('./deploy/'));
});


/**
 * Clean output directories
 */
gulp.task('clean', del.bind(null, ['build', 'styleguide']));

/**
 * Serve
 */
gulp.task('serve', ['styles', 'scripts'], function () {
  browserSync({
    server: {
      baseDir: ['site'],
    },
    open: false
  });
  gulp.watch(['assets/sass/**/*.scss'], function() {
    runSequence('vendors', 'styles', reload);
  });
  gulp.watch(['assets/img/**/*'], function() {
    runSequence('img', reload);
  });
  gulp.watch(['assets/js/**/*.js'], function() {
    runSequence('vendors', 'scripts', reload);
  });
});

/**
 * Deploy to GH pages
 */
gulp.task('deploy', function () {
  gulp.src("site/**/*")
    .pipe($.ghPages());
});

/**
 * Task to build assets on production server
 */
gulp.task('build', ['clean'], function() {
    argv.production = true;
    runSequence('vendors', 'styles', 'img', 'scripts');
});

/**
 * Default task
 */
gulp.task('default', ['clean'], function(cb) {
  runSequence('vendors', 'styles', 'img', 'scripts', cb);
});

