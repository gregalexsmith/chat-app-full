import { Observable } from "rxjs";
import _ from "lodash";

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

    setInterval(this._tickUpdateTime.bind(this), 1000);
    setInterval(this._tickUpdateClients.bind(this), 5000);
  }

  init$() {
    return this._repository.getAll$().do(this.setPlaylist.bind(this));
  }

  getSourceById(id) {
    return _.find(this._playlist, { id });
  }

  setPlaylist(playlist) {
    this._playlist = playlist;
    for (let source of playlist)
      source.id = this._nextSourceId++;
    // tell all connected clients that a new playlist is avaliable
    this._io.emit("playlist:list", this._playlist);
  }

  setCurrentSource(source) {
		if (source == null) {
			this._currentSource = null;
			this._currentIndex = this._currentTime = 0;
		} else {
			const newIndex = this._playlist.indexOf(source);
			if (newIndex === -1)
				throw new Error(`Cannot set current to source ${source.id} / ${source.title}, it was not found`);

			this._currentTime = 0;
			this._currentSource = source;
			this._currentIndex = newIndex;
		}

		this._io.emit("playlist:current", this._createCurrentEvent());
		console.log(`playlist: setting current to ${source ? source.title : "{nothing}"}`);
	}

  playNextSource() {
    if (!this._playlist.length) {
      // empty playlist
      this.setCurrentSource(null);
      return;
    }
    if (this._currentIndex + 1 >= this._playlist.length)
      // last item of the playlist, loop back around
      this.setCurrentSource(this._playlist[0]);
    else
      this.setCurrentSource(this._playlist[this._currentIndex + 1]);
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


  _tickUpdateTime() {
		if (this._currentSource == null) {
			if (this._playlist.length)
				this.setCurrentSource(this._playlist[0]);
		} else {
			this._currentTime++;
			if (this._currentTime > this._currentSource.totalTime + 2)
				this.playNextSource();
		}
	}

  _tickUpdateClients() {
    this._io.emit("playlist:current", this._createCurrentEvent());
  }

  _createCurrentEvent() {
    if (this._currentSource)
      return {id: this._currentSource.id, time: this._currentTime};
    else
      return { id: null, time: 0};
  }
  
  moveSource(fromId, toId) {
		const fromSource = this.getSourceById(fromId);
		if (!fromSource)
			throw new Error(`Could not find "from" source ${fromId}`);

		let toSource = null;
		if (toId) {
			toSource = this.getSourceById(toId);
			if (!toSource)
				throw new Error(`Could not find "to" source ${toId}`);
		}

		const fromIndex = this._playlist.indexOf(fromSource);
		this._playlist.splice(fromIndex, 1);

		const toIndex = toId ? this._playlist.indexOf(toSource) + 1 : 0;
		this._playlist.splice(toIndex, 0, fromSource);

		if (this._currentSource)
			this._currentIndex = this._playlist.indexOf(this._currentSource);

		this._io.emit("playlist:moved", { fromId, toId });
		console.log(`playlist: moved ${fromSource.title} to ${toSource ? `to after ${toSource.title}` : "to the beginning"}`);
	}

  deleteSourceById(id) {
		const source = this.getSourceById(id);
		if (!source)
			throw new Error(`Cannot find source ${id}`);

		const sourceIndex = this._playlist.indexOf(source);

    // move to the next item if user deletes current item
		if (source == this._currentSource)
			if (this._playlist.length == 1)
				this.setCurrentSource(null);
			else
				this.playNextSource();

		this._playlist.splice(sourceIndex, 1);

		if (this._currentSource)
			this._currentIndex = this._playlist.indexOf(this._currentSource);

		this._io.emit("playlist:removed", {id});
		console.log(`playlist: deleted ${source.title}`);
	}

  registerClient(client) {
    // helper for checking auth state
    const isLoggedIn = () => this._users.getUserForClient(client) !== null;

    client.onActions({
      "playlist:list": () => {
        return this._playlist;
      },

      "playlist:current": () => {
        // tell client what item is currently playing
        return this._createCurrentEvent();
      },

      "playlist:add": ({url}) => {
        if (!isLoggedIn())
          return fail("You must be logged in to do that");
        return this.addSourceFromUrl$(url);
      },

      "playlist:set-current": ({id}) => {
        if (!isLoggedIn())
          return fail("You must be logged in to do that");

        const source = this.getSourceById(id);
        if (!source)
          return fail(`Cannot find source ${id}`);
        this.setCurrentSource(source);
      },

      "playlist:move": ({fromId, toId}) => {
        if (!isLoggedIn())
          return fail("You must be logged in to do that");
        this.moveSource(fromId, toId);
      },

      "playlist:remove": ({id}) => {
        if (!isLoggedIn())
          return fail("You must be logged in to do that");
        this.deleteSourceById(id);
      }
    });
  }

}
