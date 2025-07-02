import type { CSSProperties, ReactNode, RefObject } from "react";

export interface Vec2 {
  x: number;
  y: number;
}

export interface GlassSize {
  width: number;
  height: number;
}

export interface GlassPosition {
  x: number;
  y: number;
  centered: boolean;
}

export interface GlassBehaviorOptions {
  width?: number;
  height?: number;
  padding?: string;
  initialPosition?: { x?: number; y?: number };
  draggable?: boolean;
  minWidth?: number;
  minHeight?: number;
  children?: ReactNode;
}

export interface LiquidGlassProps {
  children?: ReactNode;
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
  padding?: string;
  cornerRadius?: number;
  displacementScale?: number;
  blurAmount?: number;
  saturation?: number;
  brightness?: number;
  contrast?: number;
  initialPosition?: { x?: number; y?: number };
  draggable?: boolean;
  minWidth?: number;
  minHeight?: number;
}

export interface EnhancedLiquidGlassProps {
  children?: ReactNode;
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
  padding?: string;
  cornerRadius?: number;
  displacementScale?: number;
  blurAmount?: number;
  saturation?: number;
  aberrationIntensity?: number;
  elasticity?: number;
  globalMousePos?: Vec2;
  mouseOffset?: Vec2;
  mouseContainer?: RefObject<HTMLElement | null> | null;
  overLight?: boolean;
  mode?: "standard" | "polar" | "prominent" | "shader";
  onClick?: () => void;
  initialPosition?: { x?: number; y?: number };
  draggable?: boolean;
  minWidth?: number;
  minHeight?: number;
  brightness?: number;
  contrast?: number;
}

export interface ShaderOptions {
  width: number;
  height: number;
  fragment: (uv: Vec2, mouse?: Vec2) => Vec2;
  mousePosition?: Vec2;
}

export type FragmentShaderType = "liquidGlass" | "ripple" | "vortex";
export type DisplacementMode = "standard" | "polar" | "prominent" | "shader";
