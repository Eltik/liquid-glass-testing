/**
 * Single Rendering Pass for Multi-Pass Pipeline
 * 
 * This class represents a single rendering pass in a multi-pass rendering pipeline.
 * Each pass can either render to a framebuffer (for intermediate results) or
 * directly to the screen (for final output).
 * 
 * Key features:
 * - Encapsulates shader program, framebuffer, and vertex array object
 * - Automatic texture binding and uniform management
 * - Fullscreen quad rendering for post-processing effects
 * - Configurable output destination (framebuffer or screen)
 * 
 * The pass uses a fullscreen quad with vertices at (-1,-1), (1,-1), (-1,1), (1,1)
 * to cover the entire viewport, making it ideal for post-processing and effects.
 */

import type { IShaderSource, RenderPassConfig, RenderUniformValue } from "../../../types/lib";
import { FrameBuffer } from "./frameBuffer";
import { ShaderProgram } from "./shaderProgram";

export class RenderPass {
    /** WebGL2 rendering context */
    private gl: WebGL2RenderingContext;
    /** Shader program for this pass */
    private program: ShaderProgram;
    /** Output framebuffer (null if rendering to screen) */
    private frameBuffer: FrameBuffer | null;
    /** Vertex array object for fullscreen quad */
    private vao: WebGLVertexArrayObject;
    /** Configuration for this render pass */
    public config: RenderPassConfig;

    /**
     * Create a new render pass
     * 
     * @param gl - WebGL2 rendering context
     * @param shaderSource - Vertex and fragment shader source code
     * @param outputToScreen - Whether to render to screen (true) or framebuffer (false)
     */
    constructor(gl: WebGL2RenderingContext, shaderSource: IShaderSource, outputToScreen = false) {
        this.gl = gl;
        this.config = { name: "", shader: shaderSource };
        this.program = new ShaderProgram(gl, shaderSource);
        // Create framebuffer for intermediate results, or null for final output
        this.frameBuffer = !outputToScreen ? new FrameBuffer(gl, gl.canvas.width, gl.canvas.height) : null;
        this.vao = this.createVAO();
    }

    /**
     * Set the configuration for this render pass
     * 
     * @param config - Render pass configuration including name and inputs
     */
    public setConfig(config: RenderPassConfig) {
        this.config = config;
    }

    /**
     * Execute this render pass
     * 
     * This method performs the complete rendering pipeline for this pass:
     * 1. Binds the appropriate render target (framebuffer or screen)
     * 2. Activates the shader program
     * 3. Sets all uniforms, handling texture bindings automatically
     * 4. Renders a fullscreen quad using the configured shaders
     * 
     * @param uniforms - Optional uniforms to set for this pass
     */
    public render(uniforms?: Record<string, RenderUniformValue>): void {
        const gl = this.gl;

        // Bind render target (framebuffer or screen)
        if (this.frameBuffer) {
            this.frameBuffer.bind();
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        // Activate shader program
        this.program.use();

        // Set uniforms and bind textures
        if (uniforms) {
            let textureCount = 0;
            Object.entries(uniforms).forEach(([name, value]) => {
                if (value instanceof WebGLTexture) {
                    // Bind texture to next available texture unit
                    gl.activeTexture(gl.TEXTURE0 + textureCount);
                    gl.bindTexture(gl.TEXTURE_2D, value);
                    this.program.setUniform(name, textureCount);
                    textureCount += 1;
                } else {
                    // Set non-texture uniform
                    this.program.setUniform(name, value);
                }
            });
        }

        // Render fullscreen quad
        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindVertexArray(null);

        // Unbind render target
        if (this.frameBuffer) {
            this.frameBuffer.unbind();
        }
    }

    /**
     * Get the output texture from this render pass
     * 
     * @returns WebGL texture containing the rendered result, or null if rendering to screen
     */
    public getOutputTexture(): WebGLTexture | null {
        return this.frameBuffer ? this.frameBuffer.getTexture() : null;
    }

    /**
     * Resize the render pass output dimensions
     * 
     * @param width - New width in pixels
     * @param height - New height in pixels
     */
    public resize(width: number, height: number): void {
        if (this.frameBuffer) {
            this.frameBuffer.resize(width, height);
        }
    }

    /**
     * Clean up all GPU resources
     * 
     * This method must be called to prevent memory leaks. It disposes of
     * the framebuffer, shader program, vertex array object, and vertex buffer.
     */
    public dispose(): void {
        if (this.frameBuffer) {
            this.frameBuffer.dispose();
        }
        this.program.dispose();

        // Clean up vertex array object and associated buffer
        const gl = this.gl;
        gl.bindVertexArray(this.vao);
        const buffer = gl.getVertexAttrib(0, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING) as WebGLBuffer | null;
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        if (buffer) {
            gl.deleteBuffer(buffer);
        }

        gl.deleteVertexArray(this.vao);
    }

    /**
     * Create a vertex array object for fullscreen quad rendering
     * 
     * This method creates a VAO containing a fullscreen quad with vertices
     * positioned at the corners of normalized device coordinates (-1 to 1).
     * The quad is drawn as a triangle strip for efficiency.
     * 
     * Vertex layout:
     * (-1, 1)  ---- (1, 1)
     *    |         /|
     *    |        / |
     *    |       /  |
     *    |      /   |
     *    |     /    |
     *    |    /     |
     *    |   /      |
     *    |  /       |
     *    | /        |
     * (-1,-1) ---- (1,-1)
     * 
     * @returns Configured WebGL vertex array object
     */
    private createVAO(): WebGLVertexArrayObject {
        const gl = this.gl;

        // Create and bind VAO
        const vao = gl.createVertexArray();
        if (!vao) throw new Error("Failed to create VAO");
        gl.bindVertexArray(vao);

        // Create vertex buffer for fullscreen quad
        const buffer = gl.createBuffer();
        if (!buffer) throw new Error("Failed to create buffer");

        // Triangle strip vertices for fullscreen quad
        const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // Configure vertex attributes
        const positionLoc = this.program.getAttributeLocation("a_position");
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

        // Clean up bindings
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return vao;
    }
}
