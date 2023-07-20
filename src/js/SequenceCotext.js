// #package js/main

// #include gif
// #include jszip

class SequenceContext {

    constructor(renderingContext) {
        this._renderingContext = renderingContext;

        this._gif = new GIF({
            workers: 2,
            quality: 10
        });

        this._blobs = [];
    }

    getGIF() {
        if(!this._gifBlob) {
            this._gif.render();

            this._gif.on('finished', (gifBlob) => {
                this._gifBlob = gifBlob
                this.downloadBlob(this._gifBlob, "animation.gif")
                this._gif.freeWorkers.forEach(w => w.terminate());
            });
        }
        this.downloadBlob(this._gifBlob, "animation.gif")
    }

    openGIF() {
        if(this._gifBlob) {
            window.open(URL.createObjectURL(this._gifBlob));
        }
    }

    getPNG(index) {
        this.downloadBlob(this._blobs[index], "image.png")
    }

    getZip() {
        var zip = new JSZip();
        var index = 1;
        this._blobs.forEach((blob) => {
            zip.file(index+".png", blob);
            index++;
        })

        zip.generateAsync({type:"blob"}).then((blob) => {
            this.downloadBlob(blob, "pngs.zip")
        }, function(err){
            console.log(err)
        });

    }

    addFrame(label) {
        this._renderingContext.getCanvas().toBlob((blob) => {
            this._blobs.push(blob);
            label.innerHTML = this._blobs.length;
        });

        this._gif.addFrame(this._renderingContext.getCanvas(), {copy: true, delay: 50});
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

    get2dCanvasContext(canvas) {
        var offscreenCanvas = document.createElement("canvas");
        offscreenCanvas.width = canvas.width;
        offscreenCanvas.height = canvas.height;
        var ctx = offscreenCanvas.getContext("2d");

        return ctx;
    }
}
