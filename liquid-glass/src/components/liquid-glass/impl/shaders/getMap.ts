import { generateDisplacementMap } from "./generate-displacement-map";

export const getMap = (mode: "standard" | "polar" | "prominent") => {
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
