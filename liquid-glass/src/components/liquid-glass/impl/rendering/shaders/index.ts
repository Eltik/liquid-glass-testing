/**
 * @fileoverview Shader system entry point for liquid-glass displacement mapping and visual effects.
 *
 * Provides unified access to shader utilities, displacement map generation, and data URL
 * creation functions. This module serves as the primary interface for all shader-related
 * operations including WebGL displacement mapping, canvas data URL generation, and
 * visual effect mode management.
 *
 * Core shader functionality:
 * - WebGL-optimized displacement map generation for multiple visual modes
 * - Canvas-based data URL creation for image processing
 * - Comprehensive shader utilities and WebGL management
 * - Cross-platform compatibility with fallback implementations
 *
 * @module shaders
 */

export { getMap } from "./impl/getMap";
export { createCanvasDataURL } from "./impl/create-data-url";
export * from "../shader-utils";
