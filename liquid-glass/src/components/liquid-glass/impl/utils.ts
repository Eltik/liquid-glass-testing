function smoothStep(a: number, b: number, t: number) {
  t = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function length(x: number, y: number) {
  return Math.sqrt(x * x + y * y);
}

function roundedRectSDF(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const qx = Math.abs(x) - width + radius;
  const qy = Math.abs(y) - height + radius;
  return (
    Math.min(Math.max(qx, qy), 0) +
    length(Math.max(qx, 0), Math.max(qy, 0)) -
    radius
  );
}

export interface Vec2 {
  x: number;
  y: number;
}

function texture(x: number, y: number): Vec2 {
  return { x, y };
}

function generateId() {
  return "liquid-glass-" + Math.random().toString(36).substr(2, 9);
}

export const utils = {
  smoothStep,
  length,
  roundedRectSDF,
  texture,
  generateId,
};
