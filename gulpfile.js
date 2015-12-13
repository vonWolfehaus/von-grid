var gulp = require('gulp');
var fs = require('fs');
var $ = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;
var path = require('path');

var pkg = require('./package.json');

var dist = './dist';
var src = './src';
var scripts = src+'/**/*.js';
var styles = src+'/**/*.styl';
var preprocessOpts = {context: { NODE_ENV: process.env.NODE_ENV || 'development', DEBUG: true}};

/*----------------------------------------------------------------------
	MACRO
*/

gulp.task('default', ['clean'], function() {
	runSequence(
		['scripts']
	);
});

gulp.task('clean', del.bind(null, [dist]));

gulp.task('dev', ['clean'], function() {
	runSequence(
		['scripts'],
		['serve']
	);
});

/*----------------------------------------------------------------------
	SCRIPTS
*/

gulp.task('scripts', function() {
	return gulp.src(bundles.modules)
		.pipe($.sortAmd())
		//.pipe($.plumber({errorHandler: handleErrors}))
		//.pipe($.eslint({ fix: true }))
		//.pipe($.eslint.formatEach())
		//.pipe($.eslint.failOnError())
		.pipe($.sourcemaps.init())
		.pipe($.amdclean.gulp({
			prefixMode: 'camelCase'
			}))
		//.pipe($.preprocess(preprocessOpts))
		.pipe($.concat('modules.js'))
		// .pipe($.uglify())
		.pipe($.sourcemaps.write('.'))
		.pipe(gulp.dest(dist))
		.pipe($.size({title: 'scripts:modules'}));
});

/*----------------------------------------------------------------------
	CSS
*/
/*
gulp.task('styles', function() {
	return gulp.src(styles)
		.pipe($.plumber({errorHandler: handleErrors}))
		.pipe($.sourcemaps.init())
		.pipe($.stylus({
			compress: true
		}))
		.pipe($.autoprefixer())
		.pipe($.concat('styles.css'))
		.pipe($.sourcemaps.write('.'))
		.pipe(gulp.dest(dist))
});
*/

/*----------------------------------------------------------------------
	SERVER
*/

// Defines the list of resources to watch for changes.
function watch() {
	gulp.watch(bundles.modules, ['scripts:modules', reload]);
	gulp.watch(bundles.lib, ['scripts:lib', reload]);
	gulp.watch(bundles.common, ['scripts:common', reload]);
	gulp.watch([components+'/**/*.styl'], ['styles', reload]);
	gulp.watch([src+'/**/*.html'], ['pages', reload]);
	gulp.watch([src+'/images/**/*.{svg,png,jpg}'], ['images', reload]);
}

// Serves the landing page from "out" directory.
gulp.task('serve', ['nodemon'], function() {
	// watch and compile frontend
	browserSync.init({
		notify: false,
		proxy: 'http://localhost:3000',
		port: 4000
	});
	watch();
});

gulp.task('nodemon', function (cb) {
	var started = false;

	return $.nodemon({
		script: 'server.js'
	}).on('start', function() {
		// to avoid nodemon being started multiple times
		if (!started) {
			cb();
			started = true;
		}
	}).on('restart', function() {
		// reload connected browsers after a slight delay so the server should be booted by then
		setTimeout(function reload() {
			browserSync.reload({
				stream: false
			});
		}, 200);
	});
});

/*----------------------------------------------------------------------
	HELPERS
*/

function handleErrors() {
	var args = Array.prototype.slice.call(arguments);
	// Send error to notification center with gulp-notify
	$.notify.onError({
		title: "Build error",
		message: "<%= error%>",
		showStack: true
	}).apply(this, args);

	// Keep gulp from hanging on this task
	this.emit('end');
}
