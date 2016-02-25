var gulp = require('gulp');
var fs = require('fs');
var $ = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var path = require('path');
var Q = require('q');
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;

var dist = 'dist';
var src = 'src';

var sources = {
	core: [src+'/vg.js', src+'/lib/*.js', src+'/utils/*.js', src+'/pathing/*.js', src+'/*.js'],
	hex: src+'/grids/HexGrid.js',
	sqr: src+'/grids/SqrGrid.js',
	extras: src+'/extras/**/*.js',
	editorScripts: ['editor/modules/**/*.js'],
	editorUIScripts: ['editor/ui/**/*.{js,tag}'],
	styles: 'editor/ui/**/*.styl'
};


/*_____________________________________________________________________
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
		['serve-examples']
	);
});

gulp.task('dev-ed', ['clean'], function() {
	runSequence(
		['scripts', 'scripts-editor', 'scripts-editor-ui'],
		['serve-editor']
	);
});

/*_____________________________________________________________________
	SCRIPTS
*/

gulp.task('scripts', function() {
	var bundles = {
		'von-grid': sources.core.concat(sources.hex, sources.sqr),
		'hex-grid': sources.core.concat(sources.hex),
		'sqr-grid': sources.core.concat(sources.sqr),
		'von-grid-extras': sources.extras
	};

	var promises = Object.keys(bundles).map(function (key) {
		var deferred = Q.defer();
		var val = bundles[key];

		gulp.src(val)
			.pipe($.plumber({errorHandler: handleErrors}))
			.pipe($.eslint({ fix: true }))
			.pipe($.eslint.formatEach())
			.pipe($.eslint.failOnError())
			.pipe($.sourcemaps.init())
			.pipe($.concat(key+'.min.js'))
			.pipe($.uglify())
			.pipe($.sourcemaps.write('.'))
			.pipe(gulp.dest(dist))
			.on('end', function () {
				deferred.resolve();
			});

		return deferred.promise;
	});
	return Q.all(promises);
});

gulp.task('scripts-editor', function() {
	return gulp.src(sources.editorScripts)
		.pipe($.plumber({errorHandler: handleErrors}))
		.pipe($.eslint({ fix: true }))
		.pipe($.eslint.formatEach())
		.pipe($.eslint.failOnError())
		.pipe($.flatten()) // required by sorting alg for some reason
		.pipe($.sortAmd())
		.pipe($.sourcemaps.init())
		.pipe($.concat('app.js'))
		.pipe($.uglify())
		.pipe($.sourcemaps.write('.'))
		.pipe(gulp.dest('editor'))
		.pipe(browserSync.stream());
});

gulp.task('scripts-editor-ui', function() {
	return gulp.src(sources.editorUIScripts)
		.pipe($.plumber({errorHandler: handleErrors}))
		.pipe($.if('*.tag', $.riot()))
		.pipe($.sortAmd())
		.pipe($.sourcemaps.init())
		.pipe($.concat('ui.js'))
		.pipe($.sourcemaps.write('.'))
		.pipe(gulp.dest('editor'))
		.pipe(browserSync.stream());
});

/*_____________________________________________________________________
	CSS
*/

gulp.task('styles', function() {
	return gulp.src(sources.styles)
		.pipe($.plumber({errorHandler: handleErrors}))
		.pipe($.sourcemaps.init())
		.pipe($.stylus({
			compress: true
		}))
		.pipe($.autoprefixer())
		.pipe($.concat('style.css'))
		.pipe($.sourcemaps.write('.'))
		.pipe(gulp.dest('editor'))
});


/*_____________________________________________________________________
	SERVER
*/

// Defines the list of resources to watch for changes.
function watch() {
	gulp.watch(sources.core, ['scripts', reload]);
	gulp.watch(sources.hex, ['scripts', reload]);
	gulp.watch(sources.sqr, ['scripts', reload]);
	gulp.watch(sources.extras, ['scripts', reload]);
}

function serve(dir) {
	browserSync.init({
		notify: false,
		server: {
			baseDir: ['./', './'+dir],
			index: './'+dir+'/index.html'
		}
	});

	watch();
	browserSync.watch(dist+'/**/*.*').on('change', reload);
	gulp.watch(sources.core, ['scripts']);
}

gulp.task('serve-editor', function() {
	browserSync.watch('editor/**/*.{html,png}').on('change', reload);
	gulp.watch(sources.editorScripts, ['scripts-editor', reload]);
	gulp.watch(sources.editorUIScripts, ['scripts-editor-ui', reload]);
	gulp.watch(sources.styles, ['styles', reload]);
	serve('editor');
});

gulp.task('serve-examples', function() {
	browserSync.watch('examples/**/*.*').on('change', reload);
	serve('examples');
});

/*_____________________________________________________________________
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
