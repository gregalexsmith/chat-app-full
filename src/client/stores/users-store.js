import _ from 'lodash';
import { Observable } from 'rxjs';

import {validateLogin} from "shared/validation/users";

// users store
// allows the client to keep track of the users list through server events
// keeps track of user auth state
export class UsersStore {
  get currentUser() { return this._currentUser; }
  get isLoggedIn() { return this._currentUser && this.currentUser.isLoggedIn; }

  constructor(server) {
    this._server = server;

    const defaultStore = {users: []};

    // map each received server event to a function that returns a function that will mutate the state
    const events$ = Observable.merge(
      this._server.on$("users:list").map(opList),
      this._server.on$("users:added").map(opAdd),
      this._server.on$("users:removed").map(opRemove)
    );

    // then for all events...
    this.state$ = events$
      // apply a function to each item emitted by an observable using scan
      .scan(function(last, op) {
        // emit each successive value
        return op(last.state);
        // (start with the default state)
      }, {state: defaultStore})
      // publishReplay(1): "every time you subscribe to the state, you'll always get the latest state at least once"
      .publishReplay(1);
      // connect the event listeners to socket.io
      this.state$.connect();

      // ---------------------
      // Auth
      this.currentUser$ = Observable.merge(
        this._server.on$("auth:login"),
        this._server.on$("auth:logout").mapTo({}))
        .startWith({})
        .publishReplay(1)
        .refCount();

      this.currentUser$.subscribe(user => this._currentUser = user);

      // ---------------------
      // Bootstrap

      // make sure the client gets a list of users every time
      this._server.on("connect", () => {
        // handles first connect and any re-connect
        this._server.emit("users:list");

        if(!this.isLoggedIn)
          return;

        this.login$(this._currentUser.name).subscribe(
          user => console.log(`Logged in again as ${user.name}`),
          error => alert(`Could not log back in ${error.message || "Unknown Error"}`)
        );
      });
  }

  // allow the client to login and register with the server
  login$(name) {
    const validator = validateLogin(name);
    if (validator.hasErrors)
      return Observable.throw({message: validator.message});

    return this._server.emitAction$("auth:login", {name});
  }

  logout$() {
    return this._server.emitAction$("auth:logout");
  }

}

// returns a function that mutates the state
// allows us to get a current list of all users
// and to know what the last event was
function opList(users) {
  return state => {
    state.users = users;
    state.users.sort((l, r) => l.name.localeCompare(r.name));
    return {
      type: "list",
      state: state
    };
  };
}


function opAdd(user) {
  return state => {
    let insertIndex = _.findIndex(state.users,
      u => u.name.localeCompare(user.name) > 0);

    if (insertIndex === -1)
      insertIndex = state.users.length;

    state.users.splice(insertIndex, 0, user);
    return {
      type: "add",
      user: user,
      state: state
    };
  };
}

function opRemove(user) {
  return state => {
    const index = _.findIndex(state.users, { name: user.name });
    if (index !== -1) {
      state.users.splice(index, 1);
    }
    return {
      type: "remove",
      user: user,
      state: state
    };
  };
}
