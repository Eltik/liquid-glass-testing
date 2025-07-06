/**
 * @fileoverview Advanced WebGL shader class for high-performance liquid glass displacement effects.
 * 
 * Implements a comprehensive WebGL shader system with optimized displacement mapping,
 * merged texture management, and direct canvas rendering. Designed for maximum performance
 * with consolidated resources, cached uniform locations, and efficient rendering pipelines.
 */

import { VERTEX_SHADER, FRAGMENT_SHADER } from "./webglConstants";

/**
 * High-performance WebGL shader class for liquid glass displacement effects.
 * 
 * Comprehensive shader implementation providing GPU-accelerated displacement mapping
 * with merged texture optimization, direct canvas rendering, and advanced resource
 * management. Supports multiple displacement modes in a single texture, eliminating
 * GPU-CPU synchronization overhead through direct rendering techniques.
 * 
 * Key optimizations:
 * - Merged displacement texture containing all 3 modes (384x128 layout)
 * - Cached uniform locations for minimal GL state changes
 * - Direct canvas rendering eliminating GPU-CPU sync overhead
 * - Efficient vertex buffer management with static data
 * - WebGL extension detection and utilization
 * - Comprehensive error handling and resource cleanup
 * 
 * Architecture:
 * - Single shader program handling all displacement modes
 * - Mode selection via uniform parameter (0.0/1.0/2.0)
 * - Texture-based displacement data for optimal GPU performance
 * - Frame buffer operations for advanced rendering techniques
 * 
 * @example
 * ```tsx
 * const canvas = document.createElement('canvas');
 * const shader = new Shader(canvas);
 * const sourceTexture = shader.createTextureFromElement(sourceElement);
 * 
 * shader.renderDirectToCanvas({
 *   mode: 'polar',
 *   displacementScale: 25,
 *   aberrationIntensity: 2,
 *   sourceTexture
 * });
 * ```
 */
export class Shader {
    public gl: WebGLRenderingContext;
    private program: WebGLProgram;
    private frameBuffer: WebGLFramebuffer;
    private outputTexture: WebGLTexture;
    private mergedDisplacementTexture: WebGLTexture;
    private vertexBuffer!: WebGLBuffer;
    private texCoordBuffer!: WebGLBuffer;

    // Cached uniform locations
    private uniforms: {
        sourceTexture: WebGLUniformLocation;
        mergedDisplacementMap: WebGLUniformLocation;
        mode: WebGLUniformLocation;
        displacementScale: WebGLUniformLocation;
        aberrationIntensity: WebGLUniformLocation;
    };

    /**
     * Initializes WebGL shader with comprehensive resource setup and extension detection.
     * 
     * Creates WebGL context with optimal settings, compiles shader programs, sets up
     * textures and buffers, and initializes all resources required for displacement
     * rendering. Includes automatic extension detection and comprehensive error handling.
     * 
     * @param canvas - HTML canvas element for WebGL context creation
     * @throws {Error} When WebGL is not supported or context creation fails
     * @throws {Error} When shader compilation or program linking fails
     */
    constructor(canvas: HTMLCanvasElement) {
        const gl = canvas.getContext("webgl", { antialias: true, alpha: false }) ?? canvas.getContext("experimental-webgl", { antialias: true, alpha: false });
        if (!gl || !(gl instanceof WebGLRenderingContext)) {
            throw new Error("WebGL not supported - GPU acceleration unavailable");
        }
        this.gl = gl;

        // Enable WebGL extensions if available
        const extensions = ["OES_texture_float", "OES_texture_float_linear", "WEBGL_lose_context"];

        extensions.forEach((ext) => {
            const extension: unknown = gl.getExtension(ext);
            if (extension) {
                console.log(`WebGL extension enabled: ${ext}`);
            }
        });

        // Compile and link shader program
        this.program = this.createShaderProgram();

        // Create resources
        this.frameBuffer = this.createFrameBuffer();
        this.outputTexture = this.createOutputTexture();
        this.mergedDisplacementTexture = this.createMergedDisplacementTexture();

        // Setup vertex data
        this.setupVertexData();

        // Cache uniform locations
        this.uniforms = {
            sourceTexture: gl.getUniformLocation(this.program, "u_sourceTexture")!,
            mergedDisplacementMap: gl.getUniformLocation(this.program, "u_mergedDisplacementMap")!,
            mode: gl.getUniformLocation(this.program, "u_mode")!,
            displacementScale: gl.getUniformLocation(this.program, "u_displacementScale")!,
            aberrationIntensity: gl.getUniformLocation(this.program, "u_aberrationIntensity")!,
        };

        console.log("WebGL Liquid Glass Shader initialized successfully");
    }

    private createShaderProgram(): WebGLProgram {
        const gl = this.gl;

        // Compile vertex shader
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        if (!vertexShader) {
            throw new Error("Failed to create vertex shader");
        }
        gl.shaderSource(vertexShader, VERTEX_SHADER);
        gl.compileShader(vertexShader);

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            throw new Error("Vertex shader compilation failed: " + gl.getShaderInfoLog(vertexShader));
        }

        // Compile fragment shader
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        if (!fragmentShader) {
            throw new Error("Failed to create fragment shader");
        }
        gl.shaderSource(fragmentShader, FRAGMENT_SHADER);
        gl.compileShader(fragmentShader);

        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            throw new Error("Fragment shader compilation failed: " + gl.getShaderInfoLog(fragmentShader));
        }

        // Link program
        const program = gl.createProgram();
        if (!program) {
            throw new Error("Failed to create shader program");
        }
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error("Shader program linking failed: " + gl.getProgramInfoLog(program));
        }

        // Clean up individual shaders
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        return program;
    }

    private createMergedDisplacementTexture(): WebGLTexture {
        const gl = this.gl;
        const texture = gl.createTexture();
        if (!texture) {
            throw new Error("Failed to create merged displacement texture");
        }

        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Create merged displacement map data (384x128: 3 modes side by side, reduced size)
        const mergedData = this.generateMergedDisplacementData();

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 384, 128, 0, gl.RGB, gl.UNSIGNED_BYTE, mergedData);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        return texture;
    }

    private generateMergedDisplacementData(): Uint8Array {
        const width = 384; // 3 modes × 128 width each
        const height = 128;
        const data = new Uint8Array(width * height * 3); // RGB format for better performance

        // Generate displacement maps for all three modes side by side
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 3;

                // Determine which mode section we're in
                const modeSection = Math.floor(x / 128); // 0=standard, 1=polar, 2=prominent
                const localX = x % 128; // Local x within the 128x128 section

                // UV coordinates for the local section
                const uv = { x: localX / 128, y: y / 128 };
                const center = { x: uv.x - 0.5, y: uv.y - 0.5 };
                const distSq = center.x * center.x + center.y * center.y;

                const displacement = { x: 0, y: 0 };

                // Calculate displacement based on mode
                switch (modeSection) {
                    case 0: // Standard mode - barrel distortion
                        {
                            const distortion = 1.0 + distSq * 0.3;
                            displacement.x = center.x * distortion;
                            displacement.y = center.y * distortion;
                        }
                        break;
                    case 1: // Polar mode - radial effect
                        {
                            const dist = Math.sqrt(distSq);
                            const angle = Math.atan2(center.y, center.x);
                            const newRadius = dist * 1.2;
                            displacement.x = Math.cos(angle) * newRadius;
                            displacement.y = Math.sin(angle) * newRadius;
                        }
                        break;
                    case 2: // Prominent mode - wave pattern
                        {
                            const wave = Math.sin(uv.x * 12.566) * Math.sin(uv.y * 12.566) * 0.1;
                            displacement.x = center.x * (1.0 + wave);
                            displacement.y = center.y * (1.0 + wave);
                        }
                        break;
                }

                // Apply edge falloff
                const edgeFactor = 1.0 - Math.max(0, Math.min(1, (Math.sqrt(distSq) - 0.3) / 0.2));
                displacement.x *= edgeFactor;
                displacement.y *= edgeFactor;

                // Normalize displacement to [0,1] range for texture encoding
                const normalizedX = displacement.x * 0.5 + 0.5;
                const normalizedY = displacement.y * 0.5 + 0.5;

                // Store in RGB format (more memory efficient)
                data[idx] = Math.floor(Math.max(0, Math.min(1, normalizedX)) * 255); // R
                data[idx + 1] = Math.floor(Math.max(0, Math.min(1, normalizedY)) * 255); // G
                data[idx + 2] = Math.floor(Math.max(0, Math.min(1, normalizedY)) * 255); // B (same as G for displacement map)
            }
        }

        return data;
    }

    private createFrameBuffer(): WebGLFramebuffer {
        const gl = this.gl;
        const frameBuffer = gl.createFramebuffer();
        if (!frameBuffer) {
            throw new Error("Failed to create framebuffer");
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

        return frameBuffer;
    }

    private createOutputTexture(): WebGLTexture {
        const gl = this.gl;
        const texture = gl.createTexture();
        if (!texture) {
            throw new Error("Failed to create output texture");
        }

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 128, 128, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        return texture;
    }

    private setupVertexData(): void {
        const gl = this.gl;

        // Vertex positions (full screen quad)
        const vertices = new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]);

        // Texture coordinates
        const texCoords = new Float32Array([0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0]);

        // Create and bind vertex buffer
        this.vertexBuffer = gl.createBuffer();
        if (!this.vertexBuffer) {
            throw new Error("Failed to create vertex buffer");
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // Create and bind texture coordinate buffer
        this.texCoordBuffer = gl.createBuffer();
        if (!this.texCoordBuffer) {
            throw new Error("Failed to create texture coordinate buffer");
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    }

    /**
     * Render liquid glass effect directly to canvas - eliminates GPU-CPU sync
     */
    public renderDirectToCanvas(params: { mode: "standard" | "polar" | "prominent"; displacementScale: number; aberrationIntensity: number; sourceTexture: WebGLTexture }): void {
        const gl = this.gl;

        // Render directly to main canvas (no framebuffer)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear canvas
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Use shader program
        gl.useProgram(this.program);

        // Bind source texture (content to be displaced)
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, params.sourceTexture);
        gl.uniform1i(this.uniforms.sourceTexture, 0);

        // Bind merged displacement texture
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.mergedDisplacementTexture);
        gl.uniform1i(this.uniforms.mergedDisplacementMap, 1);

        // Set uniforms
        gl.uniform1f(this.uniforms.mode, params.mode === "standard" ? 0.0 : params.mode === "polar" ? 1.0 : 2.0);
        gl.uniform1f(this.uniforms.displacementScale, params.displacementScale);
        gl.uniform1f(this.uniforms.aberrationIntensity, params.aberrationIntensity);

        // Setup vertex attributes
        const positionLocation = gl.getAttribLocation(this.program, "a_position");
        const texCoordLocation = gl.getAttribLocation(this.program, "a_texCoord");

        // Position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Texture coordinate attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

        // Draw directly to canvas (no GPU-CPU sync)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Flush to ensure rendering is complete
        gl.flush();
    }

    /**
     * Create texture from HTML element for source content
     */
    public createTextureFromElement(element: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement): WebGLTexture {
        const gl = this.gl;
        const texture = gl.createTexture();

        if (!texture) {
            throw new Error("Failed to create texture");
        }

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, element);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        return texture;
    }

    /**
     * Cleanup WebGL resources
     */
    public dispose(): void {
        const gl = this.gl;

        gl.deleteProgram(this.program);
        gl.deleteTexture(this.outputTexture);
        gl.deleteTexture(this.mergedDisplacementTexture);
        gl.deleteFramebuffer(this.frameBuffer);
        gl.deleteBuffer(this.vertexBuffer);
        gl.deleteBuffer(this.texCoordBuffer);
    }
}
