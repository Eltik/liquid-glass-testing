import type { Vec2 } from "../../../types";

const fragmentShaders = {
  standard: (uv: Vec2): Vec2 => {
    const centerX = uv.x - 0.5;
    const centerY = uv.y - 0.5;
    const distFromCenter = Math.sqrt(centerX * centerX + centerY * centerY);
    const lensStrength = Math.exp(-distFromCenter * 2.5) * 0.15;
    const r2 = centerX * centerX + centerY * centerY;
    const distortion = 1 + r2 * lensStrength;

    return {
      x: centerX * distortion + 0.5,
      y: centerY * distortion + 0.5,
    };
  },

  polar: (uv: Vec2): Vec2 => {
    const centerX = uv.x - 0.5;
    const centerY = uv.y - 0.5;
    const radius = Math.sqrt(centerX * centerX + centerY * centerY);
    const angle = Math.atan2(centerY, centerX);
    const radialEffect = Math.exp(-radius * 3) * 0.2;
    const angularOffset = Math.sin(angle * 3) * radialEffect * 0.3;
    const newRadius = radius * (1 + radialEffect);
    const newAngle = angle + angularOffset;

    return {
      x: Math.cos(newAngle) * newRadius + 0.5,
      y: Math.sin(newAngle) * newRadius + 0.5,
    };
  },

  prominent: (uv: Vec2): Vec2 => {
    const centerX = uv.x - 0.5;
    const centerY = uv.y - 0.5;
    const wave1 = Math.sin(uv.x * Math.PI * 4) * Math.sin(uv.y * Math.PI * 4);
    const wave2 = Math.cos(uv.x * Math.PI * 6) * Math.cos(uv.y * Math.PI * 6);
    const wave3 = Math.sin((uv.x + uv.y) * Math.PI * 8);
    const distFromCenter = Math.sqrt(centerX * centerX + centerY * centerY);
    const falloff = Math.exp(-distFromCenter * 2);
    const displacement =
      (wave1 * 0.4 + wave2 * 0.3 + wave3 * 0.3) * falloff * 0.25;

    return {
      x: centerX + displacement * centerX + 0.5,
      y: centerY + displacement * centerY + 0.5,
    };
  },
} as const;

const displacementCache = new Map<string, string>();

const generateDisplacementMapData = (
  type: "standard" | "polar" | "prominent",
  width = 256,
  height = 256,
): Uint8ClampedArray => {
  const data = new Uint8ClampedArray(width * height * 4);
  const fragment = fragmentShaders[type];
  const rawValues: number[] = [];
  let maxScale = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const uv: Vec2 = { x: x / width, y: y / height };
      const pos = fragment(uv);
      const dx = pos.x * width - x;
      const dy = pos.y * height - y;
      maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy));
      rawValues.push(dx, dy);
    }
  }

  maxScale = maxScale > 0 ? Math.max(maxScale, 1) : 1;

  let rawIndex = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = rawValues[rawIndex++] ?? 0;
      const dy = rawValues[rawIndex++] ?? 0;
      const edgeDistance = Math.min(x, y, width - x - 1, height - y - 1);
      const edgeFactor = Math.min(1, edgeDistance / 2);
      const smoothedDx = dx * edgeFactor;
      const smoothedDy = dy * edgeFactor;
      const r = smoothedDx / maxScale + 0.5;
      const g = smoothedDy / maxScale + 0.5;
      const pixelIndex = (y * width + x) * 4;

      data[pixelIndex] = Math.max(0, Math.min(255, r * 255));
      data[pixelIndex + 1] = Math.max(0, Math.min(255, g * 255));
      data[pixelIndex + 2] = Math.max(0, Math.min(255, g * 255));
      data[pixelIndex + 3] = 255;
    }
  }

  return data;
};

const createCanvasDataUrl = (
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
): string => {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Could not get 2D context");
    }

    const imgData = context.createImageData(width, height);
    imgData.data.set(imageData);
    context.putImageData(imgData, 0, 0);
    return canvas.toDataURL();
  } catch (error) {
    console.warn("Failed to create canvas data URL:", error);
    return "";
  }
};

const createServerDataUrl = (
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
): string => {
  try {
    const header = new Uint8Array(54);
    const fileSize = 54 + imageData.length;
    const imageSize = imageData.length;

    header[0] = 0x42;
    header[1] = 0x4d;
    header[2] = fileSize & 0xff;
    header[3] = (fileSize >> 8) & 0xff;
    header[4] = (fileSize >> 16) & 0xff;
    header[5] = (fileSize >> 24) & 0xff;
    header[10] = 54;
    header[14] = 40;
    header[18] = width & 0xff;
    header[19] = (width >> 8) & 0xff;
    header[20] = (width >> 16) & 0xff;
    header[21] = (width >> 24) & 0xff;
    header[22] = height & 0xff;
    header[23] = (height >> 8) & 0xff;
    header[24] = (height >> 16) & 0xff;
    header[25] = (height >> 24) & 0xff;
    header[26] = 1;
    header[28] = 32;
    header[34] = imageSize & 0xff;
    header[35] = (imageSize >> 8) & 0xff;
    header[36] = (imageSize >> 16) & 0xff;
    header[37] = (imageSize >> 24) & 0xff;

    const combined = new Uint8Array(header.length + imageData.length);
    combined.set(header, 0);
    combined.set(imageData, header.length);

    let binary = "";
    for (const byte of combined) {
      binary += String.fromCharCode(byte);
    }

    const base64 =
      typeof btoa !== "undefined" ? btoa(binary) : encodeBase64Manual(binary);

    return `data:image/bmp;base64,${base64}`;
  } catch {
    return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  }
};

const encodeBase64Manual = (binary: string): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  for (let i = 0; i < binary.length; i += 3) {
    const a = binary.charCodeAt(i);
    const b = i + 1 < binary.length ? binary.charCodeAt(i + 1) : 0;
    const c = i + 2 < binary.length ? binary.charCodeAt(i + 2) : 0;
    const group = (a << 16) | (b << 8) | c;

    result += chars[(group >> 18) & 63];
    result += chars[(group >> 12) & 63];
    result += i + 1 < binary.length ? chars[(group >> 6) & 63] : "=";
    result += i + 2 < binary.length ? chars[group & 63] : "=";
  }
  return result;
};

const generateDisplacementMap = (
  type: "standard" | "polar" | "prominent",
  width = 256,
  height = 256,
): string => {
  const cacheKey = `${type}-${width}-${height}`;
  const cached = displacementCache.get(cacheKey);
  if (cached) return cached;

  try {
    const imageData = generateDisplacementMapData(type, width, height);
    const dataUrl =
      typeof window !== "undefined" && typeof document !== "undefined"
        ? createCanvasDataUrl(imageData, width, height)
        : createServerDataUrl(imageData, width, height);

    displacementCache.set(cacheKey, dataUrl);
    return dataUrl;
  } catch {
    return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  }
};

const getDisplacementMap = () => generateDisplacementMap("standard");
const getPolarDisplacementMap = () => generateDisplacementMap("polar");
const getProminentDisplacementMap = () => generateDisplacementMap("prominent");

const getDisplacementMapLazy = () =>
  Promise.resolve(generateDisplacementMap("standard"));
const getPolarDisplacementMapLazy = () =>
  Promise.resolve(generateDisplacementMap("polar"));
const getProminentDisplacementMapLazy = () =>
  Promise.resolve(generateDisplacementMap("prominent"));

export {
  generateDisplacementMap,
  getDisplacementMap,
  getPolarDisplacementMap,
  getProminentDisplacementMap,
  getDisplacementMapLazy,
  getPolarDisplacementMapLazy,
  getProminentDisplacementMapLazy,
  fragmentShaders,
  displacementCache,
};
