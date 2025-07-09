import React, { useMemo, useEffect, type CSSProperties } from "react";

// Core wrapper utilities
import { useLiquidGlassCanvas } from "./impl/hooks/useLiquidGlassCanvas";
import { useLiquidGlassRenderer } from "./impl/hooks/useLiquidGlassRenderer";
import { useLiquidGlassInteraction } from "./impl/hooks/useLiquidGlassInteraction";
import { LiquidGlassProvider } from "./impl/context/LiquidGlassProvider";
import { createLiquidGlassPreset } from "./impl/presets";
import type { LiquidGlassConfig, LiquidGlassPreset } from "./impl/types";

// Modern wrapper props interface
export interface LiquidGlassProps {
    children?: React.ReactNode;
    className?: string;
    style?: CSSProperties;

    // Canvas settings
    width?: number;
    height?: number;
    dpr?: number;

    // Configuration presets and custom config
    preset?: LiquidGlassPreset;
    config?: Partial<LiquidGlassConfig>;

    // Legacy props for backward compatibility
    backgroundType?: number;
    backgroundImage?: string;
    backgroundVideo?: HTMLVideoElement;
    shapeWidth?: number;
    shapeHeight?: number;
    shapeRadius?: number;
    shapeRoundness?: number;
    showShape?: boolean;
    mergeRate?: number;
    enableMouseTracking?: boolean;
    springStiffness?: number;
    springDamping?: number;
    springSizeFactor?: number;
    blurRadius?: number;
    shadowExpand?: number;
    shadowFactor?: number;
    shadowPosition?: { x: number; y: number };
    tint?: { r: number; g: number; b: number; a: number };
    refractionThickness?: number;
    refractionFactor?: number;
    refractionDispersion?: number;
    refractionFresnelRange?: number;
    refractionFresnelHardness?: number;
    refractionFresnelFactor?: number;
    glareAngle?: number;
    glareRange?: number;
    glareHardness?: number;
    glareConvergence?: number;
    glareOppositeFactor?: number;
    glareFactor?: number;
    debugStep?: number;

    // Callbacks
    onReady?: (gl: WebGL2RenderingContext) => void;
    onError?: (error: Error) => void;
}

// Legacy types for backward compatibility
export interface LiquidGlassLegacyProps {
    children?: React.ReactNode;
    className?: string;
    style?: CSSProperties;
    width?: number;
    height?: number;
    dpr?: number;
    backgroundType?: number;
    backgroundImage?: string;
    backgroundVideo?: HTMLVideoElement;
    shapeWidth?: number;
    shapeHeight?: number;
    shapeRadius?: number;
    shapeRoundness?: number;
    showShape?: boolean;
    mergeRate?: number;
    enableMouseTracking?: boolean;
    springStiffness?: number;
    springDamping?: number;
    springSizeFactor?: number;
    blurRadius?: number;
    shadowExpand?: number;
    shadowFactor?: number;
    shadowPosition?: { x: number; y: number };
    tint?: { r: number; g: number; b: number; a: number };
    refractionThickness?: number;
    refractionFactor?: number;
    refractionDispersion?: number;
    refractionFresnelRange?: number;
    refractionFresnelHardness?: number;
    refractionFresnelFactor?: number;
    glareAngle?: number;
    glareRange?: number;
    glareHardness?: number;
    glareConvergence?: number;
    glareOppositeFactor?: number;
    glareFactor?: number;
    debugStep?: number;
    onReady?: (gl: WebGL2RenderingContext) => void;
    onError?: (error: Error) => void;
}

// Legacy prop mapper for backward compatibility
const mapLegacyProps = (props: LiquidGlassProps): LiquidGlassConfig => {
    const { preset = "default", config = {}, backgroundType = 0, backgroundImage, backgroundVideo, shapeWidth = 300, shapeHeight = 300, shapeRadius = 20, shapeRoundness = 3, showShape = true, mergeRate = 100, enableMouseTracking = true, springStiffness = 170, springDamping = 26, springSizeFactor = 20, blurRadius = 40, shadowExpand = 40, shadowFactor = 30, shadowPosition = { x: 0, y: 40 }, tint = { r: 255, g: 255, b: 255, a: 0.1 }, refractionThickness = 40, refractionFactor = 1.5, refractionDispersion = 20, refractionFresnelRange = 50, refractionFresnelHardness = 80, refractionFresnelFactor = 80, glareAngle = 45, glareRange = 250, glareHardness = 80, glareConvergence = 80, glareOppositeFactor = 30, glareFactor = 60, debugStep = 0 } = props;

    const baseConfig = createLiquidGlassPreset(preset);

    return {
        ...baseConfig,
        ...config,
        background: {
            ...baseConfig.background,
            ...config.background,
            type: backgroundType,
            image: backgroundImage,
            video: backgroundVideo,
        },
        shape: {
            ...baseConfig.shape,
            ...config.shape,
            width: shapeWidth,
            height: shapeHeight,
            radius: shapeRadius,
            roundness: shapeRoundness,
            visible: showShape,
            mergeRate,
        },
        interaction: {
            ...baseConfig.interaction,
            ...config.interaction,
            enableMouseTracking,
            springStiffness,
            springDamping,
            springSizeFactor,
        },
        blur: {
            ...baseConfig.blur,
            ...config.blur,
            radius: blurRadius,
        },
        shadow: {
            ...baseConfig.shadow,
            ...config.shadow,
            expand: shadowExpand,
            factor: shadowFactor,
            position: shadowPosition,
        },
        tint: {
            ...baseConfig.tint,
            ...config.tint,
            ...tint,
        },
        refraction: {
            ...baseConfig.refraction,
            ...config.refraction,
            thickness: refractionThickness,
            factor: refractionFactor,
            dispersion: refractionDispersion,
            fresnelRange: refractionFresnelRange,
            fresnelHardness: refractionFresnelHardness,
            fresnelFactor: refractionFresnelFactor,
        },
        glare: {
            ...baseConfig.glare,
            ...config.glare,
            angle: glareAngle,
            range: glareRange,
            hardness: glareHardness,
            convergence: glareConvergence,
            oppositeFactor: glareOppositeFactor,
            factor: glareFactor,
        },
        debug: {
            ...baseConfig.debug,
            ...config.debug,
            step: debugStep,
        },
    };
};

// Custom hook for creating liquid glass components
const useLiquidGlassHook = (config: Partial<LiquidGlassConfig> = {}) => {
    const baseConfig = createLiquidGlassPreset("default");
    const mergedConfig = useMemo(() => ({ ...baseConfig, ...config }), [baseConfig, config]);

    return {
        config: mergedConfig,
        createPreset: createLiquidGlassPreset,
        LiquidGlassProvider,
    };
};

// Component factory for creating custom liquid glass components
const createLiquidGlassComponentFactory = (defaultConfig: Partial<LiquidGlassConfig> = {}) => {
    const CustomLiquidGlass: React.FC<Partial<LiquidGlassProps>> = (props) => {
        const config = useMemo(() => {
            const mapped = mapLegacyProps({ ...props } as LiquidGlassProps);
            return { ...defaultConfig, ...mapped };
        }, [props]);

        return (
            <LiquidGlassProvider config={config}>
                <LiquidGlassCore {...props} />
            </LiquidGlassProvider>
        );
    };

    return CustomLiquidGlass;
};

// Core component with all rendering logic
const LiquidGlassCore: React.FC<LiquidGlassProps> = ({ children, className, style, width, height, dpr, onReady, onError }) => {
    const canvasProps = useLiquidGlassCanvas({ width, height, dpr });
    const rendererProps = useLiquidGlassRenderer({ onReady, onError });

    // Connect interaction to renderer
    const interactionProps = useLiquidGlassInteraction({
        onMouseMove: (position) => {
            rendererProps.mousePositionRef.current = position;
            rendererProps.springRef.current?.setTarget(position);
        },
    });

    // Initialize renderer when canvas is ready
    useEffect(() => {
        if (canvasProps.canvasRef.current) {
            rendererProps.initializeRenderer(canvasProps.canvasRef.current);
            rendererProps.startAnimation(canvasProps.canvasRef.current);
        }

        return () => {
            rendererProps.cleanup();
        };
    }, [canvasProps.canvasRef, rendererProps]);

    return (
        <div
            ref={interactionProps.containerRef}
            className={className}
            style={{
                position: "relative",
                width: canvasProps.canvasSize.width,
                height: canvasProps.canvasSize.height,
                ...style,
            }}
        >
            <canvas
                ref={canvasProps.canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
            {children && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                    }}
                >
                    {children}
                </div>
            )}
        </div>
    );
};

// Modern wrapper component with backward compatibility
export const LiquidGlass: React.FC<LiquidGlassProps> = (props) => {
    const config = useMemo(() => mapLegacyProps(props), [props]);

    return (
        <LiquidGlassProvider config={config}>
            <LiquidGlassCore {...props} />
        </LiquidGlassProvider>
    );
};

// Re-export types and utilities
export type { RenderPassConfig, UniformValue, RenderUniformValue } from "./impl/types/lib";
export type { LiquidGlassConfig, LiquidGlassPreset } from "./impl/types";

// Export utilities for advanced usage
export { MultiPassRenderer, ShaderProgram, FrameBuffer, RenderPass, loadTextureFromURL, createEmptyTexture, updateVideoTexture, computeGaussianKernelByRadius } from "./impl/lib";

// Export modern wrapper utilities
export { LiquidGlassProvider, useLiquidGlassContext } from "./impl/context/LiquidGlassProvider";
export { createLiquidGlassPreset } from "./impl/presets";
export { useLiquidGlassCanvas } from "./impl/hooks/useLiquidGlassCanvas";
export { useLiquidGlassRenderer } from "./impl/hooks/useLiquidGlassRenderer";
export { useLiquidGlassInteraction } from "./impl/hooks/useLiquidGlassInteraction";

// Export component factory
export { createLiquidGlassComponentFactory as createLiquidGlassComponent, useLiquidGlassHook as useLiquidGlass };

// Default export
export default LiquidGlass;
