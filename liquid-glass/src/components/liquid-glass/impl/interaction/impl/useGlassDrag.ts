import { useCallback, useRef, useState } from "react";
import type { IGlassPosition } from "../../../types";

export function useGlassDrag({ draggable = true, position, setPosition, constrainPos }: { draggable?: boolean; position: IGlassPosition; setPosition: (pos: IGlassPosition) => void; constrainPos: (x: number, y: number) => { x: number; y: number } }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (!draggable) return;

            // Prevent dragging if user is interacting with form controls
            const target = e.target as HTMLElement;
            if (target.tagName === "INPUT" || target.tagName === "BUTTON" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
                return;
            }

            // Also check if the target is inside a form control
            if (target.closest("input, button, textarea, select")) {
                return;
            }

            setIsDragging(true);
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;

            const startX = e.clientX;
            const startY = e.clientY;
            const initialX = rect.left;
            const initialY = rect.top;
            let hasMoved = false;

            const handleDragMove = (e: MouseEvent) => {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                // Only update position if there's actual movement
                if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
                    if (!hasMoved) {
                        hasMoved = true;
                        // First movement - switch from centered to absolute positioning
                        if (position.centered) {
                            setPosition({
                                x: initialX,
                                y: initialY,
                                centered: false,
                            });
                        }
                    }

                    const newX = initialX + deltaX;
                    const newY = initialY + deltaY;

                    const constrained = constrainPos(newX, newY);

                    setPosition({
                        x: constrained.x,
                        y: constrained.y,
                        centered: false,
                    });
                }
            };

            const handleDragEnd = () => {
                setIsDragging(false);
                document.removeEventListener("mousemove", handleDragMove);
                document.removeEventListener("mouseup", handleDragEnd);
            };

            document.addEventListener("mousemove", handleDragMove);
            document.addEventListener("mouseup", handleDragEnd);

            e.preventDefault();
        },
        [draggable, constrainPos, position.centered, setPosition],
    );

    return {
        isDragging,
        containerRef,
        handleMouseDown,
        setIsDragging,
    };
}
