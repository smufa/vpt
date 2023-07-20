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
        this._handleStepBackward = this._handleStepBackward.bind(this);
        this._handleJumpToFirst = this._handleJumpToFirst.bind(this);
        this._handleStepForward = this._handleStepForward.bind(this);
        this._handleJumpToLast = this._handleJumpToLast.bind(this);

        Object.assign(this, {

        }, options);

        this._$html = DOMUtils.instantiate(TEMPLATES.SequenceControls);

        this._$play = this._$html.querySelector('[name="play"]');
        this._$step_backward = this._$html.querySelector('[name="step-backward"]');
        this._$backward = this._$html.querySelector('[name="backward"]');
        this._$step_forward = this._$html.querySelector('[name="step-forward"]');
        this._$forward = this._$html.querySelector('[name="forward"]');

        this._$play.addEventListener('click', this._handlePlay);
        
        this.enableStepControls();
    }

    _handlePlay() {
        this.trigger('play');
    }

    _handleStop() {
        this.trigger('stop');
    }

    _handleStepBackward() {
        this.trigger('stepBackward');
    }

    _handleJumpToFirst() {
        this.trigger('jumpToFirst');
    }

    _handleStepForward() {
        this.trigger('stepForward');
    }

    _handleJumpToLast() {
        this.trigger('jumpToLast');
    }

    enableStop() {
        this._$play.addEventListener("click", this._handleStop);
        this._$play.removeEventListener("click", this._handlePlay);
        this.removeClass(this._$play, "icon-play");
        this.addClass(this._$play, "icon-stop");

        this.disableStepControls();
    }

    enablePlay() {
        this._$play.removeEventListener("click", this._handleStop);
        this._$play.addEventListener("click", this._handlePlay);
        this.removeClass(this._$play, "icon-stop");
        this.addClass(this._$play, "icon-play");

        this.enableStepControls();
    }

    disableStepControls() {
        this._$step_backward.removeEventListener('click', this._handleStepBackward);
        this._$backward.removeEventListener('click', this._handleJumpToFirst);
        this._$step_forward.removeEventListener('click', this._handleStepForward);
        this._$forward.removeEventListener('click', this._handleJumpToLast);

        this.addClass(this._$step_backward, "disabled");
        this.addClass(this._$backward, "disabled");
        this.addClass(this._$step_forward, "disabled");
        this.addClass(this._$forward, "disabled");
    }

    enableStepControls() {
        this._$step_backward.addEventListener('click', this._handleStepBackward);
        this._$backward.addEventListener('click', this._handleJumpToFirst);
        this._$step_forward.addEventListener('click', this._handleStepForward);
        this._$forward.addEventListener('click', this._handleJumpToLast);

        this.removeClass(this._$step_backward, "disabled");
        this.removeClass(this._$backward, "disabled");
        this.removeClass(this._$step_forward, "disabled");
        this.removeClass(this._$forward, "disabled");
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
