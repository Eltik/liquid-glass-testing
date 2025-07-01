import Head from "next/head";
import { useState } from "react";
import LiquidGlass from "~/components/liquid-glass";
import EnhancedLiquidGlass from "~/components/liquid-glass/impl/enhanced";
import ModeSwitcher from "~/components/liquid-glass/impl/mode-switcher";
import DisplacementModeControls from "~/components/liquid-glass/impl/displacement-mode-controls";

export default function Home() {
  const [activeTab, setActiveTab] = useState("home");
  const [cardSize, setCardSize] = useState({ width: 320, height: 240 });
  const [implementationMode, setImplementationMode] = useState<
    "original" | "enhanced"
  >("enhanced");

  // Enhanced mode controls
  const [displacementMode, setDisplacementMode] = useState<
    "standard" | "polar" | "prominent" | "shader"
  >("standard");
  const [displacementScale, setDisplacementScale] = useState(70);
  const [aberrationIntensity, setAberrationIntensity] = useState(2);
  const [elasticity, setElasticity] = useState(0.15);

  const GlassComponent =
    implementationMode === "enhanced" ? EnhancedLiquidGlass : LiquidGlass;

  // Common props for both implementations
  const commonProps = {
    padding: "16px 32px",
    cornerRadius: 16,
    displacementScale:
      implementationMode === "enhanced" ? displacementScale : 30,
    className: "shadow-lg",
  };

  // Enhanced-specific props
  const enhancedProps =
    implementationMode === "enhanced"
      ? {
          mode: displacementMode,
          aberrationIntensity,
          elasticity,
          blurAmount: 0.0625,
          saturation: 140,
        }
      : {};

  return (
    <>
      <Head>
        <title>Enhanced Liquid Glass Demo</title>
        <meta
          name="description"
          content="Enhanced liquid glass with advanced displacement modes, chromatic aberration, and elastic interactions"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="relative min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        {/* Rich background content */}
        <div className="absolute inset-0 p-8">
          <div className="grid h-full grid-cols-1 gap-8 pt-20 md:grid-cols-2 lg:grid-cols-3">
            {/* Sample content cards */}
            <div className="rounded-xl bg-white/20 p-6 text-white backdrop-blur-sm">
              <h2 className="mb-4 text-2xl font-bold text-yellow-300">
                Enhanced Implementation
              </h2>
              <p className="text-lg leading-relaxed">
                The enhanced liquid glass now includes advanced displacement
                maps, chromatic aberration effects, elastic mouse interactions,
                and multi-layer visual enhancements from example 2.
              </p>
              <div className="mt-4 h-4 rounded-full bg-gradient-to-r from-pink-500 to-violet-500"></div>
            </div>

            <div className="rounded-xl bg-green-500/30 p-6 text-white backdrop-blur-sm">
              <h2 className="mb-4 text-2xl font-bold text-green-200">
                Multiple Displacement Modes
              </h2>
              <p className="text-lg leading-relaxed">
                Switch between Standard, Polar, Prominent, and Shader
                displacement modes for different visual effects. Each mode
                creates unique distortion patterns.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="h-8 rounded bg-red-400"></div>
                <div className="h-8 rounded bg-blue-400"></div>
                <div className="h-8 rounded bg-yellow-400"></div>
              </div>
            </div>

            <div className="rounded-xl bg-orange-500/30 p-6 text-white backdrop-blur-sm">
              <h2 className="mb-4 text-2xl font-bold text-orange-200">
                Elastic Interactions
              </h2>
              <p className="text-lg leading-relaxed">
                Glass elements now respond elastically to mouse movement,
                stretching and scaling based on proximity and direction.
              </p>
              <div className="mt-4 space-y-2">
                <div className="h-2 w-full rounded bg-purple-400"></div>
                <div className="h-2 w-3/4 rounded bg-purple-400"></div>
                <div className="h-2 w-1/2 rounded bg-purple-400"></div>
              </div>
            </div>

            <div className="rounded-xl bg-cyan-500/30 p-6 text-white backdrop-blur-sm">
              <h2 className="mb-4 text-2xl font-bold text-cyan-200">
                Chromatic Aberration
              </h2>
              <p className="text-lg leading-relaxed">
                Advanced SVG filter chains create realistic chromatic aberration
                effects at the edges while keeping the center content sharp.
              </p>
              <div className="mt-4 flex space-x-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full bg-white/40"
                  ></div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-pink-500/30 p-6 text-white backdrop-blur-sm">
              <h2 className="mb-4 text-2xl font-bold text-pink-200">
                Mode Switching
              </h2>
              <p className="text-lg leading-relaxed">
                Toggle between original and enhanced implementations to compare
                features. All existing drag and resize functionality is
                preserved.
              </p>
              <div className="mt-4">
                <div className="text-4xl">🔄 ⚙️ 🎯</div>
              </div>
            </div>

            <div className="rounded-xl bg-violet-500/30 p-6 text-white backdrop-blur-sm">
              <h2 className="mb-4 text-2xl font-bold text-violet-200">
                Performance Optimized
              </h2>
              <p className="text-lg leading-relaxed">
                Enhanced implementation maintains responsiveness with optimized
                displacement map caching and efficient mouse tracking.
              </p>
              <div className="mt-4 text-center text-6xl opacity-60">
                ⚡ 🚀 💫
              </div>
            </div>
          </div>
        </div>

        {/* Mode Switcher */}
        <ModeSwitcher
          currentMode={implementationMode}
          onModeChange={setImplementationMode}
        />

        {/* Enhanced Controls (only show when enhanced mode is active) */}
        {implementationMode === "enhanced" && (
          <DisplacementModeControls
            mode={displacementMode}
            onModeChange={setDisplacementMode}
            displacementScale={displacementScale}
            onDisplacementScaleChange={setDisplacementScale}
            aberrationIntensity={aberrationIntensity}
            onAberrationIntensityChange={setAberrationIntensity}
            elasticity={elasticity}
            onElasticityChange={setElasticity}
          />
        )}

        {/* Instructions overlay */}
        <div className="absolute top-4 right-4 left-4 z-[10000]">
          <div className="rounded-lg bg-black/50 p-4 text-center text-white backdrop-blur-sm">
            <h1 className="mb-2 text-2xl font-bold">
              Enhanced Liquid Glass Demo (
              {implementationMode === "enhanced" ? "Enhanced" : "Original"}{" "}
              Mode)
            </h1>
            <p className="text-sm opacity-90">
              {implementationMode === "enhanced"
                ? "Advanced displacement modes • Chromatic aberration • Elastic interactions • Dynamic borders"
                : "Basic glass effect • Drag elements around • Resize functionality • Clean simple look"}
            </p>
          </div>
        </div>

        {/* Showcase Examples */}

        {/* Standard Mode Example */}
        <GlassComponent
          {...commonProps}
          {...enhancedProps}
          mode={implementationMode === "enhanced" ? "standard" : undefined}
          initialPosition={{ x: 50, y: 100 }}
        >
          <nav className="flex items-center space-x-6 text-white">
            <div className="text-lg font-bold">Standard Glass</div>
            <div className="flex space-x-4">
              {["Home", "About", "Services", "Contact"].map((item) => (
                <button
                  key={item}
                  onClick={() => setActiveTab(item.toLowerCase())}
                  className={`rounded-lg px-3 py-2 transition-all ${
                    activeTab === item.toLowerCase()
                      ? "bg-white/30 text-yellow-300"
                      : "hover:bg-white/20"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </nav>
        </GlassComponent>

        {/* Polar Mode Example (Enhanced only) */}
        {implementationMode === "enhanced" && (
          <EnhancedLiquidGlass
            {...commonProps}
            {...enhancedProps}
            mode="polar"
            initialPosition={{ x: 1200, y: 150 }}
            cornerRadius={20}
          >
            <div className="text-center text-white">
              <div className="mb-2 text-3xl">🌀</div>
              <h3 className="mb-1 text-base font-bold">Polar Mode</h3>
              <p className="text-xs opacity-80">Radial swirl distortion</p>
            </div>
          </EnhancedLiquidGlass>
        )}

        {/* Prominent Mode Example (Enhanced only) */}
        {implementationMode === "enhanced" && (
          <EnhancedLiquidGlass
            {...commonProps}
            {...enhancedProps}
            mode="prominent"
            initialPosition={{ x: 800, y: 250 }}
            cornerRadius={16}
            displacementScale={90}
          >
            <div className="text-center text-white">
              <div className="mb-2 text-3xl">〰️</div>
              <h3 className="mb-1 text-base font-bold">Prominent Mode</h3>
              <p className="text-xs opacity-80">Wave interference patterns</p>
            </div>
          </EnhancedLiquidGlass>
        )}

        {/* Shader Mode Example (Enhanced only) */}
        {implementationMode === "enhanced" && (
          <EnhancedLiquidGlass
            {...commonProps}
            {...enhancedProps}
            mode="shader"
            initialPosition={{ x: 600, y: 350 }}
            cornerRadius={12}
            aberrationIntensity={4}
          >
            <div className="text-center text-white">
              <div className="mb-2 text-3xl">✨</div>
              <h3 className="mb-1 text-base font-bold">Shader Mode</h3>
              <p className="text-xs opacity-80">WebGL-generated patterns</p>
            </div>
          </EnhancedLiquidGlass>
        )}

        {/* Compact Navigation - Side */}
        <GlassComponent
          {...commonProps}
          {...enhancedProps}
          padding="20px"
          cornerRadius={12}
          initialPosition={{ x: 1200, y: 350 }}
          displacementScale={implementationMode === "enhanced" ? 45 : 25}
        >
          <div className="flex flex-col space-y-3 text-center text-white">
            <div className="text-sm font-semibold text-blue-200">Quick Nav</div>
            {["🏠", "📊", "⚙️", "💬"].map((icon, index) => (
              <button
                key={index}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 transition-all hover:bg-white/30"
              >
                {icon}
              </button>
            ))}
          </div>
        </GlassComponent>

        {/* Action Bar with Enhanced Effects */}
        <GlassComponent
          {...commonProps}
          {...enhancedProps}
          padding="16px 24px"
          cornerRadius={20}
          initialPosition={{ x: 100, y: 500 }}
          displacementScale={implementationMode === "enhanced" ? 80 : 35}
          aberrationIntensity={
            implementationMode === "enhanced" ? 3 : undefined
          }
        >
          <div className="flex items-center space-x-4 text-white">
            <button className="rounded-lg bg-gradient-to-r from-pink-500 to-violet-500 px-4 py-2 font-semibold transition-all hover:from-pink-600 hover:to-violet-600">
              Get Started
            </button>
            <button className="rounded-lg border border-white/30 px-4 py-2 transition-all hover:bg-white/20">
              Learn More
            </button>
            <div className="text-2xl">🎉</div>
          </div>
        </GlassComponent>

        {/* Auto-sizing Card Example */}
        <GlassComponent
          {...commonProps}
          {...enhancedProps}
          padding="24px"
          cornerRadius={16}
          initialPosition={{ x: 1000, y: 450 }}
          displacementScale={implementationMode === "enhanced" ? 50 : 20}
          blurAmount={implementationMode === "enhanced" ? 0.1 : 0.5}
        >
          <div className="text-center text-white">
            <div className="mb-3 text-3xl">📱</div>
            <h3 className="mb-2 text-lg font-bold">Auto-Sizing</h3>
            <p className="max-w-xs text-sm leading-relaxed opacity-90">
              Component automatically adjusts to content size in both modes!
            </p>
            <div className="mt-4 flex justify-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-400"></div>
              <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
              <div className="h-2 w-2 rounded-full bg-red-400"></div>
            </div>
          </div>
        </GlassComponent>

        {/* User Profile Card with Elastic Effects */}
        <GlassComponent
          {...commonProps}
          {...enhancedProps}
          padding="20px"
          cornerRadius={12}
          initialPosition={{ x: 400, y: 200 }}
          displacementScale={implementationMode === "enhanced" ? 60 : 22}
          elasticity={implementationMode === "enhanced" ? 0.25 : undefined}
        >
          <div className="flex items-center space-x-3 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-400 to-pink-400 text-sm font-bold">
              JD
            </div>
            <div>
              <div className="text-sm font-semibold">John Doe</div>
              <div className="text-xs opacity-70">Premium User</div>
            </div>
            <div className="text-green-400">●</div>
          </div>
        </GlassComponent>

        {/* Floating Action Menu */}
        <GlassComponent
          {...commonProps}
          {...enhancedProps}
          padding="16px"
          cornerRadius={24}
          initialPosition={{ x: 50, y: 350 }}
          displacementScale={implementationMode === "enhanced" ? 55 : 28}
        >
          <div className="flex items-center space-x-3 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-blue-500 text-sm font-bold">
              +
            </div>
            <div className="text-sm font-medium">Add New Item</div>
          </div>
        </GlassComponent>

        {/* Resizable Card Example */}
        <GlassComponent
          {...commonProps}
          {...enhancedProps}
          width={cardSize.width}
          height={cardSize.height}
          padding="24px"
          cornerRadius={12}
          initialPosition={{ x: 300, y: 400 }}
          displacementScale={implementationMode === "enhanced" ? 60 : 25}
        >
          <div className="flex h-full w-full flex-col text-white">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Resizable Card</h3>
              <div className="text-2xl">🔄</div>
            </div>

            <div className="flex flex-1 flex-col justify-center space-y-3">
              <p className="text-sm leading-relaxed opacity-90">
                Use the controls below to resize this liquid glass card
                dynamically in both modes!
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Width: {cardSize.width}px</span>
                  <input
                    type="range"
                    min="250"
                    max="500"
                    value={cardSize.width}
                    onChange={(e) =>
                      setCardSize((prev) => ({
                        ...prev,
                        width: parseInt(e.target.value),
                      }))
                    }
                    className="h-1 w-20 cursor-pointer appearance-none rounded-lg bg-white/20"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs">Height: {cardSize.height}px</span>
                  <input
                    type="range"
                    min="180"
                    max="400"
                    value={cardSize.height}
                    onChange={(e) =>
                      setCardSize((prev) => ({
                        ...prev,
                        height: parseInt(e.target.value),
                      }))
                    }
                    className="h-1 w-20 cursor-pointer appearance-none rounded-lg bg-white/20"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center">
                <button
                  onClick={() => setCardSize({ width: 320, height: 240 })}
                  className="rounded bg-white/20 px-3 py-1 text-xs transition-all hover:bg-white/30"
                >
                  Reset Size
                </button>
              </div>
            </div>
          </div>
        </GlassComponent>

        {/* Large Content Example with Enhanced Effects */}
        <GlassComponent
          {...commonProps}
          {...enhancedProps}
          padding="32px"
          cornerRadius={16}
          initialPosition={{ x: 700, y: 500 }}
          displacementScale={implementationMode === "enhanced" ? 75 : 30}
          aberrationIntensity={
            implementationMode === "enhanced" ? 1.5 : undefined
          }
        >
          <div className="max-w-md text-white">
            <h2 className="mb-4 text-xl font-bold">
              {implementationMode === "enhanced" ? "Enhanced" : "Original"}{" "}
              Implementation
            </h2>
            <p className="mb-4 text-sm leading-relaxed opacity-90">
              {implementationMode === "enhanced"
                ? "This enhanced implementation includes all advanced features from example 2: multiple displacement modes, chromatic aberration, elastic interactions, and dynamic visual effects while preserving all original functionality."
                : "This original implementation provides the core liquid glass effect with drag and resize functionality, clean performance, and reliable cross-browser compatibility."}
            </p>
            <div className="flex space-x-2">
              <div className="rounded bg-blue-500/50 px-3 py-1 text-xs">
                {implementationMode === "enhanced" ? "Advanced" : "Original"}
              </div>
              <div className="rounded bg-green-500/50 px-3 py-1 text-xs">
                Draggable
              </div>
              <div className="rounded bg-purple-500/50 px-3 py-1 text-xs">
                Resizable
              </div>
            </div>
          </div>
        </GlassComponent>
      </main>
    </>
  );
}
