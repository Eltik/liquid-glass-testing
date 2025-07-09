import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { LiquidGlassConfig, LiquidGlassContextValue, CanvasSize, SpringState } from "../types";

const LiquidGlassContext = createContext<LiquidGlassContextValue | null>(null);

export const useLiquidGlassContext = () => {
    const context = useContext(LiquidGlassContext);
    if (!context) {
        throw new Error("useLiquidGlassContext must be used within a LiquidGlassProvider");
    }
    return context;
};

interface LiquidGlassProviderProps {
    children: ReactNode;
    config: LiquidGlassConfig;
}

export const LiquidGlassProvider: React.FC<LiquidGlassProviderProps> = ({ children, config: initialConfig }) => {
    const [config, setConfig] = useState<LiquidGlassConfig>(initialConfig);
    const [canvasSize, setCanvasSize] = useState<CanvasSize>({
        width: 600,
        height: 600,
        dpr: 1,
    });
    const [springState] = useState<SpringState>({
        value: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        target: { x: 0, y: 0 },
    });
    const [mousePosition] = useState({ x: 0, y: 0 });

    const updateConfig = useCallback((newConfig: Partial<LiquidGlassConfig>) => {
        setConfig((prev) => ({ ...prev, ...newConfig }));
    }, []);

    const contextValue: LiquidGlassContextValue = {
        config,
        updateConfig,
        canvasSize,
        setCanvasSize,
        springState,
        mousePosition,
    };

    return <LiquidGlassContext.Provider value={contextValue}>{children}</LiquidGlassContext.Provider>;
};
