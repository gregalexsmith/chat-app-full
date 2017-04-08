var path = require('path');
var fs = require('fs');
var webpack = require('webpack');

const nodeModules = fs.readdirSync("./node_modules").filter(d => d != ".bin");

function ignoreNodeModules(context, request, callback) {
  // ignore relative paths
  // handle import {module} from './module'
  if (request[0] == ".")
    return callback();

  // handle import {module} from 'example/module'
  const module = request.split("/")[0];
  // test to see if it's in node_modules
  if (nodeModules.indexOf(module) !== -1) {
    // tell webpack to load using normal 'require' statements
    return callback(null, "commonjs " + request);
  }
  return callback();
}

function createConfig(isDebug) {
  // webpack config
  const plugins = [];
  if (!isDebug) {
    plugins.push(new webpack.optimize.UglifyJsPlugin());
  }

  return{
    target: "node",
    devtool: "source-map",
    entry: "./src/server/server.js",
    output: {
      path: path.join(__dirname, "build"),
      filename: "server.js"
    },
    resolve:  {
      // instruct webpack how to locate modules
      alias: {
        // can require shared code from client and server
        shared: path.join(__dirname, "src", "shared")
      }
    },
    module: {
      loaders: [
        { test: /\.js$/, loader: "babel", exclude: '/node-modules/'},
        { test: /\.js$/, loader: "eslint-loader", exclude: '/node-modules/'}
      ]
    },
    externals: [ignoreNodeModules],
    plugins: plugins
  };
}

module.exports = createConfig(true);
module.exports.create = createConfig;
