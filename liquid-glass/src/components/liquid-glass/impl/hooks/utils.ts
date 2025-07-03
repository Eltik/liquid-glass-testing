export const constrainPosition = (x: number, y: number, width: number, height: number, offset = 10): { x: number; y: number } => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const bounds = {
        minX: offset,
        maxX: viewportWidth - width - offset,
        minY: offset,
        maxY: viewportHeight - height - offset,
    };

    return {
        x: Math.max(bounds.minX, Math.min(bounds.maxX, x)),
        y: Math.max(bounds.minY, Math.min(bounds.maxY, y)),
    };
};

const DEFAULT_PADDING = {
    top: 24,
    right: 32,
    bottom: 24,
    left: 32,
};

export const getPaddingValues = (paddingStr: string) => {
    const values = paddingStr.split(" ").map((v) => parseInt(v.replace("px", ""), 10) || 0);

    switch (values.length) {
        case 1:
            return {
                top: values[0]!,
                right: values[0]!,
                bottom: values[0]!,
                left: values[0]!,
            };
        case 2:
            return {
                top: values[0]!,
                right: values[1]!,
                bottom: values[0]!,
                left: values[1]!,
            };
        case 4:
            return {
                top: values[0]!,
                right: values[1]!,
                bottom: values[2]!,
                left: values[3]!,
            };
        default:
            return DEFAULT_PADDING;
    }
};