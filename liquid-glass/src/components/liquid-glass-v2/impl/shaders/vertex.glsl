/*
 * Vertex Shader for Fullscreen Quad Rendering
 * 
 * This vertex shader handles the positioning and UV coordinate generation
 * for fullscreen quad rendering used in all passes of the liquid glass
 * multi-pass rendering pipeline.
 * 
 * Key features:
 * - Converts normalized device coordinates (-1 to 1) to UV coordinates (0 to 1)
 * - No matrix transformations needed (quad already in clip space)
 * - Optimized for post-processing and effects rendering
 * - Shared across all rendering passes for consistency
 * 
 * Input vertices form a triangle strip covering the entire screen:
 * (-1,-1), (1,-1), (-1,1), (1,1)
 * 
 * UV mapping ensures proper texture coordinate generation:
 * Bottom-left (-1,-1) -> UV (0,0)
 * Top-right (1,1) -> UV (1,1)
 */

#version 300 es

// Input vertex position in normalized device coordinates
in vec4 a_position;

// Output UV coordinates for fragment shader texture sampling
out vec2 v_uv;

void main() {
  // Convert NDC (-1 to 1) to UV coordinates (0 to 1)
  // This transformation ensures proper texture mapping
  v_uv = (a_position.xy + 1.0) * 0.5;
  
  // Pass position directly to clip space (no transformation needed)
  gl_Position = a_position;
}
