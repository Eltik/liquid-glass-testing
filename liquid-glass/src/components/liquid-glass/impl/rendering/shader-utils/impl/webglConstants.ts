/**
 * WebGL shader source constants for liquid glass effects
 */

// Vertex shader - simple pass-through
export const VERTEX_SHADER = `
precision mediump float;
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
}
`;

// Optimized fragment shader with consolidated displacement and chromatic aberration
export const FRAGMENT_SHADER = `
precision mediump float;
varying vec2 v_texCoord;

// Source texture (the content being displaced)
uniform sampler2D u_sourceTexture;
// Merged displacement texture containing all modes
uniform sampler2D u_mergedDisplacementMap;
// Control uniforms
uniform float u_mode; // 0.0=standard, 1.0=polar, 2.0=prominent
uniform float u_displacementScale;
uniform float u_aberrationIntensity;

void main() {
    vec2 uv = v_texCoord;
    
    // Sample from merged displacement map based on mode
    // Texture layout: [Standard | Polar | Prominent] horizontally
    float modeOffset = floor(u_mode + 0.5) / 3.0; // 0.0, 0.33, 0.66
    vec2 sampleUV = vec2(uv.x / 3.0 + modeOffset, uv.y);
    
    // Sample the pre-computed displacement
    vec2 displacement = texture2D(u_mergedDisplacementMap, sampleUV).xy;
    displacement = (displacement - 0.5) * u_displacementScale;
    
    // Single-pass chromatic aberration with displacement
    vec2 redUV = uv + displacement + vec2(u_aberrationIntensity * 0.002, u_aberrationIntensity * 0.001);
    vec2 greenUV = uv + displacement;
    vec2 blueUV = uv + displacement - vec2(u_aberrationIntensity * 0.002, u_aberrationIntensity * 0.001);
    
    // Sample RGB channels with different UVs for chromatic aberration
    float r = texture2D(u_sourceTexture, redUV).r;
    float g = texture2D(u_sourceTexture, greenUV).g;
    float b = texture2D(u_sourceTexture, blueUV).b;
    float a = texture2D(u_sourceTexture, greenUV).a;
    
    gl_FragColor = vec4(r, g, b, a);
}
`;
