import { Observable } from 'rxjs';

import { validateSendMessage } from 'shared/validation/chat';

export class ChatStore {
  constructor(server, usersStore) {
    this._server = server;
    this._users = usersStore;

    // get a stream of messages
    // get the first 100 right away, then subsequent messages will be a part of the stream as they come in
    this.messages$ = Observable.merge(
      // if the server ever gives us a chat list, break it apart
      // takes a stream of an array of items and breaks it appart into individual items
      server.on$("chat:list")
        .flatMap(list => Observable.from(list)),
      server.on$("chat:added")
    ).publishReplay(100);

    this.messages$.connect();

    // only re-request the chat list on the first server connection
    server.on$("connect")
      .first()
      .subscribe(() => server.emit("chat:list"));
  }

  sendMessage$(message, type = "normal") {
    const validator = validateSendMessage(this._users.currentUser, message, type);
    if (!validator.isValid)
      return Observable.throw({message: validator.message});

    return this._server.emitAction$("chat:add", { message, type });
  }

}
