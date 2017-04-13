import _ from 'lodash';
import { Observable } from "rxjs";

import { ModuleBase } from '../lib/module';
import { validateLogin } from "shared/validation/users";
import { fail } from "shared/observable-socket";

const AuthContext = Symbol("AuthContext");

// handles server side logic for users
export class UsersModule extends ModuleBase {
  constructor(io) {
    super();
    this._io = io;
    this._userList = [];
    this._users = {};
  }

  // Generate hsl color based of a username
  getColorForUsername(username) {
    // get a number that represents a username using a hash
    let hash = _.reduce(username,
      (hash, ch) => ch.charCodeAt(0) + (hash << 6) + (hash << 16) - hash,
      0);

    // convert the hash to a color
    hash = Math.abs(hash);
    const hue = hash % 360;
    const saturation = hash % 25 + 70; // add 70 for decent saturation
    // control the lightness to work with a background
    const lightness = 100 - (hash % 15 + 35);

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  // determine if a user is logged in
  getUserForClient(client) {
    const auth = client[AuthContext];
    if (!auth) {
      return null;
    }
    return auth.isLoggedIn ? auth : null;
  }

  // handle client login
  // returns observable for potential async operations
  loginClient$(client, username) {
		username = username.trim();

    // validate username
		const validator = validateLogin(username);
		if (!validator.isValid)
			return validator.throw$();

		if (this._users.hasOwnProperty(username))
			return fail(`Username ${username} is already taken`);

    // check if the client has AuthContext
    // ensures the client only logs in once
		const auth = client[AuthContext] || (client[AuthContext] = {});
		if (auth.isLoggedIn)
			return fail("You are already logged in");

    // set client auth information
		auth.name = username;
		auth.color = this.getColorForUsername(username);
		auth.isLoggedIn = true;

    // add to list of registered users
		this._users[username] = client;
		this._userList.push(auth);

    // return auth info
		this._io.emit("users:added", auth);
		console.log(`User ${username} logged in`);
		return Observable.of(auth);
	}

  // handle client logout
  logoutClient(client) {
    const auth = this.getUserForClient(client);
    if (!auth)
      return;

    const index = this._userList.indexOf(auth);
    this._userList.splice(index, 1);
    delete this._users[auth.name];
    delete client[AuthContext];

    this._io.emit("users:removed", auth);
    console.log(`User ${auth.name} logged out`);
  }

  // allow the client to request a list of users
  registerClient(client) {
    client.onActions({
      "users:list": () => {
        return this._userList;
      },
      "auth:login": ({name}) => {
        return this.loginClient$(client, name);
      },
      "auth:logout": () => {
        this.logoutClient(client);
      }
    });

    client.on("disconnect", () => {
      this.logoutClient(client);
    });
  }
}
