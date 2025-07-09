/**
 * @fileoverview SVG filter system for WebGL-generated displacement mapping and chromatic aberration.
 *
 * Implements sophisticated SVG filter effects using WebGL-generated displacement maps
 * for realistic glassmorphism distortion. Provides memoized displacement map generation,
 * conditional chromatic aberration, and comprehensive browser compatibility handling.
 */

import { useMemo } from "react";
import { getMap } from "../shaders/impl/getMap";

/**
 * Advanced SVG filter component with WebGL displacement mapping and chromatic aberration.
 *
 * Creates complex visual effects using SVG filter primitives combined with WebGL-generated
 * displacement maps. Supports multiple distortion modes, conditional chromatic aberration,
 * and optimized performance through memoized map generation. Includes SSR compatibility
 * with graceful fallbacks for server-side rendering environments.
 *
 * Filter composition:
 * - WebGL-generated displacement map as texture source
 * - Base displacement mapping for primary distortion effects
 * - Conditional chromatic aberration with RGB channel separation
 * - Radial edge masking for natural boundary transitions
 * - Optimized filter region with extended boundaries
 *
 * @param id - Unique filter identifier for SVG filter element
 * @param width - Filter width in pixels for proper scaling
 * @param height - Filter height in pixels for proper scaling
 * @param mode - Displacement mode: standard/polar/prominent for different effects
 * @param aberrationIntensity - Chromatic aberration strength (0 disables effect)
 * @param displacementScale - Primary displacement effect intensity
 * @param cornerRadius - Border radius for clipping path generation
 * @returns SVG filter element with displacement and aberration effects
 *
 * @example
 * ```tsx
 * <GlassFilter
 *   id="glass-filter-1"
 *   width={300}
 *   height={200}
 *   mode="polar"
 *   aberrationIntensity={3}
 *   displacementScale={25}
 *   cornerRadius={16}
 * />
 * ```
 */
export function GlassFilter({ id, width, height, mode, aberrationIntensity, displacementScale, cornerRadius = 20 }: { id: string; width: number; height: number; mode: "standard" | "polar" | "prominent"; aberrationIntensity: number; displacementScale: number; cornerRadius?: number }) {
    /**
     * Memoized displacement map generation with SSR fallback.
     *
     * Generates WebGL-optimized displacement maps only when mode changes,
     * preventing expensive regeneration on every render. Includes server-side
     * rendering compatibility with transparent fallback images.
     */
    const displacementMap = useMemo(() => {
        // Skip WebGL generation during SSR
        if (typeof window === "undefined" || typeof document === "undefined") {
            return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; // 1x1 transparent fallback
        }
        console.log("Generating WebGL displacement map for mode:", mode);
        return getMap(mode);
    }, [mode]);
    return (
        <>
            <svg
                className="pointer-events-none absolute overflow-hidden"
                clipPath={`inset(0 round ${cornerRadius}px)`}
                style={{
                    width,
                    height,
                    transform: "translate3d(0, 0, 0)",
                }}
            >
                <defs>
                    <radialGradient id={`${id}-edge-mask`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="black" stopOpacity="0" />
                        <stop offset={`${Math.max(30, 80 - aberrationIntensity * 2)}%`} stopColor="black" stopOpacity="0" />
                        <stop offset="100%" stopColor="white" stopOpacity="1" />
                    </radialGradient>
                    <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
                        <feImage id="feimage" x="0" y="0" width="100%" height="100%" result="DISPLACEMENT_MAP" href={displacementMap} preserveAspectRatio="xMidYMid slice" />

                        {/* Base displacement - preserve original colors */}
                        <feDisplacementMap in="SourceGraphic" in2="DISPLACEMENT_MAP" scale={displacementScale * -1} xChannelSelector="R" yChannelSelector="B" result="DISPLACED" />

                        {/* Conditional chromatic aberration only when intensity > 0 */}
                        {aberrationIntensity > 0 ? (
                            <>
                                {/* Red channel offset */}
                                <feOffset in="DISPLACED" dx={aberrationIntensity * 0.4} dy={aberrationIntensity * 0.2} result="RED_SHIFT" />
                                <feColorMatrix in="RED_SHIFT" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="RED_ONLY" />

                                {/* Blue channel offset */}
                                <feOffset in="DISPLACED" dx={-aberrationIntensity * 0.4} dy={-aberrationIntensity * 0.2} result="BLUE_SHIFT" />
                                <feColorMatrix in="BLUE_SHIFT" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="BLUE_ONLY" />

                                {/* Green channel (no offset) */}
                                <feColorMatrix in="DISPLACED" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="GREEN_ONLY" />

                                {/* Combine channels with additive blending */}
                                <feComposite in="RED_ONLY" in2="GREEN_ONLY" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="RG_ADD" />
                                <feComposite in="RG_ADD" in2="BLUE_ONLY" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
                            </>
                        ) : (
                            /* No chromatic aberration - use displaced image directly */
                            <feOffset in="DISPLACED" dx="0" dy="0" />
                        )}
                    </filter>
                </defs>
            </svg>
        </>
    );
}
