import { useMemo } from "react";
import { getMap } from "../../shaders/getMap";

export function GlassFilter({ id, width, height, mode, aberrationIntensity, displacementScale, cornerRadius = 20 }: { id: string; width: number; height: number; mode: "standard" | "polar" | "prominent"; aberrationIntensity: number; displacementScale: number; cornerRadius?: number }) {
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
                    <filter id={id} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
                        <feImage id="feimage" x="0" y="0" width="100%" height="100%" result="DISPLACEMENT_MAP" href={displacementMap} preserveAspectRatio="xMidYMid slice" />

                        {/* Create edge mask using the displacement map itself */}
                        <feColorMatrix in="DISPLACEMENT_MAP" type="matrix" values="0.3 0.3 0.3 0 0 0.3 0.3 0.3 0 0 0.3 0.3 0.3 0 0 0 0 0 1 0" result="EDGE_INTENSITY" />
                        <feComponentTransfer in="EDGE_INTENSITY" result="EDGE_MASK">
                            <feFuncA type="discrete" tableValues={`0 ${aberrationIntensity * 0.05} 1`} />
                        </feComponentTransfer>

                        {/* Original undisplaced image for center */}
                        <feOffset in="SourceGraphic" dx="0" dy="0" result="CENTER_ORIGINAL" />

                        {/* Single displacement map with moderate scale for base effect */}
                        <feDisplacementMap in="SourceGraphic" in2="DISPLACEMENT_MAP" scale={displacementScale * (-1 - aberrationIntensity * 0.05)} xChannelSelector="R" yChannelSelector="B" result="BASE_DISPLACED" />
                        
                        {/* Create chromatic aberration by offsetting color channels */}
                        <feOffset in="BASE_DISPLACED" dx={aberrationIntensity * 0.5} dy={aberrationIntensity * 0.2} result="RED_OFFSET" />
                        <feColorMatrix in="RED_OFFSET" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="RED_CHANNEL" />
                        
                        <feOffset in="BASE_DISPLACED" dx={0} dy={0} result="GREEN_OFFSET" />
                        <feColorMatrix in="GREEN_OFFSET" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="GREEN_CHANNEL" />
                        
                        <feOffset in="BASE_DISPLACED" dx={-aberrationIntensity * 0.5} dy={-aberrationIntensity * 0.2} result="BLUE_OFFSET" />
                        <feColorMatrix in="BLUE_OFFSET" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="BLUE_CHANNEL" />

                        {/* Combine all channels with screen blend mode for chromatic aberration */}
                        <feBlend in="GREEN_CHANNEL" in2="BLUE_CHANNEL" mode="screen" result="GB_COMBINED" />
                        <feBlend in="RED_CHANNEL" in2="GB_COMBINED" mode="screen" result="RGB_COMBINED" />

                        {/* Add slight blur to soften the aberration effect */}
                        <feGaussianBlur in="RGB_COMBINED" stdDeviation={Math.max(0.1, 0.5 - aberrationIntensity * 0.1)} result="ABERRATED_BLURRED" />

                        {/* Apply edge mask to aberration effect */}
                        <feComposite in="ABERRATED_BLURRED" in2="EDGE_MASK" operator="in" result="EDGE_ABERRATION" />

                        {/* Create inverted mask for center */}
                        <feComponentTransfer in="EDGE_MASK" result="INVERTED_MASK">
                            <feFuncA type="table" tableValues="1 0" />
                        </feComponentTransfer>
                        <feComposite in="CENTER_ORIGINAL" in2="INVERTED_MASK" operator="in" result="CENTER_CLEAN" />

                        {/* Combine edge aberration with clean center */}
                        <feComposite in="EDGE_ABERRATION" in2="CENTER_CLEAN" operator="over" />
                    </filter>
                </defs>
            </svg>
        </>
    );
}
