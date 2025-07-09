/**
 * @fileoverview Rendering subsystem entry point for liquid-glass component architecture.
 *
 * Provides a unified interface for all rendering-related components and utilities including
 * glass containers, visual filters, border layers, and shader implementations. This module
 * serves as the primary export point for the complete rendering pipeline used throughout
 * the liquid-glass glassmorphism effect system.
 *
 * The rendering subsystem handles:
 * - Glass container component with backdrop filtering
 * - SVG filter effects and displacement mapping
 * - Multi-layer border rendering with gradient effects
 * - WebGL shader utilities and displacement map generation
 *
 * @module rendering
 */

export { GlassContainer } from "./components/glass-container";
export { GlassFilter } from "./components/glass-filter";
export { BorderLayers } from "./components/border-layers";
export * from "./shaders";
