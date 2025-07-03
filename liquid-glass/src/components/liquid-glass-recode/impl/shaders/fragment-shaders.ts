import type { Vec2 } from "../../types";

export const fragmentShaders = {
    standard: (uv: Vec2): Vec2 => {
        const centerX = uv.x - 0.5;
        const centerY = uv.y - 0.5;
        const distFromCenter = Math.sqrt(centerX * centerX + centerY * centerY);
        const lensStrength = Math.exp(-distFromCenter * 2.5) * 0.15;
        const r2 = centerX * centerX + centerY * centerY;
        const distortion = 1 + r2 * lensStrength;

        return {
            x: centerX * distortion + 0.5,
            y: centerY * distortion + 0.5,
        };
    },

    polar: (uv: Vec2): Vec2 => {
        const centerX = uv.x - 0.5;
        const centerY = uv.y - 0.5;
        const radius = Math.sqrt(centerX * centerX + centerY * centerY);
        const angle = Math.atan2(centerY, centerX);
        const radialEffect = Math.exp(-radius * 3) * 0.2;
        const angularOffset = Math.sin(angle * 3) * radialEffect * 0.3;
        const newRadius = radius * (1 + radialEffect);
        const newAngle = angle + angularOffset;

        return {
            x: Math.cos(newAngle) * newRadius + 0.5,
            y: Math.sin(newAngle) * newRadius + 0.5,
        };
    },

    prominent: (uv: Vec2): Vec2 => {
        const centerX = uv.x - 0.5;
        const centerY = uv.y - 0.5;
        const wave1 = Math.sin(uv.x * Math.PI * 4) * Math.sin(uv.y * Math.PI * 4);
        const wave2 = Math.cos(uv.x * Math.PI * 6) * Math.cos(uv.y * Math.PI * 6);
        const wave3 = Math.sin((uv.x + uv.y) * Math.PI * 8);
        const distFromCenter = Math.sqrt(centerX * centerX + centerY * centerY);
        const falloff = Math.exp(-distFromCenter * 2);
        const displacement = (wave1 * 0.4 + wave2 * 0.3 + wave3 * 0.3) * falloff * 0.25;

        return {
            x: centerX + displacement * centerX + 0.5,
            y: centerY + displacement * centerY + 0.5,
        };
    },
} as const;
