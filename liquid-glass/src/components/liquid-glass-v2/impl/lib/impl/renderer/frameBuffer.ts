/**
 * WebGL FrameBuffer Object (FBO) Wrapper
 * 
 * This class encapsulates a WebGL framebuffer object and its associated textures.
 * Framebuffers are essential for multi-pass rendering, allowing the GPU to render
 * to textures instead of directly to the screen.
 * 
 * Key features:
 * - High-precision RGBA16F color attachment for accurate intermediate results
 * - Depth attachment for proper depth testing in complex scenes
 * - Automatic resize handling for responsive rendering
 * - Proper resource cleanup to prevent memory leaks
 * 
 * The framebuffer uses:
 * - RGBA16F format for high dynamic range color values
 * - DEPTH_COMPONENT24 for standard depth precision
 * - Linear filtering for smooth texture sampling
 * - Clamp-to-edge wrapping to prevent artifacts
 */
export class FrameBuffer {
    /** WebGL2 rendering context */
    private gl: WebGL2RenderingContext;
    /** WebGL framebuffer object */
    private fbo: WebGLFramebuffer;
    /** Color attachment texture */
    private texture: WebGLTexture;
    /** Depth attachment texture */
    private depthTexture: WebGLTexture;
    /** Current framebuffer width */
    private width: number;
    /** Current framebuffer height */
    private height: number;

    /**
     * Create a new FrameBuffer with specified dimensions
     * 
     * @param gl - WebGL2 rendering context
     * @param width - Framebuffer width in pixels
     * @param height - Framebuffer height in pixels
     */
    constructor(gl: WebGL2RenderingContext, width: number, height: number) {
        this.gl = gl;
        this.width = width;
        this.height = height;

        // Create FBO and associated textures
        const { fbo, texture, depthTexture } = this.createFramebuffer();
        this.fbo = fbo;
        this.texture = texture;
        this.depthTexture = depthTexture;
    }

    /**
     * Bind this framebuffer as the current render target
     * 
     * All subsequent rendering operations will draw to this framebuffer
     * instead of the default screen framebuffer.
     */
    public bind(): void {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
    }

    /**
     * Unbind this framebuffer and return to default screen rendering
     * 
     * This restores rendering to the screen's default framebuffer.
     */
    public unbind(): void {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    /**
     * Get the color attachment texture
     * 
     * This texture contains the rendered color data and can be used
     * as input for subsequent rendering passes.
     * 
     * @returns WebGL texture containing color data
     */
    public getTexture(): WebGLTexture {
        return this.texture;
    }

    /**
     * Get the depth attachment texture
     * 
     * This texture contains depth information for proper depth testing
     * in complex rendering scenarios.
     * 
     * @returns WebGL texture containing depth data
     */
    public getDepthTexture(): WebGLTexture {
        return this.depthTexture;
    }

    /**
     * Resize the framebuffer to new dimensions
     * 
     * This method updates the texture attachments to match the new size.
     * It's more efficient than destroying and recreating the entire framebuffer.
     * 
     * @param width - New framebuffer width
     * @param height - New framebuffer height
     */
    public resize(width: number, height: number): void {
        this.width = width;
        this.height = height;

        // Recreate color attachment with new size
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA16F, width, height, 0, this.gl.RGBA, this.gl.FLOAT, null);

        // Recreate depth attachment with new size
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthTexture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.DEPTH_COMPONENT24, width, height, 0, this.gl.DEPTH_COMPONENT, this.gl.UNSIGNED_INT, null);

        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }

    /**
     * Clean up all GPU resources
     * 
     * This method must be called to prevent memory leaks. It deletes
     * the framebuffer and both texture attachments from GPU memory.
     */
    public dispose(): void {
        const gl = this.gl;
        gl.deleteFramebuffer(this.fbo);
        gl.deleteTexture(this.texture);
        gl.deleteTexture(this.depthTexture);
    }

    /**
     * Create and configure the framebuffer with attachments
     * 
     * This method sets up the complete framebuffer with:
     * - Color attachment using RGBA16F for high precision
     * - Depth attachment using DEPTH_COMPONENT24 for standard depth
     * - Proper texture filtering and wrapping parameters
     * - Validation of framebuffer completeness
     * 
     * @returns Object containing the framebuffer and texture references
     */
    private createFramebuffer() {
        const gl = this.gl;

        // Create and bind FBO
        const fbo = gl.createFramebuffer();
        if (!fbo) throw new Error("Failed to create framebuffer");
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

        // Create color attachment with high precision format
        const texture = gl.createTexture();
        if (!texture) throw new Error("Failed to create texture");
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, this.width, this.height, 0, gl.RGBA, gl.FLOAT, null);
        // Linear filtering for smooth results
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // Clamp to edge to prevent artifacts
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        // Create depth attachment for proper depth testing
        const depthTexture = gl.createTexture();
        if (!depthTexture) throw new Error("Failed to create depth texture");
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, this.width, this.height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
        // Nearest filtering for depth - no interpolation needed
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);

        // Verify framebuffer completeness
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            throw new Error(`Framebuffer is incomplete: ${status}`);
        }

        // Clean up bindings
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);

        return { fbo, texture, depthTexture };
    }
}
