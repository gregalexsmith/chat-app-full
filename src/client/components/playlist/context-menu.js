import $ from 'jquery';
import {Subject, Observable} from "rxjs";

import { ElementComponent } from '../../lib/component';

export class PlaylistContextMenuComponent extends ElementComponent {
  constructor(playlistStore, usersStore, $list) {
		super("div");
		this.$element.addClass("context-menu");

		this._playlist = playlistStore;
		this._users = usersStore;
		this._$list = $list;
	}

  _onAttach() {
    const $playButton = $(`
      <a href="#" class="play">
        <i class="fa fa-play-circle" /> Play
      </a>
    `).appendTo(this.$element);

    const $deleteButton = $(`
      <a href="#" class="delete">
        <i class="fa fa-trash" /> Delete
      </a>
    `).appendTo(this.$element);

    const selectedItemSubject$ = new Subject();

    // get the list component that was clicked on
    // we use jquery to find the closest parent li component
    // this will have a data attribute (component) that points to the instance of the element (this)
    const openMenuOnItem$ = Observable.fromEventNoDefault(this._$list, "contextmenu")
      .map(event => $(event.target).closest("li").data("component"));

    // close the menu only when we click outside of the context menu area
    const closeMenu$ = Observable.fromEvent($("body"), "mouseup")
      // if there is a mouse up event, and it is not a decendant of the selectd item or context menu, then close the menu
      .filter(event => $(event.target).closest("li.selected, .context-menu").length == 0)
      .mapTo(null);

    // combine to get our currently selected item
    // create a subscribable stream that we can subscribe to that tells what the currently selected items is
    const selectedItem$ = Observable.merge(openMenuOnItem$, closeMenu$, selectedItemSubject$)
      .filter(() => this._users.isLoggedIn)
      .share();

    // now handle logic for opening and closing menu
    let lastItem = null;
    selectedItem$
      .compSubscribe(this, item => {
        if (lastItem)
          lastItem.isSelected = false;

        lastItem = item;
        if (!item) {
          // user has clicked outside the menu
          this.$element.removeClass("open");
          return;
        }

        item.isSelected = true;
        this.$element.addClass("open");

        const contextMenuHeight = this.$element.outerHeight();
        const itemHeight = item.$element.outerHeight();
        const itemPosition = item.$element[0].offsetTop;

        // position the menu above / below the item based on list position
        const targetPosition = itemPosition + itemHeight + contextMenuHeight > this._$list[0].scrollHeight
          ? itemPosition - contextMenuHeight
          : itemPosition + itemHeight;

        this.$element.css("top", targetPosition);
      });

    // handle button operations
    const setCurrentItem$ = Observable.fromEventNoDefault($playButton, "click")
      .map(() => comp => this._playlist.setCurrentSource$(comp.source));

    const deleteItem$ = Observable.fromEventNoDefault($deleteButton, "click")
      .map(() => comp => this._playlist.deleteSource$(comp.source));

    Observable.merge(setCurrentItem$, deleteItem$)
      // first get currently selected item
      .withLatestFrom(selectedItem$)
      // now we have the returned function from set/deleteItem$ and the item
      // call the operation and pass the item
      .flatMap(([op, item]) => op(item).catchWrap())
      // operation is done, will either be error or close the menu
      .compSubscribe(this, response => {
        if (response && response.error)
          alert(response.error.message || "Unknown Error");
        else
          selectedItemSubject$.next(null);
      });
  }
}
