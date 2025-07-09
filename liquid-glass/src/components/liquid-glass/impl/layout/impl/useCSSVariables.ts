/**
 * @fileoverview Optimized CSS variable management system with RAF batching and change detection.
 *
 * Provides high-performance CSS custom property updates with intelligent change detection
 * to prevent unnecessary DOM mutations. Uses RequestAnimationFrame batching for smooth
 * 60fps updates and maintains internal state to track property changes.
 */

import { useCallback, useRef } from "react";

/**
 * High-performance CSS variable management hook with change detection and RAF batching.
 *
 * Optimizes CSS custom property updates by tracking previous values and only applying
 * changes when values actually differ. Uses RequestAnimationFrame scheduling to batch
 * updates and prevent frame drops during intensive animation sequences.
 *
 * @returns Object containing update functions, cleanup handler, and RAF reference
 *
 * @example
 * ```tsx
 * const { scheduleStyleUpdate, cleanup } = useCSSVariables();
 *
 * const vars = {
 *   '--glass-x': '100px',
 *   '--glass-y': '200px',
 *   '--glass-scale': '1.1'
 * };
 *
 * scheduleStyleUpdate(elementRef.current, vars);
 * ```
 */
export function useCSSVariables() {
    const cssVarsRef = useRef<Record<string, string>>({});
    const rafUpdateRef = useRef<number | undefined>(undefined);

    /**
     * Efficiently updates CSS custom properties with change detection.
     *
     * Only applies DOM mutations when property values have actually changed,
     * preventing unnecessary style recalculations and maintaining smooth performance.
     *
     * @param element - Target DOM element for CSS property updates
     * @param vars - Object mapping CSS variable names to their string values
     */
    const updateCSSVariables = useCallback((element: HTMLElement, vars: Record<string, string>) => {
        if (!element) return;

        // Only update changed variables
        Object.entries(vars).forEach(([key, value]) => {
            if (cssVarsRef.current[key] !== value) {
                element.style.setProperty(key, value);
                cssVarsRef.current[key] = value;
            }
        });
    }, []);

    /**
     * Schedules CSS variable updates using RequestAnimationFrame for optimal performance.
     *
     * Batches style updates to prevent multiple DOM mutations within the same frame.
     * Automatically cancels pending updates when new ones are scheduled to ensure
     * only the latest values are applied.
     *
     * @param element - Target DOM element for CSS property updates
     * @param vars - Object mapping CSS variable names to their string values
     */
    const scheduleStyleUpdate = useCallback(
        (element: HTMLElement, vars: Record<string, string>) => {
            if (rafUpdateRef.current !== undefined) {
                cancelAnimationFrame(rafUpdateRef.current);
            }

            rafUpdateRef.current = requestAnimationFrame(() => {
                updateCSSVariables(element, vars);
                rafUpdateRef.current = undefined;
            });
        },
        [updateCSSVariables],
    );

    /**
     * Cancels any pending RAF-scheduled style updates and cleans up resources.
     *
     * Should be called in useEffect cleanup or component unmount to prevent
     * memory leaks and unnecessary DOM mutations after component destruction.
     */
    const cleanup = useCallback(() => {
        if (rafUpdateRef.current !== undefined) {
            cancelAnimationFrame(rafUpdateRef.current);
            rafUpdateRef.current = undefined;
        }
    }, []);

    return {
        updateCSSVariables,
        scheduleStyleUpdate,
        cleanup,
        rafUpdateRef,
    };
}
