import { Observable } from 'rxjs';

export class ObservableSocket {
  get isConnected() { return this._state.isConnected; }
  get isReconnecting() { return this._state.isReconnecting; }
  get isTotallyDead() { return !this.isConnected && !this.isReconnecting; }

  constructor(socket) {
    this._socket = socket;
    this._state = {};

    //  merge in the observable event handlers
    //
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

}
