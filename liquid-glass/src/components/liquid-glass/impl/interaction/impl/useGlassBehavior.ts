/**
 * @fileoverview Composite hook orchestrating complete glass panel behavior.
 *
 * Combines sizing, positioning, and drag functionality into a single cohesive
 * interaction system. This hook acts as the main entry point for all glass
 * panel physics and user interaction capabilities.
 */

import { type ReactNode } from "react";
import { useGlassSize } from "./useGlassSize";
import { useGlassPosition } from "./useGlassPosition";
import { useGlassDrag } from "./useGlassDrag";

/**
 * Main glass behavior orchestration hook combining sizing, positioning, and drag functionality.
 *
 * Provides a unified interface for managing the complete lifecycle of glass panel interactions
 * including auto-sizing from content, viewport positioning, and drag-and-drop operations.
 * All constituent hooks are properly coordinated to maintain consistent state.
 *
 * @param width - Fixed width override, enables auto-sizing when omitted
 * @param height - Fixed height override, enables auto-sizing when omitted
 * @param padding - CSS padding applied to content measurement and final render
 * @param initialPosition - Starting coordinates, defaults to viewport center
 * @param draggable - Enable interactive drag behavior with mouse events
 * @param minWidth - Minimum width constraint for auto-sizing calculations
 * @param minHeight - Minimum height constraint for auto-sizing calculations
 * @param children - React content used for automatic size measurement
 *
 * @returns Object containing all panel state, refs, handlers, and control functions
 *
 * @example
 * ```tsx
 * const {
 *   glassSize,
 *   position,
 *   isDragging,
 *   measureRef,
 *   containerRef,
 *   handleMouseDown
 * } = useGlassBehavior({
 *   padding: "16px",
 *   draggable: true,
 *   children: <div>Panel content</div>
 * });
 * ```
 */
export function useGlassBehavior({ width, height, padding = "24px 32px", initialPosition, draggable = true, minWidth = 100, minHeight = 50, children }: { width?: number; height?: number; padding?: string; initialPosition?: { x?: number; y?: number }; draggable?: boolean; minWidth?: number; minHeight?: number; children?: ReactNode }) {
    const { glassSize, contentMeasured, measureRef, measureStyle, updateGlassSize } = useGlassSize({
        width,
        height,
        padding,
        minWidth,
        minHeight,
        children,
    });

    const { position, setPosition, constrainPos } = useGlassPosition({
        initialPosition,
        glassSize,
    });

    const { isDragging, containerRef, handleMouseDown, setIsDragging } = useGlassDrag({
        draggable,
        position,
        setPosition,
        constrainPos,
    });

    return {
        glassSize,
        position,
        isDragging,
        contentMeasured,
        measureRef,
        containerRef,
        measureStyle,
        handleMouseDown,
        setIsDragging,
        updateGlassSize,
    };
}
