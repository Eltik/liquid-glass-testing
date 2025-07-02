import { useRef, useEffect, useCallback, forwardRef } from "react";
import { utils } from "./utils";
import { useGlassBehavior } from "./utils/impl/use-glass-behavior";
import type { LiquidGlassProps } from "../types";

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
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const feImageRef = useRef<SVGFEImageElement>(null);
    const feDisplacementMapRef = useRef<SVGFEDisplacementMapElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Use shared glass behavior hook
    const {
      glassSize,
      position,
      isDragging,
      measureRef,
      containerRef,
      measureStyle,
      handleMouseDown,
    } = useGlassBehavior({
      width,
      height,
      padding,
      initialPosition,
      draggable,
      minWidth,
      minHeight,
      children,
    });

    const canvasDPI = 1;

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

    // Setup canvas and initial shader update
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = Math.floor(glassSize.width * canvasDPI);
      canvas.height = Math.floor(glassSize.height * canvasDPI);

      updateShader();
    }, [glassSize.width, glassSize.height, canvasDPI, updateShader]);

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
            transform: "translate3d(calc(50vw - 50%), calc(50vh - 50%), 0)",
            zIndex: 9999,
          }
        : {
            position: "fixed",
            transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
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
          className="pointer-events-none fixed z-[9998]"
          style={{ transform: "translate3d(0, 0, 0)" }}
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
