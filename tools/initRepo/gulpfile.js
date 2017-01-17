const gulp = require('gulp');
const gutil = require('gulp-util');
const typescript = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');

const tsProject = typescript.createProject('tsconfig.json');

const OPTIONS = {
	header: true,
	files: {
		typescript: [ 'lib/**/*.ts' ]
	},
	base: 'lib'
}

gulp.task('typescript', () => {
	gulp.src(OPTIONS.files.typescript)
		.pipe(sourcemaps.init())
		.pipe(tsProject()).on('error', gutil.log)
		.pipe(sourcemaps.write('./', { includeContent: true,
			sourceRoot: '../lib',
			mapSources: (pathFile) => { return pathFile; }
		}))
		.pipe(gulp.dest('build/'));
});

gulp.task('build', [ 'typescript' ]);
