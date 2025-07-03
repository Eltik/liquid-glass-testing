import { type CSSProperties, forwardRef, useCallback, useEffect, useId, useRef, useState } from "react";
import { ShaderDisplacementGenerator, fragmentShaders } from "./utils/impl/shaders";
import { getDisplacementMap, getPolarDisplacementMap, getProminentDisplacementMap } from "./utils/impl/displacement-maps";
import { useGlassBehavior } from "./utils/impl/use-glass-behavior";
import type { EnhancedLiquidGlassProps } from "../types";

// Generate shader-based displacement map using shaderUtils
const generateShaderDisplacementMap = (width: number, height: number): string => {
    const generator = new ShaderDisplacementGenerator({
        width,
        height,
        fragment: fragmentShaders.liquidGlass,
    });

    const dataUrl = generator.updateShader();
    generator.destroy();

    return dataUrl;
};

const getMap = (mode: "standard" | "polar" | "prominent" | "shader", shaderMapUrl?: string) => {
    switch (mode) {
        case "standard":
            return getDisplacementMap();
        case "polar":
            return getPolarDisplacementMap();
        case "prominent":
            return getProminentDisplacementMap();
        case "shader":
            return shaderMapUrl ?? getDisplacementMap();
        default:
            throw new Error(`Invalid mode: ${String(mode)}`);
    }
};

/* ---------- SVG filter (edge-only displacement) ---------- */
const GlassFilter: React.FC<{
    id: string;
    displacementScale: number;
    aberrationIntensity: number;
    width: number;
    height: number;
    mode: "standard" | "polar" | "prominent" | "shader";
    shaderMapUrl?: string;
    cornerRadius?: number;
}> = ({ id, displacementScale, aberrationIntensity, width, height, mode, shaderMapUrl, cornerRadius = 20 }) => (
    <svg
        style={{
            position: "absolute",
            transform: "translate3d(0, 0, 0)",
            width,
            height,
            pointerEvents: "none",
            overflow: "hidden",
        }}
        aria-hidden="true"
        clipPath={`inset(0 round ${cornerRadius}px)`}
    >
        <defs>
            <radialGradient id={`${id}-edge-mask`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="black" stopOpacity="0" />
                <stop offset={`${Math.max(30, 80 - aberrationIntensity * 2)}%`} stopColor="black" stopOpacity="0" />
                <stop offset="100%" stopColor="white" stopOpacity="1" />
            </radialGradient>
            <filter id={id} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
                <feImage id="feimage" x="0" y="0" width="100%" height="100%" result="DISPLACEMENT_MAP" href={getMap(mode, shaderMapUrl)} preserveAspectRatio="xMidYMid slice" />

                {/* Create edge mask using the displacement map itself */}
                <feColorMatrix
                    in="DISPLACEMENT_MAP"
                    type="matrix"
                    values="0.3 0.3 0.3 0 0
                 0.3 0.3 0.3 0 0
                 0.3 0.3 0.3 0 0
                 0 0 0 1 0"
                    result="EDGE_INTENSITY"
                />
                <feComponentTransfer in="EDGE_INTENSITY" result="EDGE_MASK">
                    <feFuncA type="discrete" tableValues={`0 ${aberrationIntensity * 0.05} 1`} />
                </feComponentTransfer>

                {/* Original undisplaced image for center */}
                <feOffset in="SourceGraphic" dx="0" dy="0" result="CENTER_ORIGINAL" />

                {/* Red channel displacement with slight offset */}
                <feDisplacementMap in="SourceGraphic" in2="DISPLACEMENT_MAP" scale={displacementScale * (mode === "shader" ? 1 : -1)} xChannelSelector="R" yChannelSelector="B" result="RED_DISPLACED" />
                <feColorMatrix
                    in="RED_DISPLACED"
                    type="matrix"
                    values="1 0 0 0 0
                 0 0 0 0 0
                 0 0 0 0 0
                 0 0 0 1 0"
                    result="RED_CHANNEL"
                />

                {/* Green channel displacement */}
                <feDisplacementMap in="SourceGraphic" in2="DISPLACEMENT_MAP" scale={displacementScale * ((mode === "shader" ? 1 : -1) - aberrationIntensity * 0.05)} xChannelSelector="R" yChannelSelector="B" result="GREEN_DISPLACED" />
                <feColorMatrix
                    in="GREEN_DISPLACED"
                    type="matrix"
                    values="0 0 0 0 0
                 0 1 0 0 0
                 0 0 0 0 0
                 0 0 0 1 0"
                    result="GREEN_CHANNEL"
                />

                {/* Blue channel displacement with slight offset */}
                <feDisplacementMap in="SourceGraphic" in2="DISPLACEMENT_MAP" scale={displacementScale * ((mode === "shader" ? 1 : -1) - aberrationIntensity * 0.1)} xChannelSelector="R" yChannelSelector="B" result="BLUE_DISPLACED" />
                <feColorMatrix
                    in="BLUE_DISPLACED"
                    type="matrix"
                    values="0 0 0 0 0
                 0 0 0 0 0
                 0 0 1 0 0
                 0 0 0 1 0"
                    result="BLUE_CHANNEL"
                />

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
);

/* ---------- Enhanced Glass Container ---------- */
const EnhancedGlassContainer = forwardRef<
    HTMLDivElement,
    React.PropsWithChildren<{
        className?: string;
        style?: React.CSSProperties;
        displacementScale?: number;
        blurAmount?: number;
        saturation?: number;
        aberrationIntensity?: number;
        mouseOffset?: { x: number; y: number };
        onMouseLeave?: () => void;
        onMouseEnter?: () => void;
        onMouseDown?: (e: React.MouseEvent) => void;
        onMouseUp?: () => void;
        active?: boolean;
        overLight?: boolean;
        cornerRadius?: number;
        padding?: string;
        glassSize?: { width: number; height: number };
        onClick?: () => void;
        mode?: "standard" | "polar" | "prominent" | "shader";
    }>
>(({ children, className = "", style, displacementScale = 25, blurAmount = 12, saturation = 180, aberrationIntensity = 2, onMouseEnter, onMouseLeave, onMouseDown, onMouseUp, active = false, overLight = false, cornerRadius = 999, padding = "24px 32px", glassSize = { width: 270, height: 69 }, onClick, mode = "standard" }, ref) => {
    const filterId = useId();
    const [shaderMapUrl, setShaderMapUrl] = useState<string>("");

    const isFirefox = typeof navigator !== "undefined" && navigator.userAgent.toLowerCase().includes("firefox");

    // Generate shader displacement map when in shader mode
    useEffect(() => {
        if (mode === "shader") {
            const url = generateShaderDisplacementMap(glassSize.width, glassSize.height);
            setShaderMapUrl(url);
        }
    }, [mode, glassSize.width, glassSize.height]);

    const backdropStyle = {
        filter: isFirefox ? null : `url(#${filterId})`,
        backdropFilter: `blur(${(overLight ? 12 : 4) + blurAmount * 32}px) saturate(${saturation}%)`,
    };

    return (
        <div
            ref={ref}
            className={`relative ${className} ${active ? "active" : ""} ${Boolean(onClick) ? "cursor-pointer" : ""}`}
            style={{
                ...style,
                borderRadius: `${cornerRadius}px`,
                overflow: "hidden",
                clipPath: `inset(0 round ${cornerRadius}px)`,
                WebkitClipPath: `inset(0 round ${cornerRadius}px)`,
            }}
            onClick={onClick}
        >
            <GlassFilter mode={mode} id={filterId} displacementScale={displacementScale} aberrationIntensity={aberrationIntensity} width={glassSize.width} height={glassSize.height} shaderMapUrl={shaderMapUrl} cornerRadius={cornerRadius} />

            <div
                className="glass"
                style={{
                    borderRadius: `${cornerRadius}px`,
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "24px",
                    padding,
                    overflow: "hidden",
                    transition: "transform 0.2s ease-in-out, opacity 0.2s ease-in-out",
                    boxShadow: overLight ? "0px 16px 70px rgba(0, 0, 0, 0.75)" : "0px 12px 40px rgba(0, 0, 0, 0.25)",
                    width: "100%",
                    height: "100%",
                    clipPath: `inset(0 round ${cornerRadius}px)`,
                    WebkitClipPath: `inset(0 round ${cornerRadius}px)`,
                }}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
            >
                {/* backdrop layer that gets wiggly */}
                <span
                    className="glass__warp"
                    style={
                        {
                            ...backdropStyle,
                            position: "absolute",
                            inset: "0",
                            borderRadius: `${cornerRadius}px`,
                            overflow: "hidden",
                            clipPath: `inset(0 round ${cornerRadius}px)`,
                            WebkitClipPath: `inset(0 round ${cornerRadius}px)`,
                        } as CSSProperties
                    }
                />

                {/* user content stays sharp */}
                <div
                    className="text-white transition-all duration-150 ease-in-out"
                    style={{
                        position: "relative",
                        zIndex: 1,
                        font: "500 20px/1 system-ui",
                        textShadow: overLight ? "0px 2px 12px rgba(0, 0, 0, 0)" : "0px 2px 12px rgba(0, 0, 0, 0.4)",
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
});

EnhancedGlassContainer.displayName = "EnhancedGlassContainer";

export default function EnhancedLiquidGlass({ children, width, height, className = "", style = {}, padding = "24px 32px", cornerRadius = 20, displacementScale = 70, blurAmount = 0.0625, saturation = 140, aberrationIntensity = 2, elasticity = 0.15, globalMousePos: externalGlobalMousePos, mouseOffset: externalMouseOffset, mouseContainer = null, overLight = false, mode = "standard", onClick, initialPosition, draggable = true, minWidth = 100, minHeight = 50, brightness: _brightness = 105, contrast: _contrast = 120 }: EnhancedLiquidGlassProps) {
    const glassRef = useRef<HTMLDivElement>(null);

    const [isHovered, setIsHovered] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [internalGlobalMousePos, setInternalGlobalMousePos] = useState({
        x: 0,
        y: 0,
    });
    const [internalMouseOffset, setInternalMouseOffset] = useState({
        x: 0,
        y: 0,
    });

    // Pre-calculate static CSS values to avoid recalculation
    const borderGradientRef = useRef({
        angle: 135,
        opacity1: 0.12,
        opacity2: 0.4,
        stop1: 33,
        stop2: 66,
    });
    const overlayGradientRef = useRef({
        angle: 135,
        opacity1: 0.32,
        opacity2: 0.6,
        stop1: 33,
        stop2: 66,
    });

    // Use shared glass behavior hook
    const { glassSize, position, isDragging, measureRef, containerRef, measureStyle, handleMouseDown } = useGlassBehavior({
        width,
        height,
        padding,
        initialPosition,
        draggable,
        minWidth,
        minHeight,
        children,
    });

    // Use external mouse position if provided, otherwise use internal
    const globalMousePos = externalGlobalMousePos ?? internalGlobalMousePos;
    const mouseOffset = externalMouseOffset ?? internalMouseOffset;

    // RAF throttling for mouse move events
    const rafIdRef = useRef<number | undefined>(undefined);

    // Internal mouse tracking with RAF throttling for performance
    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (rafIdRef.current) {
                return; // Skip if already scheduled
            }

            rafIdRef.current = requestAnimationFrame(() => {
                rafIdRef.current = undefined;

                const container = mouseContainer?.current ?? glassRef.current;
                if (!container) {
                    return;
                }

                const rect = container.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                const newMouseOffset = {
                    x: ((e.clientX - centerX) / rect.width) * 100,
                    y: ((e.clientY - centerY) / rect.height) * 100,
                };

                const newGlobalMousePos = {
                    x: e.clientX,
                    y: e.clientY,
                };

                // Update gradient values for border effects using transform instead of background recalculation
                if (!isDragging) {
                    borderGradientRef.current = {
                        angle: 135 + newMouseOffset.x * 1.2,
                        opacity1: 0.12 + Math.abs(newMouseOffset.x) * 0.008,
                        opacity2: 0.4 + Math.abs(newMouseOffset.x) * 0.012,
                        stop1: Math.max(10, 33 + newMouseOffset.y * 0.3),
                        stop2: Math.min(90, 66 + newMouseOffset.y * 0.4),
                    };

                    overlayGradientRef.current = {
                        angle: 135 + newMouseOffset.x * 1.2,
                        opacity1: 0.32 + Math.abs(newMouseOffset.x) * 0.008,
                        opacity2: 0.6 + Math.abs(newMouseOffset.x) * 0.012,
                        stop1: Math.max(10, 33 + newMouseOffset.y * 0.3),
                        stop2: Math.min(90, 66 + newMouseOffset.y * 0.4),
                    };
                }

                setInternalMouseOffset(newMouseOffset);
                setInternalGlobalMousePos(newGlobalMousePos);
            });
        },
        [mouseContainer, isDragging],
    );

    // Set up mouse tracking if no external mouse position is provided
    useEffect(() => {
        if (externalGlobalMousePos && externalMouseOffset) {
            // External mouse tracking is provided, don't set up internal tracking
            return;
        }

        const container = mouseContainer?.current ?? glassRef.current;
        if (!container) {
            return;
        }

        container.addEventListener("mousemove", handleMouseMove);

        return () => {
            container.removeEventListener("mousemove", handleMouseMove);
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = undefined;
            }
        };
    }, [handleMouseMove, mouseContainer, externalGlobalMousePos, externalMouseOffset]);

    // Calculate directional scaling based on mouse position
    const calculateDirectionalScale = useCallback(() => {
        if (!globalMousePos.x || !globalMousePos.y || !glassRef.current) {
            return "scale(1)";
        }

        const rect = glassRef.current.getBoundingClientRect();
        const pillCenterX = rect.left + rect.width / 2;
        const pillCenterY = rect.top + rect.height / 2;
        const pillWidth = glassSize.width;
        const pillHeight = glassSize.height;

        const deltaX = globalMousePos.x - pillCenterX;
        const deltaY = globalMousePos.y - pillCenterY;

        // Calculate distance from mouse to pill edges (not center)
        const edgeDistanceX = Math.max(0, Math.abs(deltaX) - pillWidth / 2);
        const edgeDistanceY = Math.max(0, Math.abs(deltaY) - pillHeight / 2);
        const edgeDistance = Math.sqrt(edgeDistanceX * edgeDistanceX + edgeDistanceY * edgeDistanceY);

        // Activation zone: 200px from edges
        const activationZone = 200;

        // If outside activation zone, no effect
        if (edgeDistance > activationZone) {
            return "scale(1)";
        }

        // Calculate fade-in factor (1 at edge, 0 at activation zone boundary)
        const fadeInFactor = 1 - edgeDistance / activationZone;

        // Normalize the deltas for direction
        const centerDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (centerDistance === 0) {
            return "scale(1)";
        }

        const normalizedX = deltaX / centerDistance;
        const normalizedY = deltaY / centerDistance;

        // Calculate stretch factors with fade-in
        const stretchIntensity = Math.min(centerDistance / 300, 1) * elasticity * fadeInFactor;

        // X-axis scaling: stretch horizontally when moving left/right, compress when moving up/down
        const scaleX = 1 + Math.abs(normalizedX) * stretchIntensity * 0.3 - Math.abs(normalizedY) * stretchIntensity * 0.15;

        // Y-axis scaling: stretch vertically when moving up/down, compress when moving left/right
        const scaleY = 1 + Math.abs(normalizedY) * stretchIntensity * 0.3 - Math.abs(normalizedX) * stretchIntensity * 0.15;

        return `scaleX(${Math.max(0.8, scaleX)}) scaleY(${Math.max(0.8, scaleY)})`;
    }, [globalMousePos, elasticity, glassSize]);

    // Helper function to calculate fade-in factor based on distance from element edges
    const calculateFadeInFactor = useCallback(() => {
        if (!globalMousePos.x || !globalMousePos.y || !glassRef.current) {
            return 0;
        }

        const rect = glassRef.current.getBoundingClientRect();
        const pillCenterX = rect.left + rect.width / 2;
        const pillCenterY = rect.top + rect.height / 2;
        const pillWidth = glassSize.width;
        const pillHeight = glassSize.height;

        const edgeDistanceX = Math.max(0, Math.abs(globalMousePos.x - pillCenterX) - pillWidth / 2);
        const edgeDistanceY = Math.max(0, Math.abs(globalMousePos.y - pillCenterY) - pillHeight / 2);
        const edgeDistance = Math.sqrt(edgeDistanceX * edgeDistanceX + edgeDistanceY * edgeDistanceY);

        const activationZone = 200;
        return edgeDistance > activationZone ? 0 : 1 - edgeDistance / activationZone;
    }, [globalMousePos, glassSize]);

    // Helper function to calculate elastic translation
    const calculateElasticTranslation = useCallback(() => {
        if (!glassRef.current) {
            return { x: 0, y: 0 };
        }

        const fadeInFactor = calculateFadeInFactor();
        const rect = glassRef.current.getBoundingClientRect();
        const pillCenterX = rect.left + rect.width / 2;
        const pillCenterY = rect.top + rect.height / 2;

        return {
            x: (globalMousePos.x - pillCenterX) * elasticity * 0.1 * fadeInFactor,
            y: (globalMousePos.y - pillCenterY) * elasticity * 0.1 * fadeInFactor,
        };
    }, [globalMousePos, elasticity, calculateFadeInFactor]);

    const elasticTranslation = isDragging ? { x: 0, y: 0 } : calculateElasticTranslation();
    const directionalScale = isDragging ? "scale(1)" : isActive && Boolean(onClick) ? "scale(0.96)" : calculateDirectionalScale();

    const transformStyle = position.centered ? `translate3d(calc(-50% + ${elasticTranslation.x}px), calc(-50% + ${elasticTranslation.y}px), 0) ${directionalScale}` : `translate3d(${elasticTranslation.x}px, ${elasticTranslation.y}px, 0) ${directionalScale}`;

    const borderPositionStyles: React.CSSProperties = position.centered
        ? {
              position: "fixed",
              transform: transformStyle.replace("translate3d(calc(-50% + ", "translate3d(calc(50vw - 50% + ").replace("), calc(-50% + ", "), calc(50vh - 50% + "),
              zIndex: 10000,
          }
        : {
              position: "fixed",
              transform: isDragging ? `translate3d(${position.x}px, ${position.y}px, 0)` : `translate3d(${position.x + elasticTranslation.x}px, ${position.y + elasticTranslation.y}px, 0) ${directionalScale}`,
              zIndex: 10000,
          };

    const containerStyle: React.CSSProperties = {
        width: glassSize.width,
        height: glassSize.height,
        cursor: draggable ? (isDragging ? "grabbing" : "grab") : "default",
        pointerEvents: "auto",
        ...(position.centered
            ? {
                  position: "fixed",
                  transform: transformStyle.replace("translate3d(calc(-50% + ", "translate3d(calc(50vw - 50% + ").replace("), calc(-50% + ", "), calc(50vh - 50% + "),
                  zIndex: 9999,
              }
            : {
                  position: "fixed",
                  transform: isDragging ? `translate3d(${position.x}px, ${position.y}px, 0)` : `translate3d(${position.x + elasticTranslation.x}px, ${position.y + elasticTranslation.y}px, 0) ${directionalScale}`,
                  zIndex: 9999,
              }),
    };

    return (
        <>
            {/* Invisible measuring div for auto-sizing */}
            {children && (
                <div ref={measureRef} style={measureStyle}>
                    <div style={{ padding }}>{children}</div>
                </div>
            )}

            {/* Over light effect */}
            <div
                className={`pointer-events-none bg-black ${overLight ? "opacity-20" : "opacity-0"}`}
                style={{
                    ...borderPositionStyles,
                    height: glassSize.height,
                    width: glassSize.width,
                    borderRadius: `${cornerRadius}px`,
                    pointerEvents: "none",
                    transition: isDragging ? "none" : "transform 0.15s ease-in-out, opacity 0.15s ease-in-out",
                    overflow: "hidden",
                    clipPath: `inset(0 round ${cornerRadius}px)`,
                    WebkitClipPath: `inset(0 round ${cornerRadius}px)`,
                }}
            />
            <div
                className={`pointer-events-none bg-black mix-blend-overlay ${overLight ? "opacity-100" : "opacity-0"}`}
                style={{
                    ...borderPositionStyles,
                    height: glassSize.height,
                    width: glassSize.width,
                    borderRadius: `${cornerRadius}px`,
                    pointerEvents: "none",
                    transition: isDragging ? "none" : "transform 0.15s ease-in-out, opacity 0.15s ease-in-out",
                    overflow: "hidden",
                    clipPath: `inset(0 round ${cornerRadius}px)`,
                    WebkitClipPath: `inset(0 round ${cornerRadius}px)`,
                }}
            />

            <EnhancedGlassContainer
                ref={(el) => {
                    glassRef.current = el;
                    containerRef.current = el;
                }}
                className={className}
                style={containerStyle}
                cornerRadius={cornerRadius}
                displacementScale={overLight ? displacementScale * 0.5 : displacementScale}
                blurAmount={blurAmount}
                saturation={saturation}
                aberrationIntensity={aberrationIntensity}
                glassSize={glassSize}
                padding={padding}
                mouseOffset={mouseOffset}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onMouseDown={(e) => {
                    setIsActive(true);
                    handleMouseDown(e);
                }}
                onMouseUp={() => setIsActive(false)}
                active={isActive}
                overLight={overLight}
                onClick={onClick}
                mode={mode}
            >
                {children}
            </EnhancedGlassContainer>

            {/* Border layer 1 - screen blend */}
            <span
                className="border-layer-1"
                style={{
                    ...containerStyle,
                    zIndex: (containerStyle.zIndex as number) + 1,
                    pointerEvents: "none",
                    mixBlendMode: "screen",
                    opacity: 0.2,
                    padding: "1.5px",
                    transition: isDragging ? "none" : "transform 0.2s ease-out, opacity 0.2s ease-out",
                    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    boxShadow: "0 0 0 0.5px rgba(255, 255, 255, 0.5) inset, 0 1px 3px rgba(255, 255, 255, 0.25) inset, 0 1px 4px rgba(0, 0, 0, 0.35)",
                    borderRadius: `${cornerRadius}px`,
                    overflow: "hidden",
                    clipPath: `inset(0 round ${cornerRadius}px)`,
                    WebkitClipPath: `inset(0 round ${cornerRadius}px)`,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: `${cornerRadius}px`,
                        backgroundImage: isDragging
                            ? `linear-gradient(135deg, rgba(255, 255, 255, 0.0) 0%, rgba(255, 255, 255, 0.12) 33%, rgba(255, 255, 255, 0.4) 66%, rgba(255, 255, 255, 0.0) 100%)`
                            : `linear-gradient(
                ${borderGradientRef.current.angle}deg,
                rgba(255, 255, 255, 0.0) 0%,
                rgba(255, 255, 255, ${borderGradientRef.current.opacity1}) ${borderGradientRef.current.stop1}%,
                rgba(255, 255, 255, ${borderGradientRef.current.opacity2}) ${borderGradientRef.current.stop2}%,
                rgba(255, 255, 255, 0.0) 100%
              )`,
                    }}
                />
            </span>

            {/* Border layer 2 - overlay blend */}
            <span
                className="border-layer-2"
                style={{
                    ...containerStyle,
                    zIndex: (containerStyle.zIndex as number) + 2,
                    pointerEvents: "none",
                    mixBlendMode: "overlay",
                    padding: "1.5px",
                    transition: isDragging ? "none" : "transform 0.2s ease-out, opacity 0.2s ease-out",
                    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    boxShadow: "0 0 0 0.5px rgba(255, 255, 255, 0.5) inset, 0 1px 3px rgba(255, 255, 255, 0.25) inset, 0 1px 4px rgba(0, 0, 0, 0.35)",
                    borderRadius: `${cornerRadius}px`,
                    overflow: "hidden",
                    clipPath: `inset(0 round ${cornerRadius}px)`,
                    WebkitClipPath: `inset(0 round ${cornerRadius}px)`,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: `${cornerRadius}px`,
                        backgroundImage: isDragging
                            ? `linear-gradient(135deg, rgba(255, 255, 255, 0.0) 0%, rgba(255, 255, 255, 0.32) 33%, rgba(255, 255, 255, 0.6) 66%, rgba(255, 255, 255, 0.0) 100%)`
                            : `linear-gradient(
                ${overlayGradientRef.current.angle}deg,
                rgba(255, 255, 255, 0.0) 0%,
                rgba(255, 255, 255, ${overlayGradientRef.current.opacity1}) ${overlayGradientRef.current.stop1}%,
                rgba(255, 255, 255, ${overlayGradientRef.current.opacity2}) ${overlayGradientRef.current.stop2}%,
                rgba(255, 255, 255, 0.0) 100%
              )`,
                    }}
                />
            </span>

            {/* Hover effects */}
            {Boolean(onClick) && (
                <>
                    <div
                        style={{
                            ...borderPositionStyles,
                            height: glassSize.height,
                            width: glassSize.width,
                            borderRadius: `${cornerRadius}px`,
                            pointerEvents: "none",
                            transition: isDragging ? "none" : "transform 0.2s ease-out, opacity 0.2s ease-out",
                            opacity: isHovered || isActive ? 0.5 : 0,
                            backgroundImage: "radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 50%)",
                            mixBlendMode: "overlay",
                            overflow: "hidden",
                            clipPath: `inset(0 round ${cornerRadius}px)`,
                            WebkitClipPath: `inset(0 round ${cornerRadius}px)`,
                        }}
                    />
                    <div
                        style={{
                            ...borderPositionStyles,
                            height: glassSize.height,
                            width: glassSize.width,
                            borderRadius: `${cornerRadius}px`,
                            pointerEvents: "none",
                            transition: isDragging ? "none" : "transform 0.2s ease-out, opacity 0.2s ease-out",
                            opacity: isActive ? 0.5 : 0,
                            backgroundImage: "radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 80%)",
                            mixBlendMode: "overlay",
                            overflow: "hidden",
                            clipPath: `inset(0 round ${cornerRadius}px)`,
                            WebkitClipPath: `inset(0 round ${cornerRadius}px)`,
                        }}
                    />
                    <div
                        style={{
                            ...borderPositionStyles,
                            height: glassSize.height,
                            width: glassSize.width,
                            borderRadius: `${cornerRadius}px`,
                            pointerEvents: "none",
                            transition: isDragging ? "none" : "transform 0.2s ease-out, opacity 0.2s ease-out",
                            opacity: isHovered ? 0.4 : isActive ? 0.8 : 0,
                            backgroundImage: "radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 100%)",
                            mixBlendMode: "overlay",
                            overflow: "hidden",
                            clipPath: `inset(0 round ${cornerRadius}px)`,
                            WebkitClipPath: `inset(0 round ${cornerRadius}px)`,
                        }}
                    />
                </>
            )}
        </>
    );
}
