var gulp = require('gulp');
var fs = require('fs');
var $ = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;
var path = require('path');

var pkg = require('./package.json');
//var preprocessOpts = {context: { NODE_ENV: process.env.NODE_ENV || 'development', DEBUG: true}};

var dist = './dist';
var src = './src';

var glob = {
	scripts: [src+'/hg.js', src+'/**/*.js'],
	styles: src+'/**/*.styl'
};


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
		['editor']
	);
});

/*----------------------------------------------------------------------
	SCRIPTS
*/

gulp.task('scripts', function() {
	return gulp.src(glob.scripts)
		.pipe($.plumber({errorHandler: handleErrors}))
		.pipe($.eslint({ fix: true }))
		.pipe($.eslint.formatEach())
		.pipe($.eslint.failOnError())
		.pipe($.sourcemaps.init())
		.pipe($.concat('hex-grid.min.js'))
		.pipe($.uglify())
		.pipe($.sourcemaps.write('.'))
		.pipe(gulp.dest(dist))
		.pipe(browserSync.stream());
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
	gulp.watch(glob.scripts, ['scripts', reload]);
	gulp.watch(glob.styles, ['styles', reload]);
}

gulp.task('watch', function() {
	watch();
});

// Serves the editor
gulp.task('editor', function() {
	// watch and compile frontend
	browserSync.init({
		notify: false,
		server: {
			baseDir: ['./', './editor'],
			index: './editor/index.html'
		}
	});

	browserSync.watch('editor/**/*.*').on('change', browserSync.reload);

	watch();
});

// Serves the examples
gulp.task('examples', function() {
	// watch and compile frontend
	browserSync.init({
		notify: false,
		server: {
			baseDir: ['./', './examples'],
			index: './examples/index.html'
		}
	});

	browserSync.watch('examples/**/*.*').on('change', browserSync.reload);

	watch();
});

/*----------------------------------------------------------------------
	HELPERS
*/

function handleErrors() {
	var args = Array.prototype.slice.call(arguments);
	// Send error to notification center with gulp-notify
	$.notify.onError({
		title: 'Build error',
		message: '<%= error%>',
		showStack: true
	}).apply(this, args);

	// Keep gulp from hanging on this task
	this.emit('end');
}
