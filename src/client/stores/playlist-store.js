import {Observable} from "rxjs";

export class PlaylistStore {
	constructor(server) {
		const defaultState = { current: null, list: [], map: {} };

		this._server = server;

		const events$ = Observable.merge(
			server.on$("playlist:list").map(opList)
    );

		this.state$ = events$
			.scan(({state}, op) => op(state), { state: defaultState })
			.publish();

		this.state$.connect();

		server.on("connect", () => {
			server.emitAction$("playlist:list");
		});
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
