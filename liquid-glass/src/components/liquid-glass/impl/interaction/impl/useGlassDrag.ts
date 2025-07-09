/**
 * @fileoverview Advanced drag interaction system for liquid-glass components.
 *
 * Implements sophisticated drag-and-drop functionality with form control detection,
 * viewport constraints, and smooth position transitions. Handles the complete drag
 * lifecycle including mouse capture, position updates, and constraint enforcement.
 */

import { useCallback, useRef, useState } from "react";
import type { IGlassPosition } from "../../../types";

/**
 * Interactive drag system with form control detection and viewport constraints.
 *
 * Provides complete drag-and-drop functionality for glass panels with intelligent
 * form control detection to prevent accidental dragging during user input. Includes
 * smooth position transitions, viewport boundary constraints, and optimized event
 * handling for responsive interactions.
 *
 * The drag system automatically handles:
 * - Form control detection to prevent interference with user input
 * - Smooth transition from centered to absolute positioning
 * - Viewport boundary constraints with configurable offsets
 * - Optimized event handling with movement thresholds
 * - Complete cleanup of global event listeners
 *
 * @param draggable - Enable/disable drag functionality globally
 * @param position - Current position state including centering mode
 * @param setPosition - Position update callback with IGlassPosition interface
 * @param constrainPos - Viewport constraint function for boundary enforcement
 * @returns Object containing drag state, refs, and event handlers
 *
 * @example
 * ```tsx
 * const { isDragging, containerRef, handleMouseDown } = useGlassDrag({
 *   draggable: true,
 *   position: { x: 100, y: 50, centered: false },
 *   setPosition: (pos) => updatePosition(pos),
 *   constrainPos: (x, y) => ({ x: Math.max(0, x), y: Math.max(0, y) })
 * });
 * ```
 */
export function useGlassDrag({ draggable = true, position, setPosition, constrainPos }: { draggable?: boolean; position: IGlassPosition; setPosition: (pos: IGlassPosition) => void; constrainPos: (x: number, y: number) => { x: number; y: number } }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    /**
     * Main mouse down handler initiating drag operations.
     *
     * Implements comprehensive form control detection to prevent drag interference
     * with user input elements. Captures initial mouse position and sets up
     * global event listeners for drag tracking with automatic cleanup.
     *
     * @param e - React mouse event from the container element
     */
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

            /**
             * Mouse move handler for active drag operations.
             *
             * Implements movement threshold detection to prevent jittery updates
             * and handles smooth transition from centered to absolute positioning.
             * Applies viewport constraints to ensure panel stays within bounds.
             *
             * @param e - Native mouse event with updated cursor position
             */
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

            /**
             * Mouse up handler for drag completion.
             *
             * Cleans up global event listeners and resets drag state.
             * Automatically called when mouse button is released anywhere
             * in the document to ensure proper cleanup.
             */
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
