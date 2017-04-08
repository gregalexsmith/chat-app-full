import * as services from './services';

import "./application.scss";

// ---------------------
// Playground
services.server.on$("test")
  // bind to the test event and perform a transformation using map
  .map(d => d + " woah")
  .subscribe(item => {
    console.log(`Got ${item} from server!`);
  });

services.server.status$
  .subscribe(status => {
    console.log(status);
  });


// ---------------------
// Auth


// ---------------------
// Components


// ---------------------
// Bootstrap
services.socket.connect();
