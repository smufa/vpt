// #package js/main

// #include AbstractDialog.js

// #include ../../uispecs/VolumeLoadDialog.json

class VolumeLoadDialog extends AbstractDialog {

constructor(options) {
    super(UISPECS.VolumeLoadDialog, options);

    this._handleTypeChange = this._handleTypeChange.bind(this);
    this._handleLoadClick = this._handleLoadClick.bind(this);
    this._handleFileChange = this._handleFileChange.bind(this);
    this._handleFilesChange = this._handleFilesChange.bind(this);
    this._handleURLChange = this._handleURLChange.bind(this);
    this._handleDemoChange = this._handleDemoChange.bind(this);

    this._demos = [];

    this._addEventListeners();
    this._loadDemoJson();
}

_addEventListeners() {
    this._binds.type.addEventListener('change', this._handleTypeChange);
    this._binds.loadButton.addEventListener('click', this._handleLoadClick);
    this._binds.file.addEventListener('change', this._handleFileChange);
    this._binds.files.addEventListener('change', this._handleFilesChange);
    this._binds.url.addEventListener('input', this._handleURLChange);
    this._binds.demo.addEventListener('change', this._handleDemoChange);
}

_loadDemoJson() {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
            this._demos = JSON.parse(xhr.responseText);
            this._demos.forEach(demo => {
                this._binds.demo.addOption(demo.value, demo.label);
            });
        }
    });
    xhr.open('GET', 'demo-volumes.json');
    xhr.send();
}

_getVolumeTypeFromURL(filename) {
    const exn = filename.split('.').pop().toLowerCase();
    const exnToType = {
        'bvp'  : 'bvp',
        'json' : 'json',
        'zip'  : 'zip',
    };
    return exnToType[exn] || 'raw';
}

_handleLoadClick() {
    switch (this._binds.type.getValue()) {
        case 'file'         : this._handleLoadFile(); break;
        case 'fileSequence' : this._handleLoadFiles(); break;
        case 'url'          : this._handleLoadURL();  break;
        case 'demo'         : this._handleLoadDemo(); break;
    }
}

_handleLoadFile() {
    const files = this._binds.file.getFiles();
    if (files.length === 0) {
        // update status bar?
        return;
    }

    const file = files[0];
    const filetype = this._getVolumeTypeFromURL(file.name);
    const dimensions = this._binds.dimensions.getValue();
    const precision = parseInt(this._binds.precision.getValue(), 10);

    this.trigger('load', {
        type       : 'file',
        file       : file,
        filetype   : filetype,
        dimensions : dimensions,
        precision  : precision,
    });
}

_handleLoadFiles() {
    const files = this._binds.files.getFilesArray();
    if (files.length === 0) {
        return;
    }

    const filetype = this._getVolumeTypeFromURL(files[0].name);
    const dimensions = this._binds.dimensionsSequence.getValue();
    const precision = parseInt(this._binds.precisionSequence.getValue(), 10);

    this.trigger('load', {
        type       : 'files',
        files      : files,
        filetype   : filetype,
        dimensions : dimensions,
        precision  : precision,
    });
}

_handleLoadURL() {
    const url = this._binds.url.getValue();
    const filetype = this._getVolumeTypeFromURL(url);
    this.trigger('load', {
        type     : 'url',
        url      : url,
        filetype : filetype
    });
}

_handleLoadDemo() {
    const demo = this._binds.demo.getValue();
    const found = this._demos.find(d => d.value === demo);
    const filetype = this._getVolumeTypeFromURL(found.url);
    this.trigger('load', {
        type     : 'url',
        url      : found.url,
        filetype : filetype
    });
}

_handleTypeChange() {
    // TODO: switching panel
    switch (this._binds.type.getValue()) {
        case 'fileSequence':
            this._binds.filePanel.hide();
            this._binds.fileSequencePanel.show();
            this._binds.urlPanel.hide();
            this._binds.demoPanel.hide();
            break;
        case 'file':
            this._binds.filePanel.show();
            this._binds.fileSequencePanel.hide();
            this._binds.urlPanel.hide();
            this._binds.demoPanel.hide();
            break;
        case 'url':
            this._binds.filePanel.hide();
            this._binds.fileSequencePanel.hide();
            this._binds.urlPanel.show();
            this._binds.demoPanel.hide();
            break;
        case 'demo':
            this._binds.filePanel.hide();
            this._binds.fileSequencePanel.hide();
            this._binds.urlPanel.hide();
            this._binds.demoPanel.show();
            break;
    }
    this._updateLoadButtonAndProgressVisibility();
}

_handleFileChange() {
    const files = this._binds.file.getFiles();
    if (files.length === 0) {
        this._binds.rawSettingsPanel.hide();
    } else {
        const file = files[0];
        const type = this._getVolumeTypeFromURL(file.name);
        this._binds.rawSettingsPanel.setVisible(type === 'raw');
    }
    this._updateLoadButtonAndProgressVisibility();
}

_handleFilesChange() {
    const files = this._binds.files.getFilesArray();
    if (files.length === 0) {
        this._binds.rawSettingsPanel.hide();
    } else {
        const types = files.map(file => this._getVolumeTypeFromURL(file.name));
        //Check if all types are raw
        this._binds.rawSettingsSequencePanel.setVisible(types.every(type => type === "raw"));
    }
    this._updateLoadButtonAndProgressVisibility();
}

_handleURLChange() {
    this._updateLoadButtonAndProgressVisibility();
}

_handleDemoChange() {
    this._updateLoadButtonAndProgressVisibility();
}

_updateLoadButtonAndProgressVisibility() {
    switch (this._binds.type.getValue()) {
        case 'file':
            var files = this._binds.file.getFiles();
            this._binds.loadButtonAndProgress.setVisible(files.length > 0);
            break;
        case 'fileSequence':
            var files = this._binds.files.getFilesArray();
            const types = files.map(file => this._getVolumeTypeFromURL(file.name));
            //Check if all types are same
            this._binds.loadButtonAndProgress.setVisible(files.length > 0 && types.every(type => type === types[0]));
            break;
        case 'url':
            const urlEmpty = this._binds.url.getValue() === '';
            this._binds.loadButtonAndProgress.setVisible(!urlEmpty);
            break;
        case 'demo':
            const demo = this._binds.demo.getValue();
            this._binds.loadButtonAndProgress.setVisible(!!demo);
            break;
    }
}

}
