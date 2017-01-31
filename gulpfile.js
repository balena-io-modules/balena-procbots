const gulp = require('gulp');
const gutil = require('gulp-util');
const typescript = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const tslint = require('gulp-tslint');
const tsProject = typescript.createProject('tsconfig.json');

const OPTIONS = {
	header: true,
	files: {
		typescript: [ 'lib/**/*.ts' ],
		declarations: [ 'lib/**/*.d.ts' ]
	},
	base: 'lib'
}

// Compile the TS sources
gulp.task('typescript', () => {
	gulp.src(OPTIONS.files.typescript)
		.pipe(sourcemaps.init())
		.pipe(tsProject()).on('error', gutil.log)
		.pipe(sourcemaps.write('./', { includeContent: true,
			sourceRoot: '../lib',
			// There is currently an issue where not doing this won't generate
			// correctly pathed mapfiles.
			mapSources: (pathFile) => { return pathFile; }
		}))
		.pipe(gulp.dest('build/'));
});

// Copy any pre-defined declarations
gulp.task('copydecs', () => {
	gulp.src(OPTIONS.files.declarations)
		.pipe(gulp.dest('build/'));
});

gulp.task('tslint', () =>
    gulp.src(OPTIONS.files.typescript)
        .pipe(tslint({
			configuration: 'tslint.json',
            formatter: 'prose'
        }))
        .pipe(tslint.report())
);

gulp.task('build', [ 'typescript', 'copydecs' ]);

