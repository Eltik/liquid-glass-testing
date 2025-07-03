import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { IGlassPosition, IGlassSize } from "../../types";
import { constrainPosition, getPaddingValues } from "./utils";

export function useGlassBehavior({
    width,
    height,
    padding = "24px 32px",
    initialPosition,
    draggable = true,
    minWidth = 100,
    minHeight = 50,
    children
}: {
    width?: number;
    height?: number;
    padding?: string;
    initialPosition?: { x?: number; y?: number };
    draggable?: boolean;
    minWidth?: number;
    minHeight?: number;
    children?: ReactNode;
}) {
    const measureRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [glassSize, setGlassSize] = useState<IGlassSize>({
        width: width ?? minWidth,
        height: height ?? minHeight,
    });
    const [position, setPosition] = useState<IGlassPosition>({
        x: initialPosition?.x ?? 0,
        y: initialPosition?.y ?? 0,
        centered: !initialPosition || (initialPosition.x === undefined && initialPosition.y === undefined),
    });
    const [isDragging, setIsDragging] = useState(false);
    const [contentMeasured, setContentMeasured] = useState(false);

    const offset = 10; // Viewport boundary offset

    const constrainPos = useCallback((x: number, y: number) => constrainPosition(x, y, glassSize.width, glassSize.height, offset), [glassSize.width, glassSize.height, offset]);

    const updateGlassSize = useCallback(() => {
        if (!measureRef.current || !children) return;

        // Wait for next frame to ensure content is rendered
        requestAnimationFrame(() => {
            if (!measureRef.current) return;

            const contentRect = measureRef.current.getBoundingClientRect();
            const paddingValues = getPaddingValues(padding);

            // If width/height are explicitly provided, use them
            if (width && height) {
                const newSize = { width, height };
                if (newSize.width !== glassSize.width || newSize.height !== glassSize.height) {
                    setGlassSize(newSize);
                }
                return;
            }

            // Calculate size based on content + padding
            const contentWidth = contentRect.width;
            const contentHeight = contentRect.height;

            const totalWidth = contentWidth + paddingValues.left + paddingValues.right;
            const totalHeight = contentHeight + paddingValues.top + paddingValues.bottom;

            const newWidth = width ?? Math.max(totalWidth, minWidth);
            const newHeight = height ?? Math.max(totalHeight, minHeight);

            if (Math.abs(newWidth - glassSize.width) > 1 || Math.abs(newHeight - glassSize.height) > 1) {
                setGlassSize({ width: newWidth, height: newHeight });
                setContentMeasured(true);
            }
        });
    }, [width, height, glassSize.width, glassSize.height, padding, children, minWidth, minHeight]);

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
        [draggable, constrainPos, position.centered],
    );

    // Update glass size when width/height props change
    useEffect(() => {
        if (width && height) {
            setGlassSize({ width, height });
        } else {
            updateGlassSize();
        }
    }, [width, height, updateGlassSize]);

    // Initial size measurement
    useEffect(() => {
        if (children && !contentMeasured) {
            // Delay initial measurement to ensure DOM is ready
            const timeout = setTimeout(() => {
                updateGlassSize();
            }, 0);

            return () => clearTimeout(timeout);
        }
    }, [children, contentMeasured, updateGlassSize]);

    // Set up ResizeObserver for content changes
    useEffect(() => {
        if (!measureRef.current || !children) return;

        if ("ResizeObserver" in window) {
            const resizeObserver = new ResizeObserver(() => {
                // Debounce updates to avoid excessive recalculations
                if (resizeTimeoutRef.current) {
                    clearTimeout(resizeTimeoutRef.current);
                }
                resizeTimeoutRef.current = setTimeout(() => {
                    updateGlassSize();
                }, 16); // ~60fps
            });

            resizeObserver.observe(measureRef.current);

            return () => {
                if (resizeTimeoutRef.current) {
                    clearTimeout(resizeTimeoutRef.current);
                }
                resizeObserver.disconnect();
            };
        }

        // Fallback for browsers without ResizeObserver
        const interval = setInterval(updateGlassSize, 100);
        return () => clearInterval(interval);
    }, [updateGlassSize, children]);

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

    // Invisible measuring div style for auto-sizing
    const measureStyle: React.CSSProperties = {
        position: "absolute",
        visibility: "hidden",
        pointerEvents: "none",
        transform: "translate3d(-9999px, -9999px, 0)",
        whiteSpace: "nowrap",
        display: "inline-block",
    };

    return {
        glassSize,
        position,
        isDragging,
        contentMeasured,
        measureRef,
        containerRef,
        measureStyle,
        handleMouseDown,
        setIsDragging,
    };
}