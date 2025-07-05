import { useMemo, useRef, useEffect } from "react";
import { getMap } from "../../shaders/getMap";

export function GlassFilter({ id, width, height, mode, aberrationIntensity, displacementScale, cornerRadius = 20 }: { id: string; width: number; height: number; mode: "standard" | "polar" | "prominent"; aberrationIntensity: number; displacementScale: number; cornerRadius?: number }) {
    // Use WebGL optimization when available
    const webglOptimized = useRef(false);
    
    // Check if we can use WebGL optimization
    useEffect(() => {
        try {
            const testCanvas = document.createElement('canvas');
            const gl = testCanvas.getContext('webgl') ?? testCanvas.getContext('experimental-webgl');
            webglOptimized.current = !!gl;
        } catch {
            webglOptimized.current = false;
        }
    }, []);

    // Memoize displacement map generation - only regenerate when mode changes
    const displacementMap = useMemo(() => {
        console.log('Generating displacement map for mode:', mode);
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
