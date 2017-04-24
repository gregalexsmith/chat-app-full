import "source-map-support/register";

import express from 'express';
import http from 'http';
import socketIo from 'socket.io';
import chalk from 'chalk';
import { Observable } from 'rxjs';

import "shared/operators";
import { ObservableSocket } from 'shared/observable-socket';

import { FileRepository } from './repositories/file';
import { YoutubeService } from './services/youtube';

import { UsersModule } from './modules/users';
import { PlaylistModule } from './modules/playlist';
import { ChatModule } from './modules/chat';

import {YOUTUBE_API_KEY} from './secrets';

const isDevelopment = process.env.NODE_ENV !== "production";

// -------------------------
// Setup
const app = express();
const server = new http.Server(app);
const io = socketIo(server);


// -------------------------
// Client Webpack
if (process.env.USE_WEBPACK === "true") {
  var webpackMiddleware = require("webpack-dev-middleware");
  var webpackHotMiddleware = require("webpack-hot-middleware");
  var webpack = require("webpack");
  var clientConfig = require("../../webpack.client");
  const compiler = webpack(clientConfig);
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
  console.log(chalk.bgRed("Using WebPack Dev Middleware! THIS IS FOR DEV ONLY"));
}


// -------------------------
// Configure Express
app.set("view engine", "pug");
app.use(express.static("public"));

// only use the external style files in production
const useExternalStyles = !isDevelopment;

app.get("/", (req, res) => {
  res.render("index", {
    useExternalStyles
  });
});

// -------------------------
// Services
const videoServices = [new YoutubeService(YOUTUBE_API_KEY)];
const playlistRepository = new FileRepository("./data/playlist.json");


// -------------------------
// Modules
const users = new UsersModule(io);
const chat = new ChatModule(io, users);
const playlist = new PlaylistModule(io, users, playlistRepository, videoServices);

const modules = [users, chat, playlist];


// -------------------------
// Socket
io.on("connection", socket => {
  console.log(`Got connection from ${socket.request.connection.remoteAddress}`);

  const client = new ObservableSocket(socket);

  // register client with all modules
  // tell all modules to register client
  for(let mod of modules)
    mod.registerClient(client);

  // client is now registered, tell modules
  for(let mod of modules)
    mod.clientRegistered(client);
});

// -------------------------
// Starter
const port = process.env.PORT || 3000;
function startServer() {
  server.listen(port, () => {
    console.log(`Started http server on ${port}`);
  });
}

Observable.merge(...modules.map(m => m.init$()))
  .subscribe({
    complete() {
      // when all modules are complete, start the server
      startServer();
    },
    error(error) {
      console.error(`Could not init module: ${error.stack || error}`);
    }
});
