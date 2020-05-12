// #package js/main

// #include gif
// #include jszip

class SequenceContext {

    constructor(renderingContext) {
        this._renderingContext = renderingContext;

        this._snapshots = [];
    }

    getGIF() {
        this._gif = new GIF({
            workers: 2,
            quality: 10
        });

        var promises = [];
        var canvases = [];
        var canvasIndex = 0;
        this._snapshots.forEach((snapshot) => {
            promises.push(this.getCanvasFromBlob(snapshot, canvasIndex, canvases));
            canvasIndex++;
        });

        Promise.all(promises).then(
            () => {
                console.log(canvases);
                canvases.forEach( canvas => {
                    this._gif.addFrame(canvas, {copy: true, delay: 100});
                });
                this._gif.render();
            }
        );

        this._gif.on('finished', (gifBlob) => {
            this._gifBlob = gifBlob
            this.downloadBlob(this._gifBlob, "animation.gif")
            this._gif.freeWorkers.forEach(w => w.terminate());
        });
    }

    getPNG(index) {
        this.downloadBlob(this._snapshots[index], "image.png")
    }

    getZip() {
        var zip = new JSZip();
        var index = 1;
        this._snapshots.forEach((snapshot) => {
            zip.file(index+".png", snapshot.blob);
            index++;
        })

        zip.generateAsync({type:"blob"}).then((blob) => {
            this.downloadBlob(blob, "pngs.zip")
        }, function(err){
            console.log(err)
        });
    }

    addFrame(binds) {
        return new Promise((resolve, reject) => {
            this._renderingContext.getCanvas().toBlob((blob) => {
                this._snapshots.push({"blob": blob, "width": this._renderingContext.getCanvas().width, "height": this._renderingContext.getCanvas().height});
                binds.numberOfRenderedImages._binds.label.innerHTML = this._snapshots.length;
                if(this._snapshots.length > 0) {
                    binds.buttonDownloadGIF.show();
                    binds.buttonDownloadZIP.show();
                }
                resolve()
            });
        });
    }

    downloadBlob(blob, filename) {
        let URLObj = window.URL || window.webkitURL;
        let a = document.createElement("a");
        a.href = URLObj.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    getImageDataFromCanvas(canvas) {
        var offscreenCanvas = document.createElement("canvas");
        offscreenCanvas.width = canvas.width;
        offscreenCanvas.height = canvas.height;
        var ctx = offscreenCanvas.getContext("2d");

        ctx.drawImage(canvas,0,0);
        return ctx.getImageData(0,0, offscreenCanvas.width, offscreenCanvas.height);
    }

    get2dCanvas(width, height) {
        var offscreenCanvas = document.createElement("canvas");
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;

        return offscreenCanvas;
    }

    getCanvasFromBlob(snapshot, canvasIndex, canvases) {
        return new Promise((resolve, reject) => {
            var img = new Image();
            var canvas = this.get2dCanvas(snapshot.width, snapshot.height);
            img.onload = function () {
                canvas.getContext("2d").drawImage(img,0,0);
                canvases[canvasIndex] = canvas;
                resolve();
            }
            img.src = URL.createObjectURL(snapshot.blob);    
        });
    }
}
