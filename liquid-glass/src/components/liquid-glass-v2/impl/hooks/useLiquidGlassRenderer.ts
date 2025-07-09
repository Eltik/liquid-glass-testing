import { useRef, useEffect, useCallback, useMemo } from "react";
import { useLiquidGlassContext } from "../context/LiquidGlassProvider";
import { MultiPassRenderer, loadTextureFromURL, createEmptyTexture, updateVideoTexture, computeGaussianKernelByRadius } from "../lib";
import type { RenderUniformValue } from "../types/lib";
import { VertexShader, FragmentBgShader, FragmentBgVblurShader, FragmentBgHblurShader, FragmentMainShader } from "../shaders";

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

interface UseLiquidGlassRendererProps {
    onReady?: (gl: WebGL2RenderingContext) => void;
    onError?: (error: Error) => void;
}

export const useLiquidGlassRenderer = ({ onReady, onError }: UseLiquidGlassRendererProps) => {
    const { config, canvasSize } = useLiquidGlassContext();
    const rendererRef = useRef<MultiPassRenderer | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const springRef = useRef<SpringController>(new SpringController({ x: canvasSize.width / 2, y: canvasSize.height / 2 }, config.interaction.springStiffness, config.interaction.springDamping));
    const lastTimeRef = useRef<number>(0);
    const mousePositionRef = useRef({ x: canvasSize.width / 2, y: canvasSize.height / 2 });
    const bgTextureRef = useRef<WebGLTexture | null>(null);
    const bgTextureRatioRef = useRef(1);

    const blurWeights = useMemo(() => computeGaussianKernelByRadius(config.blur.radius), [config.blur.radius]);

    // Update spring parameters when they change
    useEffect(() => {
        if (springRef.current) {
            springRef.current = new SpringController(springRef.current.getValue(), config.interaction.springStiffness, config.interaction.springDamping);
        }
    }, [config.interaction.springStiffness, config.interaction.springDamping]);

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

    const initializeRenderer = useCallback(
        (canvas: HTMLCanvasElement) => {
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
                if (config.background.image) {
                    loadTextureFromURL(gl, config.background.image)
                        .then(({ texture, ratio }) => {
                            bgTextureRef.current = texture;
                            bgTextureRatioRef.current = ratio;
                        })
                        .catch((error) => {
                            console.error("Failed to load background image:", error);
                        });
                } else if (!config.background.image && !config.background.video) {
                    bgTextureRef.current = createEmptyTexture(gl);
                }
            } catch (error) {
                handleError(error as Error);
            }
        },
        [config.background, handleReady, handleError],
    );

    const startAnimation = useCallback(
        (canvas: HTMLCanvasElement) => {
            if (!rendererRef.current) return;

            const renderer = rendererRef.current;
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
                    x: config.shape.width + (Math.abs(springVelocity.x) * config.shape.width * config.interaction.springSizeFactor) / 100,
                    y: config.shape.height + (Math.abs(springVelocity.y) * config.shape.height * config.interaction.springSizeFactor) / 100,
                };

                // Handle video texture updates
                if (config.background.video && bgTextureRef.current) {
                    if (config.background.video.currentTime !== lastVideoTime) {
                        const info = updateVideoTexture(gl, bgTextureRef.current, config.background.video);
                        if (info) {
                            bgTextureRatioRef.current = info.ratio;
                            lastVideoTime = config.background.video.currentTime;
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
                    u_blurRadius: config.blur.radius,
                    u_mouse: [mousePositionRef.current.x, mousePositionRef.current.y],
                    u_mouseSpring: [springValue.x, springValue.y],
                    u_shapeWidth: shapeSizeSpring.x,
                    u_shapeHeight: shapeSizeSpring.y,
                    u_shapeRadius: ((Math.min(shapeSizeSpring.x, shapeSizeSpring.y) / 2) * config.shape.radius) / 100,
                    u_shapeRoundness: config.shape.roundness,
                    u_mergeRate: config.shape.mergeRate,
                    u_glareAngle: (config.glare.angle * Math.PI) / 180,
                    u_showShape1: config.shape.visible ? 1 : 0,
                });

                // Render passes with specific uniforms
                const bgPassUniforms: Record<string, RenderUniformValue> = {
                    u_bgType: config.background.type,
                    u_bgTextureRatio: bgTextureRatioRef.current,
                    u_bgTextureReady: bgTextureRef.current ? 1 : 0,
                    u_shadowExpand: config.shadow.expand,
                    u_shadowFactor: config.shadow.factor / 100,
                    u_shadowPosition: [-config.shadow.position.x, -config.shadow.position.y],
                };

                if (bgTextureRef.current) {
                    bgPassUniforms.u_bgTexture = bgTextureRef.current;
                }

                const mainPassUniforms: Record<string, RenderUniformValue> = {
                    u_tint: [config.tint.r / 255, config.tint.g / 255, config.tint.b / 255, config.tint.a],
                    u_refThickness: config.refraction.thickness,
                    u_refFactor: config.refraction.factor,
                    u_refDispersion: config.refraction.dispersion,
                    u_refFresnelRange: config.refraction.fresnelRange,
                    u_refFresnelHardness: config.refraction.fresnelHardness / 100,
                    u_refFresnelFactor: config.refraction.fresnelFactor / 100,
                    u_glareRange: config.glare.range,
                    u_glareHardness: config.glare.hardness / 100,
                    u_glareConvergence: config.glare.convergence / 100,
                    u_glareOppositeFactor: config.glare.oppositeFactor / 100,
                    u_glareFactor: config.glare.factor / 100,
                    STEP: config.debug.step,
                };

                renderer.render({
                    bgPass: bgPassUniforms,
                    mainPass: mainPassUniforms,
                });
            };

            animationFrameRef.current = requestAnimationFrame(animate);
        },
        [config, canvasSize, blurWeights],
    );

    const cleanup = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (rendererRef.current) {
            rendererRef.current.dispose();
            rendererRef.current = null;
        }
        if (bgTextureRef.current) {
            const canvas = document.createElement("canvas");
            const gl = canvas.getContext("webgl2");
            if (gl) {
                gl.deleteTexture(bgTextureRef.current);
            }
            bgTextureRef.current = null;
        }
    }, []);

    return {
        initializeRenderer,
        startAnimation,
        cleanup,
        springRef,
        mousePositionRef,
    };
};
