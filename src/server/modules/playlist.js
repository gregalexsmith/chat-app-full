import { ModuleBase } from '../lib/module';

export class PlaylistModule extends ModuleBase {
  constructor(io, usersModule, playlistRepository, videoServices) {
    super();
    this._io = io;
    // for auth
    this._users = usersModule;
    // for loading and saving playlist data to disk or db
    this._repository = playlistRepository;
    // used to locate video
    this._services = videoServices;

    this._nextSourceId = 1;
    this._playlist = [];
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

  registerClient(client) {
    client.onActions({
      "playlist:list": () => {
        return this._playlist;
      }
    });
  }

}
