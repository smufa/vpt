// #package js/main

// #include ../utils
// #include AbstractDialog.js

// #include ../../uispecs/SequenceWidgetDialog.json
// #include ../SequenceControls.js

class SequenceWidgetDialog extends AbstractDialog {

    constructor(renderingContext, readers, options) {
        super(UISPECS.SequenceWidgetDialog, options);

        this._currentIndex = 0;
        this._stop = false;
        this._renderingContext = renderingContext;
        this._readers = readers
        //this._binds.sequenceWidget._binds.label.innerHTML = "File sequence " + (this._currentIndex + 1) + "/" + this._readers.length;

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
        this._handleRenderingTypeChange = this._handleRenderingTypeChange.bind(this);
        this._handleDownloadGif = this._handleDownloadGif.bind(this);
        this._handleDownloadZip = this._handleDownloadZip.bind(this);

        this._addEventListeners();

        this._sequenceContext = new SequenceContext(this._renderingContext);
        this.renderNewVolume();
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
        this._$sequenceControls.addEventListener('stepBackward', this._handleStepBackward);

        this._binds.interval.addEventListener("change", this._handleIntervalChange);
        this._binds.renderingType.addEventListener("change", this._handleRenderingTypeChange);
        this._binds.buttonDownloadGIF.addEventListener("click", this._handleDownloadGif);
        this._binds.buttonDownloadZIP.addEventListener("click", this._handleDownloadZip);

    }

    _handlePlay() {
        this._currentIndex++;
        this.renderNewVolume().then(
            (result) => {
                this._handlePlay();
            },
            (error) => {
                this._handleStop()
                this._stop = false;
            }
        );
    }

    _handleStop() {
        this._stop = true;
        this._$sequenceControls.stop();
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
        this.incrementIndex();
        this.renderNewVolume();
    }

    _handleStepBackward() {
        this.decrementIndex();
        this.renderNewVolume();
    }

    incrementIndex() {
        this._currentIndex = Math.min(this._readers.length-1, this._currentIndex + 1);
    }

    decrementIndex() {
        this._currentIndex = Math.max(0, this._currentIndex - 1);
    }

    renderNewVolume() {
        return new Promise((resolve, reject) => {
            if(this._currentIndex > this._readers.length-1 || this._stop) {
                this._currentIndex = this._readers.length-1;
                reject();
                return;
            }
            this._binds.sequenceWidget._binds.label.innerHTML = "File sequence " + (this._currentIndex + 1) + "/" + this._readers.length;
            this._renderingContext.setVolume(this._readers[this._currentIndex]);
            switch(this._binds.renderingType.getValue()) {
                case "fixed":
                    setTimeout(() => {
                        this._renderingContext.stopRendering();
                        this._sequenceContext.addFrame(this._binds.numberOfRenderedImages._binds.label);
                        this._binds.buttonDownloadGIF.show();
                        this._binds.buttonDownloadZIP.show();
                        resolve();
                        return;
                    }, this._binds.interval.value);

                    break;
                case "convergence":
                    //this._renderingContext.readPixels();
                    resolve()
                    break;
                default:
                    reject()
                    return;
            }
        });
        
    }

    _handleIntervalChange() {
        this._handleStop();
        this._renderingContext.stopRendering();
    }

    _handleRenderingTypeChange() {
        switch(this._binds.renderingType.getValue()) {
            case "fixed":
                this._binds.intervalField.show();
                this._binds.thresholdField.hide();
                break;
            case "convergence":
                this._binds.intervalField.hide();
                this._binds.thresholdField.show();
                break;
        }
    }

    _handleDownloadGif() {
        this._sequenceContext.getGIF();
    }

    _handleDownloadZip() {
        this._sequenceContext.getZip();
    }

}
