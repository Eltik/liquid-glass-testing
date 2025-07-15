/**
 * Original Liquid Glass Component Test Page
 * 
 * Demonstrates the original liquid-glass component with interactive controls.
 * Features the CSS-based glassmorphism effect with WebGL displacement mapping
 * and elastic physics interactions.
 * 
 * This page showcases:
 * - Multiple displacement modes (standard, polar, prominent)
 * - Real-time parameter adjustment
 * - Interactive glass panels with drag functionality
 * - Various visual effect controls
 * - Performance-optimized rendering
 * 
 * Serves as both a demo and testing environment for the original
 * liquid glass implementation.
 */

import { useState, useRef } from "react";
import { LiquidGlass } from "~/components/liquid-glass";

/**
 * Test page demonstrating the original liquid glass component
 */
export default function Test() {
    /** Reference to mouse tracking container */
    const mouseContainerRef = useRef<HTMLDivElement>(null);
    
    /** Visual effect parameters with interactive controls */
    const [displacementMode] = useState<"standard" | "polar" | "prominent">("standard");
    const [displacementScale] = useState(70);
    const [aberrationIntensity] = useState(2);
    const [elasticity] = useState(0.15);
    const [saturation] = useState(140);
    const [blurAmount] = useState(0.0625);

    /**
     * Common props shared across liquid glass instances
     * Consolidates settings for consistent appearance and behavior
     */
    const commonProps = {
        padding: "16px 32px",           // Content padding
        cornerRadius: 16,              // Border radius
        displacementScale,             // WebGL displacement intensity
        className: "shadow-lg",        // Additional styling
        mode: displacementMode,        // Visual displacement mode
        aberrationIntensity,           // Chromatic aberration strength
        elasticity,                    // Physics responsiveness
        blurAmount,                    // Backdrop blur intensity
        saturation,                    // Color saturation
        border: true,                  // Enable border effects
        draggable: true,               // Enable drag functionality
    };

    /** Active tab state for demo navigation */
    const [activeTab, setActiveTab] = useState("home");

    return (
        <>
            <main ref={mouseContainerRef} className="relative min-h-screen overflow-auto">
                {/* Background content matching example 2 */}
                <div className="absolute top-0 left-0 mb-96 min-h-[200vh] w-full pb-96">
                    <img src="https://picsum.photos/2000/2000" className="h-96 w-full object-cover" alt="Background demonstration image" />
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
                    <img src="https://picsum.photos/1200/1200" className="my-10 h-80 w-full object-cover" alt="Demonstration image 2" />
                    <img src="https://picsum.photos/1400/1300" className="my-10 h-72 w-full object-cover" alt="Demonstration image 3" />
                    <img src="https://picsum.photos/1100/1200" className="my-10 mb-96 h-96 w-full object-cover" alt="Demonstration image 4" />
                </div>

                <LiquidGlass {...commonProps} initialPosition={{ x: 600, y: 350 }} mouseContainer={mouseContainerRef}>
                    <nav className="flex items-center space-x-6 text-white">
                        <div className="text-lg font-bold">Standard Glass</div>
                        <div className="flex space-x-4">
                            {["Home", "About", "Services", "Contact"].map((item) => (
                                <button key={item} onClick={() => setActiveTab(item.toLowerCase())} className={`rounded-lg px-3 py-2 transition-all ${activeTab === item.toLowerCase() ? "bg-white/30 text-yellow-300" : "hover:bg-white/20"}`}>
                                    {item}
                                </button>
                            ))}
                        </div>
                    </nav>
                </LiquidGlass>

                <LiquidGlass {...commonProps} initialPosition={{ x: 50, y: 100 }} mouseContainer={mouseContainerRef}>
                    <nav className="flex items-center space-x-6 text-white">
                        <div className="text-lg font-bold">Standard Glass</div>
                        <div className="flex space-x-4">
                            {["Home", "About", "Services", "Contact"].map((item) => (
                                <button key={item} onClick={() => setActiveTab(item.toLowerCase())} className={`rounded-lg px-3 py-2 transition-all ${activeTab === item.toLowerCase() ? "bg-white/30 text-yellow-300" : "hover:bg-white/20"}`}>
                                    {item}
                                </button>
                            ))}
                        </div>
                    </nav>
                </LiquidGlass>
            </main>
        </>
    );
}
