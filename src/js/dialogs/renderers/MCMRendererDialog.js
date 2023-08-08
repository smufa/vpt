// #package js/main

// #include ../AbstractDialog.js
// #include ../../TransferFunctionWidget.js

// #include ../../../uispecs/renderers/MCMRendererDialog.json

// #include ../../ui

class MCMRendererDialog extends AbstractDialog {

constructor(renderer, options) {
    super(UISPECS.MCMRendererDialog, options);

    this._renderer = renderer;

    this._handleChange = this._handleChange.bind(this);
    this._handleTFChange = this._handleTFChange.bind(this);

    this._binds.extinction.addEventListener('input', this._handleChange);
    this._binds.albedo.addEventListener('change', this._handleChange);
    this._binds.bias.addEventListener('change', this._handleChange);
    this._binds.ratio.addEventListener('change', this._handleChange);
    this._binds.bounces.addEventListener('input', this._handleChange);
    this._binds.steps.addEventListener('input', this._handleChange);
    this._binds.minCutPlanes.addEventListener("input", this._handleChange);
    this._binds.maxCutPlanes.addEventListener("input", this._handleChange);
    this._binds.viewCutDistance.addEventListener('input', this._handleChange);
    this._binds.maxContribution.addEventListener('change', this._handleChange);
    this._binds.origData.addEventListener('change', this._handleChange);
    this._binds.origVsSeg.addEventListener('change', this._handleChange);
    this._binds.bilateral.addEventListener('change', this._handleChange);
    this._binds.bilateralGradient.addEventListener('change', this._handleChange);
    this._binds.bilateralSigma.addEventListener('input', this._handleChange);
    this._binds.bilateralBSigma.addEventListener('input', this._handleChange);
    this._binds.bilateralMSize.addEventListener('input', this._handleChange);

    this._tfwidgets = [];
    for (let i = 0; i < 4; i++) {
        this._tfwidgets[i] = new TransferFunctionWidget();
        let panel = new Panel();
        panel.add(this._tfwidgets[i]);
        this._binds.tftabs.add(""+i, panel);
        this._tfwidgets[i].addEventListener('change', () => {this._handleTFChange(i)});
        if (i == 0) {
            this._tfwidgets[i].loadFromJson(JSON.parse('[{"position":{"x":1,"y":0.4609375},"size":{"x":0.5889359102131049,"y":5.106744349470309},"color":{"r":1,"g":0,"b":0,"a":1}}]'));
        } else if (i == 1) {
            this._tfwidgets[i].loadFromJson(JSON.parse('[{"position":{"x":1,"y":0.51953125},"size":{"x":0.5889359102131049,"y":15.037725658404618},"color":{"r":0,"g":1,"b":0,"a":1}}]'));
        } else if (i == 2) {
            this._tfwidgets[i].loadFromJson(JSON.parse('[{"position":{"x":1,"y":0.51953125},"size":{"x":0.5889359102131049,"y":1.7342275316926914},"color":{"r":0,"g":0,"b":1,"a":1}}]'));
        }
    }
}

destroy() {
    if (this._tfwidget)
        this._tfwidget.destroy();
    super.destroy();
}

_updateTFWidgets(number) {
    for (let i = 1; i <= 4; i++) {
        if (i <= number)
            this._binds.tftabs._binds.headers.children[i].hidden = false;
        else
            this._binds.tftabs._binds.headers.children[i].hidden = true;
    }
}

_handleChange() {
    const extinction = this._binds.extinction.getValue();
    const albedo     = this._binds.albedo.getValue();
    const bias       = this._binds.bias.getValue();
    const ratio      = this._binds.ratio.getValue();
    const bounces    = this._binds.bounces.getValue();
    const steps      = this._binds.steps.getValue();
    const minCutPlaneValues = this._binds.minCutPlanes.getValue();
    const maxCutPlaneValues = this._binds.maxCutPlanes.getValue();
    const viewCutDistance   = this._binds.viewCutDistance.getValue();
    const maxContrib = this._binds.maxContribution.checked;
    const origData   = this._binds.origData.checked;
    const origVsSeg  = this._binds.origVsSeg.getValue();
    const bilateral  = this._binds.bilateral.checked;
    const bilateralGradient  = this._binds.bilateralGradient.checked;
    const bilateralSigma      = this._binds.bilateralSigma.getValue();
    const bilateralBSigma     = this._binds.bilateralBSigma.getValue();
    const bilateralMSize      = this._binds.bilateralMSize.getValue();

    this._renderer.absorptionCoefficient = extinction * (1 - albedo);
    this._renderer.scatteringCoefficient = extinction * albedo;
    this._renderer.scatteringBias = bias;
    this._renderer.majorant = extinction * ratio;
    this._renderer.maxBounces = bounces;
    this._renderer.steps = steps;
    this._renderer.minCutPlaneValues = minCutPlaneValues;
    this._renderer.maxCutPlaneValues = maxCutPlaneValues;
    this._renderer.viewCutDistance = viewCutDistance;
    this._renderer.maxContribution = maxContrib;
    this._renderer.origData = origData;
    this._renderer.origVsSeg = origVsSeg;
    this._renderer.bilateral = bilateral;
    this._renderer.bilateralGradient = bilateralGradient;
    this._renderer.bilateralSigma = bilateralSigma;
    this._renderer.bilateralBSigma = bilateralBSigma;
    this._renderer.bilateralMSize = bilateralMSize;

    this._renderer.reset();
}

_handleTFChange(id) {
    this._renderer.setTransferFunction(this._tfwidgets[id].getTransferFunction(), id);

    //this._renderer._channelContributions.x = this._tfwidgets[0]._channelContribution;
    //this._renderer._channelContributions.y = this._tfwidgets[1]._channelContribution;
    //this._renderer._channelContributions.z = this._tfwidgets[2]._channelContribution;
    //this._renderer._channelContributions.w = this._tfwidgets[3]._channelContribution;

    this._renderer.reset();
}

_handleScaleChange(dimensions) {
    this._binds.scale.setValue(new Vector(dimensions.x, dimensions.y, dimensions.z));
}

}
