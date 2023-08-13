// #package js/main

// #include ../WebGL.js
// #include AbstractToneMapper.js

class RangeToneMapper extends AbstractToneMapper {

constructor(gl, texture, options) {
    super(gl, texture, options);

    Object.assign(this, {
        _min : 3,
        _color: [1,1,1]
    }, options);

    this._program = WebGL.buildPrograms(this._gl, {
        RangeToneMapper : SHADERS.RangeToneMapper
    }, MIXINS).RangeToneMapper;
    let N = 9;
    //this._kernel = Array(N*N).fill(1/(N*N));
    this._kernel = [0, 0, 3, 2,     2,   2, 3, 0, 0,
                    0, 2, 3, 5,     5,   5, 3, 2, 0,
                    3, 3, 5, 3,     0,   3, 5, 3, 3,
                    2, 5, 3, -12, -23, -12, 3, 5, 2,
                    2, 5, 0, -23, -40, -23, 0, 5, 2,
                    2, 5, 3, -12, -23, -12, 3, 5, 2,
                    3, 3, 5, 3,     0,   3, 5, 3, 3,
                    0, 2, 3, 5,     5,   5, 3, 2, 0,
                    0, 0, 3, 2,     2,   2, 3, 0, 0
                ];

    this._arrayLoc = gl.getUniformLocation(this._program.program, "kernel");
}

destroy() {
    const gl = this._gl;
    gl.deleteProgram(this._program.program);

    super.destroy();
}

_renderFrame() {
    const gl = this._gl;

    const program = this._program;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._texture);

    gl.uniform1i(program.uniforms.uTexture, 0);
    gl.uniform1f(program.uniforms.uMin, this._min);
    gl.uniform1fv(this._arrayLoc, this._kernel);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

}
