import React from "react";

interface BorderLayersProps {
    border: boolean;
    overLight: boolean;
    borderPositionStyles: React.CSSProperties;
    containerStyle: React.CSSProperties;
    isDragging: boolean;
    onClick?: () => void;
}

export function BorderLayers({ border, overLight, borderPositionStyles, containerStyle, isDragging, onClick }: BorderLayersProps) {
    if (!border) return null;

    return (
        <>
            {/* Over light effect */}
            {overLight && (
                <>
                    <div
                        className="pointer-events-none bg-black opacity-20"
                        style={{
                            ...borderPositionStyles,
                            height: "var(--liquid-glass-height)",
                            width: "var(--liquid-glass-width)",
                            borderRadius: "var(--liquid-glass-corner-radius)",
                            pointerEvents: "none",
                            transition: "var(--liquid-glass-transition)",
                            overflow: "hidden",
                            clipPath: "inset(0 round var(--liquid-glass-corner-radius))",
                            WebkitClipPath: "inset(0 round var(--liquid-glass-corner-radius))",
                            willChange: "transform",
                        }}
                    />
                    <div
                        className="pointer-events-none bg-black opacity-100"
                        style={{
                            ...borderPositionStyles,
                            height: "var(--liquid-glass-height)",
                            width: "var(--liquid-glass-width)",
                            borderRadius: "var(--liquid-glass-corner-radius)",
                            pointerEvents: "none",
                            transition: "var(--liquid-glass-transition)",
                            overflow: "hidden",
                            clipPath: "inset(0 round var(--liquid-glass-corner-radius))",
                            WebkitClipPath: "inset(0 round var(--liquid-glass-corner-radius))",
                            willChange: "transform",
                        }}
                    />
                </>
            )}

            {/* Border layer 1 - screen blend */}
            <span
                className="border-layer-1"
                style={{
                    ...containerStyle,
                    zIndex: 10000,
                    pointerEvents: "none",
                    opacity: 0.2,
                    padding: "1.5px",
                    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    boxShadow: "0 0 0 0.5px rgba(255, 255, 255, 0.5) inset, 0 1px 3px rgba(255, 255, 255, 0.25) inset, 0 1px 4px rgba(0, 0, 0, 0.35)",
                    borderRadius: "var(--liquid-glass-corner-radius)",
                    overflow: "hidden",
                    clipPath: "inset(0 round var(--liquid-glass-corner-radius))",
                    WebkitClipPath: "inset(0 round var(--liquid-glass-corner-radius))",
                    willChange: "transform",
                    transition: isDragging ? "none" : "transform 0.2s ease-out",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "var(--liquid-glass-corner-radius)",
                        backgroundImage: isDragging ? `linear-gradient(135deg, rgba(255, 255, 255, 0.0) 0%, rgba(255, 255, 255, 0.12) 33%, rgba(255, 255, 255, 0.4) 66%, rgba(255, 255, 255, 0.0) 100%)` : `linear-gradient(var(--liquid-glass-gradient-angle), rgba(255, 255, 255, 0.0) 0%, rgba(255, 255, 255, var(--liquid-glass-border-opacity1)) var(--liquid-glass-border-stop1), rgba(255, 255, 255, var(--liquid-glass-border-opacity2)) var(--liquid-glass-border-stop2), rgba(255, 255, 255, 0.0) 100%)`,
                    }}
                />
            </span>

            {/* Border layer 2 - overlay blend */}
            <span
                className="border-layer-2"
                style={{
                    ...containerStyle,
                    zIndex: 10001,
                    pointerEvents: "none",
                    padding: "1.5px",
                    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    boxShadow: "0 0 0 0.5px rgba(255, 255, 255, 0.5) inset, 0 1px 3px rgba(255, 255, 255, 0.25) inset, 0 1px 4px rgba(0, 0, 0, 0.35)",
                    borderRadius: "var(--liquid-glass-corner-radius)",
                    overflow: "hidden",
                    clipPath: "inset(0 round var(--liquid-glass-corner-radius))",
                    WebkitClipPath: "inset(0 round var(--liquid-glass-corner-radius))",
                    willChange: "transform",
                    transition: isDragging ? "none" : "transform 0.2s ease-out",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "var(--liquid-glass-corner-radius)",
                        backgroundImage: isDragging ? `linear-gradient(135deg, rgba(255, 255, 255, 0.0) 0%, rgba(255, 255, 255, 0.32) 33%, rgba(255, 255, 255, 0.6) 66%, rgba(255, 255, 255, 0.0) 100%)` : `linear-gradient(var(--liquid-glass-gradient-angle), rgba(255, 255, 255, 0.0) 0%, rgba(255, 255, 255, var(--liquid-glass-overlay-opacity1)) var(--liquid-glass-overlay-stop1), rgba(255, 255, 255, var(--liquid-glass-overlay-opacity2)) var(--liquid-glass-overlay-stop2), rgba(255, 255, 255, 0.0) 100%)`,
                    }}
                />
            </span>

            {/* Hover effects */}
            {Boolean(onClick) && (
                <div
                    style={{
                        ...borderPositionStyles,
                        height: "var(--liquid-glass-height)",
                        width: "var(--liquid-glass-width)",
                        borderRadius: "var(--liquid-glass-corner-radius)",
                        pointerEvents: "none",
                        transition: isDragging ? "none" : "transform 0.2s ease-out, opacity 0.2s ease-out",
                        opacity: "var(--liquid-glass-hover-opacity)",
                        backgroundImage: "radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 60%)",
                        overflow: "hidden",
                        clipPath: "inset(0 round var(--liquid-glass-corner-radius))",
                        WebkitClipPath: "inset(0 round var(--liquid-glass-corner-radius))",
                        willChange: "transform, opacity",
                    }}
                />
            )}
        </>
    );
}
