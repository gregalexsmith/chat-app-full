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
  }
}
