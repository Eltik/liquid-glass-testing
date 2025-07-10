/**
 * Fragment Shader for Horizontal Gaussian Blur Pass
 * 
 * This shader completes the separable Gaussian blur by applying blur in the
 * horizontal direction to the already vertically-blurred input. This two-pass
 * approach is significantly more efficient than a single 2D blur pass.
 * 
 * Performance benefits of separable blur:
 * - Single-pass 2D blur: O(r²) samples per pixel
 * - Two-pass separable blur: O(2r) samples per pixel
 * - For r=40: 1600 vs 80 samples - 20x performance improvement!
 * 
 * Key features:
 * - Uses identical algorithm to vertical pass, but samples horizontally
 * - Preserves all the quality of a true 2D Gaussian blur
 * - Uses the same precomputed weights as the vertical pass
 * - Outputs the final blurred background for use in glass effects
 * 
 * The result is a high-quality, efficient blur that serves as the foundation
 * for realistic glass refraction and background defocus effects.
 */

export const fragmentBgHblurShader = `#version 300 es

// Use high precision for accurate color accumulation
precision highp float;

// Maximum supported blur radius - must match vertical blur shader
#define MAX_BLUR_RADIUS (200)

// Input UV coordinates from vertex shader
in vec2 v_uv;

// Uniforms for blur operation (identical to vertical pass)
uniform sampler2D u_prevPassTexture;           // Input from vertical blur pass
uniform vec2 u_resolution;                     // Texture resolution for texel calculation
uniform int u_blurRadius;                      // Active blur radius (≤ MAX_BLUR_RADIUS)
uniform float u_blurWeights[MAX_BLUR_RADIUS + 1]; // Precomputed Gaussian weights

// Output color - final blurred background
out vec4 fragColor;

/**
 * Main horizontal blur function
 * 
 * Completes the 2D Gaussian blur by blurring the vertically-blurred input
 * in the horizontal direction. Uses identical algorithm to vertical pass
 * but samples left/right instead of up/down.
 */
void main() {
  // Calculate texel size for precise sampling
  vec2 texelSize = 1.0 / u_resolution;
  
  // Start with center pixel weighted by center Gaussian weight
  vec4 color = texture(u_prevPassTexture, v_uv) * u_blurWeights[0];
  
  // Sample symmetric pairs of pixels horizontally
  // Each iteration samples one pixel left and one right of center
  for (int i = 1; i <= u_blurRadius; ++i) {
    float w = u_blurWeights[i];  // Gaussian weight for this distance
    
    // Calculate horizontal offset for this sample distance
    vec2 offset = vec2(float(i), 0.0) * texelSize;
    
    // Sample pixels left and right of center, applying Gaussian weights
    color += texture(u_prevPassTexture, v_uv + offset) * w;  // Right
    color += texture(u_prevPassTexture, v_uv - offset) * w;  // Left
  }
  
  fragColor = color;
}
`;

export default fragmentBgHblurShader;
