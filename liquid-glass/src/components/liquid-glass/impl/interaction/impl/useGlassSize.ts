import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { IGlassSize } from "../../../types";
import { getPaddingValues } from "../../layout/impl/utils";

export function useGlassSize({ width, height, padding = "24px 32px", minWidth = 100, minHeight = 50, children }: { width?: number; height?: number; padding?: string; minWidth?: number; minHeight?: number; children?: ReactNode }) {
    const measureRef = useRef<HTMLDivElement>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [glassSize, setGlassSize] = useState<IGlassSize>({
        width: width ?? minWidth,
        height: height ?? minHeight,
    });
    const [contentMeasured, setContentMeasured] = useState(false);

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
        contentMeasured,
        measureRef,
        measureStyle,
        updateGlassSize,
    };
}
