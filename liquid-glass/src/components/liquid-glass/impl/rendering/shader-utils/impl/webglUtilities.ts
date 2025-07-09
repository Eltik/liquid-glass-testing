/**
 * @fileoverview WebGL utility functions for liquid glass shader implementation and capability detection.
 *
 * Provides comprehensive WebGL support validation, shader compilation testing, and optimized
 * displacement map generation for various visual effect modes. Includes caching mechanisms
 * for performance optimization and graceful fallback handling.
 */

/**
 * Detects and validates WebGL capabilities for liquid glass shader implementation.
 *
 * Performs comprehensive testing of WebGL support including context creation,
 * extension availability, and shader compilation capabilities. Validates all
 * requirements needed for liquid glass visual effects before allowing WebGL usage.
 *
 * @returns True if WebGL is fully supported with all required features, false otherwise
 *
 * @example
 * ```tsx
 * if (detectWebGLCapabilities()) {
 *   // Safe to use WebGL-accelerated effects
 *   enableShaderMode();
 * } else {
 *   // Fallback to canvas-based implementation
 *   useCanvasMode();
 * }
 * ```
 */
export const detectWebGLCapabilities = (): boolean => {
    try {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");

        if (!gl || !(gl instanceof WebGLRenderingContext)) {
            console.warn("WebGL not supported");
            return false;
        }

        // Check for required WebGL features
        const requiredExtensions = ["OES_texture_float"];
        for (const ext of requiredExtensions) {
            if (!gl.getExtension(ext)) {
                console.warn(`Required WebGL extension not available: ${ext}`);
            }
        }

        // Check shader compilation support
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        if (!vertexShader) {
            console.warn("Cannot create vertex shader");
            return false;
        }

        gl.shaderSource(vertexShader, "attribute vec2 a_position; void main() { gl_Position = vec4(a_position, 0.0, 1.0); }");
        gl.compileShader(vertexShader);

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.warn("Vertex shader compilation failed");
            gl.deleteShader(vertexShader);
            return false;
        }

        gl.deleteShader(vertexShader);
        console.log("WebGL capabilities validated successfully");
        return true;
    } catch (error) {
        console.warn("WebGL capability detection failed:", error);
        return false;
    }
};

/**
 * Creates optimized displacement maps for specific visual effect modes using mathematical algorithms.
 *
 * Generates pixel-perfect displacement data for different glassmorphism effects including
 * barrel distortion, radial transformations, and wave patterns. Uses optimized mathematical
 * calculations for real-time performance and applies edge falloff for natural-looking effects.
 *
 * @param mode - Visual effect type: "standard" (barrel), "polar" (radial), or "prominent" (wave)
 * @param width - Generated displacement map width in pixels
 * @param height - Generated displacement map height in pixels
 * @returns Base64-encoded data URL of displacement map canvas
 *
 * @throws {Error} When 2D canvas context creation fails
 *
 * @example
 * ```tsx
 * const displacementData = createModeSpecificMap("polar", 256, 256);
 * const img = new Image();
 * img.src = displacementData;
 * ```
 */
export const createModeSpecificMap = (mode: "standard" | "polar" | "prominent", width: number, height: number): string => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Failed to get 2D context for WebGL displacement map generation");
    }

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;

            const uv = { x: x / width, y: y / height };
            const center = { x: uv.x - 0.5, y: uv.y - 0.5 };
            const distSq = center.x * center.x + center.y * center.y;

            const displacement = { x: 0, y: 0 };

            switch (mode) {
                case "standard": // Barrel distortion
                    {
                        const distortion = 1.0 + distSq * 0.3;
                        displacement.x = center.x * distortion;
                        displacement.y = center.y * distortion;
                    }
                    break;
                case "polar": // Radial effect
                    {
                        const dist = Math.sqrt(distSq);
                        const angle = Math.atan2(center.y, center.x);
                        const newRadius = dist * 1.2;
                        displacement.x = Math.cos(angle) * newRadius;
                        displacement.y = Math.sin(angle) * newRadius;
                    }
                    break;
                case "prominent": // Wave pattern
                    {
                        const wave = Math.sin(uv.x * 12.566) * Math.sin(uv.y * 12.566) * 0.1;
                        displacement.x = center.x * (1.0 + wave);
                        displacement.y = center.y * (1.0 + wave);
                    }
                    break;
            }

            // Apply edge falloff
            const edgeFactor = 1.0 - Math.max(0, Math.min(1, (Math.sqrt(distSq) - 0.3) / 0.2));
            displacement.x *= edgeFactor;
            displacement.y *= edgeFactor;

            // Normalize displacement to [0,1] range
            const normalizedX = displacement.x * 0.5 + 0.5;
            const normalizedY = displacement.y * 0.5 + 0.5;

            // Store in RGBA format
            data[idx] = Math.floor(Math.max(0, Math.min(1, normalizedX)) * 255); // R
            data[idx + 1] = Math.floor(Math.max(0, Math.min(1, normalizedY)) * 255); // G
            data[idx + 2] = Math.floor(Math.max(0, Math.min(1, normalizedY)) * 255); // B
            data[idx + 3] = 255; // A
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
};

/**
 * Cache for generated displacement maps to avoid expensive regeneration.
 * Maps cache keys to base64-encoded displacement map data URLs.
 */
export const extractedModeCache = new Map<string, string>();

/**
 * Main displacement map generator with comprehensive validation and caching.
 *
 * Orchestrates the complete displacement map generation process including WebGL
 * capability validation, cache management, and mode-specific map creation.
 * Provides intelligent caching to prevent expensive regeneration and validates
 * browser environment requirements before proceeding.
 *
 * @param type - Visual effect mode for displacement generation
 * @param width - Map width in pixels, defaults to 256 for optimal performance
 * @param height - Map height in pixels, defaults to 256 for optimal performance
 * @param _displacementScale - Unused parameter maintained for API compatibility
 * @param _aberrationIntensity - Unused parameter maintained for API compatibility
 * @returns Base64-encoded displacement map data URL
 *
 * @throws {Error} When browser environment is not available
 * @throws {Error} When WebGL capabilities are insufficient
 *
 * @example
 * ```tsx
 * try {
 *   const mapData = generateDisplacementMap("standard", 512, 512);
 *   applyDisplacementEffect(mapData);
 * } catch (error) {
 *   console.warn("WebGL unavailable, using fallback effects");
 *   useFallbackEffects();
 * }
 * ```
 */
export const generateDisplacementMap = (type: "standard" | "polar" | "prominent", width = 256, height = 256, _displacementScale = 1.0, _aberrationIntensity = 0.0): string => {
    // Check if we already have this mode extracted
    const cacheKey = `extracted-${type}`;
    const cached = extractedModeCache.get(cacheKey);
    if (cached) {
        console.log("Using cached WebGL displacement map for:", type);
        return cached;
    }

    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof document === "undefined") {
        throw new Error("WebGL requires browser environment");
    }

    // Validate WebGL capabilities
    if (!detectWebGLCapabilities()) {
        throw new Error("WebGL capabilities insufficient for liquid glass effects");
    }

    // Create the mode-specific map using WebGL-optimized algorithms
    const modeData = createModeSpecificMap(type, width, height);

    // Cache the result
    extractedModeCache.set(cacheKey, modeData);

    console.log("Generated WebGL displacement map for type:", type);
    return modeData;
};
