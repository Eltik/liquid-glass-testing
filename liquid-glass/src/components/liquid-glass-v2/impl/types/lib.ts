export type UniformValue = number | Float32Array | Int32Array | number[] | [number, number] | [number, number, number] | [number, number, number, number];

export interface IUniformInfo {
    location: WebGLUniformLocation;
    type: number;
    value: UniformValue | null;
    isArray: false | { size: number };
}

export interface IAttributeInfo {
    location: number;
    size: number;
    type: number;
}

export interface IShaderSource {
    vertex: string;
    fragment: string;
}

export type RenderUniformValue = UniformValue | WebGLTexture;

export interface RenderPassConfig {
    name: string;
    shader: IShaderSource;
    inputs?: Record<string, string>;
    outputToScreen?: boolean;
}

export type ObserverCallback = (rect: DOMRect, target: HTMLElement) => void;
