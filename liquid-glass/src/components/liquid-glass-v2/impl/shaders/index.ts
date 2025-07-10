/**
 * Shader Source Code Export Module
 * 
 * This module provides centralized access to all GLSL shader source code
 * used in the liquid glass multi-pass rendering pipeline.
 * 
 * Shader Pipeline Overview:
 * 1. Vertex Shader - Handles fullscreen quad positioning and UV mapping
 * 2. Fragment Background - Renders background with shadow effects
 * 3. Fragment VBlur - Applies vertical Gaussian blur to background
 * 4. Fragment HBlur - Applies horizontal Gaussian blur for complete blur
 * 5. Fragment Main - Composites glass effects with blur and background
 * 
 * Each shader is exported both as named and default exports for flexibility.
 * The shaders use GLSL 3.0 ES (WebGL2) for high-precision rendering.
 */

// Named exports for all shader source strings
export { vertexShader } from "./vertex";
export { fragmentBgShader } from "./fragment-bg";
export { fragmentBgVblurShader } from "./fragment-bg-vblur";
export { fragmentBgHblurShader } from "./fragment-bg-hblur";
export { fragmentMainShader } from "./fragment-main";

// Default exports for convenience in multi-pass renderer
export { default as VertexShader } from "./vertex";
export { default as FragmentBgShader } from "./fragment-bg";
export { default as FragmentBgVblurShader } from "./fragment-bg-vblur";
export { default as FragmentBgHblurShader } from "./fragment-bg-hblur";
export { default as FragmentMainShader } from "./fragment-main";
