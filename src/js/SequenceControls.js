// #package js/main

// #include utils
// #include EventEmitter.js
// #include WebGL.js
// #include Draggable.js

// #include ../html/SequenceControls.html
// #include ../css/SequenceControls.css

class SequenceControls extends EventEmitter {

    constructor(options) {
        super();

        this._handlePlay = this._handlePlay.bind(this);
        this._handleStop = this._handleStop.bind(this);

        Object.assign(this, {

        }, options);

        this._$html = DOMUtils.instantiate(TEMPLATES.SequenceControls);

        this._$play = this._$html.querySelector('[name="play"]');
        this._$step_backward = this._$html.querySelector('[name="step-backward"]');
        this._$backward = this._$html.querySelector('[name="backward"]');
        this._$step_forward = this._$html.querySelector('[name="step-forward"]');
        this._$forward = this._$html.querySelector('[name="forward"]');

        this._$play.addEventListener('click', this._handlePlay);
        this._$step_backward.addEventListener('click', () => {
            this.trigger('stepBackward');
        });
        this._$backward.addEventListener('click', () => {
            this.trigger('jumpToFirst');
        });
        this._$step_forward.addEventListener('click', () => {
            this.trigger('stepForward');
        });
        this._$forward.addEventListener('click', () => {
            this.trigger('jumpToLast');
        });
    }

    _handlePlay() {
        this._$play.removeEventListener("click", this._handlePlay);
        this._$play.addEventListener("click", this._handleStop);
        this.trigger('play');
        this.removeClass(this._$play, "icon-play");
        this.addClass(this._$play, "icon-stop");
    }

    _handleStop() {
        this.stop();
        this.trigger('stop');
    }

    stop() {
        this._$play.removeEventListener("click", this._handleStop);
        this._$play.addEventListener("click", this._handlePlay);
        this.removeClass(this._$play, "icon-stop");
        this.addClass(this._$play, "icon-play");
    }

    appendTo(object) {
        object.appendChild(this._$html);
    }

    hasClass(ele, cls) {
        return ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
    }
    addClass(ele, cls) {
        if (!this.hasClass(ele, cls)) ele.className += " " + cls;
    }
    removeClass(ele, cls) {
        if (this.hasClass(ele, cls)) {
            var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
            ele.className = ele.className.replace(reg, ' ');
        }
    }
}
