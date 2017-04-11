/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	__webpack_require__(1);
	
	var _express = __webpack_require__(2);
	
	var _express2 = _interopRequireDefault(_express);
	
	var _http = __webpack_require__(3);
	
	var _http2 = _interopRequireDefault(_http);
	
	var _socket = __webpack_require__(4);
	
	var _socket2 = _interopRequireDefault(_socket);
	
	var _chalk = __webpack_require__(5);
	
	var _chalk2 = _interopRequireDefault(_chalk);
	
	var _rxjs = __webpack_require__(6);
	
	__webpack_require__(19);
	
	var _observableSocket = __webpack_require__(7);
	
	var _users = __webpack_require__(8);
	
	var _playlist = __webpack_require__(11);
	
	var _chat = __webpack_require__(12);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }
	
	var isDevelopment = process.env.NODE_ENV !== "production";
	
	// -------------------------
	// Setup
	var app = (0, _express2.default)();
	var server = new _http2.default.Server(app);
	var io = (0, _socket2.default)(server);
	
	// -------------------------
	// Client Webpack
	if (process.env.USE_WEBPACK === "true") {
	  var webpackMiddleware = __webpack_require__(13);
	  var webpackHotMiddleware = __webpack_require__(14);
	  var webpack = __webpack_require__(15);
	  var clientConfig = __webpack_require__(16);
	  var compiler = webpack(clientConfig);
	  app.use(webpackMiddleware(compiler, {
	    // tells webpack what path to intercept
	    publicPath: "/build/",
	    stats: {
	      colors: true,
	      chunks: false,
	      assets: false,
	      timings: false,
	      modules: false,
	      hash: false,
	      version: false
	    }
	  }));
	
	  app.use(webpackHotMiddleware(compiler));
	  console.log(_chalk2.default.bgRed("Using WebPack Dev Middleware! THIS IS FOR DEV ONLY"));
	}
	
	// -------------------------
	// Configure Express
	app.set("view engine", "pug");
	app.use(_express2.default.static("public"));
	
	// only use the external style files in production
	var useExternalStyles = !isDevelopment;
	
	app.get("/", function (req, res) {
	  res.render("index", {
	    useExternalStyles: useExternalStyles
	  });
	});
	
	// -------------------------
	// Services
	var videoServices = [];
	var playlistRepository = {};
	
	// -------------------------
	// Modules
	var users = new _users.UsersModule(io);
	var chat = new _chat.ChatModule(io, users);
	var playlist = new _playlist.PlaylistModule(io, users, playlistRepository, videoServices);
	
	var modules = [users, chat, playlist];
	
	// -------------------------
	// Socket
	io.on("connection", function (socket) {
	  console.log('Got connection from ' + socket.request.connection.remoteAddress);
	
	  var client = new _observableSocket.ObservableSocket(socket);
	
	  // register client with all modules
	  // tell all modules to register client
	  var _iteratorNormalCompletion = true;
	  var _didIteratorError = false;
	  var _iteratorError = undefined;
	
	  try {
	    for (var _iterator = modules[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	      var mod = _step.value;
	
	      mod.registerClient(client);
	    } // client is now registered, tell modules
	  } catch (err) {
	    _didIteratorError = true;
	    _iteratorError = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion && _iterator.return) {
	        _iterator.return();
	      }
	    } finally {
	      if (_didIteratorError) {
	        throw _iteratorError;
	      }
	    }
	  }
	
	  var _iteratorNormalCompletion2 = true;
	  var _didIteratorError2 = false;
	  var _iteratorError2 = undefined;
	
	  try {
	    for (var _iterator2 = modules[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	      var _mod = _step2.value;
	
	      _mod.clientRegistered(client);
	    }
	  } catch (err) {
	    _didIteratorError2 = true;
	    _iteratorError2 = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion2 && _iterator2.return) {
	        _iterator2.return();
	      }
	    } finally {
	      if (_didIteratorError2) {
	        throw _iteratorError2;
	      }
	    }
	  }
	});
	
	// -------------------------
	// Starter
	var port = process.env.PORT || 3000;
	function startServer() {
	  server.listen(port, function () {
	    console.log('Started http server on ' + port);
	  });
	}
	
	_rxjs.Observable.merge.apply(_rxjs.Observable, _toConsumableArray(modules.map(function (m) {
	  return m.init$();
	}))).subscribe({
	  complete: function complete() {
	    // when all modules are complete, start the server
	    startServer();
	  },
	  error: function error(_error) {
	    console.error('Could not init module: ' + (_error.stack || _error));
	  }
	});

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = require("source-map-support/register");

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = require("express");

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = require("http");

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = require("socket.io");

/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = require("chalk");

/***/ },
/* 6 */
/***/ function(module, exports) {

	module.exports = require("rxjs");

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.ObservableSocket = undefined;
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	exports.clientMessage = clientMessage;
	
	var _rxjs = __webpack_require__(6);
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	// alows us to "throw" errors and send only the relevent information back to the client
	// the onAction method will check for clientMessage when it catches an error
	function clientMessage(message) {
	  var error = new Error(message);
	  error.clientMessage = message;
	  return error;
	}
	
	var ObservableSocket = exports.ObservableSocket = function () {
	  _createClass(ObservableSocket, [{
	    key: "isConnected",
	    get: function get() {
	      return this._state.isConnected;
	    }
	  }, {
	    key: "isReconnecting",
	    get: function get() {
	      return this._state.isReconnecting;
	    }
	  }, {
	    key: "isTotallyDead",
	    get: function get() {
	      return !this.isConnected && !this.isReconnecting;
	    }
	  }]);
	
	  function ObservableSocket(socket) {
	    var _this = this;
	
	    _classCallCheck(this, ObservableSocket);
	
	    this._socket = socket;
	    this._state = {};
	    // for keeping track of the actions we can respond too
	    this._actionCallbacks = {};
	    // track the requests send to the sever
	    this._requests = {};
	    // incremented on each request to the server
	    this._nextRequestId = 0;
	
	    //  merge in the observable event handlers
	    this.status$ = _rxjs.Observable.merge(this.on$("connect").map(function () {
	      return { isConnected: true };
	    }), this.on$("disconnected").map(function () {
	      return { isConnected: false };
	    }), this.on$("reconnecting").map(function (attempt) {
	      return { isConnected: false, isReconnecting: true, attempt: attempt };
	    }), this.on$("reconnect_failed").map(function () {
	      return { isConnected: false, isReconnecting: false };
	    }))
	    // if someone new subscribes, don't re-do all the event handlers
	    .publishReplay(1).refCount();
	
	    this.status$.subscribe(function (state) {
	      return _this._state = state;
	    });
	  }
	
	  // ---------------------
	  // Basic Wrappers
	
	  // return an observable sequence based off the event
	  // socket has an 'on' method already so this works nicely
	
	
	  _createClass(ObservableSocket, [{
	    key: "on$",
	    value: function on$(event) {
	      return _rxjs.Observable.fromEvent(this._socket, event);
	    }
	  }, {
	    key: "on",
	    value: function on(event, callback) {
	      this._socket.on(event, callback);
	    }
	  }, {
	    key: "off",
	    value: function off(event, callback) {
	      this._socket.off(event, callback);
	    }
	
	    // only need to pass one event arg
	    // so that this works well with rxjs
	
	  }, {
	    key: "emit",
	    value: function emit(event, arg) {
	      this._socket.emit(event, arg);
	    }
	
	    // ---------------------
	    // Emit (Client Side)
	
	    // send an action to the server
	    // expects a callback with an id
	
	  }, {
	    key: "emitAction$",
	    value: function emitAction$(action, arg) {
	      // build our id
	      var id = this._nextRequestId++;
	      this._registerCallbacks(action);
	
	      // ReplaySubject is similar to a promise
	      // will wait until it gets a value
	      var subject = this._requests[id] = new _rxjs.ReplaySubject(1);
	      this._socket.emit(action, arg, id);
	      return subject;
	    }
	
	    // registers the success and failure callbacks on the socket
	    // "when the server sends something, we need to do something with it"
	
	  }, {
	    key: "_registerCallbacks",
	    value: function _registerCallbacks(action) {
	      var _this2 = this;
	
	      // only need to register these once
	      if (this._actionCallbacks.hasOwnProperty(action)) return;
	
	      // handle callbacks on the socket
	      // login (username) -> emit("login") -> server -> emit("login", {data}) -> client
	
	      // handle succesfull request
	      this._socket.on(action, function (arg, id) {
	        var request = _this2._popRequest(id);
	        if (!request) return;
	        request.next(arg);
	        request.complete();
	      });
	
	      // handle failure when performing request
	      this._socket.on(action + ":fail", function (arg, id) {
	        var request = _this2._popRequest(id);
	        if (!request) return;
	        request.error(arg);
	      });
	
	      this._actionCallbacks[action] = true;
	    }
	
	    // server send back a request with id
	    // find the request, remove it and return it
	
	  }, {
	    key: "_popRequest",
	    value: function _popRequest(id) {
	      if (!this._requests.hasOwnProperty(id)) {
	        console.error("Event with id " + id + " was returned twice, or the server did not send back an ID");
	        return;
	      }
	
	      var request = this._requests[id];
	      delete this._requests[id];
	      return request;
	    }
	
	    // ---------------------
	    // On (Server Side)
	    // This is used on the server to handle incomming requests from the client
	
	  }, {
	    key: "onAction",
	    value: function onAction(action, callback) {
	      var _this3 = this;
	
	      this._socket.on(action, function (arg, requestId) {
	        try {
	          var value = callback(arg);
	          if (!value) {
	            // if nothing was returned by the callback on the server
	            // we still tell the client the request was completed
	            _this3._socket.emit(action, null, requestId);
	            return;
	          }
	
	          if (typeof value.subscribe !== "function") {
	            // if the value is not an observable sequence
	            // then we can immediatly send back the response
	            _this3._socket.emit(action, value, requestId);
	            return;
	          }
	
	          // now know that value is an observable sequence
	          // we have to subscribe to it and wait for a value
	          var hasValue = false;
	          // now handle the 3 possible callbacks for the observable
	          value.subscribe({
	            next: function next(item) {
	              // check to see if the observable has already returned a value
	              if (hasValue)
	                // we don't want this to happen
	                throw new Error("Action " + action + " produced more than one value");
	
	              // otherwise send the first value back to the client
	              _this3._socket.emit(action, item, requestId);
	              hasValue = true;
	            },
	            error: function error(_error) {
	              // emit the error back to the client and log
	              _this3._emitError(action, requestId, _error);
	              console.error(_error.stack || _error);
	            },
	            complete: function complete() {
	              if (!hasValue) _this3._socket.emit(action, null, requestId);
	            }
	          });
	        } catch (error) {
	          // if the request has a proper id from the client
	          if (typeof requestId !== "undefined") {
	            _this3._emitError(action, requestId, error);
	          }
	          console.error(error.stack || error);
	        }
	      });
	    }
	  }, {
	    key: "onActions",
	    value: function onActions(actions) {
	      for (var action in actions) {
	        if (!actions.hasOwnProperty(action)) continue;
	        this.onAction(action, actions[action]);
	      }
	    }
	
	    // figure out if we need to display a specific error
	    // checks for clientMessage on the thrown Error
	
	  }, {
	    key: "_emitError",
	    value: function _emitError(action, id, error) {
	      // if the error is an object and the error has a client message, return the client message
	      var message = error && error.clientMessage || "Fatal Error";
	      // then send the error back to the client
	      this._socket.emit(action + ":fail", { message: message }, id);
	    }
	  }]);

	  return ObservableSocket;
	}();

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.UsersModule = undefined;
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _lodash = __webpack_require__(10);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _module = __webpack_require__(9);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var UsersModule = exports.UsersModule = function (_ModuleBase) {
	  _inherits(UsersModule, _ModuleBase);
	
	  function UsersModule(io) {
	    _classCallCheck(this, UsersModule);
	
	    var _this = _possibleConstructorReturn(this, (UsersModule.__proto__ || Object.getPrototypeOf(UsersModule)).call(this));
	
	    _this._io = io;
	    _this._usersList = [{ name: "Foo", color: _this.getColorForUsername("Foo") }, { name: "Bar", color: _this.getColorForUsername("Bar") }, { name: "Baz", color: _this.getColorForUsername("Baz") }];
	    return _this;
	  }
	
	  // Generate hsl color based of a username
	
	
	  _createClass(UsersModule, [{
	    key: 'getColorForUsername',
	    value: function getColorForUsername(username) {
	      // get a number that represents a username using a hash
	      var hash = _lodash2.default.reduce(username, function (hash, ch) {
	        return ch.charCodeAt(0) + (hash << 6) + (hash << 16) - hash;
	      }, 0);
	
	      // convert the hash to a color
	      hash = Math.abs(hash);
	      var hue = hash % 360;
	      var saturation = hash % 25 + 70; // add 70 for decent saturation
	      // control the lightness to work with a background
	      var lightness = 100 - (hash % 15 + 35);
	
	      return 'hsl(' + hue + ', ' + saturation + '%, ' + lightness + '%)';
	    }
	
	    // allow the client to request a list of users
	
	  }, {
	    key: 'registerClient',
	    value: function registerClient(client) {
	      var _this2 = this;
	
	      // fake create a new user every 2 seconds
	      var index = 0;
	      setInterval(function () {
	        var username = 'New User ' + index;
	        var user = { name: username, color: _this2.getColorForUsername(username) };
	        client.emit("users:added", user);
	        index++;
	      }, 2000);
	
	      client.onActions({
	        "users:list": function usersList() {
	          return _this2._usersList;
	        },
	        "auth:login": function authLogin() {},
	        "auth:logout": function authLogout() {}
	
	      });
	    }
	  }]);

	  return UsersModule;
	}(_module.ModuleBase);

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.ModuleBase = undefined;
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*eslint no-unused-vars: "off" */
	
	
	var _rxjs = __webpack_require__(6);
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var ModuleBase = exports.ModuleBase = function () {
	  function ModuleBase() {
	    _classCallCheck(this, ModuleBase);
	  }
	
	  _createClass(ModuleBase, [{
	    key: 'init$',
	
	    // defines callback methods
	    // allows modules to initalize asyncronsly
	
	    value: function init$() {
	      return _rxjs.Observable.empty();
	    }
	
	    // gets a client instance
	
	  }, {
	    key: 'registerClient',
	    value: function registerClient(client) {}
	  }, {
	    key: 'clientRegistered',
	    value: function clientRegistered(client) {}
	  }]);

	  return ModuleBase;
	}();

/***/ },
/* 10 */
/***/ function(module, exports) {

	module.exports = require("lodash");

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.PlaylistModule = undefined;
	
	var _module = __webpack_require__(9);
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var PlaylistModule = exports.PlaylistModule = function (_ModuleBase) {
	  _inherits(PlaylistModule, _ModuleBase);
	
	  function PlaylistModule(io, usersModule, playlistRepository, videoServices) {
	    _classCallCheck(this, PlaylistModule);
	
	    var _this = _possibleConstructorReturn(this, (PlaylistModule.__proto__ || Object.getPrototypeOf(PlaylistModule)).call(this));
	
	    _this._io = io;
	    // for auth
	    _this._users = usersModule;
	    // for loading and saving playlist data to disk or db
	    _this._repository = playlistRepository;
	    // used to locate video
	    _this._services = videoServices;
	    return _this;
	  }
	
	  return PlaylistModule;
	}(_module.ModuleBase);

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.ChatModule = undefined;
	
	var _module = __webpack_require__(9);
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var ChatModule = exports.ChatModule = function (_ModuleBase) {
	  _inherits(ChatModule, _ModuleBase);
	
	  function ChatModule(io, usersModule) {
	    _classCallCheck(this, ChatModule);
	
	    var _this = _possibleConstructorReturn(this, (ChatModule.__proto__ || Object.getPrototypeOf(ChatModule)).call(this));
	
	    _this._io = io;
	    _this._users = usersModule;
	    return _this;
	  }
	
	  return ChatModule;
	}(_module.ModuleBase);

/***/ },
/* 13 */
/***/ function(module, exports) {

	module.exports = require("webpack-dev-middleware");

/***/ },
/* 14 */
/***/ function(module, exports) {

	module.exports = require("webpack-hot-middleware");

/***/ },
/* 15 */
/***/ function(module, exports) {

	module.exports = require("webpack");

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var path = __webpack_require__(17);
	var webpack = __webpack_require__(15);
	var ExtractTextPlugin = __webpack_require__(18);
	
	var vendorModules = ["jquery", "socket.io-client", "rxjs"];
	
	// dirname for using webpack hot middleware on the server
	// __dirname will work when using webpack from gulp or command line
	// but won't work properly when it's invoked from the server
	var dirname = path.resolve("./");
	
	function createConfig(isDebug) {
	  // use normal source maps for production
	  // and fast "eval-source-map" for development
	  var devTool = isDebug ? "eval-source-map" : "source-map";
	  var cssLoader = { test: /\.css$/, loader: "style!css" };
	  var sassLoader = { test: /\.scss$/, loader: "style!css!sass" };
	  var appEntry = ["./src/client/application.js"];
	
	  // add plugin to handle vendor scripts
	  var plugins = [new webpack.optimize.CommonsChunkPlugin("vendor", "vendor.js")];
	
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
	      loaders: [{ test: /\.js$/, loader: "babel", exclude: "/node_modules/" }, { test: /\.js$/, loader: "eslint", exclude: "/node_modules/" }, { test: /\.(png|jpg|jpeg|gif|woff|ttf|eot|svg|woff2)/, loader: "url-loader?limit=1024" }, cssLoader, sassLoader]
	    },
	    plugins: plugins
	  };
	}
	
	module.exports = createConfig(true);
	module.exports.create = createConfig;

/***/ },
/* 17 */
/***/ function(module, exports) {

	module.exports = require("path");

/***/ },
/* 18 */
/***/ function(module, exports) {

	module.exports = require("extract-text-webpack-plugin");

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _rxjs = __webpack_require__(6);
	
	_rxjs.Observable.prototype.safeSubscribe = function (next, error, complete) {
	  var subscription = this.subscribe(function (item) {
	    try {
	      next(item);
	    } catch (e) {
	      console.error(e.stack || e);
	      subscription.unsubscribe();
	    }
	  }, error, complete);
	
	  return subscription;
	};

/***/ }
/******/ ]);
//# sourceMappingURL=server.js.map