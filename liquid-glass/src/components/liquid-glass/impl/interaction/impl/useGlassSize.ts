/**
 * @fileoverview Intelligent glass panel sizing system with automatic content measurement.
 *
 * Provides sophisticated auto-sizing capabilities that dynamically calculate optimal
 * panel dimensions based on content measurement, padding constraints, and minimum
 * size requirements. Includes ResizeObserver integration for responsive updates
 * and performance optimizations to prevent excessive recalculations.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { IGlassSize } from "../../../types";
import { getPaddingValues } from "../../layout/impl/utils";

/**
 * Advanced glass panel sizing hook with automatic content measurement and constraints.
 *
 * Dynamically calculates optimal panel dimensions based on content size, padding
 * requirements, and minimum size constraints. Uses ResizeObserver for responsive
 * content changes and includes intelligent caching to prevent unnecessary updates.
 * Supports both fixed sizing and automatic content-based sizing modes.
 *
 * Features:
 * - Automatic content measurement with padding calculations
 * - ResizeObserver integration for responsive content changes
 * - Debounced updates to prevent excessive recalculations
 * - Minimum size constraints with configurable thresholds
 * - Invisible measuring element for accurate size detection
 * - Graceful fallback for browsers without ResizeObserver
 *
 * @param width - Fixed width override, enables auto-sizing when omitted
 * @param height - Fixed height override, enables auto-sizing when omitted
 * @param padding - CSS padding string for content spacing calculations
 * @param minWidth - Minimum width constraint for auto-sizing
 * @param minHeight - Minimum height constraint for auto-sizing
 * @param children - React content used for automatic size measurement
 * @returns Object containing size state, measurement refs, and update functions
 *
 * @example
 * ```tsx
 * const { glassSize, measureRef, measureStyle } = useGlassSize({
 *   padding: "16px 24px",
 *   minWidth: 200,
 *   minHeight: 100,
 *   children: <div>Dynamic content</div>
 * });
 * ```
 */
export function useGlassSize({ width, height, padding = "24px 32px", minWidth = 100, minHeight = 50, children }: { width?: number; height?: number; padding?: string; minWidth?: number; minHeight?: number; children?: ReactNode }) {
    const measureRef = useRef<HTMLDivElement>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [glassSize, setGlassSize] = useState<IGlassSize>({
        width: width ?? minWidth,
        height: height ?? minHeight,
    });
    const [contentMeasured, setContentMeasured] = useState(false);

    /**
     * Core size calculation function with content measurement and constraint application.
     *
     * Measures actual content dimensions using getBoundingClientRect and calculates
     * total panel size including padding. Supports both fixed sizing and automatic
     * content-based sizing modes. Uses RAF scheduling to ensure accurate measurements
     * after DOM updates and applies minimum size constraints.
     *
     * The function handles:
     * - RAF scheduling for accurate post-render measurements
     * - Padding value parsing and application to content dimensions
     * - Fixed vs automatic sizing mode detection and handling
     * - Minimum size constraint enforcement
     * - Change detection to prevent unnecessary updates
     */
    const updateGlassSize = useCallback(() => {
        if (!measureRef.current || !children) return;

        // Wait for next frame to ensure content is rendered
        requestAnimationFrame(() => {
            if (!measureRef.current) return;

            const contentRect = measureRef.current.getBoundingClientRect();
            const paddingValues = getPaddingValues(padding);

            // If width/height are explicitly provided, use them
            if (width && height) {
                const newSize = { width, height };
                if (newSize.width !== glassSize.width || newSize.height !== glassSize.height) {
                    setGlassSize(newSize);
                }
                return;
            }

            // Calculate size based on content + padding
            const contentWidth = contentRect.width;
            const contentHeight = contentRect.height;

            const totalWidth = contentWidth + paddingValues.left + paddingValues.right;
            const totalHeight = contentHeight + paddingValues.top + paddingValues.bottom;

            const newWidth = width ?? Math.max(totalWidth, minWidth);
            const newHeight = height ?? Math.max(totalHeight, minHeight);

            if (Math.abs(newWidth - glassSize.width) > 1 || Math.abs(newHeight - glassSize.height) > 1) {
                setGlassSize({ width: newWidth, height: newHeight });
                setContentMeasured(true);
            }
        });
    }, [width, height, glassSize.width, glassSize.height, padding, children, minWidth, minHeight]);

    // Update glass size when width/height props change
    useEffect(() => {
        if (width && height) {
            setGlassSize({ width, height });
        } else {
            updateGlassSize();
        }
    }, [width, height, updateGlassSize]);

    // Initial size measurement
    useEffect(() => {
        if (children && !contentMeasured) {
            // Delay initial measurement to ensure DOM is ready
            const timeout = setTimeout(() => {
                updateGlassSize();
            }, 0);

            return () => clearTimeout(timeout);
        }
    }, [children, contentMeasured, updateGlassSize]);

    // Set up ResizeObserver for content changes
    useEffect(() => {
        if (!measureRef.current || !children) return;

        if ("ResizeObserver" in window) {
            const resizeObserver = new ResizeObserver(() => {
                // Debounce updates to avoid excessive recalculations
                if (resizeTimeoutRef.current) {
                    clearTimeout(resizeTimeoutRef.current);
                }
                resizeTimeoutRef.current = setTimeout(() => {
                    updateGlassSize();
                }, 16); // ~60fps
            });

            resizeObserver.observe(measureRef.current);

            return () => {
                if (resizeTimeoutRef.current) {
                    clearTimeout(resizeTimeoutRef.current);
                }
                resizeObserver.disconnect();
            };
        }

        // Fallback for browsers without ResizeObserver
        const interval = setInterval(updateGlassSize, 100);
        return () => clearInterval(interval);
    }, [updateGlassSize, children]);

    /**
     * Invisible measuring element styles for accurate content dimension detection.
     *
     * Creates an off-screen element that renders content in its natural dimensions
     * without affecting layout or visibility. Uses hardware acceleration and
     * specific positioning to ensure accurate measurements while maintaining
     * optimal rendering performance.
     *
     * Style properties:
     * - Positioned absolutely off-screen to prevent layout interference
     * - Hidden from user view but measurable by DOM APIs
     * - Hardware accelerated with translate3d for optimal performance
     * - Preserves natural content flow with appropriate display modes
     */
    const measureStyle: React.CSSProperties = {
        position: "absolute",
        visibility: "hidden",
        pointerEvents: "none",
        transform: "translate3d(-9999px, -9999px, 0)",
        whiteSpace: "nowrap",
        display: "inline-block",
    };

    return {
        glassSize,
        contentMeasured,
        measureRef,
        measureStyle,
        updateGlassSize,
    };
}
