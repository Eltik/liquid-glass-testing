/**
 * @fileoverview Interaction system entry point for liquid-glass components.
 * 
 * Exports all interaction-related hooks that handle user input, physics simulation,
 * and responsive behavior for glassmorphism effects. These hooks work together to
 * provide smooth drag operations, elastic animations, and real-time mouse tracking
 * with optimal performance through RAF scheduling and event debouncing.
 * 
 * The interaction system is designed for modularity - each hook can be used
 * independently or composed together for complete glass panel behavior.
 */

export { useGlassBehavior } from "./impl/useGlassBehavior";
export { useGlassSize } from "./impl/useGlassSize";
export { useGlassPosition } from "./impl/useGlassPosition";
export { useGlassDrag } from "./impl/useGlassDrag";
export { useMouseTracking } from "./impl/useMouseTracking";
export { useElasticEffects } from "./impl/useElasticEffects";
