const gulp = require('gulp')
  , nodemon = require('gulp-nodemon')
  , babel = require('gulp-babel')
  , Cache = require('gulp-file-cache')
  , del   = require('del')
  , runSequence = require('run-sequence')
  , path  = require('path')
  , eslint = require('gulp-eslint');

// cache for file changes
const cache = new Cache();

const paths = {
  js: ['./src/**/*.js', '!./src/**/*.spec.js', '!dist/**', '!node_modules/**'],
  nonJs: ['./package.json']
};

// Clean up dist and cache
gulp.task('clean', () => {
  del.sync(['dist/**', 'dist/.*', '!dist'])
  cache.clear();
  return;
});

gulp.task('lint', () =>
  gulp.src(paths.js)
    .pipe(eslint())
    .pipe(eslint.format()) 
);

// Copy non-js files to dist
gulp.task('copy', () =>
  gulp.src(paths.nonJs)
    .pipe(cache.filter())
    .pipe(cache.cache())
    .pipe(gulp.dest('dist'))
);


// Compile ES6 to ES5 and copy to dist
gulp.task('compile', () =>
  gulp.src([...paths.js], { base: '.' }) // your ES2015 code 
    .pipe(cache.filter()) // remember files 
    .pipe(babel()) // compile new ones 
    .pipe(cache.cache()) // cache them 
    .pipe(gulp.dest('dist')) // write them 
);

// Start server with restart on file changes
gulp.task('nodemon', runSequence('lint', ['copy', 'compile']), () =>
  nodemon({
    script: path.join('dist', 'src', 'index.js'),
    ext: 'js json env',
    ignore: ['node_modules/**/*.js', 'dist/**/*.js', 'src/**/*.spec.js', 'gulpfile.js', 'test/**/*.js'],
    tasks: ['lint', 'compile']
  })
);

// gulp serve for development
gulp.task('dev', () => runSequence('nodemon'));

// build for production
gulp.task('build', () => {
  runSequence(
    'clean',
    'copy',
    'compile'
  );
});
