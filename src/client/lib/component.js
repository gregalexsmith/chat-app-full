import $ from "jquery";

// Component Base
// a thin base class for all of our UI components
// handles how they are added and removed from the DOM
// can be mounted to an element on a page
// can be attached or detached
export class ComponentBase {
  attach($mount) {
    this._$mount = $mount;
    this._onDetachHandlers = [];
    this.children = [];
    this._onAttach();
  }

  detach() {
    this._onDetach();
    for(let handler of this._onDetachHandlers)
      handler();
    for(let child of this.children)
      child.detatch();

    this._onDetachHandlers = [];
    this.children = [];
  }

  // events for components that inheret from this
  // can get notified when they are attached / detached
  _onAttach() {
  }

  _onDetach() {
  }
}

// Element Component
// a component that represents an element in the DOM
export class ElementComponent extends ComponentBase {
  get $element() { return this._$element; }

  // create an element with a specified type
  constructor(elementType = "div") {
    super();
    // then attach the component instance to the new element
    this._$element = $(`<${elementType}>`).data("component", this);
  }

  attach($mount) {
    super.attach($mount);
    // attach the element to the mount node
    this.$element.appendTo(this._$moutn);
  }

  detach() {
    super.detach();
    this.$element.remove();
  }

  _setClass(className, isOn) {
    if (isOn) {
      this._$element.addClass(className);
    } else {
      this._$element.remobeClass(className);
    }
  }
}
