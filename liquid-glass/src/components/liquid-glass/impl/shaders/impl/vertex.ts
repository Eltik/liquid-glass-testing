/**
 * Vertex Shader for Fullscreen Quad Rendering
 * 
 * This vertex shader is used for all passes in the multi-pass rendering pipeline.
 * It processes a simple fullscreen quad with vertices at (-1,-1), (1,-1), (-1,1), (1,1)
 * in normalized device coordinates.
 * 
 * Key features:
 * - Converts normalized device coordinates to UV coordinates (0-1 range)
 * - Passes position directly to gl_Position (no transformation needed)
 * - Generates UV coordinates for texture sampling in fragment shaders
 * 
 * The UV mapping:
 * - (-1,-1) NDC -> (0,0) UV (bottom-left)
 * - (1,-1) NDC -> (1,0) UV (bottom-right)
 * - (-1,1) NDC -> (0,1) UV (top-left)
 * - (1,1) NDC -> (1,1) UV (top-right)
 * 
 * This shader is shared across all rendering passes for consistency and efficiency.
 */

export const vertexShader = `#version 300 es

// Input vertex position in normalized device coordinates
in vec4 a_position;

// Output UV coordinates for fragment shader texture sampling
out vec2 v_uv;

void main() {
  // Convert from NDC (-1 to 1) to UV coordinates (0 to 1)
  // This mapping ensures proper texture coordinate generation
  v_uv = (a_position.xy + 1.0) * 0.5;
  
  // Pass position directly to clip space
  // No transformation needed since input is already in NDC
  gl_Position = a_position;
}
`;

export default vertexShader;
