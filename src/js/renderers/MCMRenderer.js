// #package js/main

// #include ../WebGL.js
// #include AbstractRenderer.js

class MCMRenderer extends AbstractRenderer {

constructor(gl, volume, environmentTexture, options) {
    super(gl, volume, environmentTexture, options);

    this._channelContributions = new Vector(1.0, 1.0, 1.0, 1.0);

    this._transferFunctions = [];

    this._transferFunctions[0] = WebGL.createTexture(gl, {
        width  : 2,
        height : 1,
        data   : new Uint8Array([255, 0, 0, 0, 255, 0, 0, 255]),
        wrapS  : gl.CLAMP_TO_EDGE,
        wrapT  : gl.CLAMP_TO_EDGE,
        min    : gl.LINEAR,
        mag    : gl.LINEAR
    });

    this._transferFunctions[1] = WebGL.createTexture(gl, {
        width  : 2,
        height : 1,
        data   : new Uint8Array([255, 0, 0, 0, 255, 0, 0, 255]),
        wrapS  : gl.CLAMP_TO_EDGE,
        wrapT  : gl.CLAMP_TO_EDGE,
        min    : gl.LINEAR,
        mag    : gl.LINEAR
    });

    this._transferFunctions[2] = WebGL.createTexture(gl, {
        width  : 2,
        height : 1,
        data   : new Uint8Array([255, 0, 0, 0, 255, 0, 0, 255]),
        wrapS  : gl.CLAMP_TO_EDGE,
        wrapT  : gl.CLAMP_TO_EDGE,
        min    : gl.LINEAR,
        mag    : gl.LINEAR
    });

    this._transferFunctions[3] = WebGL.createTexture(gl, {
        width  : 2,
        height : 1,
        data   : new Uint8Array([255, 0, 0, 0, 255, 0, 0, 255]),
        wrapS  : gl.CLAMP_TO_EDGE,
        wrapT  : gl.CLAMP_TO_EDGE,
        min    : gl.LINEAR,
        mag    : gl.LINEAR
    });

    Object.assign(this, {
        absorptionCoefficient : 1,
        scatteringCoefficient : 1,
        scatteringBias        : 0,
        majorant              : 2,
        maxBounces            : 8,
        steps                 : 1,
        maxContribution       : false,
        origData              : false,
        origVsSeg             : 0.5,
        minCutPlaneValues     : new Vector(0,0,0),
        maxCutPlaneValues     : new Vector(1,1,1),
        viewCutDistance       : 0,
        bilateral             : false,
        bilateralGradient     : false,
        bilateralSigma        : 10,
        bilateralBSigma       : 0.1,
        bilateralMSize        : 15
    }, options);

    this._programs = WebGL.buildPrograms(gl, {
        generate  : SHADERS.MCMGenerate,
        integrate : SHADERS.MCMIntegrate,
        render    : SHADERS.MCMRender,
        reset     : SHADERS.MCMReset
    }, MIXINS);
}

destroy() {
    const gl = this._gl;
    Object.keys(this._programs).forEach(programName => {
        gl.deleteProgram(this._programs[programName].program);
    });

    super.destroy();
}

_resetFrame() {
    const gl = this._gl;

    const program = this._programs.reset;
    gl.useProgram(program.program);

    gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);
    gl.uniform2f(program.uniforms.uInverseResolution, 1 / this._bufferSize, 1 / this._bufferSize);
    gl.uniform1f(program.uniforms.uRandSeed, Math.random());
    gl.uniform1f(program.uniforms.uBlur, 0);

    gl.uniform3f(program.uniforms.uMinCutPlaneValues, this.minCutPlaneValues.x, this.minCutPlaneValues.y, this.minCutPlaneValues.z);
    gl.uniform3f(program.uniforms.uMaxCutPlaneValues, this.maxCutPlaneValues.x, this.maxCutPlaneValues.y, this.maxCutPlaneValues.z);
    gl.uniform1f(program.uniforms.uViewCutDistance, this.viewCutDistance);

    gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1,
        gl.COLOR_ATTACHMENT2,
        gl.COLOR_ATTACHMENT3
    ]);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

_generateFrame() {
}

_integrateFrame() {
    const gl = this._gl;

    const program = this._programs.integrate;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[1]);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[2]);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[3]);

    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, this._environmentTexture);

    if (this._volumes[0] != null) {
        gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, this._transferFunctions[0]);
        gl.activeTexture(gl.TEXTURE6);
        gl.bindTexture(gl.TEXTURE_3D, this._volumes[0].getTexture());
    }

    if (this._volumes[1] != null && this._numberOfChannels > 1) {
        gl.activeTexture(gl.TEXTURE7);
        gl.bindTexture(gl.TEXTURE_2D, this._transferFunctions[1]);
        gl.activeTexture(gl.TEXTURE8);
        gl.bindTexture(gl.TEXTURE_3D, this._volumes[1].getTexture());
    }
    if (this._volumes[2] != null && this._numberOfChannels > 2) {
        gl.activeTexture(gl.TEXTURE9);
        gl.bindTexture(gl.TEXTURE_2D, this._transferFunctions[2]);
        gl.activeTexture(gl.TEXTURE10);
        gl.bindTexture(gl.TEXTURE_3D, this._volumes[2].getTexture());
    }
    if (this._volumes[3] != null && this._numberOfChannels > 3) {
        gl.activeTexture(gl.TEXTURE11);
        gl.bindTexture(gl.TEXTURE_2D, this._transferFunctions[3]);
        gl.activeTexture(gl.TEXTURE12);
        gl.bindTexture(gl.TEXTURE_3D, this._volumes[3].getTexture());
    }

    gl.uniform1i(program.uniforms.uPosition, 0);
    gl.uniform1i(program.uniforms.uDirection, 1);
    gl.uniform1i(program.uniforms.uTransmittance, 2);
    gl.uniform1i(program.uniforms.uRadiance, 3);

    gl.uniform1i(program.uniforms.uEnvironment, 4);

    gl.uniform1i(program.uniforms.uTransferFunction0, 5);
    gl.uniform1i(program.uniforms.uVolume0, 6);

    gl.uniform1i(program.uniforms.uTransferFunction1, 7);
    gl.uniform1i(program.uniforms.uVolume1, 8);

    gl.uniform1i(program.uniforms.uTransferFunction2, 9);
    gl.uniform1i(program.uniforms.uVolume2, 10);

    gl.uniform1i(program.uniforms.uTransferFunction3, 11);
    gl.uniform1i(program.uniforms.uVolume3, 12);

    gl.uniform1i(program.uniforms.uNumberOfChannels, this._numberOfChannels);
    gl.uniform4f(program.uniforms.uChannelContributions, this._channelContributions.x, this._channelContributions.y, this._channelContributions.z, this._channelContributions.w);

    gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);
    gl.uniform2f(program.uniforms.uInverseResolution, 1 / this._bufferSize, 1 / this._bufferSize);
    gl.uniform1f(program.uniforms.uRandSeed, Math.random());
    gl.uniform1f(program.uniforms.uBlur, 0);

    gl.uniform1f(program.uniforms.uAbsorptionCoefficient, this.absorptionCoefficient);
    gl.uniform1f(program.uniforms.uScatteringCoefficient, this.scatteringCoefficient);
    gl.uniform1f(program.uniforms.uScatteringBias, this.scatteringBias);
    gl.uniform1f(program.uniforms.uMajorant, this.majorant);
    gl.uniform1ui(program.uniforms.uMaxBounces, this.maxBounces);
    gl.uniform1ui(program.uniforms.uSteps, this.steps);
    gl.uniform1i(program.uniforms.uMaxContribution, this.maxContribution);
    gl.uniform1i(program.uniforms.uOrigData, this.origData);
    gl.uniform1f(program.uniforms.uOrigVsSeg, this.origVsSeg);

    gl.uniform3f(program.uniforms.uMinCutPlaneValues, this.minCutPlaneValues.x, this.minCutPlaneValues.y, this.minCutPlaneValues.z);
    gl.uniform3f(program.uniforms.uMaxCutPlaneValues, this.maxCutPlaneValues.x, this.maxCutPlaneValues.y, this.maxCutPlaneValues.z);
    gl.uniform1f(program.uniforms.uViewCutDistance, this.viewCutDistance);

    gl.uniformMatrix4fv(program.uniforms.uEnvironmentRotationMatrix, false, this._environmentRotationMatrix.m);
    gl.uniform1i(program.uniforms.uEnvironmentTextureOverride, this._environmentTextureOverride);
    gl.uniform3f(program.uniforms.uEnvironmentColor, this._environmentColor.r, this._environmentColor.g, this._environmentColor.b);
    gl.uniform1f(program.uniforms.uEnvironmentContribution, this._environmentContribution);

    gl.uniform1i(program.uniforms.uBilateral, this.bilateral);
    gl.uniform1i(program.uniforms.uBilateralGradient, this.bilateralGradient);
    gl.uniform1f(program.uniforms.uBilateralSIGMA, this.bilateralSigma);
    gl.uniform1f(program.uniforms.uBilateralBSIGMA, this.bilateralBSigma);
    gl.uniform1i(program.uniforms.uBilateralMSIZE, this.bilateralMSize);

    gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1,
        gl.COLOR_ATTACHMENT2,
        gl.COLOR_ATTACHMENT3
    ]);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

_renderFrame() {
    const gl = this._gl;

    const program = this._programs.render;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[3]);

    gl.uniform1i(program.uniforms.uColor, 0);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

_getFrameBufferSpec() {
    const gl = this._gl;
    return [{
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    }];
}

_getAccumulationBufferSpec() {
    const gl = this._gl;

    const positionBufferSpec = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    };

    const directionBufferSpec = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    };

    const transmittanceBufferSpec = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    };

    const radianceBufferSpec = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    };

    return [
        positionBufferSpec,
        directionBufferSpec,
        transmittanceBufferSpec,
        radianceBufferSpec
    ];
}

setTransferFunction(transferFunction, id) {
    const gl = this._gl;
    gl.bindTexture(gl.TEXTURE_2D, this._transferFunctions[id]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, transferFunction);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

}
