import { useCallback, useRef } from "react";
import type { Vec2 } from "../../types";

export const useMouseTracking = ({
    mouseContainer,
    isDragging,
    borderGradientRef,
    overlayGradientRef,
    setInternalMouseOffset,
    setInternalGlobalMousePos,
}: {
    mouseContainer: React.RefObject<HTMLElement | null> | null;
    isDragging: boolean;
    borderGradientRef: React.MutableRefObject<{
        angle: number;
        opacity1: number;
        opacity2: number;
        stop1: number;
        stop2: number;
    }>;
    overlayGradientRef: React.MutableRefObject<{
        angle: number;
        opacity1: number;
        opacity2: number;
        stop1: number;
        stop2: number;
    }>;
    setInternalMouseOffset: (offset: Vec2) => void;
    setInternalGlobalMousePos: (pos: Vec2) => void;
}) => {
    const rafIdRef = useRef<number | undefined>(undefined);
    
    const handleMouseMove = useCallback((e: MouseEvent, glassRef: React.RefObject<HTMLDivElement | null>) => {
        if (rafIdRef.current) {
            return;
        }

        rafIdRef.current = requestAnimationFrame(() => {
                rafIdRef.current = undefined;

                if (!glassRef.current) {
                    return;
                }

                // Check distance from glass component first
                const glassRect = glassRef.current.getBoundingClientRect();
                const glassCenterX = glassRect.left + glassRect.width / 2;
                const glassCenterY = glassRect.top + glassRect.height / 2;
                
                const deltaX = e.clientX - glassCenterX;
                const deltaY = e.clientY - glassCenterY;
                
                const edgeDistanceX = Math.max(0, Math.abs(deltaX) - glassRect.width / 2);
                const edgeDistanceY = Math.max(0, Math.abs(deltaY) - glassRect.height / 2);
                const edgeDistance = Math.sqrt(edgeDistanceX * edgeDistanceX + edgeDistanceY * edgeDistanceY);
                
                const activationZone = 200;
                
                // Only update if mouse is within activation zone
                if (edgeDistance <= activationZone) {
                    const container = mouseContainer?.current ?? glassRef.current;
                    if (!container) {
                        return;
                    }

                    const rect = container.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;

                    const newMouseOffset = {
                        x: ((e.clientX - centerX) / rect.width) * 100,
                        y: ((e.clientY - centerY) / rect.height) * 100,
                    };

                    const newGlobalMousePos = {
                        x: e.clientX,
                        y: e.clientY,
                    };

                    // Update gradient values for border effects using transform instead of background recalculation
                    if (!isDragging) {
                        borderGradientRef.current = {
                            angle: 135 + newMouseOffset.x * 1.2,
                            opacity1: 0.12 + Math.abs(newMouseOffset.x) * 0.008,
                            opacity2: 0.4 + Math.abs(newMouseOffset.x) * 0.012,
                            stop1: Math.max(10, 33 + newMouseOffset.y * 0.3),
                            stop2: Math.min(90, 66 + newMouseOffset.y * 0.4),
                        };

                        overlayGradientRef.current = {
                            angle: 135 + newMouseOffset.x * 1.2,
                            opacity1: 0.32 + Math.abs(newMouseOffset.x) * 0.008,
                            opacity2: 0.6 + Math.abs(newMouseOffset.x) * 0.012,
                            stop1: Math.max(10, 33 + newMouseOffset.y * 0.3),
                            stop2: Math.min(90, 66 + newMouseOffset.y * 0.4),
                        };
                    }

                    setInternalMouseOffset(newMouseOffset);
                    setInternalGlobalMousePos(newGlobalMousePos);
                }
            });
    }, [mouseContainer, isDragging, setInternalMouseOffset, setInternalGlobalMousePos, borderGradientRef, overlayGradientRef]);

    return {
        handleMouseMove,
        rafIdRef,
    };
};