import { useCallback, useEffect, useState } from "react";
import type { IGlassPosition, IGlassSize } from "../../../types";
import { constrainPosition } from "../../layout/impl/utils";

export function useGlassPosition({ initialPosition, glassSize }: { initialPosition?: { x?: number; y?: number }; glassSize: IGlassSize }) {
    const [position, setPosition] = useState<IGlassPosition>({
        x: initialPosition?.x ?? 0,
        y: initialPosition?.y ?? 0,
        centered: !initialPosition || (initialPosition.x === undefined && initialPosition.y === undefined),
    });

    const offset = 10; // Viewport boundary offset

    const constrainPos = useCallback((x: number, y: number) => constrainPosition(x, y, glassSize.width, glassSize.height, offset), [glassSize.width, glassSize.height, offset]);

    // Handle window resize to maintain constraints
    useEffect(() => {
        const handleResize = () => {
            if (!position.centered) {
                const constrained = constrainPos(position.x, position.y);
                if (position.x !== constrained.x || position.y !== constrained.y) {
                    setPosition({
                        x: constrained.x,
                        y: constrained.y,
                        centered: false,
                    });
                }
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [position, constrainPos]);

    return {
        position,
        setPosition,
        constrainPos,
    };
}
