/**
 * @fileoverview Elastic physics system for glass panel deformation and animation effects.
 * 
 * Implements sophisticated elastic physics calculations including directional scaling,
 * translation effects, and activation zone management. Creates realistic deformation
 * responses based on mouse proximity and movement vectors.
 */

import { useCallback } from "react";
import type { Vec2 } from "../../../types";

/**
 * Elastic physics calculations for responsive glass panel deformation effects.
 * 
 * Provides directional scaling, translation, and fade-in calculations based on mouse
 * proximity to glass panel edges. Uses activation zones to create smooth transitions
 * and realistic elastic physics responses. All calculations are optimized for
 * real-time performance with minimal computational overhead.
 * 
 * @param globalMousePos - Absolute mouse coordinates in viewport space
 * @param glassSize - Current dimensions of the glass panel for edge calculations
 * @param elasticity - Physics response intensity factor 0-1, higher values create more deformation
 * 
 * @returns Object containing physics calculation functions for transforms and translations
 * 
 * @example
 * ```tsx
 * const { calculateDirectionalScale, calculateElasticTranslation } = useElasticEffects({
 *   globalMousePos: { x: 150, y: 200 },
 *   glassSize: { width: 300, height: 200 },
 *   elasticity: 0.25
 * });
 * 
 * const scaleTransform = calculateDirectionalScale(glassRef);
 * const translation = calculateElasticTranslation(glassRef);
 * ```
 */
export const useElasticEffects = ({ globalMousePos, glassSize, elasticity }: { globalMousePos: Vec2; glassSize: { width: number; height: number }; elasticity: number }) => {
    /**
     * Calculates directional scaling transform based on mouse position relative to glass panel.
     * 
     * Creates realistic stretching effects by applying different scale values to X and Y axes
     * based on mouse direction and distance. Uses activation zones to create smooth fade-in
     * and prevents scaling when mouse is too far from panel edges.
     * 
     * @param glassRef - Reference to glass panel DOM element for dimension calculations
     * @returns CSS transform string with scaleX and scaleY values, or "scale(1)" when inactive
     */
    const calculateDirectionalScale = useCallback(
        (glassRef: React.RefObject<HTMLDivElement | null>) => {
            if (!globalMousePos.x || !globalMousePos.y || !glassRef.current) {
                return "scale(1)";
            }

            const rect = glassRef.current.getBoundingClientRect();
            const pillCenterX = rect.left + rect.width / 2;
            const pillCenterY = rect.top + rect.height / 2;
            const pillWidth = glassSize.width;
            const pillHeight = glassSize.height;

            const deltaX = globalMousePos.x - pillCenterX;
            const deltaY = globalMousePos.y - pillCenterY;

            const edgeDistanceX = Math.max(0, Math.abs(deltaX) - pillWidth / 2);
            const edgeDistanceY = Math.max(0, Math.abs(deltaY) - pillHeight / 2);
            const edgeDistance = Math.sqrt(edgeDistanceX * edgeDistanceX + edgeDistanceY * edgeDistanceY);

            const activationZone = 200;

            if (edgeDistance > activationZone) {
                return "scale(1)";
            }

            const fadeInFactor = 1 - edgeDistance / activationZone;

            const centerDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            if (centerDistance === 0) {
                return "scale(1)";
            }

            const normalizedX = deltaX / centerDistance;
            const normalizedY = deltaY / centerDistance;

            const stretchIntensity = Math.min(centerDistance / 300, 1) * elasticity * fadeInFactor;

            const scaleX = 1 + Math.abs(normalizedX) * stretchIntensity * 0.3 - Math.abs(normalizedY) * stretchIntensity * 0.15;
            const scaleY = 1 + Math.abs(normalizedY) * stretchIntensity * 0.3 - Math.abs(normalizedX) * stretchIntensity * 0.15;

            return `scaleX(${Math.max(0.8, scaleX)}) scaleY(${Math.max(0.8, scaleY)})`;
        },
        [globalMousePos, elasticity, glassSize],
    );

    /**
     * Calculates fade-in intensity factor based on mouse distance from glass panel edges.
     * 
     * Provides smooth transition values for elastic effects by measuring distance from
     * panel edges and applying activation zone logic. Returns 0 when mouse is outside
     * activation zone, 1 when mouse is directly over panel, with smooth interpolation.
     * 
     * @param glassRef - Reference to glass panel DOM element for edge distance calculations
     * @returns Fade-in factor between 0-1, where 1 indicates maximum effect intensity
     */
    const calculateFadeInFactor = useCallback(
        (glassRef: React.RefObject<HTMLDivElement | null>) => {
            if (!globalMousePos.x || !globalMousePos.y || !glassRef.current) {
                return 0;
            }

            const rect = glassRef.current.getBoundingClientRect();
            const pillCenterX = rect.left + rect.width / 2;
            const pillCenterY = rect.top + rect.height / 2;
            const pillWidth = glassSize.width;
            const pillHeight = glassSize.height;

            const edgeDistanceX = Math.max(0, Math.abs(globalMousePos.x - pillCenterX) - pillWidth / 2);
            const edgeDistanceY = Math.max(0, Math.abs(globalMousePos.y - pillCenterY) - pillHeight / 2);
            const edgeDistance = Math.sqrt(edgeDistanceX * edgeDistanceX + edgeDistanceY * edgeDistanceY);

            const activationZone = 200;
            return edgeDistance > activationZone ? 0 : 1 - edgeDistance / activationZone;
        },
        [globalMousePos, glassSize],
    );

    /**
     * Calculates elastic translation offsets for subtle panel movement effects.
     * 
     * Creates smooth follow-mouse translation by applying proportional offsets based on
     * mouse distance from panel center. Uses fade-in factor to ensure effects only
     * activate within activation zones. Returns pixel offset values for CSS transforms.
     * 
     * @param glassRef - Reference to glass panel DOM element for center point calculations
     * @returns Object with x/y pixel offsets for translation transform, {x: 0, y: 0} when inactive
     */
    const calculateElasticTranslation = useCallback(
        (glassRef: React.RefObject<HTMLDivElement | null>) => {
            if (!glassRef.current) {
                return { x: 0, y: 0 };
            }

            const fadeInFactor = calculateFadeInFactor(glassRef);
            const rect = glassRef.current.getBoundingClientRect();
            const pillCenterX = rect.left + rect.width / 2;
            const pillCenterY = rect.top + rect.height / 2;

            return {
                x: (globalMousePos.x - pillCenterX) * elasticity * 0.1 * fadeInFactor,
                y: (globalMousePos.y - pillCenterY) * elasticity * 0.1 * fadeInFactor,
            };
        },
        [globalMousePos, elasticity, calculateFadeInFactor],
    );

    return {
        calculateDirectionalScale,
        calculateFadeInFactor,
        calculateElasticTranslation,
    };
};
