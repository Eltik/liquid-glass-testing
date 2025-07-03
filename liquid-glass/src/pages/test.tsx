import { useState, useRef } from "react";
import { LiquidGlass } from "~/components/liquid-glass-recode";

export default function Test() {
    const mouseContainerRef = useRef<HTMLDivElement>(null);
    const [displacementMode, setDisplacementMode] = useState<"standard" | "polar" | "prominent">("standard");
    const [displacementScale, setDisplacementScale] = useState(70);
    const [aberrationIntensity, setAberrationIntensity] = useState(2);
    const [elasticity, setElasticity] = useState(0.15);
    const [saturation, setSaturation] = useState(140);
    const [blurAmount, setBlurAmount] = useState(0.0625);

    // Common props for both implementations
    const commonProps = {
        padding: "16px 32px",
        cornerRadius: 16,
        displacementScale,
        className: "shadow-lg",
    };

    // Enhanced-specific props
    const enhancedProps = {
        mode: displacementMode,
        aberrationIntensity,
        elasticity,
        blurAmount,
        saturation,
    };

    return (
        <>
            <main ref={mouseContainerRef} className="relative min-h-screen overflow-auto">
                {/* Background content matching example 2 */}
                <div className="absolute top-0 left-0 mb-96 min-h-[200vh] w-full pb-96">
                    <img src="https://picsum.photos/2000/2000" className="h-96 w-full object-cover" />
                    <div className="flex flex-col gap-2" id="bright-section">
                        <h2 className="my-5 text-center text-2xl font-semibold">Enhanced Liquid Glass Demo</h2>
                        <p className="px-10 text-center">
                            Experience advanced liquid glass effects with multiple displacement modes, chromatic aberration, and elastic interactions.
                            <br />
                            Drag the glass components around the screen and experiment with different settings using the controls.
                            <br />
                            The enhanced implementation includes all features from example 2 while maintaining drag functionality.
                            <br />
                            Switch between Original and Enhanced modes to compare the different implementations.
                            <br />
                            Each displacement mode creates unique visual distortion patterns for varied aesthetic effects.
                            <br />
                            Real-time controls allow fine-tuning of saturation, blur, elasticity, and aberration intensity.
                        </p>
                    </div>
                    <img src="https://picsum.photos/1200/1200" className="my-10 h-80 w-full object-cover" />
                    <img src="https://picsum.photos/1400/1300" className="my-10 h-72 w-full object-cover" />
                    <img src="https://picsum.photos/1100/1200" className="my-10 mb-96 h-96 w-full object-cover" />
                </div>

                <LiquidGlass {...commonProps} {...enhancedProps} initialPosition={{ x: 50, y: 100 }} mouseContainer={mouseContainerRef}>
                    <nav className="flex items-center space-x-6 text-white">
                        <div className="text-lg font-bold">Standard Glass</div>
                    </nav>
                </LiquidGlass>
            </main>
        </>
    )
}