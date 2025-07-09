import { useRef, useEffect } from "react";
import { useLiquidGlassContext } from "../context/LiquidGlassProvider";

interface InteractionCallbacks {
    onMouseMove?: (position: { x: number; y: number }) => void;
}

export const useLiquidGlassInteraction = (callbacks?: InteractionCallbacks) => {
    const { config, canvasSize } = useLiquidGlassContext();
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle mouse tracking
    useEffect(() => {
        if (!config.interaction.enableMouseTracking || !containerRef.current) return;

        const container = containerRef.current;

        const handlePointerMove = (e: PointerEvent) => {
            const rect = container.getBoundingClientRect();
            const relativeX = e.clientX - rect.left;
            const relativeY = e.clientY - rect.top;

            const mousePosition = {
                x: relativeX * canvasSize.dpr,
                y: (rect.height - relativeY) * canvasSize.dpr,
            };

            callbacks?.onMouseMove?.(mousePosition);
        };

        container.addEventListener("pointermove", handlePointerMove);

        return () => {
            container.removeEventListener("pointermove", handlePointerMove);
        };
    }, [config.interaction.enableMouseTracking, canvasSize, callbacks]);

    return {
        containerRef,
    };
};
