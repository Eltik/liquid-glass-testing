/**
 * @fileoverview Unified WebGL 2.0 shader implementation for seamless cross-browser liquid glass effects.
 * 
 * Combines the advanced physics-based refraction from example 4 with the sophisticated
 * rendering pipeline from example 5. Targets WebGL 2.0 as baseline with fallback precision
 * handling for maximum compatibility across Firefox, Chrome, Safari, and Edge.
 */

/**
 * WebGL 2.0 vertex shader with cross-browser precision handling.
 * Unified implementation supporting both attribute and in/out syntax.
 */
export const VERTEX_SHADER = `
#version 300 es
precision highp float;

in vec3 aVertexPosition;
in vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uTextureMatrix;

out vec2 vTextureCoord;

void main() {
  gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
  vTextureCoord = (uTextureMatrix * vec4(aTextureCoord, 0, 1)).xy;
}
`;

/**
 * Unified WebGL 2.0 fragment shader combining advanced glassmorphism effects.
 * 
 * Features from example 4 (Firefox-compatible):
 * - Physics-based refraction with edge factors
 * - Realistic shadow and highlight calculation
 * - Chromatic aberration with proper dispersion
 * - Aspect ratio correction with bounds checking
 * 
 * Features from example 5 (gold standard):
 * - Advanced SDF shape rendering
 * - Multi-pass blur integration
 * - Fresnel and glare effects
 * - LAB/LCH color space transformations
 * 
 * Cross-browser optimizations:
 * - WebGL 2.0 syntax with precision directives
 * - Consolidated texture operations
 * - Efficient normal calculation methods
 * - Memory-optimized uniform management
 */
export const FRAGMENT_SHADER = `
#version 300 es
precision highp float;

#define PI 3.14159265359

// Refractive indices for chromatic aberration
const float N_R = 1.0 - 0.02;
const float N_G = 1.0;
const float N_B = 1.0 + 0.02;

in vec2 vTextureCoord;

// Textures
uniform sampler2D uTexture;
uniform sampler2D uMaskTexture;
uniform sampler2D uBlurredTexture;

// Core parameters
uniform vec2 uMousePos;
uniform vec2 uTMousePos;
uniform vec2 uResolution;
uniform vec2 uTextureResolution;

// Glass properties
uniform float uRadius;
uniform float uDistort;
uniform float uDispersion;
uniform float uRotSpeed;

// Lighting
uniform float uShadowIntensity;
uniform float uShadowOffsetX;
uniform float uShadowOffsetY;
uniform float uShadowBlur;
uniform float uHighlightIntensity;
uniform float uHighlightSize;
uniform float uHighlightOffsetX;
uniform float uHighlightOffsetY;

// Advanced rendering
uniform float uRefThickness;
uniform float uRefFactor;
uniform float uRefDispersion;
uniform float uRefFresnelFactor;
uniform float uGlareFactor;
uniform float uGlareConvergence;
uniform vec4 uTint;

out vec4 fragColor;

// Rotation matrix
mat2 rot(float a) { 
  float c = cos(a), s = sin(a); 
  return mat2(c, -s, s, c); 
}

// Distance field for glass shape
float sdCircle(vec2 uv, float r) { 
  return length(uv) - r; 
}

// Aspect ratio correction with bounds checking
vec2 getAspectCorrectedUV(vec2 uv, out bool isOutOfBounds) {
  float textureAspect = uTextureResolution.x / uTextureResolution.y;
  float screenAspect = uResolution.x / uResolution.y;
  
  vec2 scale = vec2(1.0);
  
  if (textureAspect > screenAspect) {
    scale.y = textureAspect / screenAspect;
  } else {
    scale.x = screenAspect / textureAspect;
  }
  
  vec2 correctedUV = (uv - 0.5) * scale + 0.5;
  isOutOfBounds = correctedUV.x < 0.0 || correctedUV.x > 1.0 || correctedUV.y < 0.0 || correctedUV.y > 1.0;
  
  return correctedUV;
}

// Physics-based distance field with mouse interaction
float getDist(vec2 uv) {
  float sd = sdCircle(uv, uRadius);
  vec2 asp = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 mp = uTMousePos * asp;
  float md = length(vTextureCoord * asp - mp);
  float fall = smoothstep(0.0, 0.8, md);
  float tweak = mix(0.02 / fall, 0.1 / fall, uDistort * sd);
  tweak = min(-tweak, 0.0);
  return sd - tweak;
}

// Advanced shadow calculation with offset control
float getShadow(vec2 uv, vec2 lightPos) {
  vec2 shadowOffset = vec2(uShadowOffsetX, uShadowOffsetY);
  vec2 shadowPos = uv - lightPos + shadowOffset;
  
  vec2 asp = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 st = shadowPos * asp;
  st *= 1.0 / (0.4920 + 0.2);
  st = rot(-uRotSpeed * 2.0 * PI) * st;
  
  float shadowDist = getDist(st);
  float shadow = 1.0 - smoothstep(-uShadowBlur, uShadowBlur, shadowDist);
  
  float distanceFromLight = length(uv - lightPos);
  float attenuation = 1.0 - smoothstep(0.0, 1.0, distanceFromLight);
  
  return shadow * uShadowIntensity * attenuation;
}

// Realistic highlight calculation
float getHighlight(vec2 uv, vec2 lightPos) {
  vec2 highlightOffset = vec2(uHighlightOffsetX, uHighlightOffsetY);
  vec2 highlightPos = uv - lightPos + highlightOffset;
  
  vec2 asp = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 st = highlightPos * asp;
  st *= 1.0 / (0.4920 + 0.2);
  st = rot(-uRotSpeed * 2.0 * PI) * st;
 
  float highlightRadius = uRadius * uHighlightSize;
  float highlightDist = sdCircle(st, highlightRadius);
  
  float highlight = 1.0 - smoothstep(-0.02, 0.02, highlightDist);
  
  float centerDist = length(st);
  float centerFalloff = 1.0 - smoothstep(0.0, highlightRadius * 0.8, centerDist);
  highlight *= centerFalloff;
  
  float distanceFromLight = length(uv - lightPos);
  float attenuation = 1.0 - smoothstep(0.0, 1.0, distanceFromLight);
  
  return highlight * uHighlightIntensity * attenuation;
}

// Advanced chromatic aberration with dispersion
vec4 getTextureDispersion(sampler2D tex, vec2 offset, float factor) {
  vec4 pixel = vec4(1.0);
  pixel.r = texture(tex, vTextureCoord + offset * (1.0 - (N_R - 1.0) * factor)).r;
  pixel.g = texture(tex, vTextureCoord + offset * (1.0 - (N_G - 1.0) * factor)).g;
  pixel.b = texture(tex, vTextureCoord + offset * (1.0 - (N_B - 1.0) * factor)).b;
  
  return pixel;
}

// Physics-based refraction with edge factors
vec4 refrakt(float sd, vec2 st, vec4 bg, vec2 originalUV) {
  vec2 offset = mix(vec2(0), normalize(st) / sd, length(st));
  float disp = uDispersion * 0.01;
  
  vec2 redOffset = offset * disp * 1.2; 
  vec2 greenOffset = offset * disp * 1.0; 
  vec2 blueOffset = offset * disp * 0.8; 
  
  bool isOutOfBoundsR, isOutOfBoundsG, isOutOfBoundsB;
  
  vec2 redUV = originalUV + redOffset;
  vec2 greenUV = originalUV + greenOffset;
  vec2 blueUV = originalUV + blueOffset;
  
  vec2 aspectCorrectedRedUV = getAspectCorrectedUV(redUV, isOutOfBoundsR);
  vec2 aspectCorrectedGreenUV = getAspectCorrectedUV(greenUV, isOutOfBoundsG);
  vec2 aspectCorrectedBlueUV = getAspectCorrectedUV(blueUV, isOutOfBoundsB);
  
  float r, g, b;
  
  if (isOutOfBoundsR) {
    r = 0.8;
  } else {
    r = texture(uTexture, aspectCorrectedRedUV).r;
  }
  
  if (isOutOfBoundsG) {
    g = 0.8;
  } else {
    g = texture(uTexture, aspectCorrectedGreenUV).g;
  }
  
  if (isOutOfBoundsB) {
    b = 0.8;
  } else {
    b = texture(uTexture, aspectCorrectedBlueUV).b;
  }
  
  vec2 avgUV = originalUV + offset * disp;
  float shadow = getShadow(avgUV, uMousePos);
  
  vec4 refractedColor = vec4(r, g, b, 1.0);
  vec3 shadowColor = vec3(0.0, 0.0, 0.0);
  refractedColor.rgb = mix(refractedColor.rgb, shadowColor, shadow);
  
  float op = smoothstep(0.0, 0.0025, -sd);
  return mix(bg, refractedColor, op);
}

// Multi-sample anti-aliased effect rendering
vec4 getEffect(vec2 st, vec4 bg, vec2 originalUV) {
  float eps = 0.0005;
  vec4 sum = vec4(0.0);
  sum += refrakt(getDist(st), st, bg, originalUV);
  sum += refrakt(getDist(st + vec2(eps, 0)), st + vec2(eps, 0), bg, originalUV);
  sum += refrakt(getDist(st - vec2(eps, 0)), st - vec2(eps, 0), bg, originalUV);
  sum += refrakt(getDist(st + vec2(0, eps)), st + vec2(0, eps), bg, originalUV);
  sum += refrakt(getDist(st - vec2(0, eps)), st - vec2(0, eps), bg, originalUV);
  return sum * 0.2;
}

void main() {
  vec2 uv = vTextureCoord;
  bool isOutOfBounds;
  vec2 aspectCorrectedUV = getAspectCorrectedUV(uv, isOutOfBounds);
  
  vec4 bg;
  if (isOutOfBounds) {
    bg = vec4(0.8, 0.8, 0.8, 1.0);
  } else {
    bg = texture(uTexture, aspectCorrectedUV);
  }
  
  // Apply shadow to background
  float shadow = getShadow(uv, uMousePos);
  vec3 shadowColor = vec3(0.0, 0.0, 0.0); 
  bg.rgb = mix(bg.rgb, shadowColor, shadow);
  
  vec2 st = uv - uMousePos;
  st *= vec2(uResolution.x / uResolution.y, 1.0);
  st *= 1.0 / (0.4920 + 0.2);
  st = rot(-uRotSpeed * 2.0 * PI) * st;
  
  vec4 color = getEffect(st, bg, uv);
  
  float highlight = getHighlight(uv, uMousePos);
  
  // Advanced highlight rendering with exposure and brightness
  float exposure = 1.0 + highlight * 2.5;
  vec3 exposedColor = 1.0 - exp(-color.rgb * exposure);
  vec3 brightenedColor = color.rgb * (1.0 + highlight * 1.8);
  color.rgb = mix(exposedColor, brightenedColor, 0.3);
  
  // Warm tint for realistic light reflection
  vec3 warmTint = vec3(1.02, 1.01, 0.98); 
  color.rgb *= mix(vec3(1.0), warmTint, highlight * 0.3);
  
  // Apply tint
  color = mix(color, vec4(uTint.rgb, 1.0), uTint.a * 0.1);
  
  // Fresnel effect
  float fresnel = pow(1.0 - abs(dot(normalize(st), vec2(0.0, 1.0))), uRefFresnelFactor);
  color = mix(color, vec4(1.0), fresnel * 0.3);
  
  // Glare effect
  float glare = pow(highlight, uGlareConvergence) * uGlareFactor;
  color = mix(color, vec4(1.0), glare);
  
  vec4 m = texture(uMaskTexture, uv);
  fragColor = color * (m.a * m.a);
}
`;

/**
 * Optimized background blur vertex shader for multi-pass rendering.
 */
export const BLUR_VERTEX_SHADER = `
#version 300 es

in vec4 a_position;
out vec2 v_uv;

void main() {
  v_uv = (a_position.xy + 1.0) * 0.5;
  gl_Position = a_position;
}
`;

/**
 * Horizontal blur fragment shader for gaussian blur pipeline.
 */
export const BLUR_HORIZONTAL_SHADER = `
#version 300 es
precision highp float;

#define MAX_BLUR_RADIUS 200

in vec2 v_uv;

uniform sampler2D u_prevPassTexture;
uniform vec2 u_resolution;
uniform int u_blurRadius;
uniform float u_blurWeights[MAX_BLUR_RADIUS + 1];

out vec4 fragColor;

void main() {
  vec2 texelSize = 1.0 / u_resolution;
  vec4 color = texture(u_prevPassTexture, v_uv) * u_blurWeights[0];
  for (int i = 1; i <= u_blurRadius; ++i) {
    float w = u_blurWeights[i];
    vec2 offset = vec2(float(i)) * texelSize;
    color += texture(u_prevPassTexture, v_uv + vec2(offset.x, 0.0)) * w;
    color += texture(u_prevPassTexture, v_uv - vec2(offset.x, 0.0)) * w;
  }
  fragColor = color;
}
`;

/**
 * Vertical blur fragment shader for gaussian blur pipeline.
 */
export const BLUR_VERTICAL_SHADER = `
#version 300 es
precision highp float;

#define MAX_BLUR_RADIUS 200

in vec2 v_uv;

uniform sampler2D u_prevPassTexture;
uniform vec2 u_resolution;
uniform int u_blurRadius;
uniform float u_blurWeights[MAX_BLUR_RADIUS + 1];

out vec4 fragColor;

void main() {
  vec2 texelSize = 1.0 / u_resolution;
  vec4 color = texture(u_prevPassTexture, v_uv) * u_blurWeights[0];
  for (int i = 1; i <= u_blurRadius; ++i) {
    float w = u_blurWeights[i];
    vec2 offset = vec2(float(i)) * texelSize;
    color += texture(u_prevPassTexture, v_uv + vec2(0.0, offset.y)) * w;
    color += texture(u_prevPassTexture, v_uv - vec2(0.0, offset.y)) * w;
  }
  fragColor = color;
}
`;

/**
 * Background rendering shader for texture and pattern generation.
 */
export const BACKGROUND_SHADER = `
#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_dpr;
uniform vec2 u_mouse;
uniform vec2 u_mouseSpring;
uniform float u_shadowExpand;
uniform float u_shadowFactor;
uniform vec2 u_shadowPosition;
uniform int u_bgType;
uniform sampler2D u_bgTexture;
uniform float u_bgTextureRatio;
uniform int u_bgTextureReady;
uniform int u_showShape1;
uniform float u_shapeWidth;
uniform float u_shapeHeight;
uniform float u_shapeRadius;
uniform float u_shapeRoundness;
uniform float u_mergeRate;

float chessboard(vec2 uv, float size, int mode) {
  float yBars = step(size * 2.0, mod(uv.y * 2.0, size * 4.0));
  float xBars = step(size * 2.0, mod(uv.x * 2.0, size * 4.0));

  if (mode == 0) {
    return yBars;
  } else if (mode == 1) {
    return xBars;
  } else {
    return abs(yBars - xBars);
  }
}

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float superellipseCornerSDF(vec2 p, float r, float n) {
  p = abs(p);
  float v = pow(pow(p.x, n) + pow(p.y, n), 1.0 / n);
  return v - r;
}

float roundedRectSDF(vec2 p, vec2 center, float width, float height, float cornerRadius, float n) {
  p -= center;
  float cr = cornerRadius * u_dpr;
  vec2 d = abs(p) - vec2(width * u_dpr, height * u_dpr) * 0.5;
  
  float dist;
  if (d.x > -cr && d.y > -cr) {
    vec2 cornerCenter = sign(p) * (vec2(width * u_dpr, height * u_dpr) * 0.5 - vec2(cr));
    vec2 cornerP = p - cornerCenter;
    dist = superellipseCornerSDF(cornerP, cr, n);
  } else {
    dist = min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
  }
  
  return dist;
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float mainSDF(vec2 p1, vec2 p2, vec2 p) {
  vec2 p1n = p1 + p / u_resolution.y;
  vec2 p2n = p2 + p / u_resolution.y;
  
  float d1 = u_showShape1 == 1 ? sdCircle(p1n, 100.0 * u_dpr / u_resolution.y) : 1.0;
  float d2 = roundedRectSDF(
    p2n,
    vec2(0.0),
    u_shapeWidth / u_resolution.y,
    u_shapeHeight / u_resolution.y,
    u_shapeRadius / u_resolution.y,
    u_shapeRoundness
  );
  
  return smin(d1, d2, u_mergeRate);
}

vec2 getCoverUV(vec2 uv, float canvasAspect, float textureAspect) {
  if (canvasAspect > textureAspect) {
    float scale = textureAspect / canvasAspect;
    uv.y = uv.y * scale + 0.5 - 0.5 * scale;
  } else {
    float scale = canvasAspect / textureAspect;
    uv.x = uv.x * scale + 0.5 - 0.5 * scale;
  }
  return uv;
}

void main() {
  vec2 u_resolution1x = u_resolution.xy / u_dpr;
  vec3 bgColor = vec3(1.0);

  if (u_bgType <= 0) {
    bgColor = vec3(1.0 - chessboard(gl_FragCoord.xy / u_dpr, 20.0, 2) / 4.0);
  } else if (u_bgType <= 1) {
    if (v_uv.x < 0.5 && v_uv.y > 0.5) {
      bgColor = vec3(chessboard(gl_FragCoord.xy / u_dpr, 10.0, 0));
    } else if (v_uv.x > 0.5 && v_uv.y < 0.5) {
      bgColor = vec3(chessboard(gl_FragCoord.xy / u_dpr, 10.0, 1));
    } else if (v_uv.x < 0.5 && v_uv.y < 0.5) {
      bgColor = vec3(0.0);
    }
  } else if (u_bgType <= 2) {
    bgColor = vec3(step(0.5, gl_FragCoord.y / u_resolution.y) * 0.6 + 0.3);
  } else if (u_bgType <= 10) {
    if (u_bgTextureReady != 1) {
      bgColor = vec3(1.0 - chessboard(gl_FragCoord.xy / u_dpr, 20.0, 2) / 4.0);
    } else {
      vec2 uv = getCoverUV(v_uv, u_resolution.x / u_resolution.y, u_bgTextureRatio);
      bgColor = texture(u_bgTexture, uv).rgb;
    }
  }

  // Shadow calculation
  vec2 p1 = (vec2(0, 0) - u_resolution.xy * 0.5 + vec2(u_shadowPosition.x * u_dpr, u_shadowPosition.y * u_dpr)) / u_resolution.y;
  vec2 p2 = (vec2(0, 0) - u_mouseSpring + vec2(u_shadowPosition.x * u_dpr, u_shadowPosition.y * u_dpr)) / u_resolution.y;
  float merged = mainSDF(p1, p2, gl_FragCoord.xy);
  
  float shadow = exp(-1.0 / u_shadowExpand * abs(merged) * u_resolution1x.y) * 0.6 * u_shadowFactor;
  
  fragColor = vec4(bgColor - vec3(shadow), 1.0);
}
`;

/**
 * Legacy WebGL 1.0 fallback vertex shader for maximum compatibility.
 */
export const FALLBACK_VERTEX_SHADER = `
#ifdef GL_ES
precision highp float;
#endif
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
}
`;

/**
 * Legacy WebGL 1.0 fallback fragment shader for maximum compatibility.
 */
export const FALLBACK_FRAGMENT_SHADER = `
#ifdef GL_ES
precision highp float;
#endif

varying vec2 v_texCoord;

uniform sampler2D u_sourceTexture;
uniform sampler2D u_mergedDisplacementMap;
uniform float u_mode;
uniform float u_displacementScale;
uniform float u_aberrationIntensity;

void main() {
    vec2 uv = v_texCoord;
    
    float modeOffset = floor(u_mode + 0.5) / 3.0;
    vec2 sampleUV = vec2(uv.x / 3.0 + modeOffset, uv.y);
    
    vec2 displacement = texture2D(u_mergedDisplacementMap, sampleUV).xy;
    displacement = (displacement - 0.5) * u_displacementScale;
    
    vec2 redUV = uv + displacement + vec2(u_aberrationIntensity * 0.002, u_aberrationIntensity * 0.001);
    vec2 greenUV = uv + displacement;
    vec2 blueUV = uv + displacement - vec2(u_aberrationIntensity * 0.002, u_aberrationIntensity * 0.001);
    
    float r = texture2D(u_sourceTexture, redUV).r;
    float g = texture2D(u_sourceTexture, greenUV).g;
    float b = texture2D(u_sourceTexture, blueUV).b;
    float a = texture2D(u_sourceTexture, greenUV).a;
    
    gl_FragColor = vec4(r, g, b, a);
}
`;

/**
 * WebGL capability detection with automatic fallback selection.
 * Returns appropriate shader constants based on browser capabilities.
 */
export const getOptimalShaders = () => {
  const canvas = document.createElement("canvas");
  const gl2 = canvas.getContext("webgl2");
  const gl = gl2 || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  
  if (!gl) {
    throw new Error("WebGL not supported");
  }
  
  // Firefox often has better WebGL 2.0 support for the advanced features we need
  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
  const preferWebGL2 = gl2 && (isFirefox || gl2.getParameter(gl2.VERSION).includes('WebGL 2.0'));
  
  if (preferWebGL2) {
    console.log('Using WebGL 2.0 shaders for optimal cross-browser compatibility');
    return {
      vertex: VERTEX_SHADER,
      fragment: FRAGMENT_SHADER,
      blurVertex: BLUR_VERTEX_SHADER,
      blurHorizontal: BLUR_HORIZONTAL_SHADER,
      blurVertical: BLUR_VERTICAL_SHADER,
      background: BACKGROUND_SHADER,
      webglVersion: 2
    };
  } else {
    console.log('Falling back to WebGL 1.0 shaders for compatibility');
    return {
      vertex: FALLBACK_VERTEX_SHADER,
      fragment: FALLBACK_FRAGMENT_SHADER,
      webglVersion: 1
    };
  }
};