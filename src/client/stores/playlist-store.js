import {Observable} from "rxjs";
import {validateAddSource} from "shared/validation/playlist";

export class PlaylistStore {
	constructor(server) {
		const defaultState = { current: null, list: [], map: {} };

		this._server = server;

		// attach map handlers for actions recieved from the server
		const events$ = Observable.merge(
			server.on$("playlist:list").map(opList)
    );

		// tie into our state, publish the operations
		this.state$ = events$
			.scan(({state}, op) => op(state), { state: defaultState })
			.publishReplay(1);

		this.state$.connect();

		server.on("connect", () => {
			// request the playlist from the server on connection
			server.emitAction$("playlist:list");
		});
	}

	addSource$(url) {
		const validator = validateAddSource(url);
		if (!validator.isValid)
			return Observable.throw({ message: validator.message });

		return this._server.emitAction$("playlist:add", { url });
	}
}

// take in a list of playlist items
// updates the store's state by adding the playlist items
function opList(sources) {
	return state => {
		state.current = null;
		state.list = sources;
    // create an object that sorts the items by their id
		state.map = sources.reduce((map, source) => {
			map[source.id] = source;
			return map;
		}, {});

		return {
			type: "list",
			state: state
		};
	};
}
