import { forwardRef, useId, type CSSProperties, type PropsWithChildren } from "react";
import { GlassFilter } from "../glass-filter";

export const GlassContainer = forwardRef<
    HTMLDivElement,
    PropsWithChildren<{
        className?: string;
        style?: React.CSSProperties;
        displacementScale?: number;
        blurAmount?: number;
        saturation?: number;
        aberrationIntensity?: number;
        mouseOffset?: { x: number; y: number };
        onMouseLeave?: () => void;
        onMouseEnter?: () => void;
        onMouseDown?: (e: React.MouseEvent) => void;
        onMouseUp?: () => void;
        active?: boolean;
        overLight?: boolean;
        cornerRadius?: number;
        padding?: string;
        glassSize?: { width: number; height: number };
        onClick?: () => void;
        mode?: "standard" | "polar" | "prominent";
        effectsRef?: React.RefObject<HTMLDivElement | null>;
    }>
>(({ children, className = "", style, displacementScale = 25, blurAmount = 12, saturation = 180, aberrationIntensity = 2, onMouseEnter, onMouseLeave, onMouseDown, onMouseUp, active = false, overLight = false, cornerRadius = 999, padding = "24px 32px", glassSize = { width: 270, height: 69 }, onClick, mode = "standard", effectsRef }, ref) => {
    const filterId = useId();

    const isFirefox = typeof navigator !== "undefined" && navigator.userAgent.toLowerCase().includes("firefox");

    const backdropStyle = {
        filter: isFirefox ? null : `url(#${filterId})`,
        backdropFilter: `blur(${(overLight ? 12 : 4) + blurAmount * 32}px) saturate(${saturation}%)`,
    };

    return (
        <>
            <div ref={ref} className={`relative ${className} ${active ? "active" : ""} ${Boolean(onClick) ? "cursor-pointer" : ""} overflow-hidden`} style={{
                    ...style,
                    borderRadius: `${cornerRadius}px`,
                    clipPath: `inset(0 round ${cornerRadius}px)`,
                    WebkitClipPath: `inset(0 round ${cornerRadius}px)`,
                }}
                onClick={onClick}
            >
                <GlassFilter mode={mode} id={filterId} displacementScale={displacementScale} aberrationIntensity={aberrationIntensity} width={glassSize.width} height={glassSize.height} cornerRadius={cornerRadius} />

                <div className="glass relative inline-flex items-center gap-6 overflow-hidden w-full h-full" style={{
                        borderRadius: `${cornerRadius}px`,
                        padding,
                        transition: "transform 0.2s ease-in-out, opacity 0.2s ease-in-out",
                        boxShadow: overLight ? "0px 16px 70px rgba(0, 0, 0, 0.75)" : "0px 12px 40px rgba(0, 0, 0, 0.25)",
                        clipPath: `inset(0 round ${cornerRadius}px)`,
                        WebkitClipPath: `inset(0 round ${cornerRadius}px)`
                    }}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    onMouseDown={onMouseDown}
                    onMouseUp={onMouseUp}
                >
                    {/* Backdrop layer that wiggles */}
                    <span className="glass__warp" style={
                            {
                                ...backdropStyle,
                                position: "absolute",
                                inset: "0",
                                borderRadius: `${cornerRadius}px`,
                                overflow: "hidden",
                                clipPath: `inset(0 round ${cornerRadius}px)`,
                                WebkitClipPath: `inset(0 round ${cornerRadius}px)`,
                            } as CSSProperties
                        }
                    />

                    {/* User content stays sharp */}
                    <div
                        ref={effectsRef}
                        className="text-white transition-all duration-150 ease-in-out"
                        style={{
                            position: "relative",
                            zIndex: 1,
                            font: "500 20px/1 system-ui",
                            textShadow: overLight ? "0px 2px 12px rgba(0, 0, 0, 0)" : "0px 2px 12px rgba(0, 0, 0, 0.4)",
                        }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </>
    );
});

GlassContainer.displayName = "EnhancedGlassContainer";
