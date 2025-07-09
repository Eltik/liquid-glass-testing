/**
 * @fileoverview Canvas and server-side data URL generation utilities for image processing.
 *
 * Provides dual-mode data URL creation supporting both browser canvas operations
 * and server-side BMP generation. Essential for cross-platform image processing
 * in liquid-glass shader systems with graceful fallback mechanisms.
 */

import { encodeBase64Manual } from "../../../layout/impl/utils";

/**
 * Creates data URL from image data using browser canvas context.
 *
 * Converts raw RGBA image data into a canvas-generated data URL using browser
 * APIs. Provides high-quality image encoding with automatic format detection
 * and error handling. Falls back gracefully when canvas context is unavailable.
 *
 * @param imageData - Raw RGBA pixel data as Uint8ClampedArray
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns Canvas-generated data URL or empty string on failure
 *
 * @example
 * ```tsx
 * const imageData = new Uint8ClampedArray(width * height * 4);
 * const dataUrl = createCanvasDataURL(imageData, 256, 256);
 * ```
 */
export const createCanvasDataURL = (imageData: Uint8ClampedArray, width: number, height: number): string => {
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

/**
 * Creates BMP data URL for server-side environments without canvas support.
 *
 * Generates a manual BMP file structure with proper headers and pixel data
 * encoding. Essential for server-side rendering and environments without
 * canvas APIs. Uses manual base64 encoding for maximum compatibility and
 * includes comprehensive error handling with fallback data URLs.
 *
 * @param imageData - Raw RGBA pixel data as Uint8ClampedArray
 * @param width - Image width in pixels for BMP header generation
 * @param height - Image height in pixels for BMP header generation
 * @returns BMP-format data URL or transparent GIF fallback on error
 *
 * @example
 * ```tsx
 * const imageData = new Uint8ClampedArray(width * height * 4);
 * const dataUrl = createServerDataURL(imageData, 256, 256);
 * ```
 */
export const createServerDataURL = (imageData: Uint8ClampedArray, width: number, height: number): string => {
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

        const base64 = typeof btoa !== "undefined" ? btoa(binary) : encodeBase64Manual(binary);

        return `data:image/bmp;base64,${base64}`;
    } catch {
        return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    }
};
