/**
 * Resize Observer Hook for Element Size Monitoring
 * 
 * This module provides a singleton ResizeObserver implementation that efficiently
 * monitors element size changes across the application. It uses a WeakMap to
 * track callbacks and automatically cleans up when elements are removed.
 * 
 * The singleton pattern ensures only one ResizeObserver instance exists,
 * which is more efficient than creating multiple observers.
 * 
 * Key features:
 * - Singleton ResizeObserver for performance
 * - WeakMap-based callback tracking for memory safety
 * - Automatic cleanup when elements are removed
 * - Support for multiple callbacks per element
 */

import type { ObserverCallback } from "../../types/lib";

/** Singleton ResizeObserver instance */
let resizeObserver: ResizeObserver | null = null;

/** WeakMap to track callbacks for each observed element */
const observed = new WeakMap<Element, ObserverCallback[]>();

/**
 * ResizeObserver callback handler
 * 
 * This function processes resize entries from the ResizeObserver and
 * calls all registered callbacks for each resized element.
 * 
 * @param entries - Array of ResizeObserverEntry objects
 */
const onResize: ResizeObserverCallback = (entries) => {
    entries.forEach((entry) => {
        const info = observed.get(entry.target);

        if (info) {
            const cbList = info;
            cbList.forEach((cb) => {
                cb(entry.contentRect as DOMRect, entry.target as HTMLElement);
            });
        }
    });
};

/**
 * Stop observing an element
 * 
 * This function removes observation of an element, either completely
 * or for a specific callback. It handles cleanup of the WeakMap
 * and ResizeObserver as needed.
 * 
 * @param el - HTML element to stop observing
 * @param cb - Optional specific callback to remove
 */
const unobserve = (el: HTMLElement, cb?: ObserverCallback) => {
    if (!observed.has(el) || !resizeObserver) {
        return;
    }

    // If no specific callback, remove all observation of this element
    if (!cb) {
        observed.delete(el);
        resizeObserver.unobserve(el);
        return;
    }

    // Remove specific callback from element's callback list
    const cbList = observed.get(el)!;
    const cbIdx = cbList.indexOf(cb);
    if (cbIdx > -1) {
        cbList.splice(cbIdx, 1);
    }
    
    // If no more callbacks, stop observing entirely
    if (!cbList.length) {
        observed.delete(el);
        resizeObserver.unobserve(el);
    }
};

/**
 * Start observing an element for size changes
 * 
 * This function sets up observation of an element with a callback.
 * It creates the singleton ResizeObserver if needed and manages
 * the callback list for each element.
 * 
 * @param el - HTML element to observe
 * @param cb - Callback function to call when element resizes
 * @returns Cleanup function to stop observing
 */
const observe = (el: HTMLElement, cb: ObserverCallback) => {
    // Create singleton ResizeObserver if not exists
    resizeObserver ??= new ResizeObserver(onResize);

    // Set up observation for new element
    if (!observed.has(el)) {
        observed.set(el, []);
        resizeObserver.observe(el);
    }

    // Add callback to element's callback list
    const cbList = observed.get(el)!;
    if (!cbList.includes(cb)) {
        cbList.push(cb);
    }

    // Return cleanup function
    return () => {
        unobserve(el, cb);
    };
};

/**
 * React hook for resize observation
 * 
 * This hook provides access to the singleton ResizeObserver functionality
 * in a React-compatible way. It returns observe and unobserve functions
 * that can be used to monitor element size changes.
 * 
 * Usage:
 * ```typescript
 * const { observe, unobserve } = useResizeObserver();
 * 
 * useEffect(() => {
 *   const cleanup = observe(elementRef.current, (rect, element) => {
 *     // Handle resize
 *   });
 *   return cleanup;
 * }, []);
 * ```
 * 
 * @returns Object with observe and unobserve functions
 */
export function useResizeObserver() {
    return {
        observe,
        unobserve,
    };
}
