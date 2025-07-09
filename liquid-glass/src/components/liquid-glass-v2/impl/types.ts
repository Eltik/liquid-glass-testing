export interface LiquidGlassConfig {
    background: {
        type: number;
        image?: string;
        video?: HTMLVideoElement;
    };
    shape: {
        width: number;
        height: number;
        radius: number;
        roundness: number;
        visible: boolean;
        mergeRate: number;
    };
    interaction: {
        enableMouseTracking: boolean;
        springStiffness: number;
        springDamping: number;
        springSizeFactor: number;
    };
    blur: {
        radius: number;
    };
    shadow: {
        expand: number;
        factor: number;
        position: { x: number; y: number };
    };
    tint: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    refraction: {
        thickness: number;
        factor: number;
        dispersion: number;
        fresnelRange: number;
        fresnelHardness: number;
        fresnelFactor: number;
    };
    glare: {
        angle: number;
        range: number;
        hardness: number;
        convergence: number;
        oppositeFactor: number;
        factor: number;
    };
    debug: {
        step: number;
    };
}

export type LiquidGlassPreset = "default" | "minimal" | "glass" | "frosted" | "metallic" | "crystal";

export interface SpringState {
    value: { x: number; y: number };
    velocity: { x: number; y: number };
    target: { x: number; y: number };
}

export interface CanvasSize {
    width: number;
    height: number;
    dpr: number;
}

export interface LiquidGlassContextValue {
    config: LiquidGlassConfig;
    updateConfig: (newConfig: Partial<LiquidGlassConfig>) => void;
    canvasSize: CanvasSize;
    setCanvasSize: (size: CanvasSize) => void;
    springState: SpringState;
    mousePosition: { x: number; y: number };
}
