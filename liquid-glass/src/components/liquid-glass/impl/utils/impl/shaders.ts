import { smoothStep, length, roundedRectSDF, texture } from "./utils";
import type { Vec2, ShaderOptions } from "../../../types";

const fragmentShaders = {
    liquidGlass: (uv: Vec2): Vec2 => {
        const ix = uv.x - 0.5;
        const iy = uv.y - 0.5;
        const distanceToEdge = roundedRectSDF(ix, iy, 0.3, 0.2, 0.6);
        const displacement = smoothStep(0.8, 0, distanceToEdge - 0.15);
        const scaled = smoothStep(0, 1, displacement);
        return texture(ix * scaled + 0.5, iy * scaled + 0.5);
    },

    ripple: (uv: Vec2, mouse?: Vec2): Vec2 => {
        const mouseX = mouse?.x ?? 0.5;
        const mouseY = mouse?.y ?? 0.5;
        const distToMouse = length(uv.x - mouseX, uv.y - mouseY);
        const rippleStrength = Math.sin(distToMouse * 20 - Date.now() * 0.01) * 0.02;
        const falloff = Math.exp(-distToMouse * 5);
        return texture(uv.x + rippleStrength * falloff, uv.y + rippleStrength * falloff);
    },

    vortex: (uv: Vec2): Vec2 => {
        const centerX = uv.x - 0.5;
        const centerY = uv.y - 0.5;
        const angle = Math.atan2(centerY, centerX);
        const radius = length(centerX, centerY);
        const vortexStrength = Math.exp(-radius * 4) * 0.3;
        const newAngle = angle + vortexStrength;
        return texture(Math.cos(newAngle) * radius + 0.5, Math.sin(newAngle) * radius + 0.5);
    },
} as const;

class ShaderDisplacementGenerator {
    private readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;
    private readonly canvasDPI = 1;

    constructor(private readonly options: ShaderOptions) {
        this.canvas = document.createElement("canvas");
        this.canvas.width = options.width * this.canvasDPI;
        this.canvas.height = options.height * this.canvasDPI;
        this.canvas.style.display = "none";

        const context = this.canvas.getContext("2d");
        if (!context) {
            throw new Error("Could not get 2D context");
        }
        this.context = context;
    }

    updateShader(mousePosition?: Vec2): string {
        const w = this.options.width * this.canvasDPI;
        const h = this.options.height * this.canvasDPI;
        const rawValues: number[] = [];
        let maxScale = 0;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const uv: Vec2 = { x: x / w, y: y / h };
                const pos = this.options.fragment(uv, mousePosition);
                const dx = pos.x * w - x;
                const dy = pos.y * h - y;
                maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy));
                rawValues.push(dx, dy);
            }
        }

        maxScale = maxScale > 0 ? Math.max(maxScale, 1) : 1;

        const imageData = this.context.createImageData(w, h);
        const data = imageData.data;
        let rawIndex = 0;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const dx = rawValues[rawIndex++] ?? 0;
                const dy = rawValues[rawIndex++] ?? 0;
                const edgeDistance = Math.min(x, y, w - x - 1, h - y - 1);
                const edgeFactor = Math.min(1, edgeDistance / 2);
                const smoothedDx = dx * edgeFactor;
                const smoothedDy = dy * edgeFactor;
                const r = smoothedDx / maxScale + 0.5;
                const g = smoothedDy / maxScale + 0.5;
                const pixelIndex = (y * w + x) * 4;

                data[pixelIndex] = Math.max(0, Math.min(255, r * 255));
                data[pixelIndex + 1] = Math.max(0, Math.min(255, g * 255));
                data[pixelIndex + 2] = Math.max(0, Math.min(255, g * 255));
                data[pixelIndex + 3] = 255;
            }
        }

        this.context.putImageData(imageData, 0, 0);
        return this.canvas.toDataURL();
    }

    destroy(): void {
        this.canvas.remove();
    }

    getScale(): number {
        return this.canvasDPI;
    }
}

export { ShaderDisplacementGenerator, fragmentShaders };
