const gulp = require('gulp')
const nib = require('nib')
const plugins = require('gulp-load-plugins')()
const argv = require('yargs').argv
const sourcemaps = require('gulp-sourcemaps')
const del = require('del')

// reloads browser and injects CSS
const browserSync = require('browser-sync').create()

// for manual browser reload
const reload = browserSync.reload

gulp.task('browser-sync', function () {
  const port = argv.port || 8890
  const host = argv.host || 'localhost'

  var projectUrl = 'https://' + host

  if (port) {
    projectUrl += ':' + port
  }

  projectUrl += '/wp-admin/admin.php?page=ninja-forms'

  // http://www.browsersync.io/docs/options/
  browserSync.init({
    proxy: projectUrl,
    browser: ['google-chrome'],
    port: port,
    https: true,
    host: host,
    open: 'external',
    injectChanges: true
  })
})

gulp.task('standard', function () {
  return gulp.src(['src/js/main.js'])
    .pipe(plugins.standard())
    .pipe(plugins.standard.reporter('default', {
      breakOnError: true,
      quiet: true
    }))
})

gulp.task('js', ['standard'], function () {
  return gulp.src('src/js/main.js')
    .pipe(sourcemaps.init())
    .pipe(plugins.uglify())
    .pipe(plugins.rename({suffix: '.min'}))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('target/js'))
})

gulp.task('copy-videomail-client', function () {
  gulp
    .src('node_modules/videomail-client/dist/videomail-client.min.*')
    .pipe(gulp.dest('target/js/videomail-client'))
})

gulp.task('css', function () {
  gulp.src('src/styl/main.styl')
    .pipe(plugins.plumber())
    .pipe(plugins.stylus({
      use: [nib()],
      errors: true
    }))
    .pipe(plugins.autoprefixer(
      'last 5 versions',
      '> 2%',
      'Explorer >= 10',
      'Chrome >= 41',
      'Firefox >= 41',
      'iOS >= 8',
      'android >= 4'
    ))
    .pipe(plugins.bytediff.start())
    .pipe(plugins.cssnano())
    .pipe(plugins.rename({suffix: '.min'}))
    .pipe(plugins.bytediff.stop())
    .pipe(browserSync.stream())
    .pipe(gulp.dest('target/css'))
})

gulp.task('clean:php', function () {
  return del([
    'target/**/*.{php,html}'
  ])
})

gulp.task('php', ['clean:php'], function () {
  return gulp.src('src/**/*.{php,html}')
    .pipe(gulp.dest('target'))
})

gulp.task('watch', ['default', 'browser-sync'], function () {
  gulp.watch('src/**/*.{php,html}', ['php', reload])
  gulp.watch('src/js/**/*.js', ['js', reload])
  gulp.watch('src/styl/**/*.styl', ['css'])
})

gulp.task('todo', function () {
  gulp.src([
    'src/**/*.{php,js,styl}',
    'gulpfile.js'
  ])
  .pipe(plugins.todo())
  .pipe(gulp.dest('./'))
})

gulp.task('zip', ['css', 'js', 'copy-videomail-client', 'todo', 'php'], function () {
  return gulp.src(['target/**'])
    .pipe(plugins.zip('ninja-forms-videomail.zip'))
    .pipe(gulp.dest('dist'))
})

// just builds assets once, nothing else
gulp.task('default', ['css', 'js', 'copy-videomail-client', 'todo', 'php', 'zip'])
