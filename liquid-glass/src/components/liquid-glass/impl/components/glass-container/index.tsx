import { forwardRef, useId, useEffect, useRef, type CSSProperties, type PropsWithChildren } from "react";
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
    const containerRef = useRef<HTMLDivElement>(null);

    const isFirefox = typeof navigator !== "undefined" && navigator.userAgent.toLowerCase().includes("firefox");

    // Update CSS variables for dynamic values
    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;

        const blurValue = (overLight ? 12 : 4) + blurAmount * 32;
        const shadowValue = overLight ? "0px 16px 70px rgba(0, 0, 0, 0.75)" : "0px 12px 40px rgba(0, 0, 0, 0.25)";
        const textShadowValue = overLight ? "0px 2px 12px rgba(0, 0, 0, 0)" : "0px 2px 12px rgba(0, 0, 0, 0.4)";

        element.style.setProperty('--glass-corner-radius', `${cornerRadius}px`);
        element.style.setProperty('--glass-blur-amount', `${blurValue}px`);
        element.style.setProperty('--glass-saturation', `${saturation}%`);
        element.style.setProperty('--glass-box-shadow', shadowValue);
        element.style.setProperty('--glass-text-shadow', textShadowValue);
        element.style.setProperty('--glass-padding', padding);
        element.style.setProperty('--glass-filter-url', isFirefox ? 'none' : `url(#${filterId})`);
    }, [cornerRadius, blurAmount, saturation, overLight, padding, filterId, isFirefox]);

    const backdropStyle = {
        filter: 'var(--glass-filter-url)',
        backdropFilter: `blur(var(--glass-blur-amount)) saturate(var(--glass-saturation))`,
    };

    return (
        <>
            <div 
                ref={(el) => {
                    containerRef.current = el;
                    if (typeof ref === 'function') {
                        ref(el);
                    } else if (ref) {
                        ref.current = el;
                    }
                }} 
                className={`relative ${className} ${active ? "active" : ""} ${Boolean(onClick) ? "cursor-pointer" : ""} overflow-hidden`} 
                style={{
                    ...style,
                    borderRadius: 'var(--glass-corner-radius)',
                    clipPath: 'inset(0 round var(--glass-corner-radius))',
                    WebkitClipPath: 'inset(0 round var(--glass-corner-radius))',
                }}
                onClick={onClick}
            >
                <GlassFilter mode={mode} id={filterId} displacementScale={displacementScale} aberrationIntensity={aberrationIntensity} width={glassSize.width} height={glassSize.height} cornerRadius={cornerRadius} />

                <div className="glass relative inline-flex items-center gap-6 overflow-hidden w-full h-full" style={{
                        borderRadius: 'var(--glass-corner-radius)',
                        padding: 'var(--glass-padding)',
                        transition: "transform 0.2s ease-in-out, opacity 0.2s ease-in-out",
                        boxShadow: 'var(--glass-box-shadow)',
                        clipPath: 'inset(0 round var(--glass-corner-radius))',
                        WebkitClipPath: 'inset(0 round var(--glass-corner-radius))'
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
                                borderRadius: 'var(--glass-corner-radius)',
                                overflow: "hidden",
                                clipPath: 'inset(0 round var(--glass-corner-radius))',
                                WebkitClipPath: 'inset(0 round var(--glass-corner-radius))',
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
                            textShadow: 'var(--glass-text-shadow)',
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
