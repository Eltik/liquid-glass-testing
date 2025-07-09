export class FrameBuffer {
    private gl: WebGL2RenderingContext;
    private fbo: WebGLFramebuffer;
    private texture: WebGLTexture;
    private depthTexture: WebGLTexture;
    private width: number;
    private height: number;

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

    public bind(): void {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
    }

    public unbind(): void {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    public getTexture(): WebGLTexture {
        return this.texture;
    }

    public getDepthTexture(): WebGLTexture {
        return this.depthTexture;
    }

    public resize(width: number, height: number): void {
        this.width = width;
        this.height = height;

        // Recreate texture attachments with new size
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA16F, width, height, 0, this.gl.RGBA, this.gl.FLOAT, null);

        this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthTexture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.DEPTH_COMPONENT24, width, height, 0, this.gl.DEPTH_COMPONENT, this.gl.UNSIGNED_INT, null);

        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }

    public dispose(): void {
        const gl = this.gl;
        gl.deleteFramebuffer(this.fbo);
        gl.deleteTexture(this.texture);
        gl.deleteTexture(this.depthTexture);
    }

    private createFramebuffer() {
        const gl = this.gl;

        // Create and bind FBO
        const fbo = gl.createFramebuffer();
        if (!fbo) throw new Error("Failed to create framebuffer");
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

        // Create color attachment
        const texture = gl.createTexture();
        if (!texture) throw new Error("Failed to create texture");
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, this.width, this.height, 0, gl.RGBA, gl.FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        // Create depth attachment
        const depthTexture = gl.createTexture();
        if (!depthTexture) throw new Error("Failed to create depth texture");
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, this.width, this.height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);

        // Check FBO status
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            throw new Error(`Framebuffer is incomplete: ${status}`);
        }

        // Unbind
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);

        return { fbo, texture, depthTexture };
    }
}
