export const getMap = (mode: "standard" | "polar" | "prominent"): string => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        try {
            // Dynamically import and use the optimized WebGL shader
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
        } catch (error) {
            console.warn('WebGL optimization failed, falling back to CPU implementation:', error);
        }
    }
    
    // Fallback to CPU implementation
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { generateDisplacementMap } = require("./generate-displacement-map") as { 
        generateDisplacementMap: (type: "standard" | "polar" | "prominent") => string 
    };
    
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
