/**
 * WebGL Texture and Gaussian Blur Utilities
 * 
 * This module provides essential utilities for the liquid glass effect:
 * - Texture loading from URLs with cross-origin support
 * - Video texture creation and updating
 * - Gaussian blur kernel computation for realistic blur effects
 * 
 * These utilities handle the complex WebGL texture management required
 * for high-quality visual effects while maintaining performance.
 */

/**
 * Load a texture from a URL with proper WebGL configuration
 * 
 * This function handles the complete texture loading pipeline:
 * 1. Creates and configures an Image element with cross-origin support
 * 2. Uploads the image data to GPU as a WebGL texture
 * 3. Generates mipmaps for smooth scaling at different distances
 * 4. Configures texture filtering and wrapping for high-quality rendering
 * 
 * @param gl - WebGL2 rendering context
 * @param url - Image URL to load
 * @returns Promise resolving to texture and aspect ratio
 */
export function loadTextureFromURL(gl: WebGL2RenderingContext, url: string): Promise<{ texture: WebGLTexture; ratio: number }> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        // Enable cross-origin loading for external images
        image.crossOrigin = "";

        image.onload = () => {
            const texture = gl.createTexture();
            if (!texture) return reject(new Error("Failed to create texture"));

            gl.bindTexture(gl.TEXTURE_2D, texture);
            // Flip Y coordinate to match WebGL coordinate system
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            // Upload image data to GPU
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            // Generate mipmaps for smooth scaling
            gl.generateMipmap(gl.TEXTURE_2D);

            // Configure texture filtering for high quality
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            // Clamp texture coordinates to prevent wrapping
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            resolve({ texture, ratio: image.naturalWidth / image.naturalHeight });
        };

        image.onerror = reject;
        image.src = url;
    });
}

/**
 * Create an empty WebGL texture for later content updates
 * 
 * This function creates a texture with proper filtering and wrapping settings
 * but without initial image data. It's designed for dynamic content like video
 * frames that will be updated frequently.
 * 
 * The texture is configured for:
 * - Linear filtering with mipmaps for smooth scaling
 * - Clamped edges to prevent texture wrapping artifacts
 * - Ready for dynamic content updates via texImage2D
 * 
 * @param gl - WebGL2 rendering context
 * @returns Empty WebGL texture ready for content updates
 */
export function createEmptyTexture(gl: WebGL2RenderingContext): WebGLTexture {
    const texture = gl.createTexture();
    if (!texture) throw new Error("Failed to create texture");

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // Texture is left empty - content will be added later via updateVideoTexture

    return texture;
}

/**
 * Update a WebGL texture with the current video frame
 * 
 * This function efficiently updates a texture with video content by:
 * 1. Checking if video has current frame data available
 * 2. Calculating the video aspect ratio for proper scaling
 * 3. Uploading the current video frame to GPU memory
 * 4. Regenerating mipmaps for smooth scaling
 * 
 * The function is designed to be called every frame but will return early
 * if video data isn't ready, preventing unnecessary GPU operations.
 * 
 * @param gl - WebGL2 rendering context
 * @param texture - Target texture to update
 * @param video - HTML video element source
 * @returns Object containing video aspect ratio, or undefined if no update
 */
export function updateVideoTexture(gl: WebGL2RenderingContext, texture: WebGLTexture, video: HTMLVideoElement) {
    // Only update if video has current frame data
    if (video.readyState < video.HAVE_CURRENT_DATA) return;

    // Calculate aspect ratio with fallback for edge cases
    let ratio = video.videoWidth / video.videoHeight;
    if (isNaN(ratio)) {
        ratio = 1;
    }
    
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Flip Y coordinate to match WebGL coordinate system
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    // Upload current video frame to GPU
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, video.videoWidth, video.videoHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, video);
    // Regenerate mipmaps for the new frame
    gl.generateMipmap(gl.TEXTURE_2D);

    return {
        ratio: ratio,
    };
}

/**
 * Compute a Gaussian blur kernel for the specified radius
 * 
 * This function generates the weights for a Gaussian blur effect using the
 * mathematical Gaussian distribution. The kernel is essential for creating
 * realistic blur effects in the liquid glass component.
 * 
 * The algorithm:
 * 1. Calculates sigma (standard deviation) from the blur radius
 * 2. Generates weights using the Gaussian function: e^(-x²/2σ²)
 * 3. Normalizes weights so they sum to 1 (preserves brightness)
 * 
 * The resulting kernel is used in the blur shaders to sample surrounding
 * pixels with appropriate weights, creating a smooth, natural blur effect.
 * 
 * @param radius - Blur radius in pixels
 * @returns Array of normalized Gaussian weights
 */
export function computeGaussianKernelByRadius(radius: number) {
    // Standard deviation derived from radius (3-sigma rule)
    const sigma = radius / 3.0;
    const kernel = [];
    let sum = 0;
    
    // Generate weights for radius + center pixel
    for (let i = 0; i <= radius; i++) {
        // Gaussian function: e^(-x²/2σ²)
        const weight = Math.exp((-0.5 * (i * i)) / (sigma * sigma));
        kernel.push(weight);
        // Center pixel contributes once, others contribute twice (positive and negative offset)
        sum += i === 0 ? weight : weight * 2;
    }
    
    // Normalize weights to maintain brightness
    return kernel.map((w) => w / sum);
}
