# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Main Project (liquid-glass/)
```bash
npm run dev        # Start development server (Next.js with Turbo)
npm run build      # Build for production
npm run typecheck  # Run TypeScript type checking
npm run lint       # Run ESLint
npm run check      # Run both linting and type checking (recommended)
npm run format:check  # Check Prettier formatting
npm run format:write # Apply Prettier formatting
```

### Examples
- **Example 2**: Uses esbuild - `npm run build`
- **Example 4**: Uses Vite - check package.json for specific commands  
- **Example 5**: Uses Vite with TypeScript - `npm run dev`, `npm run build`

## Architecture Overview

This is a **liquid glass effect testing repository** containing multiple implementations and examples of WebGL-powered glassmorphism effects.

### Core Structure

**Main Implementation** (`liquid-glass/`):
- Next.js + TypeScript + Tailwind CSS project using T3 Stack
- Advanced WebGL 2.0 pipeline with automatic WebGL 1.0 fallback
- Cross-browser compatible (Chrome, Firefox ≥126, Safari, Edge)

**Examples Directory** (`examples/`):
- `ex. 1`: Basic CSS implementation
- `ex. 2`: React implementation with esbuild
- `ex. 3`: Vanilla JavaScript
- `ex. 4`: Vue.js with advanced physics-based refraction (Firefox-compatible)
- `ex. 5`: React with Vite, advanced SDF rendering and multi-pass pipeline

### LiquidGlass Component Architecture

Located in `liquid-glass/src/components/liquid-glass/`:

```
├── index.tsx                 # Main component entry point
└── impl/
    ├── lib/                  # WebGL rendering engine
    │   ├── index.ts          # Public API exports
    │   └── impl/
    │       ├── utils.ts      # Utility functions
    │       └── renderer/     # Multi-pass rendering system
    │           ├── frameBuffer.ts
    │           ├── multiPassRenderer.ts
    │           ├── renderPass.ts
    │           └── shaderProgram.ts
    ├── shaders/              # WebGL shader implementations
    │   ├── index.ts          # Shader exports
    │   └── impl/             # Individual shader files
    │       ├── vertex.ts
    │       ├── fragment-bg.ts
    │       ├── fragment-bg-hblur.ts
    │       ├── fragment-bg-vblur.ts
    │       └── fragment-main.ts
    └── types/
        └── lib.ts            # TypeScript interfaces
```

### Technical Implementation Details

**WebGL Pipeline**:
- WebGL 2.0 baseline with automatic WebGL 1.0 fallback
- Multi-pass rendering with Gaussian blur
- Physics-based refraction and chromatic aberration
- Real-time mouse tracking with spring physics
- Cross-browser shader compatibility

**Performance Features**:
- Hardware-accelerated rendering at 60fps
- Frame buffer objects for efficient multi-pass rendering
- Optimized shader uniforms to minimize GPU state changes
- CPU-based spring physics to reduce GPU workload

**Browser Compatibility**:
- Chrome/Edge: Full WebGL 2.0 feature set
- Firefox ≥126: WebGL 2.0 with physics-based refraction
- Safari: WebKit-optimized performance
- Automatic capability detection and fallbacks

## Development Notes

**Main Project**: Built with T3 Stack (Next.js, TypeScript, Tailwind CSS)
**Testing**: Multiple examples provide different implementation approaches for cross-browser testing
**Performance**: Always run `npm run check` before committing to ensure type safety and linting compliance