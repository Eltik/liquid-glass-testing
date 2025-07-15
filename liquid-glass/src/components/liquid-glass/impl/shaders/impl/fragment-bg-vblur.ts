/**
 * Fragment Shader for Vertical Gaussian Blur Pass
 * 
 * This shader performs the first stage of a separable Gaussian blur by
 * applying blur in the vertical direction only. Separable blur is a key
 * optimization that reduces complexity from O(r²) to O(r) where r is
 * the blur radius.
 * 
 * Key features:
 * - Uses precomputed Gaussian weights for optimal performance
 * - Samples symmetrically around each pixel (center + positive/negative offsets)
 * - High precision arithmetic for accurate color accumulation
 * - Efficient loop structure optimized for GPU execution
 * 
 * The blur uses the standard Gaussian distribution formula but with
 * weights precomputed on the CPU to avoid expensive math operations
 * in the fragment shader.
 * 
 * This pass outputs a vertically blurred image that serves as input
 * to the horizontal blur pass, completing the 2D Gaussian blur effect.
 */

export const fragmentBgVblurShader = `#version 300 es

// Use high precision for accurate color accumulation
precision highp float;

// Maximum supported blur radius - can be adjusted based on performance needs
#define MAX_BLUR_RADIUS (200)

// Input UV coordinates from vertex shader
in vec2 v_uv;

// Uniforms for blur operation
uniform sampler2D u_prevPassTexture;           // Input texture from background pass
uniform vec2 u_resolution;                     // Texture resolution for texel calculation
uniform int u_blurRadius;                      // Active blur radius (≤ MAX_BLUR_RADIUS)
uniform float u_blurWeights[MAX_BLUR_RADIUS + 1]; // Precomputed Gaussian weights

// Output color
out vec4 fragColor;

/**
 * Main vertical blur function
 * 
 * Implements Gaussian blur in the vertical direction using precomputed weights.
 * The algorithm samples the center pixel plus symmetric pairs of pixels above
 * and below, weighting each sample according to the Gaussian distribution.
 */
void main() {
  // Calculate texel size for precise sampling
  vec2 texelSize = 1.0 / u_resolution;
  
  // Start with center pixel weighted by center Gaussian weight
  vec4 color = texture(u_prevPassTexture, v_uv) * u_blurWeights[0];
  
  // Sample symmetric pairs of pixels vertically
  // Each iteration samples one pixel above and one below the center
  for (int i = 1; i <= u_blurRadius; ++i) {
    float w = u_blurWeights[i];  // Gaussian weight for this distance
    
    // Calculate vertical offset for this sample distance
    vec2 offset = vec2(0.0, float(i)) * texelSize;
    
    // Sample pixels above and below center, applying Gaussian weights
    color += texture(u_prevPassTexture, v_uv + offset) * w;  // Above
    color += texture(u_prevPassTexture, v_uv - offset) * w;  // Below
  }
  
  fragColor = color;
}
`;

export default fragmentBgVblurShader;
