import type { LiquidGlassConfig, LiquidGlassPreset } from "./types";

export const createLiquidGlassPreset = (preset: LiquidGlassPreset): LiquidGlassConfig => {
    const baseConfig: LiquidGlassConfig = {
        background: {
            type: 0,
        },
        shape: {
            width: 300,
            height: 300,
            radius: 20,
            roundness: 3,
            visible: true,
            mergeRate: 100,
        },
        interaction: {
            enableMouseTracking: true,
            springStiffness: 170,
            springDamping: 26,
            springSizeFactor: 20,
        },
        blur: {
            radius: 40,
        },
        shadow: {
            expand: 40,
            factor: 30,
            position: { x: 0, y: 40 },
        },
        tint: {
            r: 255,
            g: 255,
            b: 255,
            a: 0.1,
        },
        refraction: {
            thickness: 40,
            factor: 1.5,
            dispersion: 20,
            fresnelRange: 50,
            fresnelHardness: 80,
            fresnelFactor: 80,
        },
        glare: {
            angle: 45,
            range: 250,
            hardness: 80,
            convergence: 80,
            oppositeFactor: 30,
            factor: 60,
        },
        debug: {
            step: 0,
        },
    };

    switch (preset) {
        case "minimal":
            return {
                ...baseConfig,
                blur: { radius: 20 },
                shadow: { ...baseConfig.shadow, factor: 10 },
                tint: { r: 255, g: 255, b: 255, a: 0.05 },
                refraction: { ...baseConfig.refraction, factor: 1.2 },
                glare: { ...baseConfig.glare, factor: 30 },
            };
        case "glass":
            return {
                ...baseConfig,
                blur: { radius: 60 },
                shadow: { ...baseConfig.shadow, factor: 50 },
                tint: { r: 240, g: 248, b: 255, a: 0.15 },
                refraction: { ...baseConfig.refraction, factor: 1.8 },
                glare: { ...baseConfig.glare, factor: 80 },
            };
        case "frosted":
            return {
                ...baseConfig,
                blur: { radius: 100 },
                shadow: { ...baseConfig.shadow, factor: 60 },
                tint: { r: 255, g: 255, b: 255, a: 0.3 },
                refraction: { ...baseConfig.refraction, factor: 1.3, dispersion: 5 },
                glare: { ...baseConfig.glare, factor: 40 },
            };
        case "metallic":
            return {
                ...baseConfig,
                blur: { radius: 30 },
                shadow: { ...baseConfig.shadow, factor: 80 },
                tint: { r: 200, g: 200, b: 255, a: 0.2 },
                refraction: { ...baseConfig.refraction, factor: 2.0 },
                glare: { ...baseConfig.glare, factor: 100 },
            };
        case "crystal":
            return {
                ...baseConfig,
                blur: { radius: 80 },
                shadow: { ...baseConfig.shadow, factor: 70 },
                tint: { r: 255, g: 240, b: 255, a: 0.1 },
                refraction: { ...baseConfig.refraction, factor: 2.2, dispersion: 40 },
                glare: { ...baseConfig.glare, factor: 90 },
            };
        default:
            return baseConfig;
    }
};
