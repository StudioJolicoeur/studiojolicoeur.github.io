(() => {
'use-strict';
const

  // development or production
  devBuild = ((process.env.NODE_ENV || 'development').trim().toLowerCase() ===
'development'),

  dir = {
    src   :   './',
    dev   :   './',
    node  :   './node_modules/',
    build :   './docs/'
  },

  // modules
  gulp            = require('gulp'),
  autoprefixer    = require('autoprefixer'),
  del             = require('del'),
  noop            = require('gulp-noop'),
  newer           = require('gulp-newer'),
  size            = require('gulp-size'),
  imagemin        = require('gulp-imagemin'),
  sass            = require('gulp-sass'),
  postcss         = require('gulp-postcss'),
  cssnano         = require('cssnano'),
  uglify          = require('gulp-uglify'),
  header          = require('gulp-header'),
  clean           = require('gulp-clean'),
  scaleImages     = require('gulp-scale-images'),
  flatMap         = require('flat-map').default,
  path            = require('path'),
  cp              = require('child_process'),
  sourcemaps      = devBuild ? require('gulp-sourcemaps') : null,
  pkg             = require('./package.json')

  banner = ['/*!\n',
  ' * <%= pkg.name %> <%=(pkg.url) %> | v<%= pkg.version %>\n',
  ' * Copyright 2008-2020 | <%= pkg.name %>\n',
  ' * Licensed under <%= pkg.license %> | (<%= pkg.licenseUrl %>)\n',
  ' */\n',
  ''
  ].join('');

  console.log('Gulp', devBuild ? 'development' : 'production', 'build');

  const cssConfig = {

    dev     : dir.dev + 'styles/**/*.scss',
    watch   : dir.src + 'styles/**/*.scss',
    build   : dir.src + 'docs/assets',

    sassOpts: {
      sourceMap           : devBuild,
      outputStyle         : 'compressed',
      precision           : 3,
      errorLogToConsole   : true,
      includePaths        : ['node_modules']
    }
  };

  const assetsConfig = {
    dev    : dir.dev + 'assets/webfonts/**',
    build  : dir.src + 'docs/assets/webfonts'
  };

  if (!devBuild) {
    cssConfig.postCSS.push(
      require('usedcss')({ html: ['index.html'] }),
      require('cssnano')
    )
  }

  sass.compiler = require('node-sass');

  function buildSass(cb) {
    return gulp.src([
      './styles/fontawesome.scss', // include the Font Awesome 5 file
      './styles/main.scss' // include the customized site file
    ])
    .pipe(sourcemaps.init())
    .pipe(sass(cssConfig.sassOpts).on('error', sass.logError)) // sets the configuration options for building SCSS files
    .pipe(postcss([ autoprefixer() ]))
    .pipe(sourcemaps.write('.'))
    .pipe(size({ showFiles:true }))
    .pipe(gulp.dest(cssConfig.build)); // dump compiled SCSS files to './_site/assets/'
  }

  // @ts-ignore
  function cssDev(cb) {
    const gulpStylelint = require('gulp-stylelint');

    return gulp.src([
      './styles/fontawesome.scss',
      './styles/main.scss'
    ])
    .pipe(gulpStylelint({
      failAfterError: false,
      reports: [
        {formatter: 'string', console: true}
      ]
    }))
    .pipe(sourcemaps.init())
    .pipe(sass(cssConfig.sassOpts).on('error', sass.logError))
    .pipe(postcss([
      require('tailwindcss'),
      require('autoprefixer')
    ]))
    .pipe(sourcemaps.write('.'))
    .pipe(size({ showfiles:true }))
    .pipe(gulp.dest(cssConfig.build));
  }

  function watchSass(cb) {
    gulp.watch(cssConfig.dev, cssDev);
  }

  function copyFA(cb) {
    return gulp.src([
      './assets/webfonts/**'
    ])

    .pipe(gulp.dest(assetsConfig.build));
  }

  function buildSite(cb) {
    cp.exec('bundle exec jekyll build', function(err, stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
      cb(err);
    });
  }

  function serveSite(cb) {
    cp.exec('JEKYLL_ENV=production bundle exec jekyll serve --livereload', function(err, stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
      cb(err);
    });
  }
  
  exports.cssDev          = cssDev;
  exports.copyFA          = copyFA;
  exports.watch           = watchSass;
  exports.build           = buildSite;
  exports.serve           = serveSite;

  exports.build = gulp.series(
    copyFA,
    cssDev,
    buildSite
  );

  exports.serve = gulp.series(
    copyFA,
    cssDev,
    gulp.parallel(watchSass, serveSite)
  );

})();


