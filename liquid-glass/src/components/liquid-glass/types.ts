/**
 * @fileoverview Type definitions for the liquid-glass component system.
 * 
 * Provides core geometric and positioning interfaces used throughout
 * the glassmorphism effect implementation for consistent type safety
 * and clear data structure definitions.
 */

/**
 * Two-dimensional vector representing coordinates or offsets in 2D space.
 * Used extensively for mouse tracking, positioning, and physics calculations.
 * 
 * @example
 * ```ts
 * const mousePos: Vec2 = { x: 150, y: 200 };
 * const velocity: Vec2 = { x: 0.5, y: -0.2 };
 * ```
 */
export interface Vec2 {
    /** Horizontal coordinate or offset in pixels */
    x: number;
    /** Vertical coordinate or offset in pixels */
    y: number;
}

/**
 * Dimensions interface for glass panel sizing operations.
 * Represents the calculated or fixed size of the glass container
 * after content measurement and constraint application.
 * 
 * @example
 * ```ts
 * const size: IGlassSize = { width: 300, height: 200 };
 * ```
 */
export interface IGlassSize {
    /** Panel width in pixels */
    width: number;
    /** Panel height in pixels */
    height: number;
}

/**
 * Position state interface combining coordinates with centering mode.
 * Tracks both absolute positioning and whether the panel should
 * auto-center within the viewport.
 * 
 * @example
 * ```ts
 * const centered: IGlassPosition = { x: 0, y: 0, centered: true };
 * const absolute: IGlassPosition = { x: 100, y: 50, centered: false };
 * ```
 */
export interface IGlassPosition {
    /** Horizontal position in pixels (ignored when centered) */
    x: number;
    /** Vertical position in pixels (ignored when centered) */
    y: number;
    /** Whether panel should auto-center in viewport */
    centered: boolean;
}
