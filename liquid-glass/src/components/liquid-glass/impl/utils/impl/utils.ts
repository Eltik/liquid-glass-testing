import type { Vec2 } from "../../../types";

const smoothStep = (a: number, b: number, t: number): number => {
  const clamped = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return clamped * clamped * (3 - 2 * clamped);
};

const length = (x: number, y: number): number => Math.sqrt(x * x + y * y);

const roundedRectSDF = (
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): number => {
  const qx = Math.abs(x) - width + radius;
  const qy = Math.abs(y) - height + radius;
  return (
    Math.min(Math.max(qx, qy), 0) +
    length(Math.max(qx, 0), Math.max(qy, 0)) -
    radius
  );
};

const texture = (x: number, y: number): Vec2 => ({ x, y });

const generateId = (): string =>
  `liquid-glass-${Math.random().toString(36).slice(2, 11)}`;

interface PaddingValues {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const DEFAULT_PADDING: PaddingValues = {
  top: 24,
  right: 32,
  bottom: 24,
  left: 32,
};

const getPaddingValues = (paddingStr: string): PaddingValues => {
  const values = paddingStr
    .split(" ")
    .map((v) => parseInt(v.replace("px", ""), 10) || 0);

  switch (values.length) {
    case 1:
      return {
        top: values[0]!,
        right: values[0]!,
        bottom: values[0]!,
        left: values[0]!,
      };
    case 2:
      return {
        top: values[0]!,
        right: values[1]!,
        bottom: values[0]!,
        left: values[1]!,
      };
    case 4:
      return {
        top: values[0]!,
        right: values[1]!,
        bottom: values[2]!,
        left: values[3]!,
      };
    default:
      return DEFAULT_PADDING;
  }
};

const constrainPosition = (
  x: number,
  y: number,
  width: number,
  height: number,
  offset = 10,
): { x: number; y: number } => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const bounds = {
    minX: offset,
    maxX: viewportWidth - width - offset,
    minY: offset,
    maxY: viewportHeight - height - offset,
  };

  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, x)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, y)),
  };
};

export const utils = {
  smoothStep,
  length,
  roundedRectSDF,
  texture,
  generateId,
  getPaddingValues,
  constrainPosition,
} as const;

export {
  smoothStep,
  length,
  roundedRectSDF,
  texture,
  generateId,
  getPaddingValues,
  constrainPosition,
};
