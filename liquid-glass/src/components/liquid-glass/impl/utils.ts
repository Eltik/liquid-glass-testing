export interface Vec2 {
  x: number;
  y: number;
}

function smoothStep(a: number, b: number, t: number): number {
  t = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function length(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

function roundedRectSDF(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): number {
  const qx = Math.abs(x) - width + radius;
  const qy = Math.abs(y) - height + radius;
  return (
    Math.min(Math.max(qx, qy), 0) +
    length(Math.max(qx, 0), Math.max(qy, 0)) -
    radius
  );
}

function texture(x: number, y: number): Vec2 {
  return { x, y };
}

function generateId(): string {
  return "liquid-glass-" + Math.random().toString(36).substr(2, 9);
}

// Common padding parsing utility
function getPaddingValues(
  paddingStr: string,
): { top: number; right: number; bottom: number; left: number } {
  const values = paddingStr
    .split(" ")
    .map((v) => parseInt(v.replace("px", "")) || 0);
  if (values.length === 1)
    return {
      top: values[0]!,
      right: values[0]!,
      bottom: values[0]!,
      left: values[0]!,
    };
  if (values.length === 2)
    return {
      top: values[0]!,
      right: values[1]!,
      bottom: values[0]!,
      left: values[1]!,
    };
  if (values.length === 4)
    return {
      top: values[0]!,
      right: values[1]!,
      bottom: values[2]!,
      left: values[3]!,
    };
  return { top: 24, right: 32, bottom: 24, left: 32 }; // default
}

// Common position constraint utility
function constrainPosition(
  x: number,
  y: number,
  width: number,
  height: number,
  offset = 10,
): { x: number; y: number } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const minX = offset;
  const maxX = viewportWidth - width - offset;
  const minY = offset;
  const maxY = viewportHeight - height - offset;

  const constrainedX = Math.max(minX, Math.min(maxX, x));
  const constrainedY = Math.max(minY, Math.min(maxY, y));

  return { x: constrainedX, y: constrainedY };
}

export const utils = {
  smoothStep,
  length,
  roundedRectSDF,
  texture,
  generateId,
  getPaddingValues,
  constrainPosition,
};
