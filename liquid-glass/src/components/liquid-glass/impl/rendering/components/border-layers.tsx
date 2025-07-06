/**
 * @fileoverview Multi-layer border rendering system for enhanced glassmorphism visual effects.
 * 
 * Implements sophisticated border layer composition using CSS masks, gradients, and blend modes
 * to create realistic glass edge effects. Provides dynamic gradient adjustments based on
 * mouse position and interaction states for immersive visual feedback.
 */

import React from "react";

/**
 * Props interface for BorderLayers component configuration.
 * 
 * Defines all properties required for multi-layer border rendering including
 * positioning styles, interaction states, and visual mode configurations.
 */
interface BorderLayersProps {
    /** Enable/disable border layer rendering */
    border: boolean;
    /** Optimize styling for light background environments */
    overLight: boolean;
    /** CSS positioning and transform styles for border overlay positioning */
    borderPositionStyles: React.CSSProperties;
    /** Container styles for border layer dimensions and basic positioning */
    containerStyle: React.CSSProperties;
    /** Current drag interaction state affecting transition behavior */
    isDragging: boolean;
    /** Optional click handler enabling hover effect layers */
    onClick?: () => void;
}

/**
 * Multi-layer border rendering component with dynamic gradients and blend modes.
 * 
 * Creates sophisticated glassmorphism borders using multiple overlay layers with
 * different blend modes, CSS masks, and dynamic gradients. Supports light/dark
 * background optimization and interactive hover effects. Uses CSS variables
 * for smooth gradient animations based on mouse position.
 * 
 * Layer composition:
 * - Over-light background layers (conditional)
 * - Screen blend mode border layer with CSS mask
 * - Overlay blend mode border layer with enhanced gradients
 * - Interactive hover effect layer (when onClick provided)
 * 
 * @param border - Controls overall border rendering visibility
 * @param overLight - Enables optimized styling for light backgrounds
 * @param borderPositionStyles - Positioning and transform styles for border overlays
 * @param containerStyle - Base container styling for dimensions and positioning
 * @param isDragging - Disables transitions during drag operations for smooth performance
 * @param onClick - Optional click handler that enables hover effect rendering
 * @returns Multi-layer border composition or null when disabled
 * 
 * @example
 * ```tsx
 * <BorderLayers
 *   border={true}
 *   overLight={false}
 *   borderPositionStyles={{ transform: 'translate3d(100px, 50px, 0)' }}
 *   containerStyle={{ width: '300px', height: '150px' }}
 *   isDragging={false}
 *   onClick={() => handleClick()}
 * />
 * ```
 */
export function BorderLayers({ border, overLight, borderPositionStyles, containerStyle, isDragging, onClick }: BorderLayersProps) {
    if (!border) return null;

    return (
        <>
            {/* Over light effect */}
            {overLight && (
                <>
                    <div
                        className="pointer-events-none bg-black opacity-20"
                        style={{
                            ...borderPositionStyles,
                            height: "var(--liquid-glass-height)",
                            width: "var(--liquid-glass-width)",
                            borderRadius: "var(--liquid-glass-corner-radius)",
                            pointerEvents: "none",
                            transition: "var(--liquid-glass-transition)",
                            overflow: "hidden",
                            clipPath: "inset(0 round var(--liquid-glass-corner-radius))",
                            WebkitClipPath: "inset(0 round var(--liquid-glass-corner-radius))",
                            willChange: "transform",
                        }}
                    />
                    <div
                        className="pointer-events-none bg-black opacity-100"
                        style={{
                            ...borderPositionStyles,
                            height: "var(--liquid-glass-height)",
                            width: "var(--liquid-glass-width)",
                            borderRadius: "var(--liquid-glass-corner-radius)",
                            pointerEvents: "none",
                            transition: "var(--liquid-glass-transition)",
                            overflow: "hidden",
                            clipPath: "inset(0 round var(--liquid-glass-corner-radius))",
                            WebkitClipPath: "inset(0 round var(--liquid-glass-corner-radius))",
                            willChange: "transform",
                        }}
                    />
                </>
            )}

            {/* Border layer 1 - screen blend */}
            <span
                className="border-layer-1"
                style={{
                    ...containerStyle,
                    zIndex: 10000,
                    pointerEvents: "none",
                    opacity: 0.2,
                    padding: "1.5px",
                    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    boxShadow: "0 0 0 0.5px rgba(255, 255, 255, 0.5) inset, 0 1px 3px rgba(255, 255, 255, 0.25) inset, 0 1px 4px rgba(0, 0, 0, 0.35)",
                    borderRadius: "var(--liquid-glass-corner-radius)",
                    overflow: "hidden",
                    clipPath: "inset(0 round var(--liquid-glass-corner-radius))",
                    WebkitClipPath: "inset(0 round var(--liquid-glass-corner-radius))",
                    willChange: "transform",
                    transition: isDragging ? "none" : "transform 0.2s ease-out",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "var(--liquid-glass-corner-radius)",
                        backgroundImage: isDragging ? `linear-gradient(135deg, rgba(255, 255, 255, 0.0) 0%, rgba(255, 255, 255, 0.12) 33%, rgba(255, 255, 255, 0.4) 66%, rgba(255, 255, 255, 0.0) 100%)` : `linear-gradient(var(--liquid-glass-gradient-angle), rgba(255, 255, 255, 0.0) 0%, rgba(255, 255, 255, var(--liquid-glass-border-opacity1)) var(--liquid-glass-border-stop1), rgba(255, 255, 255, var(--liquid-glass-border-opacity2)) var(--liquid-glass-border-stop2), rgba(255, 255, 255, 0.0) 100%)`,
                    }}
                />
            </span>

            {/* Border layer 2 - overlay blend */}
            <span
                className="border-layer-2"
                style={{
                    ...containerStyle,
                    zIndex: 10001,
                    pointerEvents: "none",
                    padding: "1.5px",
                    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    boxShadow: "0 0 0 0.5px rgba(255, 255, 255, 0.5) inset, 0 1px 3px rgba(255, 255, 255, 0.25) inset, 0 1px 4px rgba(0, 0, 0, 0.35)",
                    borderRadius: "var(--liquid-glass-corner-radius)",
                    overflow: "hidden",
                    clipPath: "inset(0 round var(--liquid-glass-corner-radius))",
                    WebkitClipPath: "inset(0 round var(--liquid-glass-corner-radius))",
                    willChange: "transform",
                    transition: isDragging ? "none" : "transform 0.2s ease-out",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "var(--liquid-glass-corner-radius)",
                        backgroundImage: isDragging ? `linear-gradient(135deg, rgba(255, 255, 255, 0.0) 0%, rgba(255, 255, 255, 0.32) 33%, rgba(255, 255, 255, 0.6) 66%, rgba(255, 255, 255, 0.0) 100%)` : `linear-gradient(var(--liquid-glass-gradient-angle), rgba(255, 255, 255, 0.0) 0%, rgba(255, 255, 255, var(--liquid-glass-overlay-opacity1)) var(--liquid-glass-overlay-stop1), rgba(255, 255, 255, var(--liquid-glass-overlay-opacity2)) var(--liquid-glass-overlay-stop2), rgba(255, 255, 255, 0.0) 100%)`,
                    }}
                />
            </span>

            {/* Hover effects */}
            {Boolean(onClick) && (
                <div
                    style={{
                        ...borderPositionStyles,
                        height: "var(--liquid-glass-height)",
                        width: "var(--liquid-glass-width)",
                        borderRadius: "var(--liquid-glass-corner-radius)",
                        pointerEvents: "none",
                        transition: isDragging ? "none" : "transform 0.2s ease-out, opacity 0.2s ease-out",
                        opacity: "var(--liquid-glass-hover-opacity)",
                        backgroundImage: "radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 60%)",
                        overflow: "hidden",
                        clipPath: "inset(0 round var(--liquid-glass-corner-radius))",
                        WebkitClipPath: "inset(0 round var(--liquid-glass-corner-radius))",
                        willChange: "transform, opacity",
                    }}
                />
            )}
        </>
    );
}
