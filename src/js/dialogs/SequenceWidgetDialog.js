// #package js/main

// #include ../utils
// #include AbstractDialog.js

// #include ../../uispecs/SequenceWidgetDialog.json
// #include ../SequenceControls.js

class SequenceWidgetDialog extends AbstractDialog {

    constructor(options) {
        super(UISPECS.SequenceWidgetDialog, options);

        console.log(options);
        this._renderingContext = options['rendering_context'];
        this._readers = options['readers'];
        this._currentIndex = 0;

        this._$sequenceControls = new SequenceControls();
        this._binds.sequenceControlsContainer.add(this._$sequenceControls);

        this._binds.sequenceWidget.appendTo(document.body);
        
        this._handlePlay = this._handlePlay.bind(this);
        this._handleStop = this._handleStop.bind(this);
        this._handleJumpToLast = this._handleJumpToLast.bind(this);
        this._handleJumoToFirst = this._handleJumoToFirst.bind(this);
        this._handleStepForward = this._handleStepForward.bind(this);
        this._handleStepBackward = this._handleStepBackward.bind(this);
        this._handleIntervalChange = this._handleIntervalChange.bind(this);

        this._addEventListeners();

        this._renderingContext.stopRendering();
        //Set first volume
        this._renderingContext.setVolume(this._readers[0]);
    }

    reset(readers) {
        this._readers = readers;
    }

    _addEventListeners() {
        this._$sequenceControls.addEventListener('play', this._handlePlay);
        this._$sequenceControls.addEventListener('stop', this._handleStop);
        this._$sequenceControls.addEventListener('jumpToLast', this._handleJumpToLast);
        this._$sequenceControls.addEventListener('jumpToFirst', this._handleJumoToFirst);
        this._$sequenceControls.addEventListener('stepForward', this._handleStepForward);
        this._$sequenceControls.addEventListener('stepBckward', this._handleStepBackward);

        this._binds.interval.addEventListener("change", this._handleIntervalChange)
    }

    _handlePlay() {
        this.renderingInterval = setInterval(() => {
            this.renderNewVolume();
            this._currentIndex++;
            if(this._currentIndex > this._readers.length-1) {
                this._currentIndex = 0;
            }

        }, this._binds.interval.value);

    }

    _handleStop() {
        clearInterval(this.renderingInterval);
    }

    _handleJumpToLast() {
        this._currentIndex = this._readers.length-1;
        this.renderNewVolume();
    }

    _handleJumoToFirst() {
        this._currentIndex = 0;
        this.renderNewVolume();
    }

    _handleStepForward() {
        this._currentIndex = Math.min(this._readers.length-1, this._currentIndex + 1);
        this.renderNewVolume();
    }

    _handleStepBackward() {
        this._currentIndex = Math.max(0, this._currentIndex - 1);
        this.renderNewVolume();
    }

    renderNewVolume() {
        /*
        this._renderingContext.readPixels();
        var gif = new GIF({
            workers: 2,
            quality: 10
          });
        console.log(gif);
        gif.addFrame(this._renderingContext.getCanvas(), {copy: true});
        gif.on('finished', function(blob) {
            window.open(URL.createObjectURL(blob));
          });
          
          gif.render();
          */
        this._renderingContext.stopRendering();
        this._renderingContext.setVolume(this._readers[this._currentIndex]);
    }

    _handleIntervalChange() {
        this._handleStop();
        this._handlePlay();
    }
}
