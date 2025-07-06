/**
 * @fileoverview Core layout utility functions for position constraints, padding calculations, and encoding.
 * 
 * Provides essential layout calculation functions used throughout the liquid-glass system
 * for viewport constraints, CSS padding parsing, and manual base64 encoding. These utilities
 * form the foundation for responsive positioning and cross-platform compatibility.
 */

/**
 * Constrains element position within viewport boundaries with configurable offset margins.
 * 
 * Calculates constrained coordinates to ensure an element of given dimensions remains
 * fully visible within the viewport. Applies symmetric offset margins on all sides
 * to prevent edge clipping and maintain visual spacing from viewport boundaries.
 * 
 * @param x - Target horizontal position in pixels
 * @param y - Target vertical position in pixels  
 * @param width - Element width in pixels for boundary calculations
 * @param height - Element height in pixels for boundary calculations
 * @param offset - Boundary offset margin in pixels, defaults to 10px
 * @returns Constrained coordinates ensuring element stays within viewport bounds
 * 
 * @example
 * ```tsx
 * const constrained = constrainPosition(150, 200, 300, 150, 20);
 * // Returns { x: 150, y: 200 } if within bounds, or adjusted coordinates
 * ```
 */
export const constrainPosition = (x: number, y: number, width: number, height: number, offset = 10): { x: number; y: number } => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const bounds = {
        minX: offset,
        maxX: viewportWidth - width - offset,
        minY: offset,
        maxY: viewportHeight - height - offset,
    };

    return {
        x: Math.max(bounds.minX, Math.min(bounds.maxX, x)),
        y: Math.max(bounds.minY, Math.min(bounds.maxY, y)),
    };
};

/** Default padding values applied when padding string parsing fails */
const DEFAULT_PADDING = {
    top: 24,
    right: 32,
    bottom: 24,
    left: 32,
};

/**
 * Parses CSS padding strings into individual directional values.
 * 
 * Converts CSS padding shorthand notation into explicit top/right/bottom/left values
 * following standard CSS padding rules. Handles 1, 2, and 4-value padding formats
 * with automatic fallback to default values for invalid input.
 * 
 * Supported formats:
 * - "20px" → { top: 20, right: 20, bottom: 20, left: 20 }
 * - "20px 30px" → { top: 20, right: 30, bottom: 20, left: 30 }  
 * - "10px 20px 30px 40px" → { top: 10, right: 20, bottom: 30, left: 40 }
 * 
 * @param paddingStr - CSS padding string with space-separated pixel values
 * @returns Object with explicit top/right/bottom/left padding values in pixels
 * 
 * @example
 * ```tsx
 * const padding = getPaddingValues("16px 24px");
 * // Returns { top: 16, right: 24, bottom: 16, left: 24 }
 * ```
 */
export const getPaddingValues = (paddingStr: string) => {
    const values = paddingStr.split(" ").map((v) => parseInt(v.replace("px", ""), 10) || 0);

    switch (values.length) {
        case 1:
            return {
                top: values[0]!,
                right: values[0]!,
                bottom: values[0]!,
                left: values[0]!,
            };
        case 2:
            return {
                top: values[0]!,
                right: values[1]!,
                bottom: values[0]!,
                left: values[1]!,
            };
        case 4:
            return {
                top: values[0]!,
                right: values[1]!,
                bottom: values[2]!,
                left: values[3]!,
            };
        default:
            return DEFAULT_PADDING;
    }
};

/**
 * Manual base64 encoding implementation for cross-platform compatibility.
 * 
 * Provides reliable base64 encoding that works in both browser and server
 * environments without dependency on btoa/atob functions. Uses standard
 * base64 character set and handles binary string input with proper padding.
 * 
 * This implementation is essential for server-side rendering compatibility
 * and ensures consistent encoding across all JavaScript environments.
 * 
 * @param binary - Binary string data to encode (each character represents a byte)
 * @returns Base64-encoded string with proper padding characters
 * 
 * @example
 * ```tsx
 * const encoded = encodeBase64Manual("Hello World");
 * // Returns: "SGVsbG8gV29ybGQ="
 * ```
 */
export const encodeBase64Manual = (binary: string): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let result = "";
    for (let i = 0; i < binary.length; i += 3) {
        const a = binary.charCodeAt(i);
        const b = i + 1 < binary.length ? binary.charCodeAt(i + 1) : 0;
        const c = i + 2 < binary.length ? binary.charCodeAt(i + 2) : 0;
        const group = (a << 16) | (b << 8) | c;

        result += chars[(group >> 18) & 63];
        result += chars[(group >> 12) & 63];
        result += i + 1 < binary.length ? chars[(group >> 6) & 63] : "=";
        result += i + 2 < binary.length ? chars[group & 63] : "=";
    }
    return result;
};
