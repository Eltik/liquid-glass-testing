export const getMap = (mode: "standard" | "polar" | "prominent"): string => {
    // Only use WebGL implementation - no CPU fallback
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        throw new Error('WebGL implementation requires browser environment');
    }
    
    // Use the optimized WebGL shader
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { generateOptimizedDisplacementMap } = require("./optimized-webgl-shader") as { 
        generateOptimizedDisplacementMap: (type: "standard" | "polar" | "prominent") => string 
    };
    
    switch (mode) {
        case "standard":
            return generateOptimizedDisplacementMap("standard");
        case "polar":
            return generateOptimizedDisplacementMap("polar");
        case "prominent":
            return generateOptimizedDisplacementMap("prominent");
        default:
            throw new Error(`Invalid mode: ${String(mode)}`);
    }
};
