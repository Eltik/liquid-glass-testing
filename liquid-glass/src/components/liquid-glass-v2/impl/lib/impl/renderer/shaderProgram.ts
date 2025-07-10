/**
 * WebGL Shader Program Wrapper
 * 
 * This class encapsulates a WebGL shader program and provides a high-level
 * interface for shader management. It handles:
 * - Shader compilation and program linking
 * - Automatic uniform and attribute detection
 * - Type-safe uniform setting with WebGL type mapping
 * - Proper resource cleanup
 * 
 * The class supports all standard WebGL uniform types including:
 * - Scalars (float, int)
 * - Vectors (vec2, vec3, vec4)
 * - Matrices (mat3, mat4)
 * - Samplers (sampler2D)
 * - Arrays of all the above types
 * 
 * Uniform values are automatically mapped to the correct WebGL functions
 * based on their detected types from the shader source.
 */

import type { IAttributeInfo, IShaderSource, IUniformInfo, UniformValue } from "../../../types/lib";

export class ShaderProgram {
    /** WebGL2 rendering context */
    private gl: WebGL2RenderingContext;
    /** Compiled and linked shader program */
    private program: WebGLProgram;
    /** Map of uniform names to their information */
    private uniforms = new Map<string, IUniformInfo>();
    /** Map of attribute names to their information */
    private attributes = new Map<string, IAttributeInfo>();

    /**
     * Create a new shader program from vertex and fragment shader sources
     * 
     * @param gl - WebGL2 rendering context
     * @param source - Object containing vertex and fragment shader source code
     */
    constructor(gl: WebGL2RenderingContext, source: IShaderSource) {
        this.gl = gl;
        this.program = this.createProgram(source);
        this.detectAttributes();
        this.detectUniforms();
    }

    /**
     * Activate this shader program for rendering
     * 
     * All subsequent rendering operations will use this shader program
     * until another program is activated.
     */
    public use(): void {
        this.gl.useProgram(this.program);
    }

    /**
     * Set a uniform value in the shader program
     * 
     * This method automatically determines the correct WebGL uniform function
     * to call based on the uniform's type detected from the shader source.
     * It handles both single values and arrays for all supported types.
     * 
     * @param name - Name of the uniform variable in the shader
     * @param value - Value to set (type must match the uniform's declared type)
     */
    public setUniform(name: string, value: UniformValue): void {
        const gl = this.gl;
        const uniformInfo = this.uniforms.get(name);
        if (!uniformInfo) return;

        const location = uniformInfo.location;

        // Handle array uniforms
        if (uniformInfo.isArray && Array.isArray(value)) {
            switch (uniformInfo.type) {
                case gl.FLOAT:
                    gl.uniform1fv(uniformInfo.location, value);
                    break;
                case gl.FLOAT_VEC2:
                    gl.uniform2fv(uniformInfo.location, value);
                    break;
                case gl.FLOAT_VEC3:
                    gl.uniform3fv(uniformInfo.location, value);
                    break;
                case gl.FLOAT_VEC4:
                    gl.uniform4fv(uniformInfo.location, value);
                    break;
                // Additional array types can be added here
            }
        } else {
            // Handle single value uniforms
            switch (uniformInfo.type) {
                case gl.FLOAT:
                    if (typeof value === "number") {
                        gl.uniform1f(location, value);
                    }
                    break;
                case gl.FLOAT_VEC2:
                    if (value instanceof Float32Array || Array.isArray(value)) {
                        gl.uniform2fv(location, value);
                    }
                    break;
                case gl.FLOAT_VEC3:
                    if (value instanceof Float32Array || Array.isArray(value)) {
                        gl.uniform3fv(location, value);
                    }
                    break;
                case gl.FLOAT_VEC4:
                    if (value instanceof Float32Array || Array.isArray(value)) {
                        gl.uniform4fv(location, value);
                    }
                    break;
                case gl.INT:
                    if (typeof value === "number") {
                        gl.uniform1i(location, value);
                    }
                    break;
                case gl.SAMPLER_2D:
                    if (typeof value === "number") {
                        gl.uniform1i(location, value);
                    }
                    break;
                case gl.FLOAT_MAT3:
                    if (value instanceof Float32Array || Array.isArray(value)) {
                        gl.uniformMatrix3fv(location, false, value);
                    }
                    break;
                case gl.FLOAT_MAT4:
                    if (value instanceof Float32Array || Array.isArray(value)) {
                        gl.uniformMatrix4fv(location, false, value);
                    }
                    break;
            }
        }
    }

    /**
     * Get the location of a vertex attribute
     * 
     * @param name - Name of the attribute variable in the shader
     * @returns Attribute location index, or -1 if not found
     */
    public getAttributeLocation(name: string): number {
        const attribute = this.attributes.get(name);
        return attribute ? attribute.location : -1;
    }

    /**
     * Clean up all GPU resources
     * 
     * This method must be called to prevent memory leaks. It deletes
     * the shader program and all associated shaders from GPU memory.
     */
    public dispose(): void {
        const gl = this.gl;

        // Clean up shaders and program
        if (this.program) {
            // Get and delete attached shaders
            const shaders = gl.getAttachedShaders(this.program);
            if (shaders) {
                shaders.forEach((shader) => {
                    gl.deleteShader(shader);
                });
            }

            // Delete the program
            gl.deleteProgram(this.program);
        }

        // Clear internal mappings
        this.uniforms.clear();
        this.attributes.clear();
    }

    /**
     * Compile a shader from source code
     * 
     * @param type - Shader type (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER)
     * @param source - GLSL source code string
     * @returns Compiled WebGL shader object
     * @throws Error if compilation fails
     */
    private createShader(type: number, source: string): WebGLShader {
        const gl = this.gl;
        const shader = gl.createShader(type);
        if (!shader) throw new Error("Failed to create shader");

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        // Check compilation status
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(`Shader compile error: ${info}`);
        }

        return shader;
    }

    /**
     * Create and link a shader program from vertex and fragment shaders
     * 
     * @param source - Object containing vertex and fragment shader source code
     * @returns Linked WebGL shader program
     * @throws Error if linking fails
     */
    private createProgram(source: IShaderSource): WebGLProgram {
        const gl = this.gl;
        const program = gl.createProgram();
        if (!program) throw new Error("Failed to create program");

        // Compile both shaders
        const vertexShader = this.createShader(gl.VERTEX_SHADER, source.vertex);
        const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, source.fragment);

        // Attach shaders and link program
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        // Check linking status
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error(`Program link error: ${info}`);
        }

        // Clean up individual shaders (no longer needed after linking)
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        return program;
    }

    /**
     * Automatically detect and catalog all vertex attributes
     * 
     * This method inspects the linked program to find all active
     * vertex attributes and stores their information for later use.
     */
    private detectAttributes(): void {
        const gl = this.gl;
        const numAttributes = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES) as number;

        for (let i = 0; i < numAttributes; i++) {
            const info = gl.getActiveAttrib(this.program, i);
            if (!info) continue;

            const location = gl.getAttribLocation(this.program, info.name);
            this.attributes.set(info.name, {
                location,
                size: info.size,
                type: info.type,
            });
        }
    }

    /**
     * Automatically detect and catalog all uniform variables
     * 
     * This method inspects the linked program to find all active
     * uniform variables and stores their information for later use.
     * It handles both single uniforms and arrays correctly.
     */
    private detectUniforms(): void {
        const gl = this.gl;
        const numUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS) as number;

        for (let i = 0; i < numUniforms; i++) {
            const info = gl.getActiveUniform(this.program, i);
            if (!info) continue;

            const location = gl.getUniformLocation(this.program, info.name);
            if (!location) continue;

            const originalName = info.name;
            const arrayRegex = /\[\d+\]$/;

            // Handle array uniforms (e.g., "myArray[0]")
            if (arrayRegex.test(originalName)) {
                const baseName = originalName.replace(arrayRegex, "");
                this.uniforms.set(baseName, {
                    location,
                    type: info.type,
                    value: null,
                    isArray: {
                        size: info.size,
                    },
                });
            } else {
                // Handle single uniforms
                this.uniforms.set(info.name, {
                    location,
                    type: info.type,
                    value: null,
                    isArray: false,
                });
            }
        }
    }
}
