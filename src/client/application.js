import * as services from './services';

import "./application.scss";

// ---------------------
// Playground
services.server
  .emitAction$("login", {username: "foo", password: "bar"})
  .subscribe(user => {
    console.log("User logged in: " + user);
  }, error => {
    console.error(error);
  });


// ---------------------
// Auth


// ---------------------
// Components
require("./components/player/player");
require("./components/users/users");
require("./components/chat/chat");
require("./components/playlist/playlist");

// ---------------------
// Bootstrap
services.socket.connect();

services.server.emitAction$("users:list")
  .subscribe(users => console.log(users));
