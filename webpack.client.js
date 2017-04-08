var path = require("path");
var webpack = require("webpack");
var ExtractTextPlugin = require("extract-text-webpack-plugin");

const vendorModules = ["jquery", "lodash", "socket.io-client", "rxjs"];

// dirname for using webpack hot middleware on the server
// __dirname will work when using webpack from gulp or command line
// but won't work properly when it's invoked from the server
const dirname = path.resolve("./");

function createConfig(isDebug) {
  // use normal source maps for production
  // and fast "eval-source-map" for development
  const devTool = isDebug ? "eval-source-map" : "source-map";
  const cssLoader = {test: /\.css$/, loader: "style!css"};
  const sassLoader = {test: /\.scss$/, loader: "style!css!sass"};
  const appEntry = ["./src/client/application.js"];

  // add plugin to handle vendor scripts
  const plugins = [
    new webpack.optimize.CommonsChunkPlugin("vendor", "vendor.js")
  ];

  // for production
  if (!isDebug) {
    // minify
    plugins.push(new webpack.optimize.UglifyJsPlugin());
    // extract css
    plugins.push(new ExtractTextPlugin("[name].css"));
    cssLoader.loader = ExtractTextPlugin.extract("style", "css");
    sassLoader.loader = ExtractTextPlugin.extract("style", "css!sass");
  } else {
    plugins.push(new webpack.HotModuleReplacementPlugin());
    appEntry.splice(0, 0, "webpack-hot-middleware/client");
  }


  // -----------------------
  // WEBPACK CONFIG
  return {
    devtool: devTool,
    entry: {
      // can have multiple entry files
      application: appEntry,
      vendor: vendorModules
    },
    output: {
      path: path.join(dirname, "public", "build"),
      // use webpack template syntax to name the file correctly
      filename: "[name].js",
      publicPath: "/build/"
    },
    resolve: {
      alias: {
        shared: path.join(dirname, "src", "shared")
      }
    },
    module: {
      loaders: [
        { test: /\.js$/, loader: "babel", exclude: "/node_modules/"},
        { test: /\.js$/, loader: "eslint", exclude: "/node_modules/"},
        { test: /\.(png|jpg|jpeg|gif|woff|ttf|eot|svg|woff2)/, loader: "url-loader?limit=1024" },
        cssLoader,
        sassLoader
      ]
    },
    plugins: plugins
  };
}

module.exports = createConfig(true);
module.exports.create = createConfig;
