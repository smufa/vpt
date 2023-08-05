// #package glsl/shaders

// #section RangeToneMapper/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;
out vec2 vFragmentPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vFragmentPosition = (aPosition + vec2(1.0, 1.0)) * 0.5;
}

// #section RangeToneMapper/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;
uniform float uMin;
uniform vec3 backgroundColor;

in vec2 vFragmentPosition;
out vec4 color;

void main(){
    mat3 kernel = mat3(0.11,0.11,0.11,
                       0.11,0.11,0.11,
                       0.11,0.11,0.11);
    vec2 size = vec2(textureSize(uTexture, 0));
    vec2 cellSize = 1.0 / size;
    for(int i=-1; i<=1; i++){
        for(int j=-1; j<=1; j++){
            vec2 vec = cellSize * vec2(float(i), float(j));
            color += 
                texture(uTexture, vFragmentPosition + vec) *
                kernel[i][j];
        }
    }
    color[3] = 1.0; //alpha correction
}
