/**
 * @fileoverview Main entry point for the LiquidGlass component - a high-performance glassmorphism 
 * effect system with WebGL-accelerated displacement mapping, elastic physics, and advanced visual effects.
 * 
 * This module orchestrates the complete liquid glass rendering pipeline including:
 * - Interactive drag behavior with viewport constraints
 * - Real-time elastic physics and directional scaling
 * - GPU-accelerated displacement mapping with chromatic aberration
 * - Dynamic CSS variable management for smooth animations
 * - Multi-layered border rendering with gradient effects
 * 
 * The component uses a modular architecture with specialized hooks for interaction,
 * layout management, and rendering optimizations to maintain 60fps performance.
 */

import { useEffect, useRef, useState } from "react";
import { useGlassBehavior } from "./impl/interaction/impl/useGlassBehavior";
import { useMouseTracking } from "./impl/interaction/impl/useMouseTracking";
import { useElasticEffects } from "./impl/interaction/impl/useElasticEffects";
import { useCSSVariables } from "./impl/layout/impl/useCSSVariables";
import { GlassContainer } from "./impl/rendering/components/glass-container";
import { BorderLayers } from "./impl/rendering/components/border-layers";
import type { Vec2 } from "./types";

/**
 * Advanced glassmorphism component with physics-based interactions and WebGL acceleration.
 * 
 * Creates a translucent, interactive glass panel with:
 * - Realistic elastic physics responding to mouse proximity
 * - GPU-accelerated visual distortion effects
 * - Smooth drag-and-drop functionality with boundary constraints
 * - Dynamic gradient borders and hover effects
 * - Multiple visual modes (standard, polar, prominent)
 * 
 * Performance optimized for 60fps with RAF-based updates and CSS variable caching.
 * Supports both controlled and uncontrolled mouse tracking modes.
 * 
 * @param width - Fixed width in pixels, auto-calculated from content if omitted
 * @param height - Fixed height in pixels, auto-calculated from content if omitted  
 * @param padding - CSS padding string applied to content area (default: "24px 32px")
 * @param initialPosition - Starting position {x, y}, centered if omitted
 * @param draggable - Enable drag functionality (default: true)
 * @param minWidth - Minimum width constraint for auto-sizing (default: 100)
 * @param minHeight - Minimum height constraint for auto-sizing (default: 100)
 * @param children - React content to render inside the glass panel
 * @param globalMousePos - External mouse position for controlled mode
 * @param mouseOffset - External mouse offset for controlled mode
 * @param mouseContainer - Ref to container for mouse tracking scope
 * @param elasticity - Physics response intensity 0-1 (default: 0.15)
 * @param onClick - Click handler, enables hover effects when provided
 * @param mode - Visual distortion mode: "standard" | "polar" | "prominent" (default: "standard")
 * @param className - Additional CSS classes for glass container
 * @param overLight - Optimized styling for light backgrounds (default: false)
 * @param blurAmount - Backdrop blur intensity 0-1 (default: 0.0625)
 * @param saturation - Color saturation percentage (default: 140)
 * @param displacementScale - WebGL distortion intensity (default: 25)
 * @param aberrationIntensity - Chromatic aberration strength (default: 2)
 * @param cornerRadius - Border radius in pixels (default: 16)
 * @param border - Enable multi-layer border rendering (default: true)
 * 
 * @throws {Error} When WebGL initialization fails in shader modes
 * 
 * @example
 * ```tsx
 * <LiquidGlass
 *   mode="polar"
 *   elasticity={0.3}
 *   onClick={() => console.log('Glass clicked')}
 *   displacementScale={40}
 * >
 *   <h2>Interactive Content</h2>
 *   <p>This content responds to mouse proximity</p>
 * </LiquidGlass>
 * ```
 */
export function LiquidGlass({ width, height, padding = "24px 32px", initialPosition = { x: 0, y: 0 }, draggable = true, minWidth = 100, minHeight = 100, children, globalMousePos: externalGlobalMousePos, mouseOffset: externalMouseOffset, mouseContainer = null, elasticity = 0.15, onClick, mode = "standard", className = "", overLight = false, blurAmount = 0.0625, saturation = 140, displacementScale = 25, aberrationIntensity = 2, cornerRadius = 16, border = true }: { width?: number; height?: number; padding?: string; initialPosition?: Vec2; draggable?: boolean; minWidth?: number; minHeight?: number; children?: React.ReactNode; globalMousePos?: Vec2; mouseOffset?: Vec2; mouseContainer?: React.RefObject<HTMLElement | null> | null; elasticity?: number; onClick?: () => void; mode?: "standard" | "polar" | "prominent"; className?: string; overLight?: boolean; blurAmount?: number; saturation?: number; displacementScale?: number; aberrationIntensity?: number; cornerRadius?: number; border?: boolean }) {
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

    /**
     * Mouse position resolution - external props take precedence over internal tracking
     * This enables both controlled and uncontrolled interaction modes
     */
    const globalMousePos = externalGlobalMousePos ?? internalGlobalMousePos;
    const mouseOffset = externalMouseOffset ?? internalMouseOffset;

    const { scheduleStyleUpdate, cleanup } = useCSSVariables();

    /**
     * Border gradient configuration for dynamic visual effects
     * These refs maintain state between renders for smooth gradient transitions
     */
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

    const { handleMouseMove, rafIdRef } = useMouseTracking({
        mouseContainer,
        borderGradientRef,
        overlayGradientRef,
        isDragging,
        setInternalMouseOffset,
        setInternalGlobalMousePos,
    });

    const { calculateDirectionalScale, calculateElasticTranslation } = useElasticEffects({
        globalMousePos,
        glassSize,
        elasticity,
    });

    /**
     * Initialize mouse tracking when in uncontrolled mode
     * Automatically attaches listeners and manages cleanup for optimal performance
     * Only activates when external mouse props are not provided
     */
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
            cleanup();
        };
    }, [handleMouseMove, mouseContainer, externalGlobalMousePos, externalMouseOffset, rafIdRef, cleanup]);

    /**
     * Dynamic CSS variable management system
     * Updates all transform and visual properties through CSS variables for optimal performance
     * Handles elastic physics, positioning, scaling, gradients, and interaction states
     */
    useEffect(() => {
        const elasticTranslation = isDragging ? { x: 0, y: 0 } : calculateElasticTranslation(glassRef);
        const directionalScale = isDragging ? "scale(1)" : isActive && Boolean(onClick) ? "scale(0.96)" : calculateDirectionalScale(glassRef);

        const vars: Record<string, string> = {
            "--liquid-glass-translate-x": `${elasticTranslation.x}px`,
            "--liquid-glass-translate-y": `${elasticTranslation.y}px`,
            "--liquid-glass-pos-x": `${position.x}px`,
            "--liquid-glass-pos-y": `${position.y}px`,
            "--liquid-glass-width": `${glassSize.width}px`,
            "--liquid-glass-height": `${glassSize.height}px`,
            "--liquid-glass-corner-radius": `${cornerRadius}px`,
            "--liquid-glass-gradient-angle": `${borderGradientRef.current.angle}deg`,
            "--liquid-glass-border-opacity1": `${borderGradientRef.current.opacity1}`,
            "--liquid-glass-border-opacity2": `${borderGradientRef.current.opacity2}`,
            "--liquid-glass-border-stop1": `${borderGradientRef.current.stop1}%`,
            "--liquid-glass-border-stop2": `${borderGradientRef.current.stop2}%`,
            "--liquid-glass-overlay-opacity1": `${overlayGradientRef.current.opacity1}`,
            "--liquid-glass-overlay-opacity2": `${overlayGradientRef.current.opacity2}`,
            "--liquid-glass-overlay-stop1": `${overlayGradientRef.current.stop1}%`,
            "--liquid-glass-overlay-stop2": `${overlayGradientRef.current.stop2}%`,
            "--liquid-glass-hover-opacity": isHovered ? "0.6" : isActive ? "0.8" : "0",
            "--liquid-glass-cursor": draggable ? (isDragging ? "grabbing" : "grab") : "default",
            "--liquid-glass-transition": isDragging ? "none" : "transform 0.15s ease-in-out",
        };

        /**
         * Extract individual scale components from compound transform string
         * Handles both scaleX/scaleY format and fallback to uniform scaling
         */
        const scaleRegex = /scaleX\(([^)]+)\)\s*scaleY\(([^)]+)\)/;
        const scaleMatch = scaleRegex.exec(directionalScale);
        if (scaleMatch) {
            vars["--liquid-glass-scale-x"] = scaleMatch[1] ?? "1";
            vars["--liquid-glass-scale-y"] = scaleMatch[2] ?? "1";
        } else {
            vars["--liquid-glass-scale-x"] = "1";
            vars["--liquid-glass-scale-y"] = "1";
        }

        if (glassRef.current) {
            scheduleStyleUpdate(glassRef.current, vars);
        }
    }, [calculateElasticTranslation, calculateDirectionalScale, position, glassSize, cornerRadius, isHovered, isActive, isDragging, draggable, scheduleStyleUpdate, onClick]);

    /**
     * Positioning styles for border overlay elements
     * Higher z-index ensures borders render above main glass container
     */
    const borderPositionStyles: React.CSSProperties = {
        position: "fixed",
        transform: position.centered ? "translate3d(calc(50vw - 50% + var(--liquid-glass-translate-x)), calc(50vh - 50% + var(--liquid-glass-translate-y)), 0) scale(var(--liquid-glass-scale-x), var(--liquid-glass-scale-y))" : isDragging ? "translate3d(var(--liquid-glass-pos-x), var(--liquid-glass-pos-y), 0)" : "translate3d(calc(var(--liquid-glass-pos-x) + var(--liquid-glass-translate-x)), calc(var(--liquid-glass-pos-y) + var(--liquid-glass-translate-y)), 0) scale(var(--liquid-glass-scale-x), var(--liquid-glass-scale-y))",
        zIndex: 10000,
    };

    /**
     * Main container positioning and sizing styles
     * Uses CSS variables for smooth property updates without re-renders
     */
    const containerStyle: React.CSSProperties = {
        width: "var(--liquid-glass-width)",
        height: "var(--liquid-glass-height)",
        cursor: "var(--liquid-glass-cursor)",
        pointerEvents: "auto",
        position: "fixed",
        transform: position.centered ? "translate3d(calc(50vw - 50% + var(--liquid-glass-translate-x)), calc(50vh - 50% + var(--liquid-glass-translate-y)), 0) scale(var(--liquid-glass-scale-x), var(--liquid-glass-scale-y))" : isDragging ? "translate3d(var(--liquid-glass-pos-x), var(--liquid-glass-pos-y), 0)" : "translate3d(calc(var(--liquid-glass-pos-x) + var(--liquid-glass-translate-x)), calc(var(--liquid-glass-pos-y) + var(--liquid-glass-translate-y)), 0) scale(var(--liquid-glass-scale-x), var(--liquid-glass-scale-y))",
        zIndex: 9999,
    };

    return (
        <>
            <div className="glass relative">
                {children && (
                    <div ref={measureRef} style={measureStyle}>
                        <div style={{ padding }}>{children}</div>
                    </div>
                )}

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

                <BorderLayers border={border} overLight={overLight} borderPositionStyles={borderPositionStyles} containerStyle={containerStyle} isDragging={isDragging} onClick={onClick} />
            </div>
        </>
    );
}
