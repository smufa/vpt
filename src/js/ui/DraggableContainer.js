// #package js/main

// #include UIObject.js

class DraggableContainer extends UIObject {

    constructor(options) {
        super(TEMPLATES.DraggableContainer, options);

        new Draggable(this._element, this._element.querySelector('.icon-move'));

        Object.assign(this, {
            label: ''
        }, options);

        this._binds.label.textContent = this.label;
    }

    add(object) {
        object.appendTo(this._binds.container);
    }
}
