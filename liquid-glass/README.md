# LiquidGlass - Advanced WebGL Glassmorphism Effects

A Next.js + TypeScript component library providing WebGL-powered liquid glass effects with seamless cross-browser compatibility.

## Features

- **Advanced Physics-Based Refraction** - Realistic glass distortion with edge factors and chromatic aberration
- **Cross-Browser Compatibility** - Works identically in Firefox ≥ v126, Chrome, Safari, and Edge
- **WebGL 2.0 Pipeline** - Optimized shaders with automatic WebGL 1.0 fallback
- **Real-Time Performance** - 60fps animations with GPU acceleration
- **Interactive Effects** - Mouse tracking, elastic physics, and drag behavior
- **Advanced Lighting** - Realistic shadows, highlights, and fresnel effects
- **Multi-Pass Rendering** - Gaussian blur pipeline for sophisticated effects

## Compatibility

**Works in Chrome, Firefox, Safari, and Edge out of the box.**

The unified shader implementation combines:
- Advanced physics-based refraction from example 4 (Firefox-compatible)
- Sophisticated multi-pass rendering pipeline from example 5 (gold standard)
- WebGL 2.0 baseline with automatic WebGL 1.0 fallback
- Browser-specific optimizations for maximum performance

## Quick Start

```tsx
import { LiquidGlass } from '~/components/liquid-glass';

export default function MyPage() {
  return (
    <LiquidGlass
      displacementMode="polar"
      displacementScale={25}
      aberrationIntensity={2}
      elasticity={0.15}
    >
      <div className="p-8">
        <h1>Your Content Here</h1>
      </div>
    </LiquidGlass>
  );
}
```

## Component Architecture

```
src/components/liquid-glass/
├── index.tsx                    # Main component entry point
├── types.ts                     # TypeScript interfaces
└── impl/
    ├── interaction/             # User interaction systems
    │   └── impl/
    │       ├── useElasticEffects.ts     # Cursor-based elastic animations
    │       ├── useGlassBehavior.ts      # Master interaction orchestrator
    │       ├── useGlassDrag.ts          # Drag-and-drop functionality
    │       ├── useGlassPosition.ts      # Position management
    │       ├── useGlassSize.ts          # Content-based auto-sizing
    │       └── useMouseTracking.ts      # Global mouse tracking
    ├── layout/                  # Layout and styling utilities
    │   └── impl/
    │       ├── useCSSVariables.ts       # Dynamic CSS variable management
    │       └── utils.ts                 # Position/padding utilities
    └── rendering/               # Visual effects and WebGL
        ├── components/
        │   ├── border-layers.tsx        # Multi-layer border effects
        │   ├── glass-container.tsx      # Main glass container
        │   └── glass-filter.tsx         # SVG filter composition
        ├── shader-utils/        # Unified WebGL pipeline
        │   └── impl/
        │       ├── webglConstants.ts    # Unified shader source code
        │       ├── webglShaderClass.ts  # Cross-browser shader management
        │       └── webglUtilities.ts    # Browser capability detection
        └── shaders/            # Displacement map generation
            └── impl/
                ├── create-data-url.ts   # Data URL creation
                └── getMap.ts            # WebGL map generation
```

## Development

### Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run typecheck  # Run TypeScript type checking
npm run lint       # Run ESLint
npm run check      # Run both linting and type checking
```

### Browser Testing

The unified implementation has been tested across:
- Firefox 126+ (WebGL 2.0 with physics-based refraction)
- Chrome 90+ (Full WebGL 2.0 feature set)
- Safari 14+ (Optimized for WebKit performance)
- Edge 90+ (Chromium-based compatibility)

### Performance Optimizations

- **WebGL 2.0 Baseline** - Advanced shader features with automatic fallback
- **Physics-Based Rendering** - Realistic refraction and chromatic aberration
- **Multi-Pass Pipeline** - Gaussian blur and advanced lighting effects
- **CSS Variable Caching** - Minimize DOM updates for 60fps performance
- **Browser-Specific Tuning** - Optimized parameters for each browser

## Technical Details

### Unified Shader Pipeline

The implementation combines the best elements from multiple examples:

**From Example 4 (Firefox-Compatible):**
- WebGL 2.0 syntax with `#version 300 es`
- Physics-based refraction with edge factors
- Realistic shadow and highlight calculation
- Chromatic aberration with proper dispersion
- Aspect ratio correction with bounds checking

**From Example 5 (Gold Standard):**
- Advanced SDF shape rendering
- Multi-pass gaussian blur pipeline
- Fresnel and glare effects
- LAB/LCH color space transformations
- Sophisticated background rendering

### Cross-Browser Features

- **Automatic Detection** - WebGL 2.0 preferred, WebGL 1.0 fallback
- **Extension Management** - Graceful handling of missing extensions
- **Precision Handling** - High precision on capable browsers
- **Performance Scaling** - Reduced complexity on resource-constrained devices

---

Built with [T3 Stack](https://create.t3.gg/) - Next.js, TypeScript, and Tailwind CSS.