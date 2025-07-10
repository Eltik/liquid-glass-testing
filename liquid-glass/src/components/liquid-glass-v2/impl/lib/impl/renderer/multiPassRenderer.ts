/**
 * Multi-Pass Rendering System
 * 
 * This class orchestrates a multi-pass rendering pipeline where each pass
 * can use the output of previous passes as input. This is essential for
 * complex visual effects like the liquid glass effect.
 * 
 * Key features:
 * - Automatic pass ordering and dependency resolution
 * - Global uniform management across all passes
 * - Per-pass uniform overrides
 * - Automatic texture binding between passes
 * - Proper resource cleanup
 * 
 * The rendering pipeline for liquid glass consists of:
 * 1. Background pass - renders base scene with shadows
 * 2. Vertical blur pass - applies vertical Gaussian blur
 * 3. Horizontal blur pass - applies horizontal Gaussian blur
 * 4. Main pass - composites glass effects with blur results
 * 
 * Each pass can access textures from previous passes through the
 * inputs configuration, creating a flexible rendering graph.
 */

import type { RenderPassConfig, RenderUniformValue } from "../../../types/lib";
import { RenderPass } from "./renderPass";

export class MultiPassRenderer {
    /** WebGL2 rendering context */
    private gl: WebGL2RenderingContext;
    /** Map of pass names to render pass instances */
    private passes = new Map<string, RenderPass>();
    /** Array of passes in execution order */
    private passesArray: RenderPass[] = [];
    /** Global uniforms shared across all passes */
    private globalUniforms: Record<string, RenderUniformValue> = {};

    /**
     * Create a multi-pass renderer with the specified render passes
     * 
     * @param canvas - Canvas element to render to
     * @param configs - Array of render pass configurations in execution order
     */
    constructor(canvas: HTMLCanvasElement, configs: RenderPassConfig[]) {
        const gl = canvas.getContext("webgl2");
        if (!gl) throw new Error("WebGL 2 not supported");

        // Check for required extensions for high-precision rendering
        const ext = gl.getExtension("EXT_color_buffer_float");
        if (!ext) throw new Error("EXT_color_buffer_float not supported");

        this.gl = gl;

        // Create render passes in the specified order
        const passesArray: typeof this.passesArray = [];
        for (const [index, cfg] of configs.entries()) {
            const pass = new RenderPass(gl, cfg.shader, cfg.outputToScreen);
            pass.setConfig(cfg);
            this.passes.set(cfg.name, pass);
            passesArray[index] = pass;
        }
        this.passesArray = passesArray;
    }

    /**
     * Resize all render passes to new dimensions
     * 
     * @param width - New width in pixels
     * @param height - New height in pixels
     */
    public resize(width: number, height: number): void {
        this.passesArray.forEach((pass) => {
            pass.resize(width, height);
        });
    }

    /**
     * Set a global uniform value for all passes
     * 
     * @param name - Uniform name
     * @param value - Uniform value
     */
    public setUniform(name: string, value: RenderUniformValue): void {
        this.globalUniforms[name] = value;
    }

    /**
     * Set multiple global uniform values
     * 
     * @param uniforms - Object containing uniform name-value pairs
     */
    public setUniforms(uniforms: Record<string, RenderUniformValue>): void {
        Object.assign(this.globalUniforms, uniforms);
    }

    /**
     * Clear a specific global uniform
     * 
     * @param name - Name of uniform to clear
     */
    public clearUniform(name: string): void {
        delete this.globalUniforms[name];
    }

    /**
     * Clear all global uniforms
     */
    public clearAllUniforms(): void {
        this.globalUniforms = {};
    }

    /**
     * Execute the complete multi-pass rendering pipeline
     * 
     * This method renders all passes in sequence, automatically:
     * 1. Merging global uniforms with pass-specific uniforms
     * 2. Binding output textures from previous passes as inputs
     * 3. Executing each pass in the correct order
     * 
     * @param passUniforms - Optional per-pass uniforms (array by index or object by name)
     */
    public render(passUniforms?: Record<string, RenderUniformValue>[] | Record<string, Record<string, RenderUniformValue>>): void {
        this.passesArray.forEach((pass, index) => {
            // Start with global uniforms
            const uniforms: Record<string, RenderUniformValue> = { ...this.globalUniforms };

            // Merge pass-specific uniforms
            if (passUniforms) {
                if (Array.isArray(passUniforms)) {
                    // Array format: uniforms by pass index
                    Object.assign(uniforms, passUniforms[index]);
                } else {
                    // Object format: uniforms by pass name
                    Object.assign(uniforms, passUniforms[pass.config.name] ?? null);
                }
            }

            // Automatically bind input textures from previous passes
            if (pass.config.inputs) {
                Object.entries(pass.config.inputs).forEach(([uniformName, fromPassName]) => {
                    const fromPass = this.passes.get(fromPassName);
                    const texture = fromPass?.getOutputTexture();
                    if (texture) {
                        uniforms[uniformName] = texture;
                    }
                });
            }

            // Execute this pass
            pass.render(uniforms);
        });
    }

    /**
     * Clean up all GPU resources
     * 
     * This method must be called to prevent memory leaks. It disposes of
     * all render passes and clears all uniform references.
     */
    public dispose(): void {
        const gl = this.gl;

        // Dispose all render passes
        this.passes.forEach((pass) => {
            pass.dispose();
        });
        this.passes.clear();
        this.clearAllUniforms();

        // Clean up WebGL state
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
}
