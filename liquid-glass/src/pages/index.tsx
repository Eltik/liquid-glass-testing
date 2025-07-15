/**
 * Liquid Glass v2 Demo Page
 * 
 * Interactive demo showcasing the liquid-glass-v2 component with comprehensive
 * controls for all visual parameters. Allows real-time experimentation with
 * glass effects, physics, and rendering settings.
 * 
 * Features:
 * - Live parameter adjustment with immediate visual feedback
 * - Background type switching (patterns, images, videos)
 * - Physics tuning (spring stiffness, damping, elasticity)
 * - Visual effect controls (blur, refraction, glare, shadows)
 * - Debug mode for development and education
 * 
 * This demo serves as both a testing environment and documentation
 * of the component's capabilities.
 */

import React, { useCallback, useState } from "react";
import { LiquidGlass } from "~/components/liquid-glass";
import { type NextPage } from "next";
import Head from "next/head";
import styles from "./index.module.css";

/**
 * Demo page component with interactive controls for liquid glass v2
 */
const Demo: NextPage = () => {
    /**
     * Settings state for all liquid glass parameters
     * Organized by category for clear parameter management
     */
    const [settings, setSettings] = useState({
        // Canvas settings - control rendering dimensions
        width: 600,
        height: 400,

        // Background settings - control scene content
        backgroundType: 0,          // 0=pattern, 10+=texture
        backgroundImage: "",        // URL for background image

        // Shape settings - control glass geometry
        shapeWidth: 200,           // Glass shape width in pixels
        shapeHeight: 200,          // Glass shape height in pixels
        shapeRadius: 80,           // Corner radius (0-100)
        shapeRoundness: 5,         // Corner curve smoothness
        showShape: true,           // Whether to show optional shapes
        mergeRate: 0.05,          // How smoothly shapes blend

        // Mouse interaction - control physics behavior
        enableMouseTracking: true,  // Enable mouse following
        springStiffness: 80,       // Spring responsiveness
        springDamping: 40,         // Spring damping factor
        springSizeFactor: 10,      // Velocity-based shape morphing

        // Blur settings
        blurRadius: 1,

        // Shadow settings
        shadowExpand: 25,
        shadowFactor: 15,
        shadowPosition: { x: 0, y: -10 },

        // Glass tint
        tint: { r: 255, g: 255, b: 255, a: 0 },

        // Refraction settings
        refractionThickness: 20,
        refractionFactor: 1.4,
        refractionDispersion: 7,
        refractionFresnelRange: 30,
        refractionFresnelHardness: 20,
        refractionFresnelFactor: 20,

        // Glare settings
        glareAngle: -45,
        glareRange: 30,
        glareHardness: 20,
        glareConvergence: 50,
        glareOppositeFactor: 80,
        glareFactor: 90,

        // Debug
        debugStep: 9,
    });

    const updateSetting = useCallback((key: string, value: string | number | boolean) => {
        setSettings((prev) => ({
            ...prev,
            [key]: value,
        }));
    }, []);

    const updateNestedSetting = useCallback((parent: string, key: string, value: string | number | boolean) => {
        setSettings((prev) => ({
            ...prev,
            [parent]: {
                ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
                [key]: value,
            },
        }));
    }, []);

    const [glSupported, setGlSupported] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleReady = useCallback((gl: WebGL2RenderingContext) => {
        console.log("WebGL2 context ready:", gl);
        setGlSupported(true);
        setError(null);
    }, []);

    const handleError = useCallback((error: Error) => {
        console.error("LiquidGlass error:", error);
        setGlSupported(false);
        setError(error.message);
    }, []);

    return (
        <>
            <Head>
                <title>Liquid Glass Demo</title>
                <meta name="description" content="Interactive demo of the Liquid Glass component" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <div className={styles.container}>
                <header className={styles.header}>
                    <h1>Liquid Glass Demo</h1>
                    <p>Interactive showcase of advanced liquid glass effects</p>
                </header>

                <div className={styles.content}>
                    <div className={styles.demo}>
                        <div className={styles.glassContainer}>
                            {glSupported === false ? (
                                <div className={styles.error}>
                                    <h3>WebGL2 Not Supported</h3>
                                    <p>{error}</p>
                                    <p>Please use a modern browser with WebGL2 support.</p>
                                </div>
                            ) : (
                                <LiquidGlass width={settings.width} height={settings.height} backgroundType={settings.backgroundType} backgroundImage={settings.backgroundImage} shapeWidth={settings.shapeWidth} shapeHeight={settings.shapeHeight} shapeRadius={settings.shapeRadius} shapeRoundness={settings.shapeRoundness} showShape={settings.showShape} mergeRate={settings.mergeRate} enableMouseTracking={settings.enableMouseTracking} springStiffness={settings.springStiffness} springDamping={settings.springDamping} springSizeFactor={settings.springSizeFactor} blurRadius={settings.blurRadius} shadowExpand={settings.shadowExpand} shadowFactor={settings.shadowFactor} shadowPosition={settings.shadowPosition} tint={settings.tint} refractionThickness={settings.refractionThickness} refractionFactor={settings.refractionFactor} refractionDispersion={settings.refractionDispersion} refractionFresnelRange={settings.refractionFresnelRange} refractionFresnelHardness={settings.refractionFresnelHardness} refractionFresnelFactor={settings.refractionFresnelFactor} glareAngle={settings.glareAngle} glareRange={settings.glareRange} glareHardness={settings.glareHardness} glareConvergence={settings.glareConvergence} glareOppositeFactor={settings.glareOppositeFactor} glareFactor={settings.glareFactor} debugStep={settings.debugStep} onReady={handleReady} onError={handleError} className={styles.liquidGlass}>
                                    <div className={styles.glassContent}>
                                        <h2>Liquid Glass Studio</h2>
                                        <p>Move your mouse to interact with the glass effect</p>
                                        <div className={styles.glassStats}>
                                            <div>WebGL2: {glSupported ? "✓" : "?"}</div>
                                            <div>Multi-pass: ✓</div>
                                            <div>Blur: ✓</div>
                                            <div>Refraction: ✓</div>
                                        </div>
                                    </div>
                                </LiquidGlass>
                            )}
                        </div>
                    </div>

                    <div className={styles.controls}>
                        <div className={styles.controlGroup}>
                            <h3>Canvas</h3>
                            <div className={styles.controlRow}>
                                <label>Width:</label>
                                <input type="range" min="300" max="800" value={settings.width} onChange={(e) => updateSetting("width", parseInt(e.target.value))} />
                                <span>{settings.width}px</span>
                            </div>
                            <div className={styles.controlRow}>
                                <label>Height:</label>
                                <input type="range" min="200" max="600" value={settings.height} onChange={(e) => updateSetting("height", parseInt(e.target.value))} />
                                <span>{settings.height}px</span>
                            </div>
                        </div>

                        <div className={styles.controlGroup}>
                            <h3>Shape</h3>
                            <div className={styles.controlRow}>
                                <label>Width:</label>
                                <input type="range" min="100" max="500" value={settings.shapeWidth} onChange={(e) => updateSetting("shapeWidth", parseInt(e.target.value))} />
                                <span>{settings.shapeWidth}px</span>
                            </div>
                            <div className={styles.controlRow}>
                                <label>Height:</label>
                                <input type="range" min="100" max="500" value={settings.shapeHeight} onChange={(e) => updateSetting("shapeHeight", parseInt(e.target.value))} />
                                <span>{settings.shapeHeight}px</span>
                            </div>
                            <div className={styles.controlRow}>
                                <label>Radius:</label>
                                <input type="range" min="0" max="100" value={settings.shapeRadius} onChange={(e) => updateSetting("shapeRadius", parseInt(e.target.value))} />
                                <span>{settings.shapeRadius}%</span>
                            </div>
                            <div className={styles.controlRow}>
                                <label>Roundness:</label>
                                <input type="range" min="1" max="10" step="0.1" value={settings.shapeRoundness} onChange={(e) => updateSetting("shapeRoundness", parseFloat(e.target.value))} />
                                <span>{settings.shapeRoundness}</span>
                            </div>
                            <div className={styles.controlRow}>
                                <label>
                                    <input type="checkbox" checked={settings.showShape} onChange={(e) => updateSetting("showShape", e.target.checked)} />
                                    Show Shape
                                </label>
                            </div>
                            <div className={styles.controlRow}>
                                <label>Merge Rate:</label>
                                <input type="range" min="0" max="0.3" step="0.01" value={settings.mergeRate} onChange={(e) => updateSetting("mergeRate", parseFloat(e.target.value))} />
                                <span>{settings.mergeRate}</span>
                            </div>
                        </div>

                        <div className={styles.controlGroup}>
                            <h3>Mouse Interaction</h3>
                            <div className={styles.controlRow}>
                                <label>
                                    <input type="checkbox" checked={settings.enableMouseTracking} onChange={(e) => updateSetting("enableMouseTracking", e.target.checked)} />
                                    Mouse Tracking
                                </label>
                            </div>
                            <div className={styles.controlRow}>
                                <label>Spring Stiffness:</label>
                                <input type="range" min="50" max="500" value={settings.springStiffness} onChange={(e) => updateSetting("springStiffness", parseInt(e.target.value))} />
                                <span>{settings.springStiffness}</span>
                            </div>
                            <div className={styles.controlRow}>
                                <label>Spring Damping:</label>
                                <input type="range" min="10" max="100" value={settings.springDamping} onChange={(e) => updateSetting("springDamping", parseInt(e.target.value))} />
                                <span>{settings.springDamping}</span>
                            </div>
                            <div className={styles.controlRow}>
                                <label>Size Factor:</label>
                                <input type="range" min="0" max="100" value={settings.springSizeFactor} onChange={(e) => updateSetting("springSizeFactor", parseInt(e.target.value))} />
                                <span>{settings.springSizeFactor}%</span>
                            </div>
                        </div>

                        <div className={styles.controlGroup}>
                            <h3>Blur & Shadow</h3>
                            <div className={styles.controlRow}>
                                <label>Blur Radius:</label>
                                <input type="range" min="0" max="100" value={settings.blurRadius} onChange={(e) => updateSetting("blurRadius", parseInt(e.target.value))} />
                                <span>{settings.blurRadius}px</span>
                            </div>
                            <div className={styles.controlRow}>
                                <label>Shadow Expand:</label>
                                <input type="range" min="0" max="100" value={settings.shadowExpand} onChange={(e) => updateSetting("shadowExpand", parseInt(e.target.value))} />
                                <span>{settings.shadowExpand}px</span>
                            </div>
                            <div className={styles.controlRow}>
                                <label>Shadow Factor:</label>
                                <input type="range" min="0" max="100" value={settings.shadowFactor} onChange={(e) => updateSetting("shadowFactor", parseInt(e.target.value))} />
                                <span>{settings.shadowFactor}%</span>
                            </div>
                        </div>

                        <div className={styles.controlGroup}>
                            <h3>Refraction</h3>
                            <div className={styles.controlRow}>
                                <label>Thickness:</label>
                                <input type="range" min="0" max="100" value={settings.refractionThickness} onChange={(e) => updateSetting("refractionThickness", parseInt(e.target.value))} />
                                <span>{settings.refractionThickness}px</span>
                            </div>
                            <div className={styles.controlRow}>
                                <label>Factor:</label>
                                <input type="range" min="0" max="3" step="0.1" value={settings.refractionFactor} onChange={(e) => updateSetting("refractionFactor", parseFloat(e.target.value))} />
                                <span>{settings.refractionFactor}</span>
                            </div>
                            <div className={styles.controlRow}>
                                <label>Dispersion:</label>
                                <input type="range" min="0" max="50" value={settings.refractionDispersion} onChange={(e) => updateSetting("refractionDispersion", parseInt(e.target.value))} />
                                <span>{settings.refractionDispersion}</span>
                            </div>
                            <div className={styles.controlRow}>
                                <label>Fresnel Range:</label>
                                <input type="range" min="0" max="100" value={settings.refractionFresnelRange} onChange={(e) => updateSetting("refractionFresnelRange", parseInt(e.target.value))} />
                                <span>{settings.refractionFresnelRange}</span>
                            </div>
                        </div>

                        <div className={styles.controlGroup}>
                            <h3>Glare</h3>
                            <div className={styles.controlRow}>
                                <label>Angle:</label>
                                <input type="range" min="0" max="360" value={settings.glareAngle} onChange={(e) => updateSetting("glareAngle", parseInt(e.target.value))} />
                                <span>{settings.glareAngle}°</span>
                            </div>
                            <div className={styles.controlRow}>
                                <label>Range:</label>
                                <input type="range" min="0" max="500" value={settings.glareRange} onChange={(e) => updateSetting("glareRange", parseInt(e.target.value))} />
                                <span>{settings.glareRange}</span>
                            </div>
                            <div className={styles.controlRow}>
                                <label>Factor:</label>
                                <input type="range" min="0" max="100" value={settings.glareFactor} onChange={(e) => updateSetting("glareFactor", parseInt(e.target.value))} />
                                <span>{settings.glareFactor}%</span>
                            </div>
                        </div>

                        <div className={styles.controlGroup}>
                            <h3>Tint</h3>
                            <div className={styles.controlRow}>
                                <label>Red:</label>
                                <input type="range" min="0" max="255" value={settings.tint.r} onChange={(e) => updateNestedSetting("tint", "r", parseInt(e.target.value))} />
                                <span>{settings.tint.r}</span>
                            </div>
                            <div className={styles.controlRow}>
                                <label>Green:</label>
                                <input type="range" min="0" max="255" value={settings.tint.g} onChange={(e) => updateNestedSetting("tint", "g", parseInt(e.target.value))} />
                                <span>{settings.tint.g}</span>
                            </div>
                            <div className={styles.controlRow}>
                                <label>Blue:</label>
                                <input type="range" min="0" max="255" value={settings.tint.b} onChange={(e) => updateNestedSetting("tint", "b", parseInt(e.target.value))} />
                                <span>{settings.tint.b}</span>
                            </div>
                            <div className={styles.controlRow}>
                                <label>Alpha:</label>
                                <input type="range" min="0" max="1" step="0.01" value={settings.tint.a} onChange={(e) => updateNestedSetting("tint", "a", parseFloat(e.target.value))} />
                                <span>{settings.tint.a.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className={styles.controlGroup}>
                            <h3>Debug</h3>
                            <div className={styles.controlRow}>
                                <label>Debug Step:</label>
                                <input type="range" min="0" max="10" value={settings.debugStep} onChange={(e) => updateSetting("debugStep", parseInt(e.target.value))} />
                                <span>{settings.debugStep}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <footer className={styles.footer}>
                    <p>Built with WebGL2 and React • Advanced multi-pass rendering pipeline</p>
                </footer>
            </div>
        </>
    );
};

export default Demo;
