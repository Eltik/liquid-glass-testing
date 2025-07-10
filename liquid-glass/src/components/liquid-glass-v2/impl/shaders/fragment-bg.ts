/**
 * Fragment Shader for Background Rendering Pass
 * 
 * This shader is the first pass in the multi-pass liquid glass pipeline.
 * It renders the background scene with shadow effects that anticipate the
 * glass shape placement.
 * 
 * Key responsibilities:
 * - Render background content (textures, patterns, or solid colors)
 * - Generate soft shadows beneath glass shapes using SDFs
 * - Handle different background types with proper aspect ratio preservation
 * - Provide clean base layer for subsequent blur and glass effect passes
 * 
 * Background types supported:
 * - Type 0: Chessboard pattern for testing
 * - Type 1: Quadrant-based pattern testing
 * - Type 2: Half-tone pattern
 * - Type 10+: Image/video textures with aspect ratio preservation
 * 
 * Shadow generation uses the same SDF calculations as the main glass pass
 * to ensure perfect alignment between shadows and glass shapes.
 */

export const fragmentBgShader = `#version 300 es

// Use high precision for accurate calculations
precision highp float;

// Input from vertex shader
in vec2 v_uv;                    // UV coordinates (0-1 range)

// Output color
out vec4 fragColor;

// Rendering context uniforms
uniform vec2 u_resolution;       // Canvas resolution in pixels
uniform float u_dpr;            // Device pixel ratio for sharp rendering

// Mouse interaction (used for shadow positioning)
uniform vec2 u_mouse;           // Raw mouse position
uniform vec2 u_mouseSpring;     // Spring-smoothed mouse position
uniform float u_time;           // Animation time (if needed)

// Shape definition uniforms
uniform float u_mergeRate;      // How smoothly shapes blend together
uniform float u_shapeWidth;     // Glass shape width
uniform float u_shapeHeight;    // Glass shape height
uniform float u_shapeRadius;    // Corner radius
uniform float u_shapeRoundness; // Corner curve smoothness

// Shadow generation uniforms
uniform float u_shadowExpand;   // How far shadow extends from shape
uniform float u_shadowFactor;   // Shadow opacity/intensity
uniform vec2 u_shadowPosition;  // Shadow offset from shape

// Background rendering uniforms
uniform int u_bgType;           // Background type selector
uniform sampler2D u_bgTexture;  // Background texture (image/video)
uniform float u_bgTextureRatio; // Background texture aspect ratio
uniform int u_bgTextureReady;   // Whether background texture is loaded
uniform int u_showShape1;       // Whether to show the first shape

/**
 * Generate chessboard or bar patterns for testing backgrounds
 * 
 * This function creates various geometric patterns useful for testing
 * the glass effect against high-contrast backgrounds.
 * 
 * @param uv - Screen coordinates
 * @param size - Pattern size in pixels
 * @param mode - Pattern type: 0=horizontal bars, 1=vertical bars, 2=checkerboard
 * @return Pattern value (0.0 or 1.0)
 */
float chessboard(vec2 uv, float size, int mode) {
  // Generate horizontal and vertical bar patterns
  float yBars = step(size * 2.0, mod(uv.y * 2.0, size * 4.0));
  float xBars = step(size * 2.0, mod(uv.x * 2.0, size * 4.0));

  if (mode == 0) {
    return yBars;                    // Horizontal bars
  } else if (mode == 1) {
    return xBars;                    // Vertical bars
  } else {
    return abs(yBars - xBars);       // Checkerboard (XOR pattern)
  }
}

/**
 * Generate simple half-tone pattern
 * 
 * Creates a horizontal gradient split for testing glass effects
 * against high-contrast backgrounds.
 * 
 * @param uv - Normalized screen coordinates
 * @return Color value: 1.0 for top half, 0.0 for bottom half
 */
float halfColor(vec2 uv) {
  if (uv.y > 0.5) {
    return 1.0;  // White top half
  } else {
    return 0.0;  // Black bottom half
  }
}

/**
 * Signed Distance Function for perfect circles
 * 
 * @param p - Point to test
 * @param r - Circle radius
 * @return Signed distance (negative inside, positive outside)
 */
float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

/**
 * Signed Distance Function for superellipse corners
 * 
 * Creates rounded corners with adjustable curve characteristics.
 * Higher 'n' values create more rectangular corners, lower values
 * create more rounded corners.
 * 
 * @param p - Point relative to corner center
 * @param r - Corner radius
 * @param n - Curve exponent (higher = more rectangular)
 * @return Signed distance to corner boundary
 */
float superellipseCornerSDF(vec2 p, float r, float n) {
  p = abs(p);  // Work in first quadrant only
  float v = pow(pow(p.x, n) + pow(p.y, n), 1.0 / n);
  return v - r;
}

/**
 * Signed Distance Function for rounded rectangles with customizable corners
 * 
 * Creates rectangles with rounded corners where the corner curve can be
 * adjusted from circular to more rectangular using the 'n' parameter.
 * 
 * @param p - Point to test
 * @param center - Rectangle center position
 * @param width - Rectangle width
 * @param height - Rectangle height
 * @param cornerRadius - Radius of rounded corners
 * @param n - Corner curve exponent (affects corner shape)
 * @return Signed distance (negative inside, positive outside)
 */
float roundedRectSDF(vec2 p, vec2 center, float width, float height, float cornerRadius, float n) {
  // Translate to rectangle's local coordinate system
  p -= center;

  // Scale corner radius by device pixel ratio for consistent appearance
  float cr = cornerRadius * u_dpr;

  // Calculate distance to rectangle edges (before rounding)
  vec2 d = abs(p) - vec2(width * u_dpr, height * u_dpr) * 0.5;

  float dist;

  // Determine if we're in a corner region or edge region
  if (d.x > -cr && d.y > -cr) {
    // Corner region: use superellipse SDF for rounded corners
    vec2 cornerCenter = sign(p) * (vec2(width * u_dpr, height * u_dpr) * 0.5 - vec2(cr));
    vec2 cornerP = p - cornerCenter;
    dist = superellipseCornerSDF(cornerP, cr, n);
  } else {
    // Edge or interior region: use standard rectangle SDF
    dist = min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
  }

  return dist;
}

/**
 * Smooth minimum function for blending SDFs
 * 
 * Combines two signed distance fields with smooth blending instead of
 * hard edges. This creates organic, flowing connections between shapes.
 * 
 * @param a - First SDF value
 * @param b - Second SDF value
 * @param k - Blend smoothness (higher = smoother blend)
 * @return Smoothly blended distance value
 */
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

/**
 * Standard minimum function for SDFs
 * 
 * Simple minimum without smoothing - creates hard edges where shapes meet.
 * 
 * @param a - First SDF value
 * @param b - Second SDF value
 * @return Minimum of the two values
 */
float sdgMin(float a, float b) {
  return a < b ? a : b;
}

/**
 * Main Signed Distance Function for combined glass shapes
 * 
 * Combines multiple glass shapes into a single SDF that defines the
 * overall glass geometry. Shapes are smoothly blended based on merge rate.
 * 
 * @param p1 - Center position of first shape (circle)
 * @param p2 - Center position of second shape (rounded rectangle)
 * @param p - Point to evaluate SDF at
 * @return Combined signed distance to glass shape boundary
 */
float mainSDF(vec2 p1, vec2 p2, vec2 p) {
  // Normalize positions to resolution-independent coordinates
  vec2 p1n = p1 + p / u_resolution.y;
  vec2 p2n = p2 + p / u_resolution.y;
  
  // Shape 1: Optional circle (can be disabled)
  float d1 = u_showShape1 == 1 
    ? sdCircle(p1n, 100.0 * u_dpr / u_resolution.y) 
    : 1.0; // Large positive value effectively disables the shape
  
  // Shape 2: Rounded rectangle following mouse
  float d2 = roundedRectSDF(
    p2n,
    vec2(0.0),
    u_shapeWidth / u_resolution.y,
    u_shapeHeight / u_resolution.y,
    u_shapeRadius / u_resolution.y,
    u_shapeRoundness
  );

  // Smoothly blend the two shapes
  return smin(d1, d2, u_mergeRate);
}

/**
 * Transform UV coordinates for cover-style texture mapping
 * 
 * Implements CSS background-size: cover behavior for textures.
 * The texture is scaled to completely fill the canvas while maintaining
 * its aspect ratio, with excess being cropped rather than stretched.
 * 
 * @param uv - Original UV coordinates (0-1 range)
 * @param canvasAspect - Canvas width/height ratio
 * @param textureAspect - Texture width/height ratio
 * @return Transformed UV coordinates for cover mapping
 */
vec2 getCoverUV(vec2 uv, float canvasAspect, float textureAspect) {
  if (canvasAspect > textureAspect) {
    // Canvas is wider than texture: scale vertically and crop horizontally
    float scale = textureAspect / canvasAspect;
    uv.y = uv.y * scale + 0.5 - 0.5 * scale;  // Center vertically
  } else {
    // Canvas is taller than texture: scale horizontally and crop vertically
    float scale = canvasAspect / textureAspect;
    uv.x = uv.x * scale + 0.5 - 0.5 * scale;  // Center horizontally
  }
  return uv;
}

/**
 * Main fragment shader function
 * 
 * Renders the background with appropriate content type and generates
 * soft shadows for the glass shapes.
 */
void main() {
  // Calculate resolution independent of device pixel ratio
  vec2 u_resolution1x = u_resolution.xy / u_dpr;
  vec3 bgColor = vec3(1.0);  // Default white background

  // Background type selection and rendering
  if (u_bgType <= 0) {
    // Type 0: Subtle checkerboard pattern for testing
    bgColor = vec3(1.0 - chessboard(gl_FragCoord.xy / u_dpr, 20.0, 2) / 4.0);
    
  } else if (u_bgType <= 1) {
    // Type 1: Quadrant-based pattern for testing different scenarios
    if (v_uv.x < 0.5 && v_uv.y > 0.5) {
      // Top-left: horizontal bars
      bgColor = vec3(chessboard(gl_FragCoord.xy / u_dpr, 10.0, 0));
    } else if (v_uv.x > 0.5 && v_uv.y < 0.5) {
      // Bottom-right: vertical bars
      bgColor = vec3(chessboard(gl_FragCoord.xy / u_dpr, 10.0, 1));
    } else if (v_uv.x < 0.5 && v_uv.y < 0.5) {
      // Bottom-left: solid black
      bgColor = vec3(0.0);
    }
    // Top-right quadrant remains white (default)
    
  } else if (u_bgType <= 2) {
    // Type 2: Simple horizontal gradient
    bgColor = vec3(halfColor(gl_FragCoord.xy / u_resolution) * 0.6 + 0.3);
    
  } else if (u_bgType <= 10) {
    // Type 10+: Texture/image background with cover scaling
    if (u_bgTextureReady != 1) {
      // Fallback to checkerboard while texture loads
      bgColor = vec3(1.0 - chessboard(gl_FragCoord.xy / u_dpr, 20.0, 2) / 4.0);
    } else {
      // Apply cover-style UV transformation for proper aspect ratio
      vec2 uv = getCoverUV(v_uv, u_resolution.x / u_resolution.y, u_bgTextureRatio);
      
      // Sample texture (CLAMP_TO_EDGE handles out-of-bounds automatically)
      bgColor = texture(u_bgTexture, uv).rgb;
    }
  }

  // Generate soft shadows for glass shapes
  // Calculate shadow-offset positions for both shapes
  
  // Shape 1 center with shadow offset
  vec2 p1 = (vec2(0, 0) - u_resolution.xy * 0.5 + 
             vec2(u_shadowPosition.x * u_dpr, u_shadowPosition.y * u_dpr)) / u_resolution.y;
  
  // Shape 2 center (follows mouse) with shadow offset
  vec2 p2 = (vec2(0, 0) - u_mouseSpring + 
             vec2(u_shadowPosition.x * u_dpr, u_shadowPosition.y * u_dpr)) / u_resolution.y;
  
  // Calculate combined SDF for shadow generation
  float merged = mainSDF(p1, p2, gl_FragCoord.xy);

  // Generate exponential falloff shadow
  // - exp() creates smooth falloff from shape edges
  // - abs(merged) ensures shadow appears outside shape boundary
  // - u_shadowExpand controls how far shadow extends
  // - u_shadowFactor controls shadow intensity
  float shadow = exp(-1.0 / u_shadowExpand * abs(merged) * u_resolution1x.y) * 0.6 * u_shadowFactor;

  // Apply shadow as darkening of background
  fragColor = vec4(bgColor - vec3(shadow), 1.0);
}
`;

export default fragmentBgShader;
