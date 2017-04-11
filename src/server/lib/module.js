/*eslint no-unused-vars: "off" */
import { Observable } from 'rxjs';

export class ModuleBase {
  // defines callback methods
  // allows modules to initalize asyncronsly

  init$() {
    return Observable.empty();
  }

  // gets a client instance
  registerClient(client) {

  }

  clientRegistered(client) {

  }
}
