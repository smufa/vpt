// #package js/main

// #include ../utils
// #include AbstractDialog.js

// #include ../../uispecs/SequenceWidgetDialog.json
// #include ../SequenceControls.js

class SequenceWidgetDialog extends AbstractDialog {

    constructor(renderingContext, readers, options) {
        super(UISPECS.SequenceWidgetDialog, options);

        this._stop = false;
        this._rendering = false;
        this._renderingContext = renderingContext;
        this._readers = readers;
        this.setIndex(0);

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
        this._handleClearFrames = this._handleClearFrames.bind(this);
        this._handleAddFrame = this._handleAddFrame.bind(this);

        this._addEventListeners();

        this._sequenceContext = new SequenceContext(this._renderingContext);
        this.renderNewVolumeWrapper();
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
        this._binds.clearFrames.addEventListener("click", this._handleClearFrames);
        this._binds.addFrame.addEventListener("click", this._handleAddFrame);
    }

    _handlePlay() {
        this.setIndex(this._currentIndex + 1);
        this.renderNewVolumeWrapper(() => {
            if(!this._stop) {
                this._handlePlay();
            } else {
                this._handleStop()
                this._stop = false;
            }
        },
        () => {
            this._handleStop()
            this._stop = false;
        })
    }

    _handleStop() {
        this._stop = true;
        this._$sequenceControls.stop();
    }

    _handleJumpToLast() {
        this.setIndex(this._readers.length-1);
        this.renderNewVolumeWrapper();
    }

    _handleJumoToFirst() {
        this.setIndex(0);
        this.renderNewVolumeWrapper();
    }

    _handleStepForward() {
        this.incrementIndex();
        this.renderNewVolumeWrapper();
    }

    _handleStepBackward() {
        this.decrementIndex();
        this.renderNewVolumeWrapper();
    }

    incrementIndex() {
        this.setIndex(Math.min(this._readers.length-1, this._currentIndex + 1));
    }

    decrementIndex() {
        this.setIndex(Math.max(0, this._currentIndex - 1));
    }

    setIndex(newValue) {
        this._currentIndex = newValue;
        if(this._currentIndex < this._readers.length) {
            this._binds.sequenceWidget._binds.label.innerHTML = "File sequence " + (this._currentIndex + 1) + "/" + this._readers.length;
        }
    }

    renderNewVolumeWrapper(onResult, onError) {
        if(!this._rendering) {
            this._rendering = true;
            this.renderNewVolume().then(
                () => {
                    this._rendering = false;
                    if(this._binds.addOnRender.isChecked()) {
                        this._sequenceContext.addFrame(this._binds).then(
                            () => {
                                if(onResult) {
                                    onResult();
                                }
                            }
                        );
                    }
                },
                () => {
                    this._rendering = false;
                    if(onError) {
                        onError();
                    }
                }
            );
        }
    }

    renderNewVolume() {
        return new Promise((resolve, reject) => {
            if(this._currentIndex > this._readers.length-1) {
                this._currentIndex = this._readers.length-1;
                reject();
                return;
            }
            this._renderingContext.setVolume(this._readers[this._currentIndex]);
            switch(this._binds.renderingType.getValue()) {
                case "fixed":
                    setTimeout(() => {
                        this._renderingContext.stopRendering();
                        resolve();
                        return;
                    }, this._binds.interval.value);

                    break;
                case "convergence":
                    //TODO
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
        this.reset();
    }

    _handleRenderingTypeChange() {
        switch(this._binds.renderingType.getValue()) {
            case "infinite":
                this._binds.intervalField.hide();
                this._binds.thresholdField.hide();
                break;
            case "fixed":
                this._binds.intervalField.show();
                this._binds.thresholdField.hide();
                break;
            case "convergence":
                this._binds.intervalField.hide();
                this._binds.thresholdField.show();
                break;
        }
        this.reset();
    }

    _handleDownloadGif() {
        this._sequenceContext.getGIF();
    }

    _handleDownloadZip() {
        this._sequenceContext.getZip();
    }

    _handleClearFrames() {
        this._sequenceContext = new SequenceContext(this._renderingContext);
        this._binds.numberOfRenderedImages._binds.label.innerHTML = 0;
        this._binds.buttonDownloadGIF.hide();
        this._binds.buttonDownloadZIP.hide();
    }

    _handleAddFrame() {
        this._sequenceContext.addFrame(this._binds);
    }

    reset() {
        if(this._rendering) {
            this._handleStop();
            this._renderingContext.stopRendering();
        }
        this._rendering = false;
        this.renderNewVolumeWrapper();
    }

}
