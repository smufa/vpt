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
        this._handleThresholdChange = this._handleThresholdChange.bind(this);
        this._handleRenderingTypeChange = this._handleRenderingTypeChange.bind(this);
        this._handleDownloadGif = this._handleDownloadGif.bind(this);
        this._handleDownloadZip = this._handleDownloadZip.bind(this);
        this._handleClearFrames = this._handleClearFrames.bind(this);
        this._handleAddFrame = this._handleAddFrame.bind(this);

        this._addEventListeners();

        this._sequenceContext = new SequenceContext(this._renderingContext);
        this.renderNewVolumeWrapper();
    }

    _addEventListeners() {
        this._$sequenceControls.addEventListener('play', this._handlePlay);
        this._$sequenceControls.addEventListener('stop', this._handleStop);
        this._$sequenceControls.addEventListener('jumpToLast', this._handleJumpToLast);
        this._$sequenceControls.addEventListener('jumpToFirst', this._handleJumoToFirst);
        this._$sequenceControls.addEventListener('stepForward', this._handleStepForward);
        this._$sequenceControls.addEventListener('stepBackward', this._handleStepBackward);

        this._binds.interval.addEventListener("change", this._handleIntervalChange);
        this._binds.threshold.addEventListener("change", this._handleThresholdChange);
        this._binds.renderingType.addEventListener("change", this._handleRenderingTypeChange);
        this._binds.buttonDownloadGIF.addEventListener("click", this._handleDownloadGif);
        this._binds.buttonDownloadZIP.addEventListener("click", this._handleDownloadZip);
        this._binds.clearFrames.addEventListener("click", this._handleClearFrames);
        this._binds.addFrame.addEventListener("click", this._handleAddFrame);
    }

    _handlePlay() {
        this.setIndex(this._currentIndex + 1);
        this.renderNewVolumeWrapper(
            () => {
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
            }
        );
    }

    _handleStop() {
        this._stop = true;
    }

    _handleJumpToLast() {
        if(!this._rendering) {
            this.setIndex(this._readers.length-1);
            this.renderNewVolumeWrapper();
        }
    }

    _handleJumoToFirst() {
        if(!this._rendering) {
            this.setIndex(0);
            this.renderNewVolumeWrapper();
        }
    }

    _handleStepForward() {
        if(!this._rendering) {
            this.incrementIndex();
            this.renderNewVolumeWrapper();
        }
    }

    _handleStepBackward() {
        if(!this._rendering) {
            this.decrementIndex();
            this.renderNewVolumeWrapper();
        }
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
            this._$sequenceControls.disableStepControls();
            this._$sequenceControls.enableStop();
            this._rendering = true;
            this.renderNewVolume().then(
                () => {
                    if(this._binds.addOnRender.isChecked()) {
                        this._sequenceContext.addFrame(this._binds).then(
                            () => {
                                this._rendering = false;
                                this._$sequenceControls.enableStepControls();
                                this._$sequenceControls.enablePlay();
                                if(onResult) {
                                    onResult();
                                }
                            }
                        );
                    } else {
                        this._rendering = false;
                        this._$sequenceControls.enableStepControls();
                        this._$sequenceControls.enablePlay();
                        if(onResult) {
                            onResult();
                        }
                    }
                },
                () => {
                    this._rendering = false;
                    this._$sequenceControls.enableStepControls();
                    this._$sequenceControls.enablePlay();
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
                    //console.log("Starting fixed")
                    setTimeout(() => {
                        
                        this._renderingContext.stopRendering();
                        resolve();
                    }, this._binds.interval.value);
                    break;
                case "convergence":
                    //console.log("Starting convergence")
                    this.converge().then(
                        () => {
                            resolve();
                        },
                        () => {
                            this._stop = false;
                            console.log("Stopped")
                            reject();
                        }
                    );
                    
                    break;
                default:
                    reject()
                    return;
            }
        });
    }

    converge() {
        return new Promise((resolve, reject) => {
            var pixelsPrev = this._renderingContext.readPixels();
            var correlationPrev = 0;
            var diffRatioPrev = 2;
            this._interval = setInterval(() => {
                if(this._stop) {
                    clearInterval(this._interval);
                    reject();
                }
                this._renderingContext.stopRendering();
                var pixelsNew = this._renderingContext.readPixels();
                var crossCorrelation = this.calculateNormalizedCorrelation(pixelsPrev, pixelsNew, 3);

                var diffRatio = Math.abs((crossCorrelation - correlationPrev)/diffRatioPrev);
                var percent = diffRatio*100;

                var numberOfDecimals = -Math.floor( Math.log10(percent) + 1);

                if(numberOfDecimals >= this._binds.threshold.getValue()) {
                    clearInterval(this._interval);
                    resolve();
                } else {
                    this._renderingContext.startRendering();
                    pixelsPrev = pixelsNew;
                    correlationPrev = crossCorrelation;
                    diffRatio = diffRatio;
                }                
            }, this._binds.interval.value);
        });
    }

    calculateNormalizedCorrelation(data1, data2, step) {
        var mean1 = this.mean(data1);
        var mean2 = this.mean(data2);

        if (data1.length !== data2.length) {
            throw new Error("Vectors don't have the same size.");
        }
        var numerator = 0;
        var denumerator = 0;
        var denumerator = 0;
        var denumerator_2 = 0;
        
        for (var i = 0; i < data1.length; i += step) {
          numerator += (data1[i] - mean1) * (data2[i] - mean2);
          denumerator += (data1[i] - mean1) * (data1[i] - mean1);
          denumerator_2 += (data2[i] - mean2) * (data2[i] - mean2);
        }

        if(denumerator === 0 && denumerator_2 === 0) {
          if(data1[i] === data2[i]) {
            return 2;
          } else {
            return 0;
          }
        } else if(denumerator === 0) {
          return null
        } else if(denumerator_2 === 0) {
          return null
        }
      
        denumerator = Math.sqrt(denumerator * denumerator_2);
      
        return (numerator / denumerator)*2;
    }

    mean(data) {
        var sum = 0;        
        for (var i = 0; i < data.length; i+=this._step) {
            sum += data[i];
        }
        return sum / data.length;
    }

    _handleIntervalChange() {
        this.reset();
    }

    _handleThresholdChange() {
        //TODO bug where interval doesnt end
        //this.reset();
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
                this._binds.intervalField.show();
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
            this._renderingContext.stopRendering();
        }
        if(this._interval) {
            this._stop = true;
        } else {
            this._stop = false;
        }
        this._rendering = false;
        this.renderNewVolumeWrapper();
    }

}
