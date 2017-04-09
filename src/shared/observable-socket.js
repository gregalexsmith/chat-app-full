import { Observable, ReplaySubject } from 'rxjs';

// alows us to "throw" errors and send only the relevent information back to the client
// the onAction method will check for clientMessage when it catches an error
export function clientMessage(message) {
  const error = new Error(message);
  error.clientMessage = message;
  return error;
}

export class ObservableSocket {
  get isConnected() { return this._state.isConnected; }
  get isReconnecting() { return this._state.isReconnecting; }
  get isTotallyDead() { return !this.isConnected && !this.isReconnecting; }

  constructor(socket) {
    this._socket = socket;
    this._state = {};
    // for keeping track of the actions we can respond too
    this._actionCallbacks = {};
    // track the requests send to the sever
    this._requests = {};
    // incremented on each request to the server
    this._nextRequestId = 0;

    //  merge in the observable event handlers
    this.status$ = Observable.merge(
      this.on$("connect").map(() => ({ isConnected: true})),
      this.on$("disconnected").map(() => ({ isConnected: false})),
      this.on$("reconnecting").map((attempt) => ({ isConnected: false, isReconnecting: true, attempt})),
      this.on$("reconnect_failed").map(() => ({ isConnected: false, isReconnecting: false}))
    )
    // if someone new subscribes, don't re-do all the event handlers
    .publishReplay(1)
    .refCount();

    this.status$.subscribe(state => this._state = state);
  }

  // ---------------------
  // Basic Wrappers

  // return an observable sequence based off the event
  // socket has an 'on' method already so this works nicely
  on$(event) {
    return Observable.fromEvent(this._socket, event);
  }

  on(event, callback) {
    this._socket.on(event, callback);
  }

  off(event, callback) {
    this._socket.off(event, callback);
  }

  // only need to pass one event arg
  // so that this works well with rxjs
  emit(event, arg) {
    this._socket.emit(event, arg);
  }

  // ---------------------
  // Emit (Client Side)
  // send an action to the server
  // expects a callback with an id
  emitAction$(action, arg) {
    // build our id
    const id = this._nextRequestId++;
    this._registerCallbacks(action);

    // ReplaySubject is similar to a promise
    // will wait until it gets a value
    const subject = this._requests[id] = new ReplaySubject(1);
    this._socket.emit(action, arg, id);
    return subject;
  }

  // registers the success and failure callbacks on the socket
  // "when the server sends something, we need to do something with it"
  _registerCallbacks(action) {
    // only need to register these once
    if (this._actionCallbacks.hasOwnProperty(action))
      return;

    // handle callbacks on the socket
    // login (username) -> emit("login") -> server -> emit("login", {data}) -> client

    // handle succesfull request
    this._socket.on(action, (arg, id) => {
      const request = this._popRequest(id);
      if(!request)
        return;
      request.next(arg);
      request.complete();
    });

    // handle failure when performing request
    this._socket.on(`${action}:fail`, (arg, id) => {
      const request = this._popRequest(id);
      if (!request)
        return;
      request.error(arg);
    });

    this._actionCallbacks[action] = true;
  }

  // server send back a request with id
  // find the request, remove it and return it
  _popRequest(id) {
    if(!this._requests.hasOwnProperty(id)) {
      console.error(`Event with id ${id} was returned twice, or the server did not send back an ID`);
      return;
    }

    const request = this._requests[id];
    delete this._requests[id];
    return request;
  }

  // ---------------------
  // On (Server Side)
  // This is used on the server to handle incomming requests from the client
  onAction(action, callback) {
    this._socket.on(action, (arg, requestId) => {
      try {
        const value = callback(arg);
        if (!value) {
          // if nothing was returned by the callback on the server
          // we still tell the client the request was completed
          this._socket.emit(action, null, requestId);
          return;
        }

        if(typeof(value.subscribe) !== "function") {
          // if the value is not an observable sequence
          // then we can immediatly send back the response
          this._socket.emit(action, value, requestId);
          return;
        }

        // now know that value is an observable sequence
        // we have to subscribe to it and wait for a value
        let hasValue = false;
        // now handle the 3 possible callbacks for the observable
        value.subscribe({
          next: (item) => {
            // check to see if the observable has already returned a value
            if (hasValue)
              // we don't want this to happen
              throw new Error(`Action ${action} produced more than one value`);

            // otherwise send the first value back to the client
            this._socket.emit(action, item, requestId);
            hasValue = true;
          },
          error: (error) => {
            // emit the error back to the client and log
            this._emitError(action, requestId, error);
            console.error(error.stack || error);
          },
          complete: () => {
            if(!hasValue)
              this._socket.emit(action, null, requestId);
          }
        });
      }
      catch (error) {
        // if the request has a proper id from the client
        if (typeof(requestId) !== "undefined") {
          this._emitError(action, requestId, error);
        }
        console.error(error.stack || error);
      }
    });
  }

  // figure out if we need to display a specific error
  // checks for clientMessage on the thrown Error
  _emitError(action, id, error) {
    // if the error is an object and the error has a client message, return the client message
    const message = (error && error.clientMessage) || "Fatal Error";
    // then send the error back to the client
    this._socket.emit(`${action}:fail`, {message}, id);
  }

}
