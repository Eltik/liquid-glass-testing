/**
 * @fileoverview Displacement map retrieval system with WebGL-optimized generation.
 *
 * Provides the primary interface for displacement map generation across different
 * visual effect modes. Implements WebGL-only approach for optimal performance
 * with comprehensive error handling and environment validation.
 */

import { generateDisplacementMap } from "../../shader-utils";

/**
 * Retrieves displacement map data URL for specified visual effect mode.
 *
 * Primary interface for displacement map generation supporting standard, polar,
 * and prominent visual effects. Uses WebGL-optimized generation exclusively
 * for maximum performance and visual quality. Validates browser environment
 * and throws descriptive errors for unsupported configurations.
 *
 * Supported modes:
 * - "standard": Barrel distortion effect for classic glassmorphism
 * - "polar": Radial transformation for circular distortion patterns
 * - "prominent": Wave pattern effect for enhanced visual prominence
 *
 * @param mode - Visual effect type for displacement map generation
 * @returns Base64-encoded displacement map data URL for SVG filter usage
 * @throws {Error} When called in non-browser environment (SSR)
 * @throws {Error} When invalid mode parameter is provided
 *
 * @example
 * ```tsx
 * try {
 *   const mapData = getMap("polar");
 *   applyDisplacementFilter(mapData);
 * } catch (error) {
 *   console.warn("WebGL displacement unavailable:", error);
 * }
 * ```
 */
export const getMap = (mode: "standard" | "polar" | "prominent"): string => {
    // Only use WebGL implementation - no CPU fallback
    if (typeof window === "undefined" || typeof document === "undefined") {
        throw new Error("WebGL implementation requires browser environment");
    }

    switch (mode) {
        case "standard":
            return generateDisplacementMap("standard");
        case "polar":
            return generateDisplacementMap("polar");
        case "prominent":
            return generateDisplacementMap("prominent");
        default:
            throw new Error(`Invalid mode: ${String(mode)}`);
    }
};
