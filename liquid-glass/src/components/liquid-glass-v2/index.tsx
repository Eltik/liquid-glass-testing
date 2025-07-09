import React, { useEffect, useRef, useState, useMemo, useCallback, type CSSProperties } from "react";
import { MultiPassRenderer, loadTextureFromURL, createEmptyTexture, updateVideoTexture, computeGaussianKernelByRadius } from "./impl/lib";
import type { RenderUniformValue } from "./impl/types/lib";

// Import shaders from TypeScript modules
import { VertexShader, FragmentBgShader, FragmentBgVblurShader, FragmentBgHblurShader, FragmentMainShader } from "./impl/shaders";

// Types
export interface LiquidGlassProps {
    children?: React.ReactNode;
    className?: string;
    style?: CSSProperties;

    // Canvas settings
    width?: number;
    height?: number;
    dpr?: number;

    // Background settings
    backgroundType?: number;
    backgroundImage?: string;
    backgroundVideo?: HTMLVideoElement;

    // Shape settings
    shapeWidth?: number;
    shapeHeight?: number;
    shapeRadius?: number; // 0-100
    shapeRoundness?: number;
    showShape?: boolean;
    mergeRate?: number;

    // Mouse interaction
    enableMouseTracking?: boolean;
    springStiffness?: number;
    springDamping?: number;
    springSizeFactor?: number;

    // Blur settings
    blurRadius?: number;

    // Shadow settings
    shadowExpand?: number;
    shadowFactor?: number; // 0-100
    shadowPosition?: { x: number; y: number };

    // Glass tint
    tint?: { r: number; g: number; b: number; a: number };

    // Refraction settings
    refractionThickness?: number;
    refractionFactor?: number;
    refractionDispersion?: number;
    refractionFresnelRange?: number;
    refractionFresnelHardness?: number; // 0-100
    refractionFresnelFactor?: number; // 0-100

    // Glare settings
    glareAngle?: number; // degrees
    glareRange?: number;
    glareHardness?: number; // 0-100
    glareConvergence?: number; // 0-100
    glareOppositeFactor?: number; // 0-100
    glareFactor?: number; // 0-100

    // Debug
    debugStep?: number;

    // Callbacks
    onReady?: (gl: WebGL2RenderingContext) => void;
    onError?: (error: Error) => void;
}

// Spring controller for smooth mouse tracking
class SpringController {
    private value: { x: number; y: number };
    private velocity: { x: number; y: number };
    private target: { x: number; y: number };
    private stiffness: number;
    private damping: number;
    private lastValue: { x: number; y: number };
    private lastTime: number | null = null;
    private displayVelocity: { x: number; y: number };

    constructor(initial = { x: 0, y: 0 }, stiffness = 170, damping = 26) {
        this.value = { ...initial };
        this.velocity = { x: 0, y: 0 };
        this.target = { ...initial };
        this.stiffness = stiffness;
        this.damping = damping;
        this.lastValue = { ...initial };
        this.displayVelocity = { x: 0, y: 0 };
    }

    setTarget(target: { x: number; y: number }) {
        this.target = target;
    }

    update(deltaTime: number) {
        const dt = Math.min(deltaTime / 1000, 0.1); // Cap at 100ms

        const dx = this.target.x - this.value.x;
        const dy = this.target.y - this.value.y;

        const ax = dx * this.stiffness - this.velocity.x * this.damping;
        const ay = dy * this.stiffness - this.velocity.y * this.damping;

        this.velocity.x += ax * dt;
        this.velocity.y += ay * dt;

        this.value.x += this.velocity.x * dt;
        this.value.y += this.velocity.y * dt;

        // Calculate display velocity similar to react-spring
        const now = Date.now();
        if (this.lastTime) {
            const realDt = now - this.lastTime;
            const valueDx = this.value.x - this.lastValue.x;
            const valueDy = this.value.y - this.lastValue.y;

            // Convert to velocity in pixels per millisecond, then scale appropriately
            const speed = {
                x: valueDx / realDt,
                y: valueDy / realDt,
            };

            // Check for extreme values and reset if needed
            if (Math.abs(speed.x) > 1e10 || Math.abs(speed.y) > 1e10) {
                speed.x = 0;
                speed.y = 0;
            }

            this.displayVelocity = speed;
        }

        this.lastValue = { ...this.value };
        this.lastTime = now;
    }

    getValue() {
        return this.value;
    }

    getVelocity() {
        return this.displayVelocity;
    }
}

// Main component
export const LiquidGlass: React.FC<LiquidGlassProps> = ({ children, className, style, width, height, dpr, backgroundType = 0, backgroundImage, backgroundVideo, shapeWidth = 300, shapeHeight = 300, shapeRadius = 20, shapeRoundness = 3, showShape = true, mergeRate = 100, enableMouseTracking = true, springStiffness = 170, springDamping = 26, springSizeFactor = 20, blurRadius = 40, shadowExpand = 40, shadowFactor = 30, shadowPosition = { x: 0, y: 40 }, tint = { r: 255, g: 255, b: 255, a: 0.1 }, refractionThickness = 40, refractionFactor = 1.5, refractionDispersion = 20, refractionFresnelRange = 50, refractionFresnelHardness = 80, refractionFresnelFactor = 80, glareAngle = 45, glareRange = 250, glareHardness = 80, glareConvergence = 80, glareOppositeFactor = 30, glareFactor = 60, debugStep = 0, onReady, onError }) => {
    const [canvasSize, setCanvasSize] = useState(() => {
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

    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<MultiPassRenderer | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const springRef = useRef<SpringController>(new SpringController({ x: canvasSize.width / 2, y: canvasSize.height / 2 }, springStiffness, springDamping));

    // Update spring parameters when they change
    useEffect(() => {
        if (springRef.current) {
            springRef.current = new SpringController(springRef.current.getValue(), springStiffness, springDamping);
        }
    }, [springStiffness, springDamping]);
    const lastTimeRef = useRef<number>(0);
    const mousePositionRef = useRef({ x: canvasSize.width / 2, y: canvasSize.height / 2 });
    const bgTextureRef = useRef<WebGLTexture | null>(null);
    const bgTextureRatioRef = useRef(1);

    const blurWeights = useMemo(() => computeGaussianKernelByRadius(blurRadius), [blurRadius]);

    // Memoize callbacks to prevent unnecessary re-renders
    const handleReady = useCallback(
        (gl: WebGL2RenderingContext) => {
            onReady?.(gl);
        },
        [onReady],
    );

    const handleError = useCallback(
        (error: Error) => {
            onError?.(error);
        },
        [onError],
    );

    // Initialize WebGL
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const gl = canvas.getContext("webgl2");

        if (!gl) {
            handleError(new Error("WebGL2 not supported"));
            return;
        }

        // Check for required extensions
        const ext = gl.getExtension("EXT_color_buffer_float");
        if (!ext) {
            handleError(new Error("EXT_color_buffer_float not supported"));
            return;
        }

        try {
            // Create multi-pass renderer
            const renderer = new MultiPassRenderer(canvas, [
                {
                    name: "bgPass",
                    shader: {
                        vertex: VertexShader,
                        fragment: FragmentBgShader,
                    },
                },
                {
                    name: "vBlurPass",
                    shader: {
                        vertex: VertexShader,
                        fragment: FragmentBgVblurShader,
                    },
                    inputs: {
                        u_prevPassTexture: "bgPass",
                    },
                },
                {
                    name: "hBlurPass",
                    shader: {
                        vertex: VertexShader,
                        fragment: FragmentBgHblurShader,
                    },
                    inputs: {
                        u_prevPassTexture: "vBlurPass",
                    },
                },
                {
                    name: "mainPass",
                    shader: {
                        vertex: VertexShader,
                        fragment: FragmentMainShader,
                    },
                    inputs: {
                        u_blurredBg: "hBlurPass",
                        u_bg: "bgPass",
                    },
                    outputToScreen: true,
                },
            ]);

            rendererRef.current = renderer;
            handleReady(gl);

            // Load background texture if provided
            if (backgroundImage) {
                loadTextureFromURL(gl, backgroundImage)
                    .then(({ texture, ratio }) => {
                        bgTextureRef.current = texture;
                        bgTextureRatioRef.current = ratio;
                    })
                    .catch((error) => {
                        console.error("Failed to load background image:", error);
                    });
            } else if (!backgroundImage && !backgroundVideo) {
                bgTextureRef.current = createEmptyTexture(gl);
            }
        } catch (error) {
            handleError(error as Error);
        }

        return () => {
            if (rendererRef.current) {
                rendererRef.current.dispose();
                rendererRef.current = null;
            }
            if (bgTextureRef.current && gl) {
                gl.deleteTexture(bgTextureRef.current);
                bgTextureRef.current = null;
            }
        };
    }, [backgroundImage, backgroundVideo, handleReady, handleError]);

    // Handle canvas resize
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        canvas.width = canvasSize.width * canvasSize.dpr;
        canvas.height = canvasSize.height * canvasSize.dpr;

        // Update mouse position and spring to center
        const centerX = (canvasSize.width * canvasSize.dpr) / 2;
        const centerY = (canvasSize.height * canvasSize.dpr) / 2;
        mousePositionRef.current = { x: centerX, y: centerY };
        springRef.current.setTarget({ x: centerX, y: centerY });

        if (rendererRef.current) {
            const gl = canvas.getContext("webgl2");
            if (gl) {
                gl.viewport(0, 0, canvas.width, canvas.height);
                rendererRef.current.resize(canvas.width, canvas.height);
            }
        }
    }, [canvasSize]);

    // Handle mouse tracking
    useEffect(() => {
        if (!enableMouseTracking || !containerRef.current) return;

        const container = containerRef.current;

        const handlePointerMove = (e: PointerEvent) => {
            const rect = container.getBoundingClientRect();
            const relativeX = e.clientX - rect.left;
            const relativeY = e.clientY - rect.top;

            mousePositionRef.current = {
                x: relativeX * canvasSize.dpr,
                y: (rect.height - relativeY) * canvasSize.dpr,
            };
            springRef.current.setTarget(mousePositionRef.current);
        };

        container.addEventListener("pointermove", handlePointerMove);

        return () => {
            container.removeEventListener("pointermove", handlePointerMove);
        };
    }, [enableMouseTracking, canvasSize]);

    // Animation loop
    useEffect(() => {
        if (!rendererRef.current) return;

        const renderer = rendererRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext("webgl2");
        if (!gl) return;

        let lastVideoTime = -1;

        const animate = (time: number) => {
            animationFrameRef.current = requestAnimationFrame(animate);

            const deltaTime = lastTimeRef.current ? time - lastTimeRef.current : 16;
            lastTimeRef.current = time;

            // Update spring physics
            springRef.current.update(deltaTime);
            const springValue = springRef.current.getValue();
            const springVelocity = springRef.current.getVelocity();

            // Calculate dynamic shape size based on velocity
            const shapeSizeSpring = {
                x: shapeWidth + (Math.abs(springVelocity.x) * shapeWidth * springSizeFactor) / 100,
                y: shapeHeight + (Math.abs(springVelocity.y) * shapeHeight * springSizeFactor) / 100,
            };

            // Handle video texture updates
            if (backgroundVideo && bgTextureRef.current) {
                if (backgroundVideo.currentTime !== lastVideoTime) {
                    const info = updateVideoTexture(gl, bgTextureRef.current, backgroundVideo);
                    if (info) {
                        bgTextureRatioRef.current = info.ratio;
                        lastVideoTime = backgroundVideo.currentTime;
                    }
                }
            }

            // Clear canvas
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // Check for WebGL errors
            const error = gl.getError();
            if (error !== gl.NO_ERROR) {
                console.error("WebGL error:", error);
            }

            // Set global uniforms
            renderer.setUniforms({
                u_resolution: [canvas.width, canvas.height],
                u_dpr: canvasSize.dpr,
                u_blurWeights: blurWeights,
                u_blurRadius: blurRadius,
                u_mouse: [mousePositionRef.current.x, mousePositionRef.current.y],
                u_mouseSpring: [springValue.x, springValue.y],
                u_shapeWidth: shapeSizeSpring.x,
                u_shapeHeight: shapeSizeSpring.y,
                u_shapeRadius: ((Math.min(shapeSizeSpring.x, shapeSizeSpring.y) / 2) * shapeRadius) / 100,
                u_shapeRoundness: shapeRoundness,
                u_mergeRate: mergeRate,
                u_glareAngle: (glareAngle * Math.PI) / 180,
                u_showShape1: showShape ? 1 : 0,
            });

            // Debug logging (remove after testing)
            if (time % 1000 < 16) {
                // Log once per second
                console.log("Detailed debug:", {
                    canvasActual: `${canvas.width}x${canvas.height}`,
                    canvasSettings: `${canvasSize.width}x${canvasSize.height}`,
                    canvasProps: `${width}x${height}`,
                    dpr: canvasSize.dpr,
                    mouseSpring: `${springValue.x.toFixed(1)}, ${springValue.y.toFixed(1)}`,
                    shapeSize: `${shapeSizeSpring.x.toFixed(1)}x${shapeSizeSpring.y.toFixed(1)}`,
                    shapeRadius: ((Math.min(shapeSizeSpring.x, shapeSizeSpring.y) / 2) * shapeRadius) / 100,
                    showShape,
                    debugStep,
                    mergeRate,
                });
            }

            // Render passes with specific uniforms
            const bgPassUniforms: Record<string, RenderUniformValue> = {
                u_bgType: backgroundType,
                u_bgTextureRatio: bgTextureRatioRef.current,
                u_bgTextureReady: bgTextureRef.current ? 1 : 0,
                u_shadowExpand: shadowExpand,
                u_shadowFactor: shadowFactor / 100,
                u_shadowPosition: [-shadowPosition.x, -shadowPosition.y],
            };

            if (bgTextureRef.current) {
                bgPassUniforms.u_bgTexture = bgTextureRef.current;
            }

            const mainPassUniforms: Record<string, RenderUniformValue> = {
                u_tint: [tint.r / 255, tint.g / 255, tint.b / 255, tint.a],
                u_refThickness: refractionThickness,
                u_refFactor: refractionFactor,
                u_refDispersion: refractionDispersion,
                u_refFresnelRange: refractionFresnelRange,
                u_refFresnelHardness: refractionFresnelHardness / 100,
                u_refFresnelFactor: refractionFresnelFactor / 100,
                u_glareRange: glareRange,
                u_glareHardness: glareHardness / 100,
                u_glareConvergence: glareConvergence / 100,
                u_glareOppositeFactor: glareOppositeFactor / 100,
                u_glareFactor: glareFactor / 100,
                STEP: debugStep,
            };

            renderer.render({
                bgPass: bgPassUniforms,
                mainPass: mainPassUniforms,
            });
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [canvasSize, backgroundType, backgroundVideo, shapeWidth, shapeHeight, shapeRadius, shapeRoundness, showShape, mergeRate, springSizeFactor, blurRadius, blurWeights, shadowExpand, shadowFactor, shadowPosition, tint, refractionThickness, refractionFactor, refractionDispersion, refractionFresnelRange, refractionFresnelHardness, refractionFresnelFactor, glareAngle, glareRange, glareHardness, glareConvergence, glareOppositeFactor, glareFactor, debugStep]);

    // Handle window resize and initial client-side sizing
    useEffect(() => {
        if (typeof window === "undefined") return; // Skip during SSR

        // Update size when props change
        if (width && height) {
            setCanvasSize((_prev) => ({
                width: width,
                height: height,
                dpr: window.devicePixelRatio,
            }));
        } else if (!width && !height) {
            const browserDefaultSize = Math.min(window.innerWidth, window.innerHeight, 600);
            setCanvasSize((_prev) => ({
                width: browserDefaultSize,
                height: browserDefaultSize,
                dpr: window.devicePixelRatio,
            }));
        }

        const handleResize = () => {
            setCanvasSize((prev) => ({
                ...prev,
                dpr: window.devicePixelRatio,
            }));
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [width, height]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                position: "relative",
                width: canvasSize.width,
                height: canvasSize.height,
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
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

// Re-export types
export type { RenderPassConfig, UniformValue, RenderUniformValue } from "./impl/types/lib";

// Export utilities for advanced usage
export { MultiPassRenderer, ShaderProgram, FrameBuffer, RenderPass, loadTextureFromURL, createEmptyTexture, updateVideoTexture, computeGaussianKernelByRadius } from "./impl/lib";