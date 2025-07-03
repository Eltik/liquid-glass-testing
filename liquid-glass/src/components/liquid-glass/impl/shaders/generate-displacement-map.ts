import type { Vec2 } from "../../types";
import { fragmentShaders } from "./fragment-shaders";
import { createCanvasDataURL, createServerDataURL } from "./create-data-url";

const displacementCache = new Map<string, string>();

export const generateDisplacementMap = (type: "standard" | "polar" | "prominent", width = 256, height = 256): string => {
    const cacheKey = `${type}-${width}-${height}`;
    const cached = displacementCache.get(cacheKey);
    if (cached) return cached;

    try {
        const imageData = generateDisplacementMapData(type, width, height);
        const dataUrl = typeof window !== "undefined" && typeof document !== "undefined" ? createCanvasDataURL(imageData, width, height) : createServerDataURL(imageData, width, height);

        displacementCache.set(cacheKey, dataUrl);
        return dataUrl;
    } catch {
        return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    }
};

const generateDisplacementMapData = (type: "standard" | "polar" | "prominent", width = 256, height = 256): Uint8ClampedArray => {
    const data = new Uint8ClampedArray(width * height * 4);
    const fragment = fragmentShaders[type];
    const rawValues: number[] = [];
    let maxScale = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const uv: Vec2 = { x: x / width, y: y / height };
            const pos = fragment(uv);
            const dx = pos.x * width - x;
            const dy = pos.y * height - y;
            maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy));
            rawValues.push(dx, dy);
        }
    }

    maxScale = maxScale > 0 ? Math.max(maxScale, 1) : 1;

    let rawIndex = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dx = rawValues[rawIndex++] ?? 0;
            const dy = rawValues[rawIndex++] ?? 0;
            const edgeDistance = Math.min(x, y, width - x - 1, height - y - 1);
            const edgeFactor = Math.min(1, edgeDistance / 2);
            const smoothedDx = dx * edgeFactor;
            const smoothedDy = dy * edgeFactor;
            const r = smoothedDx / maxScale + 0.5;
            const g = smoothedDy / maxScale + 0.5;
            const pixelIndex = (y * width + x) * 4;

            data[pixelIndex] = Math.max(0, Math.min(255, r * 255));
            data[pixelIndex + 1] = Math.max(0, Math.min(255, g * 255));
            data[pixelIndex + 2] = Math.max(0, Math.min(255, g * 255));
            data[pixelIndex + 3] = 255;
        }
    }

    return data;
};
