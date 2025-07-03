import { useEffect, useRef, useState } from "react";
import { useGlassBehavior } from "./impl/hooks/useGlassBehavior";
import { useMouseTracking } from "./impl/hooks/useMouseTracking";
import { useElasticEffects } from "./impl/hooks/useElasticEffects";
import { GlassContainer } from "./impl/components/glass-container";
import type { Vec2 } from "./types";

export function LiquidGlass({
    width,
    height,
    padding = "24px 32px",
    initialPosition = { x: 0, y: 0 },
    draggable = true,
    minWidth = 100,
    minHeight = 100,
    children,
    globalMousePos: externalGlobalMousePos,
    mouseOffset: externalMouseOffset,
    mouseContainer = null,
    elasticity = 0.15,
    onClick,
    mode = "standard",
    className = "",
    overLight = false,
    blurAmount = 0.0625,
    saturation = 140,
    displacementScale = 25,
    aberrationIntensity = 2,
    cornerRadius = 16,
    border = true
}: {
    width?: number;
    height?: number;
    padding?: string;
    initialPosition?: Vec2;
    draggable?: boolean;
    minWidth?: number;
    minHeight?: number;
    children?: React.ReactNode;
    globalMousePos?: Vec2;
    mouseOffset?: Vec2;
    mouseContainer?: React.RefObject<HTMLElement | null> | null;
    elasticity?: number;
    onClick?: () => void;
    mode?: "standard" | "polar" | "prominent";
    className?: string;
    overLight?: boolean;
    blurAmount?: number;
    saturation?: number;
    displacementScale?: number;
    aberrationIntensity?: number;
    cornerRadius?: number;
    border?: boolean;
}) {
    const glassRef = useRef<HTMLDivElement>(null);
    
    const [isHovered, setIsHovered] = useState(false);
    const [isActive, setIsActive] = useState(false);

    const [internalGlobalMousePos, setInternalGlobalMousePos] = useState<Vec2>({
        x: 0,
        y: 0,
    });
    const [internalMouseOffset, setInternalMouseOffset] = useState<Vec2>({
        x: 0,
        y: 0,
    });

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

    const globalMousePos = externalGlobalMousePos ?? internalGlobalMousePos;
    const mouseOffset = externalMouseOffset ?? internalMouseOffset;

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

    const {
        handleMouseMove,
        rafIdRef,
    } = useMouseTracking({
        mouseContainer,
        borderGradientRef,
        overlayGradientRef,
        isDragging,
        setInternalMouseOffset,
        setInternalGlobalMousePos,
    });

    const {
        calculateDirectionalScale,
        calculateElasticTranslation,
    } = useElasticEffects({
        globalMousePos,
        glassSize,
        elasticity,
    });

    // Set up mouse tracking if no external mouse position is provided
    useEffect(() => {
        if (externalGlobalMousePos && externalMouseOffset) {
            return;
        }

        const container = mouseContainer?.current ?? glassRef.current;
        if (!container) {
            return;
        }

        const handleMouseMoveWithRef = (e: MouseEvent) => handleMouseMove(e, glassRef);
        container.addEventListener("mousemove", handleMouseMoveWithRef);

        return () => {
            container.removeEventListener("mousemove", handleMouseMoveWithRef);
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = undefined;
            }
        };
    }, [handleMouseMove, mouseContainer, externalGlobalMousePos, externalMouseOffset, rafIdRef]);

    const elasticTranslation = isDragging ? { x: 0, y: 0 } : calculateElasticTranslation(glassRef);
    const directionalScale = isDragging ? "scale(1)" : isActive && Boolean(onClick) ? "scale(0.96)" : calculateDirectionalScale(glassRef);

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
            <div className="relative glass">
                {/* Invisible measuring div for auto-sizing */}
                {children && (
                    <div ref={measureRef} style={measureStyle}>
                        <div style={{ padding }}>{children}</div>
                    </div>
                )}

                {/* Over light effect */}
                {border && overLight && (
                    <div
                        className="pointer-events-none bg-black opacity-20"
                        style={{
                            ...borderPositionStyles,
                            height: glassSize.height,
                            width: glassSize.width,
                            borderRadius: `${cornerRadius}px`,
                            pointerEvents: "none",
                            transition: isDragging ? "none" : "transform 0.15s ease-in-out",
                            overflow: "hidden",
                            clipPath: `inset(0 round ${cornerRadius}px)`,
                            WebkitClipPath: `inset(0 round ${cornerRadius}px)`,
                            willChange: "transform",
                        }}
                    />
                )}
                {border && overLight && (
                    <div
                        className="pointer-events-none bg-black opacity-100"
                        style={{
                            ...borderPositionStyles,
                            height: glassSize.height,
                            width: glassSize.width,
                            borderRadius: `${cornerRadius}px`,
                            pointerEvents: "none",
                            transition: isDragging ? "none" : "transform 0.15s ease-in-out",
                            overflow: "hidden",
                            clipPath: `inset(0 round ${cornerRadius}px)`,
                            WebkitClipPath: `inset(0 round ${cornerRadius}px)`,
                            willChange: "transform",
                        }}
                    />
                )}
                
                {/* Glass container with effects */}
                <GlassContainer
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
                </GlassContainer>

                {/* Border layer 1 - screen blend */}
                {border && (
                    <span className="border-layer-1" style={{
                            ...containerStyle,
                            zIndex: (containerStyle.zIndex as number) + 1,
                            pointerEvents: "none",
                            opacity: 0.2,
                            padding: "1.5px",
                            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                            WebkitMaskComposite: "xor",
                            maskComposite: "exclude",
                            boxShadow: "0 0 0 0.5px rgba(255, 255, 255, 0.5) inset, 0 1px 3px rgba(255, 255, 255, 0.25) inset, 0 1px 4px rgba(0, 0, 0, 0.35)",
                            borderRadius: `${cornerRadius}px`,
                            overflow: "hidden",
                            clipPath: `inset(0 round ${cornerRadius}px)`,
                            WebkitClipPath: `inset(0 round ${cornerRadius}px)`,
                            willChange: "transform",
                            transition: isDragging ? "none" : "transform 0.2s ease-out",
                        }}
                    >
                        <div style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: `${cornerRadius}px`,
                                backgroundImage: isDragging
                                    ? `linear-gradient(135deg, rgba(255, 255, 255, 0.0) 0%, rgba(255, 255, 255, 0.12) 33%, rgba(255, 255, 255, 0.4) 66%, rgba(255, 255, 255, 0.0) 100%)`
                                    : `linear-gradient(${borderGradientRef.current.angle}deg, rgba(255, 255, 255, 0.0) 0%, rgba(255, 255, 255, ${borderGradientRef.current.opacity1}) ${borderGradientRef.current.stop1}%, rgba(255, 255, 255, ${borderGradientRef.current.opacity2}) ${borderGradientRef.current.stop2}%, rgba(255, 255, 255, 0.0) 100%)`,
                            }}
                        />
                    </span>
                )}

                {/* Border layer 2 - overlay blend */}
                {border && (
                    <span className="border-layer-2" style={{
                            ...containerStyle,
                            zIndex: (containerStyle.zIndex as number) + 2,
                            pointerEvents: "none",
                            padding: "1.5px",
                            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                            WebkitMaskComposite: "xor",
                            maskComposite: "exclude",
                            boxShadow: "0 0 0 0.5px rgba(255, 255, 255, 0.5) inset, 0 1px 3px rgba(255, 255, 255, 0.25) inset, 0 1px 4px rgba(0, 0, 0, 0.35)",
                            borderRadius: `${cornerRadius}px`,
                            overflow: "hidden",
                            clipPath: `inset(0 round ${cornerRadius}px)`,
                            WebkitClipPath: `inset(0 round ${cornerRadius}px)`,
                            willChange: "transform",
                            transition: isDragging ? "none" : "transform 0.2s ease-out",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: `${cornerRadius}px`,
                                backgroundImage: isDragging
                                    ? `linear-gradient(135deg, rgba(255, 255, 255, 0.0) 0%, rgba(255, 255, 255, 0.32) 33%, rgba(255, 255, 255, 0.6) 66%, rgba(255, 255, 255, 0.0) 100%)`
                                    : `linear-gradient(${overlayGradientRef.current.angle}deg, rgba(255, 255, 255, 0.0) 0%, rgba(255, 255, 255, ${overlayGradientRef.current.opacity1}) ${overlayGradientRef.current.stop1}%, rgba(255, 255, 255, ${overlayGradientRef.current.opacity2}) ${overlayGradientRef.current.stop2}%, rgba(255, 255, 255, 0.0) 100%)`,
                            }}
                        />
                    </span>
                )}

                {/* Hover effects */}
                {border && Boolean(onClick) && (
                    <div
                        style={{
                            ...borderPositionStyles,
                            height: glassSize.height,
                            width: glassSize.width,
                            borderRadius: `${cornerRadius}px`,
                            pointerEvents: "none",
                            transition: isDragging ? "none" : "transform 0.2s ease-out, opacity 0.2s ease-out",
                            opacity: isHovered ? 0.6 : isActive ? 0.8 : 0,
                            backgroundImage: "radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 60%)",
                            overflow: "hidden",
                            clipPath: `inset(0 round ${cornerRadius}px)`,
                            WebkitClipPath: `inset(0 round ${cornerRadius}px)`,
                            willChange: "transform, opacity",
                        }}
                    />
                )}
            </div>
        </>
    )
}