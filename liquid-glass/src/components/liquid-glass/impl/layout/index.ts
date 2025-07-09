/**
 * @fileoverview Layout management subsystem for liquid-glass component architecture.
 *
 * Provides essential layout utilities and hooks for CSS variable management,
 * position constraints, padding calculations, and encoding operations. This module
 * serves as the foundation for all layout-related functionality throughout the
 * liquid-glass system, enabling responsive design and dynamic style updates.
 *
 * Core functionality:
 * - High-performance CSS variable management with RAF batching
 * - Viewport boundary constraint calculations
 * - CSS padding string parsing and normalization
 * - Manual base64 encoding for cross-platform compatibility
 *
 * @module layout
 */

export { useCSSVariables } from "./impl/useCSSVariables";
export { constrainPosition, getPaddingValues, encodeBase64Manual } from "./impl/utils";
