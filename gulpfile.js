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

var dist = 'dist';
var src = 'src';

var glob = {
	scripts: [src+'/vg.js', src+'/**/*.js'],
	hexScripts: [src+'/vg.js', src+'/**/*.js', '!src/grids/Square.js', '!src/grids/SquareGrid.js'],
	sqrScripts: [src+'/vg.js', src+'/**/*.js', '!src/grids/Hex.js', '!src/grids/HexGrid.js'],
	editorScripts: ['editor/ui/**/*.js', 'editor/modules/**/*.js'],
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
		['watch']
	);
});

gulp.task('dev-ed', ['clean'], function() {
	runSequence(
		['scripts', 'scripts-editor'],
		['serve-editor']
	);
});

/*----------------------------------------------------------------------
	SCRIPTS
*/

gulp.task('scripts', ['all', 'hex', 'sqr']);

gulp.task('all', function() {
	return gulp.src(glob.scripts)
		.pipe($.plumber({errorHandler: handleErrors}))
		.pipe($.eslint({ fix: true }))
		.pipe($.eslint.formatEach())
		.pipe($.eslint.failOnError())
		.pipe($.sourcemaps.init())
		.pipe($.concat('von-grid.min.js'))
		.pipe($.uglify())
		.pipe($.sourcemaps.write('.'))
		.pipe(gulp.dest(dist))
		.pipe(browserSync.stream());
});

gulp.task('hex', function() {
	return gulp.src(glob.hexScripts)
		.pipe($.plumber({errorHandler: handleErrors}))
		.pipe($.sourcemaps.init())
		.pipe($.concat('hex-grid.min.js'))
		.pipe($.uglify())
		.pipe($.sourcemaps.write('.'))
		.pipe(gulp.dest(dist))
		.pipe(browserSync.stream());
});

gulp.task('sqr', function() {
	return gulp.src(glob.sqrScripts)
		.pipe($.plumber({errorHandler: handleErrors}))
		.pipe($.sourcemaps.init())
		.pipe($.concat('sqr-grid.min.js'))
		.pipe($.uglify())
		.pipe($.sourcemaps.write('.'))
		.pipe(gulp.dest(dist))
		.pipe(browserSync.stream());
});

gulp.task('scripts-editor', function() {
	return gulp.src(glob.editorScripts)
		.pipe($.plumber({errorHandler: handleErrors}))
		.pipe($.sortAmd())
		//.pipe($.eslint({ fix: true }))
		//.pipe($.eslint.formatEach())
		//.pipe($.eslint.failOnError())
		.pipe($.addSrc.prepend('./editor/lib/define.min.js'))
		.pipe($.sourcemaps.init())
		.pipe($.concat('app.js'))
		//.pipe($.uglify())
		.pipe($.sourcemaps.write('.'))
		.pipe(gulp.dest('editor'))
		.pipe(browserSync.stream());
});

/*----------------------------------------------------------------------
	CSS
*/
/*
gulp.task('styles', function() {
	return gulp.src(glob.styles)
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
	//gulp.watch(glob.styles, ['styles', reload]);
}

function serve(dir) {
	browserSync.init({
		notify: false,
		server: {
			baseDir: ['./', './'+dir],
			index: './'+dir+'/index.html'
		}
	});

	browserSync.watch(dist+'/**/*.*').on('change', reload);
	gulp.watch(glob.scripts, ['scripts']);
}

gulp.task('watch', function() {
	watch();
});

gulp.task('serve-editor', function() {
	gulp.watch(glob.editorScripts, ['scripts-editor', reload]);
	serve('editor');
});

gulp.task('serve-examples', function() {
	//gulp.watch(glob.editorScripts, ['scripts-editor', reload]);
	browserSync.watch('examples/**/*.*').on('change', reload);
	serve('examples');
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
