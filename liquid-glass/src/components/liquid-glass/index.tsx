import { useRef, useEffect, useCallback, useState, forwardRef } from "react";
import { utils } from "./impl/utils";

interface LiquidGlassProps {
  children?: React.ReactNode;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
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

const LiquidGlass = forwardRef<HTMLDivElement, LiquidGlassProps>(
  (
    {
      children,
      width,
      height,
      className = "",
      style = {},
      padding = "24px 32px",
      cornerRadius = 20,
      displacementScale = 25,
      blurAmount = 0.25,
      saturation = 110,
      brightness = 105,
      contrast = 120,
      initialPosition,
      draggable = true,
      minWidth = 100,
      minHeight = 50,
      ...props
    },
    ref,
  ) => {
    const id = useRef(utils.generateId());
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const feImageRef = useRef<SVGFEImageElement>(null);
    const feDisplacementMapRef = useRef<SVGFEDisplacementMapElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const measureRef = useRef<HTMLDivElement>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [glassSize, setGlassSize] = useState({
      width: width ?? minWidth,
      height: height ?? minHeight,
    });
    const [position, setPosition] = useState({
      x: initialPosition?.x ?? 0,
      y: initialPosition?.y ?? 0,
      centered: !initialPosition,
    });
    const [isDragging, setIsDragging] = useState(false);
    const [contentMeasured, setContentMeasured] = useState(false);

    const canvasDPI = 1;
    const offset = 10; // Viewport boundary offset

    // Fragment shader function - creates the liquid glass distortion
    const fragmentShader = useCallback((uv: { x: number; y: number }) => {
      const ix = uv.x - 0.5;
      const iy = uv.y - 0.5;
      const distanceToEdge = utils.roundedRectSDF(ix, iy, 0.3, 0.2, 0.6);
      const displacement = utils.smoothStep(0.8, 0, distanceToEdge - 0.15);
      const scaled = utils.smoothStep(0, 1, displacement);
      return utils.texture(ix * scaled + 0.5, iy * scaled + 0.5);
    }, []);

    // Update shader displacement map
    const updateShader = useCallback(() => {
      // Skip during SSR
      if (typeof window === "undefined" || typeof document === "undefined") {
        return;
      }

      const canvas = canvasRef.current;
      const feImage = feImageRef.current;
      const feDisplacementMap = feDisplacementMapRef.current;

      if (!canvas || !feImage || !feDisplacementMap) return;

      const context = canvas.getContext("2d");
      if (!context) return;

      const w = Math.floor(glassSize.width * canvasDPI);
      const h = Math.floor(glassSize.height * canvasDPI);
      const data = new Uint8ClampedArray(w * h * 4);

      let maxScale = 0;
      const rawValues: number[] = [];

      // Generate displacement map
      for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % w;
        const y = Math.floor(i / 4 / w);
        const pos = fragmentShader({ x: x / w, y: y / h });
        const dx = pos.x * w - x;
        const dy = pos.y * h - y;
        maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy));
        rawValues.push(dx, dy);
      }

      maxScale *= 0.5;

      // Encode displacement values to RGB
      let index = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = (rawValues[index++] ?? 0) / maxScale + 0.5;
        const g = (rawValues[index++] ?? 0) / maxScale + 0.5;
        data[i] = r * 255;
        data[i + 1] = g * 255;
        data[i + 2] = 0;
        data[i + 3] = 255;
      }

      // Update canvas and SVG filter
      const imgData = context.createImageData(w, h);
      imgData.data.set(data);
      context.putImageData(imgData, 0, 0);
      if (feImage && feDisplacementMap) {
        feImage.setAttributeNS(
          "http://www.w3.org/1999/xlink",
          "href",
          canvas.toDataURL(),
        );
        feDisplacementMap.setAttribute(
          "scale",
          (displacementScale / canvasDPI).toString(),
        );
      }
    }, [
      glassSize.width,
      glassSize.height,
      fragmentShader,
      canvasDPI,
      displacementScale,
    ]);

    // Parse padding values to get numeric values
    const getPaddingValues = useCallback(
      (
        paddingStr: string,
      ): { top: number; right: number; bottom: number; left: number } => {
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
      },
      [],
    );

    // Update glass size based on content
    const updateGlassSize = useCallback(() => {
      if (!measureRef.current || !children) return;

      // Wait for next frame to ensure content is rendered
      requestAnimationFrame(() => {
        if (!measureRef.current) return;

        const contentRect = measureRef.current.getBoundingClientRect();
        const paddingValues = getPaddingValues(padding);

        // If width/height are explicitly provided, use them
        if (width && height) {
          const newSize = { width, height };
          if (
            newSize.width !== glassSize.width ||
            newSize.height !== glassSize.height
          ) {
            setGlassSize(newSize);
          }
          return;
        }

        // Calculate size based on content + padding
        const contentWidth = contentRect.width;
        const contentHeight = contentRect.height;

        const totalWidth =
          contentWidth + paddingValues.left + paddingValues.right;
        const totalHeight =
          contentHeight + paddingValues.top + paddingValues.bottom;

        const newWidth = width ?? Math.max(totalWidth, minWidth);
        const newHeight = height ?? Math.max(totalHeight, minHeight);

        if (
          Math.abs(newWidth - glassSize.width) > 1 ||
          Math.abs(newHeight - glassSize.height) > 1
        ) {
          setGlassSize({ width: newWidth, height: newHeight });
          setContentMeasured(true);
        }
      });
    }, [
      width,
      height,
      glassSize.width,
      glassSize.height,
      padding,
      children,
      minWidth,
      minHeight,
      getPaddingValues,
    ]);

    // Constrain position within viewport bounds
    const constrainPosition = useCallback(
      (x: number, y: number) => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const minX = offset;
        const maxX = viewportWidth - glassSize.width - offset;
        const minY = offset;
        const maxY = viewportHeight - glassSize.height - offset;

        const constrainedX = Math.max(minX, Math.min(maxX, x));
        const constrainedY = Math.max(minY, Math.min(maxY, y));

        return { x: constrainedX, y: constrainedY };
      },
      [glassSize.width, glassSize.height, offset],
    );

    // Handle drag functionality
    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (!draggable) return;

        // Prevent dragging if user is interacting with form controls
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "BUTTON" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT"
        ) {
          return;
        }

        // Also check if the target is inside a form control
        if (target.closest("input, button, textarea, select")) {
          return;
        }

        setIsDragging(true);
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const initialX = rect.left;
        const initialY = rect.top;

        const handleDragMove = (e: MouseEvent) => {
          const deltaX = e.clientX - startX;
          const deltaY = e.clientY - startY;

          const newX = initialX + deltaX;
          const newY = initialY + deltaY;

          const constrained = constrainPosition(newX, newY);

          setPosition({
            x: constrained.x,
            y: constrained.y,
            centered: false,
          });
        };

        const handleDragEnd = () => {
          setIsDragging(false);
          document.removeEventListener("mousemove", handleDragMove);
          document.removeEventListener("mouseup", handleDragEnd);
        };

        document.addEventListener("mousemove", handleDragMove);
        document.addEventListener("mouseup", handleDragEnd);

        e.preventDefault();
      },
      [draggable, constrainPosition],
    );

    // Setup canvas and initial shader update
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = Math.floor(glassSize.width * canvasDPI);
      canvas.height = Math.floor(glassSize.height * canvasDPI);

      updateShader();
    }, [glassSize.width, glassSize.height, canvasDPI, updateShader]);

    // Update glass size when width/height props change
    useEffect(() => {
      if (width && height) {
        setGlassSize({ width, height });
      } else {
        updateGlassSize();
      }
    }, [width, height, updateGlassSize]);

    // Initial size measurement
    useEffect(() => {
      if (children && !contentMeasured) {
        // Delay initial measurement to ensure DOM is ready
        const timeout = setTimeout(() => {
          updateGlassSize();
        }, 0);

        return () => clearTimeout(timeout);
      }
    }, [children, contentMeasured, updateGlassSize]);

    // Set up ResizeObserver for content changes
    useEffect(() => {
      if (!measureRef.current || !children) return;

      if ("ResizeObserver" in window) {
        const resizeObserver = new ResizeObserver(() => {
          // Debounce updates to avoid excessive recalculations
          if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
          }
          resizeTimeoutRef.current = setTimeout(() => {
            updateGlassSize();
          }, 16); // ~60fps
        });

        resizeObserver.observe(measureRef.current);

        return () => {
          if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
          }
          resizeObserver.disconnect();
        };
      }

      // Fallback for browsers without ResizeObserver
      const interval = setInterval(updateGlassSize, 100);
      return () => clearInterval(interval);
    }, [updateGlassSize, children]);

    // Handle window resize to maintain constraints
    useEffect(() => {
      const handleResize = () => {
        if (!position.centered) {
          const constrained = constrainPosition(position.x, position.y);
          if (position.x !== constrained.x || position.y !== constrained.y) {
            setPosition({
              x: constrained.x,
              y: constrained.y,
              centered: false,
            });
          }
        }
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [position, constrainPosition]);

    const containerStyle: React.CSSProperties = {
      width: glassSize.width,
      height: glassSize.height,
      overflow: "hidden",
      borderRadius: `${cornerRadius}px`,
      boxShadow:
        "0 4px 8px rgba(0, 0, 0, 0.25), 0 -10px 25px inset rgba(0, 0, 0, 0.15)",
      cursor: draggable ? (isDragging ? "grabbing" : "grab") : "default",
      backdropFilter: `url(#${id.current}_filter) blur(${blurAmount}px) contrast(${contrast}%) brightness(${brightness}%) saturate(${saturation}%)`,
      pointerEvents: "auto",
      ...(position.centered
        ? {
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9999,
          }
        : {
            position: "fixed",
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: "none",
            zIndex: 9999,
          }),
      ...style,
    };

    const contentStyle: React.CSSProperties = {
      padding,
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    };

    // Invisible measuring div that sizes naturally to content
    const measureStyle: React.CSSProperties = {
      position: "absolute",
      visibility: "hidden",
      pointerEvents: "none",
      top: "-9999px",
      left: "-9999px",
      whiteSpace: "nowrap",
      display: "inline-block",
    };

    return (
      <>
        {/* Hidden measuring div for natural content sizing */}
        {children && !width && !height && (
          <div ref={measureRef} style={measureStyle}>
            {children}
          </div>
        )}

        {/* Hidden canvas for displacement map generation */}
        <canvas
          ref={canvasRef}
          style={{ display: "none" }}
          width={Math.floor(glassSize.width * canvasDPI)}
          height={Math.floor(glassSize.height * canvasDPI)}
        />

        {/* SVG filter definition */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="0"
          height="0"
          className="pointer-events-none fixed top-0 left-0 z-[9998]"
        >
          <defs>
            <filter
              id={`${id.current}_filter`}
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
              x="0"
              y="0"
              width={glassSize.width.toString()}
              height={glassSize.height.toString()}
            >
              <feImage
                ref={feImageRef}
                id={`${id.current}_map`}
                width={glassSize.width.toString()}
                height={glassSize.height.toString()}
              />
              <feDisplacementMap
                ref={feDisplacementMapRef}
                in="SourceGraphic"
                in2={`${id.current}_map`}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>

        {/* Liquid glass container with content */}
        <div
          ref={(el) => {
            containerRef.current = el;
            if (typeof ref === "function") {
              ref(el);
            } else if (ref) {
              ref.current = el;
            }
          }}
          className={`${className}`}
          style={containerStyle}
          onMouseDown={handleMouseDown}
          {...props}
        >
          <div ref={contentRef} style={contentStyle}>
            {children}
          </div>
        </div>
      </>
    );
  },
);

LiquidGlass.displayName = "LiquidGlass";

export default LiquidGlass;
