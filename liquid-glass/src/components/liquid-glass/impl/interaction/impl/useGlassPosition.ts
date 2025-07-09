/**
 * @fileoverview Position management system for glass panels with viewport constraint handling.
 *
 * Provides comprehensive position state management including centered and absolute positioning
 * modes, viewport boundary constraints, and responsive resize handling. Automatically
 * maintains panel position within viewport bounds while preserving user preferences.
 */

import { useCallback, useEffect, useState } from "react";
import type { IGlassPosition, IGlassSize } from "../../../types";
import { constrainPosition } from "../../layout/impl/utils";

/**
 * Advanced position management hook with viewport constraints and resize handling.
 *
 * Manages glass panel positioning with support for both centered and absolute positioning
 * modes. Automatically handles viewport boundary constraints, window resize events, and
 * smooth transitions between positioning modes. Provides optimized constraint calculations
 * with configurable boundary offsets.
 *
 * Features:
 * - Automatic centering mode when no initial position is provided
 * - Viewport boundary constraints with configurable offsets
 * - Responsive resize handling to maintain constraints
 * - Smooth transitions between centered and absolute positioning
 * - Optimized constraint calculations with memoization
 *
 * @param initialPosition - Starting position coordinates, enables centering if omitted
 * @param glassSize - Current panel dimensions for constraint calculations
 * @returns Object containing position state, setter, and constraint function
 *
 * @example
 * ```tsx
 * const { position, setPosition, constrainPos } = useGlassPosition({
 *   initialPosition: { x: 100, y: 200 },
 *   glassSize: { width: 300, height: 150 }
 * });
 * ```
 */
export function useGlassPosition({ initialPosition, glassSize }: { initialPosition?: { x?: number; y?: number }; glassSize: IGlassSize }) {
    const [position, setPosition] = useState<IGlassPosition>({
        x: initialPosition?.x ?? 0,
        y: initialPosition?.y ?? 0,
        centered: !initialPosition || (initialPosition.x === undefined && initialPosition.y === undefined),
    });

    /** Viewport boundary offset in pixels to prevent edge clipping */
    const offset = 10;

    /**
     * Memoized constraint function for viewport boundary enforcement.
     *
     * Wraps the utility constrainPosition function with current glass dimensions
     * and boundary offset. Recalculates only when dimensions change to optimize
     * performance during frequent position updates.
     *
     * @param x - Target horizontal position in pixels
     * @param y - Target vertical position in pixels
     * @returns Constrained coordinates ensuring panel stays within viewport bounds
     */
    const constrainPos = useCallback((x: number, y: number) => constrainPosition(x, y, glassSize.width, glassSize.height, offset), [glassSize.width, glassSize.height, offset]);

    /**
     * Window resize effect to maintain position constraints.
     *
     * Automatically adjusts panel position when viewport dimensions change to
     * ensure the panel remains fully visible. Only applies constraints when
     * panel is in absolute positioning mode (not centered).
     */
    useEffect(() => {
        const handleResize = () => {
            if (!position.centered) {
                const constrained = constrainPos(position.x, position.y);
                if (position.x !== constrained.x || position.y !== constrained.y) {
                    setPosition({
                        x: constrained.x,
                        y: constrained.y,
                        centered: false,
                    });
                }
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [position, constrainPos]);

    return {
        position,
        setPosition,
        constrainPos,
    };
}
