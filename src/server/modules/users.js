import _ from 'lodash';
import { ModuleBase } from '../lib/module';

export class UsersModule extends ModuleBase {
  constructor(io) {
    super();
    this._io = io;
    this._usersList = [
      {name: "Foo", color: this.getColorForUsername("Foo")},
      {name: "Bar", color: this.getColorForUsername("Bar")},
      {name: "Baz", color: this.getColorForUsername("Baz")}
    ];
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

  // allow the client to request a list of users
  registerClient(client) {

    // fake create a new user every 2 seconds
    let index = 0;
    setInterval(() => {
      const username = `New User ${index}`;
      const user = {name: username, color: this.getColorForUsername(username)};
      client.emit("users:added", user);
      index++;
    }, 2000);

    client.onActions({
      "users:list": () => {
        return this._usersList;
      },
      "auth:login": () => {

      },
      "auth:logout": () => {

      }

    });
  }
}
