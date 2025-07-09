import type { RenderPassConfig, RenderUniformValue } from "../../../types/lib";
import { RenderPass } from "./renderPass";

export class MultiPassRenderer {
    private gl: WebGL2RenderingContext;
    private passes = new Map<string, RenderPass>();
    private passesArray: RenderPass[] = [];
    private globalUniforms: Record<string, RenderUniformValue> = {};

    constructor(canvas: HTMLCanvasElement, configs: RenderPassConfig[]) {
        const gl = canvas.getContext("webgl2");
        if (!gl) throw new Error("WebGL 2 not supported");

        // Check floating point texture extensions
        const ext = gl.getExtension("EXT_color_buffer_float");
        if (!ext) throw new Error("EXT_color_buffer_float not supported");

        this.gl = gl;

        const passesArray: typeof this.passesArray = [];
        for (const [index, cfg] of configs.entries()) {
            const pass = new RenderPass(gl, cfg.shader, cfg.outputToScreen);
            pass.setConfig(cfg);
            this.passes.set(cfg.name, pass);
            passesArray[index] = pass;
        }
        this.passesArray = passesArray;
    }

    public resize(width: number, height: number): void {
        this.passesArray.forEach((pass) => {
            pass.resize(width, height);
        });
    }

    public setUniform(name: string, value: RenderUniformValue): void {
        this.globalUniforms[name] = value;
    }

    public setUniforms(uniforms: Record<string, RenderUniformValue>): void {
        Object.assign(this.globalUniforms, uniforms);
    }

    public clearUniform(name: string): void {
        delete this.globalUniforms[name];
    }

    public clearAllUniforms(): void {
        this.globalUniforms = {};
    }

    public render(passUniforms?: Record<string, RenderUniformValue>[] | Record<string, Record<string, RenderUniformValue>>): void {
        this.passesArray.forEach((pass, index) => {
            // Merge global uniforms and channel specific uniforms
            const uniforms: Record<string, RenderUniformValue> = { ...this.globalUniforms };

            // Merge channel specific uniforms (if any)
            if (passUniforms) {
                if (Array.isArray(passUniforms)) {
                    Object.assign(uniforms, passUniforms[index]);
                } else {
                    Object.assign(uniforms, passUniforms[pass.config.name] ?? null);
                }
            }

            // Merge input textures
            if (pass.config.inputs) {
                Object.entries(pass.config.inputs).forEach(([uniformName, fromPassName]) => {
                    const fromPass = this.passes.get(fromPassName);
                    const texture = fromPass?.getOutputTexture();
                    if (texture) {
                        uniforms[uniformName] = texture;
                    }
                });
            }

            pass.render(uniforms);
        });
    }

    public dispose(): void {
        const gl = this.gl;

        // Clear and dispose all passes
        this.passes.forEach((pass) => {
            pass.dispose();
        });
        this.passes.clear();
        this.clearAllUniforms();

        // Unbind any currently bound framebuffers and textures
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
}
