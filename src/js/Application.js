// #package js/main

// #include utils
// #include readers
// #include loaders
// #include dialogs
// #include dialogs/renderers
// #include dialogs/tonemappers
// #include ui
// #include RenderingContext.js

class Application {

constructor() {
    this._handleFileDrop = this._handleFileDrop.bind(this);
    this._handleRendererChange = this._handleRendererChange.bind(this);
    this._handleToneMapperChange = this._handleToneMapperChange.bind(this);
    this._handleVolumeLoad = this._handleVolumeLoad.bind(this);
    this._handleEnvmapLoad = this._handleEnvmapLoad.bind(this);
    this._handleEnvMapRotationChange = this._handleEnvMapRotationChange.bind(this);
    this._handleEnvMapOverrideChange = this._handleEnvMapOverrideChange.bind(this);
    this._handleEnvMapColorChange = this._handleEnvMapColorChange.bind(this);
    this._handleEnvMapContributionChange = this._handleEnvMapContributionChange.bind(this);
    this._handleScaleChange = this._handleScaleChange.bind(this);
    this._handleTFNumberChange = this._handleTFNumberChange.bind(this);
    this._handleTFAccumulationGMChange = this._handleTFAccumulationGMChange.bind(this);

    this._renderingContext = new RenderingContext();
    this._canvas = this._renderingContext.getCanvas();
    this._canvas.className += 'renderer';
    document.body.appendChild(this._canvas);

    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this._renderingContext.resize(width, height);
    });
    CommonUtils.trigger('resize', window);

    document.body.addEventListener('dragover', e => e.preventDefault());
    document.body.addEventListener('drop', this._handleFileDrop);

    this._mainDialog = new MainDialog();
    if (!this._renderingContext.hasComputeCapabilities()) {
        this._mainDialog.disableMCC();
    }

    this._statusBar = new StatusBar();
    this._statusBar.appendTo(document.body);

    this._volumeLoadDialog = new VolumeLoadDialog();
    this._volumeLoadDialog.appendTo(this._mainDialog.getVolumeLoadContainer());
    this._volumeLoadDialog.addEventListener('load', this._handleVolumeLoad);

    this._envmapLoadDialog = new EnvmapLoadDialog();
    this._envmapLoadDialog.appendTo(this._mainDialog.getEnvmapLoadContainer());
    this._envmapLoadDialog.addEventListener('load', this._handleEnvmapLoad);

    this._renderingContextDialog = new RenderingContextDialog();
    this._renderingContextDialog.appendTo(
        this._mainDialog.getRenderingContextSettingsContainer());
    this._renderingContextDialog.addEventListener('resolution', options => {
        this._renderingContext.setResolution(options.resolution);
    });
    this._renderingContextDialog.addEventListener('transformation', options => {
        const s = options.scale;
        const t = options.translation;
        this._renderingContext.setScale(s.x, s.y, s.z);
        this._renderingContext.setTranslation(t.x, t.y, t.z);
    });
    this._renderingContextDialog.addEventListener('filter', options => {
        this._renderingContext.setFilter(options.filter);
    });

    this._mainDialog.addEventListener('rendererchange', this._handleRendererChange);
    this._mainDialog.addEventListener('tonemapperchange', this._handleToneMapperChange);
    this._mainDialog.trigger('rendererchange', this._mainDialog.getSelectedRenderer());
    this._mainDialog.trigger('tonemapperchange', this._mainDialog.getSelectedToneMapper());

    this._renderingContext.addEventListener('scaleChange', this._handleScaleChange);
    this._renderingContext.addEventListener('updateTFNumber', this._handleTFNumberChange);
    this._renderingContext.addEventListener("tfAcculumationGMChange", this._handleTFAccumulationGMChange);

    this._envmapLoadDialog.addEventListener('envRotation', this._handleEnvMapRotationChange);
    this._envmapLoadDialog.addEventListener('envOverride', this._handleEnvMapOverrideChange);
    this._envmapLoadDialog.addEventListener('envColorChange', this._handleEnvMapColorChange);
    this._envmapLoadDialog.addEventListener('envContribChange', this._handleEnvMapContributionChange);
}

_handleFileDrop(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length === 0) {
        return;
    }
    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.bvp')) {
        return;
    }
    this._handleVolumeLoad({
        type       : 'file',
        file       : file,
        filetype   : 'bvp',
        dimensions : { x: 0, y: 0, z: 0 }, // doesn't matter
        precision  : 8 // doesn't matter
    });
}

_handleRendererChange(which) {
    if (this._rendererDialog) {
        this._rendererDialog.destroy();
    }
    this._renderingContext.chooseRenderer(which);
    const renderer = this._renderingContext.getRenderer();
    const container = this._mainDialog.getRendererSettingsContainer();
    const dialogClass = this._getDialogForRenderer(which);
    this._rendererDialog = new dialogClass(renderer);
    this._rendererDialog.appendTo(container);
}

_handleTFAccumulationGMChange(o) {
    // console.log(o);
    this._rendererDialog._tfwidgets[o.idx]._canvas.style.backgroundImage = "none";
    this._rendererDialog._tfwidgets[o.idx]._canvas.style.backgroundImage = 'url('+o.imgData+')';
}

_handleToneMapperChange(which) {
    if (this._toneMapperDialog) {
        this._toneMapperDialog.destroy();
    }
    this._renderingContext.chooseToneMapper(which);
    const toneMapper = this._renderingContext.getToneMapper();
    const container = this._mainDialog.getToneMapperSettingsContainer();
    const dialogClass = this._getDialogForToneMapper(which);
    this._toneMapperDialog = new dialogClass(toneMapper);
    this._toneMapperDialog.appendTo(container);
}

_handleVolumeLoad(options) {
    if(this._sequenceWidgetDialog) {
        this._sequenceWidgetDialog.destroy();
    }
    if (options.type === 'file') {
        const readerClass = this._getReaderForFileType(options.filetype);
        if (readerClass) {
            const loader = new BlobLoader(options.file);
            const reader = new readerClass(loader, {
                width  : options.dimensions.x,
                height : options.dimensions.y,
                depth  : options.dimensions.z,
                bits   : options.precision
            });
            this._renderingContext.stopRendering();
            this._renderingContext.setVolumes(reader);
        }
    } else if (options.type === 'files') {
        const readerClass = this._getReaderForFileType(options.filetype);
        if (readerClass) {
            const loaders = [];
            options.files.forEach(file => {
                loaders.push(new BlobLoader(file));
            });

            const readers = [];
            loaders.forEach(loader => {
                readers.push(new readerClass(loader, {
                    width  : options.dimensions.x,
                    height : options.dimensions.y,
                    depth  : options.dimensions.z,
                    bits   : options.precision
                }));
            });

            this._sequenceWidgetDialog = new SequenceWidgetDialog(this._renderingContext, readers);
        }
    } else if (options.type === 'url') {
        const readerClass = this._getReaderForFileType(options.filetype);
        if (readerClass) {
            const loader = new AjaxLoader(options.url);
            const reader = new readerClass(loader);
            this._renderingContext.stopRendering();
            this._renderingContext.setVolume(reader);
        }
    }
}

_handleEnvmapLoad(options) {
    let image = new Image();
    image.crossOrigin = 'anonymous';
    image.addEventListener('load', () => {
        this._renderingContext.setEnvironmentMap(image);
        this._renderingContext.getRenderer().reset();
    });

    if (options.type === 'file') {
        let reader = new FileReader();
        reader.addEventListener('load', () => {
            image.src = reader.result;
        });
        reader.readAsDataURL(options.file);
    } else if (options.type === 'url') {
        image.src = options.url;
    }
}

_handleEnvMapRotationChange(rotation) {
    this._renderingContext._renderer._environmentRotationMatrix.identity();
    let mat = new Matrix();
    mat.fromRotationZ(rotation.z);
    this._renderingContext._renderer._environmentRotationMatrix.multiply(this._renderingContext._renderer._environmentRotationMatrix, mat);
    mat.fromRotationY(rotation.y);
    this._renderingContext._renderer._environmentRotationMatrix.multiply(this._renderingContext._renderer._environmentRotationMatrix, mat);
    mat.fromRotationX(rotation.x);
    this._renderingContext._renderer._environmentRotationMatrix.multiply(this._renderingContext._renderer._environmentRotationMatrix, mat);
    this._renderingContext._renderer.reset();
}

_handleEnvMapOverrideChange() {
    this._renderingContext._renderer._environmentTextureOverride = !this._renderingContext._renderer._environmentTextureOverride;
    this._renderingContext._renderer.reset();
}

_handleEnvMapColorChange(color) {
    this._renderingContext._renderer._environmentColor = color;
    this._renderingContext._renderer.reset();
}

_handleEnvMapContributionChange(value) {
    this._renderingContext._renderer._environmentContribution = value;
    this._renderingContext._renderer.reset();
}

_getReaderForFileType(type) {
    switch (type) {
        case 'bvp'  : return BVPReader;
        case 'raw'  : return RAWReader;
        case 'zip'  : return ZIPReader;
    }
}

_getDialogForRenderer(renderer) {
    switch (renderer) {
        case 'mip' : return MIPRendererDialog;
        case 'iso' : return ISORendererDialog;
        case 'eam' : return EAMRendererDialog;
        case 'mcs' : return MCSRendererDialog;
        case 'mcm' : return MCMRendererDialog;
        case 'mcc' : return MCMRendererDialog; // yes, the same
    }
}

_getDialogForToneMapper(toneMapper) {
    switch (toneMapper) {
        case 'range'    : return RangeToneMapperDialog;
        case 'reinhard' : return ReinhardToneMapperDialog;
        case 'artistic' : return ArtisticToneMapperDialog;
    }
}

_handleScaleChange(dimensions) {
    this._renderingContextDialog._binds.scale.setValue(dimensions);
    this._renderingContext.setScale(dimensions.x, dimensions.y, dimensions.z);
}

_handleTFNumberChange(numberOfChannels) {
    this._rendererDialog._updateTFWidgets(numberOfChannels);
}

}
