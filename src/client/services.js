import io from "socket.io-client";
import { ObservableSocket } from 'shared/observable-socket';
import { UsersStore } from './stores/users-store';
import { ChatStore } from './stores/chat-store';
import { PlaylistStore } from './stores/playlist-store';

// export a singleton type object
// need to initalize the stores before connecting
export const socket = io({autoConnect: false});
export const server = new ObservableSocket(socket);


export const usersStore = new UsersStore(server);
export const chatStore = new ChatStore(server, usersStore);
export const playlistStore = new PlaylistStore(server);
