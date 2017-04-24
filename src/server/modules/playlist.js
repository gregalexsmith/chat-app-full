import {Observable} from "rxjs";
import { ModuleBase } from '../lib/module';

import {fail} from "shared/observable-socket";
import {validateAddSource} from "shared/validation/playlist";

export class PlaylistModule extends ModuleBase {
  constructor(io, usersModule, playlistRepository, videoServices) {
    super();
    this._io = io;
    this._users = usersModule;
    this._repository = playlistRepository;
    this._services = videoServices;

    this._nextSourceId = 1;
    this._playlist = [];
    this._currentIndex = -1;
    this._currentSource = null;
    this._currentTime = 0;
  }

  init$() {
    return this._repository.getAll$().do(this.setPlaylist.bind(this));
  }

  setPlaylist(playlist) {
    this._playlist = playlist;
    for (let source of playlist)
      source.id = this._nextSourceId++;
    // tell all connected clients that a new playlist is avaliable
    this._io.emit("playlist:list", this._playlist);
  }

  setCurrentSource() {

  }

  addSourceFromUrl$(url) {
		const validator = validateAddSource(url);
		if (!validator.isValid)
			return validator.throw$();

		return new Observable(observer => {
			let getSource$ = null;
      // try to find the first service that will accept this url
			for (let service of this._services) {
				getSource$ = service.process$(url);
				if (getSource$)
					break;
			}

			if (!getSource$)
				return fail(`No service accepted url ${url}`);

			getSource$
        // once getSource returns a value, invoke addSource with that value
				.do(source => this.addSource(source))
        // will tell the returned observable that the process has completed
				.subscribe(observer);
		});
	}

  // sync operation for adding a source to the playlist
  addSource(source) {
    source.id = this._nextSourceId++;

    let insertIndex = 0,
      afterId = -1;

    if (this._currentSource) {
      // there's something already playing, insert after it
      afterId = this._currentSource.id;
      insertIndex = this._currentIndex + 1;
    }

    this._playlist.splice(insertIndex, 0, source);
    this._io.emit("playlist:added", { source, afterId });

    if (!this._currentSource)
      this.setCurrentSource(source);

    console.log(`playlist: added ${source.title}`);
  }

  registerClient(client) {
    // helper for checking auth state
    const isLoggedIn = () => this._users.getUserForClient(client) !== null;

    client.onActions({
      "playlist:list": () => {
        return this._playlist;
      },
      "playlist:add": ({url}) => {
        if (!isLoggedIn())
          return fail("You must be logged in to do that");

        return this.addSourceFromUrl$(url);
      }
    });
  }

}
