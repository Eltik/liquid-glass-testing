import { useCallback } from "react";
import type { Vec2 } from "../../types";

export const useElasticEffects = ({
    globalMousePos,
    glassSize,
    elasticity,
}: {
    globalMousePos: Vec2;
    glassSize: { width: number; height: number };
    elasticity: number;
}) => {
    const calculateDirectionalScale = useCallback((glassRef: React.RefObject<HTMLDivElement | null>) => {
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
    }, [globalMousePos, elasticity, glassSize]);

    const calculateFadeInFactor = useCallback((glassRef: React.RefObject<HTMLDivElement | null>) => {
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
    }, [globalMousePos, glassSize]);

    const calculateElasticTranslation = useCallback((glassRef: React.RefObject<HTMLDivElement | null>) => {
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
    }, [globalMousePos, elasticity, calculateFadeInFactor]);

    return {
        calculateDirectionalScale,
        calculateFadeInFactor,
        calculateElasticTranslation,
    };
};