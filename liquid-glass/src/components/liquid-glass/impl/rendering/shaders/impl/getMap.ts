import { generateDisplacementMap } from "../../shader-utils";

export const getMap = (mode: "standard" | "polar" | "prominent"): string => {
    // Only use WebGL implementation - no CPU fallback
    if (typeof window === "undefined" || typeof document === "undefined") {
        throw new Error("WebGL implementation requires browser environment");
    }

    switch (mode) {
        case "standard":
            return generateDisplacementMap("standard");
        case "polar":
            return generateDisplacementMap("polar");
        case "prominent":
            return generateDisplacementMap("prominent");
        default:
            throw new Error(`Invalid mode: ${String(mode)}`);
    }
};
