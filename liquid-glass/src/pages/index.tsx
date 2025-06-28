import Head from "next/head";
import { useState } from "react";
import LiquidGlass from "~/components/liquid-glass";

export default function Home() {
  const [activeTab, setActiveTab] = useState("home");
  const [cardSize, setCardSize] = useState({ width: 320, height: 240 });

  return (
    <>
      <Head>
        <title>Responsive Liquid Glass Demo</title>
        <meta
          name="description"
          content="Responsive liquid glass wrapper component with sticky navbar examples"
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
                Responsive Design
              </h2>
              <p className="text-lg leading-relaxed">
                The liquid glass component now automatically adapts to its
                content size, making it perfect for responsive designs and
                dynamic content.
              </p>
              <div className="mt-4 h-4 rounded-full bg-gradient-to-r from-pink-500 to-violet-500"></div>
            </div>

            <div className="rounded-xl bg-green-500/30 p-6 text-white backdrop-blur-sm">
              <h2 className="mb-4 text-2xl font-bold text-green-200">
                Wrapper Component
              </h2>
              <p className="text-lg leading-relaxed">
                You can now place any content inside the liquid glass effect -
                navigation bars, buttons, cards, or any other components.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="h-8 rounded bg-red-400"></div>
                <div className="h-8 rounded bg-blue-400"></div>
                <div className="h-8 rounded bg-yellow-400"></div>
              </div>
            </div>

            <div className="rounded-xl bg-orange-500/30 p-6 text-white backdrop-blur-sm">
              <h2 className="mb-4 text-2xl font-bold text-orange-200">
                Sticky Navigation
              </h2>
              <p className="text-lg leading-relaxed">
                The examples above show how liquid glass can be used for modern
                sticky navigation bars that distort the background content.
              </p>
              <div className="mt-4 space-y-2">
                <div className="h-2 w-full rounded bg-purple-400"></div>
                <div className="h-2 w-3/4 rounded bg-purple-400"></div>
                <div className="h-2 w-1/2 rounded bg-purple-400"></div>
              </div>
            </div>

            <div className="rounded-xl bg-cyan-500/30 p-6 text-white backdrop-blur-sm">
              <h2 className="mb-4 text-2xl font-bold text-cyan-200">
                Interactive Elements
              </h2>
              <p className="text-lg leading-relaxed">
                The glass elements are fully interactive - click navigation
                items, hover over buttons, and drag the elements around the
                screen.
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
                Flexible Styling
              </h2>
              <p className="text-lg leading-relaxed">
                Customize corner radius, padding, displacement intensity, and
                visual effects to match your design system perfectly.
              </p>
              <div className="mt-4">
                <div className="text-4xl">🎨 ⚙️ 🎯</div>
              </div>
            </div>

            <div className="rounded-xl bg-violet-500/30 p-6 text-white backdrop-blur-sm">
              <h2 className="mb-4 text-2xl font-bold text-violet-200">
                Modern UI
              </h2>
              <p className="text-lg leading-relaxed">
                Perfect for creating cutting-edge user interfaces with stunning
                visual effects that enhance user engagement and experience.
              </p>
              <div className="mt-4 text-center text-6xl opacity-60">
                ✨ 🚀 💫
              </div>
            </div>
          </div>
        </div>

        {/* Instructions overlay */}
        <div className="absolute top-4 right-4 left-4 z-[10000]">
          <div className="rounded-lg bg-black/50 p-4 text-center text-white backdrop-blur-sm">
            <h1 className="mb-2 text-2xl font-bold">
              Responsive Liquid Glass Wrapper Demo
            </h1>
            <p className="text-sm opacity-90">
              Interactive navbar examples • Drag elements around • Use resize
              controls • Fully responsive
            </p>
          </div>
        </div>

        {/* Sticky Navigation Bar - Top */}
        <LiquidGlass
          padding="16px 32px"
          cornerRadius={16}
          initialPosition={{ x: 50, y: 100 }}
          displacementScale={30}
          className="shadow-lg"
        >
          <nav className="flex items-center space-x-6 text-white">
            <div className="text-lg font-bold">Logo</div>
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
        </LiquidGlass>

        {/* Compact Navigation - Side */}
        <LiquidGlass
          padding="20px"
          cornerRadius={12}
          initialPosition={{ x: 1200, y: 200 }}
          displacementScale={25}
          className="shadow-lg"
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
        </LiquidGlass>

        {/* Action Bar - Bottom Style */}
        <LiquidGlass
          padding="16px 24px"
          cornerRadius={20}
          initialPosition={{ x: 100, y: 600 }}
          displacementScale={35}
          className="shadow-xl"
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
        </LiquidGlass>

        {/* Auto-sizing Card Example */}
        <LiquidGlass
          padding="24px"
          cornerRadius={16}
          initialPosition={{ x: 1000, y: 350 }}
          displacementScale={20}
          blurAmount={0.5}
          className="shadow-lg"
        >
          <div className="text-center text-white">
            <div className="mb-3 text-3xl">📱</div>
            <h3 className="mb-2 text-lg font-bold">Auto-Sizing</h3>
            <p className="max-w-xs text-sm leading-relaxed opacity-90">
              This component automatically adjusts to its content size!
            </p>
            <div className="mt-4 flex justify-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-400"></div>
              <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
              <div className="h-2 w-2 rounded-full bg-red-400"></div>
            </div>
          </div>
        </LiquidGlass>

        {/* Floating Action Menu */}
        <LiquidGlass
          padding="16px"
          cornerRadius={24}
          initialPosition={{ x: 50, y: 500 }}
          displacementScale={28}
          className="shadow-lg"
        >
          <div className="flex items-center space-x-3 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-blue-500 text-sm font-bold">
              +
            </div>
            <div className="text-sm font-medium">Add New Item</div>
          </div>
        </LiquidGlass>

        {/* User Profile Card */}
        <LiquidGlass
          padding="20px"
          cornerRadius={12}
          initialPosition={{ x: 600, y: 250 }}
          displacementScale={22}
          className="shadow-lg"
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
        </LiquidGlass>

        {/* Minimal Button Example */}
        <LiquidGlass
          padding="12px 20px"
          cornerRadius={8}
          initialPosition={{ x: 300, y: 400 }}
          displacementScale={15}
          className="shadow-lg"
        >
          <button className="font-medium text-white">Click Me</button>
        </LiquidGlass>

        {/* Text Badge Example */}
        <LiquidGlass
          padding="8px 16px"
          cornerRadius={20}
          initialPosition={{ x: 800, y: 150 }}
          displacementScale={18}
          className="shadow-lg"
        >
          <span className="text-sm font-semibold text-white">
            New Feature 🎉
          </span>
        </LiquidGlass>

        {/* Large Content Example */}
        <LiquidGlass
          padding="32px"
          cornerRadius={16}
          initialPosition={{ x: 400, y: 500 }}
          displacementScale={30}
          className="shadow-lg"
        >
          <div className="max-w-md text-white">
            <h2 className="mb-4 text-xl font-bold">Dynamic Sizing Demo</h2>
            <p className="mb-4 text-sm leading-relaxed opacity-90">
              This is a larger content area that demonstrates how the liquid
              glass wrapper automatically adjusts to accommodate different
              content sizes. The glass effect scales perfectly to match the
              content dimensions.
            </p>
            <div className="flex space-x-2">
              <div className="rounded bg-blue-500/50 px-3 py-1 text-xs">
                Tag 1
              </div>
              <div className="rounded bg-green-500/50 px-3 py-1 text-xs">
                Tag 2
              </div>
              <div className="rounded bg-purple-500/50 px-3 py-1 text-xs">
                Tag 3
              </div>
            </div>
          </div>
        </LiquidGlass>

        {/* Resizable Card Example */}
        <LiquidGlass
          width={cardSize.width}
          height={cardSize.height}
          padding="24px"
          cornerRadius={12}
          initialPosition={{ x: 150, y: 350 }}
          displacementScale={25}
          className="shadow-xl"
        >
          <div className="flex h-full w-full flex-col text-white">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Resizable Card</h3>
              <div className="text-2xl">🔄</div>
            </div>

            <div className="flex flex-1 flex-col justify-center space-y-3">
              <p className="text-sm leading-relaxed opacity-90">
                Use the controls below to resize this liquid glass card
                dynamically!
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
        </LiquidGlass>
      </main>
    </>
  );
}
