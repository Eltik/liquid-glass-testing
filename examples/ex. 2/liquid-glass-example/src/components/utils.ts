import { type Vec2 } from "./shader-utils"

// Fragment shader functions for different displacement map types
const fragmentShaders = {
  standard: (uv: Vec2): Vec2 => {
    // Standard rectangular glass distortion with subtle edge warping
    const centerX = uv.x - 0.5
    const centerY = uv.y - 0.5
    
    // Create a rectangular lens effect with smooth falloff
    const distFromCenter = Math.sqrt(centerX * centerX + centerY * centerY)
    const lensStrength = Math.exp(-distFromCenter * 2.5) * 0.15
    
    // Apply barrel distortion pattern
    const r2 = centerX * centerX + centerY * centerY
    const distortion = 1 + r2 * lensStrength
    
    return {
      x: centerX * distortion + 0.5,
      y: centerY * distortion + 0.5
    }
  },

  polar: (uv: Vec2): Vec2 => {
    // Polar/radial displacement pattern with swirl effect
    const centerX = uv.x - 0.5
    const centerY = uv.y - 0.5
    
    // Convert to polar coordinates
    const radius = Math.sqrt(centerX * centerX + centerY * centerY)
    const angle = Math.atan2(centerY, centerX)
    
    // Create radial distortion with angular component
    const radialEffect = Math.exp(-radius * 3) * 0.2
    const angularOffset = Math.sin(angle * 3) * radialEffect * 0.3
    
    // Apply polar transformation
    const newRadius = radius * (1 + radialEffect)
    const newAngle = angle + angularOffset
    
    return {
      x: Math.cos(newAngle) * newRadius + 0.5,
      y: Math.sin(newAngle) * newRadius + 0.5
    }
  },

  prominent: (uv: Vec2): Vec2 => {
    // More prominent displacement with complex wave patterns
    const centerX = uv.x - 0.5
    const centerY = uv.y - 0.5
    
    // Create multiple wave interference patterns
    const wave1 = Math.sin(uv.x * Math.PI * 4) * Math.sin(uv.y * Math.PI * 4)
    const wave2 = Math.cos(uv.x * Math.PI * 6) * Math.cos(uv.y * Math.PI * 6)
    const wave3 = Math.sin((uv.x + uv.y) * Math.PI * 8)
    
    // Combine waves with radial falloff
    const distFromCenter = Math.sqrt(centerX * centerX + centerY * centerY)
    const falloff = Math.exp(-distFromCenter * 2)
    
    const displacement = (wave1 * 0.4 + wave2 * 0.3 + wave3 * 0.3) * falloff * 0.25
    
    return {
      x: centerX + displacement * centerX + 0.5,
      y: centerY + displacement * centerY + 0.5
    }
  }
}

// Cache for generated displacement maps to avoid regeneration
const displacementCache = new Map<string, string>()

// Pure mathematical displacement map generator that works in both browser and Node.js
const generateDisplacementMapData = (
  type: "standard" | "polar" | "prominent",
  width: number = 256,
  height: number = 256
): Uint8ClampedArray => {
  const data = new Uint8ClampedArray(width * height * 4)
  const fragment = fragmentShaders[type]
  
  let maxScale = 0
  const rawValues: number[] = []

  // Calculate displacement values
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const uv: Vec2 = { x: x / width, y: y / height }
      const pos = fragment(uv)
      const dx = pos.x * width - x
      const dy = pos.y * height - y
      maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy))
      rawValues.push(dx, dy)
    }
  }

  // Improved normalization to prevent artifacts while maintaining intensity
  if (maxScale > 0) {
    maxScale = Math.max(maxScale, 1) // Ensure minimum scale to prevent over-normalization
  } else {
    maxScale = 1
  }

  // Convert to image data with smoother normalization
  let rawIndex = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = rawValues[rawIndex++]
      const dy = rawValues[rawIndex++]

      // Smooth the displacement values at edges to prevent hard transitions
      const edgeDistance = Math.min(x, y, width - x - 1, height - y - 1)
      const edgeFactor = Math.min(1, edgeDistance / 2) // Smooth within 2 pixels of edge

      const smoothedDx = dx * edgeFactor
      const smoothedDy = dy * edgeFactor

      const r = smoothedDx / maxScale + 0.5
      const g = smoothedDy / maxScale + 0.5

      const pixelIndex = (y * width + x) * 4
      data[pixelIndex] = Math.max(0, Math.min(255, r * 255)) // Red channel (X displacement)
      data[pixelIndex + 1] = Math.max(0, Math.min(255, g * 255)) // Green channel (Y displacement)
      data[pixelIndex + 2] = Math.max(0, Math.min(255, g * 255)) // Blue channel (Y displacement for SVG filter compatibility)
      data[pixelIndex + 3] = 255 // Alpha channel
    }
  }

  return data
}

// Create canvas and convert to data URL (browser-specific)
const createCanvasDataUrl = (imageData: Uint8ClampedArray, width: number, height: number): string => {
  try {
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d")
    
    if (!context) {
      throw new Error("Could not get 2D context")
    }
    
    const imgData = context.createImageData(width, height)
    imgData.data.set(imageData)
    context.putImageData(imgData, 0, 0)
    return canvas.toDataURL()
  } catch (error) {
    console.warn("Failed to create canvas data URL:", error)
    return ""
  }
}

// Server-side compatible data URL generator using base64 encoding
const createServerDataUrl = (imageData: Uint8ClampedArray, width: number, height: number): string => {
  try {
    // Simple PNG-like header (we'll create a basic BMP format for simplicity)
    const header = new Uint8Array(54) // BMP header size
    const fileSize = 54 + imageData.length
    const imageSize = imageData.length
    
    // BMP File Header (14 bytes)
    header[0] = 0x42 // 'B'
    header[1] = 0x4D // 'M'
    header[2] = fileSize & 0xFF
    header[3] = (fileSize >> 8) & 0xFF
    header[4] = (fileSize >> 16) & 0xFF
    header[5] = (fileSize >> 24) & 0xFF
    // bytes 6-9: reserved (0)
    header[10] = 54 // offset to image data
    
    // BMP Info Header (40 bytes)
    header[14] = 40 // info header size
    header[18] = width & 0xFF
    header[19] = (width >> 8) & 0xFF
    header[20] = (width >> 16) & 0xFF
    header[21] = (width >> 24) & 0xFF
    header[22] = height & 0xFF
    header[23] = (height >> 8) & 0xFF
    header[24] = (height >> 16) & 0xFF
    header[25] = (height >> 24) & 0xFF
    header[26] = 1 // planes
    header[28] = 32 // bits per pixel
    header[34] = imageSize & 0xFF
    header[35] = (imageSize >> 8) & 0xFF
    header[36] = (imageSize >> 16) & 0xFF
    header[37] = (imageSize >> 24) & 0xFF
    
    // Combine header and image data
    const combined = new Uint8Array(header.length + imageData.length)
    combined.set(header, 0)
    combined.set(imageData, header.length)
    
    // Convert to base64
    let binary = ''
    for (let i = 0; i < combined.length; i++) {
      binary += String.fromCharCode(combined[i])
    }
    
    // Use built-in btoa if available (browser), otherwise create manually
    let base64: string
    if (typeof btoa !== 'undefined') {
      base64 = btoa(binary)
    } else {
      // Manual base64 encoding for Node.js environments
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
      let result = ''
      for (let i = 0; i < binary.length; i += 3) {
        const a = binary.charCodeAt(i)
        const b = i + 1 < binary.length ? binary.charCodeAt(i + 1) : 0
        const c = i + 2 < binary.length ? binary.charCodeAt(i + 2) : 0
        
        const group = (a << 16) | (b << 8) | c
        
        result += chars[(group >> 18) & 63]
        result += chars[(group >> 12) & 63]
        result += i + 1 < binary.length ? chars[(group >> 6) & 63] : '='
        result += i + 2 < binary.length ? chars[group & 63] : '='
      }
      base64 = result
    }
    
    return `data:image/bmp;base64,${base64}`
  } catch (error) {
    console.warn("Failed to create server data URL:", error)
    // Fallback: return a minimal data URL
    return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
  }
}

// Dynamic displacement map generator (SSR-safe)
const generateDisplacementMap = (
  type: "standard" | "polar" | "prominent",
  width: number = 256,
  height: number = 256
): string => {
  const cacheKey = `${type}-${width}-${height}`
  
  // Return cached version if available
  if (displacementCache.has(cacheKey)) {
    return displacementCache.get(cacheKey)!
  }
  
  try {
    // Generate displacement map data
    const imageData = generateDisplacementMapData(type, width, height)
    
    // Create data URL based on environment
    let dataUrl: string
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      // Browser environment - use canvas
      dataUrl = createCanvasDataUrl(imageData, width, height)
    } else {
      // Server environment - use manual base64 encoding
      dataUrl = createServerDataUrl(imageData, width, height)
    }
    
    // Cache the result
    if (dataUrl) {
      displacementCache.set(cacheKey, dataUrl)
    }
    
    return dataUrl
  } catch (error) {
    console.warn("Failed to generate displacement map:", error)
    // Return a minimal transparent image as fallback
    return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
  }
}

// Export individual displacement map getters (SSR-safe)
export const getDisplacementMap = () => generateDisplacementMap("standard")
export const getPolarDisplacementMap = () => generateDisplacementMap("polar")
export const getProminentDisplacementMap = () => generateDisplacementMap("prominent")

// Legacy exports for backward compatibility (generated on first access)
let _displacementMap: string | null = null
let _polarDisplacementMap: string | null = null
let _prominentDisplacementMap: string | null = null

const getDisplacementMapLazy = () => {
  if (_displacementMap === null) {
    _displacementMap = getDisplacementMap()
  }
  return _displacementMap
}

const getPolarDisplacementMapLazy = () => {
  if (_polarDisplacementMap === null) {
    _polarDisplacementMap = getPolarDisplacementMap()
  }
  return _polarDisplacementMap
}

const getProminentDisplacementMapLazy = () => {
  if (_prominentDisplacementMap === null) {
    _prominentDisplacementMap = getProminentDisplacementMap()
  }
  return _prominentDisplacementMap
}

// Keep original export names for compatibility
export { getDisplacementMapLazy as displacementMap }
export { getPolarDisplacementMapLazy as polarDisplacementMap }
export { getProminentDisplacementMapLazy as prominentDisplacementMap } 