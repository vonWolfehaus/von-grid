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
var components = src+'/components';
var scripts = src+'/modules';
var preprocessOpts = {context: { NODE_ENV: process.env.NODE_ENV || 'development', DEBUG: true}};

var bundles = {
	lib: [
		src+'/lib/page.min.js',
		src+'/lib/riot.min.js',
		src+'/lib/material.min.js',
		src+'/lib/define.min.js',
		src+'/lib/baobab.min.js',
		src+'/lib/wildemitter.min.js',
		src+'/lib/moment-with-locales.min.js',
	],
	modules: [
		scripts+'/**/*.js',
	],
	common: [
		components+'/mixins/*.js',
		components+'/**/*.tag'
	]
};

/*----------------------------------------------------------------------
	MACRO
*/

gulp.task('default', ['clean'], function() {
	runSequence(
		['scripts'],
		['styles'],
		['copy:root', 'pages', 'assets']
	);
});

gulp.task('clean', del.bind(null, [dist]));

gulp.task('dev', ['clean'], function() {
	runSequence(
		['scripts'],
		['styles'],
		['copy:root', 'pages', 'assets'],
		['serve']
	);
});

/*----------------------------------------------------------------------
	SCRIPTS
*/

gulp.task('scripts', ['scripts:lib', 'scripts:modules', 'scripts:common']);

gulp.task('scripts:lib', function() {
	return gulp.src(bundles.lib)
		.pipe($.plumber({errorHandler: handleErrors}))
		.pipe($.sourcemaps.init())
		.pipe($.concat('lib.js'))
		.pipe($.sourcemaps.write('.'))
		.pipe(gulp.dest(dist))
		.pipe($.size({title: 'scripts:lib'}));
});

gulp.task('scripts:modules', function() {
	return gulp.src(bundles.modules)
		.pipe($.sortAmd())
		.pipe($.plumber({errorHandler: handleErrors}))
		.pipe($.eslint({ fix: true }))
		.pipe($.eslint.formatEach())
		.pipe($.eslint.failOnError())
		.pipe($.sourcemaps.init())
		.pipe($.preprocess(preprocessOpts))
		.pipe($.concat('modules.js'))
		// .pipe($.uglify())
		.pipe($.sourcemaps.write('.'))
		.pipe(gulp.dest(dist))
		.pipe($.size({title: 'scripts:modules'}));
});

gulp.task('scripts:common', function() {
	return gulp.src(bundles.common)
		.pipe($.plumber({errorHandler: handleErrors}))
		.pipe($.sourcemaps.init())
		.pipe($.if('*.tag', $.riot({ compact: true })))
		.pipe($.eslint({ fix: true }))
		.pipe($.eslint.format())
		.pipe($.eslint.failAfterError())
		.pipe($.preprocess(preprocessOpts))
		.pipe($.concat('common.js'))
		//pipe($.uglify().on('error', $.util.log))
		.pipe($.sourcemaps.write('.'))
		.pipe(gulp.dest(dist))
		.pipe($.size({title: 'scripts:common'}));
});

gulp.task('scripts:welcome', function() {
	return gulp.src(components+'/welcome/*.tag')
		.pipe($.plumber({errorHandler: handleErrors}))
		.pipe($.sourcemaps.init())
		.pipe($.riot({ compact: true }))
		.pipe($.preprocess(preprocessOpts))
		.pipe($.concat('welcome.js'))
		.pipe($.uglify())
		.pipe($.sourcemaps.write('.'))
		.pipe(gulp.dest(dist))
		.pipe($.size({title: 'scripts:welcome'}));
});

/*----------------------------------------------------------------------
	CSS
*/

gulp.task('styles', function() {
	return gulp.src([components+'/**/*.styl'])
		.pipe($.plumber({errorHandler: handleErrors}))
		.pipe($.sourcemaps.init())
		.pipe($.stylus({
			compress: true
		}))
		.pipe($.autoprefixer())
		.pipe($.concat('styles.css'))
		.pipe($.sourcemaps.write('.'))
		.pipe(gulp.dest(dist))
		.pipe($.size({title: 'styles'}));
});

/*----------------------------------------------------------------------
	HTML
*/

gulp.task('pages', function() {
	return gulp.src(src+'/**/*.html')
		.pipe($.plumber({errorHandler: handleErrors}))
		.pipe($.preprocess(preprocessOpts))
		.pipe($.minifyHtml({
			empty: true
		}))
		.pipe($.flatten())
		.pipe(gulp.dest(dist));
});

/*----------------------------------------------------------------------
	COPY
*/

gulp.task('copy:root', function() {
	return gulp.src([
			src+'/lib/material.min.css',
			src+'/lib/*.map',
			src+'/images/favicon.ico'
		])
		.pipe($.flatten())
		.pipe(gulp.dest(dist));
});

/*----------------------------------------------------------------------
	ASSETS
*/

gulp.task('assets', ['images', 'fonts']);

gulp.task('images', function() {
	return gulp.src(src+'/images/**/*.{svg,png,jpg}')
		.pipe($.plumber({errorHandler: handleErrors}))
		.pipe($.flatten())
		.pipe(gulp.dest(dist+'/images'))
		.pipe($.size({title: 'images'}));
});

gulp.task('fonts', function() {
	return gulp.src([src+'/fonts/*.*'])
		.pipe(gulp.dest(dist+'/fonts'));
});

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
