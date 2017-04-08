import gulp from 'gulp';
import webpack from 'webpack';
import chalk from 'chalk';
import rimraf from 'rimraf';
import { create as createServerConfig } from './webpack.server';
import { create as createClientConfig } from './webpack.client';

const $ = require("gulp-load-plugins")();

//---------------------------------------
// Public tasks

// Clean build directories
gulp.task("clean:server", cb => rimraf("./build", cb));
gulp.task("clean:client", cb => rimraf("./public/build", cb));
gulp.task("clean", gulp.parallel("clean:server", "clean:client"));

gulp.task("dev:server", gulp.series("clean:server", devServerBuild));
gulp.task("dev", gulp
  .series(
    "clean",
    devServerBuild,
    gulp.parallel(
      devServerWatch,
      devServerReload
    )));

gulp.task("prod:server", gulp.series("clean:server", prodServerBuild));
gulp.task("prod:client", gulp.series("clean:server", prodClientBuild));
gulp.task("prod", gulp
  .series(
    "clean",
    gulp.parallel(
      prodServerBuild,
      prodClientBuild
    )));
//---------------------------------------
// Private Client Tasks


function prodClientBuild(callback) {
  const compiler = webpack(createClientConfig(false));
  compiler.run((error, stats) => {
    outputWebpack("Pord:Client", error, stats);
    callback();
  });
}


//---------------------------------------
// Private Server Tasks
const devServerWebpack = webpack(createServerConfig(true));
const prodServerWebpack = webpack(createServerConfig(false));

function devServerBuild(callback) {
  // invoke the run function on the webpack bundler
  devServerWebpack.run((error, stats) => {
    outputWebpack("Dev:Server", error, stats);
    // let gulp know the task is finished with the callback
    callback();
  });
}

// use webpack watch
function devServerWatch() {
  devServerWebpack.watch({}, (error, stats) => {
    outputWebpack("Dev:Server", error, stats);
  });
}

// watch the build folder for any changes
function devServerReload() {
  return $.nodemon({
    script: './build/server.js',
    watch: "./build",
    env: {
      "NODE_ENV": "development",
      // tell our sever to build client files using webpack
      // used in development
      "USE_WEBPACK": "true"
    }
  });
}

function prodServerBuild(callback) {
  prodServerWebpack.run((error, stats) => {
    outputWebpack("Prod:Server", error, stats);
    callback();
  });
}

//---------------------------------------
// Helpers
function outputWebpack(label, error, stats) {
  if (error) {
    throw new Error(error);
  }
  // handle errors from babel, es-lint, etc..
  if (stats.hasErrors()) {
    $.util.log(stats.toString({colors: true}));
  } else {
    const time = stats.endTime = stats.startTime;
    $.util.log(chalk.bgGreen(`Build ${label} in ${time} ms`));
  }
  $.util.log(stats.toString());
}
