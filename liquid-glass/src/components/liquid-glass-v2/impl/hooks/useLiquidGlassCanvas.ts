import { useRef, useState, useEffect } from "react";
import { useLiquidGlassContext } from "../context/LiquidGlassProvider";
import type { CanvasSize } from "../types";

interface UseLiquidGlassCanvasProps {
    width?: number;
    height?: number;
    dpr?: number;
}

export const useLiquidGlassCanvas = ({ width, height, dpr }: UseLiquidGlassCanvasProps) => {
    const { setCanvasSize } = useLiquidGlassContext();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [canvasSize, setLocalCanvasSize] = useState<CanvasSize>(() => {
        // Safe default values for SSR
        const defaultSize = 600;
        const defaultDpr = 1;

        // Always use provided width/height if available
        if (width && height) {
            return {
                width: width,
                height: height,
                dpr: dpr ?? (typeof window !== "undefined" ? window.devicePixelRatio : defaultDpr),
            };
        }

        // Only access window in browser environment
        if (typeof window !== "undefined") {
            const browserDefaultSize = Math.min(window.innerWidth, window.innerHeight, 600);
            return {
                width: width ?? browserDefaultSize,
                height: height ?? browserDefaultSize,
                dpr: dpr ?? window.devicePixelRatio,
            };
        }

        return {
            width: width ?? defaultSize,
            height: height ?? defaultSize,
            dpr: dpr ?? defaultDpr,
        };
    });

    // Update context when canvas size changes
    useEffect(() => {
        setCanvasSize(canvasSize);
    }, [canvasSize, setCanvasSize]);

    // Handle canvas resize
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        canvas.width = canvasSize.width * canvasSize.dpr;
        canvas.height = canvasSize.height * canvasSize.dpr;

        const gl = canvas.getContext("webgl2");
        if (gl) {
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
    }, [canvasSize]);

    // Handle window resize and initial client-side sizing
    useEffect(() => {
        if (typeof window === "undefined") return; // Skip during SSR

        // Update size when props change
        if (width && height) {
            setLocalCanvasSize({
                width: width,
                height: height,
                dpr: dpr ?? window.devicePixelRatio,
            });
        } else if (!width && !height) {
            const browserDefaultSize = Math.min(window.innerWidth, window.innerHeight, 600);
            setLocalCanvasSize({
                width: browserDefaultSize,
                height: browserDefaultSize,
                dpr: dpr ?? window.devicePixelRatio,
            });
        }

        const handleResize = () => {
            setLocalCanvasSize((prev) => ({
                ...prev,
                dpr: window.devicePixelRatio,
            }));
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [width, height, dpr]);

    return {
        canvasRef,
        canvasSize,
    };
};
