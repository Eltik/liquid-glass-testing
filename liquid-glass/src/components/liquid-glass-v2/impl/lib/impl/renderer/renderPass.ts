import type { IShaderSource, RenderPassConfig, RenderUniformValue } from "../../../types/lib";
import { FrameBuffer } from "./frameBuffer";
import { ShaderProgram } from "./shaderProgram";

export class RenderPass {
    private gl: WebGL2RenderingContext;
    private program: ShaderProgram;
    private frameBuffer: FrameBuffer | null;
    private vao: WebGLVertexArrayObject;
    public config: RenderPassConfig;

    constructor(gl: WebGL2RenderingContext, shaderSource: IShaderSource, outputToScreen = false) {
        this.gl = gl;
        this.config = { name: "", shader: shaderSource };
        this.program = new ShaderProgram(gl, shaderSource);
        this.frameBuffer = !outputToScreen ? new FrameBuffer(gl, gl.canvas.width, gl.canvas.height) : null;
        this.vao = this.createVAO();
    }

    public setConfig(config: RenderPassConfig) {
        this.config = config;
    }

    public render(uniforms?: Record<string, RenderUniformValue>): void {
        const gl = this.gl;

        // Binding FBO
        if (this.frameBuffer) {
            this.frameBuffer.bind();
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        // Using shader program
        this.program.use();

        // Setting uniforms
        if (uniforms) {
            let textureCount = 0;
            Object.entries(uniforms).forEach(([name, value]) => {
                if (value instanceof WebGLTexture) {
                    gl.activeTexture(gl.TEXTURE0 + textureCount);
                    gl.bindTexture(gl.TEXTURE_2D, value);
                    this.program.setUniform(name, textureCount); // Bind to texture unit index
                    textureCount += 1;
                } else {
                    this.program.setUniform(name, value);
                }
            });
        }

        // Binding VAO and drawing
        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindVertexArray(null);

        // Unbinding FBO
        if (this.frameBuffer) {
            this.frameBuffer.unbind();
        }
    }

    public getOutputTexture(): WebGLTexture | null {
        return this.frameBuffer ? this.frameBuffer.getTexture() : null;
    }

    public resize(width: number, height: number): void {
        if (this.frameBuffer) {
            this.frameBuffer.resize(width, height);
        }
    }

    public dispose(): void {
        if (this.frameBuffer) {
            this.frameBuffer.dispose();
        }
        this.program.dispose();

        // Get and delete the buffer associated with the VAO
        const gl = this.gl;
        gl.bindVertexArray(this.vao);
        const buffer = gl.getVertexAttrib(0, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING) as WebGLBuffer | null;
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        if (buffer) {
            gl.deleteBuffer(buffer);
        }

        gl.deleteVertexArray(this.vao);
    }

    private createVAO(): WebGLVertexArrayObject {
        const gl = this.gl;

        // Create and bind VAO
        const vao = gl.createVertexArray();
        if (!vao) throw new Error("Failed to create VAO");
        gl.bindVertexArray(vao);

        // Create and set vertex buffer
        const buffer = gl.createBuffer();
        if (!buffer) throw new Error("Failed to create buffer");

        const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // Set vertex attributes
        const positionLoc = this.program.getAttributeLocation("a_position");
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

        // Unbind
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return vao;
    }
}
