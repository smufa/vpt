// #package js/main

// #include ../AbstractDialog.js

// #include ../../../uispecs/tonemappers/RangeToneMapperDialog.json

class RangeToneMapperDialog extends AbstractDialog {

constructor(toneMapper, options) {
    super(UISPECS.RangeToneMapperDialog, options);

    this._toneMapper = toneMapper;

    this._handleChange = this._handleChange.bind(this);

    this._binds.low.addEventListener('input', this._handleChange);
    this._binds.color.addEventListener('input', this._handleChange);
}

_handleChange() {
    this._toneMapper._min = this._binds.low.getValue();
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(this._binds.color.getValue());
    this._toneMapper._color = result ? [
        parseInt(result[1], 16)/255.0,
        parseInt(result[2], 16)/255.0,
        parseInt(result[3], 16)/255.0
     ] : null;
}

}
