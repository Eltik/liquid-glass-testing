import { useEffect, useRef, useCallback } from "react";
import { getGlobalShaderInstance } from "../../shaders/optimized-webgl-shader";

interface WebGLGlassFilterProps {
    width: number;
    height: number;
    mode: "standard" | "polar" | "prominent";
    displacementScale: number;
    aberrationIntensity: number;
    cornerRadius?: number;
    children: React.ReactNode;
}

export function WebGLGlassFilter({ 
    width, 
    height, 
    mode, 
    displacementScale, 
    aberrationIntensity, 
    cornerRadius = 20,
    children 
}: WebGLGlassFilterProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const sourceTexture = useRef<WebGLTexture | null>(null);
    const animationFrame = useRef<number | null>(null);

    // Create texture from the content DOM element
    const createSourceTexture = useCallback(() => {
        if (!containerRef.current) return null;
        
        try {
            const shader = getGlobalShaderInstance();
            
            // Create a temporary canvas to render the DOM content
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');
            
            if (!tempCtx) return null;
            
            // Use html2canvas or similar technique to capture DOM content
            // For now, we'll use a simple approach with canvas drawing
            tempCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            tempCtx.fillRect(0, 0, width, height);
            
            // Create WebGL texture from canvas
            const texture = shader.createTextureFromElement(tempCanvas);
            return texture;
        } catch (error) {
            console.error('Failed to create source texture:', error);
            return null;
        }
    }, [width, height]);

    // Render the WebGL effect
    const renderEffect = useCallback(() => {
        if (!canvasRef.current || !sourceTexture.current) return;
        
        try {
            const shader = getGlobalShaderInstance();
            const canvas = canvasRef.current;
            
            // Update canvas size if needed
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
            }
            
            // Render the liquid glass effect directly to canvas
            shader.renderDirectToCanvas({
                mode,
                displacementScale: displacementScale * 0.01, // Scale down for better visual effect
                aberrationIntensity: aberrationIntensity * 0.1,
                sourceTexture: sourceTexture.current
            });
        } catch (error) {
            console.error('WebGL rendering error:', error);
        }
    }, [width, height, mode, displacementScale, aberrationIntensity]);

    // Animation loop for smooth rendering
    const animate = useCallback(() => {
        renderEffect();
        animationFrame.current = requestAnimationFrame(animate);
    }, [renderEffect]);

    // Initialize WebGL effect
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;
        
        // Create source texture from content
        const texture = createSourceTexture();
        if (texture) {
            sourceTexture.current = texture;
            
            // Start animation loop
            animate();
        }
        
        return () => {
            if (animationFrame.current) {
                cancelAnimationFrame(animationFrame.current);
            }
            
            // Clean up texture
            if (sourceTexture.current) {
                const shader = getGlobalShaderInstance();
                const gl = shader.gl;
                gl.deleteTexture(sourceTexture.current);
                sourceTexture.current = null;
            }
        };
    }, [animate, createSourceTexture]);

    // Update effect when parameters change
    useEffect(() => {
        renderEffect();
    }, [renderEffect]);

    return (
        <div className="relative" style={{ width, height }}>
            {/* Content container - hidden behind WebGL canvas */}
            <div 
                ref={containerRef}
                className="absolute inset-0 opacity-0 pointer-events-none"
                style={{ 
                    borderRadius: cornerRadius,
                    transform: "translate3d(0, 0, 0)" 
                }}
            >
                {children}
            </div>
            
            {/* WebGL canvas for liquid glass effect */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: cornerRadius,
                    transform: "translate3d(0, 0, 0)"
                }}
                width={width}
                height={height}
            />
        </div>
    );
}