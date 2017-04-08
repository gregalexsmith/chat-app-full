import io from "socket.io-client";
import { ObservableSocket } from 'shared/observable-socket';

// export a singleton type object
// need to initalize the stores before connecting
export const socket = io({autoConnect: false});
export const server = new ObservableSocket(socket);

// create socket wrapper
// create playlist store
// create user store
// create chat store
