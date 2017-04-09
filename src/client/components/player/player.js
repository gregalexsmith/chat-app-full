import $ from 'jquery';
import { ElementComponent } from '../../lib/component';

class PlayerComponent extends ElementComponent {
  constructor() {
    super();
  }

  _onAttach() {
    const $title = this._$mount.find("h1");
    $title.text("Pldfyer!");
  }
}

// attach component and setup for hot module reloading
let component;
try {
  // try to attach the player component
  component = new PlayerComponent();
  component.attach($("section.player"));
} catch(e) {
  // if error, make sure to detach
  console.error(e);
  if (component) {
    component.detatch();
  }
} finally {
  // no matter what, check for hot reloading
  if (module.hot) {
    module.hot.accept();
    // make sure to get rid of the previous compoenent
    module.hot.dispose(() => component && component.detach());
    // then this will reload the plugin
  }
}
