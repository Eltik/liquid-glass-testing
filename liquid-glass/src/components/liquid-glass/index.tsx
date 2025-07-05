import { useEffect, useRef, useState, useCallback } from "react";
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
    const cssVarsRef = useRef<Record<string, string>>({});
    const rafUpdateRef = useRef<number | undefined>(undefined);
    
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

    // CSS variables update function
    const updateCSSVariables = useCallback((vars: Record<string, string>) => {
        const element = glassRef.current;
        if (!element) return;
        
        // Only update changed variables
        Object.entries(vars).forEach(([key, value]) => {
            if (cssVarsRef.current[key] !== value) {
                element.style.setProperty(key, value);
                cssVarsRef.current[key] = value;
            }
        });
    }, []);

    // RAF-based style updates
    const scheduleStyleUpdate = useCallback((vars: Record<string, string>) => {
        if (rafUpdateRef.current !== undefined) {
            cancelAnimationFrame(rafUpdateRef.current);
        }
        
        rafUpdateRef.current = requestAnimationFrame(() => {
            updateCSSVariables(vars);
            rafUpdateRef.current = undefined;
        });
    }, [updateCSSVariables]);

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
            if (rafUpdateRef.current !== undefined) {
                cancelAnimationFrame(rafUpdateRef.current);
                rafUpdateRef.current = undefined;
            }
        };
    }, [handleMouseMove, mouseContainer, externalGlobalMousePos, externalMouseOffset, rafIdRef]);

    // Update CSS variables for transforms and other dynamic values
    useEffect(() => {
        const elasticTranslation = isDragging ? { x: 0, y: 0 } : calculateElasticTranslation(glassRef);
        const directionalScale = isDragging ? "scale(1)" : isActive && Boolean(onClick) ? "scale(0.96)" : calculateDirectionalScale(glassRef);
        
        const vars: Record<string, string> = {
            '--liquid-glass-translate-x': `${elasticTranslation.x}px`,
            '--liquid-glass-translate-y': `${elasticTranslation.y}px`,
            '--liquid-glass-pos-x': `${position.x}px`,
            '--liquid-glass-pos-y': `${position.y}px`,
            '--liquid-glass-width': `${glassSize.width}px`,
            '--liquid-glass-height': `${glassSize.height}px`,
            '--liquid-glass-corner-radius': `${cornerRadius}px`,
            '--liquid-glass-gradient-angle': `${borderGradientRef.current.angle}deg`,
            '--liquid-glass-border-opacity1': `${borderGradientRef.current.opacity1}`,
            '--liquid-glass-border-opacity2': `${borderGradientRef.current.opacity2}`,
            '--liquid-glass-border-stop1': `${borderGradientRef.current.stop1}%`,
            '--liquid-glass-border-stop2': `${borderGradientRef.current.stop2}%`,
            '--liquid-glass-overlay-opacity1': `${overlayGradientRef.current.opacity1}`,
            '--liquid-glass-overlay-opacity2': `${overlayGradientRef.current.opacity2}`,
            '--liquid-glass-overlay-stop1': `${overlayGradientRef.current.stop1}%`,
            '--liquid-glass-overlay-stop2': `${overlayGradientRef.current.stop2}%`,
            '--liquid-glass-hover-opacity': isHovered ? '0.6' : isActive ? '0.8' : '0',
            '--liquid-glass-cursor': draggable ? (isDragging ? "grabbing" : "grab") : "default",
            '--liquid-glass-transition': isDragging ? "none" : "transform 0.15s ease-in-out",
        };
        
        // Parse scale values
        const scaleRegex = /scaleX\(([^)]+)\)\s*scaleY\(([^)]+)\)/;
        const scaleMatch = scaleRegex.exec(directionalScale);
        if (scaleMatch) {
            vars['--liquid-glass-scale-x'] = scaleMatch[1] ?? '1';
            vars['--liquid-glass-scale-y'] = scaleMatch[2] ?? '1';
        } else {
            vars['--liquid-glass-scale-x'] = '1';
            vars['--liquid-glass-scale-y'] = '1';
        }
        
        scheduleStyleUpdate(vars);
    }, [calculateElasticTranslation, calculateDirectionalScale, position, glassSize, cornerRadius, isHovered, isActive, isDragging, draggable, scheduleStyleUpdate, onClick]);

    const borderPositionStyles: React.CSSProperties = {
        position: "fixed",
        transform: position.centered 
            ? 'translate3d(calc(50vw - 50% + var(--liquid-glass-translate-x)), calc(50vh - 50% + var(--liquid-glass-translate-y)), 0) scale(var(--liquid-glass-scale-x), var(--liquid-glass-scale-y))'
            : isDragging 
                ? 'translate3d(var(--liquid-glass-pos-x), var(--liquid-glass-pos-y), 0)'
                : 'translate3d(calc(var(--liquid-glass-pos-x) + var(--liquid-glass-translate-x)), calc(var(--liquid-glass-pos-y) + var(--liquid-glass-translate-y)), 0) scale(var(--liquid-glass-scale-x), var(--liquid-glass-scale-y))',
        zIndex: 10000,
    };

    const containerStyle: React.CSSProperties = {
        width: 'var(--liquid-glass-width)',
        height: 'var(--liquid-glass-height)',
        cursor: 'var(--liquid-glass-cursor)',
        pointerEvents: "auto",
        position: "fixed",
        transform: position.centered 
            ? 'translate3d(calc(50vw - 50% + var(--liquid-glass-translate-x)), calc(50vh - 50% + var(--liquid-glass-translate-y)), 0) scale(var(--liquid-glass-scale-x), var(--liquid-glass-scale-y))'
            : isDragging 
                ? 'translate3d(var(--liquid-glass-pos-x), var(--liquid-glass-pos-y), 0)'
                : 'translate3d(calc(var(--liquid-glass-pos-x) + var(--liquid-glass-translate-x)), calc(var(--liquid-glass-pos-y) + var(--liquid-glass-translate-y)), 0) scale(var(--liquid-glass-scale-x), var(--liquid-glass-scale-y))',
        zIndex: 9999,
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
                            height: 'var(--liquid-glass-height)',
                            width: 'var(--liquid-glass-width)',
                            borderRadius: 'var(--liquid-glass-corner-radius)',
                            pointerEvents: "none",
                            transition: 'var(--liquid-glass-transition)',
                            overflow: "hidden",
                            clipPath: 'inset(0 round var(--liquid-glass-corner-radius))',
                            WebkitClipPath: 'inset(0 round var(--liquid-glass-corner-radius))',
                            willChange: "transform",
                        }}
                    />
                )}
                {border && overLight && (
                    <div
                        className="pointer-events-none bg-black opacity-100"
                        style={{
                            ...borderPositionStyles,
                            height: 'var(--liquid-glass-height)',
                            width: 'var(--liquid-glass-width)',
                            borderRadius: 'var(--liquid-glass-corner-radius)',
                            pointerEvents: "none",
                            transition: 'var(--liquid-glass-transition)',
                            overflow: "hidden",
                            clipPath: 'inset(0 round var(--liquid-glass-corner-radius))',
                            WebkitClipPath: 'inset(0 round var(--liquid-glass-corner-radius))',
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
                            zIndex: 10000,
                            pointerEvents: "none",
                            opacity: 0.2,
                            padding: "1.5px",
                            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                            WebkitMaskComposite: "xor",
                            maskComposite: "exclude",
                            boxShadow: "0 0 0 0.5px rgba(255, 255, 255, 0.5) inset, 0 1px 3px rgba(255, 255, 255, 0.25) inset, 0 1px 4px rgba(0, 0, 0, 0.35)",
                            borderRadius: 'var(--liquid-glass-corner-radius)',
                            overflow: "hidden",
                            clipPath: 'inset(0 round var(--liquid-glass-corner-radius))',
                            WebkitClipPath: 'inset(0 round var(--liquid-glass-corner-radius))',
                            willChange: "transform",
                            transition: isDragging ? "none" : "transform 0.2s ease-out",
                        }}
                    >
                        <div style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: 'var(--liquid-glass-corner-radius)',
                                backgroundImage: isDragging
                                    ? `linear-gradient(135deg, rgba(255, 255, 255, 0.0) 0%, rgba(255, 255, 255, 0.12) 33%, rgba(255, 255, 255, 0.4) 66%, rgba(255, 255, 255, 0.0) 100%)`
                                    : `linear-gradient(var(--liquid-glass-gradient-angle), rgba(255, 255, 255, 0.0) 0%, rgba(255, 255, 255, var(--liquid-glass-border-opacity1)) var(--liquid-glass-border-stop1), rgba(255, 255, 255, var(--liquid-glass-border-opacity2)) var(--liquid-glass-border-stop2), rgba(255, 255, 255, 0.0) 100%)`,
                            }}
                        />
                    </span>
                )}

                {/* Border layer 2 - overlay blend */}
                {border && (
                    <span className="border-layer-2" style={{
                            ...containerStyle,
                            zIndex: 10001,
                            pointerEvents: "none",
                            padding: "1.5px",
                            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                            WebkitMaskComposite: "xor",
                            maskComposite: "exclude",
                            boxShadow: "0 0 0 0.5px rgba(255, 255, 255, 0.5) inset, 0 1px 3px rgba(255, 255, 255, 0.25) inset, 0 1px 4px rgba(0, 0, 0, 0.35)",
                            borderRadius: 'var(--liquid-glass-corner-radius)',
                            overflow: "hidden",
                            clipPath: 'inset(0 round var(--liquid-glass-corner-radius))',
                            WebkitClipPath: 'inset(0 round var(--liquid-glass-corner-radius))',
                            willChange: "transform",
                            transition: isDragging ? "none" : "transform 0.2s ease-out",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: 'var(--liquid-glass-corner-radius)',
                                backgroundImage: isDragging
                                    ? `linear-gradient(135deg, rgba(255, 255, 255, 0.0) 0%, rgba(255, 255, 255, 0.32) 33%, rgba(255, 255, 255, 0.6) 66%, rgba(255, 255, 255, 0.0) 100%)`
                                    : `linear-gradient(var(--liquid-glass-gradient-angle), rgba(255, 255, 255, 0.0) 0%, rgba(255, 255, 255, var(--liquid-glass-overlay-opacity1)) var(--liquid-glass-overlay-stop1), rgba(255, 255, 255, var(--liquid-glass-overlay-opacity2)) var(--liquid-glass-overlay-stop2), rgba(255, 255, 255, 0.0) 100%)`,
                            }}
                        />
                    </span>
                )}

                {/* Hover effects */}
                {border && Boolean(onClick) && (
                    <div
                        style={{
                            ...borderPositionStyles,
                            height: 'var(--liquid-glass-height)',
                            width: 'var(--liquid-glass-width)',
                            borderRadius: 'var(--liquid-glass-corner-radius)',
                            pointerEvents: "none",
                            transition: isDragging ? "none" : "transform 0.2s ease-out, opacity 0.2s ease-out",
                            opacity: 'var(--liquid-glass-hover-opacity)',
                            backgroundImage: "radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 60%)",
                            overflow: "hidden",
                            clipPath: 'inset(0 round var(--liquid-glass-corner-radius))',
                            WebkitClipPath: 'inset(0 round var(--liquid-glass-corner-radius))',
                            willChange: "transform, opacity",
                        }}
                    />
                )}
            </div>
        </>
    )
}