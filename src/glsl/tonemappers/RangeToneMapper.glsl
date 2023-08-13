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
const int N = 9;
uniform float kernel[N*N];

in vec2 vFragmentPosition;
out vec4 color;

void main(){
    vec2 size = vec2(textureSize(uTexture, 0));
    vec2 cellSize = 1.0 / size;
    float pol = floor(float(N)*0.5);
    for(int i=0; i<N; i++){
        for(int j=0; j<N; j++){
            color += 
                texture(uTexture, vFragmentPosition + cellSize * vec2(float(i)-pol, float(j)-pol)) *
                kernel[N*i + j];
            // color += vec4(kernel[N*i + j], 0.0, 0.0, 1.0);
        }
    }
}
